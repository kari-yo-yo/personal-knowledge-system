'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react'
import Link from 'next/link'
import { Node } from '@/lib/types'

interface TreeNodeProps {
  node: Node & { children?: Node[] }
  level?: number
}

export function TreeNode({ node, level = 0 }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 1)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 hover:bg-slate-100 rounded cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-0.5 hover:bg-slate-200 rounded"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[22px]" />
        )}
        
        {hasChildren ? <Folder size={14} className="text-slate-500" /> : <FileText size={14} className="text-slate-400" />}
        
        <Link
          href={`/node/${node.id}`}
          className="text-sm text-slate-700 hover:text-slate-900 truncate"
        >
          {node.name}
        </Link>
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
