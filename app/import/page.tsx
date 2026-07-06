'use client'

import { useState, useRef, useCallback } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/theme/GlassCard'
import { Menu, ArrowLeft, Upload, FileText, Check, Sparkles, File } from 'lucide-react'
import Link from 'next/link'

const supportedExts = '.md,.txt,.doc,.docx,.ppt,.pptx,.pdf,.csv,.json,.html,.xml,.yaml,.yml'

function getFileIcon(fileName: string) {
  const name = fileName.toLowerCase()
  if (name.endsWith('.pdf')) return '📄'
  if (name.endsWith('.doc') || name.endsWith('.docx')) return '📝'
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return '📊'
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) return '📈'
  if (name.endsWith('.md') || name.endsWith('.txt')) return '📃'
  return '📎'
}

export default function ImportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [isText, setIsText] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) processFile(dropped)
  }, [])

  const processFile = async (f: File) => {
    setFile(f)
    setResult(null)
    setSaved(false)
    const formData = new FormData()
    formData.append('file', f)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.text) {
      setText(data.text)
      setIsText(data.isText)
      const analyzeText = data.isText ? data.text : data.fileName + '\n' + data.text
      analyzeContent(analyzeText)
    }
  }

  const analyzeContent = async (t: string) => {
    setAnalyzing(true)
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: t }),
    })
    const data = await res.json()
    setResult(data)
    setAnalyzing(false)
  }

  const handleSave = async (nodeId: string) => {
    setSaved(true)
    await fetch('/api/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        title: file?.name || '导入的笔记',
        body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
        type: 'NOTE',
      }),
    })
  }

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
          <h1 className="font-semibold" style={{ color: 'var(--text-primary)' }}>笔记导入</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="max-w-xl mx-auto space-y-4 relative z-10">
            <div className="text-center mb-4">
              <img src="/pups/pup-write.svg" alt="write pup" className="w-28 h-28 mx-auto puppy-float puppy-dark" />
              <h2 className="text-lg font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>把笔记丢给小狗~</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>支持 Markdown、文本、Word、PPT、PDF 等</p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[var(--accent-nebula)]'
                  : 'border-[var(--glass-border)] hover:border-[var(--accent-nebula)]/50'
              }`}
              style={{
                background: dragOver ? 'rgba(139, 92, 246, 0.05)' : 'var(--glass-bg)',
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept={supportedExts}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              <Upload size={36} className="mx-auto mb-2" style={{ color: 'var(--accent-nebula)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>拖拽文件到这里</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                .md .txt .doc .docx .ppt .pptx .pdf .csv .json
              </p>
            </div>

            {file && (
              <GlassCard hover={false} className="flex items-center gap-2 p-3">
                <span className="text-lg">{getFileIcon(file.name)}</span>
                <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</span>
                {!isText && <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>二进制</span>}
              </GlassCard>
            )}

            {analyzing && (
              <div className="text-center py-6">
                <img src="/pups/pup-think.svg" alt="thinking" className="w-20 h-20 mx-auto puppy-float puppy-dark" />
                <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {isText ? '小狗正在分析内容...' : '小狗正在分析文件名...'}
                </p>
              </div>
            )}

            {result && (
              <GlassCard hover={false} className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} style={{ color: 'var(--accent-aurora)' }} />
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>分析结果</span>
                </div>

                {result.summary && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>一句话总结</span>
                    <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>{result.summary}</p>
                  </div>
                )}

                {result.suggestedNodeName && (
                  <div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>建议归档到</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => handleSave(result.suggestedNodeId)}
                        disabled={saved}
                        className="px-3 py-1.5 rounded-full text-sm font-medium disabled:opacity-50 glow-btn"
                      >
                        {saved ? <Check size={14} className="inline" /> : null}
                        {result.suggestedNodeName}
                      </button>
                      {result.alternatives?.map((alt: any) => (
                        <button
                          key={alt.nodeId}
                          onClick={() => handleSave(alt.nodeId)}
                          disabled={saved}
                          className="px-3 py-1.5 rounded-full text-sm disabled:opacity-50 transition-colors"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--glass-border)',
                          }}
                        >
                          {alt.nodeName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {saved && (
                  <div className="text-center text-sm font-medium" style={{ color: 'rgba(134, 239, 172, 0.9)' }}>
                    <img src="/pups/pup-happy.svg" alt="happy" className="w-16 h-16 mx-auto puppy-dark" />
                    已保存！小狗帮你归档好了~
                  </div>
                )}
              </GlassCard>
            )}

            {text && (
              <GlassCard hover={false} className="p-4">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>内容预览</span>
                <pre
                  className="mt-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                >
                  {text.slice(0, 1000)}{text.length > 1000 ? '...' : ''}
                </pre>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
