'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import type { Node, Edge } from '@/lib/types'

interface GraphNode extends Node {
  level: number
  position: [number, number, number]
}

interface GraphEdge extends Edge {
  sourcePosition: [number, number, number]
  targetPosition: [number, number, number]
}

// --- WebGL detection ---
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

// --- Layout utilities ---

function buildTree(nodes: Node[]) {
  const childrenMap = new Map<string, string[]>()
  let root: Node | null = null
  for (const node of nodes) {
    if (node.parentId === null) {
      root = node
    } else {
      if (!childrenMap.has(node.parentId)) childrenMap.set(node.parentId, [])
      childrenMap.get(node.parentId)!.push(node.id)
    }
  }
  return { childrenMap, root }
}

function computeLevels(nodes: Node[], childrenMap: Map<string, string[]>): Map<string, number> {
  const levels = new Map<string, number>()
  const root = nodes.find(n => n.parentId === null)
  if (!root) return levels
  const queue: { id: string; level: number }[] = [{ id: root.id, level: 0 }]
  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    levels.set(id, level)
    const children = childrenMap.get(id) || []
    for (const childId of children) {
      queue.push({ id: childId, level: level + 1 })
    }
  }
  return levels
}

function computePositions(
  nodes: Node[],
  childrenMap: Map<string, string[]>,
  levels: Map<string, number>
): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>()
  const root = nodes.find(n => n.parentId === null)
  if (!root) return positions

  positions.set(root.id, [0, 0, 0])

  const queue: string[] = [root.id]
  while (queue.length > 0) {
    const parentId = queue.shift()!
    const children = childrenMap.get(parentId) || []
    if (children.length === 0) continue

    const parentPos = positions.get(parentId)!
    const parentLevel = levels.get(parentId) ?? 0
    const radius = parentLevel === 0 ? 10 : 4.5 / (parentLevel * 0.6 + 0.4)

    children.forEach((childId, i) => {
      const count = children.length
      let pos: [number, number, number]

      if (parentLevel === 0) {
        const phi = Math.acos(-1 + (2 * i) / Math.max(count, 1))
        const theta = Math.sqrt(count * Math.PI) * phi
        pos = [
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi),
        ]
      } else {
        const angle = (i / Math.max(count, 1)) * Math.PI * 2
        const incl = (Math.PI / 6) * ((i % 3) - 1)
        const jitter = 0.5
        pos = [
          parentPos[0] + radius * Math.cos(incl) * Math.cos(angle) + (Math.random() - 0.5) * jitter,
          parentPos[1] + radius * Math.sin(incl) + (i - count / 2) * 0.35,
          parentPos[2] + radius * Math.cos(incl) * Math.sin(angle) + (Math.random() - 0.5) * jitter,
        ]
      }

      positions.set(childId, pos)
      queue.push(childId)
    })
  }

  const orphans = nodes.filter(n => !positions.has(n.id))
  orphans.forEach((node, i) => {
    const angle = (i / Math.max(orphans.length, 1)) * Math.PI * 2
    const r = 16 + Math.random() * 4
    positions.set(node.id, [
      r * Math.cos(angle),
      (Math.random() - 0.5) * 8,
      r * Math.sin(angle),
    ])
  })

  return positions
}

function getNodeColor(node: GraphNode): string {
  if (node.level === 0) return '#FFD700'
  if (node.color) return node.color
  if (node.level === 1) return '#FF6B8A'
  if (node.level === 2) return '#FFA07A'
  return '#FFDAB9'
}

function getNodeSize(node: GraphNode): number {
  if (node.level === 0) return 1.3
  if (node.level === 1) return 0.85
  if (node.level === 2) return 0.55
  return 0.3
}

// --- 3D Components ---

