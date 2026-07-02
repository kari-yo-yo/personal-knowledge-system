import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createContentSchema = z.object({
  nodeId: z.string().uuid(),
  title: z.string().optional(),
  body: z.record(z.string(), z.any()),
  type: z.enum(['NOTE', 'TODO', 'CODE', 'LINK', 'CHECKLIST']).optional(),
  tags: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createContentSchema.parse(body)

    const content = await prisma.content.create({
      data,
      include: { attachments: true },
    })

    return NextResponse.json({ content }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
