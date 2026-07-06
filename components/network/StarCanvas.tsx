'use client'

import { useEffect, useRef, useCallback } from 'react'
import p5 from 'p5'

/* ── Types ── */
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

interface StarNode {
  id: string
  name: string
  x: number
  y: number
  level: number
  brightness: number // 0=dim, 1=medium, 2=bright
  radius: number
  glowRadius: number
  noteCount: number
  parentId: string | null
  twinklePhase: number
  twinkleSpeed: number
  colorR: number
  colorG: number
  colorB: number
}

interface StarEdge {
  sourceId: string
  targetId: string
  type: 'tree' | 'custom'
  flowOffset: number
  flowSpeed: number
}

interface BgStar {
  x: number
  y: number
  size: number
  baseAlpha: number
  speed: number
  colorIdx: number
  driftX: number
  driftY: number
}

interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  alpha: number
  life: number
  maxLife: number
}

interface Nebula {
  x: number
  y: number
  radius: number
  colorR: number
  colorG: number
  colorB: number
  alpha: number
  pulsePhase: number
  pulseSpeed: number
}

interface Props {
  nodes: NodeData[]
  contents: ContentData[]
  edges: EdgeData[]
  onNodeClick?: (nodeId: string) => void
  onNodeDoubleClick?: (nodeId: string) => void
}

/* ── Palette ── */
const STAR_TEMPS: [number, number, number][] = [
  [255, 245, 230],
  [232, 240, 255],
  [255, 250, 205],
  [214, 229, 255],
  [255, 255, 255],
  [255, 248, 240],
  [220, 235, 255],
]

function getStarBrightness(noteCount: number): number {
  if (noteCount >= 4) return 2
  if (noteCount >= 1) return 1
  return 0
}

function getStarColor(): [number, number, number] {
  return STAR_TEMPS[Math.floor(Math.random() * STAR_TEMPS.length)]
}

function flattenNodes(list: NodeData[]): NodeData[] {
  const result: NodeData[] = []
  function collect(nodes: NodeData[]) {
    nodes.forEach((n) => {
      result.push(n)
      if (n.children?.length) collect(n.children)
    })
  }
  collect(list)
  return result
}

function buildData(
  nodes: NodeData[],
  contents: ContentData[],
  edges: EdgeData[]
): { stars: StarNode[]; connections: StarEdge[] } {
  const allNodes = flattenNodes(nodes)
  const noteCounts = new Map<string, number>()
  contents.forEach((c) => noteCounts.set(c.nodeId, (noteCounts.get(c.nodeId) || 0) + 1))

  const childrenMap = new Map<string, string[]>()
  allNodes.forEach((n) => {
    if (n.parentId) {
      const s = childrenMap.get(n.parentId) || []
      s.push(n.id)
      childrenMap.set(n.parentId, s)
    }
  })

  const levels = new Map<string, number>()
  const root = allNodes.find((n) => !n.parentId)
  if (root) {
    const q: { id: string; level: number }[] = [{ id: root.id, level: 0 }]
    while (q.length) {
      const { id, level } = q.shift()!
      levels.set(id, level)
      ;(childrenMap.get(id) || []).forEach((cId) => q.push({ id: cId, level: level + 1 }))
    }
  }

  // Spiral layout
  const positions = new Map<string, { x: number; y: number }>()
  const A = 55, B = 130, GA = 2.399963
  if (root) {
    positions.set(root.id, { x: 0, y: 0 })
    const ordered: NodeData[] = []
    const bfs = [root], visited = new Set<string>([root.id])
    while (bfs.length) {
      const cur = bfs.shift()!
      ordered.push(cur)
      const chs = (childrenMap.get(cur.id) || [])
        .map((cid) => allNodes.find((n) => n.id === cid)!)
        .filter(Boolean)
      chs.forEach((c) => {
        if (!visited.has(c.id)) {
          visited.add(c.id)
          bfs.push(c)
        }
      })
    }
    let idx = 0
    ordered.forEach((node) => {
      if (node.id === root.id) return
      idx++
      const level = levels.get(node.id) || 1
      const r = A + B * Math.log(level + 1)
      const theta = idx * GA + level * 0.5
      const nx = Math.sin(idx * 3.7) * 12 + Math.cos(idx * 7.3) * 8
      const ny = Math.cos(idx * 5.1) * 12 + Math.sin(idx * 2.9) * 8
      positions.set(node.id, { x: Math.cos(theta) * r + nx, y: Math.sin(theta) * r + ny })
    })
    allNodes.forEach((n) => {
      if (!positions.has(n.id)) {
        const ang = Math.random() * Math.PI * 2
        const d = A + B * 3 + Math.random() * 100
        positions.set(n.id, { x: Math.cos(ang) * d, y: Math.sin(ang) * d })
      }
    })
  }

  const stars: StarNode[] = allNodes.map((node) => {
    const level = levels.get(node.id) || 0
    const noteCount = noteCounts.get(node.id) || 0
    const pos = positions.get(node.id) || { x: 0, y: 0 }
    const brightness = getStarBrightness(noteCount)
    const col = getStarColor()
    const childCount = (childrenMap.get(node.id) || []).length

    let baseR: number
    if (brightness === 2) baseR = 7
    else if (brightness === 1) baseR = 5
    else baseR = level === 0 ? 3.5 : 2.5

    const noteBonus = Math.min(noteCount * 0.3, 3)
    const childBonus = Math.min(childCount * 0.2, 1.5)

    return {
      id: node.id,
      name: node.name,
      x: pos.x,
      y: pos.y,
      level,
      brightness,
      radius: baseR + noteBonus + childBonus,
      glowRadius: (baseR + noteBonus + childBonus) * (brightness === 2 ? 4 : brightness === 1 ? 2.8 : 1.8),
      noteCount,
      parentId: node.parentId,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.8 + Math.random() * 2.5,
      colorR: col[0],
      colorG: col[1],
      colorB: col[2],
    }
  })

  const connections: StarEdge[] = []
  allNodes.forEach((n) => {
    if (n.parentId)
      connections.push({
        sourceId: n.parentId,
        targetId: n.id,
        type: 'tree',
        flowOffset: Math.random(),
        flowSpeed: 0.15 + Math.random() * 0.25,
      })
  })
  edges.forEach((e) =>
    connections.push({
      sourceId: e.sourceId,
      targetId: e.targetId,
      type: 'custom',
      flowOffset: Math.random(),
      flowSpeed: 0.2 + Math.random() * 0.3,
    })
  )

  return { stars, connections }
}

