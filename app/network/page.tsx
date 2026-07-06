'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NetworkGraph } from '@/components/network/NetworkGraph'
import { P5Wrapper } from '@/components/network/P5Wrapper'
import { Menu, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function NetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')
  const [refreshKey, setRefreshKey] = useState(0)

  const isDark = viewMode === '3d'

  return (
    <div className="flex h-screen" style={{ background: isDark ? '#000000' : 'var(--bg-deep)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <header
          className="h-14 border-b flex items-center gap-3 px-4 backdrop-blur-xl transition-colors duration-300"
          style={{
            background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}
          >
            <Menu size={20} />
          </button>

          <Link href="/" className="p-2 rounded" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>

          <h1
            className="font-semibold transition-colors duration-300"
            style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'var(--text-primary)' }}
          >
            <span className="hidden sm:inline">{isDark ? '✦ 知识星空' : '知识网络图'}</span>
            <span className="sm:hidden">{isDark ? '✦ 星空' : '网络图'}</span>
          </h1>

          <div className="flex-1" />

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded transition-colors"
            style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'var(--text-muted)' }}
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
                  ? { background: 'var(--accent-nebula)', color: 'white' }
                  : { color: isDark ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }
              }
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={
                viewMode === '3d'
                  ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.2)' }
                  : { color: isDark ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }
              }
            >
              3D
            </button>
          </div>

          <p
            className="text-sm hidden lg:block ml-4 transition-colors duration-300"
            style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)' }}
          >
            {viewMode === '3d'
              ? '拖拽旋转 · Shift+拖拽平移 · 滚轮缩放 · 单击聚焦 · 双击进入'
              : '拖拽节点调整布局，点击节点跳转，拖拽连线创建关联'}
          </p>
        </header>

        <div className="flex-1 relative">
          {viewMode === '3d' ? (
            <P5Wrapper refreshKey={refreshKey} />
          ) : (
            <NetworkGraph refreshKey={refreshKey} />
          )}
        </div>
      </main>
    </div>
  )
}
