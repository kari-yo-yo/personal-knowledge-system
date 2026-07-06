'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, X, File, Image, FileText, Loader2, Zap } from 'lucide-react'
import { compressImage } from '@/lib/image-compress'

interface FileUploadItem {
  file: File
  id: string
  progress: number
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error'
  error?: string
  url?: string
  attachment?: any
  originalSize?: number
  compressedSize?: number
}

interface FileUploaderProps {
  nodeId?: string
  contentId?: string
  onUploadComplete?: (attachment: any) => void
  onUploadError?: (error: string) => void
}

const MAX_UPLOAD_SIZE = 4.5 * 1024 * 1024 // 4.5MB Vercel limit

export function FileUploader({ nodeId, contentId, onUploadComplete, onUploadError }: FileUploaderProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showCompressTip, setShowCompressTip] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const uploadFile = async (item: FileUploadItem) => {
    setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading' } : f)))

    const formData = new FormData()
    formData.append('file', item.file)
    if (nodeId) formData.append('nodeId', nodeId)
    if (contentId) formData.append('contentId', contentId)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '上传失败')
      }

      const data = await response.json()
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'done', progress: 100, attachment: data.attachment, url: data.url }
            : f
        )
      )
      onUploadComplete?.(data.attachment)
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'error', error: err.message } : f))
      )
      onUploadError?.(err.message)
    }
  }

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList) return
      const rawFiles = Array.from(fileList)

      for (const rawFile of rawFiles) {
        const id = Math.random().toString(36).slice(2)
        const originalSize = rawFile.size

        // Check if file exceeds upload limit
        if (rawFile.size > MAX_UPLOAD_SIZE && !rawFile.type.startsWith('image/')) {
          // Non-image files over limit: show error immediately
          const item: FileUploadItem = {
            file: rawFile,
            id,
            progress: 0,
            status: 'error',
            error: `文件 ${formatSize(rawFile.size)} 超过 4.5MB 限制。请先用 ilovepdf.com 等工具压缩`,
            originalSize,
          }
          setFiles((prev) => [...prev, item])
          onUploadError?.(item.error || '文件过大')
          continue
        }

        // Add to list as pending
        let item: FileUploadItem = {
          file: rawFile,
          id,
          progress: 0,
          status: 'pending',
          originalSize,
        }
        setFiles((prev) => [...prev, item])

        // Compress images if needed
        if (rawFile.type.startsWith('image/') && rawFile.size > MAX_UPLOAD_SIZE) {
          setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'compressing' } : f)))
          try {
            const compressed = await compressImage(rawFile, { maxSizeMB: 4, quality: 0.8 })
            item = { ...item, file: compressed, compressedSize: compressed.size, status: 'pending' }
            setFiles((prev) => prev.map((f) => (f.id === id ? item : f)))
          } catch {
            // Compression failed, try uploading original
            item = { ...item, status: 'pending' }
            setFiles((prev) => prev.map((f) => (f.id === id ? item : f)))
          }
        }

        // Upload
        uploadFile(item)
      }
    },
    [nodeId, contentId]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const getFileIcon = (fileType: string, status: string) => {
    if (status === 'compressing') return <Zap size={20} className="text-[#FF8C42] animate-pulse" />
    if (fileType.startsWith('image/')) return <Image size={20} className="text-[#FF6B8A]" />
    if (fileType.includes('pdf')) return <FileText size={20} className="text-red-500" />
    return <File size={20} className="text-[var(--text-muted)]" />
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-[var(--accent-nebula)] bg-[rgba(255,255,255,0.05)]'
            : 'border-[var(--glass-border)] hover:border-[var(--accent-nebula)] hover:bg-[rgba(255,255,255,0.05)]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-primary)]">点击选择文件或拖拽到此处</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          图片自动压缩，建议单文件 &lt; 4MB
        </p>
      </div>

      {/* 压缩提示 */}
      <div className="text-xs text-[var(--text-muted)]">
        <button
          type="button"
          onClick={() => setShowCompressTip(!showCompressTip)}
          className="text-[var(--accent-nebula)] hover:underline"
        >
          💡 文件太大？点击查看压缩工具
        </button>
        {showCompressTip && (
          <div className="mt-2 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[var(--glass-border)]">
            <p className="font-medium mb-1">推荐免费压缩工具：</p>
            <ul className="space-y-1">
              <li>
                <a href="https://www.ilovepdf.com/zh-cn/compress_pdf" target="_blank" rel="noopener noreferrer" className="text-[#4a90d9] hover:underline">
                  iLovePDF - PDF 压缩
                </a>
              </li>
              <li>
                <a href="https://tinypng.com" target="_blank" rel="noopener noreferrer" className="text-[#4a90d9] hover:underline">
                  TinyPNG - 图片压缩
                </a>
              </li>
              <li>
                <a href="https://compressjpeg.com" target="_blank" rel="noopener noreferrer" className="text-[#4a90d9] hover:underline">
                  CompressJPEG - 图片压缩
                </a>
              </li>
            </ul>
            <p className="mt-2 text-[var(--text-muted)]">压缩到 4MB 以下即可上传</p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-[var(--glass-bg)] rounded-lg border"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              {getFileIcon(item.file.type, item.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{item.file.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatSize(item.file.size)}
                  {item.originalSize && item.originalSize !== item.file.size && (
                    <span className="text-green-600 ml-1">
                      (压缩了 {Math.round((1 - item.file.size / item.originalSize) * 100)}%)
                    </span>
                  )}
                </p>
                {item.status === 'uploading' && (
                  <div className="w-full h-1 bg-[var(--glass-border)] rounded-full mt-1">
                    <div
                      className="h-1 bg-[#FF6B8A] rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">{item.error}</p>
                )}
                {item.status === 'compressing' && (
                  <p className="text-xs text-[#FF8C42] mt-1">正在压缩...</p>
                )}
              </div>
              {item.status === 'uploading' && (
                <Loader2 size={16} className="animate-spin text-[#FF6B8A]" />
              )}
              {item.status === 'compressing' && (
                <Zap size={16} className="animate-pulse text-[#FF8C42]" />
              )}
              {item.status === 'done' && <span className="text-xs text-green-600">完成</span>}
              <button
                onClick={() => removeFile(item.id)}
                className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded"
                type="button"
              >
                <X size={14} className="text-[var(--text-muted)]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