export function StarCanvas({ nodes, contents, edges, onNodeClick, onNodeDoubleClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)
  const dataRef = useRef(buildData(nodes, contents, edges))
  const cbRef = useRef({ onNodeClick, onNodeDoubleClick })
  cbRef.current = { onNodeClick, onNodeDoubleClick }

  useEffect(() => {
    dataRef.current = buildData(nodes, contents, edges)
    if (p5Ref.current) p5Ref.current.loop()
  }, [nodes, contents, edges])

  const sketch = useCallback((p: p5) => {
    let cw = 0, ch = 0
    let camX = 0, camY = 0, targetCamX = 0, targetCamY = 0
    let zoom = 1, targetZoom = 1
    let rotZ = 0, targetRotZ = 0
    let tiltX = Math.PI / 3, targetTiltX = Math.PI / 3
    let isDragging = false, isShiftDrag = false
    let dragSX = 0, dragSY = 0, dragStartRZ = 0, dragStartTX = 0, dragStartCX = 0, dragStartCY = 0
    let hoveredNode: StarNode | null = null
    let selectedNodeId: string | null = null
    let clickedNodeId: string | null = null
    let focusing = false
    let lastClickTime = 0, lastClickNode: string | null = null
    let autoRotate = false, autoRotateSpeed = 0.0004
    let showLabels = true, showEdges = true

    let bgStars: BgStar[] = []
    let meteors: Meteor[] = []
    let nebulae: Nebula[] = []
    let nextMeteorTime = 0

    // Touch state
    let touchStartTime = 0
    let touchStartPos = { x: 0, y: 0 }
    let lastTouchPos = { x: 0, y: 0 }
    let isTouchDragging = false
    let isTwoFinger = false
    let twoFingerStartDist = 0
    let twoFingerStartAngle = 0
    let twoFingerStartZoom = 1
    let twoFingerStartRotZ = 0
    let twoFingerStartTiltX = Math.PI / 3
    let twoFingerCenterStart = { x: 0, y: 0 }
    let twoFingerPrevCenter = { x: 0, y: 0 }
    let twoFingerPrevDist = 0
    let twoFingerPrevZoom = 1
    let singleFingerMoved = false
    const TAP_MAX_TIME = 300
    const TAP_MAX_DIST = 15
    const DRAG_THRESHOLD = 8

    const MIN_ZOOM = 0.08, MAX_ZOOM = 5.0

    function generateStars() {
      bgStars = []
      const isMobile = window.innerWidth < 768
      const count = isMobile ? 300 : 500
      for (let i = 0; i < count; i++) {
        const tempIdx = Math.floor(Math.random() * STAR_TEMPS.length)
        bgStars.push({
          x: p.random(-5000, 5000),
          y: p.random(-5000, 5000),
          size: p.random() < 0.92 ? p.random(0.2, 1.5) : p.random(1.5, 2.8),
          baseAlpha: p.random() < 0.8 ? p.random(15, 80) : p.random(80, 200),
          speed: 0.3 + Math.random() * 2,
          colorIdx: tempIdx,
          driftX: (Math.random() - 0.5) * 0.02,
          driftY: (Math.random() - 0.5) * 0.02,
        })
      }
    }

    function generateNebulae() {
      nebulae = []
      const nebulaColors: [number, number, number][] = [
        [60, 40, 80],
        [40, 50, 90],
        [50, 35, 70],
      ]
      for (let i = 0; i < 3; i++) {
        const col = nebulaColors[i]
        nebulae.push({
          x: p.random(-800, 800),
          y: p.random(-800, 800),
          radius: p.random(200, 500),
          colorR: col[0],
          colorG: col[1],
          colorB: col[2],
          alpha: p.random(3, 8),
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.2 + Math.random() * 0.3,
        })
      }
    }

    function spawnMeteor() {
      const startSide = Math.floor(Math.random() * 4)
      let mx = 0, my = 0, mvx = 0, mvy = 0
      const speed = p.random(8, 20)
      const angle = p.random(Math.PI * 0.1, Math.PI * 0.4)

      switch (startSide) {
        case 0: // top
          mx = p.random(0, cw); my = -50
          mvx = Math.cos(angle) * speed; mvy = Math.sin(angle) * speed
          break
        case 1: // right
          mx = cw + 50; my = p.random(0, ch)
          mvx = -Math.cos(angle) * speed; mvy = Math.sin(angle) * speed
          break
        case 2: // bottom
          mx = p.random(0, cw); my = ch + 50
          mvx = Math.cos(angle) * speed; mvy = -Math.sin(angle) * speed
          break
        case 3: // left
          mx = -50; my = p.random(0, ch)
          mvx = Math.cos(angle) * speed; mvy = Math.sin(angle) * speed
          break
      }

      meteors.push({
        x: mx, y: my,
        vx: mvx, vy: mvy,
        length: p.random(60, 150),
        alpha: p.random(0.6, 1.0),
        life: 0,
        maxLife: p.random(30, 60),
      })
    }

    function project(wx: number, wy: number) {
      const rx = wx - camX, ry = wy - camY
      const rz = Math.cos(rotZ) * rx - Math.sin(rotZ) * ry
      const ry2 = Math.sin(rotZ) * rx + Math.cos(rotZ) * ry
      const ty = ry2 * Math.cos(tiltX)
      return { x: rz * zoom + cw / 2, y: ty * zoom + ch / 2 }
    }

    function unproject(sx: number, sy: number) {
      const rx = (sx - cw / 2) / zoom
      const ry2 = (sy - ch / 2) / zoom
      const ry = ry2 / Math.cos(tiltX)
      const wx = Math.cos(-rotZ) * rx - Math.sin(-rotZ) * ry
      const wy = Math.sin(-rotZ) * rx + Math.cos(-rotZ) * ry
      return { x: camX + wx, y: camY + wy }
    }

    function getNodeAt(sx: number, sy: number): StarNode | null {
      const world = unproject(sx, sy)
      const { stars } = dataRef.current
      let best: StarNode | null = null, bestD = Infinity
      for (let i = stars.length - 1; i >= 0; i--) {
        const node = stars[i]
        const dx = world.x - node.x, dy = world.y - node.y
        const d2 = dx * dx + dy * dy
        const hitR = node.radius + (node.brightness === 0 ? 6 : 10)
        if (d2 < bestD && d2 < hitR * hitR) {
          bestD = d2
          best = node
        }
      }
      return best
    }

    function drawStarGlow(x: number, y: number, r: number, cr: number, cg: number, cb: number, alpha: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${Math.min(1, alpha * 0.7)})`)
      grad.addColorStop(0.15, `rgba(${cr},${cg},${cb},${alpha * 0.35})`)
      grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha * 0.1})`)
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    function drawStarCore(x: number, y: number, r: number, cr: number, cg: number, cb: number, twinkle: number, brightness: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D
      const coreWhite = brightness === 2 ? 1.0 : brightness === 1 ? 0.85 : 0.5
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, `rgba(255,255,255,${coreWhite * twinkle})`)
      grad.addColorStop(0.3, `rgba(${cr},${cg},${cb},${0.9 * twinkle})`)
      grad.addColorStop(0.8, `rgba(${cr},${cg},${cb},${0.4 * twinkle})`)
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    function drawSelectionHalo(x: number, y: number, r: number, time: number) {
      const ctx = p.drawingContext as CanvasRenderingContext2D
      const haloR = r * 2.5
      const grad = ctx.createRadialGradient(x, y, r, x, y, haloR)
      const pulse = 0.5 + 0.5 * Math.sin(time * 1.5)
      grad.addColorStop(0, `rgba(255,255,255,${15 + 10 * pulse})`)
      grad.addColorStop(0.5, `rgba(255,255,255,${5 + 3 * pulse})`)
      grad.addColorStop(1, `rgba(255,255,255,0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, haloR, 0, Math.PI * 2)
      ctx.fill()
    }

    function bezierPoint(t: number, x1: number, y1: number, cx1: number, cy1: number, cx2: number, cy2: number, x2: number, y2: number) {
      const mt = 1 - t
      return {
        x: mt * mt * mt * x1 + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * x2,
        y: mt * mt * mt * y1 + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * y2,
      }
    }

    // ── Shared interaction helpers ──
    function tryDoubleClickNode(node: StarNode): boolean {
      const now = Date.now()
      if (lastClickNode === node.id && now - lastClickTime < 350) {
        cbRef.current.onNodeDoubleClick?.(node.id)
        lastClickTime = 0
        lastClickNode = null
        return true
      }
      return false
    }

    function tryDoubleClickBackground(): boolean {
      const now = Date.now()
      if (now - lastClickTime < 350 && lastClickNode === null) {
        const { stars } = dataRef.current
        const root = stars.find((n) => n.level === 0)
        if (root) {
          targetCamX = root.x
          targetCamY = root.y
        }
        targetZoom = 1.0
        targetRotZ = 0
        targetTiltX = Math.PI / 3
        selectedNodeId = null
        clickedNodeId = null
        focusing = true
        lastClickTime = 0
        lastClickNode = null
        return true
      }
      return false
    }

    function selectNode(node: StarNode) {
      lastClickTime = Date.now()
      lastClickNode = node.id
      selectedNodeId = selectedNodeId === node.id ? null : node.id
      clickedNodeId = node.id
      cbRef.current.onNodeClick?.(node.id)
      targetCamX = node.x
      targetCamY = node.y
      targetZoom = 2.5
      focusing = true
    }

    function startDragFrom(x: number, y: number, shift: boolean) {
      isDragging = true
      isShiftDrag = shift
      dragSX = x
      dragSY = y
      dragStartRZ = targetRotZ
      dragStartTX = targetTiltX
      dragStartCX = camX
      dragStartCY = camY
      selectedNodeId = null
      clickedNodeId = null
    }

    function applyZoom(zf: number, cx: number, cy: number) {
      const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom * zf))
      if (nz !== targetZoom) {
        const wb = unproject(cx, cy)
        targetZoom = nz
        const wa = unproject(cx, cy)
        targetCamX += wb.x - wa.x
        targetCamY += wb.y - wa.y
      }
    }

    p.setup = () => {
      const c = containerRef.current
      if (!c) return
      cw = c.clientWidth
      ch = c.clientHeight
      const canvas = p.createCanvas(cw, ch)
      canvas.parent(c)
      p.pixelDensity(Math.min(window.devicePixelRatio, 2))
      generateStars()
      generateNebulae()
      nextMeteorTime = p.millis() + p.random(5000, 15000)
      const { stars } = dataRef.current
      const root = stars.find((n) => n.level === 0)
      if (root) {
        camX = targetCamX = root.x
        camY = targetCamY = root.y
      }

      const el = canvas.elt as HTMLCanvasElement
      el.style.touchAction = 'none'
      el.style.userSelect = 'none'
      el.style.webkitUserSelect = 'none'
      el.addEventListener('touchmove', (e: TouchEvent) => {
        e.preventDefault()
      }, { passive: false })
    }

    p.draw = () => {
      const time = p.millis() * 0.001

      // Smooth interpolation
      zoom += (targetZoom - zoom) * 0.1
      rotZ += (targetRotZ - rotZ) * 0.08
      tiltX += (targetTiltX - tiltX) * 0.08
      if (focusing) {
        camX += (targetCamX - camX) * 0.06
        camY += (targetCamY - camY) * 0.06
        if (
          Math.abs(camX - targetCamX) < 1 &&
          Math.abs(camY - targetCamY) < 1 &&
          Math.abs(targetZoom - zoom) < 0.05
        ) {
          focusing = false
        }
      }
      if (autoRotate && !isDragging && !isTouchDragging && !isTwoFinger && !focusing) {
        targetRotZ += autoRotateSpeed
      }

      const { stars, connections } = dataRef.current

      // Pure black sky
      p.background(0, 0, 0)

      // ── Nebulae (very subtle, behind everything) ──
      p.noStroke()
      nebulae.forEach((neb) => {
        const pulse = 0.7 + 0.3 * Math.sin(time * neb.pulseSpeed + neb.pulsePhase)
        const sx = (neb.x - camX * 0.15) * zoom * 0.3 + cw / 2
        const sy = (neb.y - camY * 0.15) * zoom * 0.3 + ch / 2
        const sr = neb.radius * zoom * 0.3
        if (sx < -sr || sx > cw + sr || sy < -sr || sy > ch + sr) return
        const ctx = p.drawingContext as CanvasRenderingContext2D
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
        grad.addColorStop(0, `rgba(${neb.colorR},${neb.colorG},${neb.colorB},${neb.alpha * pulse * 0.01})`)
        grad.addColorStop(0.5, `rgba(${neb.colorR},${neb.colorG},${neb.colorB},${neb.alpha * pulse * 0.005})`)
        grad.addColorStop(1, `rgba(${neb.colorR},${neb.colorG},${neb.colorB},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fill()
      })

      // ── Background stars with drift ──
      p.noStroke()
      bgStars.forEach((star) => {
        // Slow drift
        star.x += star.driftX
        star.y += star.driftY
        const parallax = 0.2
        const sx = (star.x - camX * parallax) * zoom * 0.25 + cw / 2
        const sy = (star.y - camY * parallax) * zoom * 0.25 + ch / 2
        if (sx < -3 || sx > cw + 3 || sy < -3 || sy > ch + 3) return
        const twinkle = 0.4 + 0.6 * Math.sin(time * star.speed + star.x * 0.1)
        const alpha = star.baseAlpha * twinkle
        const sc = STAR_TEMPS[star.colorIdx]
        p.fill(sc[0], sc[1], sc[2], alpha)
        p.circle(sx, sy, star.size)
      })

      const selectedNode = stars.find((n) => n.id === selectedNodeId)

      // ── Connections ──
      if (showEdges) {
        connections.forEach((conn) => {
          const source = stars.find((n) => n.id === conn.sourceId)
          const target = stars.find((n) => n.id === conn.targetId)
          if (!source || !target) return
          const s1 = project(source.x, source.y)
          const s2 = project(target.x, target.y)
          const margin = 60
          if (
            (s1.x < -margin && s2.x < -margin) ||
            (s1.x > cw + margin && s2.x > cw + margin) ||
            (s1.y < -margin && s2.y < -margin) ||
            (s1.y > ch + margin && s2.y > ch + margin)
          )
            return

          const midX = (s1.x + s2.x) / 2, midY = (s1.y + s2.y) / 2
          const offset = 30 * zoom
          const cx1 = s1.x + (midX - s1.x) * 0.3
          const cy1 = s1.y + offset
          const cx2 = s2.x + (midX - s2.x) * 0.7
          const cy2 = s2.y + offset

          p.noFill()
          const isTree = conn.type === 'tree'
          const lineAlpha = isTree ? 12 : 8
          p.stroke(255, 255, 255, lineAlpha)
          p.strokeWeight(isTree ? 0.6 : 0.4)
          p.bezier(s1.x, s1.y, cx1, cy1, cx2, cy2, s2.x, s2.y)

          // Flow particles
          const flowT = ((time * conn.flowSpeed + conn.flowOffset) % 1)
          const fp = bezierPoint(flowT, s1.x, s1.y, cx1, cy1, cx2, cy2, s2.x, s2.y)
          const pAlpha = Math.sin(flowT * Math.PI) * (isTree ? 140 : 100)
          p.noStroke()
          p.fill(255, 255, 255, pAlpha)
          p.circle(fp.x, fp.y, isTree ? 2.2 : 1.5)
        })
      }

      // ── Star nodes ──
      stars.forEach((node) => {
        const s = project(node.x, node.y)
        const margin = 40
        if (s.x < -margin || s.x > cw + margin || s.y < -margin || s.y > ch + margin) return

        const isHovered = hoveredNode?.id === node.id
        const isSelected = selectedNodeId === node.id
        const twinkle = 0.6 + 0.4 * Math.sin(time * node.twinkleSpeed + node.twinklePhase)
        const r = node.radius * zoom * (isHovered || isSelected ? 1.4 : 1)

        drawStarGlow(s.x, s.y, node.glowRadius * zoom, node.colorR, node.colorG, node.colorB, twinkle * 0.5)
        drawStarCore(s.x, s.y, r, node.colorR, node.colorG, node.colorB, twinkle, node.brightness)

        if (isSelected) {
          drawSelectionHalo(s.x, s.y, r, time)
        }

        // Labels
        if (showLabels && (isHovered || isSelected || node.brightness >= 1)) {
          const labelAlpha = isHovered || isSelected ? 220 : 100
          p.noStroke()
          p.fill(255, 255, 255, labelAlpha)
          p.textAlign(p.CENTER, p.TOP)
          p.textSize(Math.max(9, 11 * Math.min(zoom, 1.5)))
          p.text(node.name, s.x, s.y + r + 6)
        }
      })

      // ── Info card for selected node ──
      if (selectedNode) {
        const s = project(selectedNode.x, selectedNode.y)
        const cardW = 180, cardH = 70
        let cx = s.x + 20, cy = s.y - 20
        if (cx + cardW > cw) cx = s.x - cardW - 20
        if (cy + cardH > ch) cy = s.y - cardH - 20
        if (cy < 10) cy = 10

        p.noStroke()
        p.fill(0, 0, 0, 200)
        p.rect(cx, cy, cardW, cardH, 8)
        p.stroke(255, 255, 255, 30)
        p.strokeWeight(0.5)
        p.noFill()
        p.rect(cx, cy, cardW, cardH, 8)

        p.noStroke()
        p.fill(255, 255, 255, 230)
        p.textAlign(p.LEFT, p.TOP)
        p.textSize(12)
        p.text(selectedNode.name, cx + 10, cy + 8)
        p.fill(255, 255, 255, 150)
        p.textSize(9)
        p.text(`笔记: ${selectedNode.noteCount}`, cx + 10, cy + 26)
        p.text('双击进入详情', cx + 10, cy + 40)
      }

      // ── Meteors ──
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]
        m.x += m.vx
        m.y += m.vy
        m.life++

        const tailX = m.x - m.vx * (m.length / Math.sqrt(m.vx * m.vx + m.vy * m.vy))
        const tailY = m.y - m.vy * (m.length / Math.sqrt(m.vx * m.vx + m.vy * m.vy))
        const lifeRatio = 1 - m.life / m.maxLife
        const alpha = m.alpha * lifeRatio

        if (alpha <= 0 || m.x < -200 || m.x > cw + 200 || m.y < -200 || m.y > ch + 200) {
          meteors.splice(i, 1)
          continue
        }

        const ctx = p.drawingContext as CanvasRenderingContext2D
        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY)
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`)
        grad.addColorStop(0.3, `rgba(255,245,230,${alpha * 0.6})`)
        grad.addColorStop(1, `rgba(255,255,255,0)`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(m.x, m.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()

        // Head glow
        const headGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 4)
        headGrad.addColorStop(0, `rgba(255,255,255,${alpha})`)
        headGrad.addColorStop(1, `rgba(255,255,255,0)`)
        ctx.fillStyle = headGrad
        ctx.beginPath()
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Spawn meteors
      if (p.millis() > nextMeteorTime) {
        spawnMeteor()
        nextMeteorTime = p.millis() + p.random(8000, 30000)
      }
    }

    // ── Mouse events ──
    p.mousePressed = () => {
      if (p.mouseX < 0 || p.mouseX > cw || p.mouseY < 0 || p.mouseY > ch) return
      const node = getNodeAt(p.mouseX, p.mouseY)
      if (node) {
        if (!tryDoubleClickNode(node)) selectNode(node)
      } else {
        if (!tryDoubleClickBackground()) {
          startDragFrom(p.mouseX, p.mouseY, p.keyIsDown(p.SHIFT))
        }
      }
    }

    p.mouseDragged = () => {
      if (!isDragging) return
      if (isShiftDrag) {
        const dx = (p.mouseX - dragSX) / zoom
        const dy = (p.mouseY - dragSY) / zoom
        targetCamX = dragStartCX - dx
        targetCamY = dragStartCY - dy
      } else {
        const dx = p.mouseX - dragSX, dy = p.mouseY - dragSY
        targetRotZ = dragStartRZ - dx * 0.008
        targetTiltX = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, dragStartTX + dy * 0.008))
      }
    }

    p.mouseReleased = () => {
      isDragging = false
    }

    p.mouseMoved = () => {
      if (p.mouseX < 0 || p.mouseX > cw || p.mouseY < 0 || p.mouseY > ch) {
        if (hoveredNode) hoveredNode = null
        return
      }
      const node = getNodeAt(p.mouseX, p.mouseY)
      if (node?.id !== hoveredNode?.id) hoveredNode = node || null
      if (containerRef.current) {
        containerRef.current.style.cursor = hoveredNode ? 'pointer' : 'grab'
      }
    }

    p.mouseWheel = (event: WheelEvent) => {
      if (p.mouseX < 0 || p.mouseX > cw || p.mouseY < 0 || p.mouseY > ch) return
      const zf = event.deltaY > 0 ? 0.88 : 1.12
      applyZoom(zf, p.mouseX, p.mouseY)
      return false
    }

    // ── Touch events ──
    ;(p as any).touchStarted = () => {
      const touches = p.touches as { x: number; y: number }[]
      if (touches.length === 0) return false
      const t0 = touches[0]

      // Upgrade single-finger to two-finger
      if (isTouchDragging && !isTwoFinger && touches.length >= 2) {
        const t1 = touches[1]
        isTwoFinger = true
        isTouchDragging = false
        singleFingerMoved = false
        isDragging = false
        selectedNodeId = null
        clickedNodeId = null
        twoFingerStartDist = Math.sqrt((t1.x - t0.x) ** 2 + (t1.y - t0.y) ** 2)
        twoFingerPrevDist = twoFingerStartDist
        twoFingerStartAngle = Math.atan2(t1.y - t0.y, t1.x - t0.x)
        twoFingerStartZoom = targetZoom
        twoFingerPrevZoom = targetZoom
        twoFingerStartRotZ = targetRotZ
        twoFingerStartTiltX = targetTiltX
        const cx = (t0.x + t1.x) / 2, cy = (t0.y + t1.y) / 2
        twoFingerCenterStart = { x: cx, y: cy }
        twoFingerPrevCenter = { x: cx, y: cy }
        return false
      }

      if (t0.x < 0 || t0.x > cw || t0.y < 0 || t0.y > ch) return false

      touchStartTime = Date.now()
      touchStartPos = { x: t0.x, y: t0.y }
      lastTouchPos = { x: t0.x, y: t0.y }
      singleFingerMoved = false

      if (touches.length >= 2) {
        isTwoFinger = true
        const t1 = touches[1]
        twoFingerStartDist = Math.sqrt((t1.x - t0.x) ** 2 + (t1.y - t0.y) ** 2)
        twoFingerPrevDist = twoFingerStartDist
        twoFingerStartAngle = Math.atan2(t1.y - t0.y, t1.x - t0.x)
        twoFingerStartZoom = targetZoom
        twoFingerPrevZoom = targetZoom
        twoFingerStartRotZ = targetRotZ
        twoFingerStartTiltX = targetTiltX
        const cx = (t0.x + t1.x) / 2, cy = (t0.y + t1.y) / 2
        twoFingerCenterStart = { x: cx, y: cy }
        twoFingerPrevCenter = { x: cx, y: cy }
      } else {
        isTouchDragging = true
      }
      return false
    }

    ;(p as any).touchMoved = () => {
      const touches = p.touches as { x: number; y: number }[]

      if (touches.length >= 2 && isTwoFinger) {
        const t0 = touches[0], t1 = touches[1]
        const d = Math.sqrt((t1.x - t0.x) ** 2 + (t1.y - t0.y) ** 2)
        const cx = (t0.x + t1.x) / 2, cy = (t0.y + t1.y) / 2

        // Pinch zoom (incremental)
        if (twoFingerPrevDist > 0) {
          const scale = d / twoFingerPrevDist
          const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, twoFingerPrevZoom * scale))
          const wb = unproject(cx, cy)
          targetZoom = nz
          const wa = unproject(cx, cy)
          targetCamX += wb.x - wa.x
          targetCamY += wb.y - wa.y
          twoFingerPrevZoom = targetZoom
        }

        // Two-finger rotation → rotZ
        const angle = Math.atan2(t1.y - t0.y, t1.x - t0.x)
        targetRotZ = twoFingerStartRotZ + (angle - twoFingerStartAngle)

        // Two-finger vertical slide → tiltX
        const dy = cy - twoFingerCenterStart.y
        targetTiltX = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, twoFingerStartTiltX - dy * 0.006))

        twoFingerPrevDist = d
        twoFingerPrevCenter = { x: cx, y: cy }
        return false
      }

      if (touches.length === 1 && isTouchDragging && !isTwoFinger) {
        const t = touches[0]
        const dx = t.x - touchStartPos.x
        const dy = t.y - touchStartPos.y
        const moveDist = Math.sqrt(dx * dx + dy * dy)

        if (!singleFingerMoved && moveDist > DRAG_THRESHOLD) {
          singleFingerMoved = true
          isDragging = true
          isShiftDrag = false
          dragSX = touchStartPos.x
          dragSY = touchStartPos.y
          dragStartRZ = targetRotZ
          dragStartTX = targetTiltX
          selectedNodeId = null
          clickedNodeId = null
        }

        if (singleFingerMoved) {
          lastTouchPos = { x: t.x, y: t.y }
          const ddx = t.x - dragSX, ddy = t.y - dragSY
          targetRotZ = dragStartRZ - ddx * 0.008
          targetTiltX = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, dragStartTX + ddy * 0.008))
        }
        return false
      }
      return false
    }

    ;(p as any).touchEnded = () => {
      const wasSingleDrag = isTouchDragging && !isTwoFinger

      if (wasSingleDrag && !singleFingerMoved) {
        const elapsed = Date.now() - touchStartTime
        if (elapsed < TAP_MAX_TIME) {
          const node = getNodeAt(touchStartPos.x, touchStartPos.y)
          if (node) {
            if (!tryDoubleClickNode(node)) selectNode(node)
          } else {
            if (!tryDoubleClickBackground()) {
              selectedNodeId = null
              clickedNodeId = null
            }
          }
        }
      }

      isTouchDragging = false
      isTwoFinger = false
      isDragging = false
      singleFingerMoved = false
      twoFingerPrevDist = 0
      return false
    }

    p.windowResized = () => {
      const c = containerRef.current
      if (!c) return
      cw = c.clientWidth
      ch = c.clientHeight
      p.resizeCanvas(cw, ch)
    }

    // ── External events ──
    window.addEventListener('nebula-reset', () => {
      const { stars } = dataRef.current
      const root = stars.find((n) => n.level === 0)
      if (root) {
        targetCamX = root.x
        targetCamY = root.y
      }
      targetZoom = 1.0
      targetRotZ = 0
      targetTiltX = Math.PI / 3
      selectedNodeId = null
      clickedNodeId = null
      focusing = true
    })
    window.addEventListener('nebula-autorotate', (e: any) => {
      autoRotate = !!e.detail
    })
    window.addEventListener('nebula-rotate-speed', (e: any) => {
      autoRotateSpeed = e.detail
    })
    window.addEventListener('nebula-show-labels', (e: any) => {
      showLabels = !!e.detail
    })
    window.addEventListener('nebula-show-edges', (e: any) => {
      showEdges = !!e.detail
    })
    window.addEventListener('nebula-preset', (e: any) => {
      focusing = true
      const { stars } = dataRef.current
      const root = stars.find((n) => n.level === 0)
      if (!root) return
      switch (e.detail) {
        case 'overview':
          targetCamX = root.x
          targetCamY = root.y
          targetZoom = 0.6
          targetRotZ = 0
          targetTiltX = Math.PI / 3
          break
        case 'top':
          targetCamX = root.x
          targetCamY = root.y
          targetZoom = 1.2
          targetTiltX = Math.PI / 2 - 0.05
          break
        case 'side':
          targetCamX = root.x
          targetCamY = root.y
          targetZoom = 1.0
          targetTiltX = 0.15
          break
      }
    })

    // Public API for React wrapper
    ;(window as any).__nebulaInstance = {
      getViewState: () => ({
        tilt: Math.round((tiltX * 180) / Math.PI),
        rot: Math.round((rotZ * 180) / Math.PI) % 360,
        zoom: parseFloat(zoom.toFixed(2)),
      }),
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const instance = new p5(sketch, container)
    p5Ref.current = instance
    return () => {
      instance.remove()
      p5Ref.current = null
      ;(window as any).__nebulaInstance = null
    }
  }, [sketch])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: '#000000', touchAction: 'none' }}
    />
  )
}
