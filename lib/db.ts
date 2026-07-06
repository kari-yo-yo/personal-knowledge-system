import { getData, setData, deleteData } from './kv'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Collection names in KV
// ---------------------------------------------------------------------------

const COLLECTIONS = {
  users: 'db:users',
  sessions: 'db:sessions',
  nodes: 'db:nodes',
  contents: 'db:contents',
  edges: 'db:edges',
  dailySummaries: 'db:daily_summaries',
  attachments: 'db:attachments',
  preferences: 'db:user_preferences',
} as const

const VERSION_KEY = 'db:version'

// ---------------------------------------------------------------------------
// In-memory cache (Map interface, same as before)
// ---------------------------------------------------------------------------

interface DbCollection<T = any> extends Map<string, T> {
  _array: T[]
}

function createCollection<T>(): DbCollection<T> {
  const map = new Map<string, T>() as DbCollection<T>
  Object.defineProperty(map, '_array', {
    get() {
      return Array.from(map.values())
    },
    enumerable: true,
  })
  return map
}

// ---------------------------------------------------------------------------
// DB object
// ---------------------------------------------------------------------------

const collections = {
  users: createCollection<any>(),
  sessions: createCollection<any>(),
  nodes: createCollection<any>(),
  contents: createCollection<any>(),
  edges: createCollection<any>(),
  dailySummaries: createCollection<any>(),
  attachments: createCollection<any>(),
  preferences: createCollection<any>(),
}

let loaded = false
let loadingPromise: Promise<void> | null = null
let memoryVersion = 0
let saveLock: Promise<void> | null = null
let saveQueue: (() => void)[] = []

async function acquireSaveLock(): Promise<() => void> {
  while (saveLock) {
    await saveLock
  }
  let release!: () => void
  saveLock = new Promise<void>((resolve) => {
    release = () => {
      saveLock = null
      // Process queued waiters
      const next = saveQueue.shift()
      if (next) next()
      resolve()
    }
  })
  return release
}

async function getKVVersion(): Promise<number> {
  try {
    const v = await getData<number>(VERSION_KEY)
    return v || 0
  } catch {
    return 0
  }
}

async function setKVVersion(): Promise<void> {
  const v = Date.now()
  memoryVersion = v
  await setData(VERSION_KEY, v)
}

async function ensureLoaded(forceRefresh = false): Promise<void> {
  if (!forceRefresh && loaded) {
    // Even if loaded, check if KV version has changed (another instance wrote data)
    try {
      const kvVersion = await getKVVersion()
      if (kvVersion > memoryVersion) {
        console.log(`[db] Version mismatch detected: memory=${memoryVersion}, kv=${kvVersion}, reloading...`)
        loaded = false
      }
    } catch {
      // Ignore version check errors
    }
  }

  if (loaded && !forceRefresh) return
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    try {
      const keys = Object.keys(COLLECTIONS) as Array<keyof typeof COLLECTIONS>
      const results = await Promise.all(
        keys.map((k) => getData<Record<string, any>>(COLLECTIONS[k]))
      )

      for (let i = 0; i < keys.length; i++) {
        const col = collections[keys[i]] as Map<string, any>
        col.clear()
        const data = results[i]
        if (data) {
          for (const [id, record] of Object.entries(data)) {
            col.set(id, record)
          }
        }
      }

      // Sync version from KV
      try {
        const kvVersion = await getKVVersion()
        memoryVersion = kvVersion
      } catch {
        memoryVersion = 0
      }

      loaded = true

      // Initialize default data if empty
      if (collections.users.size === 0) {
        await initDefaultData()
      }

      console.log(
        `[db] KV loaded: ${collections.users.size} users, ${collections.sessions.size} sessions, ${collections.nodes.size} nodes, ${collections.contents.size} contents (version=${memoryVersion})`
      )
    } catch (error) {
      console.error('[db] Failed to load from KV:', error)
      loaded = true // Don't block forever
      if (collections.users.size === 0) {
        await initDefaultData()
      }
    } finally {
      loadingPromise = null
    }
  })()

  return loadingPromise
}

// ---------------------------------------------------------------------------
// Initialize default data (no-login mode)
// ---------------------------------------------------------------------------

