import { defineStore } from 'pinia'
import type { FoodItem, PickHistoryEntry } from '@/views/hom-nay-an-gi/types'

interface HomNayAnGiState {
  customFoods: FoodItem[]
  favoriteIds: string[]
  history: PickHistoryEntry[]
  isMuted: boolean
}

export const useHomNayAnGiStore = defineStore('hom-nay-an-gi', {
  state: (): HomNayAnGiState => ({
    customFoods: [],
    favoriteIds: [],
    history: [],
    isMuted: false,
  }),

  actions: {
    addCustomFood(food: FoodItem) {
      this.customFoods = [food, ...this.customFoods]
    },

    removeCustomFood(foodId: string) {
      this.customFoods = this.customFoods.filter((f) => f.id !== foodId)
      this.favoriteIds = this.favoriteIds.filter((id) => id !== foodId)
    },

    toggleFavorite(foodId: string) {
      if (this.favoriteIds.includes(foodId)) {
        this.favoriteIds = this.favoriteIds.filter((id) => id !== foodId)
      } else {
        this.favoriteIds = [foodId, ...this.favoriteIds]
      }
    },

    recordPick(food: FoodItem) {
      const entry: PickHistoryEntry = {
        foodId: food.id,
        foodName: food.name,
        emoji: food.emoji,
        pickedAt: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
      this.history = [entry, ...this.history].slice(0, 10)
    },

    clearHistory() {
      this.history = []
    },

    toggleMute() {
      this.isMuted = !this.isMuted
    },
  },

  persist: {
    key: 'vibe_hom_nay_an_gi',
    storage: localStorage,
    pick: ['customFoods', 'favoriteIds', 'history', 'isMuted'],
  },
})
