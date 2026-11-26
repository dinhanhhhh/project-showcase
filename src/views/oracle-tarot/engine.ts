import { ORACLE_CARDS } from './data'
import type { OracleCard } from './data'

/**
 * Xáo trộn mảng dùng thuật toán Fisher-Yates shuffle
 */
export function shuffleCards<T>(array: readonly T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

/**
 * Lấy ngẫu nhiên một lá bài duy nhất
 */
export function drawOneOneCard(): OracleCard {
  return ORACLE_CARDS[Math.floor(Math.random() * ORACLE_CARDS.length)]
}

/**
 * Trải bài không trùng lặp theo số lượng lá (1 lá hoặc 3 lá)
 */
export function drawSpread(count: 1 | 3): OracleCard[] {
  return shuffleCards(ORACLE_CARDS).slice(0, count)
}
