import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it } from 'vitest'
import { useColorGameStore } from '@/stores/colorGame'
import {
  DAILY_COLOR_ROUNDS,
  applyFiftyFifty,
  buildColorRound,
  buildDailyColorRound,
  createSwatch,
  formatColorPaletteSummary,
  formatColorSwatch,
  getComboMultiplier,
  getFormatAccuracy,
  getRoundPoints,
  rgbToHsl,
} from '@/views/color-game/engine'

describe('Color Game Engine & Store', () => {
  beforeEach(() => {
    localStorage.clear()
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    createApp({}).use(pinia)
    setActivePinia(pinia)
  })

  it('converts RGB channels to HEX and HSL accurately', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 })
    expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 })
    expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 })
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 })

    const cyan = createSwatch(0, 255, 255)
    expect(formatColorSwatch(cyan, 'hex')).toBe('#00FFFF')
    expect(formatColorSwatch(cyan, 'rgb')).toBe('rgb(0, 255, 255)')
    expect(formatColorSwatch(cyan, 'hsl')).toBe('hsl(180°, 100%, 50%)')
  })

  it('builds unique rounds containing target and applies 50:50 lifeline safely', () => {
    const round = buildColorRound(6)
    expect(round.options).toHaveLength(6)
    const hexes = new Set(round.options.map((o) => o.hex))
    expect(hexes.size).toBe(6)
    expect(hexes.has(round.target.hex)).toBe(true)

    const eliminated = applyFiftyFifty(round.options, round.target.hex, {})
    expect(eliminated[round.target.hex]).toBeUndefined()
    const eliminatedCount = Object.values(eliminated).filter(Boolean).length
    expect(eliminatedCount).toBe(2) // floor(5 / 2) === 2 wrong options removed
  })

  it('scales combo multipliers and points cleanly', () => {
    expect(getComboMultiplier(1)).toBe(1)
    expect(getComboMultiplier(3)).toBe(2)
    expect(getComboMultiplier(6)).toBe(3)
    expect(getRoundPoints(6, 3)).toBe(4) // 2 base * 2x combo
    expect(getRoundPoints(9, 6)).toBe(9) // 3 base * 3x combo
  })

  it('persists classic and time attack records in Pinia store', async () => {
    const store = useColorGameStore()
    store.recordClassic(18, 5)
    store.recordTimeAttack(42, 8)
    await nextTick()

    expect(store.bestClassicScore).toBe(18)
    expect(store.bestTimeAttackScore).toBe(42)
    expect(store.bestStreak).toBe(8)

    const raw = localStorage.getItem('vibe_color_game')
    expect(raw).toBeTruthy()
    expect(raw).toContain('"bestTimeAttackScore":42')
  })

  it('tracks per-format accuracy percentages across RGB, HEX, and HSL cleanly', async () => {
    expect(getFormatAccuracy(0, 0)).toBe(0)
    expect(getFormatAccuracy(3, 4)).toBe(75)

    const store = useColorGameStore()
    store.recordAttempt('hex', true)
    store.recordAttempt('hex', true)
    store.recordAttempt('hex', false)
    store.recordAttempt('rgb', true)
    await nextTick()

    expect(store.formatStats.hex).toEqual({ hits: 2, attempts: 3 })
    expect(getFormatAccuracy(store.formatStats.hex.hits, store.formatStats.hex.attempts)).toBe(67)
    expect(store.formatStats.rgb).toEqual({ hits: 1, attempts: 1 })
    expect(store.formatStats.hsl).toEqual({ hits: 0, attempts: 0 })
  })

  it('generates deterministic daily seed color rounds and retains highest daily PB', async () => {
    expect(DAILY_COLOR_ROUNDS).toBe(10)
    const r1 = buildDailyColorRound('2026-11-28', 1, 6)
    const r1Repeat = buildDailyColorRound('2026-11-28', 1, 6)
    const r2 = buildDailyColorRound('2026-11-28', 2, 6)

    expect(r1.target.hex).toBe(r1Repeat.target.hex)
    expect(r1.options.map((o) => o.hex)).toEqual(r1Repeat.options.map((o) => o.hex))
    expect(r1.target.hex).not.toBe(r2.target.hex)

    const store = useColorGameStore()
    store.recordDailyScore(24, 6, '2026-11-28')
    store.recordDailyScore(15, 3, '2026-11-28')
    await nextTick()

    expect(store.dailyBestByDate['2026-11-28']).toBe(24)
    expect(store.bestStreak).toBe(6)
  })

  it('formats solved color palette summary with HEX codes and mode labels', () => {
    expect(formatColorPaletteSummary([], 10, 'classic')).toBe('')

    const s1 = createSwatch(255, 0, 128)
    const s2 = createSwatch(16, 185, 129)
    const summary = formatColorPaletteSummary([s1, s2], 14, 'daily_seed')
    expect(summary).toContain('Daily Seed')
    expect(summary).toContain('14 điểm')
    expect(summary).toContain('#FF0080')
    expect(summary).toContain('#10B981')
  })

  it('clamps out-of-range and non-finite RGB channels consistently across rgb, hex, and hsl', () => {
    expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 })
    expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 })

    const clamped = createSwatch(-5, 300, 128)
    expect(clamped.r).toBe(0)
    expect(clamped.g).toBe(255)
    expect(clamped.b).toBe(128)
    expect(clamped.rgb).toBe('rgb(0, 255, 128)')
    expect(clamped.hex).toBe('#00FF80')
    expect(clamped.hslValue).toEqual(rgbToHsl(0, 255, 128))

    const nanSwatch = createSwatch(Number.NaN, 128, Number.POSITIVE_INFINITY)
    expect(nanSwatch.rgb).toBe('rgb(0, 128, 0)')
    expect(nanSwatch.hex).toBe('#008000')
  })
})
