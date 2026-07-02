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
}

export function NetworkGraph({ centerNodeId }: NetworkGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, edgesRes] = await Promise.all([
          fetch('/api/nodes'),
          fetch(centerNodeId ? `/api/edges?nodeId=${centerNodeId}` : '/api/edges'),
        ])

        const nodesData = await nodesRes.json()
        const edgesData = await edgesRes.json()

        const flowNodes: FlowNode[] = nodesData.nodes.map((node: any, index: number) => ({
          id: node.id,
          data: { label: <Link href={`/node/${node.id}`} className="text-blue-600 hover:underline">{node.name}</Link> },
          position: { x: (index % 5) * 200, y: Math.floor(index / 5) * 150 },
          style: {
            background: node.color || '#fff',
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: '8px 12px',
          },
        }))

        const flowEdges: FlowEdge[] = edgesData.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
          label: edge.label || '',
          type: 'smoothstep',
        }))

        setNodes(flowNodes)
        setEdges(flowEdges)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load network data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [centerNodeId, setNodes, setEdges])

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

  if (loading) return <div className="flex items-center justify-center h-full">加载网络图...</div>

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
