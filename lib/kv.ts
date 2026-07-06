import { createClient, RedisClientType } from 'redis'

let client: RedisClientType | null = null

function getClient(): RedisClientType {
  if (!client) {
    const url = process.env.REDIS_URL || process.env.KV_URL || ''
    if (!url) {
      throw new Error('No Redis URL configured. Please set REDIS_URL environment variable.')
    }
    client = createClient({ url })
    client.on('error', (err) => console.error('[redis] error:', err))
    client.connect().catch((err) => console.error('[redis] connect error:', err))
  }
  return client
}

// ---------------------------------------------------------------------------
// KV helper wrappers
// ---------------------------------------------------------------------------

export async function getData<T>(key: string): Promise<T | null> {
  try {
    const c = getClient()
    const data = await c.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (error) {
    console.error(`[kv] get error [${key}]:`, error)
    return null
  }
}

export async function setData<T>(key: string, value: T, ttl?: number): Promise<void> {
  try {
    const c = getClient()
    const serialized = JSON.stringify(value)
    if (ttl) {
      await c.setEx(key, ttl, serialized)
    } else {
      await c.set(key, serialized)
    }
  } catch (error) {
    console.error(`[kv] set error [${key}]:`, error)
  }
}

export async function deleteData(key: string): Promise<void> {
  try {
    const c = getClient()
    await c.del(key)
  } catch (error) {
    console.error(`[kv] delete error [${key}]:`, error)
  }
}
