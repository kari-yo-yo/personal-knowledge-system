'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, Plus, Crown, Layers } from 'lucide-react'
import Link from 'next/link'
import { Node } from '@/lib/types'

interface TreeNodeProps {
  node: Node & { children?: Node[] }
  level?: number
}

export function TreeNode({ node, level = 0 }: TreeNodeProps) {
  const initialChildren = node.children && node.children.length > 0 ? node.children : undefined
  const [isOpen, setIsOpen] = useState(level < 1 && !!initialChildren)
  const [children, setChildren] = useState<Node[] | undefined>(initialChildren)
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const hasChildren = children !== undefined ? children.length > 0 : undefined
  const childCount = children?.length ?? 0

  const fetchChildren = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/nodes?parentId=${node.id}`)
      const data = await res.json()
      setChildren(data.nodes || [])
    } catch (err) {
      console.error('Failed to fetch children:', err)
      setChildren([])
    } finally {
      setLoading(false)
    }
  }, [node.id])

  const handleToggle = () => {
    if (!isOpen && children === undefined) {
      fetchChildren()
    }
    setIsOpen(!isOpen)
  }

  const handleCreateChild = async () => {
    const name = prompt('请输入子系统名称')
    if (!name) return
    const res = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        parentId: node.id,
        type: level === 0 ? 'SYSTEM' : 'SUBSYSTEM',
        color: node.color || '#FF6B8A',
      }),
    })
    if (res.ok) {
      if (!isOpen) setIsOpen(true)
      fetchChildren()
    }
    setShowMenu(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as globalThis.Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const isRoot = level === 0
  const isSystem = level === 1

  // Visual styles based on depth
  const containerClasses = [
    'flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-colors group',
    isRoot
      ? 'font-bold text-base hover:bg-orange-100'
      : isSystem
        ? 'font-medium text-sm hover:bg-orange-50 border-l-2'
        : 'text-sm hover:bg-orange-50/60',
  ].join(' ')

  const iconColor = isRoot
    ? 'var(--accent-warm)'
    : isSystem
      ? node.color || 'var(--text-muted)'
      : 'var(--text-muted)'

  const nameClasses = [
    'truncate transition-colors',
    isRoot
      ? 'text-[var(--text-primary)]'
      : isSystem
        ? 'text-[var(--text-primary)]'
        : 'text-[var(--text-muted)]',
  ].join(' ')

  const indent = level * 18 + 8

  return (
    <div>
      <div
        className={containerClasses}
        style={{
          paddingLeft: `${indent}px`,
          borderLeftColor: isSystem ? (node.color || 'var(--glass-border)') : 'transparent',
        }}
      >
        {/* Expand/collapse toggle */}
        {loading ? (
          <span className="w-[22px] h-[22px] flex items-center justify-center shrink-0">
            <div className="w-3 h-3 border-2 border-[var(--glass-border)] border-t-[var(--accent-warm)] rounded-full animate-spin" />
          </span>
        ) : hasChildren !== false ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-[var(--glass-border)] rounded shrink-0 transition-colors"
            title={isOpen ? '收起' : '展开'}
          >
            {isOpen ? (
              <ChevronDown size={14} className="text-[var(--text-muted)]" />
            ) : (
              <ChevronRight size={14} className="text-[var(--text-muted)]" />
            )}
          </button>
        ) : (
          <span className="w-[22px] shrink-0" />
        )}

        {/* Depth icon */}
        {isRoot ? (
          <Crown size={16} className="shrink-0" style={{ color: '#FF6B8A' }} />
        ) : isSystem ? (
          <Folder size={14} className="shrink-0" style={{ color: iconColor }} />
        ) : (
          <Layers size={13} className="shrink-0" style={{ color: iconColor }} />
        )}

        {/* Node name */}
        <Link
          href={`/node/${node.id}`}
          className={nameClasses}
          title={node.name}
        >
          {node.name}
        </Link>

        {/* Child count badge */}
        {childCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] font-medium shrink-0">
            {childCount}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1 min-w-[8px]" />

        {/* Actions menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--glass-border)] transition-all"
            title="操作"
          >
            <Plus size={14} className="text-[var(--text-muted)]" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-[var(--bg-surface)] border rounded-lg shadow-lg z-50 min-w-[130px] py-1"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCreateChild()
                }}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-2"
              >
                <Folder size={14} style={{ color: node.color || '#FF6B8A' }} />
                新建子系统
              </button>
              <Link
                href={`/node/${node.id}?action=add-content`}
                onClick={() => setShowMenu(false)}
                className="block w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] flex items-center gap-2"
              >
                <FileText size={14} className="text-[var(--text-muted)]" />
                添加内容
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {isOpen && children !== undefined && (
        <div>
          {children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
