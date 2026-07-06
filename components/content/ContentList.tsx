'use client'

import { useEffect, useState, useCallback } from 'react'
import { ContentCard } from './ContentCard'
import { FileText, X, Edit3 } from 'lucide-react'
import type { Content } from '@/lib/types'

interface ContentItem extends Content {
  attachments?: any[]
}

interface ContentListProps {
  nodeId: string
  refreshKey?: number
  onViewContent?: (content: ContentItem) => void
  onEditContent?: (content: ContentItem) => void
}

// Parse TipTap JSON to readable text
function extractTextFromJSON(json: any): string {
  if (!json) return ''
  if (typeof json === 'string') return json
  if (json.type === 'text') return json.text || ''
  if (json.content && Array.isArray(json.content)) {
    return json.content.map((c: any) => {
      if (c.type === 'paragraph' && c.content) {
        return c.content.map((t: any) => t.text || '').join('')
      }
      if (c.type === 'heading' && c.content) {
        return '\n## ' + c.content.map((t: any) => t.text || '').join('')
      }
      if (c.type === 'codeBlock' && c.content) {
        return '\n```\n' + c.content.map((t: any) => t.text || '').join('') + '\n```'
      }
      if (c.type === 'bulletList' && c.content) {
        return '\n' + c.content.map((item: any) => {
          if (item.content) return '• ' + item.content.map((t: any) => t.text || '').join('')
          return ''
        }).join('\n')
      }
      if (c.type === 'orderedList' && c.content) {
        return '\n' + c.content.map((item: any, i: number) => {
          if (item.content) return `${i + 1}. ` + item.content.map((t: any) => t.text || '').join('')
          return ''
        }).join('\n')
      }
      if (c.type === 'blockquote' && c.content) {
        return '\n> ' + c.content.map((t: any) => t.text || '').join('')
      }
      return ''
    }).filter(Boolean).join('\n')
  }
  return ''
}

function parseBody(body: any): string {
  if (!body) return ''
  if (typeof body === 'string') {
    try {
      return extractTextFromJSON(JSON.parse(body))
    } catch {
      return body
    }
  }
  if (typeof body === 'object' && body.type === 'doc') {
    return extractTextFromJSON(body)
  }
  return String(body)
}

export function ContentList({ nodeId, refreshKey, onViewContent, onEditContent }: ContentListProps) {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewContent, setViewContent] = useState<ContentItem | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchContents = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setIsRefreshing(true)
    try {
      // Add timestamp to bypass browser cache
      const res = await fetch(`/api/nodes/${nodeId}/contents?_t=${Date.now()}`)
      const data = await res.json()
      setContents(data.contents || [])
    } catch (err) {
      console.error('Failed to fetch contents:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [nodeId])

  useEffect(() => {
    fetchContents()
  }, [fetchContents, refreshKey])

  const handleView = useCallback((content: ContentItem) => {
    setSelectedId(content.id)
    setViewContent(content)
    onViewContent?.(content)
  }, [onViewContent])

  const handleDelete = useCallback(async (contentId: string) => {
    if (deleting) return
    setDeleting(contentId)
    try {
      const res = await fetch(`/api/contents/${contentId}?_t=${Date.now()}`, { method: 'DELETE' })
      if (res.ok) {
        // Re-fetch from server to ensure consistency instead of local filtering
        await fetchContents(false)
        if (selectedId === contentId) {
          setSelectedId(null)
          setViewContent(null)
        }
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }, [deleting, selectedId, fetchContents])

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
    <div>
      {isRefreshing && (
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 px-1">
          <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
          同步中...
        </div>
      )}
      <div className="space-y-3">
        {contents.map((content, index) => (
          <ContentCard
            key={content.id}
            content={content}
            index={index + 1}
            createdAt={content.createdAt}
            selected={selectedId === content.id}
            onView={handleView}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Detail panel */}
      {viewContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => { setViewContent(null); setSelectedId(null) }}
        >
          <div
            className="w-full max-w-lg max-h-[80vh] bg-[rgba(10,10,26,0.95)] rounded-xl shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ border: '1px solid var(--glass-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} style={{ color: '#FF6B8A' }} />
                <h3 className="font-semibold text-[var(--text-primary)] truncate">
                  {viewContent.title || '无标题'}
                </h3>
              </div>
              <button
                onClick={() => { setViewContent(null); setSelectedId(null) }}
                className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Meta */}
            <div className="px-5 py-2 text-xs text-[var(--text-muted)] flex items-center gap-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <span>类型: {viewContent.type}</span>
              {viewContent.createdAt && <span>创建: {new Date(viewContent.createdAt).toLocaleString('zh-CN')}</span>}
              {viewContent.updatedAt && <span>更新: {new Date(viewContent.updatedAt).toLocaleString('zh-CN')}</span>}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {parseBody(viewContent.body) || '暂无内容'}
              </div>
              {viewContent.tags && viewContent.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {viewContent.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center gap-2">
                {onEditContent && (
                  <button
                    onClick={() => {
                      onEditContent(viewContent)
                      setViewContent(null)
                      setSelectedId(null)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-white transition-colors glow-btn"
                  >
                    <Edit3 size={12} />
                    编辑内容
                  </button>
                )}
              </div>
              <button
                onClick={() => { setViewContent(null); setSelectedId(null) }}
                className="px-4 py-1.5 text-sm rounded-lg text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
