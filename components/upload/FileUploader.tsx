'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, X, File, Image, FileText, Loader2 } from 'lucide-react'

interface FileUploadItem {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  url?: string
  attachment?: any
}

interface FileUploaderProps {
  nodeId?: string
  contentId?: string
  onUploadComplete?: (attachment: any) => void
  onUploadError?: (error: string) => void
}

export function FileUploader({ nodeId, contentId, onUploadComplete, onUploadError }: FileUploaderProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
    (fileList: FileList | null) => {
      if (!fileList) return
      const newFiles: FileUploadItem[] = Array.from(fileList).map((file) => ({
        file,
        id: Math.random().toString(36).slice(2),
        progress: 0,
        status: 'pending',
      }))
      setFiles((prev) => [...prev, ...newFiles])
      newFiles.forEach((item) => uploadFile(item))
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

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={20} className="text-[#FF6B8A]" />
    if (fileType.includes('pdf')) return <FileText size={20} className="text-red-500" />
    return <File size={20} className="text-[#8B7355]" />
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
            ? 'border-[#FF6B8A] bg-[#FFF0E6]'
            : 'border-[#E0D5C8] hover:border-[#FF6B8A] hover:bg-[#FFF8F0]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload size={24} className="mx-auto mb-2 text-[#8B7355]" />
        <p className="text-sm text-[#5D4E37]">点击选择文件或拖拽到此处</p>
        <p className="text-xs text-[#8B7355] mt-1">支持图片、PDF、文档等，最大 10MB</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border"
              style={{ borderColor: '#F0E6D8' }}
            >
              {getFileIcon(item.file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#5D4E37] truncate">{item.file.name}</p>
                <p className="text-xs text-[#8B7355]">{formatSize(item.file.size)}</p>
                {item.status === 'uploading' && (
                  <div className="w-full h-1 bg-[#F0E6D8] rounded-full mt-1">
                    <div
                      className="h-1 bg-[#FF6B8A] rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">{item.error}</p>
                )}
              </div>
              {item.status === 'uploading' && (
                <Loader2 size={16} className="animate-spin text-[#FF6B8A]" />
              )}
              {item.status === 'done' && <span className="text-xs text-green-600">完成</span>}
              <button
                onClick={() => removeFile(item.id)}
                className="p-1 hover:bg-[#FFF8F0] rounded"
                type="button"
              >
                <X size={14} className="text-[#8B7355]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
