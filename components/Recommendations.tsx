'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/theme/GlassCard'
import { Sparkles, ArrowRight } from 'lucide-react'

interface RecommendationItem {
  nodeId: string
  nodeName: string
  reason: string
  score: number
}

interface RecommendationsProps {
  nodeId: string
  title?: string
}

export function Recommendations({ nodeId, title = '知识关联' }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/recommendations?nodeId=${encodeURIComponent(nodeId)}&limit=5`)
      .then((res) => res.json())
      .then((data) => {
        setRecommendations(data.recommendations || [])
      })
      .catch(() => {
        setRecommendations([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [nodeId])

  if (loading) {
    return (
      <GlassCard hover={false} className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} style={{ color: 'var(--accent-aurora)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            正在发现关联...
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl animate-pulse"
              style={{
                background: 'linear-gradient(90deg, rgba(139,92,246,0.08) 25%, rgba(6,182,212,0.08) 50%, rgba(139,92,246,0.08) 75%)',
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      </GlassCard>
    )
  }

  if (recommendations.length === 0) {
    return (
      <GlassCard hover={false} className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} style={{ color: 'var(--accent-aurora)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            知识关联
          </h3>
        </div>
        <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>
          暂无关联推荐，多添加一些知识点吧~
        </p>
      </GlassCard>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.6) return 'var(--accent-warm)'
    if (score >= 0.3) return 'var(--accent-aurora)'
    return 'var(--accent-nebula)'
  }

  return (
    <GlassCard hover={false} className="mb-6 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} style={{ color: 'var(--accent-aurora)' }} />
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          知识关联
        </h3>
      </div>

      <div className="space-y-2">
        {recommendations.map((item, index) => (
          <Link
            key={item.nodeId}
            href={`/node/${item.nodeId}`}
            className="block p-3 rounded-xl border transition-all duration-200 hover:shadow-md group"
            style={{
              borderColor: 'var(--glass-border)',
              background: 'rgba(255,255,255,0.02)',
              animation: `recSlideUp 0.4s ease-out ${index * 80}ms both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border-hover)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.nodeName}
                  </span>
                </div>
                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                  {item.reason}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Score progress bar */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-16 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--glass-border)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(item.score * 100)}%`,
                        background: getScoreColor(item.score),
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium tabular-nums"
                    style={{ color: getScoreColor(item.score) }}
                  >
                    {Math.round(item.score * 100)}%
                  </span>
                </div>

                <ArrowRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </GlassCard>
  )
}
