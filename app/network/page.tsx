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

  const isDark = viewMode === '3d'

  return (
    <div className="flex h-screen" style={{ background: isDark ? '#050510' : '#FFF8F0' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header
          className="h-14 border-b flex items-center gap-3 px-4 transition-colors duration-300"
          style={{
            background: isDark ? '#0a0a20' : 'white',
            borderColor: isDark ? 'rgba(139,92,246,0.2)' : '#F0E6D8',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded"
            style={{ color: isDark ? 'rgba(255,255,255,0.7)' : undefined }}
          >
            <Menu size={20} />
          </button>
          
          <Link href="/" className="p-2 rounded" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : undefined }}>
            <ArrowLeft size={20} className={isDark ? '' : 'text-slate-600'} />
          </Link>
          
          <h1
            className="font-semibold transition-colors duration-300"
            style={{ color: isDark ? 'rgba(255,255,255,0.9)' : '#5D4E37' }}
          >
            {isDark ? '🌌 知识星系' : '知识网络图'}
          </h1>
          
          <div className="flex-1" />

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded transition-colors"
            style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#8B7355' }}
            title="刷新"
          >
            <RefreshCw size={18} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('2d')}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={
                viewMode === '2d'
                  ? { background: '#FF6B8A', color: 'white' }
                  : { color: isDark ? 'rgba(255,255,255,0.6)' : '#8B7355' }
              }
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={
                viewMode === '3d'
                  ? { background: '#7c3aed', color: 'white' }
                  : { color: isDark ? 'rgba(255,255,255,0.6)' : '#8B7355' }
              }
            >
              3D
            </button>
          </div>
          
          <p
            className="text-sm hidden md:block ml-4 transition-colors duration-300"
            style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#8B7355' }}
          >
            {viewMode === '3d'
              ? '拖拽漫游 · 滚轮缩放 · 单击高亮 · 双击跃迁'
              : '拖拽节点调整布局，点击节点跳转，拖拽连线创建关联'}
          </p>
        </header>
        
        <div className="flex-1 relative">
          {viewMode === '3d' ? (
            <KnowledgeNebulaWrapper refreshKey={refreshKey} />
          ) : (
            <NetworkGraph refreshKey={refreshKey} />
          )}
        </div>
      </main>
    </div>
  )
}
