/* ========================================
   GAME ENGINE — Logic game chính (Ngã Rẽ Cuộc Đời)
   ======================================== */
import { ALL_ENDINGS } from './data/endings'
import { getAssetPrice, INVESTMENT_ASSETS, YEARLY_ACTIONS } from './data/assets'
import { getTraitById } from './data/traits'
import {
  ACHIEVEMENTS,
  getCareerLevel,
  isExecutiveLevel,
  loadGameData,
  type ActiveSkill,
  type AssetDefinition,
  type AssetHolding,
  type AssetId,
  type Choice,
  type EndingDefinition,
  type GameDataJson,
  type GameEvent,
  type GameState,
  type MarketTrend,
  type PassiveItem,
  type Stats,
  type TraitId,
} from './game-data'

const CAREER_EXT_PREFIX_MAP: Record<string, string> = {
  career_ext_prog_: 'programmer',
  career_ext_biz_: 'business',
  career_ext_design_: 'design',
  career_ext_media_: 'media',
  career_ext_med_: 'medical',
  career_ext_edu_: 'education',
}

export const UNEMPLOYED_TITLE = 'Đang thất nghiệp'

export interface LifeStageInfo {
  id: 'youth' | 'rising' | 'midlife' | 'golden'
  label: string
  emoji: string
}

export function getLifeStage(age: number): LifeStageInfo {
  if (age < 30) return { id: 'youth', label: 'Tuổi Trẻ Khởi Nghiệp', emoji: '🌱' }
  if (age < 40) return { id: 'rising', label: 'Giai Đoạn Bứt Phá', emoji: '🚀' }
  if (age < 50) return { id: 'midlife', label: 'Độ Chín Trung Niên', emoji: '🧭' }
  return { id: 'golden', label: 'Mùa Gặt Xế Chiều', emoji: '🌅' }
}

export function clampStatValue(key: string, value: number): number {
  const rounded = Math.round(value)
  if (key === 'money') {
    return Math.max(0, rounded)
  }
  return Math.max(0, Math.min(100, rounded))
}

export function computeNetWorth(state: GameState): number {
  const cash = state.stats?.money ?? 0
  const trend: MarketTrend = state.marketTrend ?? 'neutral'
  const holdings = state.assets ?? []
  const assetTotal = holdings.reduce((sum, h) => {
    const def = INVESTMENT_ASSETS.find((a) => a.id === h.assetId)
    if (!def || h.units <= 0) return sum
    return sum + getAssetPrice(def, trend) * h.units
  }, 0)
  return cash + assetTotal
}

export function normalizeGameState(raw: Partial<GameState>): GameState {
  const fallbackStats: Stats = {
    money: raw.stats?.money ?? 40,
    skill: raw.stats?.skill ?? 30,
    happiness: raw.stats?.happiness ?? 60,
    stress: raw.stats?.stress ?? 25,
    health: raw.stats?.health ?? 80,
    relationships: raw.stats?.relationships ?? 40,
  }

  const normalized: GameState = {
    name: raw.name || 'Nhân vật',
    careerId: raw.careerId || 'programmer',
    careerName: raw.careerName || 'Lập Trình Viên',
    careerEmoji: raw.careerEmoji || '💻',
    traitId: raw.traitId ?? 'balanced',
    age: raw.age ?? 22,
    year: raw.year ?? new Date().getFullYear(),
    stats: fallbackStats,
    history: Array.isArray(raw.history) ? raw.history : [],
    currentLevel: raw.currentLevel || 'Khởi đầu',
    salary: raw.salary ?? 15,
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    unlockedAchievements: Array.isArray(raw.unlockedAchievements) ? raw.unlockedAchievements : [],
    inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
    activeSkills: Array.isArray(raw.activeSkills) ? raw.activeSkills : [],
    skillCooldowns:
      raw.skillCooldowns && typeof raw.skillCooldowns === 'object' ? raw.skillCooldowns : {},
    activeBuffs: Array.isArray(raw.activeBuffs) ? raw.activeBuffs : [],
    usedEventIds: Array.isArray(raw.usedEventIds) ? raw.usedEventIds : [],
    flags: Array.isArray(raw.flags) ? raw.flags : [],
    pendingEvents: Array.isArray(raw.pendingEvents) ? raw.pendingEvents : [],
    assets: Array.isArray(raw.assets) ? raw.assets : [],
    marketTrend: raw.marketTrend ?? 'neutral',
    yearlyActionUsed: Boolean(raw.yearlyActionUsed),
    hadCriticalHealth: Boolean(raw.hadCriticalHealth || fallbackStats.health <= 25),
    lowStressStreak: raw.lowStressStreak ?? 0,
    careerSwitches: raw.careerSwitches ?? 0,
    statSnapshots: Array.isArray(raw.statSnapshots) ? raw.statSnapshots : [],
    lastDeltas: raw.lastDeltas ?? {},
    lastNotice: raw.lastNotice ?? null,
    gameOver: Boolean(raw.gameOver),
    gameOverInfo: raw.gameOverInfo,
  }

  if (normalized.statSnapshots && normalized.statSnapshots.length === 0) {
    normalized.statSnapshots.push({
      age: normalized.age,
      money: normalized.stats.money,
      skill: normalized.stats.skill,
      happiness: normalized.stats.happiness,
      stress: normalized.stats.stress,
      health: normalized.stats.health,
      relationships: normalized.stats.relationships,
      netWorth: computeNetWorth(normalized),
    })
  }

  return normalized
}

