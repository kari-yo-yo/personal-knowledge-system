import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

const summarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  highlights: z.string().optional(),
  reflections: z.string().optional(),
  improvements: z.string().optional(),
  mood: z.number().min(1).max(5).optional(),
})

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'date required' }, { status: 400 })
    }

    // Find summary by date + userId
    const summary = Array.from(db.dailySummaries.values()).find(
      (s: any) => s.date === date && s.userId === user.id
    ) || null

    return NextResponse.json({ summary })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const data = summarySchema.parse(body)

    const now = new Date().toISOString()

    // Upsert: find existing or create new
    const existing = Array.from(db.dailySummaries.values()).find(
      (s: any) => s.date === data.date && s.userId === user.id
    )

    if (existing) {
      const updated = {
        ...existing,
        highlights: data.highlights ?? existing.highlights,
        reflections: data.reflections ?? existing.reflections,
        improvements: data.improvements ?? existing.improvements,
        mood: data.mood ?? existing.mood,
        updatedAt: now,
      }
      db.dailySummaries.set(existing.id, updated)
      db.save()
      return NextResponse.json({ summary: updated })
    } else {
      const id = crypto.randomUUID()
      const summary = {
        id,
        date: data.date,
        userId: user.id,
        highlights: data.highlights || '',
        reflections: data.reflections || '',
        improvements: data.improvements || '',
        mood: data.mood || 3,
        createdAt: now,
        updatedAt: now,
      }
      db.dailySummaries.set(id, summary)
      db.save()
      return NextResponse.json({ summary })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
