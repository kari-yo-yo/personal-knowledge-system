'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StarCanvas } from './StarCanvas'
import {
  RotateCcw, Orbit, AlertCircle, RefreshCw,
  Eye, EyeOff, Map, Compass, Plane, Globe,
  ChevronsUpDown, Move, ZoomIn, RotateCw, MousePointerClick, MousePointer2
} from 'lucide-react'

interface P5WrapperProps {
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

export function P5Wrapper({ refreshKey }: P5WrapperProps) {
  const router = useRouter()
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [contents, setContents] = useState<ContentData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [rotateSpeed, setRotateSpeed] = useState(30)
  const [showLabels, setShowLabels] = useState(true)
  const [showEdges, setShowEdges] = useState(true)
  const [viewState, setViewState] = useState({ tilt: 60, rot: 0, zoom: 1 })
  const [showControls, setShowControls] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 640
  })
  const [showGuide, setShowGuide] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const ts = Date.now()
      const [nodesRes, contentsRes, edgesRes] = await Promise.all([
        fetch(`/api/nodes?all=true&_t=${ts}`),
        fetch(`/api/contents?_t=${ts}`),
        fetch(`/api/edges?_t=${ts}`),
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

  // Show touch guide on first visit
  useEffect(() => {
    const shown = localStorage.getItem('knowledge-nebula-guide-shown')
    if (!shown) {
      const timer = setTimeout(() => setShowGuide(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  // Responsive: auto-collapse controls on small screens
  useEffect(() => {
    const onResize = () => setShowControls(window.innerWidth >= 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const dismissGuide = useCallback((permanent: boolean) => {
    setShowGuide(false)
    if (permanent) localStorage.setItem('knowledge-nebula-guide-shown', '1')
  }, [])

  // Poll view state from p5 sketch
  useEffect(() => {
    const id = setInterval(() => {
      const instance = (window as any).__nebulaInstance
      if (instance && instance.getViewState) {
        setViewState(instance.getViewState())
      }
    }, 200)
    return () => clearInterval(id)
  }, [])

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      router.push(`/node/${nodeId}`)
    },
    [router]
  )

  const emit = useCallback((eventName: string, detail?: any) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }, [])

  const handleReset = useCallback(() => { emit('nebula-reset') }, [emit])

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev
      emit('nebula-autorotate', next)
      return next
    })
  }, [emit])

  const handleSpeedChange = useCallback(
    (v: number) => {
      setRotateSpeed(v)
      emit('nebula-rotate-speed', v * 0.00002)
    },
    [emit]
  )

  const toggleLabels = useCallback(() => {
    setShowLabels((prev) => {
      const next = !prev
      emit('nebula-show-labels', next)
      return next
    })
  }, [emit])

  const toggleEdges = useCallback(() => {
    setShowEdges((prev) => {
      const next = !prev
      emit('nebula-show-edges', next)
      return next
    })
  }, [emit])

  const setPreset = useCallback(
    (preset: string) => { emit('nebula-preset', preset) },
    [emit]
  )

  const getViewLabel = () => {
    const t = viewState.tilt
    if (t > 75) return '俯视'
    if (t < 15) return '平视'
    if (t > 45) return '斜上'
    return '斜下'
  }

  const btnStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.7)',
    background: 'rgba(10,10,15,0.85)',
    border: '1px solid rgba(255,255,255,0.1)',
  }
  const btnStyleActive: React.CSSProperties = {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: 'rgba(255,255,255,0.95)',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#000000' }}>
        <div className="text-center">
          <div className="relative mx-auto mb-4 w-16 h-16">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)' }} />
            <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)' }} />
            <div className="absolute inset-4 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,250,230,0.4) 100%)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>星空加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#000000' }}>
        <div className="text-center px-6 max-w-sm">
          <div className="flex justify-center mb-4">
            <AlertCircle size={40} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>星空数据丢失</h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{error}</p>
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <RefreshCw size={16} /> 重新加载
          </button>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#000000' }}>
        <div className="text-center px-6">
          <div className="text-5xl mb-4">✦</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>星空还是空的</h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>快去添加知识节点，让属于你的星空诞生吧</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ background: '#000000' }}>
      <StarCanvas
        nodes={nodes}
        contents={contents}
        edges={edges}
        onNodeDoubleClick={handleNodeDoubleClick}
      />

      {/* Bottom-left controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <button onClick={() => setShowControls((v) => !v)} className="flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-md transition-all hover:bg-white/[0.08]" style={{ ...btnStyle, minWidth: 44, minHeight: 44 }} title={showControls ? '收起面板' : '展开面板'}>
          <ChevronsUpDown size={16} />
        </button>

        <div className="flex flex-col gap-2 transition-all duration-200 ease-out overflow-hidden" style={{ maxHeight: showControls ? 400 : 0, opacity: showControls ? 1 : 0, transform: showControls ? 'translateY(0)' : 'translateY(8px)' }}>
          <div className="flex items-center gap-1.5">
            {[
              { key: 'overview', icon: Globe, label: '全景' },
              { key: 'top', icon: Map, label: '俯视' },
              { key: 'side', icon: Compass, label: '侧面' },
            ].map((preset) => (
              <button key={preset.key} onClick={() => setPreset(preset.key)} className="flex items-center gap-1 px-3 py-2.5 rounded-md text-xs font-medium backdrop-blur-md transition-all hover:bg-white/[0.08]" style={{ ...btnStyle, minHeight: 36 }}>
                <preset.icon size={12} /> {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={handleReset} className="flex items-center gap-1 px-3 py-2.5 rounded-md text-xs font-medium backdrop-blur-md transition-all hover:bg-white/[0.08]" style={{ ...btnStyle, minHeight: 36 }} title="重置视角">
              <RotateCcw size={12} /> 重置
            </button>
            <button onClick={toggleAutoRotate} className="flex items-center gap-1 px-3 py-2.5 rounded-md text-xs font-medium backdrop-blur-md transition-all" style={autoRotate ? { ...btnStyleActive, minHeight: 36 } : { ...btnStyle, minHeight: 36 }}>
              <Orbit size={12} /> {autoRotate ? '停止' : '自转'}
            </button>
            <button onClick={toggleLabels} className="flex items-center gap-1 px-3 py-2.5 rounded-md text-xs font-medium backdrop-blur-md transition-all hover:bg-white/[0.08]" style={{ ...btnStyle, minHeight: 36, color: showLabels ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}>
              {showLabels ? <Eye size={12} /> : <EyeOff size={12} />} 标签
            </button>
            <button onClick={toggleEdges} className="flex items-center gap-1 px-3 py-2.5 rounded-md text-xs font-medium backdrop-blur-md transition-all hover:bg-white/[0.08]" style={{ ...btnStyle, minHeight: 36, color: showEdges ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}>
              <Plane size={12} /> 连线
            </button>
          </div>

          {autoRotate && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md backdrop-blur-md" style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>转速</span>
              <input type="range" min={5} max={100} value={rotateSpeed} onChange={(e) => handleSpeedChange(Number(e.target.value))} className="w-20 h-1 rounded-lg appearance-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.15)', accentColor: 'rgba(255,255,255,0.7)' }} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom-right view state */}
      <div className="absolute bottom-4 right-4 hidden sm:block px-3 py-1.5 rounded-md text-[10px] font-mono backdrop-blur-md" style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(10,10,15,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {getViewLabel()} · {viewState.rot}° · {Math.round(viewState.zoom * 100)}%
      </div>

      {/* Top-right legend */}
      <div className="absolute top-4 right-4 px-3 py-2.5 rounded-lg text-xs backdrop-blur-md" style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,250,230,0.6) 40%, transparent 70%)', boxShadow: '0 0 6px rgba(255,255,255,0.4)' }} />
          <span className="hidden sm:inline">1 等星 · 多笔记</span>
          <span className="sm:hidden">多笔记</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(232,240,255,0.4) 50%, transparent 70%)', boxShadow: '0 0 4px rgba(255,255,255,0.2)' }} />
          <span className="hidden sm:inline">3 等星 · 有笔记</span>
          <span className="sm:hidden">有笔记</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)', boxShadow: '0 0 2px rgba(255,255,255,0.1)' }} />
          <span className="hidden sm:inline">6 等星 · 未记录</span>
          <span className="sm:hidden">未记录</span>
        </div>
      </div>

      {/* Touch gesture guide */}
      {showGuide && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={() => dismissGuide(false)}>
          <div className="w-full max-w-xs rounded-xl p-5" style={{ background: 'rgba(10,10,15,0.95)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4 text-center" style={{ color: 'rgba(255,255,255,0.9)' }}>星空操作指南</h3>
            <div className="space-y-3">
              {[
                { icon: Move, title: '单指滑动', desc: '旋转视角' },
                { icon: ZoomIn, title: '双指捏合', desc: '放大 / 缩小' },
                { icon: RotateCw, title: '双指旋转', desc: '倾斜视角' },
                { icon: MousePointerClick, title: '单击星星', desc: '选中 / 查看' },
                { icon: MousePointer2, title: '双击星星', desc: '聚焦并进入' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <item.icon size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.title}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 mt-5">
              <button onClick={() => dismissGuide(true)} className="w-full py-2.5 rounded-lg text-xs font-medium transition-colors" style={{ color: 'rgba(0,0,0,0.9)', background: 'rgba(255,255,255,0.85)' }}>我知道了</button>
              <button onClick={() => dismissGuide(false)} className="w-full py-2 rounded-lg text-[10px] transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>暂时隐藏</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