export class GameEngine {
  state: GameState | null
  usedEvents: Set<string>
  MAX_AGE: number
  START_AGE: number
  previousSnapshot: { state: GameState; usedEvents: Set<string> } | null
  previewedEvent: GameEvent | null
  _data: GameDataJson | null

  constructor() {
    this.state = null
    this.usedEvents = new Set()
    this.MAX_AGE = 60
    this.START_AGE = 22
    this.previousSnapshot = null
    this.previewedEvent = null
    this._data = null
  }

  async ensureData(): Promise<GameDataJson> {
    if (!this._data) {
      this._data = await loadGameData()
    }
    return this._data
  }

  async newGame(charName: string, careerId: string, traitId: TraitId = 'balanced') {
    const data = await this.ensureData()
    const career = data.careers[careerId]
    if (!career) return null

    const trait = getTraitById(traitId)
    const startStats: Stats = JSON.parse(JSON.stringify(career.startStats)) as Stats

    for (const [k, delta] of Object.entries(trait.statModifiers)) {
      if (typeof delta === 'number' && startStats[k] !== undefined) {
        startStats[k] = clampStatValue(k, startStats[k] + delta)
      }
    }

    const startYear = new Date().getFullYear()
    this.usedEvents = new Set()
    this.previousSnapshot = null
    this.previewedEvent = null

    this.state = {
      name: charName.trim() || 'Bạn',
      careerId,
      careerName: career.name,
      careerEmoji: career.emoji,
      traitId: trait.id,
      age: this.START_AGE,
      year: startYear,
      stats: startStats,
      history: [],
      currentLevel: career.levels[0].title,
      salary: career.salary,
      achievements: [],
      unlockedAchievements: [],
      inventory: [],
      activeSkills: [],
      skillCooldowns: {},
      activeBuffs: [],
      usedEventIds: [],
      flags: [],
      pendingEvents: [],
      assets: [],
      marketTrend: 'neutral',
      yearlyActionUsed: false,
      hadCriticalHealth: startStats.health <= 25,
      lowStressStreak: 0,
      careerSwitches: 0,
      statSnapshots: [
        {
          age: this.START_AGE,
          money: startStats.money,
          skill: startStats.skill,
          happiness: startStats.happiness,
          stress: startStats.stress,
          health: startStats.health,
          relationships: startStats.relationships,
          netWorth: startStats.money,
        },
      ],
      lastDeltas: {},
      lastNotice: null,
      gameOver: false,
    }

    this._addHistory(`Chào đời sự nghiệp vào năm ${startYear}.`)
    this._addHistory(
      `Bắt đầu nghề ${career.name}${trait.id !== 'balanced' ? ` (${trait.emoji} ${trait.name})` : ''}.`,
    )
    return JSON.parse(JSON.stringify(this.state)) as GameState
  }

  _findEventById(eventId: string): GameEvent | null {
    if (!this._data) return null
    const allPools: GameEvent[] = [
      ...this._data.arcEvents,
      ...this._data.commonEvents,
      ...this._data.milestoneEvents,
      ...this._data.dangerousEvents,
      ...Object.values(this._data.careerEvents).flat(),
    ]
    return allPools.find((e) => e.id === eventId) ?? null
  }

  _syncUsedEvents() {
    if (this.state) {
      this.state.usedEventIds = Array.from(this.usedEvents)
    }
  }

  _consumeDangerShield(eventTitle: string): boolean {
    if (!this.state?.activeBuffs) return false
    const idx = this.state.activeBuffs.findIndex((b) => b.type === 'immunity_danger')
    if (idx === -1) return false
    this.state.activeBuffs.splice(idx, 1)
    const msg = `🛡️ Khiên bảo vệ đã đỡ cho bạn khỏi biến cố "${eventTitle}"!`
    this.state.lastNotice = msg
    this._addHistory(msg)
    return true
  }

