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
      const foods = Array.isArray(this.customFoods) ? this.customFoods : []
      this.customFoods = [food, ...foods]
    },

    removeCustomFood(foodId: string) {
      const foods = Array.isArray(this.customFoods) ? this.customFoods : []
      const favs = Array.isArray(this.favoriteIds) ? this.favoriteIds : []
      this.customFoods = foods.filter((f) => f.id !== foodId)
      this.favoriteIds = favs.filter((id) => id !== foodId)
    },

    toggleFavorite(foodId: string) {
      const favs = Array.isArray(this.favoriteIds) ? this.favoriteIds : []
      if (favs.includes(foodId)) {
        this.favoriteIds = favs.filter((id) => id !== foodId)
      } else {
        this.favoriteIds = [foodId, ...favs]
      }
    },

    recordPick(food: FoodItem) {
      const prevHistory = Array.isArray(this.history) ? this.history : []
      const entry: PickHistoryEntry = {
        foodId: food.id,
        foodName: food.name,
        emoji: food.emoji,
        pickedAt: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
      this.history = [entry, ...prevHistory].slice(0, 10)
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
