import { Content, Attachment } from '@/lib/types'
import { FileText, CheckSquare, Code, Link, ListChecks } from 'lucide-react'

interface ContentCardProps {
  content: Content & { attachments?: Attachment[] }
}

const typeIcons = {
  NOTE: FileText,
  TODO: CheckSquare,
  CODE: Code,
  LINK: Link,
  CHECKLIST: ListChecks,
}

export function ContentCard({ content }: ContentCardProps) {
  const Icon = typeIcons[content.type] || FileText

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded-lg">
          <Icon size={16} className="text-slate-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          {content.title && (
            <h3 className="font-medium text-slate-800 mb-1">{content.title}</h3>
          )}
          <p className="text-sm text-slate-500 line-clamp-3">
            {JSON.stringify(content.body).slice(0, 200)}
          </p>
          
          {content.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {content.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {content.attachments && content.attachments.length > 0 && (
            <p className="text-xs text-slate-400 mt-2">
              {content.attachments.length} 个附件
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
