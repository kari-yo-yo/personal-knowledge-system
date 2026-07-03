'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { AIClassifyPanel } from '@/components/ai/AIClassifyPanel'
import { Menu, ArrowLeft, Lightbulb, Target, BookOpen, AlertTriangle, Heart, CheckCircle, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ExpandPlan {
  vision: string
  steps: { phase: string; title: string; description: string; duration: string }[]
  skillsNeeded: string[]
  resources: string[]
  milestones: string[]
  risks: string[]
  tips: string
  suggestedNodeId: string
  suggestedNodeName: string
}

export default function InspirationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [text, setText] = useState('')
  const [showAI, setShowAI] = useState(false)
  const [savedTo, setSavedTo] = useState('')

  const [expandPlan, setExpandPlan] = useState<ExpandPlan | null>(null)
  const [expandLoading, setExpandLoading] = useState(false)
  const [expandSaved, setExpandSaved] = useState(false)

  const handleConfirm = async (nodeId: string) => {
    const res = await fetch('/api/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        title: text.slice(0, 50),
        body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
        type: 'NOTE',
      }),
    })
    await res.json()
    setText('')
    setShowAI(false)
    setSavedTo(nodeId)
    setExpandPlan(null)
    setExpandSaved(false)
  }

  const handleExpand = async () => {
    setExpandLoading(true)
    setExpandSaved(false)
    try {
      const res = await fetch('/api/inspiration/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      setExpandPlan(data)
    } catch (error) {
      console.error('Expand failed:', error)
    }
    setExpandLoading(false)
  }

  const handleSavePlan = async () => {
    if (!expandPlan) return
    try {
      const bodyContent = [
        { type: 'paragraph', content: [{ type: 'text', text: `【愿景】${expandPlan.vision}` }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '【执行步骤】' }] },
        ...expandPlan.steps.flatMap((step) => [
          { type: 'paragraph', content: [{ type: 'text', text: `${step.phase}: ${step.title}（${step.duration}）` }] },
          { type: 'paragraph', content: [{ type: 'text', text: step.description }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ]),
        { type: 'paragraph', content: [{ type: 'text', text: `【所需技能】${expandPlan.skillsNeeded.join('、')}` }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'paragraph', content: [{ type: 'text', text: `【所需资源】${expandPlan.resources.join('、')}` }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'paragraph', content: [{ type: 'text', text: `【里程碑】${expandPlan.milestones.join('、')}` }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'paragraph', content: [{ type: 'text', text: `【风险提示】${expandPlan.risks.join('、')}` }] },
        { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        { type: 'paragraph', content: [{ type: 'text', text: `【小狗寄语】${expandPlan.tips}` }] },
      ]

      const res = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: expandPlan.suggestedNodeId,
          title: `拓展计划: ${expandPlan.vision.slice(0, 40)}`,
          body: { type: 'doc', content: bodyContent },
          type: 'NOTE',
          tags: ['拓展计划', 'AI生成'],
        }),
      })
      if (res.ok) {
        setExpandSaved(true)
      }
    } catch (error) {
      console.error('Save plan failed:', error)
    }
  }

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
          <h1 className="font-semibold" style={{ color: '#5D4E37' }}>灵感速记</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-2xl space-y-4">
            <div className="flex flex-col items-center mb-2">
              <img
                src="/pups/pup-think.svg"
                alt="思考中的小狗"
                className="puppy-float max-w-[120px] md:max-w-[150px] h-auto"
              />
              <p className="text-sm mt-2" style={{ color: '#8B7355' }}>灵感来啦？快记下来，小狗帮你守护每一个想法~</p>
            </div>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setShowAI(false)
              }}
              placeholder="记录你的灵感、想法、学习心得..."
              className="w-full h-40 p-4 border rounded-2xl resize-none focus:outline-none focus:ring-2 text-slate-700"
              style={{ borderColor: '#F0E6D8' }}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm" style={{ color: '#8B7355' }}>
                {text.length} 字
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                {text.length > 0 && (
                  <>
                    <AIClassifyPanel
                      text={text}
                      onConfirm={handleConfirm}
                      onCancel={() => setShowAI(false)}
                    />
                    <button
                      onClick={handleExpand}
                      disabled={expandLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50 transition-colors hover:opacity-90"
                      style={{ background: '#FF8C42' }}
                    >
                      {expandLoading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
                      {expandLoading ? '拓展中...' : 'AI 帮我拓展'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {expandPlan && (
              <div className="w-full rounded-2xl border p-6" style={{ background: '#FFF5EB', borderColor: '#F0E6D8' }}>
                {/* Vision */}
                <div className="flex items-start gap-3 mb-6 p-4 rounded-xl" style={{ background: '#FFEEE0' }}>
                  <Target size={24} style={{ color: '#FF8C42', flexShrink: 0 }} />
                  <div>
                    <div className="text-sm font-medium mb-1" style={{ color: '#8B7355' }}>愿景</div>
                    <div className="text-lg font-semibold" style={{ color: '#5D4E37' }}>{expandPlan.vision}</div>
                  </div>
                </div>

                {/* Steps Timeline */}
                <div className="mb-6">
                  <div className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: '#8B7355' }}>
                    <BookOpen size={16} /> 执行路径
                  </div>
                  <div className="space-y-0">
                    {expandPlan.steps.map((step, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#FF8C42' }}>
                            {index + 1}
                          </div>
                          {index < expandPlan.steps.length - 1 && (
                            <div className="w-0.5 flex-1 min-h-[2rem] mt-1" style={{ background: '#F0E6D8' }} />
                          )}
                        </div>
                        <div className="flex-1 pb-5">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm" style={{ color: '#5D4E37' }}>{step.title}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F0E6D8', color: '#8B7355' }}>{step.duration}</span>
                          </div>
                          <div className="text-xs font-medium mb-1" style={{ color: '#FF8C42' }}>{step.phase}</div>
                          <div className="text-sm" style={{ color: '#8B7355' }}>{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <div className="text-sm font-medium mb-2" style={{ color: '#8B7355' }}>所需技能</div>
                  <div className="flex flex-wrap gap-2">
                    {expandPlan.skillsNeeded.map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#FFE4D6', color: '#FF8C42' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div className="mb-6">
                  <div className="text-sm font-medium mb-2" style={{ color: '#8B7355' }}>所需资源</div>
                  <ul className="space-y-1">
                    {expandPlan.resources.map((res, i) => (
                      <li key={i} className="text-sm flex items-center gap-2" style={{ color: '#5D4E37' }}>
                        <span style={{ color: '#FF8C42' }}>•</span> {res}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Milestones */}
                <div className="mb-6">
                  <div className="text-sm font-medium mb-2" style={{ color: '#8B7355' }}>里程碑</div>
                  <div className="flex flex-wrap gap-2">
                    {expandPlan.milestones.map((m, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1" style={{ background: '#E8F5E9', color: '#4CAF50' }}>
                        <CheckCircle size={12} />
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                <div className="mb-6 p-4 rounded-xl" style={{ background: '#FFF8E1' }}>
                  <div className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#8B7355' }}>
                    <AlertTriangle size={16} style={{ color: '#FFB300' }} /> 可能的风险
                  </div>
                  <ul className="space-y-1">
                    {expandPlan.risks.map((risk, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#5D4E37' }}>
                        <span style={{ color: '#FFB300' }}>•</span> {risk}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tips */}
                <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: '#FFEEE0' }}>
                  <Heart size={20} style={{ color: '#FF6B8A', flexShrink: 0 }} />
                  <div className="text-sm font-medium" style={{ color: '#5D4E37' }}>{expandPlan.tips}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {!expandSaved ? (
                    <button
                      onClick={handleSavePlan}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm transition-colors hover:opacity-90"
                      style={{ background: '#FF6B8A' }}
                    >
                      <Sparkles size={14} />
                      保存计划到「{expandPlan.suggestedNodeName}」
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: '#E8F5E9', color: '#4CAF50' }}>
                      <CheckCircle size={14} />
                      计划已保存！
                    </div>
                  )}
                </div>
              </div>
            )}

            {savedTo && (
              <div className="rounded-2xl border p-4 text-center" style={{ background: '#FFF0E6', borderColor: '#F0E6D8' }}>
                <p className="font-medium mb-2" style={{ color: '#FF6B8A' }}>灵感已保存！小狗为你开心~</p>
                <Link
                  href={`/node/${savedTo}`}
                  className="inline-block px-4 py-2 text-white rounded-lg text-sm"
                  style={{ background: '#FF6B8A' }}
                >
                  去查看已保存的内容
                </Link>
                <button
                  onClick={() => { setSavedTo(''); setText(''); setExpandPlan(null); setExpandSaved(false) }}
                  className="ml-2 text-sm hover:underline"
                  style={{ color: '#FF6B8A' }}
                >
                  继续记录
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
