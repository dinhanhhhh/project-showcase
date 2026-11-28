/* ========================================
   TYPES - NGÃ RẼ CUỘC ĐỜI
   ======================================== */

export interface Stats {
  money: number
  skill: number
  happiness: number
  stress: number
  health: number
  relationships: number
  [key: string]: number
}

export type MarketTrend = 'bull' | 'neutral' | 'bear'

export type TraitId = 'balanced' | 'self_made' | 'privileged' | 'extrovert' | 'workaholic'

export interface CharacterTrait {
  id: TraitId
  name: string
  emoji: string
  description: string
  statModifiers: Partial<Stats>
  salaryBonus?: number
  stressMultiplier?: number
}

export type AssetId = 'savings' | 'stocks' | 'real_estate'

export interface AssetDefinition {
  id: AssetId
  name: string
  emoji: string
  description: string
  basePrice: number
  yearlyYield: number
  volatility: number
  unlockAge: number
}

export interface AssetHolding {
  assetId: AssetId
  units: number
  avgCost: number
}

export interface YearlyAction {
  id: string
  name: string
  emoji: string
  description: string
  cost: number
  effects: Partial<Stats>
  minAge?: number
}

export interface PendingScheduledEvent {
  eventId: string
  triggerAge: number
}

export interface StatSnapshot {
  age: number
  money: number
  skill: number
  happiness: number
  stress: number
  health: number
  relationships: number
  netWorth: number
}

export interface EndingDefinition {
  id: string
  icon: string
  title: string
  subtitle: string
  condition: string
  isSpecial?: boolean
}

export interface HallOfFameEntry {
  id: string
  name: string
  careerName: string
  careerEmoji: string
  age: number
  endingId: string
  endingTitle: string
  endingIcon: string
  totalScore: number
  netWorth: number
  finishedAt: string
}

export interface CareerLevel {
  title: string
  minSkill: number
  salary: number
  minRelationships?: number
  minNetWorth?: number
  minAge?: number
  isExecutive?: boolean
}

export interface CareerLevelContext {
  relationships?: number
  netWorth?: number
  age?: number
}

export interface Career {
  id: string
  name: string
  emoji: string
  description: string
  startStats: Stats
  salary: number
  levels: CareerLevel[]
}

export interface Choice {
  text: string
  icon?: string
  hint?: string
  effects: Partial<Record<keyof Stats, number | [number, number]>>
  result: string | null
  setFlags?: string[]
  removeFlags?: string[]
  scheduleEvent?: {
    eventId: string
    delayYears: number
  }
  isGameOver?: boolean
  gameOverReason?: {
    type: string
    message: string
    icon: string
  }
}

export interface GameEvent {
  id: string
  type: string
  title: string
  description: string
  minAge?: number
  maxAge?: number
  weight?: number
  oneTime?: boolean
  choices: Choice[]
  condition?: (s: Stats) => boolean
  triggerAge?: number
  source?: string
  requiredFlags?: string[]
  forbiddenFlags?: string[]
  excludeExecutive?: boolean
  onlyExecutive?: boolean
  excludeUnemployed?: boolean
  arcId?: string
  arcLabel?: string
}

export interface EngineRef {
  state: GameState | null
}

export interface Achievement {
  id: string
  title: string
  emoji: string
  description: string
  condition: (s: Stats, engine: EngineRef) => boolean
}

export interface PassiveItem {
  id: string
  name: string
  description: string
  cost: number
  effect?: Partial<Stats>
  category: string
  unlockAge: number
  immunity?: string[]
}

export interface ActiveSkill {
  id: string
  name: string
  description: string
  cost: number
  cooldown: number
  category: string
  unlockAge: number
  effect: string
}

export interface HistoryEntry {
  age: number
  year: number
  text: string
}

export interface GameState {
  name: string
  careerId: string
  careerName: string
  careerEmoji: string
  traitId?: TraitId
  age: number
  year: number
  stats: Stats
  history: HistoryEntry[]
  currentLevel: string
  salary: number
  achievements: { age: number; text: string }[]
  unlockedAchievements: string[]
  inventory: string[]
  activeSkills: string[]
  skillCooldowns: Record<string, number>
  activeBuffs: { type: string; duration: number }[]
  usedEventIds?: string[]
  flags?: string[]
  pendingEvents?: PendingScheduledEvent[]
  assets?: AssetHolding[]
  marketTrend?: MarketTrend
  yearlyActionUsed?: boolean
  hadCriticalHealth?: boolean
  lowStressStreak?: number
  careerSwitches?: number
  statSnapshots?: StatSnapshot[]
  lastDeltas?: Partial<Stats>
  lastNotice?: string | null
  gameOver: boolean
  gameOverInfo?: {
    type?: string
    message?: string
    icon?: string
    reason?: string
  }
}

export interface GameDataJson {
  careers: Record<string, Career>
  commonEvents: GameEvent[]
  arcEvents: GameEvent[]
  careerEvents: Record<string, GameEvent[]>
  dangerousEvents: GameEvent[]
  milestoneEvents: GameEvent[]
  passiveItems: PassiveItem[]
  activeSkills: ActiveSkill[]
  traits: readonly CharacterTrait[]
  assets: readonly AssetDefinition[]
  yearlyActions: readonly YearlyAction[]
  endings: readonly EndingDefinition[]
}
