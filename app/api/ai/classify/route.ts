import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length >= 2)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { text } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const nodes = Array.from(db.nodes.values())
      .filter((n: any) => n.userId === user.id)
      .map((n: any) => ({ id: n.id, name: n.name }))

    const textLower = text.toLowerCase()
    const keywords = extractKeywords(text)

    // 查询用户偏好
    const preferences = Array.from(db.preferences.values()).filter(
      (p: any) => p.userId === user.id
    ) as any[]

    const preferenceScores = new Map<string, number>()
    let isFromPreference = false

    for (const keyword of keywords) {
      for (const pref of preferences) {
        if (pref.keyword && (
          keyword.includes(pref.keyword.toLowerCase()) ||
          pref.keyword.toLowerCase().includes(keyword)
        )) {
          preferenceScores.set(pref.preferredNodeId, (preferenceScores.get(pref.preferredNodeId) || 0) + pref.count * 50)
        }
      }
    }

    let bestMatch: typeof nodes[0] | null = null
    let bestScore = 0

    for (const node of nodes) {
      const nodeNameLower = node.name.toLowerCase()
      let score = preferenceScores.get(node.id) || 0

      if (textLower.includes(nodeNameLower)) score += 10

      const keywords: Record<string, string[]> = {
        '学习': ['学习', '知识', '方法', '读书', '课程', '笔记'],
        '性格': ['性格', '情绪', '习惯', '内向', '外向', '脾气'],
        '人际': ['人际', '沟通', '社交', '朋友', '关系', '交流'],
        '安全': ['安全', '车辆', '驾驶', '交通', '事故', '注意'],
        '目标': ['目标', '愿望', '计划', '梦想', '想要', '达成'],
        '灵感': ['灵感', '想法', '创意', '突然', '想到'],
      }

      for (const [category, words] of Object.entries(keywords)) {
        if (nodeNameLower.includes(category)) {
          for (const word of words) {
            if (textLower.includes(word)) score += 3
          }
        }
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = node
      }
    }

    if (!bestMatch || bestScore === 0) {
      const inspirationNode = nodes.find((n) => n.name.includes('灵感'))
      bestMatch = inspirationNode || nodes[0]
      bestScore = 1
    }

    if (preferenceScores.has(bestMatch?.id || '')) {
      isFromPreference = true
    }

    return NextResponse.json({
      suggestedNodeId: bestMatch?.id,
      suggestedNodeName: bestMatch?.name,
      confidence: Math.min(bestScore / 20, 1),
      isFromPreference,
      alternatives: nodes
        .filter((n) => n.id !== bestMatch?.id)
        .slice(0, 3)
        .map((n) => ({ nodeId: n.id, nodeName: n.name, reason: `名称匹配: ${n.name}` })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
