import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

const updateNodeSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
})

function parseNodeContents(node: any) {
  if (node.contents) {
    node.contents = node.contents.map((c: any) => ({
      ...c,
      body: typeof c.body === 'string' ? JSON.parse(c.body || '{}') : c.body,
      tags: typeof c.tags === 'string' ? JSON.parse(c.tags || '[]') : c.tags,
    }))
  }
  return node
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const node = db.nodes.get(id) as any
    if (!node || node.userId !== user.id) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    const allNodes = Array.from(db.nodes.values()) as any[]
    const allContents = Array.from(db.contents.values()) as any[]
    const allEdges = Array.from(db.edges.values()) as any[]

    const children = allNodes
      .filter((n: any) => n.parentId === id)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))

    const contents = allContents
      .filter((c: any) => c.nodeId === id)
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const sourceEdges = allEdges
      .filter((e: any) => e.sourceId === id)
      .map((e: any) => ({ ...e, target: db.nodes.get(e.targetId) || null }))

    const targetEdges = allEdges
      .filter((e: any) => e.targetId === id)
      .map((e: any) => ({ ...e, source: db.nodes.get(e.sourceId) || null }))

    const result = {
      ...node,
      children,
      contents,
      sourceEdges,
      targetEdges,
    }

    return NextResponse.json({ node: parseNodeContents(result) })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const data = updateNodeSchema.parse(body)

    const node = db.nodes.get(id) as any
    if (!node || node.userId !== user.id) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    const updated = {
      ...node,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    db.nodes.set(id, updated)
    db.save()

    return NextResponse.json({ node: updated })
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
    const node = db.nodes.get(id) as any
    if (!node || node.userId !== user.id) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    // Delete the node and cascade delete its children, contents, and related edges
    db.nodes.delete(id)

    // Delete all descendant nodes recursively
    const deleteDescendants = (parentId: string) => {
      const children = Array.from(db.nodes.values()).filter((n: any) => n.parentId === parentId)
      for (const child of children) {
        db.nodes.delete(child.id)
        deleteDescendants(child.id)
      }
    }
    deleteDescendants(id)

    // Delete contents belonging to this node
    for (const [contentId, content] of db.contents.entries()) {
      if ((content as any).nodeId === id) {
        db.contents.delete(contentId)
        // Also delete attachments for this content
        for (const [attachId, attach] of db.attachments.entries()) {
          if ((attach as any).contentId === contentId) {
            db.attachments.delete(attachId)
          }
        }
      }
    }

    // Delete edges involving this node
    for (const [edgeId, edge] of db.edges.entries()) {
      const e = edge as any
      if (e.sourceId === id || e.targetId === id) {
        db.edges.delete(edgeId)
      }
    }

    db.save()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