  getNextEvent(): GameEvent | null {
    if (!this.state || !this._data || this.state.gameOver) return null

    if (this.previewedEvent) {
      const event = this.previewedEvent
      this.previewedEvent = null
      return event
    }

    // 1. Sự kiện hẹn giờ từ Story Arc
    const pendingList = this.state.pendingEvents ?? []
    const dueIndex = pendingList.findIndex(
      (p) => p.triggerAge <= (this.state?.age ?? 0) && !this.usedEvents.has(p.eventId),
    )
    if (dueIndex !== -1) {
      const due = pendingList[dueIndex]
      pendingList.splice(dueIndex, 1)
      const scheduled = this._findEventById(due.eventId)
      if (scheduled && this._isEventValid(scheduled)) {
        this.usedEvents.add(scheduled.id)
        this._syncUsedEvents()
        return { ...scheduled }
      }
    }

    let event: GameEvent | null = null

    // 2. Sự kiện cột mốc theo tuổi
    const milestone = this._data.milestoneEvents.find(
      (e: GameEvent) => e.triggerAge === this.state?.age && !this.usedEvents.has(e.id),
    )
    if (milestone) {
      this.usedEvents.add(milestone.id)
      this._syncUsedEvents()
      return { ...milestone }
    }

    // 3. Biến cố nguy hiểm (25%) — kiểm tra Khiên bảo vệ tiêu thụ 1 lần
    const canTriggerDanger = Math.random() < 0.25
    if (canTriggerDanger) {
      const dangerPool = this._data.dangerousEvents.filter((evt: GameEvent) =>
        this._isEventValid(evt),
      )
      if (dangerPool.length > 0) {
        const randDanger = dangerPool[Math.floor(Math.random() * dangerPool.length)]
        if (!this._consumeDangerShield(randDanger.title)) {
          event = { ...randDanger }
        }
      }
    }

    // 4. Pool sự kiện chung, cốt truyện & nghề nghiệp
    if (!event) {
      const pool: GameEvent[] = []
      for (const evt of this._data.commonEvents) {
        if (this._isEventValid(evt)) {
          pool.push({ ...evt, source: 'common' })
        }
      }
      for (const evt of this._data.arcEvents) {
        if (this._isEventValid(evt)) {
          pool.push({ ...evt, source: evt.arcLabel ? 'arc' : 'common' })
        }
      }
      const careerEvts = this._data.careerEvents[this.state.careerId] || []
      for (const evt of careerEvts) {
        if (this._isEventValid(evt)) {
          pool.push({ ...evt, source: 'career' })
        }
      }

      if (pool.length > 0) {
        const totalWeight = pool.reduce((sum, e) => sum + (e.weight || 5), 0)
        let rand = Math.random() * totalWeight
        for (const e of pool) {
          rand -= e.weight || 5
          if (rand <= 0) {
            event = e
            break
          }
        }
      }
    }

    if (event) {
      if (event.oneTime) {
        this.usedEvents.add(event.id)
        this._syncUsedEvents()
      }
      return event
    }

    return {
      id: 'fallback_rest',
      type: '🛋️ Nghỉ ngơi',
      title: 'Một năm bình yên',
      description: 'Không có biến cố gì lớn. Bạn dành thời gian nghỉ ngơi và hồi phục sức khỏe.',
      choices: [
        {
          text: 'Tận hưởng sự yên bình',
          icon: '🍵',
          effects: { happiness: 5, health: 5, stress: -5 },
          result: 'Một năm thư thái giúp bạn nạp lại năng lượng.',
        },
      ],
    }
  }

  _isEventValid(evt: GameEvent): boolean {
    if (!this.state) return false
    if (this.usedEvents.has(evt.id)) return false
    if (evt.minAge && this.state.age < evt.minAge) return false
    if (evt.maxAge && this.state.age > evt.maxAge) return false
    if (evt.condition && !evt.condition(this.state.stats)) return false
    if (evt.type === '⚠️ Nguy hiểm' && this._isEventImmuneByItem(evt.id)) return false

    const flags = this.state.flags ?? []
    if (evt.requiredFlags && !evt.requiredFlags.every((f) => flags.includes(f))) return false
    if (evt.forbiddenFlags && evt.forbiddenFlags.some((f) => flags.includes(f))) return false

    const isUnemployed = flags.includes('unemployed')
    if (evt.excludeUnemployed && isUnemployed) return false
    const isExec =
      !isUnemployed &&
      isExecutiveLevel(this.state.careerId, this.state.currentLevel, this._data?.careers)
    if (evt.excludeExecutive && isExec) return false
    if (evt.onlyExecutive && !isExec) return false

    for (const [prefix, reqCareer] of Object.entries(CAREER_EXT_PREFIX_MAP)) {
      if (evt.id.startsWith(prefix) && this.state.careerId !== reqCareer) {
        return false
      }
    }
    return true
  }

