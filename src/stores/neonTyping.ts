import { defineStore } from 'pinia'
import type { WordPackId } from '@/views/neon-typing/types'

interface NeonTypingState {
  bestWpm: number
  bestSuddenDeathWords: number
  totalGamesPlayed: number
  soundEnabled: boolean
  preferredPack: WordPackId
}

export const useNeonTypingStore = defineStore('neon-typing', {
  state: (): NeonTypingState => ({
    bestWpm: 0,
    bestSuddenDeathWords: 0,
    totalGamesPlayed: 0,
    soundEnabled: true,
    preferredPack: 'dev',
  }),

  actions: {
    recordTimedResult(wpm: number) {
      this.totalGamesPlayed += 1
      if (wpm > this.bestWpm) {
        this.bestWpm = wpm
      }
    },

    recordSuddenDeathResult(correctWords: number, wpm: number) {
      this.totalGamesPlayed += 1
      if (correctWords > this.bestSuddenDeathWords) {
        this.bestSuddenDeathWords = correctWords
      }
      if (wpm > this.bestWpm) {
        this.bestWpm = wpm
      }
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
    },

    setPack(pack: WordPackId) {
      this.preferredPack = pack
    },
  },

  persist: {
    key: 'vibe_neon_typing',
    storage: localStorage,
  },
})
