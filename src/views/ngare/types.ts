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

export interface CareerLevel {
  title: string
  minSkill: number
  salary: number
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
  careerEvents: Record<string, GameEvent[]>
  dangerousEvents: GameEvent[]
  milestoneEvents: GameEvent[]
  passiveItems: PassiveItem[]
  activeSkills: ActiveSkill[]
}
