/* ========================================
   NGÃ RẼ CUỘC ĐỜI — Data Management
   ======================================== */
import type { 
  Achievement, 
  Stats, 
  EngineRef, 
  Career, 
  GameEvent, 
  PassiveItem, 
  ActiveSkill,
  GameDataJson
} from './types'

// Import data files statically
import { CAREERS } from './data/careers'
import { COMMON_EVENTS, MILESTONE_EVENTS, LATE_GAME_EVENTS } from './data/events-common'
import { CAREER_EVENTS } from './data/events-career'
import { DANGEROUS_EVENTS } from './data/events-dangerous'
import { PASSIVE_ITEMS, ACTIVE_SKILLS } from './data/items'

// Re-export all types
export * from './types'

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'rich_30',
    title: 'Triệu phú tuổi 30',
    emoji: '💎',
    description: 'Đạt tài chính 80 trước tuổi 30',
    condition: (s: Stats, engine: EngineRef) =>
      engine.state !== null && engine.state.age <= 30 && s.money >= 80,
  },
  {
    id: 'workaholic',
    title: 'Kẻ cuồng việc',
    emoji: '🧠',
    description: 'Đạt kỹ năng 90',
    condition: (s: Stats) => s.skill >= 90,
  },
  {
    id: 'zen_master',
    title: 'Bậc thầy Zen',
    emoji: '🧘',
    description: 'Giữ stress dưới 10',
    condition: (s: Stats) => s.stress <= 10,
  },
  {
    id: 'social_butterfly',
    title: 'Giao thiệp rộng',
    emoji: '🤝',
    description: 'Đạt quan hệ 90',
    condition: (s: Stats) => s.relationships >= 90,
  },
  {
    id: 'healthy_life',
    title: 'Sống khỏe dẻo dai',
    emoji: '🏃',
    description: 'Giữ sức khỏe trên 80 sau tuổi 50',
    condition: (s: Stats, engine: EngineRef) =>
      engine.state !== null && engine.state.age >= 50 && s.health >= 80,
  },
  {
    id: 'cto_master',
    title: 'Huyền thoại Công nghệ',
    emoji: '🚀',
    description: 'Trở thành CTO',
    condition: (_s: Stats, engine: EngineRef) =>
      engine.state?.currentLevel === 'Giám đốc công nghệ (CTO)',
  },
  {
    id: 'ceo_legend',
    title: 'Đế chế Kinh doanh',
    emoji: '👑',
    description: 'Trở thành CEO',
    condition: (_s: Stats, engine: EngineRef) =>
      engine.state?.currentLevel === 'CEO' ||
      engine.state?.currentLevel === 'Giám đốc bệnh viện',
  },
  {
    id: 'stress_free',
    title: 'Cuộc sống không áp lực',
    emoji: '🌈',
    description: 'Đạt hạnh phúc 90 và stress dưới 20',
    condition: (s: Stats) => s.happiness >= 90 && s.stress <= 20,
  },
  {
    id: 'wealthy_sage',
    title: 'Giàu có và sáng suốt',
    emoji: '💰',
    description: 'Đạt tài chính 90 và kỹ năng 85',
    condition: (s: Stats) => s.money >= 90 && s.skill >= 85,
  },
  {
    id: 'survivor',
    title: 'Người sống sót',
    emoji: '💪',
    description: 'Phục hồi sức khỏe lên 50 sau khi từng nguy kịch',
    condition: (s: Stats) => s.health >= 50,
  },
]

export function getCareerLevel(
  careerId: string,
  skillLevel: number,
  careers: Record<string, Career>,
) {
  const career = careers[careerId]
  if (!career) return null
  let currentLevel = career.levels[0]
  for (const level of career.levels) {
    if (skillLevel >= level.minSkill) {
      currentLevel = level
    }
  }
  return currentLevel
}

const GAME_DATA: GameDataJson = {
  careers: CAREERS as Record<string, Career>,
  commonEvents: [...COMMON_EVENTS, ...LATE_GAME_EVENTS] as GameEvent[],
  careerEvents: CAREER_EVENTS as Record<string, GameEvent[]>,
  dangerousEvents: DANGEROUS_EVENTS as GameEvent[],
  milestoneEvents: MILESTONE_EVENTS as GameEvent[],
  passiveItems: PASSIVE_ITEMS as PassiveItem[],
  activeSkills: ACTIVE_SKILLS as ActiveSkill[],
}

export async function loadGameData(): Promise<GameDataJson> {
  // Now simply return the static object as a promise to keep compatibility
  return Promise.resolve(GAME_DATA)
}