'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Menu, ArrowLeft, Save, Calendar } from 'lucide-react'
import Link from 'next/link'

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function DailyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [date, setDate] = useState(getTodayStr())
  const [highlights, setHighlights] = useState('')
  const [reflections, setReflections] = useState('')
  const [improvements, setImprovements] = useState('')
  const [mood, setMood] = useState(3)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setSaved(false)
    fetch(`/api/daily-summary?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.summary) {
          setHighlights(data.summary.highlights || '')
          setReflections(data.summary.reflections || '')
          setImprovements(data.summary.improvements || '')
          setMood(data.summary.mood || 3)
        } else {
          setHighlights('')
          setReflections('')
          setImprovements('')
          setMood(3)
        }
        setLoading(false)
      })
  }, [date])

  const handleSave = async () => {
    await fetch('/api/daily-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        highlights,
        reflections,
        improvements,
        mood,
      }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const moodLabels = ['很差', '较差', '一般', '不错', '很好']

  return (
    <div className="flex h-screen" style={{ background: '#FFF8F0' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b flex items-center gap-3 px-4" style={{ borderColor: '#F0E6D8' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-orange-50 rounded">
            <Menu size={20} />
          </button>
          <Link href="/" className="p-2 hover:bg-orange-50 rounded">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="font-semibold" style={{ color: '#5D4E37' }}>每日总结</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="max-w-xl mx-auto space-y-4">

            <div className="flex flex-col items-center mb-2">
              <img
                src="/pups/pup-sleep.svg"
                alt="安静写总结的小狗"
                className="puppy-float max-w-[120px] md:max-w-[150px] h-auto"
              />
              <p className="text-sm mt-2" style={{ color: '#8B7355' }}>记录今天的点滴，小狗陪你一起成长~</p>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#F0E6D8' }}
              />
              {date === getTodayStr() && (
                <span className="px-2 py-1 text-xs rounded-full" style={{ background: '#FFD93D', color: '#5D4E37' }}>今天</span>
              )}
            </div>

            {loading ? (
              <div className="text-center text-slate-500 py-8">加载中...</div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#F0E6D8' }}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5D4E37' }}>今日亮点 / 收获</label>
                  <textarea
                    value={highlights}
                    onChange={(e) => setHighlights(e.target.value)}
                    placeholder="今天学到了什么？有什么值得记录的收获？"
                    className="w-full h-24 p-3 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#F0E6D8' }}
                  />
                </div>

                <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#F0E6D8' }}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5D4E37' }}>反思 / 感悟</label>
                  <textarea
                    value={reflections}
                    onChange={(e) => setReflections(e.target.value)}
                    placeholder="今天有什么想法或感悟？"
                    className="w-full h-24 p-3 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#F0E6D8' }}
                  />
                </div>

                <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#F0E6D8' }}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5D4E37' }}>待改进</label>
                  <textarea
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="今天有什么做得不好的？明天如何改进？"
                    className="w-full h-24 p-3 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#F0E6D8' }}
                  />
                </div>

                <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#F0E6D8' }}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5D4E37' }}>今日心情</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          mood === m
                            ? 'text-white'
                            : 'text-slate-600 hover:bg-orange-100'
                        }`}
                        style={mood === m ? { background: '#FF6B8A' } : { background: '#FFF0E6' }}
                      >
                        {moodLabels[m - 1]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-2xl font-medium"
                  style={{ background: '#FF6B8A' }}
                >
                  <Save size={18} />
                  {saved ? '已保存！太棒了~' : '保存总结'}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
