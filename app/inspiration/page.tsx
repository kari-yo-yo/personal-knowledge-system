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
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded">
            <Menu size={20} />
          </button>
          <Link href="/" className="p-2 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="font-semibold text-slate-800">灵感速记</h1>
        </header>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-4">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setShowAI(false)
              }}
              placeholder="记录你的灵感、想法、学习心得..."
              className="w-full h-40 p-4 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-800 font-medium mb-2">灵感已保存！</p>
                <Link
                  href={`/node/${savedTo}`}
                  className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                >
                  去查看已保存的内容
                </Link>
                <button
                  onClick={() => { setSavedTo(''); setText('') }}
                  className="ml-2 text-sm text-green-700 hover:underline"
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
