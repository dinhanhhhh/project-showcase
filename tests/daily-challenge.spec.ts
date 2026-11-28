import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDailyChallengeStore } from '@/stores/useDailyChallengeStore'
import {
  DAILY_CHALLENGE_CATALOG,
  detectTodayCompletedApps,
  getDailyChallengesForDate,
  readCrossAppProgress,
  sanitizeDailyChallengeState,
} from '@/utils/daily-challenge'
import {
  createDailyRng,
  getDailyDateKey,
  getPreviousDateKey,
  pickSeededItems,
  upsertDailyBest,
} from '@/utils/daily-seed'
import DailyHubCard from '@/views/home/DailyHubCard.vue'

function setupPinia() {
  const app = createApp({})
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
  setActivePinia(pinia)
  return pinia
}

describe('Daily Challenges & Cross-App Progress Hub', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('picks deterministic unique daily challenges per YYYY-MM-DD seed and shifts on date change', () => {
    expect(DAILY_CHALLENGE_CATALOG).toHaveLength(10)
    const dayA1 = getDailyChallengesForDate('2026-11-28')
    const dayA2 = getDailyChallengesForDate('2026-11-28')
    const dayB = getDailyChallengesForDate('2026-11-29')

    expect(dayA1).toHaveLength(3)
    expect(new Set(dayA1.map((c) => c.id)).size).toBe(3)
    expect(dayA1.map((c) => c.id)).toEqual(dayA2.map((c) => c.id))
    expect(dayA1.map((c) => c.id)).not.toEqual(dayB.map((c) => c.id))
    expect(getPreviousDateKey('2026-11-28')).toBe('2026-11-27')
    expect(pickSeededItems([], 3, 'empty')).toEqual([])
  })

  it('aggregates persisted cross-app progress accurately and survives corrupted JSON', () => {
    localStorage.setItem('vibe_co_tuong', JSON.stringify({ stats: { wins: 4 }, solvedPuzzleIds: ['p1', 'p2'] }))
    localStorage.setItem('ngare_game_state', JSON.stringify({ unlockedEndings: ['e1', 'e2', 'e3'], hallOfFame: [{}] }))
    localStorage.setItem('vibe_oop_flashcards', JSON.stringify({ masteredIds: ['m1', 'm2'], bestQuizPercent: 92 }))
    localStorage.setItem('vibe_neon_typing', JSON.stringify({ bestWpm: 78 }))
    localStorage.setItem('vibe_color_game', JSON.stringify({ bestStreak: 11 }))
    localStorage.setItem('vibe_oracle_tarot', JSON.stringify({ history: [{}, {}] }))
    localStorage.setItem('vibe_mini_piano', JSON.stringify({ savedMelodies: [{}] }))
    localStorage.setItem('FAM_FARM_GAME_SAVE_V6_3PLOTS', JSON.stringify({ stats: { totalHarvests: 24 } }))
    localStorage.setItem(
      'monopoly_saigon_achievements',
      JSON.stringify({ trum_ben_nghe: { unlocked: true }, vua_van_tai: { unlocked: false } }),
    )

    const summary = readCrossAppProgress(localStorage)
    expect(summary.chessWins).toBe(4)
    expect(summary.chessPuzzlesSolved).toBe(2)
    expect(summary.ngareEndingsUnlocked).toBe(3)
    expect(summary.oopMasteredCount).toBe(2)
    expect(summary.typingBestWpm).toBe(78)
    expect(summary.colorBestStreak).toBe(11)
    expect(summary.oracleReadings).toBe(2)
    expect(summary.pianoMelodies).toBe(1)
    expect(summary.farmHarvests).toBe(24)
    expect(summary.saigonAchievements).toBe(1)
    expect(summary.activeAppsCount).toBe(9)

    // Corrupted JSON never crashes and returns safe defaults
    localStorage.setItem('vibe_co_tuong', '{invalid-json')
    localStorage.setItem('ngare_game_state', '12345')
    localStorage.setItem('monopoly_saigon_achievements', '[]')
    const recovered = readCrossAppProgress(localStorage)
    expect(recovered.chessWins).toBe(0)
    expect(recovered.ngareEndingsUnlocked).toBe(0)
    expect(recovered.saigonAchievements).toBe(0)

    const safeState = sanitizeDailyChallengeState({ totalXp: -5, completedIdsByDate: 'bad' })
    expect(safeState.totalXp).toBe(0)
    expect(safeState.completedIdsByDate).toEqual({})
  })

  it('tracks idempotent XP, consecutive day streaks, and clears cleanly in Pinia store', () => {
    setupPinia()
    const store = useDailyChallengeStore()

    const day1 = '2026-11-27'
    const day2 = '2026-11-28'
    const picks1 = getDailyChallengesForDate(day1)
    const picks2 = getDailyChallengesForDate(day2)

    for (const item of picks1) {
      expect(store.toggleChallenge(item.id, day1)).toBe(true)
    }
    expect(store.streakDays).toBe(1)
    const expectedDay1Xp = picks1.reduce((sum, item) => sum + item.xpReward, 0)
    expect(store.totalXp).toBe(expectedDay1Xp)

    // Completing day 2 increments streak to 2
    for (const item of picks2) {
      store.toggleChallenge(item.id, day2)
    }
    expect(store.streakDays).toBe(2)

    // Unchecking restores exact XP
    store.toggleChallenge(picks2[0].id, day2)
    const expectedDay2Xp = picks2.slice(1).reduce((sum, item) => sum + item.xpReward, 0)
    expect(store.totalXp).toBe(expectedDay1Xp + expectedDay2Xp)

    store.clearProgress()
    expect(store.totalXp).toBe(0)
    expect(store.streakDays).toBe(0)
  })

  it('mounts DailyHubCard, toggles completion, and supports collapse state', async () => {
    const pinia = setupPinia()
    localStorage.setItem('vibe_co_tuong', JSON.stringify({ stats: { wins: 3 } }))

    const wrapper = mount(DailyHubCard, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    await nextTick()
    const today = getDailyDateKey()
    expect(wrapper.text()).toContain(today)
    expect(wrapper.text()).toContain('3 ván')
    expect(wrapper.findAll('.challenge-row')).toHaveLength(3)

    const firstCheck = wrapper.get('.check-btn')
    await firstCheck.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Hoàn thành 1/3')

    const collapseBtn = wrapper.get('.collapse-btn')
    await collapseBtn.trigger('click')
    await nextTick()
    expect(collapseBtn.attributes('aria-expanded')).toBe('false')

    expect(wrapper.text()).toContain('0/32')
    wrapper.unmount()
  })

  it('detectTodayCompletedApps detects Daily Seed runs for the requested date and ignores corrupt JSON', () => {
    localStorage.setItem(
      'vibe_neon_typing',
      JSON.stringify({ dailyBestByDate: { '2026-11-28': 62, '2026-11-27': 70 } }),
    )
    localStorage.setItem(
      'vibe_mini_piano',
      JSON.stringify({ dailyBestByDate: { '2026-11-28': 1100 } }),
    )
    localStorage.setItem('vibe_color_game', '{corrupted-json')

    const detected = detectTodayCompletedApps(localStorage, '2026-11-28')
    expect(detected.completedSlugs).toEqual(['neon-typing', 'mini-piano'])
    expect(detected.challengeIds).toEqual(['dc_typing_run', 'dc_piano_song'])

    // Typing under 50 WPM marks slug visited but does not auto-complete the 50+ WPM challenge
    localStorage.setItem(
      'vibe_neon_typing',
      JSON.stringify({ dailyBestByDate: { '2026-11-28': 38 } }),
    )
    const slowDetected = detectTodayCompletedApps(localStorage, '2026-11-28')
    expect(slowDetected.completedSlugs).toContain('neon-typing')
    expect(slowDetected.challengeIds).not.toContain('dc_typing_run')

    // All 3 daily apps completed cleanly
    localStorage.setItem(
      'vibe_neon_typing',
      JSON.stringify({ dailyBestByDate: { '2026-11-28': 72 } }),
    )
    localStorage.setItem(
      'vibe_color_game',
      JSON.stringify({ dailyBestByDate: { '2026-11-28': 640 } }),
    )
    const fullDetected = detectTodayCompletedApps(localStorage, '2026-11-28')
    expect(fullDetected.completedSlugs).toEqual(['neon-typing', 'mini-piano', 'color-game'])
    expect(fullDetected.challengeIds).toEqual([
      'dc_typing_run',
      'dc_piano_song',
      'dc_color_streak',
    ])
  })

  it('guards upsertDailyBest against non-finite/negative scores and caps retention across leap/year boundaries', () => {
    expect(getPreviousDateKey('2026-01-01')).toBe('2025-12-31')
    expect(getPreviousDateKey('2024-03-01')).toBe('2024-02-29')
    expect(getPreviousDateKey('bad-date')).toBe('')

    const rngA = createDailyRng('seed-check')
    const rngB = createDailyRng('seed-check')
    expect([rngA(), rngA()]).toEqual([rngB(), rngB()])

    let map = upsertDailyBest(undefined, '2026-11-28', 120)
    map = upsertDailyBest(map, '2026-11-28', 80) // ignore lower score
    map = upsertDailyBest(map, '2026-11-28', Number.POSITIVE_INFINITY)
    map = upsertDailyBest(map, '2026-11-28', Number.NaN)
    map = upsertDailyBest(map, '2026-11-28', -5)
    expect(map['2026-11-28']).toBe(120)

    // Non-positive maxEntries safely clamps to at least 1 retained day
    map = upsertDailyBest(map, '2026-11-29', 200, 0)
    expect(Object.keys(map)).toEqual(['2026-11-29'])
  })
})
