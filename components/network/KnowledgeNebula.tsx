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
  twinklePhase: number
  twinkleSpeed: number
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

// ── Galaxy palette ──
const BG_COLOR = '#050510'
const NOTE_NONE_COLOR = '#4a4a5a'
const NOTE_SOME_COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa']
const NOTE_MANY_COLORS = ['#f59e0b', '#ec4899']
const LINE_COLOR_TREE_R = 139
const LINE_COLOR_TREE_G = 92
const LINE_COLOR_TREE_B = 246
const LINE_COLOR_CUSTOM_R = 236
const LINE_COLOR_CUSTOM_G = 72
const LINE_COLOR_CUSTOM_B = 153
const STAR_COLORS = [[255, 255, 255], [200, 210, 255], [147, 180, 255], [180, 200, 255], [220, 220, 255]]
const NEBULA_COLORS = [
  [80, 40, 180],   // deep purple
  [40, 60, 180],   // deep blue
  [120, 30, 140],  // magenta
  [30, 50, 120],   // navy
  [60, 20, 100],   // dark violet
]

function getNodeColor(noteCount: number, level: number, nodeColor: string | null): string {
  if (nodeColor) return nodeColor
  if (noteCount === 0) return NOTE_NONE_COLOR
  if (noteCount >= 4) return NOTE_MANY_COLORS[Math.floor(Math.random() * NOTE_MANY_COLORS.length)]
  return NOTE_SOME_COLORS[Math.min(level, NOTE_SOME_COLORS.length - 1)]
}

