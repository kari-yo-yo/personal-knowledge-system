import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ attachments: [] })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Query attachments that belong to contents in this node
    const { data, error } = await supabase
      .from('attachments')
      .select('*, contents!inner(node_id, user_id)')
      .eq('contents.node_id', id)
      .eq('contents.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Attachments query error:', error)
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
    }

    const attachments = (data || []).map((a: any) => ({
      id: a.id,
      contentId: a.content_id,
      fileName: a.file_name,
      fileType: a.file_type,
      fileSize: a.file_size,
      fileUrl: a.url,
      createdAt: a.created_at,
    }))

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('Attachments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
