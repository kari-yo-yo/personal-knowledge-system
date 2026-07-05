import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createEdgeSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  label: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = { id: 'default-user', username: '我' }
  await db.load()

  const { searchParams } = new URL(request.url)
  const nodeId = searchParams.get('nodeId')

  const allEdges = Array.from(db.edges.values()) as any[]

  if (!nodeId) {
    // Return all edges for the user (used by 3D network view)
    const edges = allEdges
      .filter((e: any) => e.userId === user.id)
      .map((e: any) => ({
        ...e,
        source: db.nodes.get(e.sourceId) || null,
        target: db.nodes.get(e.targetId) || null,
      }))
    return NextResponse.json({ edges })
  }

  // Return edges connected to the specified node
  const edges = allEdges
    .filter((e: any) => e.userId === user.id && (e.sourceId === nodeId || e.targetId === nodeId))
    .map((e: any) => ({
      ...e,
      source: db.nodes.get(e.sourceId) || null,
      target: db.nodes.get(e.targetId) || null,
    }))

  return NextResponse.json({ edges })
}

export async function POST(request: NextRequest) {
  const user = { id: 'default-user', username: '我' }
  await db.load()

  try {
    const body = await request.json()
    const data = createEdgeSchema.parse(body)

    // Verify both nodes belong to user
    const sourceNode = db.nodes.get(data.sourceId) as any
    const targetNode = db.nodes.get(data.targetId) as any
    if (!sourceNode || sourceNode.userId !== user.id || !targetNode || targetNode.userId !== user.id) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    // Check for duplicate edge
    const existing = Array.from(db.edges.values()).find(
      (e: any) => e.sourceId === data.sourceId && e.targetId === data.targetId
    )
    if (existing) {
      return NextResponse.json({ error: 'Edge already exists' }, { status: 409 })
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const edge = {
      id,
      sourceId: data.sourceId,
      targetId: data.targetId,
      label: data.label || null,
      userId: user.id,
      createdAt: now,
    }

    db.edges.set(id, edge)
    await db.save()

    return NextResponse.json({
      edge: {
        ...edge,
        source: sourceNode,
        target: targetNode,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = { id: 'default-user', username: '我' }
  await db.load()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const edge = db.edges.get(id) as any
    if (!edge || edge.userId !== user.id) {
      return NextResponse.json({ error: 'Edge not found' }, { status: 404 })
    }

    db.edges.delete(id)
    await db.save()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
