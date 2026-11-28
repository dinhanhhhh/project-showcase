import type { AssetDefinition, MarketTrend, YearlyAction } from '../types'

export const INVESTMENT_ASSETS: readonly AssetDefinition[] = [
  {
    id: 'savings',
    name: 'Quỹ Tiết Kiệm An Toàn',
    emoji: '🏦',
    description: 'Sinh lời ổn định +3 Tiền/năm và giữ giá trị vững vàng kể cả khi thị trường suy thoái.',
    basePrice: 30,
    yearlyYield: 3,
    volatility: 0,
    unlockAge: 22,
  },
  {
    id: 'stocks',
    name: 'Cổ Phiếu VN30',
    emoji: '📈',
    description: 'Biến động mạnh theo chu kỳ Bull/Bear. Giá lên tới +40% khi thị trường tăng, cổ tức +4/năm.',
    basePrice: 40,
    yearlyYield: 4,
    volatility: 0.4,
    unlockAge: 23,
  },
  {
    id: 'real_estate',
    name: 'Bất Động Sản Cho Thuê',
    emoji: '🏢',
    description: 'Tạo dòng tiền thụ động +14 Tiền/năm và tăng trưởng giá trị dài hạn sau tuổi 26.',
    basePrice: 120,
    yearlyYield: 14,
    volatility: 0.15,
    unlockAge: 26,
  },
]

export function getAssetPrice(asset: AssetDefinition, trend: MarketTrend = 'neutral'): number {
  if (asset.volatility === 0) return asset.basePrice
  const multiplier =
    trend === 'bull' ? 1 + asset.volatility : trend === 'bear' ? 1 - asset.volatility : 1
  return Math.max(5, Math.round(asset.basePrice * multiplier))
}

export const YEARLY_ACTIONS: readonly YearlyAction[] = [
  {
    id: 'study_course',
    name: 'Học chuyên sâu',
    emoji: '📖',
    description: 'Nâng cấp chuyên môn (+6 Kỹ năng, +3 Stress)',
    cost: 12,
    effects: { skill: 6, stress: 3 },
  },
  {
    id: 'short_vacation',
    name: 'Du lịch xả stress',
    emoji: '🏖️',
    description: 'Nghỉ ngơi tái tạo năng lượng (-18 Stress, +10 Hạnh phúc, +4 Sức khỏe)',
    cost: 15,
    effects: { stress: -18, happiness: 10, health: 4 },
  },
  {
    id: 'networking_dinner',
    name: 'Mở rộng quan hệ',
    emoji: '🥂',
    description: 'Kết nối đồng nghiệp & mentor (+9 Quan hệ, +4 Hạnh phúc)',
    cost: 10,
    effects: { relationships: 9, happiness: 4 },
  },
  {
    id: 'health_checkup',
    name: 'Khám & Rèn thể lực',
    emoji: '🏃',
    description: 'Chăm sóc cơ thể bài bản (+12 Sức khỏe, -6 Stress)',
    cost: 10,
    effects: { health: 12, stress: -6 },
  },
  {
    id: 'side_hustle',
    name: 'Làm thêm tự do',
    emoji: '⚡',
    description: 'Nhận job ngoài kiếm thu nhập (+16 Tiền, +3 Kỹ năng, +10 Stress, -4 Sức khỏe)',
    cost: 0,
    effects: { money: 16, skill: 3, stress: 10, health: -4 },
  },
]
