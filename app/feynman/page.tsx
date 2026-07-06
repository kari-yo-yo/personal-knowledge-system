'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/theme/GlassCard'
import { Menu, ArrowLeft, Send, RotateCcw, Star, BookOpen, CheckCircle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface ComparisonItem {
  original: string
  suggestion: string
  reason: string
}

interface FeynmanResult {
  score: number
  level: string
  feedback: string[]
  improvedVersion: string
  comparison: ComparisonItem[]
  memoryTip: string
  realLifeExample?: string
  commonMisconceptions?: string[]
  domain?: string
  domainSpecificFeedback?: string[]
}

interface StandardResult {
  concept: string
  explanation: string
  keyPoints: string[]
  realLifeExample?: string
  commonMisconceptions?: string[]
}

export default function FeynmanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [concept, setConcept] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FeynmanResult | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [standardLoading, setStandardLoading] = useState(false)
  const [standardAnswer, setStandardAnswer] = useState<StandardResult | null>(null)
  const [showStandard, setShowStandard] = useState(false)
  const [showComparison, setShowComparison] = useState(true)

  const handleSubmit = async () => {
    if (!concept.trim() || !explanation.trim()) return
    setLoading(true)
    const res = await fetch('/api/feynman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept, explanation }),
    })
    const data = await res.json()
    setResult(data.result)
    setHistory((prev) => [{ concept, explanation, ...data.result }, ...prev].slice(0, 10))
    setLoading(false)
  }

  const handleFetchStandard = async () => {
    if (!concept.trim()) return
    setStandardLoading(true)
    const res = await fetch('/api/feynman/standard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept }),
    })
    const data = await res.json()
    setStandardAnswer(data.result)
    setShowStandard(true)
    setStandardLoading(false)
  }

  const handleAdopt = () => {
    if (result?.improvedVersion) {
      setExplanation(result.improvedVersion)
      setResult(null)
    }
  }

  const handleReset = () => {
    setConcept('')
    setExplanation('')
    setResult(null)
    setStandardAnswer(null)
    setShowStandard(false)
  }

  const scoreColor = (s: number) => {
    if (s >= 9) return 'text-[#FF6B8A]'
    if (s >= 7) return 'text-[#FFB347]'
    if (s >= 5) return 'text-[#FFD93D]'
    return 'text-[#06B6D4]'
  }

  const scoreBg = (s: number) => {
    if (s >= 9) return 'bg-[#FF6B8A]/10'
    if (s >= 7) return 'bg-[#FFB347]/10'
    if (s >= 5) return 'bg-[#FFD93D]/10'
    return 'bg-[#06B6D4]/10'
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
          <h1 className="font-semibold" style={{ color: 'var(--text-primary)' }}>费曼学习卡片</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="max-w-xl mx-auto space-y-4 relative z-10">
            <div className="text-center mb-4">
              <img
                src="/pups/pup-think.svg"
                alt="think pup"
                className="w-28 h-28 mx-auto puppy-float puppy-dark"
              />
              <h2 className="text-lg font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
                你能一句话讲清楚吗？
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                选一个概念，用最通俗的语言解释它，小狗会帮你打分
              </p>
            </div>

            {!result ? (
              <div className="space-y-4">
                <GlassCard hover={false} className="p-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    你要解释什么概念？
                  </label>
                  <input
                    value={concept}
                    onChange={(e) => {
                      setConcept(e.target.value)
                      setStandardAnswer(null)
                      setShowStandard(false)
                    }}
                    placeholder="例如：复利、熵增、区块链..."
                    className="w-full star-input"
                  />
                  {concept.trim() && (
                    <button
                      onClick={handleFetchStandard}
                      disabled={standardLoading}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium transition-colors"
                      style={{ color: 'var(--accent-warm)' }}
                    >
                      <BookOpen size={14} />
                      {standardLoading ? '加载中...' : '查看标准答案'}
                    </button>
                  )}
                </GlassCard>

                {showStandard && standardAnswer && (
                  <GlassCard hover={false} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        <BookOpen size={16} style={{ color: 'var(--accent-warm)' }} />
                        标准答案参考
                      </h3>
                      <button
                        onClick={() => setShowStandard(false)}
                        className="text-xs transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        收起
                      </button>
                    </div>
                    <p
                      className="text-sm leading-relaxed rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                    >
                      {standardAnswer.explanation}
                    </p>
                    {standardAnswer.realLifeExample && (
                      <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: 'rgba(134, 239, 172, 0.9)' }}>💡 生活实例</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{standardAnswer.realLifeExample}</p>
                      </div>
                    )}
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>关键要点：</p>
                      <div className="space-y-1.5">
                        {standardAnswer.keyPoints.map((point, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                            <span className="font-bold shrink-0" style={{ color: 'var(--accent-warm)' }}>{i + 1}.</span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {standardAnswer.commonMisconceptions && standardAnswer.commonMisconceptions.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255, 152, 0, 0.1)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: 'rgba(253, 186, 116, 0.9)' }}>⚠️ 常见误区</p>
                        <div className="space-y-1">
                          {standardAnswer.commonMisconceptions.map((m, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-primary)' }}>
                              <span className="shrink-0" style={{ color: 'rgba(253, 186, 116, 0.9)' }}>&#9679;</span>
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </GlassCard>
                )}

                <GlassCard hover={false} className="p-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    用一句话讲给奶奶听
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="试着用类比、举例的方式，不用专业术语..."
                    className="w-full h-28 resize-none star-input"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{explanation.length} 字</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>建议 50-150 字</span>
                  </div>
                </GlassCard>

                <button
                  onClick={handleSubmit}
                  disabled={!concept.trim() || !explanation.trim() || loading}
                  className="glow-btn w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                >
                  {loading ? '小狗评分中...' : (
                    <><Send size={18} /> 提交让小狗打分</>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <GlassCard
                  hover={false}
                  className={`p-5 text-center ${scoreBg(result.score)}`}
                >
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={24}
                        className={s * 2 <= result.score ? scoreColor(result.score) : ''}
                        style={s * 2 <= result.score ? {} : { color: 'var(--glass-border)' }}
                        fill={s * 2 <= result.score ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <div className={`text-4xl font-bold ${scoreColor(result.score)}`}>
                    {result.score}<span className="text-lg" style={{ color: 'var(--text-muted)' }}>/10</span>
                  </div>
                  <div className="text-lg font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                    {result.level}
                  </div>
                  {result.score >= 9 && (
                    <img src="/pups/pup-happy.svg" alt="happy" className="w-20 h-20 mx-auto mt-2 puppy-float puppy-dark" />
                  )}
                  {result.score < 5 && (
                    <img src="/pups/pup-sleep.svg" alt="sleep" className="w-20 h-20 mx-auto mt-2 puppy-dark" />
                  )}
                </GlassCard>

                <GlassCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>小狗的反馈</h3>
                    {result.domain && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(255, 107, 138, 0.15)', color: 'var(--accent-warm)' }}
                      >
                        {result.domain}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {result.feedback.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--accent-aurora)' }}>🐾</span>
                        {f}
                      </div>
                    ))}
                  </div>
                  {result.domainSpecificFeedback && result.domainSpecificFeedback.length > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <p className="text-xs font-medium mb-2" style={{ color: 'var(--accent-warm)' }}>领域专属建议</p>
                      {result.domainSpecificFeedback.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--accent-nebula)' }}>&#9733;</span>
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>

                {/* 修改建议 */}
                <GlassCard hover={false} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      <CheckCircle size={16} style={{ color: 'var(--accent-warm)' }} />
                      修改建议
                    </h3>
                    <button
                      onClick={handleAdopt}
                      className="glow-btn text-xs flex items-center gap-1 px-2.5 py-1.5"
                    >
                      <CheckCircle size={12} />
                      采纳修改
                    </button>
                  </div>
                  <p
                    className="text-sm leading-relaxed rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                  >
                    {result.improvedVersion}
                  </p>
                </GlassCard>

                {/* 对比学习 */}
                {result.comparison.length > 0 && (
                  <GlassCard hover={false} className="p-4">
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className="w-full flex items-center justify-between mb-2"
                    >
                      <h3 className="font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        <Lightbulb size={16} style={{ color: 'var(--accent-aurora)' }} />
                        对比学习
                      </h3>
                      {showComparison ? (
                        <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                      ) : (
                        <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </button>
                    {showComparison && (
                      <div className="space-y-3">
                        {result.comparison.map((item, i) => (
                          <div
                            key={i}
                            className="rounded-xl overflow-hidden"
                            style={{ border: '1px solid var(--glass-border)' }}
                          >
                            <div className="px-3 py-2 text-xs font-medium" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>你的原文</div>
                            <div className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{item.original}</div>
                            <div className="px-3 py-2 text-xs font-medium" style={{ background: 'rgba(139, 92, 246, 0.08)', color: 'var(--accent-nebula)' }}>建议改为</div>
                            <div className="px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{item.suggestion}</div>
                            <div className="px-3 py-2 text-xs" style={{ background: 'rgba(6, 182, 212, 0.08)', color: 'var(--text-primary)' }}>
                              <span className="font-medium">原因：</span>{item.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                )}

                {/* 生活实例 */}
                {result.realLifeExample && (
                  <GlassCard hover={false} className="p-4">
                    <h3 className="font-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      <Lightbulb size={16} style={{ color: 'rgba(134, 239, 172, 0.9)' }} />
                      生活实例
                    </h3>
                    <p
                      className="text-sm leading-relaxed rounded-xl p-3"
                      style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--text-primary)' }}
                    >
                      {result.realLifeExample}
                    </p>
                  </GlassCard>
                )}

                {/* 常见误区 */}
                {result.commonMisconceptions && result.commonMisconceptions.length > 0 && (
                  <GlassCard hover={false} className="p-4">
                    <h3 className="font-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      <Star size={16} style={{ color: 'rgba(253, 186, 116, 0.9)' }} />
                      常见误区
                    </h3>
                    <div className="space-y-2">
                      {result.commonMisconceptions.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                          <span className="shrink-0" style={{ color: 'rgba(253, 186, 116, 0.9)' }}>{i + 1}.</span>
                          {m}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* 记忆口诀 */}
                <GlassCard hover={false} className="p-4">
                  <h3 className="font-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Star size={16} style={{ color: 'var(--accent-aurora)' }} />
                    记忆口诀
                  </h3>
                  <p
                    className="text-sm leading-relaxed rounded-xl p-3 font-medium"
                    style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                  >
                    {result.memoryTip}
                  </p>
                </GlassCard>

                <GlassCard hover={false} className="p-4">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>你的解释</span>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{explanation}</p>
                </GlassCard>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <RotateCcw size={18} /> 再来一张
                </button>
              </div>
            )}

            {history.length > 0 && !result && (
              <GlassCard hover={false} className="p-4">
                <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>历史记录</h3>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <span className={`text-lg font-bold ${scoreColor(h.score)}`}>{h.score}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{h.concept}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{h.explanation}</p>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{h.level}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
