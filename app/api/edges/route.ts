import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createEdgeSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  label: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const nodeId = searchParams.get('nodeId')

  if (!nodeId) {
    return NextResponse.json({ error: 'nodeId required' }, { status: 400 })
  }

  const edges = await prisma.edge.findMany({
    where: {
      OR: [{ sourceId: nodeId }, { targetId: nodeId }],
    },
    include: { source: true, target: true },
  })

  return NextResponse.json({ edges })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createEdgeSchema.parse(body)

    const edge = await prisma.edge.create({
      data,
      include: { source: true, target: true },
    })

    return NextResponse.json({ edge }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    await prisma.edge.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
