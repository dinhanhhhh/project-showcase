import { defineStore } from 'pinia'
import { createInitialBoardState } from '@/views/co-tuong/constants'
import type {
  BoardState,
  BotDifficulty,
  CoTuongStats,
  GameMode,
  GameStatus,
  MoveRecord,
  Side,
} from '@/views/co-tuong/types'

interface CoTuongState {
  boardState: BoardState
  currentPlayer: Side
  moveHistory: MoveRecord[]
  gameMode: GameMode
  humanSide: Side
  botDifficulty: BotDifficulty
  gameStatus: GameStatus
  soundEnabled: boolean
  stats: CoTuongStats
}

export const useCoTuongStore = defineStore('co-tuong', {
  state: (): CoTuongState => ({
    boardState: createInitialBoardState(),
    currentPlayer: 'red',
    moveHistory: [],
    gameMode: 'vs_bot',
    humanSide: 'red',
    botDifficulty: 'medium',
    gameStatus: 'ongoing',
    soundEnabled: true,
    stats: {
      wins: 0,
      losses: 0,
      draws: 0,
    },
  }),

  actions: {
    resetMatch() {
      this.boardState = createInitialBoardState()
      this.currentPlayer = 'red'
      this.moveHistory = []
      this.gameStatus = 'ongoing'
    },

    recordResult(outcome: 'win' | 'loss' | 'draw') {
      if (outcome === 'win') this.stats.wins += 1
      else if (outcome === 'loss') this.stats.losses += 1
      else this.stats.draws += 1
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
    },
  },

  persist: {
    key: 'vibe_co_tuong',
    storage: localStorage,
  },
})
