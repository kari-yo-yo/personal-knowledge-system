'use client'

import { useEffect, useRef, useCallback } from 'react'
import p5 from 'p5'

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

interface NebulaNode {
  id: string
  name: string
  x: number
  y: number
  level: number
  color: string
  radius: number
  glowRadius: number
  noteCount: number
  parentId: string | null
}

interface NebulaEdge {
  sourceId: string
  targetId: string
  type: 'tree' | 'custom'
}

interface KnowledgeNebulaProps {
  nodes: NodeData[]
  contents: ContentData[]
  edges: EdgeData[]
  onNodeClick?: (nodeId: string) => void
  onNodeDoubleClick?: (nodeId: string) => void
}

const LEVEL_COLORS = ['#FFD700', '#FF6B8A', '#FFA07A', '#FFDAB9', '#E8D5C4', '#D4C4B0']
const BG_COLOR = '#FFF8F0'
const LINE_COLOR_TREE = '#F0E6D8'
const LINE_COLOR_CUSTOM = '#FF6B8A'

function flattenNodes(nodeList: NodeData[]): NodeData[] {
  const result: NodeData[] = []
  function collect(list: NodeData[]) {
    list.forEach((n) => {
      result.push(n)
      if (n.children && n.children.length > 0) {
        collect(n.children)
      }
    })
  }
  collect(nodeList)
  return result
}

function buildNebulaData(
  nodes: NodeData[],
  contents: ContentData[],
  edges: EdgeData[]
): { nebulaNodes: NebulaNode[]; nebulaEdges: NebulaEdge[] } {
  const allNodes = flattenNodes(nodes)
  const noteCounts = new Map<string, number>()
  contents.forEach((c) => {
    noteCounts.set(c.nodeId, (noteCounts.get(c.nodeId) || 0) + 1)
  })

  // Build parent->children map
  const childrenMap = new Map<string, string[]>()
  allNodes.forEach((n) => {
    if (n.parentId) {
      const siblings = childrenMap.get(n.parentId) || []
      siblings.push(n.id)
      childrenMap.set(n.parentId, siblings)
    }
  })

  // Calculate levels
  const levels = new Map<string, number>()
  const root = allNodes.find((n) => !n.parentId)
  if (root) {
    const queue: { id: string; level: number }[] = [{ id: root.id, level: 0 }]
    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      levels.set(id, level)
      const children = childrenMap.get(id) || []
      children.forEach((childId) => queue.push({ id: childId, level: level + 1 }))
    }
  }

  // Calculate positions - radial layout with spiral
  const positions = new Map<string, { x: number; y: number }>()
  const BASE_RADIUS = 120
  const RADIUS_STEP = 100

  if (root) {
    positions.set(root.id, { x: 0, y: 0 })

    const processed = new Set<string>([root.id])
    let currentLevel = 0

    while (true) {
      const levelNodes = allNodes.filter((n) => levels.get(n.id) === currentLevel && processed.has(n.id))
      if (levelNodes.length === 0) break

      const nextLevelNodes = allNodes.filter((n) => levels.get(n.id) === currentLevel + 1)
      if (nextLevelNodes.length === 0) break

      const radius = BASE_RADIUS + currentLevel * RADIUS_STEP

      // Group next level nodes by their parent
      const parentGroups = new Map<string, NodeData[]>()
      nextLevelNodes.forEach((n) => {
        const parentId = n.parentId || root.id
        const group = parentGroups.get(parentId) || []
        group.push(n)
        parentGroups.set(parentId, group)
      })

      parentGroups.forEach((group, parentId) => {
        const parentPos = positions.get(parentId) || { x: 0, y: 0 }
        const count = group.length

        // Distribute children in an arc around parent
        const arcWidth = Math.min(Math.PI * 1.2, (Math.PI * 2) / Math.max(parentGroups.size, 1))
        const baseAngle = Math.atan2(parentPos.y, parentPos.x) + Math.PI

        group.forEach((node, i) => {
          const angleOffset = count === 1 ? 0 : (i - (count - 1) / 2) * (arcWidth / Math.max(count - 1, 1))
          const angle = baseAngle + angleOffset + (Math.random() - 0.5) * 0.15
          const dist = radius + (Math.random() - 0.5) * 30
          positions.set(node.id, {
            x: parentPos.x + Math.cos(angle) * dist,
            y: parentPos.y + Math.sin(angle) * dist,
          })
          processed.add(node.id)
        })
      })

      currentLevel++
    }

    // Handle orphans (nodes without proper parent in tree)
    allNodes.forEach((node) => {
      if (!positions.has(node.id)) {
        const angle = Math.random() * Math.PI * 2
        const dist = BASE_RADIUS + (currentLevel + 1) * RADIUS_STEP + Math.random() * 80
        positions.set(node.id, {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
        })
      }
    })
  }

  const nebulaNodes: NebulaNode[] = allNodes.map((node) => {
    const level = levels.get(node.id) || 0
    const noteCount = noteCounts.get(node.id) || 0
    const pos = positions.get(node.id) || { x: 0, y: 0 }
    const baseRadius = level === 0 ? 18 : level === 1 ? 12 : level === 2 ? 8 : 6
    const noteBonus = Math.min(noteCount * 1.5, 8)

    return {
      id: node.id,
      name: node.name,
      x: pos.x,
      y: pos.y,
      level,
      color: node.color || LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)],
      radius: baseRadius + noteBonus * 0.5,
      glowRadius: (baseRadius + noteBonus) * 2.5,
      noteCount,
      parentId: node.parentId,
    }
  })

  const nebulaEdges: NebulaEdge[] = []

  // Tree edges
  allNodes.forEach((node) => {
    if (node.parentId) {
      nebulaEdges.push({ sourceId: node.parentId, targetId: node.id, type: 'tree' })
    }
  })

  // Custom edges
  edges.forEach((edge) => {
    nebulaEdges.push({ sourceId: edge.sourceId, targetId: edge.targetId, type: 'custom' })
  })

  return { nebulaNodes, nebulaEdges }
}

