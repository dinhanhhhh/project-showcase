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
  createInitialState,
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
})
