export function useFoodAudio() {
  let ctx: AudioContext | null = null

  function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!ctx) {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioCtor) {
        ctx = new AudioCtor()
      }
    }
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }
    return ctx
  }

  function playTick(stepIndex: number, totalSteps: number, muted = false) {
    if (muted) return
    try {
      const audio = getAudioContext()
      if (!audio) return
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      const ratio = totalSteps > 1 ? stepIndex / (totalSteps - 1) : 1
      const freq = 340 + ratio * 220

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, audio.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.18, audio.currentTime + 0.04)

      gain.gain.setValueAtTime(0.06, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.055)

      osc.connect(gain)
      gain.connect(audio.destination)
      osc.start()
      osc.stop(audio.currentTime + 0.06)
    } catch {
      // Bỏ qua nếu trình duyệt không hỗ trợ Web Audio
    }
  }

  function playReveal(muted = false) {
    if (muted) return
    try {
      const audio = getAudioContext()
      if (!audio) return
      const notes = [523.25, 659.25, 783.99]
      const now = audio.currentTime
      notes.forEach((freq, idx) => {
        const osc = audio.createOscillator()
        const gain = audio.createGain()
        const start = now + idx * 0.065

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0.001, start)
        gain.gain.linearRampToValueAtTime(0.08, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.34)

        osc.connect(gain)
        gain.connect(audio.destination)
        osc.start(start)
        osc.stop(start + 0.36)
      })
    } catch {
      // Bỏ qua nếu trình duyệt không hỗ trợ Web Audio
    }
  }

  function cleanup() {
    if (ctx) {
      void ctx.close().catch(() => {})
      ctx = null
    }
  }

  return {
    playTick,
    playReveal,
    cleanup,
  }
}
