import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Supabase connection
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isConfigured = !!(supabaseUrl && supabaseKey)

let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}

// ---------------------------------------------------------------------------
// Collection wrapper – lazy-loads from Supabase, keeps in-memory Map
// ---------------------------------------------------------------------------

interface DbCollection<T = any> extends Map<string, T> {
  _array: T[]
}

function createSupabaseCollection<T extends Record<string, any> = any>(
  tableName: string,
  fallback: DbCollection<T>,
): DbCollection<T> {
  const cache = new Map<string, T>()
  let loaded = false
  let loadingPromise: Promise<void> | null = null

  async function ensureLoaded(): Promise<void> {
    if (loaded) return
    if (loadingPromise) return loadingPromise
    if (!isConfigured) { loaded = true; return }

    loadingPromise = (async () => {
      try {
        const client = getSupabase()
        const { data, error } = await client.from(tableName).select('*')
        if (!error && data) {
          cache.clear()
          for (const row of data) {
            cache.set(row.id, row as T)
          }
        }
        if (error) {
          console.error(`[db] Failed to load ${tableName}:`, error)
        }
      } catch (e) {
        console.error(`[db] Error loading ${tableName}:`, e)
      } finally {
        loaded = true
        loadingPromise = null
      }
    })()

    return loadingPromise
  }

  const collection = new Map<string, T>() as DbCollection<T>

  collection.get = function (key: string): T | undefined {
    return cache.get(key)
  }
  collection.set = function (key: string, value: T): DbCollection<T> {
    cache.set(key, value)
    return collection
  }
  collection.delete = function (key: string): boolean {
    return cache.delete(key)
  }
  collection.has = function (key: string): boolean {
    return cache.has(key)
  }
  collection.clear = function (): void {
    cache.clear()
  }
  collection.keys = function (): MapIterator<string> {
    return cache.keys()
  }
  collection.values = function (): MapIterator<T> {
    return cache.values()
  }
  collection.entries = function (): MapIterator<[string, T]> {
    return cache.entries()
  }
  collection.forEach = function (
    cb: (value: T, key: string, map: Map<string, T>) => void,
  ): void {
    cache.forEach(cb)
  }
  Object.defineProperty(collection, 'size', {
    get() {
      return cache.size
    },
    enumerable: true,
  })

  Object.defineProperty(collection, '_array', {
    get() {
      return Array.from(cache.values())
    },
    enumerable: true,
  })

  ;(collection as any)._ensureLoaded = ensureLoaded
  ;(collection as any)._saveAll = async function saveAll(): Promise<void> {
    if (!isConfigured) return
    const client = getSupabase()
    const records = Array.from(cache.values())
    if (records.length === 0) return
    const { error } = await client
      .from(tableName)
      .upsert(records as any[], { onConflict: 'id' })
    if (error) {
      console.error(`[db] Failed to save ${tableName}:`, error)
    }
  }

  collection[Symbol.iterator] = function* (): MapIterator<[string, T]> {
    yield* cache.entries()
  }

  return collection
}

// ---------------------------------------------------------------------------
// Fallback: empty JSON-file-based collection
// ---------------------------------------------------------------------------

function createEmptyCollection<T>(): DbCollection<T> {
  const map = new Map<string, T>() as DbCollection<T>
  Object.defineProperty(map, '_array', {
    get() {
      return Array.from(map.values())
    },
    enumerable: true,
  })
  ;(map as any)._ensureLoaded = async () => {}
  ;(map as any)._saveAll = async () => {}
  return map
}

// ---------------------------------------------------------------------------
// Database object
// ---------------------------------------------------------------------------

export const db = {
  users: createSupabaseCollection('users', createEmptyCollection<any>()),
  sessions: createSupabaseCollection('sessions', createEmptyCollection<any>()),
  nodes: createSupabaseCollection('nodes', createEmptyCollection<any>()),
  contents: createSupabaseCollection('contents', createEmptyCollection<any>()),
  edges: createSupabaseCollection('edges', createEmptyCollection<any>()),
  dailySummaries: createSupabaseCollection('daily_summaries', createEmptyCollection<any>()),
  attachments: createSupabaseCollection('attachments', createEmptyCollection<any>()),
  preferences: createSupabaseCollection('user_preferences', createEmptyCollection<any>()),

  async save(): Promise<void> {
    const collections = [
      this.users,
      this.sessions,
      this.nodes,
      this.contents,
      this.edges,
      this.dailySummaries,
      this.attachments,
      this.preferences,
    ] as any[]
    await Promise.all(collections.map((c) => c._saveAll()))
  },

  async reload(): Promise<void> {
    const collections = [
      this.users,
      this.sessions,
      this.nodes,
      this.contents,
      this.edges,
      this.dailySummaries,
      this.attachments,
      this.preferences,
    ] as any[]
    for (const c of collections) {
      c.clear()
      ;(c as any)._ensureLoaded = null
    }
    // Re-create ensureLoaded by marking as not loaded
    // We do this by creating new collections - but that's complex
    // Instead, let's just force load
    if (isConfigured) {
      await Promise.all(collections.map((c) => c._ensureLoaded()))
    }
  },

  async load(): Promise<void> {
    const collections = [
      this.users,
      this.sessions,
      this.nodes,
      this.contents,
      this.edges,
      this.dailySummaries,
      this.attachments,
      this.preferences,
    ] as any[]
    await Promise.all(collections.map((c) => c._ensureLoaded()))
  },
}

// Periodically save to Supabase every 30 seconds
if (typeof globalThis !== 'undefined' && typeof setInterval === 'function') {
  setInterval(() => {
    db.save()
  }, 30_000)
}