  async applyChoice(choice: Choice) {
    if (!this.state || !this._data) return null

    this.previousSnapshot = {
      state: JSON.parse(JSON.stringify(this.state)) as GameState,
      usedEvents: new Set(this.usedEvents),
    }

    const statsBefore: Stats = { ...this.state.stats }
    this.state.lastNotice = null

    const resolvedEffects: Partial<Stats> = {}
    for (const [key, value] of Object.entries(choice.effects)) {
      if (value === undefined) continue
      let val = 0
      if (Array.isArray(value)) {
        val = Math.floor(Math.random() * (value[1] - value[0] + 1)) + value[0]
      } else {
        val = value as number
      }
      resolvedEffects[key as keyof Stats] = val
    }

    const doubleBuff = this.state.activeBuffs.find((b) => b.type === 'double_positive')
    const multiplier = doubleBuff ? 2 : 1
    const trait = getTraitById(this.state.traitId)

    for (const [key, val] of Object.entries(resolvedEffects)) {
      if (val === undefined) continue
      if (this.state.stats[key] !== undefined) {
        let finalVal = val
        const isBeneficial = key === 'stress' ? val < 0 : val > 0
        if (isBeneficial && doubleBuff) finalVal *= multiplier
        if (key === 'stress' && finalVal > 0 && trait.stressMultiplier) {
          finalVal = Math.round(finalVal * trait.stressMultiplier)
        }
        this.state.stats[key] = clampStatValue(key, (this.state.stats[key] || 0) + finalVal)
      }
    }

    // Cập nhật flags & hẹn giờ sự kiện cho Story Arc
    if (choice.setFlags && choice.setFlags.length > 0) {
      const nextFlags = new Set(this.state.flags ?? [])
      for (const f of choice.setFlags) nextFlags.add(f)
      this.state.flags = Array.from(nextFlags)
    }
    if (choice.removeFlags && choice.removeFlags.length > 0) {
      const removeSet = new Set(choice.removeFlags)
      this.state.flags = (this.state.flags ?? []).filter((f) => !removeSet.has(f))
    }
    if (choice.scheduleEvent) {
      this.state.pendingEvents = this.state.pendingEvents ?? []
      this.state.pendingEvents.push({
        eventId: choice.scheduleEvent.eventId,
        triggerAge: this.state.age + Math.max(1, choice.scheduleEvent.delayYears),
      })
    }

    this._applyItemPassiveEffects()
    this._applyAssetPassiveYield()
    this._applyYearlyLivingCost()
    this._updateSkillCooldowns()
    this._rotateMarketTrend()

    this.state.age++
    this.state.year++
    this.state.yearlyActionUsed = false

    const isUnemployed = (this.state.flags ?? []).includes('unemployed')
    if (isUnemployed) {
      if (this.state.currentLevel !== UNEMPLOYED_TITLE) {
        this._addHistory('📉 Mất việc: Đang thất nghiệp (Lương 0)')
      }
      this.state.currentLevel = UNEMPLOYED_TITLE
      this.state.salary = 0
    } else {
      const career = this._data.careers[this.state.careerId]
      if (career) {
        const level = getCareerLevel(this.state.careerId, this.state.stats.skill, this._data.careers, {
          relationships: this.state.stats.relationships,
          netWorth: computeNetWorth(this.state),
          age: this.state.age,
        })
        if (level) {
          if (this.state.currentLevel === UNEMPLOYED_TITLE) {
            this._addHistory(`💼 Trở lại công việc: ${level.title}!`)
          } else if (this.state.currentLevel !== level.title) {
            this._addHistory(`📈 Thăng tiến: ${level.title}!`)
          }
          this.state.currentLevel = level.title
          const traitBonus = trait.salaryBonus ?? 0
          this.state.salary = level.salary + traitBonus
          this.state.stats.money = clampStatValue('money', this.state.stats.money + this.state.salary)
        }
      }
    }

    if (this.state.stats.health <= 25) {
      this.state.hadCriticalHealth = true
    }
    this.state.lowStressStreak =
      this.state.stats.stress <= 10 ? (this.state.lowStressStreak ?? 0) + 1 : 0

    // Tính delta thực tế để UI hiển thị chính xác
    const deltas: Partial<Stats> = {}
    for (const key of Object.keys(this.state.stats) as Array<keyof Stats>) {
      const diff = (this.state.stats[key] ?? 0) - (statsBefore[key] ?? 0)
      if (diff !== 0) {
        deltas[key] = diff
      }
    }
    this.state.lastDeltas = deltas

    this._syncUsedEvents()
    this._pushSnapshot()
    this._checkAchievements()
    this._checkGameOver(choice)

    return JSON.parse(JSON.stringify(this.state)) as GameState
  }

  _applyAssetPassiveYield() {
    if (!this.state || !this.state.assets || this.state.assets.length === 0) return
    let totalYield = 0
    for (const holding of this.state.assets) {
      if (holding.units <= 0) continue
      const def = INVESTMENT_ASSETS.find((a) => a.id === holding.assetId)
      if (def) {
        totalYield += def.yearlyYield * holding.units
      }
    }
    if (totalYield > 0) {
      this.state.stats.money = clampStatValue('money', this.state.stats.money + totalYield)
    }
  }

  _applyYearlyLivingCost() {
    if (!this.state) return
    const flags = this.state.flags ?? []
    const hasFamilyOrLoan =
      flags.includes('married') || flags.includes('has_child') || flags.includes('mortgage')
    if (this.state.age < 26 && !hasFamilyOrLoan) return

    let cost = this.state.age >= 40 ? 6 : 4
    if (flags.includes('married')) cost += 2
    if (flags.includes('has_child')) cost += 3
    if (flags.includes('mortgage')) cost += 4
    this.state.stats.money = clampStatValue('money', this.state.stats.money - cost)
  }

  _rotateMarketTrend() {
    if (!this.state) return
    if (this.state.age % 3 !== 0) return
    const roll = Math.random()
    this.state.marketTrend = roll < 0.36 ? 'bull' : roll < 0.72 ? 'neutral' : 'bear'
  }

  _pushSnapshot() {
    if (!this.state) return
    this.state.statSnapshots = this.state.statSnapshots ?? []
    this.state.statSnapshots.push({
      age: this.state.age,
      money: this.state.stats.money,
      skill: this.state.stats.skill,
      happiness: this.state.stats.happiness,
      stress: this.state.stats.stress,
      health: this.state.stats.health,
      relationships: this.state.stats.relationships,
      netWorth: computeNetWorth(this.state),
    })
    if (this.state.statSnapshots.length > 45) {
      this.state.statSnapshots = this.state.statSnapshots.slice(-45)
    }
  }

