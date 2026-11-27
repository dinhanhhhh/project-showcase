import type { NotePitchClass, OctaveNumber, PianoKey, RecordedNoteEvent, SongPreset } from './types'

interface BaseKeyDef {
  pitchClass: NotePitchClass
  baseFreq: number
  label: string
  kbd: string
  isSharp: boolean
  leftPercent?: number
}

const BASE_WHITE_KEYS: readonly BaseKeyDef[] = [
  { pitchClass: 'C', baseFreq: 261.63, label: 'Đô', kbd: 'A', isSharp: false },
  { pitchClass: 'D', baseFreq: 293.66, label: 'Rê', kbd: 'S', isSharp: false },
  { pitchClass: 'E', baseFreq: 329.63, label: 'Mi', kbd: 'D', isSharp: false },
  { pitchClass: 'F', baseFreq: 349.23, label: 'Pha', kbd: 'F', isSharp: false },
  { pitchClass: 'G', baseFreq: 392.0, label: 'Son', kbd: 'G', isSharp: false },
  { pitchClass: 'A', baseFreq: 440.0, label: 'La', kbd: 'H', isSharp: false },
  { pitchClass: 'B', baseFreq: 493.88, label: 'Si', kbd: 'J', isSharp: false },
  { pitchClass: 'C_HIGH', baseFreq: 523.25, label: 'Đô 2', kbd: 'K', isSharp: false },
]

const BASE_BLACK_KEYS: readonly BaseKeyDef[] = [
  { pitchClass: 'C#', baseFreq: 277.18, label: 'C♯', kbd: 'W', isSharp: true, leftPercent: 12.5 },
  { pitchClass: 'D#', baseFreq: 311.13, label: 'D♯', kbd: 'E', isSharp: true, leftPercent: 25 },
  { pitchClass: 'F#', baseFreq: 369.99, label: 'F♯', kbd: 'T', isSharp: true, leftPercent: 50 },
  { pitchClass: 'G#', baseFreq: 415.3, label: 'G♯', kbd: 'Y', isSharp: true, leftPercent: 62.5 },
  { pitchClass: 'A#', baseFreq: 466.16, label: 'A♯', kbd: 'U', isSharp: true, leftPercent: 75 },
]

export function getOctaveMultiplier(octave: OctaveNumber): number {
  return Math.pow(2, octave - 4)
}

export function formatPitchForOctave(pitchClass: NotePitchClass, octave: OctaveNumber): string {
  if (pitchClass === 'C_HIGH') {
    return `C${octave + 1}`
  }
  return `${pitchClass}${octave}`
}

function buildKey(def: BaseKeyDef, octave: OctaveNumber): PianoKey {
  const mult = getOctaveMultiplier(octave)
  return {
    pitchClass: def.pitchClass,
    note: formatPitchForOctave(def.pitchClass, octave),
    freq: Math.round(def.baseFreq * mult * 100) / 100,
    label: def.label,
    kbd: def.kbd,
    isSharp: def.isSharp,
    leftPercent: def.leftPercent,
  }
}

export function getKeysForOctave(octave: OctaveNumber): {
  whiteKeys: PianoKey[]
  blackKeys: PianoKey[]
  allKeys: PianoKey[]
} {
  const whiteKeys = BASE_WHITE_KEYS.map((def) => buildKey(def, octave))
  const blackKeys = BASE_BLACK_KEYS.map((def) => buildKey(def, octave))
  return {
    whiteKeys,
    blackKeys,
    allKeys: [...whiteKeys, ...blackKeys],
  }
}

export const SONG_PRESETS: readonly SongPreset[] = [
  {
    id: 'twinkle',
    title: '⭐ Twinkle Star',
    difficulty: 'Dễ',
    notes: ['C', 'C', 'G', 'G', 'A', 'A', 'G', 'F', 'F', 'E', 'E', 'D', 'D', 'C'],
  },
  {
    id: 'ode',
    title: '🎼 Ode to Joy',
    difficulty: 'Dễ',
    notes: ['E', 'E', 'F', 'G', 'G', 'F', 'E', 'D', 'C', 'C', 'D', 'E', 'E', 'D', 'D'],
  },
  {
    id: 'butterfly',
    title: '🦋 Kìa Con Bướm Vàng',
    difficulty: 'Trung bình',
    notes: [
      'C', 'D', 'E', 'C', 'C', 'D', 'E', 'C',
      'E', 'F', 'G', 'E', 'F', 'G',
      'G', 'A', 'G', 'F', 'E', 'C',
    ],
  },
  {
    id: 'jingle',
    title: '🔔 Jingle Bells',
    difficulty: 'Trung bình',
    notes: [
      'E', 'E', 'E', 'E', 'E', 'E',
      'E', 'G', 'C', 'D', 'E',
      'F', 'F', 'F', 'F', 'F', 'E', 'E', 'E', 'D', 'D', 'E', 'D', 'G',
    ],
  },
  {
    id: 'birthday',
    title: '🎂 Happy Birthday',
    difficulty: 'Khó',
    notes: [
      'C', 'C', 'D', 'C', 'F', 'E',
      'C', 'C', 'D', 'C', 'G', 'F',
      'C', 'C', 'C_HIGH', 'A', 'F', 'E', 'D',
      'A#', 'A#', 'A', 'F', 'G', 'F',
    ],
  },
]

export function calculateChallengeAccuracy(hits: number, misses: number): number {
  const total = hits + misses
  if (total <= 0) return 100
  return Math.round((hits / total) * 100)
}

export function scoreChallengeHit(nextCombo: number): number {
  return 100 + Math.min(nextCombo, 10) * 15
}

export function getSynthReleaseSeconds(sustainEnabled: boolean): number {
  return sustainEnabled ? 1.85 : 0.92
}

export function formatMelodyDuration(notes: readonly RecordedNoteEvent[]): string {
  if (notes.length === 0) return '0.0s'
  const lastOffset = notes[notes.length - 1]?.offsetMs ?? 0
  return `${Math.max(0.1, Math.round(lastOffset / 100) / 10).toFixed(1)}s`
}
