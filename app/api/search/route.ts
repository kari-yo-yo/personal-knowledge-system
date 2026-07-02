import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: { nodes: [], contents: [] }, total: 0 })
  }

  const keyword = q.trim()

  const [nodes, contents] = await Promise.all([
    prisma.node.findMany({
      where: {
        name: { contains: keyword },
      },
      take: 10,
    }),
    prisma.content.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
        ],
      },
      take: 10,
      include: { node: true, attachments: true },
    }),
  ])

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