  _checkAchievements() {
    if (!this.state) return
    const engineRef = { state: this.state }
    for (const ach of ACHIEVEMENTS) {
      if (!this.state.unlockedAchievements.includes(ach.id)) {
        if (ach.condition(this.state.stats, engineRef)) {
          this.state.unlockedAchievements.push(ach.id)
          const text = `${ach.emoji} ${ach.title}: ${ach.description}`
          this.state.achievements.push({ age: this.state.age, text })
          this._addHistory(`🎉 Đạt thành tựu: ${ach.title}`)
        }
      }
    }
  }

  _checkGameOver(choice?: Choice) {
    if (!this.state) return

    if (choice?.isGameOver) {
      this.state.gameOver = true
      this.state.gameOverInfo = {
        ...choice.gameOverReason,
        reason: 'event',
      }
      return
    }

    if (this.state.stats.money <= 0) {
      this.state.gameOver = true
      this.state.gameOverInfo = {
        type: 'bankruptcy',
        message: 'Bạn đã trắng tay và không thể tiếp tục cuộc sống hiện tại.',
        icon: '📉',
        reason: 'money',
      }
    } else if (this.state.stats.health <= 0) {
      this.state.gameOver = true
      this.state.gameOverInfo = {
        type: 'disease',
        message: 'Sức khỏe của bạn đã hoàn toàn kiệt quệ.',
        icon: '🚑',
        reason: 'health',
      }
    } else if (this.state.stats.stress >= 100) {
      this.state.gameOver = true
      this.state.gameOverInfo = {
        type: 'burnout',
        message: 'Bạn bị đột quỵ do áp lực quá lớn.',
        icon: '😵',
        reason: 'burnout',
      }
    } else if (this.state.age >= this.MAX_AGE) {
      this.state.gameOver = true
      this.state.gameOverInfo = {
        type: 'retirement',
        message: 'Đã đến tuổi nghỉ hưu. Hãy cùng nhìn lại hành trình qua.',
        icon: '🌅',
        reason: 'age',
      }
    }

    if (this.state.gameOver) {
      const stats = this.state.stats
      const score =
        stats.money + stats.skill + stats.happiness + stats.health + stats.relationships - stats.stress
      this._addHistory(`🏁 Kết thúc cuộc đời ở tuổi ${this.state.age}. Tổng điểm: ${score}`)
    }
  }

  calculateEnding(): EndingDefinition {
    if (!this.state) {
      return {
        id: 'unknown',
        title: 'Kết Thúc',
        icon: '🏁',
        subtitle: 'Hành trình dừng lại.',
        condition: '',
      }
    }

    const byId = (id: string): EndingDefinition =>
      ALL_ENDINGS.find((e) => e.id === id) ?? ALL_ENDINGS[0]

    if (this.state.gameOverInfo) {
      const info = this.state.gameOverInfo
      if (info.type === 'bankruptcy') {
        return { ...byId('pha_san'), subtitle: info.message || byId('pha_san').subtitle }
      }
      if (info.type === 'disease') {
        return { ...byId('benh_tat'), subtitle: info.message || byId('benh_tat').subtitle }
      }
      if (info.reason === 'health') {
        return {
          ...byId('luc_bat_tong_tam'),
          subtitle: info.message || byId('luc_bat_tong_tam').subtitle,
        }
      }
      if (info.reason === 'burnout') {
        return {
          ...byId('hoan_toan_guc_nga'),
          subtitle: info.message || byId('hoan_toan_guc_nga').subtitle,
        }
      }
      if (info.reason && info.reason !== 'age') {
        return {
          ...byId('ket_thuc_dot_ngot'),
          icon: info.icon || '🏁',
          subtitle: info.message || byId('ket_thuc_dot_ngot').subtitle,
        }
      }
    }

    const s = this.state.stats
    const netWorth = computeNetWorth(this.state)
    const flags = this.state.flags ?? []

    // 5 Kết thúc đặc biệt khi hoàn thành hành trình
    if (flags.includes('startup_ipo') && netWorth >= 300) {
      return byId('ky_lan_khoi_nghiep')
    }
    if (netWorth >= 500) {
      return byId('ty_phu_tu_than')
    }
    if (netWorth >= 350 && s.relationships <= 25 && s.happiness <= 40) {
      return byId('dai_gia_co_doc')
    }
    if ((this.state.careerSwitches ?? 0) >= 1 && s.skill >= 85 && s.relationships >= 75) {
      return byId('lao_lang_da_tai')
    }
    if (s.happiness >= 85 && s.health >= 80 && s.stress <= 15) {
      return byId('an_si_binh_yen')
    }

    const total = s.money + s.skill + s.happiness + s.health + s.relationships - s.stress
    if (total >= 350) return byId('vien_man')
    if (total >= 280) return byId('thanh_cong')
    if (total >= 200) return byId('binh_di')
    if (total >= 120) return byId('gap_ghenh')
    return byId('thu_thach')
  }

  _addHistory(text: string) {
    if (!this.state) return
    this.state.history.unshift({
      age: this.state.age,
      year: this.state.year,
      text,
    })
  }