function Stars() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(300 * 3)
    for (let i = 0; i < 300 * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 80
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  return (
    <points geometry={geometry}>
      <pointsMaterial size={0.1} color="#FF6B8A" transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

function ConnectionLine({
  start,
  end,
  color = '#E8D5C4',
  opacity = 0.35,
  lineWidth = 0.025,
}: {
  start: [number, number, number]
  end: [number, number, number]
  color?: string
  opacity?: number
  lineWidth?: number
}) {
  const geometry = useMemo(() => {
    const startVec = new THREE.Vector3(...start)
    const endVec = new THREE.Vector3(...end)
    const mid = new THREE.Vector3().lerpVectors(startVec, endVec, 0.5)
    mid.y += 1.8
    const curve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec)
    return new THREE.TubeGeometry(curve, 32, lineWidth, 8, false)
  }, [start, end, lineWidth])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

function NodeMesh({
  node,
  onSelect,
  onNavigate,
  isSelected,
}: {
  node: GraphNode
  onSelect: (id: string) => void
  onNavigate: (id: string) => void
  isSelected: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const size = getNodeSize(node)
  const color = getNodeColor(node)
  const isRoot = node.level === 0
  const isDeep = node.level >= 3

  const lastClickRef = useRef(0)

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      const now = Date.now()
      if (now - lastClickRef.current < 350) {
        onNavigate(node.id)
      } else {
        onSelect(node.id)
        lastClickRef.current = now
      }
    },
    [node.id, onSelect, onNavigate]
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    meshRef.current.position.y = node.position[1] + Math.sin(t * 0.6 + node.position[0] * 3) * 0.12
    meshRef.current.rotation.y = t * 0.08 + node.position[2]
    if (isDeep) {
      meshRef.current.rotation.x = t * 0.3
      meshRef.current.rotation.z = t * 0.2
    }
  })

  return (
    <group>
      {isRoot && <pointLight color="#FFD700" intensity={2.5} distance={14} />}

      <mesh
        ref={meshRef}
        position={node.position}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (typeof document !== 'undefined') {
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          if (typeof document !== 'undefined') {
            document.body.style.cursor = 'default'
          }
        }}
      >
        {isDeep ? (
          <octahedronGeometry args={[size * 1.4, 0]} />
        ) : (
          <sphereGeometry args={[size, 32, 32]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={isRoot ? color : '#000000'}
          emissiveIntensity={isRoot ? 0.5 : 0}
          roughness={0.35}
          metalness={0.35}
        />
      </mesh>

      {isRoot && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[size * 1.7, 0.04, 16, 100]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.7}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {isSelected && (
        <mesh position={node.position} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.5, size * 1.8, 32]} />
          <meshBasicMaterial color="#FF6B8A" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      <Html
        position={[node.position[0], node.position[1] + size + 0.7, node.position[2]]}
        center
        distanceFactor={14}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          className="px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-sm"
          style={{
            background: 'rgba(255, 248, 240, 0.92)',
            color: '#5D4E37',
            border: '1px solid #F0E6D8',
          }}
        >
          {node.name}
        </div>
      </Html>
    </group>
  )
}

function Scene({
  nodes,
  edges,
  onNavigate,
}: {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNavigate: (id: string) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>()
    nodes.forEach(n => map.set(n.id, n))
    return map
  }, [nodes])

  const treeConnections = useMemo(() => {
    const conns: { start: [number, number, number]; end: [number, number, number] }[] = []
    for (const node of nodes) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!
        conns.push({ start: parent.position, end: node.position })
      }
    }
    return conns
  }, [nodes, nodeMap])

  const edgeConnections = useMemo(() => {
    const conns: { start: [number, number, number]; end: [number, number, number] }[] = []
    for (const edge of edges) {
      const source = nodeMap.get(edge.sourceId)
      const target = nodeMap.get(edge.targetId)
      if (source && target) {
        conns.push({ start: source.position, end: target.position })
      }
    }
    return conns
  }, [edges, nodeMap])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.7} color="#FFF0E0" />
      <directionalLight position={[-8, -4, -6]} intensity={0.25} color="#FFB6C1" />

      <fog attach="fog" args={['#FFF8F0', 25, 70]} />

      <Stars />

      {treeConnections.map((conn, i) => (
        <ConnectionLine key={`tree-${i}`} start={conn.start} end={conn.end} />
      ))}

      {edgeConnections.map((conn, i) => (
        <ConnectionLine
          key={`edge-${i}`}
          start={conn.start}
          end={conn.end}
          color="#FF6B8A"
          opacity={0.25}
          lineWidth={0.04}
        />
      ))}

      {nodes.map(node => (
        <NodeMesh
          key={node.id}
          node={node}
          onSelect={setSelectedId}
          onNavigate={onNavigate}
          isSelected={selectedId === node.id}
        />
      ))}
    </>
  )
}

