/* ========================================
   NGÃ RẼ CUỘC ĐỜI — Data Management
   ======================================== */
import type {
  Achievement,
  ActiveSkill,
  AssetDefinition,
  Career,
  CharacterTrait,
  EndingDefinition,
  GameDataJson,
  GameEvent,
  PassiveItem,
  YearlyAction,
} from './types'

import { CAREERS, getCareerLevel, getNextCareerLevel, isExecutiveLevel } from './data/careers'
import { COMMON_EVENTS, LATE_GAME_EVENTS, MILESTONE_EVENTS } from './data/events-common'
import { ARC_EVENTS } from './data/events-arcs'
import { CAREER_EVENTS } from './data/events-career'
import { DANGEROUS_EVENTS } from './data/events-dangerous'
import { ACTIVE_SKILLS, PASSIVE_ITEMS } from './data/items'
import { ACHIEVEMENTS as DATA_ACHIEVEMENTS } from './data/achievements'
import { CHARACTER_TRAITS } from './data/traits'
import { INVESTMENT_ASSETS, YEARLY_ACTIONS } from './data/assets'
import { ALL_ENDINGS } from './data/endings'

export * from './types'
export { getCareerLevel, getNextCareerLevel, isExecutiveLevel }

export const ACHIEVEMENTS: Achievement[] = DATA_ACHIEVEMENTS

const GAME_DATA: GameDataJson = {
  careers: CAREERS as Record<string, Career>,
  commonEvents: [...COMMON_EVENTS, ...LATE_GAME_EVENTS] as GameEvent[],
  arcEvents: ARC_EVENTS as GameEvent[],
  careerEvents: CAREER_EVENTS as Record<string, GameEvent[]>,
  dangerousEvents: DANGEROUS_EVENTS as GameEvent[],
  milestoneEvents: MILESTONE_EVENTS as GameEvent[],
  passiveItems: PASSIVE_ITEMS as PassiveItem[],
  activeSkills: ACTIVE_SKILLS as ActiveSkill[],
  traits: CHARACTER_TRAITS as readonly CharacterTrait[],
  assets: INVESTMENT_ASSETS as readonly AssetDefinition[],
  yearlyActions: YEARLY_ACTIONS as readonly YearlyAction[],
  endings: ALL_ENDINGS as readonly EndingDefinition[],
}

export async function loadGameData(): Promise<GameDataJson> {
  return Promise.resolve(GAME_DATA)
}
