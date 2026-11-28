import { createDailyRng, getDailyDateKey, pickSeededItems } from '@/utils/daily-seed'
import { ORACLE_CARDS } from './data'
import type { OracleCard } from './data'

export const THREE_CARD_LABELS = ['Quá Khứ', 'Hiện Tại', 'Tương Lai'] as const

export interface DrawnOracleCard {
  slotLabel: string
  card: OracleCard
  reversed: boolean
}

/**
 * Xáo trộn mảng dùng thuật toán Fisher-Yates shuffle
 */
export function shuffleCards<T>(array: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

/**
 * Lấy ngẫu nhiên một lá bài duy nhất
 */
export function drawOneOneCard(rng: () => number = Math.random): OracleCard {
  return ORACLE_CARDS[Math.floor(rng() * ORACLE_CARDS.length)]
}

/**
 * Trải bài không trùng lặp theo số lượng lá (1 lá hoặc 3 lá)
 */
export function drawSpread(count: 1 | 3, rng: () => number = Math.random): OracleCard[] {
  return shuffleCards(ORACLE_CARDS, rng).slice(0, count)
}

/**
 * Rút trải bài hoàn chỉnh kèm nhãn vị trí và trạng thái Xuôi / Ngược
 */
export function drawOracleReading(
  mode: 1 | 3,
  includeReversed: boolean,
  rng: () => number = Math.random,
): DrawnOracleCard[] {
  const cards = drawSpread(mode, rng)
  return cards.map((card, idx) => ({
    slotLabel: mode === 1 ? 'Thông Điệp Hôm Nay' : (THREE_CARD_LABELS[idx] ?? `Lá ${idx + 1}`),
    card,
    reversed: includeReversed ? rng() < 0.28 : false,
  }))
}

/**
 * Lời khuyên tùy biến theo chiều xuôi hoặc chiều ngược của lá bài
 */
export function getCardAdvice(card: OracleCard, reversed: boolean): string {
  if (!reversed) return card.advice
  return `Góc nhìn Lá Ngược (${card.keyword}): Hãy tạm chậm lại để rà soát xem điều gì đang cản trở năng lượng "${card.keyword.toLowerCase()}". ${card.advice}`
}

/**
 * Tổng hợp mạch thông điệp chung cho trải bài 1 lá hoặc 3 lá
 */
export function synthesizeSpreadSummary(drawn: readonly DrawnOracleCard[]): string {
  if (drawn.length === 0) return ''
  if (drawn.length === 1) {
    const only = drawn[0]
    const stance = only.reversed ? 'ở chiều ngược (nhắc chiêm nghiệm nội tâm)' : 'ở chiều xuôi (năng lượng thuận dòng)'
    return `Lá bài "${only.card.name}" xuất hiện ${stance}, nhấn mạnh từ khóa "${only.card.keyword}". ${only.card.message}`
  }

  const reversedCount = drawn.filter((item) => item.reversed).length
  const elements = drawn.map((item) => item.card.element.split('·')[0]?.trim() ?? item.card.element)
  const keywords = drawn.map((item) => item.card.keyword).join(' → ')
  const tone =
    reversedCount === 0
      ? 'Cả 3 lá đều thuận chiều, dòng chảy năng lượng rõ ràng và ủng hộ bước tiến chủ động.'
      : reversedCount >= 2
        ? 'Có nhiều lá ngược nhắc bạn đi chậm lại, gỡ từng nút thắt nội tâm trước khi hành động lớn.'
        : 'Trải bài cân bằng giữa thuận lực bên ngoài và bài học điều chỉnh bên trong.'

  return `Hành trình ${keywords} (nguyên tố ${elements.join(' · ')}): ${tone}`
}

export function formatReadingShareText(
  question: string,
  slots: readonly DrawnOracleCard[],
  summary: string,
): string {
  if (slots.length === 0) return ''
  const lines: string[] = [`🔮 Trải bài Oracle (${slots.length} lá)`]
  if (question.trim()) {
    lines.push(`Câu hỏi: "${question.trim()}"`)
  }
  for (const slot of slots) {
    const orientation = slot.reversed ? 'Lá Ngược' : 'Xuôi'
    lines.push(
      `- ${slot.slotLabel}: ${slot.card.roman} · ${slot.card.name} (${orientation}) — ${getCardAdvice(slot.card, slot.reversed)}`,
    )
  }
  if (summary.trim()) {
    lines.push(`Tổng hợp: ${summary.trim()}`)
  }
  return lines.join('\n')
}

export function getDailyOracleCard(
  dateKey: string = getDailyDateKey(),
  includeReversed = true,
): DrawnOracleCard {
  const picked = pickSeededItems(ORACLE_CARDS, 1, `oracle-daily-${dateKey}`)[0] ?? ORACLE_CARDS[0]
  const rng = createDailyRng(`oracle-daily-rev-${dateKey}-${picked.id}`)
  const reversed = includeReversed ? rng() < 0.28 : false
  return {
    slotLabel: `Thông Điệp ${dateKey}`,
    card: picked,
    reversed,
  }
}
