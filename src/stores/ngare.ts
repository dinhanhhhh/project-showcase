import { defineStore } from 'pinia'
import { GameEngine } from '@/views/ngare/engine'
import type { GameState, Choice } from '@/views/ngare/types'

export const useNgareStore = defineStore('ngare', {
  state: () => ({
    // Trạng thái game reactive
    gameState: null as GameState | null,
    // Engine thuần logic (không lưu storage)
    engine: new GameEngine()
  }),
  
  actions: {
    async startNewGame(name: string, careerId: string) {
      this.gameState = await this.engine.newGame(name, careerId)
    },

    async makeChoice(choice: Choice) {
      if (!this.gameState) return null
      // Đồng bộ state hiện tại vào engine trước khi tính toán
      this.engine.state = JSON.parse(JSON.stringify(this.gameState))
      const result = await this.engine.applyChoice(choice)
      this.gameState = result
      return result
    },

    loadFromStorage() {
      // persistedstate tự động hydrate từ localStorage khi store khởi tạo.
      // Hàm này chỉ còn để sync engine.state với gameState từ store
      if (this.gameState) {
        this.engine.state = JSON.parse(JSON.stringify(this.gameState))
      }
    },

    resetGame() {
      this.gameState = null
      // persistedstate sẽ tự động xóa key trong localStorage khi gameState = null
    }
  },

  // Pinia persistedstate tự động lo việc sync với localStorage
  persist: {
    key: 'ngare_game_state',
    storage: localStorage,
  }
})
