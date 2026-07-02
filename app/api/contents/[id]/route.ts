import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateContentSchema = z.object({
  title: z.string().optional(),
  body: z.record(z.any()).optional(),
  type: z.enum(['NOTE', 'TODO', 'CODE', 'LINK', 'CHECKLIST']).optional(),
  tags: z.array(z.string()).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateContentSchema.parse(body)

    const content = await prisma.content.update({
      where: { id: params.id },
      data,
      include: { attachments: true },
    })

    return NextResponse.json({ content })
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
    await prisma.content.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
