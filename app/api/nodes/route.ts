import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createNodeSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().optional(),
  type: z.string().optional(),
  color: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parentId = searchParams.get('parentId')

  const nodes = await prisma.node.findMany({
    where: parentId ? { parentId } : { parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return NextResponse.json({ nodes })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createNodeSchema.parse(body)

    const node = await prisma.node.create({ data })
    return NextResponse.json({ node }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
