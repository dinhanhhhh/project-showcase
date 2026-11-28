import { defineStore } from 'pinia'
import type { TopicFilter } from '@/views/oop-flashcards/types'

interface OopFlashcardsState {
  masteredIds: string[]
  reviewIds: string[]
  selectedTopic: TopicFilter
  sessionsCompleted: number
  bestQuizPercent: number
  quizzesCompleted: number
}

export const useOopFlashcardsStore = defineStore('oop-flashcards', {
  state: (): OopFlashcardsState => ({
    masteredIds: [],
    reviewIds: [],
    selectedTopic: 'all',
    sessionsCompleted: 0,
    bestQuizPercent: 0,
    quizzesCompleted: 0,
  }),

  actions: {
    markCardResult(cardId: string, known: boolean) {
      const mastered = Array.isArray(this.masteredIds) ? this.masteredIds : []
      const review = Array.isArray(this.reviewIds) ? this.reviewIds : []
      if (known) {
        this.masteredIds = mastered.includes(cardId) ? mastered : [...mastered, cardId]
        this.reviewIds = review.filter((id) => id !== cardId)
      } else {
        this.reviewIds = review.includes(cardId) ? review : [...review, cardId]
        this.masteredIds = mastered.filter((id) => id !== cardId)
      }
    },

    setSelectedTopic(topic: TopicFilter) {
      this.selectedTopic = topic
    },

    incrementSessions() {
      this.sessionsCompleted += 1
    },

    recordQuizResult(correct: number, total: number) {
      this.quizzesCompleted += 1
      if (total <= 0) return
      const pct = Math.round((correct / total) * 100)
      if (pct > this.bestQuizPercent) {
        this.bestQuizPercent = pct
      }
    },

    resetProgress() {
      this.masteredIds = []
      this.reviewIds = []
      this.sessionsCompleted = 0
      this.bestQuizPercent = 0
      this.quizzesCompleted = 0
      this.selectedTopic = 'all'
    },
  },

  persist: {
    key: 'vibe_oop_flashcards',
    storage: localStorage,
    pick: [
      'masteredIds',
      'reviewIds',
      'selectedTopic',
      'sessionsCompleted',
      'bestQuizPercent',
      'quizzesCompleted',
    ],
  },
})
