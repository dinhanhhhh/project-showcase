import { onUnmounted } from 'vue'
import { createSafeAudioManager } from '@/utils/audio'

export function useTypingAudio() {
  const { ensureContext, closeContext } = createSafeAudioManager()

  function playKeyClick(enabled: boolean) {
    if (!enabled) return
    const audioCtx = ensureContext()
    if (!audioCtx) return

    try {
      const now = audioCtx.currentTime
      // Âm "thock" trầm của switch phím cơ
      const thockOsc = audioCtx.createOscillator()
      const thockGain = audioCtx.createGain()
      thockOsc.type = 'triangle'
      thockOsc.frequency.setValueAtTime(220 + Math.random() * 45, now)
      thockOsc.frequency.exponentialRampToValueAtTime(85, now + 0.028)
      thockGain.gain.setValueAtTime(0.11, now)
      thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
      thockOsc.connect(thockGain)
      thockGain.connect(audioCtx.destination)
      thockOsc.start(now)
      thockOsc.stop(now + 0.032)

      // Âm click giòn nhẹ ở dải cao
      const clickOsc = audioCtx.createOscillator()
      const clickGain = audioCtx.createGain()
      clickOsc.type = 'square'
      clickOsc.frequency.setValueAtTime(1950 + Math.random() * 250, now)
      clickGain.gain.setValueAtTime(0.025, now)
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.014)
      clickOsc.connect(clickGain)
      clickGain.connect(audioCtx.destination)
      clickOsc.start(now)
      clickOsc.stop(now + 0.016)
    } catch {
      // Ignore restricted Web Audio playback errors
    }
  }

  function playWordComplete(enabled: boolean, combo: number) {
    if (!enabled) return
    const audioCtx = ensureContext()
    if (!audioCtx) return

    try {
      const now = audioCtx.currentTime
      const semitoneOffset = Math.min(combo, 12)
      const freq = 523.25 * Math.pow(2, semitoneOffset / 12)

      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + 0.09)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.12)
    } catch {
      // Ignore restricted Web Audio playback errors
    }
  }

  function playError(enabled: boolean) {
    if (!enabled) return
    const audioCtx = ensureContext()
    if (!audioCtx) return

    try {
      const now = audioCtx.currentTime
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(175, now)
      osc.frequency.exponentialRampToValueAtTime(105, now + 0.14)
      gain.gain.setValueAtTime(0.11, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(now)
      osc.stop(now + 0.16)
    } catch {
      // Ignore restricted Web Audio playback errors
    }
  }

  function playGameOver(enabled: boolean) {
    if (!enabled) return
    const audioCtx = ensureContext()
    if (!audioCtx) return

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, idx) => {
        const start = audioCtx.currentTime + idx * 0.09
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0.13, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start(start)
        osc.stop(start + 0.24)
      })
    } catch {
      // Ignore restricted Web Audio playback errors
    }
  }

  onUnmounted(() => {
    closeContext()
  })

  return {
    playKeyClick,
    playWordComplete,
    playError,
    playGameOver,
  }
}
