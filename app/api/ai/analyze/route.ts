import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { text, type = 'note' } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    const nodes = Array.from(db.nodes.values()).filter(
      (n: any) => n.userId === user.id && (n.type === 'SYSTEM' || n.type === 'SUBSYSTEM')
    ) as any[]

    // 提取关键词
    const keywords = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length >= 2)

    // 计算每个节点的匹配分数
    let bestMatch: typeof nodes[0] | null = null
    let bestScore = 0

    for (const node of nodes) {
      const nodeNameWords = node.name.split(/(?=[\u4e00-\u9fa5])|(?<=[\u4e00-\u9fa5])|(?=[A-Z])|\s+/).filter(Boolean)
      let score = 0
      for (const word of keywords) {
        for (const nw of nodeNameWords) {
          if (nw.toLowerCase().includes(word) || word.includes(nw.toLowerCase())) {
            score += word.length
          }
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = node
      }
    }

    // 生成一句话总结
    const lines = text.split('\n').filter((l: string) => l.trim().length > 0)
    const firstLine = lines[0]?.trim() || ''
    let summary = ''

    if (firstLine.length > 5 && firstLine.length < 80) {
      summary = firstLine
    } else {
      summary = text.slice(0, 60).trim() + (text.length > 60 ? '...' : '')
    }

    return NextResponse.json({
      suggestedNodeId: bestMatch?.id,
      suggestedNodeName: bestMatch?.name,
      confidence: Math.min(bestScore / 20, 1),
      summary,
      alternatives: nodes
        .filter((n) => n.id !== bestMatch?.id)
        .slice(0, 3)
        .map((n) => ({ nodeId: n.id, nodeName: n.name })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