  _applyItemPassiveEffects() {
    if (!this.state || !this.state.inventory || !this._data) return
    for (const itemId of this.state.inventory) {
      const item = this._data.passiveItems.find((i: PassiveItem) => i.id === itemId)
      if (item && item.effect) {
        for (const [key, value] of Object.entries(item.effect)) {
          if (value === undefined) continue
          if (this.state.stats[key] !== undefined) {
            this.state.stats[key] = clampStatValue(key, (this.state.stats[key] || 0) + value)
          }
        }
      }
    }
  }

  _updateSkillCooldowns() {
    if (!this.state || !this.state.skillCooldowns) return
    for (const skillId in this.state.skillCooldowns) {
      const cooldown = this.state.skillCooldowns[skillId]
      if (cooldown !== undefined && cooldown > 0) this.state.skillCooldowns[skillId] = cooldown - 1
    }
    if (this.state?.activeBuffs) {
      this.state.activeBuffs = this.state.activeBuffs.filter(
        (buff: { type: string; duration: number }) => {
          buff.duration--
          return buff.duration > 0
        },
      )
    }
  }

  _isEventImmuneByItem(eventId: string) {
    if (!this.state || !this._data) return false
    for (const itemId of this.state.inventory || []) {
      const item = this._data.passiveItems.find((i: PassiveItem) => i.id === itemId)
      if (item && item.immunity && item.immunity.includes(eventId)) return true
    }
    return false
  }

  hasSave() {
    return !!localStorage.getItem('ngare_game_state')
  }

  async performYearlyAction(actionId: string): Promise<{ success: boolean; message: string }> {
    if (!this.state || this.state.gameOver) {
      return { success: false, message: 'Game chưa sẵn sàng' }
    }
    if (this.state.yearlyActionUsed) {
      return { success: false, message: 'Bạn đã dùng hành động phụ trong năm nay rồi!' }
    }
    const action = YEARLY_ACTIONS.find((a) => a.id === actionId)
    if (!action) {
      return { success: false, message: 'Hành động không tồn tại' }
    }
    if (this.state.stats.money < action.cost) {
      return { success: false, message: `Cần ${action.cost} Tiền để thực hiện!` }
    }

    const beforeStats = { ...this.state.stats }
    if (action.cost > 0) {
      this.state.stats.money = clampStatValue('money', this.state.stats.money - action.cost)
    }
    for (const [k, delta] of Object.entries(action.effects)) {
      if (typeof delta === 'number' && this.state.stats[k] !== undefined) {
        this.state.stats[k] = clampStatValue(k, this.state.stats[k] + delta)
      }
    }

    const deltas: Partial<Stats> = {}
    for (const k of Object.keys(this.state.stats) as Array<keyof Stats>) {
      const diff = (this.state.stats[k] ?? 0) - (beforeStats[k] ?? 0)
      if (diff !== 0) deltas[k] = diff
    }
    this.state.lastDeltas = deltas
    this.state.yearlyActionUsed = true

    if (this.state.stats.health <= 25) {
      this.state.hadCriticalHealth = true
    }

    this._addHistory(`${action.emoji} Chủ động: ${action.name}`)
    this._checkAchievements()
    this._checkGameOver()
    return { success: true, message: `${action.emoji} Đã hoàn thành: ${action.name}!` }
  }

  async buyAsset(assetId: AssetId): Promise<{ success: boolean; message: string }> {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const def: AssetDefinition | undefined = INVESTMENT_ASSETS.find((a) => a.id === assetId)
    if (!def) return { success: false, message: 'Tài sản không tồn tại' }
    if (this.state.age < def.unlockAge) {
      return { success: false, message: `Cần đạt ${def.unlockAge} tuổi để đầu tư mục này` }
    }
    const price = getAssetPrice(def, this.state.marketTrend ?? 'neutral')
    if (this.state.stats.money < price) {
      return { success: false, message: `Không đủ tiền! (Cần ${price})` }
    }

    this.state.stats.money = clampStatValue('money', this.state.stats.money - price)
    this.state.assets = this.state.assets ?? []
    const existing = this.state.assets.find((a: AssetHolding) => a.assetId === assetId)
    if (existing) {
      const totalUnits = existing.units + 1
      existing.avgCost = Math.round((existing.avgCost * existing.units + price) / totalUnits)
      existing.units = totalUnits
    } else {
      this.state.assets.push({ assetId, units: 1, avgCost: price })
    }

    this._addHistory(`${def.emoji} Mua 1 đơn vị ${def.name} (giá ${price})`)
    this._checkAchievements()
    return { success: true, message: `Đã đầu tư 1 ${def.name} với giá ${price}!` }
  }

  async sellAsset(assetId: AssetId): Promise<{ success: boolean; message: string }> {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const def = INVESTMENT_ASSETS.find((a) => a.id === assetId)
    if (!def) return { success: false, message: 'Tài sản không tồn tại' }
    const assets = this.state.assets ?? []
    const existing = assets.find((a) => a.assetId === assetId)
    if (!existing || existing.units <= 0) {
      return { success: false, message: 'Bạn không nắm giữ tài sản này' }
    }

    const price = getAssetPrice(def, this.state.marketTrend ?? 'neutral')
    existing.units -= 1
    this.state.assets = assets.filter((a) => a.units > 0)
    this.state.stats.money = clampStatValue('money', this.state.stats.money + price)
    this._addHistory(`${def.emoji} Bán 1 ${def.name} thu về ${price}`)
    return { success: true, message: `Đã bán 1 ${def.name}, thu về ${price} Tiền!` }
  }

