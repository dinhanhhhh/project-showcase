import { createDailyRng, getDailyDateKey } from '@/utils/daily-seed'
import type { ColorFormat, ColorRound, ColorSwatch, GridSize, HslValue } from './types'

export const TIME_ATTACK_START_SECONDS = 45
export const TIME_ATTACK_BONUS_SECONDS = 2
export const TIME_ATTACK_PENALTY_SECONDS = 3
export const MAX_LIFELINES = 2
export const DAILY_COLOR_ROUNDS = 10

export function clampChannel(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(255, Math.round(n)))
}

export function toHexChannel(n: number): string {
  return clampChannel(n).toString(16).padStart(2, '0').toUpperCase()
}

export function rgbToHsl(r: number, g: number, b: number): HslValue {
  const rn = clampChannel(r) / 255
  const gn = clampChannel(g) / 255
  const bn = clampChannel(b) / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6
    } else if (max === gn) {
      h = (bn - rn) / delta + 2
    } else {
      h = (rn - gn) / delta + 4
    }
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function createSwatch(r: number, g: number, b: number): ColorSwatch {
  const cr = clampChannel(r)
  const cg = clampChannel(g)
  const cb = clampChannel(b)
  const hslValue = rgbToHsl(cr, cg, cb)
  return {
    r: cr,
    g: cg,
    b: cb,
    rgb: `rgb(${cr}, ${cg}, ${cb})`,
    hex: `#${toHexChannel(cr)}${toHexChannel(cg)}${toHexChannel(cb)}`,
    hsl: `hsl(${hslValue.h}°, ${hslValue.s}%, ${hslValue.l}%)`,
    hslValue,
  }
}

export function randomColorSwatch(rng: () => number = Math.random): ColorSwatch {
  const r = Math.floor(rng() * 256)
  const g = Math.floor(rng() * 256)
  const b = Math.floor(rng() * 256)
  return createSwatch(r, g, b)
}

export function formatColorSwatch(swatch: ColorSwatch, format: ColorFormat): string {
  if (format === 'rgb') return swatch.rgb
  if (format === 'hex') return swatch.hex
  return swatch.hsl
}

export function buildColorRound(
  gridSize: GridSize,
  rng: () => number = Math.random,
): ColorRound {
  const target = randomColorSwatch(rng)
  const list: ColorSwatch[] = [target]
  const seen = new Set<string>([target.hex])

  while (list.length < gridSize) {
    const candidate = randomColorSwatch(rng)
    if (!seen.has(candidate.hex)) {
      seen.add(candidate.hex)
      list.push(candidate)
    }
  }

  // Fisher-Yates shuffle
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = list[i]
    list[i] = list[j]
    list[j] = temp
  }

  return { target, options: list }
}

export function applyFiftyFifty(
  options: readonly ColorSwatch[],
  targetHex: string,
  alreadyEliminated: Record<string, boolean>,
  rng: () => number = Math.random,
): Record<string, boolean> {
  const remainingWrong = options.filter(
    (opt) => opt.hex !== targetHex && !alreadyEliminated[opt.hex],
  )
  if (remainingWrong.length === 0) {
    return { ...alreadyEliminated }
  }

  const removeCount = Math.max(1, Math.floor(remainingWrong.length / 2))
  const pool = [...remainingWrong]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = pool[i]
    pool[i] = pool[j]
    pool[j] = temp
  }

  const nextEliminated: Record<string, boolean> = { ...alreadyEliminated }
  for (let i = 0; i < removeCount; i++) {
    nextEliminated[pool[i].hex] = true
  }
  return nextEliminated
}

export function getComboMultiplier(streak: number): number {
  if (streak >= 6) return 3
  if (streak >= 3) return 2
  return 1
}

export function getRoundPoints(gridSize: GridSize, nextStreak: number): number {
  const base = gridSize === 9 ? 3 : gridSize === 6 ? 2 : 1
  return base * getComboMultiplier(nextStreak)
}

export function buildDailyColorRound(
  dateKey: string = getDailyDateKey(),
  roundNumber: number = 1,
  gridSize: GridSize = 6,
): ColorRound {
  const rng = createDailyRng(`color-game-${dateKey}-r${roundNumber}-g${gridSize}`)
  return buildColorRound(gridSize, rng)
}

export function getFormatAccuracy(hits: number, attempts: number): number {
  if (attempts <= 0) return 0
  return Math.round((hits / attempts) * 100)
}

export const MAX_PALETTE_HISTORY = 12

export function formatColorPaletteSummary(
  swatches: readonly ColorSwatch[],
  score: number,
  mode: ColorGameMode,
): string {
  if (swatches.length === 0) return ''
  const modeLabel =
    mode === 'daily_seed'
      ? 'Daily Seed'
      : mode === 'time_attack'
        ? 'Time Attack'
        : 'Tự do'
  const hexList = swatches.map((item) => item.hex).join(' · ')
  return `🎨 Color Game [${modeLabel}] — ${score} điểm (${swatches.length} màu):\n${hexList}`
}
