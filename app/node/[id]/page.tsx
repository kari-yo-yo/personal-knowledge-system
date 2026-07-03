'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ContentList } from '@/components/content/ContentList'
import { ContentEditor } from '@/components/content/ContentEditor'
import { FileUploader } from '@/components/upload/FileUploader'
import { Node, Attachment } from '@/lib/types'
import { Menu, Plus, ArrowLeft, ChevronRight, Folder, Layers, FileText, Image, File, Download } from 'lucide-react'
import Link from 'next/link'

interface NodeDetail extends Node {
  children: Node[]
  contents: any[]
}

async function fetchAncestors(nodeId: string): Promise<Node[]> {
  const ancestors: Node[] = []
  let currentId: string | null = nodeId
  const visited = new Set<string>()

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    try {
      const response: Response = await fetch(`/api/nodes/${currentId}`)
      const data: any = await response.json()
      if (!data.node) break
      ancestors.unshift(data.node)
      currentId = data.node.parentId
    } catch {
      break
    }
  }
  return ancestors
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function NodePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const nodeId = params.id as string
  const action = searchParams.get('action')

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [node, setNode] = useState<NodeDetail | null>(null)
  const [ancestors, setAncestors] = useState<Node[]>([])
  const [showEditor, setShowEditor] = useState(action === 'add-content')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState<object>({ type: 'doc', content: [{ type: 'paragraph' }] })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showFileUploader, setShowFileUploader] = useState(false)
  const [attachmentsLoading, setAttachmentsLoading] = useState(true)
  const [editorAttachments, setEditorAttachments] = useState<Attachment[]>([])

  useEffect(() => {
    fetch(`/api/nodes/${nodeId}`)
      .then((res) => res.json())
      .then((data) => {
        setNode(data.node)
      })

    fetchAncestors(nodeId).then(setAncestors)
    fetchAttachments(nodeId)
  }, [nodeId])

  const fetchAttachments = async (id: string) => {
    setAttachmentsLoading(true)
    try {
      const res = await fetch(`/api/nodes/${id}/attachments`)
      const data = await res.json()
      setAttachments(data.attachments || [])
    } catch {
      setAttachments([])
    } finally {
      setAttachmentsLoading(false)
    }
  }

  useEffect(() => {
    if (action === 'add-content') {
      setShowEditor(true)
    }
  }, [action])

  const handleSave = async () => {
    const res = await fetch('/api/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        title,
        body,
        type: 'NOTE',
      }),
    })
    const data = await res.json()

    // Link editor attachments to the newly created content
    if (data.content?.id && editorAttachments.length > 0) {
      await fetch('/api/attachments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachmentIds: editorAttachments.map((a) => a.id),
          contentId: data.content.id,
        }),
      })
    }

    setShowEditor(false)
    setTitle('')
    setBody({ type: 'doc', content: [{ type: 'paragraph' }] })
    setEditorAttachments([])
    window.location.reload()
  }

  const handleCreateChild = async () => {
    const name = prompt('请输入子系统名称')
    if (!name || !node) return
    const res = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        parentId: nodeId,
        type: 'SUBSYSTEM',
        color: node.color || '#FF6B8A',
      }),
    })
    if (res.ok) {
      window.location.reload()
    }
  }

  if (!node) return <div className="flex h-screen items-center justify-center" style={{ background: '#FFF8F0' }}>加载中...</div>

  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="flex h-screen" style={{ background: '#FFF8F0' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b flex items-center gap-3 px-4" style={{ borderColor: '#F0E6D8' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-orange-50 rounded"
          >
            <Menu size={20} />
          </button>

          <Link href="/" className="p-2 hover:bg-orange-50 rounded">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>

          <h1 className="font-semibold truncate" style={{ color: '#5D4E37' }}>{node.name}</h1>

          <div className="flex-1" />

          <img
            src="/pups/pup-write.svg"
            alt="写字的小狗"
            className="hidden sm:block max-w-[32px] h-auto mr-1"
          />
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="p-2 text-white rounded-lg"
            style={{ background: '#FF6B8A' }}
          >
            <Plus size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumbs */}
            {ancestors.length > 1 && (
              <nav className="flex items-center flex-wrap gap-1 mb-4 text-sm">
                {ancestors.map((ancestor, index) => (
                  <span key={ancestor.id} className="flex items-center">
                    {index > 0 && <ChevronRight size={14} className="text-[#C4B5A0] mx-1" />}
                    {index === ancestors.length - 1 ? (
                      <span className="text-[#8B7355] font-medium">{ancestor.name}</span>
                    ) : (
                      <Link
                        href={`/node/${ancestor.id}`}
                        className="text-[#A09080] hover:text-[#5D4E37] transition-colors"
                      >
                        {ancestor.name}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            )}

            {/* Node info card */}
            <div
              className="mb-6 p-4 rounded-xl border bg-white"
              style={{ borderColor: '#F0E6D8' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: node.color || '#FF6B8A' }}
                />
                <span className="text-xs text-[#8B7355]">
                  {node.type === 'ROOT' ? '根系统' : node.type === 'SYSTEM' ? '系统' : '子系统'}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[#5D4E37]">{node.name}</h2>
            </div>

            {/* Content editor */}
            {showEditor && (
              <div className="mb-6 bg-white rounded-lg border p-4" style={{ borderColor: '#F0E6D8' }}>
                <input
                  type="text"
                  placeholder="标题（可选）"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mb-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: '#F0E6D8' }}
                />
                <ContentEditor
                  initialContent={body}
                  onChange={setBody}
                  nodeId={nodeId}
                  attachments={editorAttachments}
                  onAttachmentsChange={setEditorAttachments}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowEditor(false)}
                    className="px-4 py-2 text-[#8B7355] hover:bg-[#FFF8F0] rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{ background: '#FF6B8A' }}
                  >
                    保存
                  </button>
                </div>
              </div>
            )}

            {/* Child subsystems */}
            {hasChildren && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#5D4E37] flex items-center gap-2">
                    <Folder size={18} style={{ color: node.color || '#FF6B8A' }} />
                    子系统
                    <span className="text-xs font-normal text-[#8B7355] bg-[#FFF0E6] px-2 py-0.5 rounded-full">
                      {node.children.length}
                    </span>
                  </h3>
                  <button
                    onClick={handleCreateChild}
                    className="text-xs px-3 py-1.5 rounded-lg text-white transition-colors"
                    style={{ background: '#FF6B8A' }}
                  >
                    + 新建子系统
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {node.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/node/${child.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:shadow-md transition-shadow"
                      style={{ borderColor: '#F0E6D8' }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${child.color || node.color || '#FF6B8A'}15` }}
                      >
                        <Layers size={16} style={{ color: child.color || node.color || '#FF6B8A' }} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm text-[#5D4E37] truncate">{child.name}</h4>
                        <p className="text-xs text-[#8B7355]">
                          {child.type === 'SYSTEM' ? '系统' : '子系统'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Create child prompt when no children */}
            {!hasChildren && (
              <div className="mb-6 p-4 rounded-xl border border-dashed text-center" style={{ borderColor: '#E0D5C8' }}>
                <p className="text-sm text-[#8B7355] mb-2">暂无子系统</p>
                <button
                  onClick={handleCreateChild}
                  className="text-xs px-3 py-1.5 rounded-lg text-white transition-colors"
                  style={{ background: '#FF6B8A' }}
                >
                  + 新建子系统
                </button>
              </div>
            )}

            {/* Files section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#5D4E37] flex items-center gap-2">
                  <FileText size={18} style={{ color: node.color || '#FF6B8A' }} />
                  文件
                  <span className="text-xs font-normal text-[#8B7355] bg-[#FFF0E6] px-2 py-0.5 rounded-full">
                    {attachments.length}
                  </span>
                </h3>
                <button
                  onClick={() => setShowFileUploader(!showFileUploader)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#FFF8F0]"
                  style={{ borderColor: '#F0E6D8', color: '#5D4E37' }}
                >
                  {showFileUploader ? '取消上传' : '上传文件'}
                </button>
              </div>

              {showFileUploader && (
                <div className="mb-4">
                  <FileUploader
                    nodeId={nodeId}
                    onUploadComplete={() => fetchAttachments(nodeId)}
                    onUploadError={(err) => alert(err)}
                  />
                </div>
              )}

              {attachmentsLoading ? (
                <div className="text-sm text-[#8B7355]">加载文件...</div>
              ) : attachments.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed text-center" style={{ borderColor: '#E0D5C8' }}>
                  <p className="text-sm text-[#8B7355]">暂无文件</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((attach) => (
                    <a
                      key={attach.id}
                      href={attach.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:shadow-md transition-shadow"
                      style={{ borderColor: '#F0E6D8' }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${node.color || '#FF6B8A'}15` }}
                      >
                        {attach.fileType?.startsWith('image/') ? (
                          <Image size={18} style={{ color: node.color || '#FF6B8A' }} />
                        ) : attach.fileType?.includes('pdf') ? (
                          <FileText size={18} className="text-red-500" />
                        ) : (
                          <File size={18} style={{ color: node.color || '#FF6B8A' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-[#5D4E37] truncate">{attach.fileName}</h4>
                        <div className="flex items-center gap-2 text-xs text-[#8B7355]">
                          <span>{formatFileSize(attach.fileSize)}</span>
                          <span>·</span>
                          <span>{formatDate(attach.createdAt)}</span>
                        </div>
                      </div>
                      <Download size={16} className="text-[#8B7355] shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Content section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#5D4E37]">内容</h3>
                <button
                  onClick={() => setShowEditor(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#FFF8F0]"
                  style={{ borderColor: '#F0E6D8', color: '#5D4E37' }}
                >
                  添加内容
                </button>
              </div>
              <ContentList nodeId={nodeId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
