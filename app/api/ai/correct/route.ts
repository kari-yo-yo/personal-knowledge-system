import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

function extractKeywords(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')

  // 中文分词：提取连续中文字符作为候选词
  const chineseWords: string[] = []
  const chineseMatches = cleaned.match(/[\u4e00-\u9fa5]{2,6}/g)
  if (chineseMatches) {
    chineseWords.push(...chineseMatches)
  }

  // 英文/数字词
  const otherWords = cleaned
    .split(/\s+/)
    .filter((w: string) => /^[a-z0-9]+$/.test(w) && w.length >= 3)

  return [...new Set([...chineseWords, ...otherWords])]
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { text, originalNodeId, correctNodeId } = body

    if (!text || !correctNodeId) {
      return NextResponse.json(
        { error: 'text and correctNodeId are required' },
        { status: 400 }
      )
    }

    // 验证目标节点属于当前用户
    const node = db.nodes.get(correctNodeId) as any
    if (!node || node.userId !== user.id) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    const keywords = extractKeywords(text)
    const now = new Date().toISOString()
    const updated: string[] = []
    const created: string[] = []

    for (const keyword of keywords) {
      // 查找是否已存在该用户的该关键词偏好
      const existing = Array.from(db.preferences.values()).find(
        (p: any) => p.userId === user.id && p.keyword === keyword
      ) as any

      if (existing) {
        // 更新现有记录：增加count，更新nodeId（如果用户更改了偏好）
        existing.preferredNodeId = correctNodeId
        existing.count = (existing.count || 1) + 1
        existing.updatedAt = now
        db.preferences.set(existing.id, existing)
        updated.push(keyword)
      } else {
        // 创建新记录
        const id = crypto.randomUUID()
        const pref = {
          id,
          userId: user.id,
          keyword,
          preferredNodeId: correctNodeId,
          count: 1,
          createdAt: now,
          updatedAt: now,
        }
        db.preferences.set(id, pref)
        created.push(keyword)
      }
    }

    // 异步保存到Supabase
    await db.save()

    return NextResponse.json({
      success: true,
      keywords: { created, updated },
      correctNodeId,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
