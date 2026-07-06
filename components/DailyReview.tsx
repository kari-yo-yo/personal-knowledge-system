'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/theme/GlassCard'

const moods = ['😊', '😔', '😤', '😰', '🥳', '😴']

export default function DailyReview() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [mood, setMood] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existing, setExisting] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/daily-summary?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.summary) {
          setExisting(data.summary)
          setMood(data.summary.mood || '')
          setContent(data.summary.content || '')
        } else {
          setExisting(null)
          setMood('')
          setContent('')
        }
        setSaved(false)
      })
  }, [date])

  const handleSubmit = async () => {
    if (!mood && !content) return
    setLoading(true)
    try {
      const res = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, mood, content }),
      })
      if (res.ok) {
        setSaved(true)
        setExisting({ date, mood, content })
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 relative z-10">
      <GlassCard hover={false} className="p-4">
        <div className="space-y-4">
          {/* 日期选择 */}
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="star-input w-full"
            />
          </div>

          {/* 心情 */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
              今日心情
            </label>
            <div className="flex gap-2 flex-wrap">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className="text-2xl p-2 rounded-lg transition-all"
                  style={{
                    background: mood === m ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: mood === m ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                    transform: mood === m ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              总结内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="今天学到了什么？有什么收获或反思？"
              className="star-input w-full resize-none"
            />
          </div>

          {/* 提交 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="glow-btn w-full"
          >
            {loading ? '保存中...' : saved ? '✅ 已保存' : existing ? '更新总结' : '保存总结'}
          </button>
        </div>
      </GlassCard>

      {/* 历史查看 */}
      {existing && (
        <GlassCard hover={false} className="p-4">
          <h3 className="font-medium text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            {date} 的总结
          </h3>
          {existing.mood && (
            <p className="text-2xl mb-2">{existing.mood}</p>
          )}
          {existing.content && (
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
              {existing.content}
            </p>
          )}
        </GlassCard>
      )}
    </div>
  )
}
