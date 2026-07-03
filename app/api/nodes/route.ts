import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

const createNodeSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().optional(),
  type: z.string().optional(),
  color: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    // Filter nodes by userId and parentId
    const allNodes = Array.from(db.nodes.values()) as any[]
    let filtered = allNodes.filter((n: any) => n.userId === user.id)

    if (parentId) {
      filtered = filtered.filter((n: any) => n.parentId === parentId)
    } else {
      filtered = filtered.filter((n: any) => n.parentId === null)
    }

    // Sort by sortOrder
    filtered.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))

    // Build children for each node
    const nodesWithChildren = filtered.map((node: any) => ({
      ...node,
      children: allNodes
        .filter((n: any) => n.parentId === node.id)
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    }))

    return NextResponse.json({ nodes: nodesWithChildren })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const data = createNodeSchema.parse(body)

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const node = {
      id,
      name: data.name,
      parentId: data.parentId || null,
      type: data.type || 'TOPIC',
      color: data.color || null,
      sortOrder: 0,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    }

    db.nodes.set(id, node)
    db.save()

    return NextResponse.json({ node }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
