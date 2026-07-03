'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Menu, ArrowLeft, Send, RotateCcw, Star } from 'lucide-react'
import Link from 'next/link'

export default function FeynmanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [concept, setConcept] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])

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

  const handleReset = () => {
    setConcept('')
    setExplanation('')
    setResult(null)
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
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="例如：复利、熵增、区块链..."
                    className="w-full px-4 py-3 bg-[#FFF8F0] border border-[#F0E6D8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B8A]/50 text-[#5D4E37]"
                  />
                </div>

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
