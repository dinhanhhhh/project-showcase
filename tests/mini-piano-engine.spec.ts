import { describe, expect, it } from 'vitest'
import {
  SONG_PRESETS,
  calculateChallengeAccuracy,
  formatPitchForOctave,
  getKeysForOctave,
  getOctaveMultiplier,
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
})