async function initDefaultData(): Promise<void> {
  const now = new Date().toISOString()
  const userId = 'default-user'

  // Default user
  collections.users.set(userId, {
    id: userId,
    username: '我',
    password: '',
    email: '',
    securityQuestion: '',
    securityAnswer: '',
    createdAt: now,
  })

  // Create knowledge tree
  const rootId = crypto.randomUUID()
  collections.nodes.set(rootId, {
    id: rootId,
    name: '个人成长总系统',
    type: 'ROOT',
    color: '#4a90d9',
    parentId: null,
    sortOrder: 0,
    userId,
    createdAt: now,
    updatedAt: now,
  })

  const systems = [
    { name: '学习系统', color: '#4a90d9', subs: ['知识系统', '方法系统', '防漏系统', '改错系统', '不足之处/可优化'] },
    { name: '性格系统', color: '#34a853', subs: ['性格认知系统', '不足之处系统'] },
    { name: '人际交往系统', color: '#fbbc04', subs: ['人际交往能力认知', '不足之处系统', '方法系统'] },
    { name: '安全系统', color: '#ea4335', subs: ['车辆使用常识系统'] },
    { name: '目标愿望系统', color: '#9c27b0', subs: ['目标管理', '愿望追踪'] },
    { name: '灵感系统', color: '#ff9800', subs: ['随手记录', '灵感归档'] },
  ]

  for (const sys of systems) {
    const systemNodeId = crypto.randomUUID()
    collections.nodes.set(systemNodeId, {
      id: systemNodeId,
      name: sys.name,
      type: 'SYSTEM',
      parentId: rootId,
      color: sys.color,
      sortOrder: 0,
      userId,
      createdAt: now,
      updatedAt: now,
    })

    for (const sub of sys.subs) {
      const subId = crypto.randomUUID()
      collections.nodes.set(subId, {
        id: subId,
        name: sub,
        type: 'SUBSYSTEM',
        parentId: systemNodeId,
        color: sys.color,
        sortOrder: 0,
        userId,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  await db.save()
  console.log('[db] Default data initialized')
}

// ---------------------------------------------------------------------------
// Cache-Control headers for API responses
// ---------------------------------------------------------------------------

export const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
}

// ---------------------------------------------------------------------------
// Public db object (Map-compatible interface for all existing API routes)
// ---------------------------------------------------------------------------

export const db = {
  // Direct map references (same interface as before)
  get users(): DbCollection<any> { return collections.users },
  get sessions(): DbCollection<any> { return collections.sessions },
  get nodes(): DbCollection<any> { return collections.nodes },
  get contents(): DbCollection<any> { return collections.contents },
  get edges(): DbCollection<any> { return collections.edges },
  get dailySummaries(): DbCollection<any> { return collections.dailySummaries },
  get attachments(): DbCollection<any> { return collections.attachments },
  get preferences(): DbCollection<any> { return collections.preferences },

  // Core methods
  async load(forceRefresh = false): Promise<void> {
    await ensureLoaded(forceRefresh)
  },

  async save(): Promise<void> {
    const release = await acquireSaveLock()
    try {
      const keys = Object.keys(COLLECTIONS) as Array<keyof typeof COLLECTIONS>
      const toSave = keys.map((k) => {
        const col = collections[k] as Map<string, any>
        return Object.fromEntries(col)
      })

      // Write all collections and version atomically
      await Promise.all([
        ...keys.map((k, i) => setData(COLLECTIONS[k], toSave[i])),
        setKVVersion(),
      ])

      // Verify save by reading back
      try {
        const verifyKey = COLLECTIONS.contents
        const verifyData = await getData<Record<string, any>>(verifyKey)
        const inMemoryCount = collections.contents.size
        const onDiskCount = verifyData ? Object.keys(verifyData).length : 0
        console.log(`[db] Save verification: contents in-memory=${inMemoryCount}, on-disk=${onDiskCount}`)
        if (inMemoryCount > 0 && onDiskCount === 0) {
          console.error('[db] Save verification FAILED: in-memory data exists but KV returned empty')
        }
      } catch (verifyError) {
        console.error('[db] Save verification read-back failed:', verifyError)
      }

      console.log(`[db] Saved to KV (version=${memoryVersion})`)
    } catch (error) {
      console.error('[db] Failed to save to KV:', error)
      throw error // Re-throw so callers know save failed
    } finally {
      release()
    }
  },

  async reload(): Promise<void> {
    loaded = false
    await ensureLoaded(true)
  },

  isLoaded(): boolean {
    return loaded
  },

  getVersion(): number {
    return memoryVersion
  },
}

// Auto-save every 20 seconds
if (typeof globalThis !== 'undefined' && typeof setInterval === 'function') {
  setInterval(() => {
    if (loaded) {
      db.save().catch((err) => console.error('[db] Auto-save failed:', err))
    }
  }, 20_000)
}
