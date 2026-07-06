'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/theme/GlassCard'
import { WeatherWidget } from '@/components/weather/WeatherWidget'
import { Recommendations } from '@/components/Recommendations'
import { QuickNoteModal } from '@/components/QuickNoteModal'
import { Menu, Plus, Search, Network, BookOpen, Settings, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Node, DailySummary } from '@/lib/types'

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function HomePage() {
  const user = { id: 'default-user', username: '我' }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [systems, setSystems] = useState<Node[]>([])
  const [rootId, setRootId] = useState<string | null>(null)
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null)
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
  const [showGearMenu, setShowGearMenu] = useState(false)

  useEffect(() => {
    fetch('/api/nodes')
      .then((res) => res.json())
      .then((data) => {
        const root = data.nodes?.[0]
        if (root) {
          setRootId(root.id)
          setSystems(root.children || [])
        }
      })
    fetch(`/api/daily-summary?date=${getTodayStr()}`)
      .then((res) => res.json())
      .then((data) => {
        setTodaySummary(data.summary || null)
      })
  }, [])

  const sysMeta: Record<string, { color: string; desc: string }> = {
    '学习系统': { color: 'bg-blue-500/20 text-blue-300', desc: '知识、方法、改错' },
    '性格系统': { color: 'bg-green-500/20 text-green-300', desc: '性格认知与不足' },
    '人际交往系统': { color: 'bg-yellow-500/20 text-yellow-300', desc: '交往能力与方法' },
    '安全系统': { color: 'bg-red-500/20 text-red-300', desc: '安全常识' },
    '目标愿望系统': { color: 'bg-purple-500/20 text-purple-300', desc: '目标与愿望追踪' },
    '灵感系统': { color: 'bg-orange-500/20 text-orange-300', desc: '随手记录灵感' },
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-deep)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header
          className="h-14 border-b flex items-center gap-3 px-4 backdrop-blur-xl"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Menu size={20} />
          </button>

          <h1 className="font-semibold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
            个人成长总系统
          </h1>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="搜索知识..."
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm star-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <WeatherWidget />

            <Link
              href="/network"
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="网络视图"
            >
              <Network size={20} />
            </Link>
            <Link
              href="/stats"
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="统计"
            >
              <BarChart3 size={20} />
            </Link>

            {/* Gear menu */}
            <div className="relative">
              <button
                onClick={() => setShowGearMenu(!showGearMenu)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="数据管理"
              >
                <Settings size={20} />
              </button>
              {showGearMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowGearMenu(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 border rounded-lg shadow-lg z-50 min-w-[140px] py-1 backdrop-blur-xl"
                    style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      borderColor: 'var(--glass-border)',
                    }}
                  >
                    <button
                      onClick={async () => {
                        setShowGearMenu(false)
                        try {
                          const res = await fetch('/api/export')
                          const data = await res.json()
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `knowledge-export-${new Date().toISOString().split('T')[0]}.json`
                          a.click()
                          URL.revokeObjectURL(url)
                        } catch {
                          alert('导出失败')
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      导出数据
                    </button>
                    <label
                      className="block w-full text-left px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      导入数据
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={async (e) => {
                          setShowGearMenu(false)
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const text = await file.text()
                            const data = JSON.parse(text)
                            const res = await fetch('/api/import', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(data),
                            })
                            const result = await res.json()
                            alert(result.message || '导入完成')
                          } catch {
                            alert('导入失败，请确保文件格式正确')
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setQuickNoteOpen(true)}
              className="glow-btn p-2"
              title="灵感速记"
            >
              <Plus size={20} />
            </button>

            <div className="flex items-center gap-2 ml-1">
              <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                {user.username}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center mb-6">
              <img
                src="/pups/pup-wave.svg"
                alt="小狗向你挥手"
                className="puppy-float puppy-dark max-w-[120px] md:max-w-[150px] h-auto"
              />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
              欢迎回来~ 今天的你也在进步哦
            </h2>
            <p className="text-center mb-6" style={{ color: 'var(--text-muted)' }}>
              点击卡片进入各系统，左侧导航栏查看完整层级，用"+"按钮快速记录灵感吧~
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Link
                href="/import"
                className="block"
              >
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2">
                    <img src="/pups/pup-write.svg" alt="write" className="w-10 h-10 puppy-dark" />
                    <div>
                      <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>笔记导入</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>拖拽上传自动归档</p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
              <Link
                href="/feynman"
                className="block"
              >
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2">
                    <img src="/pups/pup-think.svg" alt="think" className="w-10 h-10 puppy-dark" />
                    <div>
                      <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>费曼卡片</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>一句话讲清楚</p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </div>

            <Link
              href="/daily"
              className="block mb-6"
            >
              <GlassCard
                className="p-4"
                hover
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: todaySummary ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    }}
                  >
                    {todaySummary ? (
                      <span className="text-2xl">{todaySummary.mood}</span>
                    ) : (
                      <img src="/pups/pup-sleep.svg" alt="小狗在等你" className="w-8 h-8 puppy-dark" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-medium"
                      style={{ color: todaySummary ? 'rgba(134, 239, 172, 0.9)' : 'rgba(253, 224, 71, 0.9)' }}
                    >
                      {todaySummary ? '今日总结已完成' : '今日尚未总结'}
                    </h3>
                    <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                      {todaySummary
                        ? (todaySummary.content
                            ? todaySummary.content.slice(0, 40) + (todaySummary.content.length > 40 ? '...' : '')
                            : '继续保持，每天都有进步')
                        : '点击此处记录今天的收获与反思'}
                    </p>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium shrink-0"
                    style={{
                      background: todaySummary ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: todaySummary ? 'rgba(134, 239, 172, 0.9)' : 'rgba(253, 224, 71, 0.9)',
                    }}
                  >
                    {todaySummary ? '✅ 已总结' : '📝 去总结'}
                  </span>
                </div>
              </GlassCard>
            </Link>

            {rootId && (
              <Recommendations nodeId={rootId} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {systems.map((sys) => {
                const meta = sysMeta[sys.name] || { color: 'bg-white/10 text-white/70', desc: '' }
                return (
                  <Link
                    key={sys.id}
                    href={`/node/${sys.id}`}
                    className="block"
                  >
                    <GlassCard className="p-4 cursor-pointer block">
                      <h3 className={`inline-block px-2 py-1 rounded text-sm font-medium ${meta.color}`}>
                        {sys.name}
                      </h3>
                      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{meta.desc}</p>
                      <span className="text-xs mt-1 inline-block opacity-60">🐾</span>
                    </GlassCard>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <QuickNoteModal isOpen={quickNoteOpen} onClose={() => setQuickNoteOpen(false)} />
    </div>
  )
}
