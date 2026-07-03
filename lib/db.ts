import fs from 'fs'
import path from 'path'

// Determine writable path at runtime: /tmp first, fallback to project dir
function getDbFilePath(): string {
  const tmpPath = '/tmp/knowledge-db.json'
  const projectPath = path.join(process.cwd(), 'knowledge-db.json')

  // Prefer /tmp (writable in serverless environments)
  if (fs.existsSync('/tmp')) {
    return tmpPath
  }
  return projectPath
}

const DB_PATH = getDbFilePath()

interface DbCollection<T = any> extends Map<string, T> {
  _array: T[]
}

interface DbData {
  users: Record<string, any>[]
  sessions: Record<string, any>[]
  nodes: Record<string, any>[]
  contents: Record<string, any>[]
  edges: Record<string, any>[]
  dailySummaries: Record<string, any>[]
  attachments: Record<string, any>[]
}

function createCollection<T>(data: T[]): DbCollection<T> {
  const map = new Map<string, T>() as DbCollection<T>
  for (const item of data) {
    map.set((item as any).id, item)
  }
  return map
}

function toRecords<T>(map: DbCollection<T>): T[] {
  return Array.from(map.values())
}

function loadData(): DbData {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {
    // Corrupted file, start fresh
  }
  return {
    users: [],
    sessions: [],
    nodes: [],
    contents: [],
    edges: [],
    dailySummaries: [],
    attachments: [],
  }
}

function saveData(data: DbData): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save database:', e)
  }
}

let rawData = loadData()

export const db = {
  users: createCollection(rawData.users),
  sessions: createCollection(rawData.sessions),
  nodes: createCollection(rawData.nodes),
  contents: createCollection(rawData.contents),
  edges: createCollection(rawData.edges),
  dailySummaries: createCollection(rawData.dailySummaries),
  attachments: createCollection(rawData.attachments),

  save() {
    const data: DbData = {
      users: toRecords(this.users),
      sessions: toRecords(this.sessions),
      nodes: toRecords(this.nodes),
      contents: toRecords(this.contents),
      edges: toRecords(this.edges),
      dailySummaries: toRecords(this.dailySummaries),
      attachments: toRecords(this.attachments),
    }
    saveData(data)
  },

  reload() {
    rawData = loadData()
    this.users = createCollection(rawData.users)
    this.sessions = createCollection(rawData.sessions)
    this.nodes = createCollection(rawData.nodes)
    this.contents = createCollection(rawData.contents)
    this.edges = createCollection(rawData.edges)
    this.dailySummaries = createCollection(rawData.dailySummaries)
    this.attachments = createCollection(rawData.attachments)
  },
}

// Periodically save to disk every 30 seconds
if (typeof globalThis !== 'undefined' && typeof setInterval === 'function') {
  setInterval(() => {
    db.save()
  }, 30_000)
}
