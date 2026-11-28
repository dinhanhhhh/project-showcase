import type { CharacterTrait } from '../types'

export const CHARACTER_TRAITS: readonly CharacterTrait[] = [
  {
    id: 'balanced',
    name: 'Cân Bằng',
    emoji: '⚖️',
    description: 'Khởi đầu tiêu chuẩn theo đúng thế mạnh ngành nghề, không đánh đổi chỉ số.',
    statModifiers: {},
  },
  {
    id: 'self_made',
    name: 'Tự Lập',
    emoji: '🔨',
    description: 'Tôi luyện bản thân sớm: Kỹ năng +8, Stress -5, nhưng Tiền khởi điểm -5.',
    statModifiers: { skill: 8, stress: -5, money: -5 },
  },
  {
    id: 'privileged',
    name: 'Gia Đình Khá Giả',
    emoji: '🏡',
    description: 'Được hậu thuẫn tài chính: Tiền +35, Quan hệ +8, nhưng Kỹ năng tự học -5.',
    statModifiers: { money: 35, relationships: 8, skill: -5 },
  },
  {
    id: 'extrovert',
    name: 'Hướng Ngoại',
    emoji: '🌟',
    description: 'Dễ kết nối quý nhân và bạn bè: Quan hệ +15, Hạnh phúc +6.',
    statModifiers: { relationships: 15, happiness: 6 },
  },
  {
    id: 'workaholic',
    name: 'Tham Vọng',
    emoji: '🔥',
    description: 'Cày cuốc quyết liệt: Kỹ năng +10, Lương thưởng +4/năm, Stress khởi đầu +8.',
    statModifiers: { skill: 10, stress: 8 },
    salaryBonus: 4,
    stressMultiplier: 1.15,
  },
]

export function getTraitById(traitId?: string): CharacterTrait {
  return CHARACTER_TRAITS.find((t) => t.id === traitId) ?? CHARACTER_TRAITS[0]
}
