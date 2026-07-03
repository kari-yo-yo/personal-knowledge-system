import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey)

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey)
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const textTypes = [
  'text/plain', 'text/markdown', 'text/csv', 'application/json',
  'application/javascript', 'text/html', 'text/css', 'text/xml',
]

const textExtensions = ['.md', '.txt', '.csv', '.json', '.js', '.ts', '.html', '.css', '.xml', '.yaml', '.yml']

function isTextFile(file: File): boolean {
  if (textTypes.includes(file.type)) return true
  const name = file.name.toLowerCase()
  return textExtensions.some((ext) => name.endsWith(ext))
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const nodeId = formData.get('nodeId') as string | null
    const contentId = formData.get('contentId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件太大（最大 10MB）' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let url: string
    let storagePath: string | null = null

    if (isSupabaseConfigured) {
      const supabase = getSupabase()
      const bucketName = 'attachments'
      const filePath = `${user.id}/${Date.now()}-${file.name}`

      // Try upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (uploadError) {
        // If bucket doesn't exist, try to create it
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('Bucket')) {
          const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
          })
          if (!createBucketError) {
            // Retry upload
            const { error: retryError } = await supabase.storage
              .from(bucketName)
              .upload(filePath, buffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: false,
              })
            if (!retryError) {
              const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)
              url = publicUrlData.publicUrl
              storagePath = filePath
            } else {
              console.error('Retry storage upload error:', retryError)
              url = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`
            }
          } else {
            console.error('Create bucket error:', createBucketError)
            url = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`
          }
        } else {
          console.error('Storage upload error:', uploadError)
          url = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`
        }
      } else {
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)
        url = publicUrlData.publicUrl
        storagePath = filePath
      }
    } else {
      // No Supabase configured: base64
      url = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`
    }

    // Determine contentId to attach to
    let finalContentId = contentId

    if (!finalContentId && nodeId && isSupabaseConfigured) {
      // Create a placeholder content item for this file
      const supabase = getSupabase()
      const now = new Date().toISOString()
      const newContentId = crypto.randomUUID()
      const { error: contentError } = await supabase.from('contents').insert({
        id: newContentId,
        node_id: nodeId,
        user_id: user.id,
        title: file.name,
        body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '文件上传' }] }] },
        type: 'NOTE',
        tags: [],
        created_at: now,
        updated_at: now,
      })
      if (contentError) {
        console.error('Failed to create placeholder content:', contentError)
      } else {
        finalContentId = newContentId
      }
    }

    // Save attachment metadata
    const attachmentId = crypto.randomUUID()
    const now = new Date().toISOString()

    if (isSupabaseConfigured) {
      const supabase = getSupabase()
      const { error: attachError } = await supabase.from('attachments').insert({
        id: attachmentId,
        content_id: finalContentId || null,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        url,
        user_id: user.id,
        created_at: now,
      })
      if (attachError) {
        console.error('Failed to save attachment metadata:', attachError)
      }
    }

    const attachment = {
      id: attachmentId,
      contentId: finalContentId || null,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      fileUrl: url,
      createdAt: now,
    }

    const text = isTextFile(file) ? buffer.toString('utf-8').slice(0, 50000) : ''

    return NextResponse.json({
      attachment,
      url,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      isText: isTextFile(file),
      text,
      storagePath,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || '上传失败' }, { status: 500 })
  }
}
