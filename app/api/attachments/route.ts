import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { attachmentIds, contentId } = body

    if (!Array.isArray(attachmentIds) || attachmentIds.length === 0) {
      return NextResponse.json({ success: true })
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: true })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { error } = await supabase
      .from('attachments')
      .update({ content_id: contentId })
      .in('id', attachmentIds)
      .eq('user_id', user.id)

    if (error) {
      console.error('Batch update attachment error:', error)
      return NextResponse.json({ error: 'Failed to update attachments' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Attachments PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
