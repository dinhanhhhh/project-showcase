import { createSafeAudioManager } from '@/utils/audio'

export function useNgareAudio() {
  const { ensureContext, closeContext } = createSafeAudioManager()

  function playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    gainVal = 0.055,
    delaySec = 0,
  ) {
    try {
      const audio = ensureContext()
      if (!audio) return
      const now = audio.currentTime + delaySec
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, now)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0008, now + durationSec)
      osc.connect(gain)
      gain.connect(audio.destination)
      osc.start(now)
      osc.stop(now + durationSec + 0.02)
    } catch {
      // Bỏ qua nếu Web Audio bị hạn chế bởi trình duyệt
    }
  }

  function playChoice(enabled: boolean) {
    if (!enabled) return
    playTone(520, 0.09, 'triangle', 0.05, 0)
    playTone(660, 0.1, 'sine', 0.04, 0.045)
  }

  function playCoin(enabled: boolean) {
    if (!enabled) return
    playTone(880, 0.08, 'sine', 0.05, 0)
    playTone(1175, 0.14, 'sine', 0.05, 0.055)
  }

  function playLevelUp(enabled: boolean) {
    if (!enabled) return
    playTone(523.25, 0.12, 'triangle', 0.06, 0)
    playTone(659.25, 0.12, 'triangle', 0.06, 0.08)
    playTone(783.99, 0.22, 'triangle', 0.065, 0.16)
  }

  function playAchievement(enabled: boolean) {
    if (!enabled) return
    playTone(587.33, 0.12, 'sine', 0.055, 0)
    playTone(739.99, 0.12, 'sine', 0.055, 0.07)
    playTone(880, 0.14, 'sine', 0.06, 0.14)
    playTone(1174.66, 0.26, 'sine', 0.06, 0.21)
  }

  function playWarning(enabled: boolean) {
    if (!enabled) return
    playTone(290, 0.14, 'sawtooth', 0.035, 0)
    playTone(230, 0.22, 'sawtooth', 0.035, 0.12)
  }

  function playEnding(enabled: boolean, isNegative: boolean) {
    if (!enabled) return
    if (isNegative) {
      playTone(392, 0.18, 'triangle', 0.05, 0)
      playTone(349.23, 0.18, 'triangle', 0.05, 0.14)
      playTone(293.66, 0.35, 'triangle', 0.055, 0.28)
      return
    }
    playTone(523.25, 0.14, 'sine', 0.06, 0)
    playTone(659.25, 0.14, 'sine', 0.06, 0.09)
    playTone(783.99, 0.16, 'sine', 0.06, 0.18)
    playTone(1046.5, 0.34, 'sine', 0.065, 0.27)
  }

  return {
    playChoice,
    playCoin,
    playLevelUp,
    playAchievement,
    playWarning,
    playEnding,
    cleanup: closeContext,
  }
}