// --- Error Fallback ---

function WebGLFallback({ onSwitchTo2D }: { onSwitchTo2D: () => void }) {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: '#FFF8F0' }}>
      <div className="text-center px-6">
        <div className="text-5xl mb-4">🐶</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#5D4E37' }}>
          3D 视图暂不可用
        </h3>
        <p className="text-sm mb-4" style={{ color: '#8B7355' }}>
          您的设备不支持 WebGL，请切换到 2D 视图
        </p>
        <button
          onClick={onSwitchTo2D}
          className="px-4 py-2 rounded-lg text-white font-medium text-sm"
          style={{ background: '#FF6B8A' }}
        >
          切换到 2D 视图
        </button>
      </div>
    </div>
  )
}

// --- Main exported component ---

export function Network3D({ onSwitchTo2D }: { onSwitchTo2D?: () => void }) {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [webglError, setWebglError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && !isWebGLAvailable()) {
      setWebglError(true)
      setLoading(false)
      return
    }

    let cancelled = false
    const fetchData = async () => {
      try {
        const [nodesRes, edgesRes] = await Promise.all([
          fetch('/api/nodes'),
          fetch('/api/edges'),
        ])
        const nodesData = (await nodesRes.json()).nodes as Node[]
        const edgesData = (await edgesRes.json()).edges as Edge[]

        const { childrenMap, root } = buildTree(nodesData)
        if (!root) {
          if (!cancelled) {
            setNodes([])
            setEdges([])
            setLoading(false)
          }
          return
        }

        const levels = computeLevels(nodesData, childrenMap)
        const positions = computePositions(nodesData, childrenMap, levels)

        const graphNodes: GraphNode[] = nodesData.map(n => ({
          ...n,
          level: levels.get(n.id) ?? 99,
          position: positions.get(n.id) ?? [0, 0, 0],
        }))

        const graphEdges: GraphEdge[] = edgesData.map(e => ({
          ...e,
          sourcePosition: positions.get(e.sourceId) ?? [0, 0, 0],
          targetPosition: positions.get(e.targetId) ?? [0, 0, 0],
        }))

        if (!cancelled) {
          setNodes(graphNodes)
          setEdges(graphEdges)
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to load 3D network data:', error)
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  const handleNavigate = useCallback(
    (id: string) => {
      router.push(`/node/${id}`)
    },
    [router]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#FFF8F0' }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto mb-3"
            style={{ borderColor: '#FF6B8A', borderTopColor: 'transparent' }}
          />
          <p style={{ color: '#8B7355' }}>加载 3D 知识网络...</p>
        </div>
      </div>
    )
  }

  if (webglError) {
    return <WebGLFallback onSwitchTo2D={onSwitchTo2D || (() => {})} />
  }

  return (
    <div className="w-full h-full" style={{ background: '#FFF8F0', touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, 6, 26], fov: 55, near: 0.1, far: 100 }}
        style={{ background: '#FFF8F0' }}
        onError={() => setWebglError(true)}
      >
        <Scene nodes={nodes} edges={edges} onNavigate={handleNavigate} />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={55}
          autoRotate
          autoRotateSpeed={0.25}
          enablePan
          enableZoom
        />
      </Canvas>
    </div>
  )
}
