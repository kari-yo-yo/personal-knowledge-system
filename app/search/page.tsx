'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import Link from 'next/link'
import { Menu, ArrowLeft, Search } from 'lucide-react'

function SearchResults() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState<any>({ nodes: [], contents: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || { nodes: [], contents: [] })
        setLoading(false)
      })
  }, [q])

  if (loading) return <div className="text-center text-slate-500">搜索中...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {results.nodes.length > 0 && (
        <section>
          <h2 className="font-medium text-slate-700 mb-3">节点 ({results.nodes.length})</h2>
          <div className="space-y-2">
            {results.nodes.map((node: any) => (
              <Link
                key={node.id}
                href={`/node/${node.id}`}
                className="block p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm"
              >
                <span className="font-medium text-slate-800">{node.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      
      {results.contents.length > 0 && (
        <section>
          <h2 className="font-medium text-slate-700 mb-3">内容 ({results.contents.length})</h2>
          <div className="space-y-2">
            {results.contents.map((content: any) => (
              <Link
                key={content.id}
                href={`/node/${content.nodeId}`}
                className="block p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm"
              >
                <span className="font-medium text-slate-800">{content.title || '无标题'}</span>
                <span className="text-sm text-slate-500 ml-2">来自: {content.node?.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      
      {results.nodes.length === 0 && results.contents.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>未找到与 &quot;{q}&quot; 相关的内容</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          <h1 className="font-semibold text-slate-800">搜索结果</h1>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<div className="text-center text-slate-500">加载中...</div>}>
            <SearchResults />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
