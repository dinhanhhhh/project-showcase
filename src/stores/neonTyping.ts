import { defineStore } from 'pinia'
import { getDailyDateKey, upsertDailyBest } from '@/utils/daily-seed'
import { calculateTypingRank } from '@/views/neon-typing/engine'
import type { TypingRunRecord, WordPackId } from '@/views/neon-typing/types'

interface NeonTypingState {
  bestWpm: number
  bestSuddenDeathWords: number
  totalGamesPlayed: number
  soundEnabled: boolean
  preferredPack: WordPackId
  history: TypingRunRecord[]
  dailyBestByDate: Record<string, number>
}

export const useNeonTypingStore = defineStore('neon-typing', {
  state: (): NeonTypingState => ({
    bestWpm: 0,
    bestSuddenDeathWords: 0,
    totalGamesPlayed: 0,
    soundEnabled: true,
    preferredPack: 'dev',
    history: [],
    dailyBestByDate: {},
  }),

  actions: {
    recordTimedResult(wpm: number, accuracy = 100, pack?: WordPackId) {
      this.totalGamesPlayed += 1
      if (wpm > this.bestWpm) {
        this.bestWpm = wpm
      }
      this.history = [
        {
          id: `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          wpm,
          accuracy,
          rank: calculateTypingRank(wpm, accuracy),
          mode: 'timed' as const,
          pack: pack ?? this.preferredPack,
          timestamp: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...(this.history ?? []),
      ].slice(0, 10)
    },

    recordDailyResult(
      wpm: number,
      accuracy = 100,
      pack?: WordPackId,
      dateKey: string = getDailyDateKey(),
    ) {
      this.totalGamesPlayed += 1
      if (wpm > this.bestWpm) {
        this.bestWpm = wpm
      }
      this.dailyBestByDate = upsertDailyBest(this.dailyBestByDate, dateKey, wpm)
      this.history = [
        {
          id: `daily-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          wpm,
          accuracy,
          rank: calculateTypingRank(wpm, accuracy),
          mode: 'daily_seed' as const,
          pack: pack ?? this.preferredPack,
          timestamp: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...(this.history ?? []),
      ].slice(0, 10)
    },

    recordSuddenDeathResult(
      correctWords: number,
      wpm: number,
      accuracy = 100,
      pack?: WordPackId,
    ) {
      this.totalGamesPlayed += 1
      if (correctWords > this.bestSuddenDeathWords) {
        this.bestSuddenDeathWords = correctWords
      }
      if (wpm > this.bestWpm) {
        this.bestWpm = wpm
      }
      this.history = [
        {
          id: `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          wpm,
          accuracy,
          rank: calculateTypingRank(wpm, accuracy),
          mode: 'sudden_death' as const,
          pack: pack ?? this.preferredPack,
          timestamp: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...(this.history ?? []),
      ].slice(0, 10)
    },

    clearHistory() {
      this.history = []
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
    pick: [
      'bestWpm',
      'bestSuddenDeathWords',
      'totalGamesPlayed',
      'soundEnabled',
      'preferredPack',
      'history',
      'dailyBestByDate',
    ],
  },
})
