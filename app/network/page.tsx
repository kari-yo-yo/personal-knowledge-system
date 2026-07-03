'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/layout/Sidebar'
import { NetworkGraph } from '@/components/network/NetworkGraph'
import { ErrorBoundary } from '@/components/network/ErrorBoundary'
import { Menu, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const Network3D = dynamic(
  () => import('@/components/network/Network3D').then(m => m.Network3D),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-full" style={{ background: '#FFF8F0' }}>
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto mb-3"
          style={{ borderColor: '#FF6B8A', borderTopColor: 'transparent' }}
        />
        <p style={{ color: '#8B7355' }}>加载 3D 知识网络...</p>
      </div>
    </div>
  )}
)

export default function NetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')
  const [has3DError, setHas3DError] = useState(false)

  const handle3DError = () => {
    setHas3DError(true)
    setViewMode('2d')
  }

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
              onClick={() => {
                if (!has3DError) setViewMode('3d')
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === '3d'
                  ? 'text-white'
                  : has3DError
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-orange-50'
              }`}
              style={viewMode === '3d' ? { background: '#FF6B8A' } : { color: '#8B7355' }}
              disabled={has3DError}
              title={has3DError ? '您的设备不支持 3D 视图' : ''}
            >
              3D {has3DError && '(不支持)'}
            </button>
          </div>
          
          <p className="text-sm hidden md:block ml-4" style={{ color: '#8B7355' }}>
            {viewMode === '3d'
              ? '拖拽旋转，滚轮缩放，双击节点跳转'
              : '拖拽节点调整布局，点击节点跳转，拖拽连线创建关联'}
          </p>
        </header>
        
        <div className="flex-1 relative">
          {viewMode === '3d' && !has3DError ? (
            <ErrorBoundary fallback={
              <div className="flex items-center justify-center h-full" style={{ background: '#FFF8F0' }}>
                <div className="text-center px-6">
                  <div className="text-5xl mb-4">🐶</div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#5D4E37' }}>
                    3D 视图加载失败
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#8B7355' }}>
                    已自动切换到 2D 视图
                  </p>
                  <button
                    onClick={() => setViewMode('2d')}
                    className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                    style={{ background: '#FF6B8A' }}
                  >
                    使用 2D 视图
                  </button>
                </div>
              </div>
            }>
              <Network3D onSwitchTo2D={handle3DError} />
            </ErrorBoundary>
          ) : (
            <NetworkGraph />
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
