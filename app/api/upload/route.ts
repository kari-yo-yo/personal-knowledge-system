import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

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

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let text = ''
    const isText = isTextFile(file)

    if (isText) {
      text = buffer.toString('utf-8')
      if (text.length > 50000) {
        text = text.slice(0, 50000) + '\n...（内容已截断）'
      }
    } else {
      // For binary files (Word, PPT, PDF), we can't extract text in serverless
      // Return file info so the client can use the filename for analysis
      text = `[文件: ${file.name}]\n该文件类型暂不支持自动解析内容，已保存文件信息。`
    }

    return NextResponse.json({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      isText,
      text,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
