import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useOracleTarotStore } from '@/stores/oracleTarot'
import { ORACLE_CARDS } from '@/views/oracle-tarot/data'
import {
  THREE_CARD_LABELS,
  drawOneOneCard,
  drawOracleReading,
  drawSpread,
  formatReadingShareText,
  getCardAdvice,
  getDailyOracleCard,
  shuffleCards,
  synthesizeSpreadSummary,
} from '@/views/oracle-tarot/engine'

describe('Oracle Tarot Engine & Store', () => {
  beforeEach(() => {
    localStorage.clear()
    const app = createApp({})
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    app.use(pinia)
    setActivePinia(pinia)
  })

  it('provides full 22 Major Arcana cards (0..XXI) with unique ids and roman numerals', () => {
    expect(ORACLE_CARDS).toHaveLength(22)
    const ids = new Set(ORACLE_CARDS.map((c) => c.id))
    const romans = new Set(ORACLE_CARDS.map((c) => c.roman))
    expect(ids.size).toBe(22)
    expect(romans.size).toBe(22)
    expect(romans.has('0')).toBe(true)
    expect(romans.has('XXI')).toBe(true)
    expect(
      ORACLE_CARDS.every(
        (c) =>
          c.name.trim().length > 0 &&
          c.element.trim().length > 0 &&
          c.keyword.trim().length > 0 &&
          c.message.trim().length > 0 &&
          c.advice.trim().length > 0 &&
          c.image.trim().length > 0,
      ),
    ).toBe(true)
  })

  it('draws 3 unique cards for the 3-card time spread', () => {
    const spread = drawSpread(3)
    expect(spread).toHaveLength(3)
    expect(new Set(spread.map((c) => c.id)).size).toBe(3)
  })

  it('draws a valid single card and shuffles without mutating input', () => {
    const original = ['a', 'b', 'c', 'd']
    const shuffled = shuffleCards(original)
    expect(original).toEqual(['a', 'b', 'c', 'd'])
    expect(shuffled).toHaveLength(4)

    const one = drawOneOneCard()
    expect(ORACLE_CARDS.some((c) => c.id === one.id)).toBe(true)
  })

  it('draws labeled 3-card reading supporting reversed orientation and advice', () => {
    const uprightOnly = drawOracleReading(3, false, () => 0.1)
    expect(uprightOnly.map((s) => s.slotLabel)).toEqual([...THREE_CARD_LABELS])
    expect(uprightOnly.every((s) => s.reversed === false)).toBe(true)

    const withReversed = drawOracleReading(3, true, () => 0.1)
    expect(withReversed.every((s) => s.reversed === true)).toBe(true)

    const card = withReversed[0].card
    expect(getCardAdvice(card, false)).toBe(card.advice)
    expect(getCardAdvice(card, true)).toContain('Lá Ngược')

    const summary = synthesizeSpreadSummary(withReversed)
    expect(summary).toContain('Hành trình')
  })

  it('persists up to 10 oracle readings in Pinia store', async () => {
    const store = useOracleTarotStore()
    for (let i = 1; i <= 12; i++) {
      store.addReading({
        id: `r-${i}`,
        timestamp: `10:0${i % 10}`,
        mode: 3,
        question: `Câu hỏi ${i}`,
        cards: [],
      })
    }
    await nextTick()

    expect(store.history).toHaveLength(10)
    expect(store.history[0].id).toBe('r-12')

    const raw = JSON.parse(localStorage.getItem('vibe_oracle_tarot') || '{}') as {
      history?: unknown[]
      includeReversed?: boolean
    }
    expect(raw.history).toHaveLength(10)
  })

  it('handles empty spread summary, question clearing, and store preference toggles', async () => {
    expect(synthesizeSpreadSummary([])).toBe('')

    const oneCard = drawOracleReading(1, false, () => 0.5)
    expect(oneCard).toHaveLength(1)
    expect(oneCard[0].slotLabel).toBe('Thông Điệp Hôm Nay')
    expect(synthesizeSpreadSummary(oneCard)).toContain(oneCard[0].card.name)

    const store = useOracleTarotStore()
    expect(store.includeReversed).toBe(true)
    store.setIncludeReversed(false)
    expect(store.includeReversed).toBe(false)

    store.addReading({
      id: 'single-1',
      timestamp: '02:00',
      mode: 1,
      question: '',
      cards: [],
    })
    await nextTick()
    expect(store.history).toHaveLength(1)

    store.clearHistory()
    await nextTick()
    expect(store.history).toHaveLength(0)
  })

  it('guarantees unique cards when reversed orientation toggles probabilistically', () => {
    let call = 0
    const alternatingRng = () => {
      call += 1
      return (call % 2) * 0.8 + 0.1
    }
    const reading = drawOracleReading(3, true, alternatingRng)
    expect(reading).toHaveLength(3)
    expect(new Set(reading.map((slot) => slot.card.id)).size).toBe(3)
    expect(reading.some((slot) => slot.reversed)).toBe(true)
  })

  it('formats complete share text for 3-card readings and handles empty spreads', () => {
    expect(formatReadingShareText('Hôm nay thế nào?', [], '')).toBe('')

    const spread = drawOracleReading(3, true, () => 0.1)
    const summary = synthesizeSpreadSummary(spread)
    const text = formatReadingShareText('Sự nghiệp tháng này?', spread, summary)

    expect(text).toContain('🔮 Trải bài Oracle (3 lá)')
    expect(text).toContain('Câu hỏi: "Sự nghiệp tháng này?"')
    expect(text).toContain('Lá Ngược')
    expect(text).toContain(`${spread[0].card.roman} · ${spread[0].card.name}`)
    expect(text).not.toContain('undefined ·')
    expect(text).toContain(`Tổng hợp: ${summary}`)
  })

  it('draws a deterministic daily oracle card per YYYY-MM-DD seed', () => {
    const d1 = getDailyOracleCard('2026-11-28', true)
    const d2 = getDailyOracleCard('2026-11-28', true)
    expect(d1.card.id).toBe(d2.card.id)
    expect(d1.reversed).toBe(d2.reversed)
    expect(d1.slotLabel).toContain('2026-11-28')

    const noRev = getDailyOracleCard('2026-11-28', false)
    expect(noRev.reversed).toBe(false)
  })
})
