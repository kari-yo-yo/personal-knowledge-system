import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// Step 1: Verify username exists and return security question
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username?.trim()) {
      return NextResponse.json({ error: '请输入用户名' }, { status: 400 })
    }

    const user = Array.from(db.users.values()).find(
      (u: any) => u.username === username.trim()
    )

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      securityQuestion: user.securityQuestion,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Step 2: Verify security answer and reset password
export async function POST(request: NextRequest) {
  try {
    const { username, securityAnswer, newPassword } = await request.json()

    if (!username?.trim() || !securityAnswer?.trim() || !newPassword?.trim()) {
      return NextResponse.json({ error: '所有字段都不能为空' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码至少6位' }, { status: 400 })
    }

    const user = Array.from(db.users.values()).find(
      (u: any) => u.username === username.trim()
    )

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const crypto = require('crypto')
    const inputHash = crypto.scryptSync(securityAnswer.trim().toLowerCase(), 'salt', 64).toString('hex')
    if (inputHash !== user.securityAnswer) {
      return NextResponse.json({ error: '安全问题答案不正确' }, { status: 401 })
    }

    // Reset password
    user.password = hashPassword(newPassword)
    db.users.set(user.id, user)

    // Clear all sessions for this user
    const sessionsToDelete = Array.from(db.sessions.values()).filter(
      (s: any) => s.userId === user.id
    )
    for (const s of sessionsToDelete) {
      db.sessions.delete(s.id)
    }

    await db.save()

    return NextResponse.json({ message: '密码重置成功，请用新密码登录' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
