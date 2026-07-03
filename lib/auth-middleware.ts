import { cookies } from 'next/headers'
import { db } from './db'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value
  if (!token) return null

  // Ensure data is loaded from Supabase
  await db.load()

  // Find session by token
  const session = Array.from(db.sessions.values()).find((s: any) => s.token === token)
  if (!session) return null

  // Find user by userId
  const user = db.users.get(session.userId)
  if (!user) return null

  return user
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
