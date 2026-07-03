import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password, email, securityQuestion, securityAnswer } = await request.json()

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ error: '用户名长度需要在2-20之间' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 })
    }

    if (!securityQuestion || !securityAnswer?.trim()) {
      return NextResponse.json({ error: '请设置安全问题和答案' }, { status: 400 })
    }

    // Check if username already exists
    const existing = Array.from(db.users.values()).find((u: any) => u.username === username.trim())
    if (existing) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 })
    }

    const hashedPassword = hashPassword(password)
    const hashedAnswer = hashPassword(securityAnswer.trim().toLowerCase())
    const userId = crypto.randomUUID()
    const now = new Date().toISOString()

    const user = {
      id: userId,
      username: username.trim(),
      password: hashedPassword,
      email: email?.trim() || '',
      securityQuestion,
      securityAnswer: hashedAnswer,
      createdAt: now,
    }
    db.users.set(userId, user)

    // Create initial knowledge tree for the new user
    const rootId = crypto.randomUUID()
    const root = {
      id: rootId,
      name: '个人成长总系统',
      type: 'ROOT',
      color: '#4a90d9',
      parentId: null,
      sortOrder: 0,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    }
    db.nodes.set(rootId, root)

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
      const systemNode = {
        id: systemNodeId,
        name: sys.name,
        type: 'SYSTEM',
        parentId: root.id,
        color: sys.color,
        sortOrder: 0,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      }
      db.nodes.set(systemNodeId, systemNode)

      for (const sub of sys.subs) {
        const subId = crypto.randomUUID()
        const subNode = {
          id: subId,
          name: sub,
          type: 'SUBSYSTEM',
          parentId: systemNodeId,
          color: sys.color,
          sortOrder: 0,
          userId: user.id,
          createdAt: now,
          updatedAt: now,
        }
        db.nodes.set(subId, subNode)
      }
    }

    // Create session
    const token = generateToken()
    const sessionId = crypto.randomUUID()
    const session = {
      id: sessionId,
      userId: user.id,
      token,
      createdAt: now,
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
