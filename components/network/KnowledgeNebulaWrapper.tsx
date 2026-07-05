'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { KnowledgeNebula } from './KnowledgeNebula'
import { RotateCcw, Orbit, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'

interface KnowledgeNebulaWrapperProps {
  refreshKey?: number
}

interface NodeData {
  id: string
  name: string
  parentId: string | null
  color: string | null
  children?: NodeData[]
}

interface ContentData {
  nodeId: string
}

interface EdgeData {
  id: string
  sourceId: string
  targetId: string
  label?: string | null
}

export function KnowledgeNebulaWrapper({ refreshKey }: KnowledgeNebulaWrapperProps) {
  const router = useRouter()
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [contents, setContents] = useState<ContentData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const nebulaRef = useRef<any>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nodesRes, contentsRes, edgesRes] = await Promise.all([
        fetch('/api/nodes?all=true'),
        fetch('/api/contents'),
        fetch('/api/edges'),
      ])

      if (!nodesRes.ok) throw new Error(`Nodes API error: ${nodesRes.status}`)
      if (!contentsRes.ok) throw new Error(`Contents API error: ${contentsRes.status}`)
      if (!edgesRes.ok) throw new Error(`Edges API error: ${edgesRes.status}`)

      const nodesData = await nodesRes.json()
      const contentsData = await contentsRes.json()
      const edgesData = await edgesRes.json()

      setNodes(nodesData.nodes || [])
      setContents(contentsData.contents || [])
      setEdges(edgesData.edges || [])
    } catch (err: any) {
      console.error('Failed to load nebula data:', err)
      setError(err.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      router.push(`/node/${nodeId}`)
    },
    [router]
  )

  const handleReset = useCallback(() => {
    const event = new CustomEvent('nebula-reset')
    window.dispatchEvent(event)
  }, [])

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev
      const event = new CustomEvent('nebula-autorotate', { detail: next })
      window.dispatchEvent(event)
      return next
    })
  }, [])

  // Galaxy loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#050510' }}>
        <div className="text-center">
          <div className="relative mx-auto mb-4 w-16 h-16">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
            />
            <div
              className="absolute inset-2 rounded-full animate-pulse"
              style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
            />
            <div
              className="absolute inset-4 rounded-full"
              style={{ background: 'radial-gradient(circle, #a78bfa 0%, #7c3aed 100%)' }}
            />
          </div>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            🌌 星系生成中...
          </p>
        </div>
      </div>
    )
  }

  // Galaxy error screen
  if (error) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#050510' }}>
        <div className="text-center px-6 max-w-sm">
          <div className="flex justify-center mb-4">
            <AlertCircle size={40} style={{ color: '#ec4899' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
            星系数据丢失
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ background: '#7c3aed' }}
          >
            <RefreshCw size={16} />
            重新生成
          </button>
        </div>
      </div>
    )
  }

  // Galaxy empty state
  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#050510' }}>
        <div className="text-center px-6">
          <div className="text-5xl mb-4">🌌</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
            星系还是空的
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            快去添加知识节点，让属于你的星系诞生吧
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ background: '#050510' }}>
      <KnowledgeNebula
        nodes={nodes}
        contents={contents}
        edges={edges}
        onNodeDoubleClick={handleNodeDoubleClick}
      />

      {/* Floating controls - glass morphism dark */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-md transition-colors"
          style={{
            color: 'rgba(255,255,255,0.8)',
            background: 'rgba(15,15,40,0.85)',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
          title="重置视角"
        >
          <RotateCcw size={14} />
          重置视角
        </button>
        <button
          onClick={toggleAutoRotate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-md transition-colors"
          style={
            autoRotate
              ? { background: 'rgba(124,58,237,0.7)', border: '1px solid rgba(139,92,246,0.5)', color: 'white' }
              : { color: 'rgba(255,255,255,0.8)', background: 'rgba(15,15,40,0.85)', border: '1px solid rgba(139,92,246,0.3)' }
          }
          title="自动旋转"
        >
          <Orbit size={14} />
          {autoRotate ? '停止旋转' : '自动旋转'}
        </button>
      </div>

      {/* Legend - dark glass */}
      <div
        className="absolute top-4 right-4 px-3 py-2.5 rounded-lg text-xs backdrop-blur-md"
        style={{
          color: 'rgba(255,255,255,0.7)',
          background: 'rgba(15,15,40,0.85)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
          <span>多笔记星球</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#7c3aed', boxShadow: '0 0 6px #7c3aed' }} />
          <span>有笔记星球</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#4a4a5a', boxShadow: '0 0 4px #4a4a5a' }} />
          <span>未记录星球</span>
        </div>
      </div>
    </div>
  )
}
