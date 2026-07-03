import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // Verify node belongs to user
    const node = db.nodes.get(id) as any
    if (!node || node.userId !== user.id) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const allContents = Array.from(db.contents.values()) as any[]
    const nodeContents = allContents
      .filter((c: any) => c.nodeId === id)
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const total = nodeContents.length
    const contents = nodeContents.slice(skip, skip + limit)

    // Attach attachments to each content
    const allAttachments = Array.from(db.attachments.values()) as any[]
    const contentsWithAttachments = contents.map((c: any) => ({
      ...c,
      attachments: allAttachments.filter((a: any) => a.contentId === c.id),
    }))

    const parsedContents = contentsWithAttachments.map((c: any) => ({
      ...c,
      body: typeof c.body === 'string' ? JSON.parse(c.body || '{}') : c.body,
      tags: typeof c.tags === 'string' ? JSON.parse(c.tags || '[]') : c.tags,
    }))

    return NextResponse.json({ contents: parsedContents, total, page, limit })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
