'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Sparkles } from 'lucide-react'

interface QuickNoteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickNoteModal({ isOpen, onClose }: QuickNoteModalProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
    if (!isOpen) {
      setText('')
    }
  }, [isOpen])

  const handleSave = async () => {
    const trimmed = text.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      const nodesRes = await fetch('/api/nodes')
      const nodesData = await nodesRes.json()
      const root = nodesData.nodes?.[0]
      const inspirationNode = root?.children?.find(
        (c: any) => c.name === '灵感系统'
      )

      const createRes = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed.length > 20 ? trimmed.slice(0, 20) + '...' : trimmed,
          parentId: inspirationNode?.id,
          type: 'TOPIC',
          color: '#ff9800',
        }),
      })
      const createData = await createRes.json()

      if (createData.node?.id) {
        await fetch('/api/contents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: createData.node.id,
            title: trimmed,
            body: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: trimmed,
                    },
                  ],
                },
              ],
            },
            type: 'INSPIRATION',
            tags: ['灵感', '速记'],
          }),
        })
      }

      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Failed to save quick note:', err)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Toast */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] animate-bounce">
          <div className="px-4 py-2 rounded-full shadow-lg text-white text-sm font-medium glow-btn">
            灵感已记录 🐾
          </div>
        </div>
      )}

      {/* Modal */}
      <div
        className="relative w-[90vw] max-w-md rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl"
        style={{
          background: 'rgba(5, 5, 16, 0.9)',
          border: '1px solid var(--glass-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: 'var(--accent-aurora)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              灵感速记
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="随手记下你的灵感... (Ctrl+Enter 保存)"
            className="w-full h-32 resize-none star-input"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {text.length > 0 ? `${text.length} 字` : 'Ctrl+Enter 快速保存'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !text.trim()}
                className="glow-btn px-4 py-1.5 text-sm disabled:opacity-50"
              >
                {saving ? '保存中...' : '记录灵感'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
