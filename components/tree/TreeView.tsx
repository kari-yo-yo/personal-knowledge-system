'use client'

import { useEffect, useState } from 'react'
import { TreeNode } from './TreeNode'
import { Node } from '@/lib/types'

export function TreeView() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/nodes')
      .then((res) => res.json())
      .then((data) => {
        setNodes(data.nodes || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-4 text-sm text-[#8B7355]">加载中...</div>

  if (nodes.length === 0) {
    return (
      <div className="p-4 text-sm text-[#8B7355]">
        暂无系统节点
      </div>
    )
  }

  return (
    <div className="py-2">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} level={0} />
      ))}
    </div>
  )
}
