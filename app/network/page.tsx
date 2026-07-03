'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NetworkGraph } from '@/components/network/NetworkGraph'
import { Menu, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          
          <p className="text-sm hidden sm:block" style={{ color: '#8B7355' }}>
            拖拽节点调整布局，点击节点跳转，拖拽连线创建关联
          </p>
        </header>
        
        <div className="flex-1 relative">
          <NetworkGraph />
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
