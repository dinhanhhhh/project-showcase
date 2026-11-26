import { defineStore } from 'pinia'
import type { TopicFilter } from '@/views/oop-flashcards/types'

interface OopFlashcardsState {
  masteredIds: string[]
  reviewIds: string[]
  selectedTopic: TopicFilter
  sessionsCompleted: number
}

export const useOopFlashcardsStore = defineStore('oop-flashcards', {
  state: (): OopFlashcardsState => ({
    masteredIds: [],
    reviewIds: [],
    selectedTopic: 'all',
    sessionsCompleted: 0,
  }),

  actions: {
    markCardResult(cardId: string, known: boolean) {
      if (known) {
        if (!this.masteredIds.includes(cardId)) {
          this.masteredIds = [...this.masteredIds, cardId]
        }
        this.reviewIds = this.reviewIds.filter((id) => id !== cardId)
      } else {
        if (!this.reviewIds.includes(cardId)) {
          this.reviewIds = [...this.reviewIds, cardId]
        }
        this.masteredIds = this.masteredIds.filter((id) => id !== cardId)
      }
    },

    setSelectedTopic(topic: TopicFilter) {
      this.selectedTopic = topic
    },

    incrementSessions() {
      this.sessionsCompleted += 1
    },

    resetProgress() {
      this.masteredIds = []
      this.reviewIds = []
      this.sessionsCompleted = 0
      this.selectedTopic = 'all'
    },
  },

  persist: {
    key: 'vibe_oop_flashcards',
    storage: localStorage,
  },
})
