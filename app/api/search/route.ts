import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: { nodes: [], contents: [] }, total: 0 })
  }

  const keyword = q.trim()

  const allNodes = Array.from(db.nodes.values()) as any[]
  const allContents = Array.from(db.contents.values()) as any[]
  const allAttachments = Array.from(db.attachments.values()) as any[]

  const nodes = allNodes
    .filter((n: any) => n.userId === user.id && n.name.includes(keyword))
    .slice(0, 10)

  const contents = allContents
    .filter((c: any) => c.userId === user.id && (c.title || '').includes(keyword))
    .slice(0, 10)
    .map((c: any) => ({
      ...c,
      node: db.nodes.get(c.nodeId) || null,
      attachments: allAttachments.filter((a: any) => a.contentId === c.id),
    }))

  const parsedContents = contents.map((c: any) => ({
    ...c,
    body: typeof c.body === 'string' ? JSON.parse(c.body || '{}') : c.body,
    tags: typeof c.tags === 'string' ? JSON.parse(c.tags || '[]') : c.tags,
  }))

  return NextResponse.json({
    results: { nodes, contents: parsedContents },
    total: nodes.length + parsedContents.length,
  })
}
