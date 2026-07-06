'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/theme/GlassCard'
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

  if (loading) return (
    <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
      <div className="galaxy-loader mx-auto mb-4" />
      <p>搜索中...</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative z-10">
      {results.nodes.length > 0 && (
        <section>
          <h2 className="font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            节点 ({results.nodes.length})
          </h2>
          <div className="space-y-2">
            {results.nodes.map((node: any) => (
              <Link
                key={node.id}
                href={`/node/${node.id}`}
                className="block"
              >
                <GlassCard hover className="p-3">
                  <span style={{ color: 'var(--text-primary)' }}>{node.name}</span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.contents.length > 0 && (
        <section>
          <h2 className="font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            内容 ({results.contents.length})
          </h2>
          <div className="space-y-2">
            {results.contents.map((content: any) => (
              <Link
                key={content.id}
                href={`/node/${content.nodeId}`}
                className="block"
              >
                <GlassCard hover className="p-3">
                  <span style={{ color: 'var(--text-primary)' }}>{content.title || '无标题'}</span>
                  <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>来自: {content.node?.name}</span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.nodes.length === 0 && results.contents.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <img
            src="/pups/pup-wave.svg"
            alt="小狗没找到东西"
            className="puppy-float puppy-dark max-w-[120px] md:max-w-[150px] h-auto mx-auto mb-4"
          />
          <p>未找到与 &quot;{q}&quot; 相关的内容</p>
          <p className="text-sm mt-1 opacity-70">小狗帮你搜了，但什么都没找到呢...</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          <h1 className="font-semibold" style={{ color: 'var(--text-primary)' }}>搜索结果</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
              <div className="galaxy-loader mx-auto mb-4" />
              <p>加载中...</p>
            </div>
          }>
            <SearchResults />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
