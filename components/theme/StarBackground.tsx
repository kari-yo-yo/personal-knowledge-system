'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  twinkleSpeed: number
  twinkleOffset: number
}

function createStars(count: number, width: number, height: number): Star[] {
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.15 + 0.02,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    })
  }
  return stars
}

export function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<{ far: Star[]; near: Star[] }>({ far: [], near: [] })
  const animRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      canvas!.style.width = w + 'px'
      canvas!.style.height = h + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      // 重新生成星星
      starsRef.current.far = createStars(400, w, h)
      starsRef.current.near = createStars(80, w, h)
    }

    resize()
    window.addEventListener('resize', resize)

    function animate() {
      timeRef.current += 1
      const w = window.innerWidth
      const h = window.innerHeight
      const t = timeRef.current

      ctx!.clearRect(0, 0, w, h)

      // 绘制远景星星
      for (const star of starsRef.current.far) {
        const twinkle = Math.sin(t * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7
        ctx!.beginPath()
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`
        ctx!.fill()

        // 缓慢漂移
        star.x += star.speed * 0.3
        if (star.x > w) star.x = 0
      }

      // 绘制近景星星（稍大、稍亮）
      for (const star of starsRef.current.near) {
        const twinkle = Math.sin(t * star.twinkleSpeed * 1.5 + star.twinkleOffset) * 0.4 + 0.6
        ctx!.beginPath()
        ctx!.arc(star.x, star.y, star.size * 1.3, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(200, 220, 255, ${star.opacity * twinkle * 1.2})`
        ctx!.fill()

        // 稍快漂移
        star.x += star.speed
        if (star.x > w) star.x = 0
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
