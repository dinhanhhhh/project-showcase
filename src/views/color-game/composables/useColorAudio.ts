import { onUnmounted } from 'vue'

interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

export function useColorAudio() {
  let ctx: AudioContext | null = null

  function ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!ctx) {
      const AudioCtor = window.AudioContext || (window as unknown as ExtendedWindow).webkitAudioContext
      if (!AudioCtor) return null
      ctx = new AudioCtor()
    }
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    return ctx
  }

  function playCorrect(enabled: boolean, streak: number) {
    if (!enabled) return
    const audioCtx = ensureContext()
    if (!audioCtx) return

    const now = audioCtx.currentTime
    const step = Math.min(streak, 12)
    const rootFreq = 440 * Math.pow(2, step / 12)

    ;[rootFreq, rootFreq * 1.25].forEach((freq, idx) => {
      const start = now + idx * 0.06
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.14, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(start)
      osc.stop(start + 0.2)
    })
  }

  function playWrong(enabled: boolean) {
    if (!enabled) return
    const audioCtx = ensureContext()
    if (!audioCtx) return

    const now = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(190, now)
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.16)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(now)
    osc.stop(now + 0.2)
  }

  function playLifeline(enabled: boolean) {
    if (!enabled) return
    const audioCtx = ensureContext()
    if (!audioCtx) return

    ;[587.33, 880].forEach((freq, idx) => {
      const start = audioCtx.currentTime + idx * 0.05
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.11, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(start)
      osc.stop(start + 0.15)
    })
  }

  function playTimeUp(enabled: boolean) {
    if (!enabled) return
    const audioCtx = ensureContext()
    if (!audioCtx) return

    ;[659.25, 523.25, 392.0].forEach((freq, idx) => {
      const start = audioCtx.currentTime + idx * 0.11
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(start)
      osc.stop(start + 0.24)
    })
  }

  onUnmounted(() => {
    if (ctx) {
      void ctx.close()
      ctx = null
    }
  })

  return {
    playCorrect,
    playWrong,
    playLifeline,
    playTimeUp,
  }
}
