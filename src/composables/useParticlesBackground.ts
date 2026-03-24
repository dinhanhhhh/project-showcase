import { watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface Particle {
  x: number
  y: number
  r: number
  dx: number
  dy: number
  alpha: number
}

export function useParticlesBackground(
  canvasRef: Ref<HTMLCanvasElement | null>,
  enableParticles: Ref<boolean>,
) {
  let animationFrameId = 0
  let isAnimating = false

  function init() {
    if (!enableParticles.value) return
    const canvas = canvasRef.value
    if (!canvas || isAnimating) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.3 + 0.1,
      })
    }

    isAnimating = true

    const animate = () => {
      if (!enableParticles.value) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        isAnimating = false
        cancelAnimationFrame(animationFrameId)
        return
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(109, 221, 255, ${p.alpha})`
        ctx.fill()
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
  }

  // Khởi động lại particles khi bật lại
  watch(enableParticles, (val) => {
    if (val) init()
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationFrameId)
  })

  return { init }
}
