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
