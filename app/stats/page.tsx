'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/theme/GlassCard'
import { LoadingSpinner } from '@/components/animations/LoadingSpinner'
import { Menu, ArrowLeft, BarChart3, Hash, FileText, Tag, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalNodes: number
  totalContents: number
  totalEdges: number
  totalTags: number
  nodesBySystem: { name: string; color: string; count: number }[]
  recentNodes: { id: string; name: string; createdAt: string; type: string }[]
  nodesByType: { type: string; count: number }[]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StatsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const maxSystemCount = stats
    ? Math.max(...stats.nodesBySystem.map((s) => s.count), 1)
    : 1

  const typeLabels: Record<string, string> = {
    ROOT: '根系统',
    SYSTEM: '系统',
    SUBSYSTEM: '子系统',
    TOPIC: '主题',
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

          <Link
            href="/"
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={20} />
          </Link>

          <h1 className="font-semibold" style={{ color: 'var(--text-primary)' }}>系统统计</h1>

          <div className="flex-1" />

          <BarChart3 size={20} style={{ color: 'var(--accent-nebula)' }} />
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto relative z-10">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner />
              </div>
            ) : stats ? (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  <GlassCard hover={false} className="p-4 text-center">
                    <Hash size={20} className="mx-auto mb-2" style={{ color: 'var(--accent-nebula)' }} />
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stats.totalNodes}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      知识节点
                    </div>
                  </GlassCard>

                  <GlassCard hover={false} className="p-4 text-center">
                    <FileText size={20} className="mx-auto mb-2" style={{ color: 'var(--accent-aurora)' }} />
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stats.totalContents}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      内容笔记
                    </div>
                  </GlassCard>

                  <GlassCard hover={false} className="p-4 text-center">
                    <Tag size={20} className="mx-auto mb-2" style={{ color: 'var(--accent-warm)' }} />
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stats.totalTags}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      标签数量
                    </div>
                  </GlassCard>

                  <GlassCard hover={false} className="p-4 text-center">
                    <TrendingUp size={20} className="mx-auto mb-2" style={{ color: 'var(--accent-aurora)' }} />
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stats.recentNodes.length}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      近7天新增
                    </div>
                  </GlassCard>
                </div>

                {/* Nodes by system - bar chart */}
                <GlassCard hover={false} className="mb-6 p-4">
                  <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                    各系统节点数
                  </h3>
                  <div className="space-y-3">
                    {stats.nodesBySystem.map((sys) => (
                      <div key={sys.name} className="flex items-center gap-3">
                        <span
                          className="text-xs font-medium w-20 shrink-0 text-right"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {sys.name}
                        </span>
                        <div
                          className="flex-1 h-6 rounded-lg overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <div
                            className="h-full rounded-lg flex items-center pl-2 transition-all duration-500"
                            style={{
                              width: `${Math.max((sys.count / maxSystemCount) * 100, sys.count > 0 ? 8 : 0)}%`,
                              background: `linear-gradient(90deg, ${sys.color}, ${sys.color}cc)`,
                              opacity: 0.85,
                            }}
                          >
                            <span className="text-xs font-medium text-white">
                              {sys.count > 0 ? sys.count : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Nodes by type */}
                {stats.nodesByType.length > 0 && (
                  <GlassCard hover={false} className="mb-6 p-4">
                    <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                      节点类型分布
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.nodesByType.map((item) => (
                        <span
                          key={item.type}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: 'var(--text-secondary)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                          }}
                        >
                          {typeLabels[item.type] || item.type}
                          <span
                            className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] text-white"
                            style={{ background: 'var(--accent-nebula)' }}
                          >
                            {item.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Recent nodes */}
                <GlassCard hover={false} className="p-4">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Calendar size={16} style={{ color: 'var(--accent-aurora)' }} />
                    近7天新增节点
                  </h3>

                  {stats.recentNodes.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                      近7天暂无新增节点
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentNodes.map((node) => (
                        <Link
                          key={node.id}
                          href={`/node/${node.id}`}
                          className="block"
                        >
                          <GlassCard hover className="flex items-center justify-between p-3">
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                {node.name}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {typeLabels[node.type] || node.type}
                              </div>
                            </div>
                            <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(node.createdAt)}
                            </span>
                          </GlassCard>
                        </Link>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </>
            ) : (
              <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
                无法加载统计数据
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
