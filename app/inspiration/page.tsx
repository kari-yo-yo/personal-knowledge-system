'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { AIClassifyPanel } from '@/components/ai/AIClassifyPanel'
import { Menu, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function InspirationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [text, setText] = useState('')
  const [showAI, setShowAI] = useState(false)

  const [savedTo, setSavedTo] = useState('')

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
    const data = await res.json()
    setText('')
    setShowAI(false)
    setSavedTo(nodeId)
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
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
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
              
              <div className="flex gap-2">
                {text.length > 0 && (
                  <AIClassifyPanel
                    text={text}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowAI(false)}
                  />
                )}
              </div>
            </div>

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
                  onClick={() => { setSavedTo(''); setText('') }}
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
