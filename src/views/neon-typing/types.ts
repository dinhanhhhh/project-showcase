export type WordPackId = 'dev' | 'vietnamese' | 'syntax' | 'english'

export type TypingMode = 'timed' | 'sudden_death'

export type TypingRank = 'S+' | 'S' | 'A' | 'B' | 'C'

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
