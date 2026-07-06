'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, ExternalLink, Link2, Unlink, RefreshCw, Search, X } from 'lucide-react'

interface Paper {
  id: string
  title: string
  category: string
  categoryEmoji: string
  tags: string[]
  status: string
  summary: string
  painPoints: string
  method: string
  arxiv?: string
  arxivUrl?: string
  codeUrl?: string
  notesUrl?: string
  sourceUrl?: string
}

interface Props {
  nodeId: string
}

const statusColors: Record<string, string> = {
  '待读': 'bg-slate-100 text-slate-600',
  '精读中': 'bg-blue-100 text-blue-600',
  '已读': 'bg-green-100 text-green-600',
  '已复现': 'bg-purple-100 text-purple-600',
}

export function PaperAssociation({ nodeId }: Props) {
  const [linkedPapers, setLinkedPapers] = useState<Paper[]>([])
  const [allPapers, setAllPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [fetchStatus, setFetchStatus] = useState<{ count: number; lastFetch: number } | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Auto-clear toast messages
  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => { setError(null); setSuccess(null) }, 4000)
      return () => clearTimeout(t)
    }
  }, [error, success])

  const fetchLinked = useCallback(async () => {
    try {
      const res = await fetch(`/api/papers/link?nodeId=${nodeId}&_t=${Date.now()}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      setLinkedPapers(data.papers || [])
    } catch (err: any) {
      console.error('fetchLinked error:', err)
      setLinkedPapers([])
    }
  }, [nodeId])

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`/api/papers?_t=${Date.now()}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      setAllPapers(data.papers || [])
      setFetchStatus({ count: data.total, lastFetch: data.lastFetch })
    } catch (err: any) {
      console.error('fetchAll error:', err)
      setAllPapers([])
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchLinked(), fetchAll()]).finally(() => setLoading(false))
  }, [fetchLinked, fetchAll])

  const handleFetchPapers = async () => {
    setIsFetching(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/papers/fetch?_t=' + Date.now(), {
        method: 'POST',
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(`拉取失败: ${data.error || '未知错误'}`)
        return
      }
      setSuccess(`成功拉取 ${data.count} 篇论文`)
      await fetchAll()
    } catch (err: any) {
      setError(`请求失败: ${err.message || '网络错误'}`)
    } finally {
      setIsFetching(false)
    }
  }

  const handleLink = async (paperId: string) => {
    setLinking(true)
    setError(null)
    try {
      const res = await fetch(`/api/papers/link?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, nodeId }),
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(`关联失败: ${data.error || '未知错误'}`)
        return
      }
      setSuccess('关联成功')
      await fetchLinked()
      setShowLinkDialog(false)
      setSearch('')
    } catch (err: any) {
      setError(`关联失败: ${err.message || '网络错误'}`)
    } finally {
      setLinking(false)
    }
  }

  const handleUnlink = async (paperId: string) => {
    setUnlinking(paperId)
    setError(null)
    try {
      const res = await fetch(
        `/api/papers/link?paperId=${paperId}&nodeId=${nodeId}&_t=${Date.now()}`,
        { method: 'DELETE', cache: 'no-store' }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(`取消关联失败: ${data.error || '未知错误'}`)
        return
      }
      setSuccess('已取消关联')
      await fetchLinked()
    } catch (err: any) {
      setError(`取消关联失败: ${err.message || '网络错误'}`)
    } finally {
      setUnlinking(null)
    }
  }

  const linkedIds = new Set(linkedPapers.map((p) => p.id))
  const availablePapers = allPapers.filter((p) => !linkedIds.has(p.id))
  const filteredPapers = search
    ? availablePapers.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
          p.category.includes(search)
      )
    : availablePapers

  if (loading) return <div className="text-sm text-[var(--text-muted)]">加载论文数据...</div>

  return (
    <div className="mb-6">
      {/* Toast messages */}
      {(error || success) && (
        <div className={`mb-3 p-3 rounded-lg text-sm ${error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
          <div className="flex items-center justify-between">
            <span>{error || success}</span>
            <button onClick={() => { setError(null); setSuccess(null) }} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen size={18} className="text-indigo-500" />
          关联论文
          <span className="text-xs font-normal text-[var(--text-muted)] bg-[rgba(99,102,241,0.1)] px-2 py-0.5 rounded-full">
            {linkedPapers.length}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchPapers}
            disabled={isFetching}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 hover:bg-[rgba(99,102,241,0.1)] text-indigo-500 border-indigo-200 disabled:opacity-50"
            title="从论文网站拉取最新数据"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? '拉取中...' : '拉取论文'}
          </button>
          <button
            onClick={() => { setShowLinkDialog(true); setError(null) }}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-40"
            style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
            disabled={allPapers.length === 0 || linking}
          >
            <Link2 size={12} className="inline mr-1" />
            关联论文
          </button>
        </div>
      </div>

      {/* Linked papers list */}
      {linkedPapers.length > 0 && (
        <div className="space-y-2">
          {linkedPapers.map((paper) => (
            <div
              key={paper.id}
              className="p-3 rounded-xl border bg-transparent group hover:shadow-sm transition-shadow"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">{paper.categoryEmoji}</span>
                    <h4
                      className="text-sm font-medium text-[var(--text-primary)] cursor-pointer hover:text-indigo-500 transition-colors truncate"
                      onClick={() => setExpanded(expanded === paper.id ? null : paper.id)}
                    >
                      {paper.title}
                    </h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[paper.status] || 'bg-gray-100 text-gray-500'}`}>
                      {paper.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{paper.summary}</p>

                  {expanded === paper.id && (
                    <div className="mt-3 space-y-2 text-xs text-[var(--text-muted)]">
                      {paper.painPoints && (
                        <div><span className="font-medium text-[var(--text-primary)]">痛点：</span>{paper.painPoints}</div>
                      )}
                      {paper.method && (
                        <div><span className="font-medium text-[var(--text-primary)]">方法：</span>{paper.method}</div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {paper.tags.map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {paper.arxivUrl && (
                          <a href={paper.arxivUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline flex items-center gap-1">
                            <ExternalLink size={10} /> arXiv
                          </a>
                        )}
                        {paper.codeUrl && (
                          <a href={paper.codeUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700 flex items-center gap-1">
                            <ExternalLink size={10} /> 代码
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleUnlink(paper.id)}
                  disabled={unlinking === paper.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--text-muted)] hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  title="取消关联"
                >
                  <Unlink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {linkedPapers.length === 0 && allPapers.length > 0 && (
        <div className="p-4 rounded-xl border border-dashed text-center" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-sm text-[var(--text-muted)]">暂无关联论文</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">点击「关联论文」添加</p>
        </div>
      )}

      {allPapers.length === 0 && (
        <div className="p-4 rounded-xl border border-dashed text-center" style={{ borderColor: 'var(--glass-border)' }}>
          <BookOpen size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">尚未拉取论文数据</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">点击「拉取论文」从 GitHub 获取</p>
        </div>
      )}

      {/* Link dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowLinkDialog(false)}>
          <div className="bg-[rgba(10,10,26,0.95)] rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">关联论文</h3>
              <button onClick={() => setShowLinkDialog(false)} className="p-1 rounded-md hover:bg-[rgba(255,255,255,0.05)]">
                <X size={16} className="text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="p-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="搜索论文标题、标签、分类..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-indigo-400"
                  style={{ borderColor: 'var(--glass-border)' }}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {filteredPapers.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                  {search ? '未找到匹配的论文' : '所有论文都已关联'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredPapers.map((paper) => (
                    <button
                      key={paper.id}
                      onClick={() => handleLink(paper.id)}
                      disabled={linking}
                      className="w-full text-left p-3 rounded-lg hover:bg-[rgba(99,102,241,0.1)] transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{paper.categoryEmoji}</span>
                        <h4 className="text-sm font-medium text-[var(--text-primary)] truncate flex-1">{paper.title}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[paper.status] || ''}`}>
                          {paper.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1 pl-6">{paper.summary}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t text-center" style={{ borderColor: 'var(--glass-border)' }}>
              <p className="text-xs text-[var(--text-muted)]">点击论文即可关联到当前知识节点</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
