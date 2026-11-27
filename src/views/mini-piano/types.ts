export type OctaveNumber = 3 | 4 | 5

export type PianoPlayMode = 'free' | 'challenge'

export type NotePitchClass =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B'
  | 'C_HIGH'

export interface PianoKey {
  pitchClass: NotePitchClass
  note: string
  freq: number
  label: string
  kbd: string
  isSharp: boolean
  leftPercent?: number
}

export interface SongPreset {
  id: string
  title: string
  difficulty: string
  notes: readonly NotePitchClass[]
}

export interface RecordedNoteEvent {
  pitchClass: NotePitchClass
  octave: OctaveNumber
  offsetMs: number
}

export interface ChallengeStats {
  hits: number
  misses: number
  combo: number
  maxCombo: number
  score: number
  completed: boolean
}

export interface SavedMelody {
  id: string
  name: string
  createdAt: string
  notes: RecordedNoteEvent[]
}
