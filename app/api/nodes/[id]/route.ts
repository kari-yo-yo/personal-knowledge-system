import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateNodeSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const node = await prisma.node.findUnique({
      where: { id: params.id },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
        contents: { orderBy: { updatedAt: 'desc' } },
        sourceEdges: { include: { target: true } },
        targetEdges: { include: { source: true } },
      },
    })

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    return NextResponse.json({ node })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateNodeSchema.parse(body)

    const node = await prisma.node.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ node })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.node.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
