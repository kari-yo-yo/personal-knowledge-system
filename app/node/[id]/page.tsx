'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ContentList } from '@/components/content/ContentList'
import { ContentEditor } from '@/components/content/ContentEditor'
import { Node } from '@/lib/types'
import { Menu, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NodePage() {
  const params = useParams()
  const nodeId = params.id as string
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [node, setNode] = useState<Node | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState<object>({ type: 'doc', content: [{ type: 'paragraph' }] })

  useEffect(() => {
    fetch(`/api/nodes/${nodeId}`)
      .then((res) => res.json())
      .then((data) => setNode(data.node))
  }, [nodeId])

  const handleSave = async () => {
    await fetch('/api/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        title,
        body,
        type: 'NOTE',
      }),
    })
    setShowEditor(false)
    setTitle('')
    setBody({ type: 'doc', content: [{ type: 'paragraph' }] })
    window.location.reload()
  }

  if (!node) return <div className="flex h-screen items-center justify-center">加载中...</div>

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded"
          >
            <Menu size={20} />
          </button>
          
          <Link href="/" className="p-2 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          
          <h1 className="font-semibold text-slate-800">{node.name}</h1>
          
          <div className="flex-1" />
          
          <button 
            onClick={() => setShowEditor(!showEditor)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus size={20} />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {showEditor && (
              <div className="mb-6 bg-white rounded-lg border border-slate-200 p-4">
                <input
                  type="text"
                  placeholder="标题（可选）"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mb-3 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ContentEditor initialContent={body} onChange={setBody} />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowEditor(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}
            
            <ContentList nodeId={nodeId} />
          </div>
        </div>
      </main>
    </div>
  )
}
