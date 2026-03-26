import { ORACLE_CARDS } from './data'
import type { OracleCard } from './data'

/**
 * Xáo trộn mảng dùng thuật toán Fisher-Yates shuffle
 */
export function shuffleCards<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Láy ngẫu nhiên một lá bài duy nhất
 */
export function drawOneOneCard(): OracleCard {
  return ORACLE_CARDS[Math.floor(Math.random() * ORACLE_CARDS.length)]
}
