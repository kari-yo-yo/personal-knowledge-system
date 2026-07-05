'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { KnowledgeNebula } from './KnowledgeNebula'
import { RotateCcw, Orbit, AlertCircle, RefreshCw } from 'lucide-react'

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
    // Access the p5 instance reset function through a custom event or direct ref
    // Since we can't easily access the p5 closure, we'll re-mount by toggling a key
    // Alternative: use a global event or expose via window
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#FFF8F0' }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto mb-3"
            style={{ borderColor: '#FF6B8A', borderTopColor: 'transparent' }}
          />
          <p style={{ color: '#8B7355' }}>加载知识星云...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#FFF8F0' }}>
        <div className="text-center px-6 max-w-sm">
          <div className="flex justify-center mb-4">
            <AlertCircle size={40} style={{ color: '#FF6B8A' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#5D4E37' }}>
            加载失败
          </h3>
          <p className="text-sm mb-4" style={{ color: '#8B7355' }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ background: '#FF6B8A' }}
          >
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#FFF8F0' }}>
        <div className="text-center px-6">
          <div className="text-5xl mb-4">✨</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#5D4E37' }}>
            知识星云还是空的
          </h3>
          <p className="text-sm mb-4" style={{ color: '#8B7355' }}>
            快去添加一些知识节点，让星云亮起来吧！
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ background: '#FFF8F0' }}>
      <KnowledgeNebula
        nodes={nodes}
        contents={contents}
        edges={edges}
        onNodeDoubleClick={handleNodeDoubleClick}
      />

      {/* Floating controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium shadow-sm bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
          style={{ color: '#5D4E37', border: '1px solid #F0E6D8' }}
          title="重置视图"
        >
          <RotateCcw size={14} />
          重置视图
        </button>
        <button
          onClick={toggleAutoRotate}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium shadow-sm backdrop-blur-sm transition-colors ${
            autoRotate ? 'text-white' : 'bg-white/90 hover:bg-white'
          }`}
          style={
            autoRotate
              ? { background: '#FF6B8A', border: '1px solid #FF6B8A' }
              : { color: '#5D4E37', border: '1px solid #F0E6D8' }
          }
          title="自动旋转"
        >
          <Orbit size={14} />
          {autoRotate ? '停止旋转' : '自动旋转'}
        </button>
      </div>

      {/* Legend */}
      <div
        className="absolute top-4 right-4 px-3 py-2 rounded-lg text-xs shadow-sm bg-white/90 backdrop-blur-sm"
        style={{ color: '#8B7355', border: '1px solid #F0E6D8' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFD700' }} />
          <span>根节点</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF6B8A' }} />
          <span>一级节点</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFA07A' }} />
          <span>深层节点</span>
        </div>
      </div>
    </div>
  )
}
