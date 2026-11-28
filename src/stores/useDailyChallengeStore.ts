import { defineStore } from 'pinia'
import {
  DAILY_CHALLENGE_CATALOG,
  type DailyChallengePersistState,
  getDailyChallengesForDate,
  sanitizeDailyChallengeState,
} from '@/utils/daily-challenge'
import { getDailyDateKey, getPreviousDateKey } from '@/utils/daily-seed'

export const useDailyChallengeStore = defineStore('daily-challenges', {
  state: (): DailyChallengePersistState => ({
    completedIdsByDate: {},
    totalXp: 0,
    streakDays: 0,
    lastFullCompleteDate: null,
    isCollapsed: false,
  }),

  actions: {
    hydrateSafely() {
      const clean = sanitizeDailyChallengeState({
        completedIdsByDate: this.completedIdsByDate,
        totalXp: this.totalXp,
        streakDays: this.streakDays,
        lastFullCompleteDate: this.lastFullCompleteDate,
        isCollapsed: this.isCollapsed,
      })
      this.completedIdsByDate = clean.completedIdsByDate
      this.totalXp = clean.totalXp
      this.streakDays = clean.streakDays
      this.lastFullCompleteDate = clean.lastFullCompleteDate
      this.isCollapsed = clean.isCollapsed
    },

    getCompletedForDate(dateKey: string = getDailyDateKey()): string[] {
      this.hydrateSafely()
      return this.completedIdsByDate[dateKey] ?? []
    },

    isCompleted(challengeId: string, dateKey: string = getDailyDateKey()): boolean {
      return this.getCompletedForDate(dateKey).includes(challengeId)
    },

    toggleChallenge(challengeId: string, dateKey: string = getDailyDateKey()): boolean {
      this.hydrateSafely()
      const current = this.completedIdsByDate[dateKey] ?? []
      const def = DAILY_CHALLENGE_CATALOG.find((item) => item.id === challengeId)
      const xp = def?.xpReward ?? 25

      let nextList: string[]
      let nowDone: boolean
      if (current.includes(challengeId)) {
        nextList = current.filter((id) => id !== challengeId)
        this.totalXp = Math.max(0, this.totalXp - xp)
        nowDone = false
      } else {
        nextList = [...current, challengeId]
        this.totalXp += xp
        nowDone = true
      }

      // Giữ lịch sử tối đa 14 ngày gần nhất để tránh phình localStorage
      const nextMap: Record<string, string[]> = {
        ...this.completedIdsByDate,
        [dateKey]: nextList,
      }
      const sortedDates = Object.keys(nextMap).sort()
      while (sortedDates.length > 14) {
        const oldest = sortedDates.shift()
        if (oldest) delete nextMap[oldest]
      }
      this.completedIdsByDate = nextMap

      // Cập nhật chuỗi ngày khi hoàn tất đủ 3/3 nhiệm vụ trong ngày
      const dailyPicks = getDailyChallengesForDate(dateKey)
      const completedAllToday =
        dailyPicks.length > 0 && dailyPicks.every((pick) => nextList.includes(pick.id))

      if (completedAllToday && this.lastFullCompleteDate !== dateKey) {
        const yesterdayKey = getPreviousDateKey(dateKey)
        this.streakDays =
          this.lastFullCompleteDate === yesterdayKey ? this.streakDays + 1 : 1
        this.lastFullCompleteDate = dateKey
      }

      return nowDone
    },

    toggleCollapsed() {
      this.hydrateSafely()
      this.isCollapsed = !this.isCollapsed
    },

    clearProgress() {
      this.completedIdsByDate = {}
      this.totalXp = 0
      this.streakDays = 0
      this.lastFullCompleteDate = null
    },
  },

  persist: {
    key: 'vibe:daily-challenges',
    storage: localStorage,
    pick: [
      'completedIdsByDate',
      'totalXp',
      'streakDays',
      'lastFullCompleteDate',
      'isCollapsed',
    ],
  },
})
