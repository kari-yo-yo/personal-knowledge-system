'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Menu, Plus, Search, Network } from 'lucide-react'
import Link from 'next/link'
import { Node } from '@/lib/types'

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [systems, setSystems] = useState<Node[]>([])

  useEffect(() => {
    fetch('/api/nodes')
      .then((res) => res.json())
      .then((data) => {
        const rootChildren = data.nodes?.[0]?.children || []
        setSystems(rootChildren)
      })
  }, [])

  const sysMeta: Record<string, { color: string; desc: string }> = {
    '学习系统': { color: 'bg-blue-100 text-blue-700', desc: '知识、方法、改错' },
    '性格系统': { color: 'bg-green-100 text-green-700', desc: '性格认知与不足' },
    '人际交往系统': { color: 'bg-yellow-100 text-yellow-700', desc: '交往能力与方法' },
    '安全系统': { color: 'bg-red-100 text-red-700', desc: '安全常识' },
    '目标愿望系统': { color: 'bg-purple-100 text-purple-700', desc: '目标与愿望追踪' },
    '灵感系统': { color: 'bg-orange-100 text-orange-700', desc: '随手记录灵感' },
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded"
          >
            <Menu size={20} />
          </button>
          
          <h1 className="font-semibold text-slate-800 hidden sm:block">个人成长总系统</h1>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索知识..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/network"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              title="网络视图"
            >
              <Network size={20} />
            </Link>
            <Link
              href="/inspiration"
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Plus size={20} />
            </Link>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">欢迎来到个人成长知识管理系统</h2>
            <p className="text-slate-600 mb-6">
              点击卡片进入各系统，左侧导航栏查看完整层级，"+"按钮快速添加内容。
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {systems.map((sys) => {
                const meta = sysMeta[sys.name] || { color: 'bg-slate-100 text-slate-700', desc: '' }
                return (
                  <Link
                    key={sys.id}
                    href={`/node/${sys.id}`}
                    className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer block"
                  >
                    <h3 className={`inline-block px-2 py-1 rounded text-sm font-medium ${meta.color}`}>
                      {sys.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">{meta.desc}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
