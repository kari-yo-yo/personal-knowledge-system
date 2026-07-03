import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

const updateContentSchema = z.object({
  title: z.string().optional(),
  body: z.record(z.string(), z.any()).optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // Verify content belongs to user
    const content = db.contents.get(id) as any
    if (!content || content.userId !== user.id) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = updateContentSchema.parse(body)

    const updated: any = {
      ...content,
      updatedAt: new Date().toISOString(),
    }
    if (data.title !== undefined) updated.title = data.title
    if (data.body !== undefined) updated.body = JSON.stringify(data.body)
    if (data.type !== undefined) updated.type = data.type
    if (data.tags !== undefined) updated.tags = JSON.stringify(data.tags)

    db.contents.set(id, updated)
    await db.save()

    // Attach attachments
    const allAttachments = Array.from(db.attachments.values()) as any[]
    const attachments = allAttachments.filter((a: any) => a.contentId === id)

    return NextResponse.json({
      content: {
        ...updated,
        body: data.body,
        tags: data.tags,
        attachments,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const content = db.contents.get(id) as any
    if (!content || content.userId !== user.id) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    db.contents.delete(id)

    // Also delete attachments for this content
    for (const [attachId, attach] of db.attachments.entries()) {
      if ((attach as any).contentId === id) {
        db.attachments.delete(attachId)
      }
    }

    await db.save()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
