/* ========================================
   GAME ENGINE — Logic game chính
   ======================================== */
import {
  ACHIEVEMENTS,
  getCareerLevel,
  loadGameData,
  type Achievement,
  type ActiveSkill,
  type Choice,
  type GameDataJson,
  type GameEvent,
  type GameState,
  type PassiveItem,
  type Stats,
} from './game-data'

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

  async newGame(charName: string, careerId: string) {
    const data = await this.ensureData()
    const career = data.careers[careerId]
    if (!career) return null

    this.state = {
      name: charName,
      careerId: careerId,
      careerName: career.name,
      careerEmoji: career.emoji,
      age: this.START_AGE,
      year: new Date().getFullYear(),
      stats: JSON.parse(JSON.stringify(career.startStats)),
      history: [],
      currentLevel: career.levels[0].title,
      salary: career.salary,
      achievements: [],
      unlockedAchievements: [],
      inventory: [],
      activeSkills: [],
      skillCooldowns: {},
      activeBuffs: [],
      gameOver: false,
    }

    this.usedEvents = new Set()
    this.previousSnapshot = null
    this.previewedEvent = null

    this._addHistory(`Chào đời vào năm ${this.state.year}.`)
    this._addHistory(`Bắt đầu sự nghiệp: ${career.name}.`)
    return this.state
  }

  loadGame() {
    try {
      const saved = localStorage.getItem('ngare_save')
      if (!saved) return null
      const parsed = JSON.parse(saved)
      this.state = parsed.state
      this.usedEvents = new Set(parsed.used)
      return this.state
    } catch (e) {
      console.error('Lỗi load game:', e)
      return null
    }
  }

  clearSave() {
    localStorage.removeItem('ngare_save')
    this.state = null
    this.usedEvents = new Set()
  }

  getNextEvent(): GameEvent | null {
    if (!this.state || !this._data || this.state.gameOver) return null

    if (this.previewedEvent) {
      const event = this.previewedEvent
      this.previewedEvent = null
      return event
    }

    let event: GameEvent | null = null

    const milestone = this._data.milestoneEvents.find(
      (e: GameEvent) => e.triggerAge === this.state?.age && !this.usedEvents.has(e.id),
    )
    if (milestone) {
      this.usedEvents.add(milestone.id)
      event = { ...milestone }
    } else {
      const pool: GameEvent[] = []

      for (const evt of this._data.commonEvents) {
        if (this._isEventValid(evt)) {
          pool.push({ ...evt, source: 'common' } as GameEvent)
        }
      }

      const careerEvts = this._data.careerEvents[this.state.careerId] || []
      for (const evt of careerEvts) {
        if (this._isEventValid(evt)) {
          pool.push({ ...evt, source: 'career' } as GameEvent)
        }
      }

      const canTriggerDanger = Math.random() < 0.25
      if (canTriggerDanger) {
        const dangerPool = this._data.dangerousEvents.filter((evt: GameEvent) =>
          this._isEventValid(evt),
        )
        if (dangerPool.length > 0) {
          const randDanger = dangerPool[Math.floor(Math.random() * dangerPool.length)]
          event = { ...randDanger }
        }
      }

      if (!event && pool.length > 0) {
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
      if (event.oneTime) this.usedEvents.add(event.id)
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
    if (this.usedEvents.has(evt.id)) return false
    if (evt.minAge && (this.state?.age || 0) < evt.minAge) return false
    if (evt.maxAge && (this.state?.age || 0) > evt.maxAge) return false
    if (evt.condition && this.state && !evt.condition(this.state.stats)) return false
    if (evt.type === '⚠️ Nguy hiểm' && this._isEventImmune(evt.id)) return false
    return true
  }

  async applyChoice(choice: Choice) {
    if (!this.state || !this._data) return { success: false }

    this.previousSnapshot = {
      state: JSON.parse(JSON.stringify(this.state)),
      usedEvents: new Set(this.usedEvents),
    }

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

    for (const [key, val] of Object.entries(resolvedEffects)) {
       if (val === undefined) continue
      if (this.state.stats[key] !== undefined) {
        let finalVal = val
        if (val > 0 && doubleBuff) finalVal *= multiplier
        this.state.stats[key] = Math.max(0, Math.min(100, (this.state.stats[key] || 0) + finalVal))
      }
    }

    this._applyItemPassiveEffects()
    this._updateSkillCooldowns()

    this.state.age++
    this.state.year++

    const career = this._data.careers[this.state.careerId]
    if (career) {
      const level = getCareerLevel(this.state.careerId, this.state.stats.skill, this._data.careers)
      if (level) {
        if (this.state.currentLevel !== level.title) {
          this._addHistory(`📈 Thăng tiến: ${level.title}!`)
        }
        this.state.currentLevel = level.title
        this.state.salary = level.salary
        this.state.stats.money += this.state.salary
      }
    }

    this._checkAchievements()
    this._checkGameOver(choice)

    return { 
      success: true, 
      result: choice.result, 
      effects: resolvedEffects,
      gameOver: this.state.gameOver ? this.state.gameOverInfo : null
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
      const score = stats.money + stats.skill + stats.happiness + stats.health + stats.relationships - stats.stress
      this._addHistory(`🏁 Kết thúc cuộc đời ở tuổi ${this.state.age}. Tổng điểm: ${score}`)
      localStorage.removeItem('ngare_save')
    }
  }

  calculateEnding(): { id: string; title: string; icon: string; subtitle: string } {
    if (!this.state)
      return { id: 'unknown', title: 'Kết Thúc', icon: '🏁', subtitle: 'Hành trình dừng lại.' }

    if (this.state.gameOverInfo) {
      const info = this.state.gameOverInfo
      if (info.type === 'bankruptcy')
        return {
          id: 'pha_san',
          title: 'Phá Sản',
          icon: info.icon || '📉',
          subtitle: info.message || 'Bạn mất trắng sự nghiệp...',
        }
      if (info.type === 'disease')
        return {
          id: 'benh_tat',
          title: 'Đầu Hàng Tuổi Tác',
          icon: info.icon || '🚑',
          subtitle: info.message || 'Sức khỏe không cho phép bạn bước tiếp...',
        }
      if (info.reason === 'health')
        return {
          id: 'luc_bat_tong_tam',
          title: 'Lực Bất Tòng Tâm',
          icon: '🚑',
          subtitle: info.message || 'Tiền bạc không mua được sức khỏe.',
        }
      if (info.reason === 'burnout')
        return {
          id: 'hoan_toan_guc_nga',
          title: 'Hoàn Toàn Gục Ngã',
          icon: '😵',
          subtitle: info.message || 'Áp lực cuộc sống đánh gục tinh thần.',
        }
      if (info.reason && info.reason !== 'age')
        return {
          id: 'ket_thuc_dot_ngot',
          title: 'Kết Thúc Đột Ngột',
          icon: info.icon || '🏁',
          subtitle: info.message || 'Hành trình kết thúc ngoài ý muốn.',
        }
    }

    const s = this.state.stats
    const total = s.money + s.skill + s.happiness + s.health + s.relationships - s.stress
    if (total >= 350)
      return {
        id: 'vien_man',
        title: 'Cuộc Đời Viên Mãn',
        icon: '🏆',
        subtitle: 'Bạn đã sống một cuộc đời trọn vẹn, cân bằng và hạnh phúc!',
      }
    if (total >= 280)
      return {
        id: 'thanh_cong',
        title: 'Cuộc Đời Thành Công',
        icon: '⭐',
        subtitle: 'Bạn đạt được nhiều thành tựu đáng tự hào!',
      }
    if (total >= 200)
      return {
        id: 'binh_di',
        title: 'Cuộc Đời Bình Dị',
        icon: '🌿',
        subtitle: 'Cuộc sống bình thường nhưng ý nghĩa theo cách riêng.',
      }
    if (total >= 120)
      return {
        id: 'gap_ghenh',
        title: 'Cuộc Đời Gập Ghềnh',
        icon: '🌧️',
        subtitle: 'Nhiều khó khăn nhưng bạn vẫn vượt qua.',
      }
    return {
      id: 'thu_thach',
      title: 'Cuộc Đời Đầy Thử Thách',
      icon: '💔',
      subtitle: 'Cuộc sống không dễ dàng, nhưng bạn đã cố gắng.',
    }
  }

  _addHistory(text: string) {
    if (!this.state) return
    this.state.history.unshift({
      age: this.state.age,
      year: this.state.year,
      text: text,
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
            this.state.stats[key] = Math.max(
              0,
              Math.min(100, (this.state.stats[key] || 0) + (value as number)),
            )
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

  _isEventImmune(eventId: string) {
    if (!this.state || !this._data) return false
    for (const itemId of this.state.inventory || []) {
      const item = this._data.passiveItems.find((i: PassiveItem) => i.id === itemId)
      if (item && item.immunity && item.immunity.includes(eventId)) return true
    }
    if (this.state.activeBuffs) {
      const immunityBuff = this.state.activeBuffs.find(
        (b: { type: string }) => b.type === 'immunity_danger',
      )
      if (immunityBuff && eventId.startsWith('danger_')) {
        return true
      }
    }
    return false
  }

  hasSave() {
    return !!localStorage.getItem('ngare_save')
  }

  saveGame() {
    if (!this.state) return false
    localStorage.setItem(
      'ngare_save',
      JSON.stringify({ state: this.state, used: [...this.usedEvents] }),
    )
    return true
  }

  async buyItem(itemId: string) {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const data = await this.ensureData()
    const item = data.passiveItems.find((i: PassiveItem) => i.id === itemId)
    if (!item) return { success: false, message: 'Vật phẩm không tồn tại' }
    if (this.state.stats.money < item.cost) return { success: false, message: 'Không đủ tiền!' }
    if (this.state.inventory.includes(itemId))
      return { success: false, message: 'Bạn đã sở hữu vật phẩm này' }

    this.state.stats.money -= item.cost
    this.state.inventory.push(itemId)
    this._addHistory(`🛒 Đã mua: ${item.name}`)
    return { success: true, message: `Bạn đã mua ${item.name}!` }
  }

  async buySkill(skillId: string) {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const data = await this.ensureData()
    const skill = data.activeSkills.find((s: ActiveSkill) => s.id === skillId)
    if (!skill) return { success: false, message: 'Kỹ năng không tồn tại' }
    if (this.state.stats.money < skill.cost) return { success: false, message: 'Không đủ tiền!' }
    if (this.state.activeSkills.includes(skillId))
      return { success: false, message: 'Bạn đã mở khóa kỹ năng này' }

    this.state.stats.money -= skill.cost
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
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Miễn nhiễm với mối nguy tiếp theo.`)
        break
      case 'preview_choices':
        this.previewedEvent = this.getNextEvent()
        result.isPreview = true
        result.previewEvent = this.previewedEvent
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Nhìn trước tương lai.`)
        break
      case 'undo_last_choice':
        if (this.previousSnapshot) {
          this.state = this.previousSnapshot.state
          this.usedEvents = this.previousSnapshot.usedEvents
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
        this._addHistory(`⚡ Dùng kỹ năng: ${skill.name}. Nhận 30 tiền nhưng tăng cực nhiều stress.`)
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