  async switchCareer(newCareerId: string): Promise<{ success: boolean; message: string }> {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const data = await this.ensureData()
    const isUnemployed = (this.state.flags ?? []).includes('unemployed')

    if (!isUnemployed && this.state.age < 28) {
      return { success: false, message: 'Cần đạt tối thiểu 28 tuổi để chuyển ngành!' }
    }
    if (!isUnemployed && this.state.careerId === newCareerId) {
      return { success: false, message: 'Bạn đang làm ngành này rồi!' }
    }
    const nextCareer = data.careers[newCareerId]
    if (!nextCareer) return { success: false, message: 'Ngành nghề không tồn tại' }

    const isReturningSameCareer = isUnemployed && this.state.careerId === newCareerId
    const switchFee = isReturningSameCareer ? 0 : 15
    if (this.state.stats.money < switchFee) {
      return { success: false, message: `Cần ${switchFee} Tiền chi phí chuyển đổi ngành!` }
    }

    if (switchFee > 0) {
      this.state.stats.money = clampStatValue('money', this.state.stats.money - switchFee)
    }
    if (!isReturningSameCareer) {
      const transferredSkill = Math.max(20, Math.round(this.state.stats.skill * 0.7))
      this.state.stats.skill = clampStatValue('skill', transferredSkill)
    }

    this.state.flags = (this.state.flags ?? []).filter((f) => f !== 'unemployed')
    this.state.pendingEvents = (this.state.pendingEvents ?? []).filter(
      (p) => p.eventId !== 'arc_job_recovery',
    )

    const trait = getTraitById(this.state.traitId)
    this.state.careerId = nextCareer.id
    this.state.careerName = nextCareer.name
    this.state.careerEmoji = nextCareer.emoji
    const level = getCareerLevel(nextCareer.id, this.state.stats.skill, data.careers, {
      relationships: this.state.stats.relationships,
      netWorth: computeNetWorth(this.state),
      age: this.state.age,
    })
    this.state.currentLevel = level?.title ?? nextCareer.levels[0].title
    this.state.salary = (level?.salary ?? nextCareer.salary) + (trait.salaryBonus ?? 0)

    if (isReturningSameCareer) {
      this._addHistory(
        `💼 Trở lại ngành ${nextCareer.emoji} ${nextCareer.name} (${this.state.currentLevel})`,
      )
      return {
        success: true,
        message: `Đã ứng tuyển lại ngành ${nextCareer.emoji} ${nextCareer.name}!`,
      }
    }

    this.state.careerSwitches = (this.state.careerSwitches ?? 0) + 1
    this._addHistory(`🔀 Chuyển ngành sang ${nextCareer.emoji} ${nextCareer.name} (${this.state.currentLevel})`)
    return { success: true, message: `Đã chuyển sang ${nextCareer.emoji} ${nextCareer.name}!` }
  }

  async buyItem(itemId: string) {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const data = await this.ensureData()
    const item = data.passiveItems.find((i: PassiveItem) => i.id === itemId)
    if (!item) return { success: false, message: 'Vật phẩm không tồn tại' }
    if (this.state.age < item.unlockAge) {
      return { success: false, message: `Cần đạt ${item.unlockAge} tuổi để mua vật phẩm này!` }
    }
    if (this.state.stats.money < item.cost) return { success: false, message: 'Không đủ tiền!' }
    if (this.state.inventory.includes(itemId))
      return { success: false, message: 'Bạn đã sở hữu vật phẩm này' }

    this.state.stats.money = clampStatValue('money', this.state.stats.money - item.cost)
    this.state.inventory.push(itemId)
    this._addHistory(`🛒 Đã mua: ${item.name}`)
    return { success: true, message: `Bạn đã mua ${item.name}!` }
  }

  async buySkill(skillId: string) {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const data = await this.ensureData()
    const skill = data.activeSkills.find((s: ActiveSkill) => s.id === skillId)
    if (!skill) return { success: false, message: 'Kỹ năng không tồn tại' }
    if (this.state.age < skill.unlockAge) {
      return { success: false, message: `Cần đạt ${skill.unlockAge} tuổi để mở khóa kỹ năng này!` }
    }
    if (this.state.stats.money < skill.cost) return { success: false, message: 'Không đủ tiền!' }
    if (this.state.activeSkills.includes(skillId))
      return { success: false, message: 'Bạn đã mở khóa kỹ năng này' }

    this.state.stats.money = clampStatValue('money', this.state.stats.money - skill.cost)
    this.state.activeSkills.push(skillId)
    this.state.skillCooldowns[skillId] = 0
    this._addHistory(`🔮 Đã học kỹ năng: ${skill.name}`)
    return { success: true, message: `Đã mở khóa ${skill.name}!` }
  }

