export type WordPackId = 'dev' | 'vietnamese' | 'quotes_vn' | 'syntax' | 'english'

export type TypingMode = 'timed' | 'sudden_death' | 'daily_seed'

export type TypingRank = 'S+' | 'S' | 'A' | 'B' | 'C'

export interface TypingRunRecord {
  id: string
  wpm: number
  accuracy: number
  rank: TypingRank
  mode: TypingMode
  pack: WordPackId
  timestamp: string
}

export interface WordPackMeta {
  id: WordPackId
  label: string
  icon: string
  words: readonly string[]
}

export interface GameState {
  isActive: boolean
  isFinished: boolean
  words: string[]
  currentIndex: number
  inputValue: string
  timeLeft: number
  score: {
    wpm: number
    accuracy: number
    correctCount: number
    totalTyped: number
  }
}

export interface WordStatus {
  word: string
  status: 'pending' | 'correct' | 'incorrect'
}
