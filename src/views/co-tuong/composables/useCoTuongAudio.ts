import { onUnmounted } from 'vue'
import { createSafeAudioManager } from '@/utils/audio'

export type CoTuongSoundEffect = 'move' | 'capture' | 'check' | 'gameover'

export function useCoTuongAudio() {
  const { ensureContext, closeContext } = createSafeAudioManager()

  function playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    delay = 0,
  ) {
    const audioCtx = ensureContext()
    if (!audioCtx) return

    try {
      const startTime = audioCtx.currentTime + delay
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freqStart, startTime)
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), startTime + duration)

      gain.gain.setValueAtTime(volume, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    } catch {
      // Ignore restricted Web Audio playback errors
    }
  }

  function playSound(effect: CoTuongSoundEffect, enabled: boolean) {
    if (!enabled) return

    if (effect === 'move') {
      // Tiếng quân cờ gỗ gõ nhẹ xuống bàn
      playTone(460, 140, 0.06, 0.2, 'triangle')
    } else if (effect === 'capture') {
      // Tiếng ăn quân dứt khoát
      playTone(280, 75, 0.11, 0.3, 'square')
      playTone(620, 200, 0.07, 0.15, 'triangle', 0.02)
    } else if (effect === 'check') {
      // Tiếng chuông cảnh báo chiếu tướng
      playTone(880, 660, 0.18, 0.22, 'sine')
      playTone(1174.66, 880, 0.22, 0.2, 'sine', 0.12)
    } else if (effect === 'gameover') {
      playTone(523.25, 523.25, 0.16, 0.18, 'triangle', 0)
      playTone(659.25, 659.25, 0.16, 0.18, 'triangle', 0.14)
      playTone(783.99, 783.99, 0.28, 0.2, 'triangle', 0.28)
    }
  }

  onUnmounted(() => {
    closeContext()
  })

  return { playSound }
}
