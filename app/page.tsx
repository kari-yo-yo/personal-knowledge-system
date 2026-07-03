'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/components/auth/AuthContext'
import { Menu, Plus, Search, Network, BookOpen, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Node } from '@/lib/types'

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function HomePage() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [systems, setSystems] = useState<Node[]>([])
  const [todaySummary, setTodaySummary] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/nodes')
      .then((res) => res.json())
      .then((data) => {
        const rootChildren = data.nodes?.[0]?.children || []
        setSystems(rootChildren)
      })
    fetch(`/api/daily-summary?date=${getTodayStr()}`)
      .then((res) => res.json())
      .then((data) => {
        setTodaySummary(!!data.summary)
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
          
          <h1 className="font-semibold hidden sm:block" style={{ color: '#5D4E37' }}>个人成长总系统</h1>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索知识..."
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ background: '#FFF0E6' }}
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
              className="p-2 hover:bg-orange-50 rounded-lg text-slate-600"
              title="网络视图"
            >
              <Network size={20} />
            </Link>
            <Link
              href="/inspiration"
              className="p-2 text-white rounded-lg"
              style={{ background: '#FF6B8A' }}
            >
              <Plus size={20} />
            </Link>

            {user && (
              <div className="flex items-center gap-2 ml-1">
                <span className="text-sm font-medium hidden sm:block" style={{ color: '#5D4E37' }}>
                  {user.username}
                </span>
                <button
                  onClick={logout}
                  className="p-2 hover:bg-orange-50 rounded-lg text-slate-500"
                  title="退出登录"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center mb-6">
              <img
                src="/pups/pup-wave.svg"
                alt="小狗向你挥手"
                className="puppy-float max-w-[120px] md:max-w-[150px] h-auto"
              />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2" style={{ color: '#5D4E37' }}>
              欢迎回来~ 今天的你也在进步哦
            </h2>
            <p className="text-center mb-6" style={{ color: '#8B7355' }}>
              点击卡片进入各系统，左侧导航栏查看完整层级，用"+"按钮快速记录灵感吧~
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Link
                href="/import"
                className="block p-4 rounded-2xl border bg-white hover:shadow-md transition-shadow"
                style={{ borderColor: '#F0E6D8' }}
              >
                <div className="flex items-center gap-2">
                  <img src="/pups/pup-write.svg" alt="write" className="w-10 h-10" />
                  <div>
                    <h3 className="font-medium text-[#5D4E37] text-sm">笔记导入</h3>
                    <p className="text-xs text-[#8B7D6B]">拖拽上传自动归档</p>
                  </div>
                </div>
              </Link>
              <Link
                href="/feynman"
                className="block p-4 rounded-2xl border bg-white hover:shadow-md transition-shadow"
                style={{ borderColor: '#F0E6D8' }}
              >
                <div className="flex items-center gap-2">
                  <img src="/pups/pup-think.svg" alt="think" className="w-10 h-10" />
                  <div>
                    <h3 className="font-medium text-[#5D4E37] text-sm">费曼卡片</h3>
                    <p className="text-xs text-[#8B7D6B]">一句话讲清楚</p>
                  </div>
                </div>
              </Link>
            </div>

            <Link
              href="/daily"
              className={`block mb-6 p-4 rounded-2xl border transition-shadow hover:shadow-md ${
                todaySummary === false
                  ? 'bg-pink-50 border-pink-200'
                  : todaySummary === true
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  todaySummary === false ? 'bg-pink-100 text-pink-600' :
                  todaySummary === true ? 'bg-green-100 text-green-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {todaySummary === false ? (
                    <img src="/pups/pup-sleep.svg" alt="小狗在等你" className="w-8 h-8" />
                  ) : todaySummary === true ? (
                    <img src="/pups/pup-happy.svg" alt="小狗很开心" className="w-8 h-8" />
                  ) : (
                    <BookOpen size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    todaySummary === false ? 'text-pink-800' :
                    todaySummary === true ? 'text-green-800' :
                    'text-slate-800'
                  }`}>
                    {todaySummary === false ? '今日尚未总结' :
                     todaySummary === true ? '今日总结已完成' :
                     '每日总结'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {todaySummary === false ? '点击此处记录今天的收获与反思' :
                     todaySummary === true ? '继续保持，每天都有进步' :
                     '记录每日成长'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  todaySummary === false ? 'bg-pink-200 text-pink-700' :
                  todaySummary === true ? 'bg-green-200 text-green-700' :
                  'bg-orange-200 text-orange-700'
                }`}>
                  {todaySummary === false ? '待完成' :
                   todaySummary === true ? '已完成' :
                   '去记录'}
                </span>
              </div>
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {systems.map((sys) => {
                const meta = sysMeta[sys.name] || { color: 'bg-slate-100 text-slate-700', desc: '' }
                return (
                  <Link
                    key={sys.id}
                    href={`/node/${sys.id}`}
                    className="bg-white rounded-2xl p-4 border hover:shadow-md transition-shadow cursor-pointer block"
                    style={{ borderColor: '#F0E6D8' }}
                  >
                    <h3 className={`inline-block px-2 py-1 rounded text-sm font-medium ${meta.color}`}>
                      {sys.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">{meta.desc}</p>
                    <span className="text-xs mt-1 inline-block opacity-60">🐾</span>
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
