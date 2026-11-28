import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it } from 'vitest'
import { useNeonTypingStore } from '@/stores/neonTyping'
import {
  WORD_PACKS,
  WORD_PACK_LIST,
  calculateAccuracy,
  calculateTypingRank,
  calculateWPM,
  computeAverageWpm,
  createDailyWords,
  createInitialState,
  formatTypingSummaryText,
  getRandomWords,
} from '@/views/neon-typing/engine'

describe('Neon Typing Engine & Store', () => {
  beforeEach(() => {
    localStorage.clear()
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    createApp({}).use(pinia)
    setActivePinia(pinia)
  })

  it('provides 5 themed word packs with 175+ total words including accented Vietnamese', () => {
    expect(WORD_PACK_LIST).toHaveLength(5)
    const totalWords = WORD_PACK_LIST.reduce((acc, p) => acc + p.words.length, 0)
    expect(totalWords).toBeGreaterThanOrEqual(175)
    expect(WORD_PACKS.dev.words.length).toBeGreaterThanOrEqual(30)
    expect(WORD_PACKS.vietnamese.words.length).toBeGreaterThanOrEqual(30)
    expect(WORD_PACKS.quotes_vn.words.length).toBeGreaterThanOrEqual(30)
  })

  it('generates requested word count without immediate consecutive duplicates', () => {
    // Deterministic rng returning constant 0 should still avoid adjacent duplicates
    const words = getRandomWords(20, 'syntax', () => 0)
    expect(words).toHaveLength(20)
    for (let i = 1; i < words.length; i++) {
      expect(words[i]).not.toBe(words[i - 1])
    }
  })

  it('computes WPM, accuracy, and ranking tiers accurately', () => {
    expect(calculateWPM(30, 30)).toBe(60)
    expect(calculateWPM(10, 0)).toBe(0)
    expect(calculateAccuracy(9, 10)).toBe(90)
    expect(calculateAccuracy(0, 0)).toBe(100)

    expect(calculateTypingRank(80, 96)).toBe('S+')
    expect(calculateTypingRank(65, 92)).toBe('S')
    expect(calculateTypingRank(48, 88)).toBe('A')
    expect(calculateTypingRank(32, 78)).toBe('B')
    expect(calculateTypingRank(20, 60)).toBe('C')

    const initial = createInitialState(25, 'english', 15)
    expect(initial.words).toHaveLength(25)
    expect(initial.timeLeft).toBe(15)
  })

  it('persists highscores and preferences via Pinia store', async () => {
    const store = useNeonTypingStore()
    store.recordTimedResult(72)
    store.recordSuddenDeathResult(24, 65)
    store.setPack('vietnamese')
    store.toggleSound()
    await nextTick()

    expect(store.bestWpm).toBe(72)
    expect(store.bestSuddenDeathWords).toBe(24)
    expect(store.totalGamesPlayed).toBe(2)
    expect(store.soundEnabled).toBe(false)

    const raw = localStorage.getItem('vibe_neon_typing')
    expect(raw).toBeTruthy()
    expect(raw).toContain('"bestWpm":72')
    expect(raw).toContain('"preferredPack":"vietnamese"')
  })

  it('supports accented Vietnamese pack and caps run history at 10 with average WPM calculation', async () => {
    const vnAccented = getRandomWords(10, 'quotes_vn', () => 0.25)
    expect(vnAccented).toHaveLength(10)
    expect(vnAccented.every((w) => !w.includes(' '))).toBe(true)

    const store = useNeonTypingStore()
    for (let i = 1; i <= 12; i++) {
      store.recordTimedResult(40 + i, 96, 'quotes_vn')
    }
    await nextTick()

    expect(store.history).toHaveLength(10)
    expect(store.history[0].wpm).toBe(52)
    expect(computeAverageWpm(store.history)).toBe(48)
    expect(computeAverageWpm([])).toBe(0)

    store.clearHistory()
    expect(store.history).toEqual([])
  })

  it('produces deterministic daily words per YYYY-MM-DD seed and caps dailyBestByDate at 14 days', async () => {
    const wordsA = createDailyWords('2026-11-28', 'dev', 25)
    const wordsB = createDailyWords('2026-11-28', 'dev', 25)
    const wordsNextDay = createDailyWords('2026-11-29', 'dev', 25)

    expect(wordsA).toEqual(wordsB)
    expect(wordsA).not.toEqual(wordsNextDay)
    expect(wordsA).toHaveLength(25)

    const store = useNeonTypingStore()
    store.recordDailyResult(68, 96, 'dev', '2026-11-28')
    store.recordDailyResult(52, 92, 'dev', '2026-11-28') // keeps higher score
    for (let d = 1; d <= 16; d++) {
      const day = `2026-10-${String(d).padStart(2, '0')}`
      store.recordDailyResult(50 + d, 95, 'dev', day)
    }
    await nextTick()

    expect(store.dailyBestByDate['2026-11-28']).toBe(68)
    expect(Object.keys(store.dailyBestByDate)).toHaveLength(14)
  })

  it('formats shareable summary text cleanly for timed, daily_seed, and sudden_death modes', () => {
    const timedText = formatTypingSummaryText({
      mode: 'timed',
      wpm: 78,
      accuracy: 97,
      rank: 'S+',
      maxCombo: 18,
      pack: 'dev',
      durationSeconds: 30,
    })
    expect(timedText).toContain('Tính giờ 30s')
    expect(timedText).toContain('78 WPM')
    expect(timedText).toContain('Hạng S+')

    const dailyText = formatTypingSummaryText({
      mode: 'daily_seed',
      wpm: 64,
      accuracy: 92,
      rank: 'S',
      maxCombo: 11,
      pack: 'vietnamese',
      dateKey: '2026-11-28',
    })
    expect(dailyText).toContain('Daily Seed (2026-11-28)')
    expect(dailyText).toContain('Tiếng Việt')

    const sdText = formatTypingSummaryText({
      mode: 'sudden_death',
      wpm: 50,
      accuracy: 89,
      rank: 'A',
      maxCombo: 9,
      pack: 'syntax',
      elapsedSeconds: 42,
    })
    expect(sdText).toContain('Sudden Death (42s)')
  })
})
