import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where: { nodeId: id },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: { attachments: true },
      }),
      prisma.content.count({ where: { nodeId: id } }),
    ])

    const parsedContents = contents.map((c: any) => ({
      ...c,
      body: typeof c.body === 'string' ? JSON.parse(c.body || '{}') : c.body,
      tags: typeof c.tags === 'string' ? JSON.parse(c.tags || '[]') : c.tags,
    }))

    return NextResponse.json({ contents: parsedContents, total, page, limit })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
