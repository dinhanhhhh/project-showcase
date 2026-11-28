import { defineStore } from 'pinia'
import { getDailyDateKey, upsertDailyBest } from '@/utils/daily-seed'
import type { ColorFormat } from '@/views/color-game/types'

interface FormatStatEntry {
  hits: number
  attempts: number
}

interface ColorGameState {
  bestClassicScore: number
  bestTimeAttackScore: number
  bestStreak: number
  soundEnabled: boolean
  formatStats: Record<ColorFormat, FormatStatEntry>
  dailyBestByDate: Record<string, number>
}

function createEmptyFormatStats(): Record<ColorFormat, FormatStatEntry> {
  return {
    rgb: { hits: 0, attempts: 0 },
    hex: { hits: 0, attempts: 0 },
    hsl: { hits: 0, attempts: 0 },
  }
}

export const useColorGameStore = defineStore('color-game', {
  state: (): ColorGameState => ({
    bestClassicScore: 0,
    bestTimeAttackScore: 0,
    bestStreak: 0,
    soundEnabled: true,
    formatStats: createEmptyFormatStats(),
    dailyBestByDate: {},
  }),

  actions: {
    recordClassic(score: number, streak: number) {
      if (score > this.bestClassicScore) this.bestClassicScore = score
      if (streak > this.bestStreak) this.bestStreak = streak
    },

    recordTimeAttack(score: number, streak: number) {
      if (score > this.bestTimeAttackScore) this.bestTimeAttackScore = score
      if (streak > this.bestStreak) this.bestStreak = streak
    },

    recordDailyScore(score: number, streak: number, dateKey: string = getDailyDateKey()) {
      this.dailyBestByDate = upsertDailyBest(this.dailyBestByDate, dateKey, score)
      if (streak > this.bestStreak) this.bestStreak = streak
    },

    recordAttempt(format: ColorFormat, correct: boolean) {
      if (!this.formatStats) {
        this.formatStats = createEmptyFormatStats()
      }
      const prev = this.formatStats[format] ?? { hits: 0, attempts: 0 }
      this.formatStats = {
        ...this.formatStats,
        [format]: {
          hits: prev.hits + (correct ? 1 : 0),
          attempts: prev.attempts + 1,
        },
      }
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
    },
  },

  persist: {
    key: 'vibe_color_game',
    storage: localStorage,
    pick: [
      'bestClassicScore',
      'bestTimeAttackScore',
      'bestStreak',
      'soundEnabled',
      'formatStats',
      'dailyBestByDate',
    ],
  },
})
