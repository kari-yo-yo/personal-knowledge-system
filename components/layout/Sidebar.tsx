'use client'

import { TreeView } from '@/components/tree/TreeView'
import { X } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 border-r
          transform transition-transform duration-200
          backdrop-blur-xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            知识系统
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-60px)]">
          <TreeView />
        </div>
      </aside>
    </>
  )
}
