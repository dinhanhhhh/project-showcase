import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it } from 'vitest'
import { useColorGameStore } from '@/stores/colorGame'
import {
  applyFiftyFifty,
  buildColorRound,
  createSwatch,
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
})
