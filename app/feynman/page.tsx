'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
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
}

interface StandardResult {
  concept: string
  explanation: string
  keyPoints: string[]
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
    return 'text-[#A8D8EA]'
  }

  const scoreBg = (s: number) => {
    if (s >= 9) return 'bg-[#FF6B8A]/10'
    if (s >= 7) return 'bg-[#FFB347]/10'
    if (s >= 5) return 'bg-[#FFD93D]/10'
    return 'bg-[#A8D8EA]/10'
  }

  return (
    <div className="flex h-screen bg-[#FFF8F0]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-[#F0E6D8] flex items-center gap-3 px-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-[#FFF0E6] rounded">
            <Menu size={20} />
          </button>
          <Link href="/" className="p-2 hover:bg-[#FFF0E6] rounded">
            <ArrowLeft size={20} className="text-[#5D4E37]" />
          </Link>
          <h1 className="font-semibold text-[#5D4E37]">费曼学习卡片</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="max-w-xl mx-auto space-y-4">

            <div className="text-center mb-4">
              <img src="/pups/pup-think.svg" alt="think pup" className="w-28 h-28 mx-auto puppy-float" />
              <h2 className="text-lg font-semibold text-[#5D4E37] mt-2">你能一句话讲清楚吗？</h2>
              <p className="text-sm text-[#8B7D6B]">选一个概念，用最通俗的语言解释它，小狗会帮你打分</p>
            </div>

            {!result ? (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                  <label className="block text-sm font-medium text-[#5D4E37] mb-2">
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
                    className="w-full px-4 py-3 bg-[#FFF8F0] border border-[#F0E6D8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B8A]/50 text-[#5D4E37]"
                  />
                  {concept.trim() && (
                    <button
                      onClick={handleFetchStandard}
                      disabled={standardLoading}
                      className="mt-2 flex items-center gap-1.5 text-xs text-[#FF6B8A] hover:text-[#FF5277] font-medium"
                    >
                      <BookOpen size={14} />
                      {standardLoading ? '加载中...' : '查看标准答案'}
                    </button>
                  )}
                </div>

                {showStandard && standardAnswer && (
                  <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-[#5D4E37] flex items-center gap-1.5">
                        <BookOpen size={16} className="text-[#FF6B8A]" />
                        标准答案参考
                      </h3>
                      <button
                        onClick={() => setShowStandard(false)}
                        className="text-xs text-[#8B7D6B] hover:text-[#5D4E37]"
                      >
                        收起
                      </button>
                    </div>
                    <p className="text-sm text-[#5D4E37] leading-relaxed bg-[#FFF8F0] rounded-xl p-3">
                      {standardAnswer.explanation}
                    </p>
                    <div className="mt-3">
                      <p className="text-xs font-medium text-[#8B7D6B] mb-1.5">关键要点：</p>
                      <div className="space-y-1.5">
                        {standardAnswer.keyPoints.map((point, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-[#5D4E37]">
                            <span className="text-[#FF6B8A] font-bold shrink-0">{i + 1}.</span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                  <label className="block text-sm font-medium text-[#5D4E37] mb-2">
                    用一句话讲给奶奶听
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="试着用类比、举例的方式，不用专业术语..."
                    className="w-full h-28 p-3 bg-[#FFF8F0] border border-[#F0E6D8] rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B8A]/50 text-[#5D4E37]"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-[#8B7D6B]">{explanation.length} 字</span>
                    <span className="text-xs text-[#8B7D6B]">建议 50-150 字</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!concept.trim() || !explanation.trim() || loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6B8A] hover:bg-[#FF5277] disabled:opacity-50 text-white rounded-xl font-medium"
                >
                  {loading ? '小狗评分中...' : (
                    <><Send size={18} /> 提交让小狗打分</>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-2xl border border-[#F0E6D8] p-5 text-center ${scoreBg(result.score)}`}>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={24}
                        className={s * 2 <= result.score ? scoreColor(result.score) : 'text-[#F0E6D8]'}
                        fill={s * 2 <= result.score ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <div className={`text-4xl font-bold ${scoreColor(result.score)}`}>
                    {result.score}<span className="text-lg text-[#8B7D6B]">/10</span>
                  </div>
                  <div className="text-lg font-medium text-[#5D4E37] mt-1">
                    {result.level}
                  </div>
                  {result.score >= 9 && (
                    <img src="/pups/pup-happy.svg" alt="happy" className="w-20 h-20 mx-auto mt-2 puppy-float" />
                  )}
                  {result.score < 5 && (
                    <img src="/pups/pup-sleep.svg" alt="sleep" className="w-20 h-20 mx-auto mt-2" />
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                  <h3 className="font-medium text-[#5D4E37] mb-3">小狗的反馈</h3>
                  <div className="space-y-2">
                    {result.feedback.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-[#5D4E37]">
                        <span className="text-[#FFD93D]">🐾</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 修改建议 */}
                <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-[#5D4E37] flex items-center gap-1.5">
                      <CheckCircle size={16} className="text-[#FF6B8A]" />
                      修改建议
                    </h3>
                    <button
                      onClick={handleAdopt}
                      className="text-xs flex items-center gap-1 px-2.5 py-1.5 bg-[#FF6B8A] hover:bg-[#FF5277] text-white rounded-lg font-medium"
                    >
                      <CheckCircle size={12} />
                      采纳修改
                    </button>
                  </div>
                  <p className="text-sm text-[#5D4E37] leading-relaxed bg-[#FFF8F0] rounded-xl p-3">
                    {result.improvedVersion}
                  </p>
                </div>

                {/* 对比学习 */}
                {result.comparison.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className="w-full flex items-center justify-between mb-2"
                    >
                      <h3 className="font-medium text-[#5D4E37] flex items-center gap-1.5">
                        <Lightbulb size={16} className="text-[#FFB347]" />
                        对比学习
                      </h3>
                      {showComparison ? <ChevronUp size={16} className="text-[#8B7D6B]" /> : <ChevronDown size={16} className="text-[#8B7D6B]" />}
                    </button>
                    {showComparison && (
                      <div className="space-y-3">
                        {result.comparison.map((item, i) => (
                          <div key={i} className="rounded-xl border border-[#F0E6D8] overflow-hidden">
                            <div className="bg-[#FFF8F0] px-3 py-2 text-xs font-medium text-[#8B7D6B]">你的原文</div>
                            <div className="px-3 py-2 text-sm text-[#5D4E37]">{item.original}</div>
                            <div className="bg-[#FF6B8A]/5 px-3 py-2 text-xs font-medium text-[#FF6B8A]">建议改为</div>
                            <div className="px-3 py-2 text-sm text-[#5D4E37]">{item.suggestion}</div>
                            <div className="bg-[#A8D8EA]/10 px-3 py-2 text-xs text-[#5D4E37]">
                              <span className="font-medium">原因：</span>{item.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 记忆口诀 */}
                <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                  <h3 className="font-medium text-[#5D4E37] mb-2 flex items-center gap-1.5">
                    <Star size={16} className="text-[#FFD93D]" />
                    记忆口诀
                  </h3>
                  <p className="text-sm text-[#5D4E37] leading-relaxed bg-[#FFF8F0] rounded-xl p-3 font-medium">
                    {result.memoryTip}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                  <span className="text-xs text-[#8B7D6B]">你的解释</span>
                  <p className="text-sm text-[#5D4E37] mt-1">{explanation}</p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-[#F0E6D8] hover:bg-[#FFF0E6] text-[#5D4E37] rounded-xl font-medium"
                >
                  <RotateCcw size={18} /> 再来一张
                </button>
              </div>
            )}

            {history.length > 0 && !result && (
              <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                <h3 className="font-medium text-[#5D4E37] mb-3">历史记录</h3>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-[#FFF8F0] rounded-lg">
                      <span className={`text-lg font-bold ${scoreColor(h.score)}`}>{h.score}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#5D4E37] truncate">{h.concept}</p>
                        <p className="text-xs text-[#8B7D6B] truncate">{h.explanation}</p>
                      </div>
                      <span className="text-xs text-[#8B7D6B] shrink-0">{h.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
