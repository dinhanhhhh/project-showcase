import { onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'

interface Particle {
  x: number
  y: number
  r: number
  dx: number
  dy: number
  alpha: number
}

const LINK_DIST_SQ = 125 * 125

export function useParticlesBackground(
  canvasRef: Ref<HTMLCanvasElement | null>,
  enableParticles: Ref<boolean>,
) {
  let animationFrameId = 0
  let isAnimating = false
  let resizeHandler: (() => void) | null = null

  function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = 0
    }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
      resizeHandler = null
    }
    const canvas = canvasRef.value
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
    isAnimating = false
  }

  function readParticleRgb(): string {
    if (typeof window === 'undefined') return '109, 221, 255'
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--particle-rgb').trim()
    return raw || '109, 221, 255'
  }

  function init() {
    if (!enableParticles.value) return
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    const canvas = canvasRef.value
    if (!canvas || isAnimating) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particles: Particle[] = []
    const count = window.innerWidth < 768 ? 26 : 48

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    resizeHandler = resize
    window.addEventListener('resize', resize)

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.6,
        dx: (Math.random() - 0.5) * 0.28,
        dy: (Math.random() - 0.5) * 0.28,
        alpha: Math.random() * 0.38 + 0.14,
      })
    }

    isAnimating = true
    let cachedRgb = readParticleRgb()
    let frameTick = 0

    const animate = () => {
      if (!enableParticles.value) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        cleanup()
        return
      }

      // Cập nhật màu theme mỗi ~30 frame để không đọc computedStyle ở 60fps
      frameTick += 1
      if (frameTick % 30 === 0) {
        cachedRgb = readParticleRgb()
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cachedRgb}, ${p.alpha})`
        ctx.fill()

        // Vẽ dây nối tinh vân nhẹ giữa các hạt gần nhau
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const distSq = dx * dx + dy * dy
          if (distSq < LINK_DIST_SQ) {
            const lineAlpha = (1 - distSq / LINK_DIST_SQ) * 0.11
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(${cachedRgb}, ${lineAlpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
  }

  watch(enableParticles, (val) => {
    if (val) init()
    else cleanup()
  })

  onUnmounted(() => {
    cleanup()
  })

  return { init }
}