  async useSkill(skillId: string) {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const data = await this.ensureData()
    const skill = data.activeSkills.find((s: ActiveSkill) => s.id === skillId)
    if (!skill) return { success: false, message: 'Kỹ năng không tồn tại' }
    if (!this.state.activeSkills.includes(skillId))
      return { success: false, message: 'Bạn chưa mở khóa kỹ năng này' }

    const cooldown: number = this.state.skillCooldowns[skillId] ?? 0
    if (cooldown > 0) return { success: false, message: `Còn ${cooldown} năm nữa mới dùng được` }

    const result: {
      success: boolean
      message: string
      isPreview?: boolean
      previewEvent?: GameEvent | null
    } = { success: true, message: `Kỹ năng ${skill.name} đã được sử dụng!` }

    switch (skill.effect) {
      case 'reset_stress':
        this.state.stats.stress = 0
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Stress đặt về 0.`)
        break
      case 'double_positive_effects':
        this.state.activeBuffs.push({ type: 'double_positive', duration: 1 })
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Lựa chọn sau sẽ được nhân đôi hiệu quả.`)
        break
      case 'immunity_next_danger':
        this.state.activeBuffs.push({ type: 'immunity_danger', duration: 255 })
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Sẵn sàng đỡ 1 sự kiện nguy hiểm tiếp theo.`)
        break
      case 'preview_choices':
        this.previewedEvent = this.getNextEvent()
        result.isPreview = true
        result.previewEvent = this.previewedEvent
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Nhìn trước tương lai.`)
        break
      case 'undo_last_choice':
        if (this.previousSnapshot) {
          this.state = normalizeGameState(this.previousSnapshot.state)
          this.usedEvents = new Set(this.previousSnapshot.usedEvents)
          this._syncUsedEvents()
          this.previousSnapshot = null
          this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Quay ngược thời gian!`)
        } else {
          return { success: false, message: 'Không thể quay lại nữa' }
        }
        break
      case 'boost_relationships':
        this.state.stats.relationships = Math.min(100, this.state.stats.relationships + 25)
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Mạng lưới quan hệ mở rộng.`)
        break
      case 'risk_money':
        this.state.stats.money += 30
        this.state.stats.stress = Math.min(100, this.state.stats.stress + 15)
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Nhận 30 tiền nhưng tăng stress.`)
        break
      case 'boost_skill':
        this.state.stats.skill = Math.min(100, this.state.stats.skill + 20)
        this.state.stats.stress = Math.max(0, this.state.stats.stress - 10)
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Bùng nổ năng lực cá nhân.`)
        break
      case 'boost_health':
        this.state.stats.health = Math.min(100, this.state.stats.health + 20)
        this.state.stats.happiness = Math.min(100, this.state.stats.happiness + 15)
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Sức sống bùng phát.`)
        break
      default:
        return { success: false, message: 'Hiệu ứng chưa được cài đặt' }
    }

    this.state.skillCooldowns[skillId] = skill.cooldown
    return result
  }
}

export interface LifeRecap {
  totalScore: number
  yearsLived: number
  milestonesCount: number
  netWorth: number
  strongestStat: { key: keyof Stats; value: number }
  weakestStat: { key: keyof Stats; value: number }
}

const POSITIVE_STAT_KEYS: ReadonlyArray<keyof Stats> = [
  'money',
  'skill',
  'happiness',
  'health',
  'relationships',
]

export function computeLifeRecap(state: GameState): LifeRecap {
  const s = state.stats
  const totalScore = s.money + s.skill + s.happiness + s.health + s.relationships - s.stress
  let strongestKey: keyof Stats = POSITIVE_STAT_KEYS[0]
  let weakestKey: keyof Stats = POSITIVE_STAT_KEYS[0]
  let maxVal = s[strongestKey]
  let minVal = s[weakestKey]

  for (const key of POSITIVE_STAT_KEYS) {
    const val = s[key]
    if (val > maxVal) {
      maxVal = val
      strongestKey = key
    }
    if (val < minVal) {
      minVal = val
      weakestKey = key
    }
  }

  return {
    totalScore,
    yearsLived: Math.max(0, state.age - 22),
    milestonesCount: state.achievements?.length ?? 0,
    netWorth: computeNetWorth(state),
    strongestStat: { key: strongestKey, value: maxVal },
    weakestStat: { key: weakestKey, value: minVal },
  }
}

export function formatLifeRecapShareText(
  state: GameState,
  ending: EndingDefinition,
  recap: LifeRecap,
): string {
  const lines = [
    `${ending.icon} HỒ SƠ CUỘC ĐỜI — NGÃ RẼ CUỘC ĐỜI`,
    `Nhân vật: ${state.name} (${state.careerEmoji} ${state.currentLevel})`,
    `Kết cục: ${ending.title} — ${ending.subtitle}`,
    `Điểm tổng kết: ${recap.totalScore} | Hành trình: ${recap.yearsLived} năm (Tuổi ${state.age})`,
    `Tài sản ròng: ${recap.netWorth} | Thành tựu: ${recap.milestonesCount}`,
    `Tiền ${state.stats.money} · Kỹ năng ${state.stats.skill} · Hạnh phúc ${state.stats.happiness} · Sức khỏe ${state.stats.health} · Quan hệ ${state.stats.relationships} · Stress ${state.stats.stress}`,
  ]
  return lines.join('\n')
}
