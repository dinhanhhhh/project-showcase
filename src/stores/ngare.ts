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
      // persistedstate chỉ hydrate gameState; bảo vệ engine luôn là instance GameEngine hợp lệ
      if (!(this.engine instanceof GameEngine)) {
        this.engine = new GameEngine()
      }
      if (!(this.engine.usedEvents instanceof Set)) {
        this.engine.usedEvents = new Set()
      }
      if (this.gameState) {
        this.engine.state = JSON.parse(JSON.stringify(this.gameState))
      }
    },

    resetGame() {
      this.gameState = null
      if (!(this.engine instanceof GameEngine)) {
        this.engine = new GameEngine()
      } else {
        this.engine.state = null
        this.engine.usedEvents = new Set()
      }
    }
  },

  // Pinia persistedstate chỉ lưu thuần JSON gameState, tuyệt đối không serialize class instance engine
  persist: {
    key: 'ngare_game_state',
    storage: localStorage,
    pick: ['gameState'],
  }
})
