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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 border-r
          transform transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: '#FFF8F0', borderColor: '#F0E6D8' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#F0E6D8' }}>
          <h2 className="font-semibold" style={{ color: '#5D4E37' }}>知识系统</h2>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-orange-50 rounded">
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