function flattenNodes(nodeList: NodeData[]): NodeData[] {
  const result: NodeData[] = []
  function collect(list: NodeData[]) {
    list.forEach((n) => {
      result.push(n)
      if (n.children && n.children.length > 0) collect(n.children)
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
  contents.forEach((c) => noteCounts.set(c.nodeId, (noteCounts.get(c.nodeId) || 0) + 1))

  const childrenMap = new Map<string, string[]>()
  allNodes.forEach((n) => {
    if (n.parentId) {
      const siblings = childrenMap.get(n.parentId) || []
      siblings.push(n.id)
      childrenMap.set(n.parentId, siblings)
    }
  })

  const levels = new Map<string, number>()
  const root = allNodes.find((n) => !n.parentId)
  if (root) {
    const queue: { id: string; level: number }[] = [{ id: root.id, level: 0 }]
    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      levels.set(id, level)
      ;(childrenMap.get(id) || []).forEach((cId) => queue.push({ id: cId, level: level + 1 }))
    }
  }

  // ── Logarithmic spiral layout ──
  const positions = new Map<string, { x: number; y: number }>()
  const A = 60          // spiral tightness
  const B = 140         // spiral growth rate
  const GOLDEN_ANGLE = 2.399963  // ~137.5 degrees in radians

  if (root) {
    positions.set(root.id, { x: 0, y: 0 })

    // Assign global index to each node in BFS order for golden-angle placement
    const orderedNodes: NodeData[] = []
    const bfsQueue = [root]
    const visited = new Set<string>([root.id])
    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift()!
      orderedNodes.push(current)
      const children = (childrenMap.get(current.id) || []).map((cId) => allNodes.find((n) => n.id === cId)!).filter(Boolean)
      children.forEach((child) => {
        if (!visited.has(child.id)) {
          visited.add(child.id)
          bfsQueue.push(child)
        }
      })
    }

    // Place non-root nodes using golden angle spiral
    let idx = 0
    orderedNodes.forEach((node) => {
      if (node.id === root.id) return
      idx++
      const level = levels.get(node.id) || 1
      const r = A + B * Math.log(level + 1)
      const theta = idx * GOLDEN_ANGLE + level * 0.5
      // Add slight noise for organic feel
      const noiseX = (Math.sin(idx * 3.7) * 12) + (Math.cos(idx * 7.3) * 8)
      const noiseY = (Math.cos(idx * 5.1) * 12) + (Math.sin(idx * 2.9) * 8)
      positions.set(node.id, {
        x: Math.cos(theta) * r + noiseX,
        y: Math.sin(theta) * r + noiseY,
      })
    })

    // Orphans
    allNodes.forEach((node) => {
      if (!positions.has(node.id)) {
        const angle = Math.random() * Math.PI * 2
        const dist = A + B * 3 + Math.random() * 100
        positions.set(node.id, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist })
      }
    })
  }

  const nebulaNodes: NebulaNode[] = allNodes.map((node) => {
    const level = levels.get(node.id) || 0
    const noteCount = noteCounts.get(node.id) || 0
    const pos = positions.get(node.id) || { x: 0, y: 0 }
    const childCount = (childrenMap.get(node.id) || []).length

    let baseRadius: number
    if (noteCount >= 4) baseRadius = 16
    else if (noteCount >= 1) baseRadius = 10
    else baseRadius = level === 0 ? 8 : 4

    const noteBonus = Math.min(noteCount * 1.2, 10)
    const childBonus = Math.min(childCount * 0.8, 6)

    return {
      id: node.id,
      name: node.name,
      x: pos.x,
      y: pos.y,
      level,
      color: getNodeColor(noteCount, level, node.color),
      radius: baseRadius + noteBonus * 0.4 + childBonus * 0.3,
      glowRadius: (baseRadius + noteBonus + childBonus) * (noteCount >= 4 ? 3 : noteCount >= 1 ? 2.2 : 1.5),
      noteCount,
      parentId: node.parentId,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.5 + Math.random() * 1.5,
    }
  })

  const nebulaEdges: NebulaEdge[] = []
  allNodes.forEach((n) => {
    if (n.parentId) nebulaEdges.push({ sourceId: n.parentId, targetId: n.id, type: 'tree' })
  })
  edges.forEach((e) => nebulaEdges.push({ sourceId: e.sourceId, targetId: e.targetId, type: 'custom' }))

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
    let autoRotate = false

    // Background stars (fixed parallax layer)
    let bgStars: { x: number; y: number; size: number; baseAlpha: number; speed: number; colorIdx: number }[] = []
    // Nebula blobs
    let nebulaBlobs: { x: number; y: number; radius: number; colorIdx: number; driftX: number; driftY: number }[] = []

    const MIN_ZOOM = 0.1
    const MAX_ZOOM = 4.0

    function generateBackground() {
      bgStars = []
      for (let i = 0; i < 400; i++) {
        bgStars.push({
          x: p.random(-3000, 3000),
          y: p.random(-3000, 3000),
          size: p.random(0.4, 2.8),
          baseAlpha: p.random(60, 220),
          speed: p.random(0.3, 1.2),
          colorIdx: Math.floor(p.random() * STAR_COLORS.length),
        })
      }
      nebulaBlobs = []
      for (let i = 0; i < 5; i++) {
        nebulaBlobs.push({
          x: p.random(-800, 800),
          y: p.random(-800, 800),
          radius: p.random(300, 600),
          colorIdx: i % NEBULA_COLORS.length,
          driftX: (p.random() - 0.5) * 0.02,
          driftY: (p.random() - 0.5) * 0.02,
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
      for (let i = nebulaNodes.length - 1; i >= 0; i--) {
        const node = nebulaNodes[i]
        const dx = world.x - node.x
        const dy = world.y - node.y
        const hitRadius = node.radius + 10
        if (dx * dx + dy * dy < hitRadius * hitRadius) return node
      }
      return null
    }

    function drawGlow(x: number, y: number, radius: number, r: number, g: number, b: number, baseAlpha: number, twinkle: number) {
      const steps = 10
      for (let i = steps; i >= 0; i--) {
        const t = i / steps
        const rad = radius * (0.2 + t * 0.8)
        const a = baseAlpha * (1 - t) * 0.35 * twinkle
        p.noStroke()
        p.fill(r, g, b, a)
        p.circle(x, y, rad * 2)
      }
    }

    function drawPlanetRing(x: number, y: number, nodeR: number, time: number) {
      const ringRadius = nodeR * 2.2
      const tilt = 0.35
      p.push()
      p.translate(x, y)
      p.rotate(time * 0.4)
      p.noFill()
      p.strokeWeight(1.5)
      for (let i = 0; i < 3; i++) {
        const rr = ringRadius + i * 3
        const alpha = 180 - i * 50
        p.stroke(139, 92, 246, alpha)
        p.ellipse(0, 0, rr * 2, rr * 2 * tilt)
      }
      p.pop()
    }

    function drawConnection(x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, alpha: number, pulse = false) {
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2
      const offset = 15 * zoom

      p.noFill()
      p.strokeWeight(pulse ? 1.2 : 0.8)
      const pulseAlpha = pulse ? alpha * (0.5 + 0.5 * Math.sin(p.millis() * 0.0015)) : alpha
      p.stroke(r, g, b, pulseAlpha)
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
      generateBackground()

      const { nebulaNodes } = dataRef.current
      const root = nebulaNodes.find((n) => n.level === 0)
      if (root) {
        cameraX = root.x
        cameraY = root.y
      }
    }

    p.draw = () => {
      const time = p.millis() * 0.001

      zoom += (targetZoom - zoom) * 0.12

      // Auto rotate
      if (autoRotate && !isDragging) {
        const { nebulaNodes } = dataRef.current
        const root = nebulaNodes.find((n) => n.level === 0)
        if (root) {
          const cos = Math.cos(0.0004)
          const sin = Math.sin(0.0004)
          const dx = cameraX - root.x
          const dy = cameraY - root.y
          cameraX = root.x + dx * cos - dy * sin
          cameraY = root.y + dx * sin + dy * cos
        }
      }

      // ── Deep space background ──
      p.background(5, 5, 16)

      // ── Nebula fog layer (parallax 0.3) ──
      p.noStroke()
      nebulaBlobs.forEach((blob) => {
        blob.x += blob.driftX
        blob.y += blob.driftY
        const sx = (blob.x - cameraX * 0.3) * zoom + canvasWidth / 2
        const sy = (blob.y - cameraY * 0.3) * zoom + canvasHeight / 2
        const sr = blob.radius * zoom
        const nc = NEBULA_COLORS[blob.colorIdx]
        // Multiple overlapping circles for softness
        for (let j = 3; j >= 0; j--) {
          const t = j / 3
          const r = sr * (0.5 + t * 0.5)
          const a = 8 * (1 - t)
          p.fill(nc[0], nc[1], nc[2], a)
          p.circle(sx, sy, r * 2)
        }
      })

      // ── Background stars (parallax 0.5) with twinkle ──
      p.noStroke()
      bgStars.forEach((star) => {
        const parallax = 0.5
        const sx = (star.x - cameraX * parallax) * zoom * 0.4 + canvasWidth / 2
        const sy = (star.y - cameraY * parallax) * zoom * 0.4 + canvasHeight / 2
        if (sx < -5 || sx > canvasWidth + 5 || sy < -5 || sy > canvasHeight + 5) return

        const twinkle = 0.5 + 0.5 * Math.sin(time * star.speed + star.x)
        const alpha = star.baseAlpha * twinkle
        const sc = STAR_COLORS[star.colorIdx]
        p.fill(sc[0], sc[1], sc[2], alpha)
        p.circle(sx, sy, star.size)
      })

      const { nebulaNodes, nebulaEdges } = dataRef.current
      const selectedNode = nebulaNodes.find((n) => n.id === selectedNodeId)

      // ── Draw connections ──
      nebulaEdges.forEach((edge) => {
        const source = nebulaNodes.find((n) => n.id === edge.sourceId)
        const target = nebulaNodes.find((n) => n.id === edge.targetId)
        if (!source || !target) return

        const s1 = worldToScreen(source.x, source.y)
        const s2 = worldToScreen(target.x, target.y)

        const margin = 60
        if (
          (s1.x < -margin && s2.x < -margin) ||
          (s1.x > canvasWidth + margin && s2.x > canvasWidth + margin) ||
          (s1.y < -margin && s2.y < -margin) ||
          (s1.y > canvasHeight + margin && s2.y > canvasHeight + margin)
        ) return

        const isHighlighted = selectedNode && (edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id)
        const isDimmed = selectedNode && !isHighlighted

        if (edge.type === 'tree') {
          const alpha = isDimmed ? 15 : isHighlighted ? 120 : 50
          drawConnection(s1.x, s1.y, s2.x, s2.y, LINE_COLOR_TREE_R, LINE_COLOR_TREE_G, LINE_COLOR_TREE_B, alpha)
        } else {
          drawConnection(s1.x, s1.y, s2.x, s2.y, LINE_COLOR_CUSTOM_R, LINE_COLOR_CUSTOM_G, LINE_COLOR_CUSTOM_B,
            isDimmed ? 15 : isHighlighted ? 150 : 60, !isDimmed)
        }
      })

      // ── Draw nodes ──
      nebulaNodes.forEach((node) => {
        const screen = worldToScreen(node.x, node.y)
        if (screen.x < -120 || screen.x > canvasWidth + 120 || screen.y < -120 || screen.y > canvasHeight + 120) return

        const isHovered = hoveredNode?.id === node.id
        const isSelected = selectedNodeId === node.id
        const isConnected = selectedNode && (
          selectedNode.id === node.id ||
          nebulaEdges.some((e) =>
            (e.sourceId === selectedNode.id && e.targetId === node.id) ||
            (e.targetId === selectedNode.id && e.sourceId === node.id)
          )
        )
        const isDimmed = selectedNode && !isConnected

        const twinkle = 0.7 + 0.3 * Math.sin(time * node.twinkleSpeed + node.twinklePhase)
        const scale = (isHovered || isSelected) ? 1.4 : 1
        const glowR = node.glowRadius * zoom * scale
        const nodeR = node.radius * zoom * scale

        const c = p.color(node.color)
        const cr = p.red(c)
        const cg = p.green(c)
        const cb = p.blue(c)

        // Glow
        const glowAlpha = isDimmed ? 20 : isSelected ? 200 : isHovered ? 160 : 80 * twinkle
        drawGlow(screen.x, screen.y, glowR, cr, cg, cb, glowAlpha, twinkle)

        // Core sphere
        p.noStroke()
        if (isDimmed) {
          p.fill(cr, cg, cb, 40)
        } else {
          p.fill(cr, cg, cb, 230 * twinkle)
        }
        p.circle(screen.x, screen.y, nodeR * 2)

        // Inner highlight (sphere illusion)
        if (!isDimmed && nodeR > 3) {
          p.fill(255, 255, 255, (isHovered ? 100 : 50) * twinkle)
          p.circle(screen.x - nodeR * 0.25, screen.y - nodeR * 0.25, nodeR * 0.7)
        }

        // Planet ring for selected node
        if (isSelected) {
          drawPlanetRing(screen.x, screen.y, nodeR, time)
        }

        // Label
        if (zoom > 0.35 || isHovered || isSelected) {
          const labelAlpha = isDimmed ? 40 : isHovered || isSelected ? 255 : Math.min(255, (zoom - 0.25) * 400)
          if (labelAlpha > 15) {
            p.noStroke()
            p.fill(255, 255, 255, labelAlpha)
            p.textAlign(p.CENTER, p.TOP)
            p.textSize(Math.max(10, 12 * zoom))
            p.textFont('sans-serif')
            p.text(node.name, screen.x, screen.y + nodeR + 8)

            if (node.noteCount > 0) {
              p.fill(139, 92, 246, labelAlpha * 0.9)
              p.textSize(Math.max(9, 10 * zoom))
              p.text(`${node.noteCount} 笔记`, screen.x, screen.y + nodeR + 8 + Math.max(13, 15 * zoom))
            }
          }
        }
      })

      // ── Tooltip ──
      if (hoveredNode && !isDragging) {
        const screen = worldToScreen(hoveredNode.x, hoveredNode.y)
        const tooltipX = screen.x + 25
        const tooltipY = screen.y - 25
        const padding = 12
        const lineHeight = 20

        p.textAlign(p.LEFT, p.TOP)
        p.textSize(13)
        const nameWidth = p.textWidth(hoveredNode.name)
        const noteText = hoveredNode.noteCount > 0 ? `${hoveredNode.noteCount} 条笔记` : '暂无笔记'
        const noteWidth = p.textWidth(noteText)
        const boxW = Math.max(nameWidth, noteWidth) + padding * 2
        const boxH = lineHeight * 2 + padding * 2

        p.fill(10, 10, 30, 220)
        p.stroke(139, 92, 246, 100)
        p.strokeWeight(1)
        p.rect(tooltipX, tooltipY, boxW, boxH, 8)

        p.noStroke()
        p.fill(255, 255, 255, 240)
        p.text(hoveredNode.name, tooltipX + padding, tooltipY + padding)
        p.fill(139, 92, 246, 200)
        p.textSize(11)
        p.text(noteText, tooltipX + padding, tooltipY + padding + lineHeight)
      }

      // Always loop for twinkle animation
      // Only stop if truly idle AND user has few nodes (perf optimization)
      if (nebulaNodes.length > 80 && !isDragging && !autoRotate && Math.abs(targetZoom - zoom) < 0.001 && !hoveredNode && !selectedNodeId) {
        p.noLoop()
      }
    }

    p.mousePressed = () => {
      if (p.mouseX < 0 || p.mouseX > canvasWidth || p.mouseY < 0 || p.mouseY > canvasHeight) return
      const node = getNodeAt(p.mouseX, p.mouseY)
      if (node) {
        const now = Date.now()
        if (lastClickNode === node.id && now - lastClickTime < 350) {
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
        if (hoveredNode) { hoveredNode = null; p.loop() }
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
        const wb = screenToWorld(p.mouseX, p.mouseY)
        targetZoom = newZoom
        const wa = screenToWorld(p.mouseX, p.mouseY)
        cameraX += wb.x - wa.x
        cameraY += wb.y - wa.y
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

    ;(p as any).resetView = () => {
      const { nebulaNodes } = dataRef.current
      const root = nebulaNodes.find((n) => n.level === 0)
      if (root) { cameraX = root.x; cameraY = root.y }
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

    const handleReset = () => { (instance as any).resetView?.() }
    const handleAutoRotate = (e: CustomEvent) => { (instance as any).setAutoRotate?.(e.detail) }
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
