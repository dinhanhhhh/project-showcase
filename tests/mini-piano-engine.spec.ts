import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { describe, expect, it } from 'vitest'
import { useMiniPianoStore } from '@/stores/miniPiano'
import {
  SONG_PRESETS,
  calculateChallengeAccuracy,
  formatMelodyDuration,
  formatPitchForOctave,
  getKeysForOctave,
  getOctaveMultiplier,
  getSynthReleaseSeconds,
  scoreChallengeHit,
} from '@/views/mini-piano/engine'

describe('Mini Piano Engine', () => {
  it('generates 13 keys per octave with exact octave frequency scaling', () => {
    expect(getOctaveMultiplier(3)).toBe(0.5)
    expect(getOctaveMultiplier(4)).toBe(1)
    expect(getOctaveMultiplier(5)).toBe(2)

    const oct3 = getKeysForOctave(3)
    const oct4 = getKeysForOctave(4)
    const oct5 = getKeysForOctave(5)

    expect(oct4.whiteKeys).toHaveLength(8)
    expect(oct4.blackKeys).toHaveLength(5)
    expect(oct4.allKeys).toHaveLength(13)

    const a3 = oct3.allKeys.find((k) => k.pitchClass === 'A')
    const a4 = oct4.allKeys.find((k) => k.pitchClass === 'A')
    const a5 = oct5.allKeys.find((k) => k.pitchClass === 'A')
    expect(a3?.freq).toBe(220)
    expect(a4?.freq).toBe(440)
    expect(a5?.freq).toBe(880)

    expect(formatPitchForOctave('C_HIGH', 3)).toBe('C4')
    expect(formatPitchForOctave('C_HIGH', 4)).toBe('C5')
    expect(formatPitchForOctave('A#', 5)).toBe('A#5')
  })

  it('validates all 5 song presets map cleanly onto the 13-key keyboard', () => {
    expect(SONG_PRESETS).toHaveLength(5)
    const validPitches = new Set(getKeysForOctave(4).allKeys.map((k) => k.pitchClass))

    for (const song of SONG_PRESETS) {
      expect(song.notes.length).toBeGreaterThanOrEqual(12)
      for (const note of song.notes) {
        expect(validPitches.has(note)).toBe(true)
      }
    }
  })

  it('scores challenge hits and accuracy properly', () => {
    expect(calculateChallengeAccuracy(0, 0)).toBe(100)
    expect(calculateChallengeAccuracy(8, 2)).toBe(80)
    expect(scoreChallengeHit(1)).toBe(115)
    expect(scoreChallengeHit(10)).toBe(250)
    expect(scoreChallengeHit(20)).toBe(250) // capped bonus at combo 10
  })

  it('computes sustain release times and melody durations cleanly', () => {
    expect(getSynthReleaseSeconds(false)).toBe(0.92)
    expect(getSynthReleaseSeconds(true)).toBe(1.85)
    expect(formatMelodyDuration([])).toBe('0.0s')
    expect(
      formatMelodyDuration([
        { pitchClass: 'C', octave: 4, offsetMs: 0 },
        { pitchClass: 'E', octave: 4, offsetMs: 1450 },
      ]),
    ).toBe('1.5s')
  })

  it('persists synth settings, best song scores, and caps saved melodies at 5 via Pinia store', async () => {
    localStorage.clear()
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    createApp({}).use(pinia)
    setActivePinia(pinia)

    const store = useMiniPianoStore()
    store.setOctave(5)
    store.setWaveform('sawtooth')
    store.toggleSustain()
    store.recordSongScore('twinkle', 1200)
    store.recordSongScore('twinkle', 900) // keeps higher record
    for (let i = 1; i <= 7; i++) {
      store.saveMelody(`M${i}`, [{ pitchClass: 'C', octave: 4, offsetMs: i * 100 }])
    }
    await nextTick()

    expect(store.octave).toBe(5)
    expect(store.waveform).toBe('sawtooth')
    expect(store.sustainEnabled).toBe(true)
    expect(store.bestScoreBySong.twinkle).toBe(1200)
    expect(store.savedMelodies).toHaveLength(5)
    expect(store.savedMelodies[0].name).toBe('M7')

    store.deleteMelody(store.savedMelodies[0].id)
    expect(store.savedMelodies).toHaveLength(4)
  })
})
