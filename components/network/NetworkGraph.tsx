'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Node as FlowNode,
  Edge as FlowEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'
import Link from 'next/link'

interface NetworkGraphProps {
  centerNodeId?: string
  refreshKey?: number
}

interface NodeData {
  id: string
  name: string
  parentId: string | null
  color: string | null
  children: any[]
}

function calculateTreeLayout(nodes: NodeData[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  // Build parent->children map
  const childrenMap = new Map<string, string[]>()
  nodes.forEach((node) => {
    if (node.parentId) {
      const siblings = childrenMap.get(node.parentId) || []
      siblings.push(node.id)
      childrenMap.set(node.parentId, siblings)
    }
  })

  // Find root nodes
  const roots = nodes.filter((n) => !n.parentId)

  const H_SPACING = 200
  const V_SPACING = 120

  function layoutNode(nodeId: string, x: number, y: number): number {
    positions.set(nodeId, { x, y })
    const children = childrenMap.get(nodeId) || []
    if (children.length === 0) return x

    const totalWidth = (children.length - 1) * H_SPACING
    const startX = x - totalWidth / 2
    let maxX = x

    children.forEach((childId, i) => {
      const childX = layoutNode(childId, startX + i * H_SPACING, y + V_SPACING)
      maxX = Math.max(maxX, childX)
    })

    return maxX
  }

  // Layout roots side by side
  let startX = 100
  roots.forEach((root) => {
    startX = layoutNode(root.id, startX, 50) + H_SPACING * 2
  })

  return positions
}

function NodeLabel({
  node,
  noteCount,
}: {
  node: NodeData
  noteCount: number
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Link
        href={`/node/${node.id}`}
        className="text-sm font-medium truncate hover:underline"
        style={{ color: 'var(--text-primary)' }}
      >
        {node.name}
      </Link>
      {noteCount > 0 && (
        <span
          className="inline-flex items-center justify-center text-[10px] font-bold text-white rounded-full min-w-[16px] h-4 px-1 shrink-0"
          style={{ background: '#FF6B8A' }}
        >
          {noteCount}
        </span>
      )}
    </div>
  )
}

export function NetworkGraph({ centerNodeId, refreshKey }: NetworkGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, contentsRes, edgesRes] = await Promise.all([
          fetch('/api/nodes?all=true'),
          fetch('/api/contents'),
          fetch(centerNodeId ? `/api/edges?nodeId=${centerNodeId}` : '/api/edges'),
        ])

        const nodesData = await nodesRes.json()
        const contentsData = await contentsRes.json()
        const edgesData = await edgesRes.json()

        // Count notes per node
        const noteCounts = new Map<string, number>()
        if (contentsData.contents) {
          contentsData.contents.forEach((c: any) => {
            noteCounts.set(c.nodeId, (noteCounts.get(c.nodeId) || 0) + 1)
          })
        }

        // Flatten all nodes (root + children recursively)
        const allNodes: NodeData[] = []
        function collectNodes(nodeList: any[]) {
          nodeList.forEach((n: any) => {
            allNodes.push(n)
            if (n.children && n.children.length > 0) {
              collectNodes(n.children)
            }
          })
        }
        collectNodes(nodesData.nodes || [])

        // Calculate tree layout
        const positions = calculateTreeLayout(allNodes)

        const flowNodes: FlowNode[] = allNodes.map((node: NodeData) => {
          const pos = positions.get(node.id) || { x: 0, y: 0 }
          const noteCount = noteCounts.get(node.id) || 0
          return {
            id: node.id,
            data: {
              label: <NodeLabel node={node} noteCount={noteCount} />,
            },
            position: pos,
            style: {
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderLeft: `4px solid ${node.color || 'var(--glass-border)'}`,
              borderRadius: 8,
              padding: '8px 12px',
              minWidth: 120,
              maxWidth: 220,
            },
          }
        })

        // Build parent-child edges from the node structure
        const flowEdges: FlowEdge[] = []
        const edgeSet = new Set<string>()

        allNodes.forEach((node) => {
          if (node.parentId) {
            const edgeId = `${node.parentId}-${node.id}`
            if (!edgeSet.has(edgeId)) {
              edgeSet.add(edgeId)
              flowEdges.push({
                id: edgeId,
                source: node.parentId,
                target: node.id,
                type: 'smoothstep',
                style: { stroke: 'var(--glass-border)', strokeWidth: 2 },
              })
            }
          }
        })

        // Add user-defined edges
        if (edgesData.edges) {
          edgesData.edges.forEach((edge: any) => {
            const edgeId = edge.id
            if (!edgeSet.has(edgeId)) {
              edgeSet.add(edgeId)
              flowEdges.push({
                id: edgeId,
                source: edge.sourceId,
                target: edge.targetId,
                label: edge.label || '',
                type: 'smoothstep',
                style: { stroke: '#FF6B8A', strokeWidth: 1.5 },
              })
            }
          })
        }

        setNodes(flowNodes)
        setEdges(flowEdges)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load network data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [centerNodeId, setNodes, setEdges, refreshKey])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        fetch('/api/edges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: connection.source,
            targetId: connection.target,
          }),
        })
        setEdges((eds) => addEdge(connection, eds))
      }
    },
    [setEdges]
  )

  if (loading)
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--bg-deep)' }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto mb-3"
            style={{ borderColor: '#FF6B8A', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>加载网络图...</p>
        </div>
      </div>
    )

  return (
    <div className="w-full h-full" style={{ background: 'var(--bg-deep)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background color="var(--glass-border)" gap={16} />
      </ReactFlow>
    </div>
  )
}
