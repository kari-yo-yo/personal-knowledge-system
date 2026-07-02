'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Code, Heading2, Quote } from 'lucide-react'

interface ContentEditorProps {
  initialContent?: object
  onChange?: (content: object) => void
}

export function ContentEditor({ initialContent, onChange }: ContentEditorProps) {
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
    icon: React.ElementType
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-slate-100 ${isActive ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
    >
      <Icon size={16} />
    </button>
  )

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 flex-wrap">
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
      </div>
      
      <EditorContent
        editor={editor}
        className="p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none"
      />
    </div>
  )
}
