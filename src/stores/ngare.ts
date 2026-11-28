import { defineStore } from 'pinia'
import { computeLifeRecap, GameEngine, normalizeGameState } from '@/views/ngare/engine'
import type {
  AssetId,
  Choice,
  EndingDefinition,
  GameState,
  HallOfFameEntry,
  TraitId,
} from '@/views/ngare/types'

export const useNgareStore = defineStore('ngare', {
  state: () => ({
    // Trạng thái game reactive
    gameState: null as GameState | null,
    // Các kết cục đã mở khóa & Bảng vàng lịch sử cuộc đời
    unlockedEndings: [] as string[],
    hallOfFame: [] as HallOfFameEntry[],
    soundEnabled: true,
    // Engine thuần logic (không lưu storage)
    engine: new GameEngine(),
  }),

  actions: {
    _ensureEngineSynced() {
      if (!(this.engine instanceof GameEngine)) {
        this.engine = new GameEngine()
      }
      if (!(this.engine.usedEvents instanceof Set)) {
        this.engine.usedEvents = new Set()
      }
      if (this.gameState) {
        const normalized = normalizeGameState(
          JSON.parse(JSON.stringify(this.gameState)) as Partial<GameState>,
        )
        this.engine.state = normalized
        if (normalized.usedEventIds && normalized.usedEventIds.length > 0) {
          this.engine.usedEvents = new Set(normalized.usedEventIds)
        }
      }
    },

    _syncFromEngine() {
      this.gameState = this.engine.state
        ? (JSON.parse(JSON.stringify(this.engine.state)) as GameState)
        : null
    },

    async startNewGame(name: string, careerId: string, traitId: TraitId = 'balanced') {
      if (!(this.engine instanceof GameEngine)) {
        this.engine = new GameEngine()
      }
      this.gameState = await this.engine.newGame(name, careerId, traitId)
      return this.gameState
    },

    async makeChoice(choice: Choice) {
      if (!this.gameState) return null
      this._ensureEngineSynced()
      const result = await this.engine.applyChoice(choice)
      this._syncFromEngine()
      return result
    },

    async buyItem(itemId: string) {
      if (!this.gameState) return { success: false, message: 'Game chưa bắt đầu' }
      this._ensureEngineSynced()
      const res = await this.engine.buyItem(itemId)
      this._syncFromEngine()
      return res
    },

    async buySkill(skillId: string) {
      if (!this.gameState) return { success: false, message: 'Game chưa bắt đầu' }
      this._ensureEngineSynced()
      const res = await this.engine.buySkill(skillId)
      this._syncFromEngine()
      return res
    },

    async useSkill(skillId: string) {
      if (!this.gameState) return { success: false, message: 'Game chưa bắt đầu' }
      this._ensureEngineSynced()
      const res = await this.engine.useSkill(skillId)
      this._syncFromEngine()
      return res
    },

    async performYearlyAction(actionId: string) {
      if (!this.gameState) return { success: false, message: 'Game chưa sẵn sàng' }
      this._ensureEngineSynced()
      const res = await this.engine.performYearlyAction(actionId)
      this._syncFromEngine()
      return res
    },

    async buyAsset(assetId: AssetId) {
      if (!this.gameState) return { success: false, message: 'Game chưa bắt đầu' }
      this._ensureEngineSynced()
      const res = await this.engine.buyAsset(assetId)
      this._syncFromEngine()
      return res
    },

    async sellAsset(assetId: AssetId) {
      if (!this.gameState) return { success: false, message: 'Game chưa bắt đầu' }
      this._ensureEngineSynced()
      const res = await this.engine.sellAsset(assetId)
      this._syncFromEngine()
      return res
    },

    async switchCareer(newCareerId: string) {
      if (!this.gameState) return { success: false, message: 'Game chưa bắt đầu' }
      this._ensureEngineSynced()
      const res = await this.engine.switchCareer(newCareerId)
      this._syncFromEngine()
      return res
    },

    recordCompletedLife(ending: EndingDefinition): boolean {
      if (!this.gameState) return false
      let newlyUnlocked = false
      if (ending.id && ending.id !== 'unknown' && !this.unlockedEndings.includes(ending.id)) {
        this.unlockedEndings = [...this.unlockedEndings, ending.id]
        newlyUnlocked = true
      }

      const recap = computeLifeRecap(this.gameState)
      const entry: HallOfFameEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: this.gameState.name,
        careerName: this.gameState.careerName,
        careerEmoji: this.gameState.careerEmoji,
        age: this.gameState.age,
        endingId: ending.id,
        endingTitle: ending.title,
        endingIcon: ending.icon,
        totalScore: recap.totalScore,
        netWorth: recap.netWorth,
        finishedAt: new Date().toLocaleDateString('vi-VN'),
      }

      this.hallOfFame = [entry, ...this.hallOfFame]
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 10)

      return newlyUnlocked
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
    },

    loadFromStorage() {
      this._ensureEngineSynced()
      if (this.gameState) {
        this._syncFromEngine()
      }

      // Di chuyển dữ liệu kết cục cũ (ngare_endings) nếu tồn tại vào Pinia Store
      try {
        const legacyRaw = localStorage.getItem('ngare_endings')
        if (legacyRaw) {
          const parsed: unknown = JSON.parse(legacyRaw)
          if (Array.isArray(parsed)) {
            const merged = new Set(this.unlockedEndings)
            for (const item of parsed) {
              if (typeof item === 'string' && item.trim()) {
                merged.add(item)
              }
            }
            this.unlockedEndings = Array.from(merged)
          }
        }
      } catch {
        // Bỏ qua dữ liệu legacy lỗi
      }
    },

    resetGame() {
      this.gameState = null
      if (!(this.engine instanceof GameEngine)) {
        this.engine = new GameEngine()
      } else {
        this.engine.state = null
        this.engine.usedEvents = new Set()
        this.engine.previousSnapshot = null
        this.engine.previewedEvent = null
      }
    },
  },

  // Pinia persistedstate chỉ lưu thuần JSON, tuyệt đối không serialize class instance engine
  persist: {
    key: 'ngare_game_state',
    storage: localStorage,
    pick: ['gameState', 'unlockedEndings', 'hallOfFame', 'soundEnabled'],
  },
})
