import { defineStore } from 'pinia'

export type OracleSpreadMode = 1 | 3

export interface OracleSavedCard {
  cardId: string
  name: string
  image: string
  slotLabel: string
  reversed: boolean
}

export interface OracleReadingRecord {
  id: string
  timestamp: string
  mode: OracleSpreadMode
  question: string
  cards: OracleSavedCard[]
}

interface OracleTarotState {
  history: OracleReadingRecord[]
  includeReversed: boolean
}

export const useOracleTarotStore = defineStore('oracle-tarot', {
  state: (): OracleTarotState => ({
    history: [],
    includeReversed: true,
  }),

  actions: {
    addReading(record: OracleReadingRecord) {
      this.history = [record, ...this.history].slice(0, 10)
    },

    clearHistory() {
      this.history = []
    },

    setIncludeReversed(val: boolean) {
      this.includeReversed = val
    },
  },

  persist: {
    key: 'vibe_oracle_tarot',
    storage: localStorage,
    pick: ['history', 'includeReversed'],
  },
})
