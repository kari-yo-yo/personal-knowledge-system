import { useState } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/theme/GlassCard'
import { Trash2, Tag, FileText, Image, Video, BookOpen, ExternalLink, Pencil } from 'lucide-react'
import type { Content } from '@/lib/types'

interface ContentCardProps {
  content: Content
  nodeId?: string
  index?: number
  createdAt?: string | null
  selected?: boolean
  onDelete?: (id: string) => void
  onView?: (content: Content) => void
  onEdit?: (content: Content) => void
  showNode?: boolean
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  note: <FileText size={14} />,
  image: <Image size={14} />,
  video: <Video size={14} />,
  article: <BookOpen size={14} />,
  link: <ExternalLink size={14} />,
}

export function ContentCard({
  content,
  nodeId,
  onDelete,
  onView,
  onEdit,
  showNode,
}: ContentCardProps) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <GlassCard className="p-3 group">
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div
          className="p-2 rounded-lg shrink-0"
          style={{ background: 'rgba(139, 92, 246, 0.1)' }}
        >
          <span style={{ color: 'var(--accent-nebula)' }}>
            {contentTypeIcons[content.type] || <FileText size={14} />}
          </span>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4
                className="font-medium text-sm truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {content.title || '无标题'}
              </h4>

              {showNode && content.node && (
                <Link
                  href={`/node/${content.node.id}`}
                  className="text-xs mt-0.5 inline-block hover:underline"
                  style={{ color: 'var(--accent-aurora)' }}
                >
                  {content.node.name}
                </Link>
              )}

              {content.tags && content.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {content.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
                      style={{
                        background: 'rgba(139, 92, 246, 0.12)',
                        color: 'var(--accent-nebula)',
                      }}
                    >
                      <Tag size={8} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {onView && content.type === 'link' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onView(content)
                  }}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="查看"
                >
                  <ExternalLink size={14} />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(content)
                  }}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="编辑"
                >
                  <Pencil size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDelete(true)
                  }}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认 */}
      {showDelete && (
        <div
          className="mt-3 p-3 rounded-lg flex items-center justify-between"
          style={{ background: 'rgba(255, 50, 50, 0.08)', border: '1px solid rgba(255, 50, 50, 0.15)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            确定删除这条内容吗？
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDelete(false)}
              className="px-3 py-1 rounded text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              取消
            </button>
            <button
              onClick={() => {
                onDelete?.(content.id)
                setShowDelete(false)
              }}
              className="px-3 py-1 rounded text-sm text-white"
              style={{ background: 'rgba(220, 50, 50, 0.8)' }}
            >
              删除
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
