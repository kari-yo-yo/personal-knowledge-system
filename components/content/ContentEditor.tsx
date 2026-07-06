'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Code, Heading2, Quote, Paperclip, X, FileText, Image, File } from 'lucide-react'
import { useState } from 'react'

// Custom icon type to avoid React 19 / lucide-react type conflicts
type IconComponent = React.ComponentType<{ size?: number | string; className?: string }>
import { FileUploader } from '@/components/upload/FileUploader'
import { Attachment } from '@/lib/types'

interface ContentEditorProps {
  initialContent?: object
  onChange?: (content: object) => void
  nodeId?: string
  contentId?: string
  attachments?: Attachment[]
  onAttachmentsChange?: (attachments: Attachment[]) => void
}

export function ContentEditor({
  initialContent,
  onChange,
  nodeId,
  contentId,
  attachments = [],
  onAttachmentsChange,
}: ContentEditorProps) {
  const [showUploader, setShowUploader] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '开始输入内容...',
      }),
    ],
    content: initialContent || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
  })

  if (!editor) return null

  const ToolbarButton = ({
    onClick,
    isActive,
    icon: Icon,
  }: {
    onClick: () => void
    isActive: boolean
    icon: IconComponent
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-slate-100 ${isActive ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
    >
      <Icon size={16} />
    </button>
  )

  const handleAttachmentUpload = (attachment: Attachment) => {
    onAttachmentsChange?.([...attachments, attachment])
    setShowUploader(false)
  }

  const removeAttachment = (id: string) => {
    onAttachmentsChange?.(attachments.filter((a) => a.id !== id))
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return <Image size={14} className="text-[#FF6B8A]" />
    if (fileType?.includes('pdf')) return <FileText size={14} className="text-red-500" />
    return <File size={14} className="text-[var(--text-muted)]" />
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="border border-[var(--glass-border)] rounded-lg bg-[var(--bg-surface)]">
      <div className="flex items-center gap-1 p-2 border-b border-[var(--glass-border)] flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          icon={Code}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
        />
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => setShowUploader(!showUploader)}
          className={`p-2 rounded hover:bg-slate-100 flex items-center gap-1 text-xs ${showUploader ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
          type="button"
        >
          <Paperclip size={16} />
          附件
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none"
      />

      {showUploader && (
        <div className="px-4 pb-4">
          <FileUploader
            nodeId={nodeId}
            contentId={contentId}
            onUploadComplete={handleAttachmentUpload}
            onUploadError={(err) => alert(err)}
          />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attach) => (
              <div
                key={attach.id}
                className="flex items-center gap-2 px-3 py-2 bg-[rgba(255,255,255,0.05)] rounded-lg border text-sm"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                {getFileIcon(attach.fileType)}
                <a
                  href={attach.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-primary)] hover:text-[#FF6B8A] truncate max-w-[200px]"
                >
                  {attach.fileName}
                </a>
                <span className="text-xs text-[var(--text-muted)]">{formatSize(attach.fileSize)}</span>
                <button
                  onClick={() => removeAttachment(attach.id)}
                  className="p-0.5 hover:bg-[var(--glass-border)] rounded"
                  type="button"
                >
                  <X size={12} className="text-[var(--text-muted)]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
