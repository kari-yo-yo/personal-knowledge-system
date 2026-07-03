import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    // Ensure data is loaded from Supabase before querying
    await db.load()

    // Find user by username
    const user = Array.from(db.users.values()).find((u: any) => u.username === username.trim())
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const valid = verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // Delete old sessions for this user
    for (const [sessionId, session] of db.sessions.entries()) {
      if ((session as any).userId === user.id) {
        db.sessions.delete(sessionId)
      }
    }

    // Create new session
    const token = generateToken()
    const sessionId = crypto.randomUUID()
    const session = {
      id: sessionId,
      userId: user.id,
      token,
      createdAt: new Date().toISOString(),
    }
    db.sessions.set(sessionId, session)

    await db.save()

    const response = NextResponse.json({
      user: { id: user.id, username: user.username },
      token,
    })

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (error: any) {
    const msg = error?.message || 'Internal server error'
    return NextResponse.json({
      error: msg.includes('database') || msg.includes('EACCES') || msg.includes('ENOENT')
        ? '系统暂时无法使用，请稍后重试'
        : msg
    }, { status: 500 })
  }
}
