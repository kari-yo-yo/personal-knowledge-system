'use client'

import { useEffect, useState } from 'react'
import { ContentCard } from './ContentCard'

interface ContentItem {
  id: string
  title?: string | null
  body?: any
  type: string
  tags: string[]
  attachments?: any[]
}

interface ContentListProps {
  nodeId: string
}

export function ContentList({ nodeId }: ContentListProps) {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/nodes/${nodeId}/contents`)
      .then((res) => res.json())
      .then((data) => {
        setContents(data.contents || [])
        setLoading(false)
      })
  }, [nodeId])

  if (loading) return <div className="text-sm text-slate-500">加载内容...</div>

  if (contents.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>暂无内容</p>
        <p className="text-sm mt-1">点击上方"+"按钮添加第一条内容</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contents.map((content) => (
        <ContentCard key={content.id} content={content} />
      ))}
    </div>
  )
}
