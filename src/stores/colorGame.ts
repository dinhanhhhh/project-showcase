import { defineStore } from 'pinia'

interface ColorGameState {
  bestClassicScore: number
  bestTimeAttackScore: number
  bestStreak: number
  soundEnabled: boolean
}

export const useColorGameStore = defineStore('color-game', {
  state: (): ColorGameState => ({
    bestClassicScore: 0,
    bestTimeAttackScore: 0,
    bestStreak: 0,
    soundEnabled: true,
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

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
    },
  },

  persist: {
    key: 'vibe_color_game',
    storage: localStorage,
  },
})