export function KnowledgeNebula({ nodes, contents, edges, onNodeClick, onNodeDoubleClick }: KnowledgeNebulaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)
  const dataRef = useRef(buildNebulaData(nodes, contents, edges))
  const callbacksRef = useRef({ onNodeClick, onNodeDoubleClick })

  callbacksRef.current = { onNodeClick, onNodeDoubleClick }

  useEffect(() => {
    dataRef.current = buildNebulaData(nodes, contents, edges)
    // Trigger redraw if p5 instance exists
    if (p5Ref.current) {
      p5Ref.current.loop()
      p5Ref.current.redraw()
    }
  }, [nodes, contents, edges])

  const sketch = useCallback((p: p5) => {
    let canvasWidth = 0
    let canvasHeight = 0
    let cameraX = 0
    let cameraY = 0
    let zoom = 1
    let targetZoom = 1
    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0
    let cameraStartX = 0
    let cameraStartY = 0
    let hoveredNode: NebulaNode | null = null
    let selectedNodeId: string | null = null
    let lastClickTime = 0
    let lastClickNode: string | null = null
    let backgroundStars: { x: number; y: number; size: number; alpha: number }[] = []
    let autoRotate = false
    let autoRotateAngle = 0

    const MIN_ZOOM = 0.15
    const MAX_ZOOM = 3.5

    function generateStars() {
      backgroundStars = []
      for (let i = 0; i < 150; i++) {
        backgroundStars.push({
          x: p.random(-2000, 2000),
          y: p.random(-2000, 2000),
          size: p.random(0.5, 2.5),
          alpha: p.random(30, 120),
        })
      }
    }

    function worldToScreen(wx: number, wy: number) {
      return {
        x: (wx - cameraX) * zoom + canvasWidth / 2,
        y: (wy - cameraY) * zoom + canvasHeight / 2,
      }
    }

    function screenToWorld(sx: number, sy: number) {
      return {
        x: (sx - canvasWidth / 2) / zoom + cameraX,
        y: (sy - canvasHeight / 2) / zoom + cameraY,
      }
    }

    function getNodeAt(x: number, y: number): NebulaNode | null {
      const world = screenToWorld(x, y)
      const { nebulaNodes } = dataRef.current
      // Check in reverse order (top-most first)
      for (let i = nebulaNodes.length - 1; i >= 0; i--) {
        const node = nebulaNodes[i]
        const dx = world.x - node.x
        const dy = world.y - node.y
        const hitRadius = node.radius + 8
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          return node
        }
      }
      return null
    }

    function drawGlow(x: number, y: number, radius: number, color: string, alpha: number) {
      const steps = 8
      for (let i = steps; i >= 0; i--) {
        const t = i / steps
        const r = radius * (0.3 + t * 0.7)
        const a = alpha * (1 - t) * 0.4
        p.noStroke()
        const c = p.color(color)
        p.fill(p.red(c), p.green(c), p.blue(c), a)
        p.circle(x, y, r * 2)
      }
    }

    function drawBezierConnection(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      alpha: number,
      pulse = false
    ) {
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2
      const offset = 20 * zoom

      p.noFill()
      p.strokeWeight(pulse ? 1.5 : 1)
      const c = p.color(color)
      const pulseAlpha = pulse ? alpha * (0.6 + 0.4 * Math.sin(p.millis() * 0.002)) : alpha
      p.stroke(p.red(c), p.green(c), p.blue(c), pulseAlpha)

      p.bezier(x1, y1, midX, midY - offset, midX, midY - offset, x2, y2)
    }

    p.setup = () => {
      const container = containerRef.current
      if (!container) return
      canvasWidth = container.clientWidth
      canvasHeight = container.clientHeight
      const canvas = p.createCanvas(canvasWidth, canvasHeight)
      canvas.parent(container)
      p.pixelDensity(Math.min(window.devicePixelRatio, 2))
      generateStars()

      // Center camera on root node
      const { nebulaNodes } = dataRef.current
      const root = nebulaNodes.find((n) => n.level === 0)
      if (root) {
        cameraX = root.x
        cameraY = root.y
      }
    }

    p.draw = () => {
      // Smooth zoom
      zoom += (targetZoom - zoom) * 0.15

      // Auto rotate
      if (autoRotate && !isDragging) {
        autoRotateAngle += 0.0003
        const { nebulaNodes } = dataRef.current
        const root = nebulaNodes.find((n) => n.level === 0)
        if (root) {
          const cx = root.x
          const cy = root.y
          const cos = Math.cos(0.0003)
          const sin = Math.sin(0.0003)
          const dx = cameraX - cx
          const dy = cameraY - cy
          cameraX = cx + dx * cos - dy * sin
          cameraY = cy + dx * sin + dy * cos
        }
      }

      // Background
      p.background(BG_COLOR)

      // Draw background stars
      p.noStroke()
      backgroundStars.forEach((star) => {
        const screen = worldToScreen(star.x, star.y)
        if (screen.x < -10 || screen.x > canvasWidth + 10 || screen.y < -10 || screen.y > canvasHeight + 10) return
        p.fill(200, 180, 160, star.alpha)
        p.circle(screen.x, screen.y, star.size * zoom)
      })

      const { nebulaNodes, nebulaEdges } = dataRef.current

      // Get selected node
      const selectedNode = nebulaNodes.find((n) => n.id === selectedNodeId)

      // Draw edges
      nebulaEdges.forEach((edge) => {
        const source = nebulaNodes.find((n) => n.id === edge.sourceId)
        const target = nebulaNodes.find((n) => n.id === edge.targetId)
        if (!source || !target) return

        const s1 = worldToScreen(source.x, source.y)
        const s2 = worldToScreen(target.x, target.y)

        // Skip if both off-screen
        const margin = 50
        if (
          (s1.x < -margin && s2.x < -margin) ||
          (s1.x > canvasWidth + margin && s2.x > canvasWidth + margin) ||
          (s1.y < -margin && s2.y < -margin) ||
          (s1.y > canvasHeight + margin && s2.y > canvasHeight + margin)
        ) {
          return
        }

        const isHighlighted =
          selectedNode && (edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id)
        const isDimmed = selectedNode && !isHighlighted

        if (edge.type === 'tree') {
          drawBezierConnection(
            s1.x,
            s1.y,
            s2.x,
            s2.y,
            LINE_COLOR_TREE,
            isDimmed ? 30 : isHighlighted ? 180 : 100
          )
        } else {
          drawBezierConnection(
            s1.x,
            s1.y,
            s2.x,
            s2.y,
            LINE_COLOR_CUSTOM,
            isDimmed ? 25 : isHighlighted ? 200 : 120,
            !isDimmed
          )
        }
      })

      // Draw nodes
      nebulaNodes.forEach((node) => {
        const screen = worldToScreen(node.x, node.y)

        // Culling
        if (screen.x < -100 || screen.x > canvasWidth + 100 || screen.y < -100 || screen.y > canvasHeight + 100) {
          return
        }

        const isHovered = hoveredNode?.id === node.id
        const isSelected = selectedNodeId === node.id
        const isConnected =
          selectedNode &&
          (selectedNode.id === node.id ||
            nebulaEdges.some(
              (e) =>
                (e.sourceId === selectedNode.id && e.targetId === node.id) ||
                (e.targetId === selectedNode.id && e.sourceId === node.id)
            ))
        const isDimmed = selectedNode && !isConnected

        const glowR = node.glowRadius * zoom * (isHovered || isSelected ? 1.3 : 1)
        const nodeR = node.radius * zoom * (isHovered ? 1.15 : 1)

        // Glow
        if (!isDimmed || isHovered) {
          drawGlow(
            screen.x,
            screen.y,
            glowR,
            node.color,
            isDimmed ? 40 : isHovered || isSelected ? 180 : 100
          )
        }

        // Core
        p.noStroke()
        const c = p.color(node.color)
        if (isDimmed) {
          p.fill(p.red(c), p.green(c), p.blue(c), 60)
        } else {
          p.fill(c)
        }
        p.circle(screen.x, screen.y, nodeR * 2)

        // Inner highlight
        if (!isDimmed) {
          p.fill(255, 255, 255, isHovered ? 120 : 60)
          p.circle(screen.x - nodeR * 0.2, screen.y - nodeR * 0.2, nodeR * 0.8)
        }

        // Selection ring
        if (isSelected) {
          p.noFill()
          p.stroke('#FF6B8A')
          p.strokeWeight(2)
          p.circle(screen.x, screen.y, (nodeR + 6) * 2)
        }

        // Label
        if (zoom > 0.4 || isHovered || isSelected) {
          const labelAlpha = isDimmed ? 80 : isHovered || isSelected ? 255 : Math.min(255, (zoom - 0.3) * 500)
          if (labelAlpha > 20) {
            p.noStroke()
            p.fill(93, 78, 55, labelAlpha)
            p.textAlign(p.CENTER, p.TOP)
            p.textSize(Math.max(10, 12 * zoom))
            p.textFont('sans-serif')
            p.text(node.name, screen.x, screen.y + nodeR + 6)

            if (node.noteCount > 0) {
              p.fill(255, 107, 138, labelAlpha)
              p.textSize(Math.max(9, 10 * zoom))
              p.text(`${node.noteCount} 笔记`, screen.x, screen.y + nodeR + 6 + Math.max(12, 14 * zoom))
            }
          }
        }
      })

      // Tooltip for hovered node
      if (hoveredNode && !isDragging) {
        const screen = worldToScreen(hoveredNode.x, hoveredNode.y)
        const tooltipX = screen.x + 20
        const tooltipY = screen.y - 20
        const padding = 10
        const lineHeight = 18

        p.textAlign(p.LEFT, p.TOP)
        p.textSize(12)
        const nameWidth = p.textWidth(hoveredNode.name)
        const noteText = hoveredNode.noteCount > 0 ? `${hoveredNode.noteCount} 条笔记` : ''
        const noteWidth = noteText ? p.textWidth(noteText) : 0
        const maxWidth = Math.max(nameWidth, noteWidth)
        const boxW = maxWidth + padding * 2
        const boxH = noteText ? lineHeight * 2 + padding * 2 : lineHeight + padding * 2

        // Tooltip background
        p.fill(255, 248, 240, 230)
        p.stroke(240, 230, 216)
        p.strokeWeight(1)
        p.rect(tooltipX, tooltipY, boxW, boxH, 6)

        // Tooltip text
        p.noStroke()
        p.fill(93, 78, 55)
        p.text(hoveredNode.name, tooltipX + padding, tooltipY + padding)
        if (noteText) {
          p.fill(255, 107, 138)
          p.textSize(11)
          p.text(noteText, tooltipX + padding, tooltipY + padding + lineHeight)
        }
      }

      // Stop looping if idle (save CPU)
      if (!isDragging && !autoRotate && Math.abs(targetZoom - zoom) < 0.001 && !hoveredNode) {
        p.noLoop()
      }
    }

    p.mousePressed = () => {
      if (p.mouseX < 0 || p.mouseX > canvasWidth || p.mouseY < 0 || p.mouseY > canvasHeight) return
      const node = getNodeAt(p.mouseX, p.mouseY)
      if (node) {
        const now = Date.now()
        if (lastClickNode === node.id && now - lastClickTime < 350) {
          // Double click
          callbacksRef.current.onNodeDoubleClick?.(node.id)
          lastClickTime = 0
          lastClickNode = null
          return
        }
        lastClickTime = now
        lastClickNode = node.id
        selectedNodeId = selectedNodeId === node.id ? null : node.id
        callbacksRef.current.onNodeClick?.(node.id)
        p.loop()
      } else {
        isDragging = true
        dragStartX = p.mouseX
        dragStartY = p.mouseY
        cameraStartX = cameraX
        cameraStartY = cameraY
        selectedNodeId = null
      }
    }

    p.mouseDragged = () => {
      if (isDragging) {
        const dx = (p.mouseX - dragStartX) / zoom
        const dy = (p.mouseY - dragStartY) / zoom
        cameraX = cameraStartX - dx
        cameraY = cameraStartY - dy
        p.loop()
      }
    }

    p.mouseReleased = () => {
      isDragging = false
      p.loop()
    }

    p.mouseMoved = () => {
      if (p.mouseX < 0 || p.mouseX > canvasWidth || p.mouseY < 0 || p.mouseY > canvasHeight) {
        if (hoveredNode) {
          hoveredNode = null
          p.loop()
        }
        return
      }
      const node = getNodeAt(p.mouseX, p.mouseY)
      if (node?.id !== hoveredNode?.id) {
        hoveredNode = node || null
        p.loop()
      }
      if (containerRef.current) {
        containerRef.current.style.cursor = hoveredNode ? 'pointer' : 'grab'
      }
    }

    p.mouseWheel = (event: WheelEvent) => {
      if (p.mouseX < 0 || p.mouseX > canvasWidth || p.mouseY < 0 || p.mouseY > canvasHeight) return

      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom * zoomFactor))

      if (newZoom !== targetZoom) {
        const worldBefore = screenToWorld(p.mouseX, p.mouseY)
        targetZoom = newZoom
        // Adjust camera to zoom towards mouse
        const worldAfter = screenToWorld(p.mouseX, p.mouseY)
        cameraX += worldBefore.x - worldAfter.x
        cameraY += worldBefore.y - worldAfter.y
        p.loop()
      }
      return false
    }

    p.windowResized = () => {
      const container = containerRef.current
      if (!container) return
      canvasWidth = container.clientWidth
      canvasHeight = container.clientHeight
      p.resizeCanvas(canvasWidth, canvasHeight)
      p.loop()
    }

    // Expose reset function
    ;(p as any).resetView = () => {
      const { nebulaNodes } = dataRef.current
      const root = nebulaNodes.find((n) => n.level === 0)
      if (root) {
        cameraX = root.x
        cameraY = root.y
      }
      targetZoom = 1
      zoom = 1
      selectedNodeId = null
      p.loop()
    }

    ;(p as any).setAutoRotate = (value: boolean) => {
      autoRotate = value
      p.loop()
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const instance = new p5(sketch, containerRef.current)
    p5Ref.current = instance

    // Listen for reset and auto-rotate events from wrapper
    const handleReset = () => {
      ;(instance as any).resetView?.()
    }
    const handleAutoRotate = (e: CustomEvent) => {
      ;(instance as any).setAutoRotate?.(e.detail)
    }
    window.addEventListener('nebula-reset', handleReset)
    window.addEventListener('nebula-autorotate', handleAutoRotate as EventListener)

    return () => {
      window.removeEventListener('nebula-reset', handleReset)
      window.removeEventListener('nebula-autorotate', handleAutoRotate as EventListener)
      instance.remove()
      p5Ref.current = null
    }
  }, [sketch])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: BG_COLOR, cursor: 'grab' }}
    />
  )
}
