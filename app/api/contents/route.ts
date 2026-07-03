import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

const createContentSchema = z.object({
  nodeId: z.string().uuid(),
  title: z.string().optional(),
  body: z.record(z.string(), z.any()).optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const data = createContentSchema.parse(body)

    // Verify node belongs to user
    const node = db.nodes.get(data.nodeId) as any
    if (!node || node.userId !== user.id) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const content = {
      id,
      nodeId: data.nodeId,
      userId: user.id,
      title: data.title || null,
      body: JSON.stringify(data.body || {}),
      type: data.type || 'NOTE',
      tags: JSON.stringify(data.tags || []),
      createdAt: now,
      updatedAt: now,
    }

    db.contents.set(id, content)
    await db.save()

    return NextResponse.json({
      content: {
        ...content,
        body: data.body,
        tags: data.tags || [],
        attachments: [],
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
