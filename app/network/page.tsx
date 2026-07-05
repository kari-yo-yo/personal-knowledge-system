'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NetworkGraph } from '@/components/network/NetworkGraph'
import { KnowledgeNebulaWrapper } from '@/components/network/KnowledgeNebulaWrapper'
import { Menu, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function NetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex h-screen" style={{ background: '#FFF8F0' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b flex items-center gap-3 px-4" style={{ borderColor: '#F0E6D8' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-orange-50 rounded"
          >
            <Menu size={20} />
          </button>
          
          <Link href="/" className="p-2 hover:bg-orange-50 rounded">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          
          <h1 className="font-semibold" style={{ color: '#5D4E37' }}>知识网络图</h1>
          
          <div className="flex-1" />

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 hover:bg-orange-50 rounded transition-colors"
            style={{ color: '#8B7355' }}
            title="刷新网络图"
          >
            <RefreshCw size={18} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === '2d'
                  ? 'text-white'
                  : 'hover:bg-orange-50'
              }`}
              style={viewMode === '2d' ? { background: '#FF6B8A' } : { color: '#8B7355' }}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === '3d'
                  ? 'text-white'
                  : 'hover:bg-orange-50'
              }`}
              style={viewMode === '3d' ? { background: '#FF6B8A' } : { color: '#8B7355' }}
            >
              3D
            </button>
          </div>
          
          <p className="text-sm hidden md:block ml-4" style={{ color: '#8B7355' }}>
            {viewMode === '3d'
              ? '拖拽平移，滚轮缩放，单击高亮，双击跳转'
              : '拖拽节点调整布局，点击节点跳转，拖拽连线创建关联'}
          </p>
        </header>
        
        <div className="flex-1 relative">
          {viewMode === '3d' ? (
            <KnowledgeNebulaWrapper refreshKey={refreshKey} />
          ) : (
            <NetworkGraph refreshKey={refreshKey} />
          )}
          <img
            src="/pups/pup-love.svg"
            alt="两只小狗"
            className="puppy-float absolute bottom-4 right-4 max-w-[80px] md:max-w-[100px] h-auto opacity-80 pointer-events-none"
          />
        </div>
      </main>
    </div>
  )
}
