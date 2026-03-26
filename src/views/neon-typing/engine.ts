import type { GameState } from './types'

const DICTIONARY = [
  'typescript', 'javascript', 'vuejs', 'reactive', 'component',
  'composition', 'interface', 'generic', 'frontend', 'developer',
  'antigravity', 'vibe', 'platform', 'showcase', 'project',
  'application', 'debugging', 'refactor', 'optimization', 'performance',
  'neon', 'glassmorphism', 'coding', 'senior', 'fullstack'
]

export function getRandomWords(count: number): string[] {
  return [...Array(count)].map(() => DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)])
}

export function calculateWPM(correctWords: number, timeSpentSeconds: number): number {
  if (timeSpentSeconds <= 0) return 0
  const minutes = timeSpentSeconds / 60
  return Math.round(correctWords / minutes)
}

export function calculateAccuracy(correctWords: number, totalWords: number): number {
  if (totalWords <= 0) return 100
  return Math.round((correctWords / totalWords) * 100)
}

export function createInitialState(wordCount: number = 30): GameState {
  return {
    isActive: false,
    isFinished: false,
    words: getRandomWords(wordCount),
    currentIndex: 0,
    inputValue: '',
    timeLeft: 30, // 30s game
    score: {
      wpm: 0,
      accuracy: 100,
      correctCount: 0,
      totalTyped: 0
    }
  }
}
