'use client'

import { useState, useRef, useCallback } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
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
      // For binary files, also pass filename to AI for analysis
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
          <h1 className="font-semibold text-[#5D4E37]">笔记导入</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="max-w-xl mx-auto space-y-4">

            <div className="text-center mb-4">
              <img src="/pups/pup-write.svg" alt="write pup" className="w-28 h-28 mx-auto puppy-float" />
              <h2 className="text-lg font-semibold text-[#5D4E37] mt-2">把笔记丢给小狗~</h2>
              <p className="text-sm text-[#8B7D6B]">支持 Markdown、文本、Word、PPT、PDF 等</p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#FF6B8A] bg-[#FFF0F3]'
                  : 'border-[#F0E6D8] bg-white hover:border-[#FF6B8A]/50'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept={supportedExts}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              <Upload size={36} className="mx-auto text-[#FF6B8A] mb-2" />
              <p className="text-[#5D4E37] font-medium">拖拽文件到这里</p>
              <p className="text-xs text-[#8B7D6B] mt-1">
                .md .txt .doc .docx .ppt .pptx .pdf .csv .json
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-[#F0E6D8]">
                <span className="text-lg">{getFileIcon(file.name)}</span>
                <span className="text-sm text-[#5D4E37] flex-1 truncate">{file.name}</span>
                <span className="text-xs text-[#8B7D6B]">{(file.size / 1024).toFixed(1)} KB</span>
                {!isText && <span className="px-1.5 py-0.5 bg-[#FFF0E6] text-[#8B7D6B] rounded text-xs">二进制</span>}
              </div>
            )}

            {analyzing && (
              <div className="text-center py-6">
                <img src="/pups/pup-think.svg" alt="thinking" className="w-20 h-20 mx-auto puppy-float" />
                <p className="text-[#8B7D6B] mt-2 text-sm">
                  {isText ? '小狗正在分析内容...' : '小狗正在分析文件名...'}
                </p>
              </div>
            )}

            {result && (
              <div className="bg-white rounded-2xl border border-[#F0E6D8] p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#FFD93D]" />
                  <span className="font-medium text-[#5D4E37]">分析结果</span>
                </div>

                {result.summary && (
                  <div className="bg-[#FFF8F0] rounded-xl p-3">
                    <span className="text-xs text-[#8B7D6B]">一句话总结</span>
                    <p className="text-sm text-[#5D4E37] mt-1 font-medium">{result.summary}</p>
                  </div>
                )}

                {result.suggestedNodeName && (
                  <div>
                    <span className="text-xs text-[#8B7D6B]">建议归档到</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => handleSave(result.suggestedNodeId)}
                        disabled={saved}
                        className="px-3 py-1.5 bg-[#FF6B8A] text-white rounded-full text-sm font-medium disabled:opacity-50"
                      >
                        {saved ? <Check size={14} className="inline" /> : null}
                        {result.suggestedNodeName}
                      </button>
                      {result.alternatives?.map((alt: any) => (
                        <button
                          key={alt.nodeId}
                          onClick={() => handleSave(alt.nodeId)}
                          disabled={saved}
                          className="px-3 py-1.5 bg-[#FFF0E6] text-[#5D4E37] rounded-full text-sm border border-[#F0E6D8] disabled:opacity-50"
                        >
                          {alt.nodeName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {saved && (
                  <div className="text-center text-green-600 text-sm font-medium">
                    <img src="/pups/pup-happy.svg" alt="happy" className="w-16 h-16 mx-auto" />
                    已保存！小狗帮你归档好了~
                  </div>
                )}
              </div>
            )}

            {text && (
              <div className="bg-white rounded-2xl border border-[#F0E6D8] p-4">
                <span className="text-xs text-[#8B7D6B]">内容预览</span>
                <pre className="mt-2 text-xs text-[#5D4E37] whitespace-pre-wrap max-h-40 overflow-y-auto bg-[#FFF8F0] rounded-lg p-3">{text.slice(0, 1000)}{text.length > 1000 ? '...' : ''}</pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
