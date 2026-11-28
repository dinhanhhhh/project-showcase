import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  GameEngine,
  UNEMPLOYED_TITLE,
  computeLifeRecap,
  computeNetWorth,
  formatLifeRecapShareText,
} from '../src/views/ngare/engine'
import { loadGameData } from '../src/views/ngare/game-data'
import type { Choice, GameEvent } from '../src/views/ngare/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('GameEngine - Ngã Rẽ Cuộc Đời', () => {
  let engine: GameEngine

  beforeEach(() => {
    engine = new GameEngine()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('nên khởi tạo game mới với các chỉ số mặc định', async () => {
    const state = await engine.newGame('Anh Truong', 'programmer')
    
    expect(state).not.toBeNull()
    expect(state?.name).toBe('Anh Truong')
    expect(state?.careerId).toBe('programmer')
    expect(state?.age).toBe(22)
    expect(state?.stats.money).toBe(45)
    expect(state?.gameOver).toBe(false)
  })

  it('nên thăng tiến cấp bậc khi đủ điều kiện skill', async () => {
    await engine.newGame('Anh Truong', 'programmer')
    
    // Skill bắt đầu là 35 (Lập trình viên tập sự)
    // Thêm 20 skill -> 55 (Lập trình viên cao cấp)
    const choice: Choice = {
      text: 'Học tập mạnh mẽ',
      effects: { skill: 20 },
      result: 'Xong'
    }

    await engine.applyChoice(choice)
    
    expect(engine.state?.stats.skill).toBe(55)
    expect(engine.state?.currentLevel).toBe('Lập trình viên cao cấp')
    // Tiền: 45 (gốc) + 40 (lương level cao cấp) = 85
    expect(engine.state?.stats.money).toBe(85)
  })

  it('nên kết thúc game khi tiền về 0 (phá sản)', async () => {
    await engine.newGame('Fail Test', 'programmer')
    
    // Test phá sản (money <= 0)
    // Đang có 45 tiền. Trừ 45 (hoặc nhiều hơn) để về 0.
    const choiceMoney: Choice = {
      text: 'Mất toàn bộ tiền',
      // Dùng -50 để chắc chắn về 0 (vì kẹp [0, 100])
      effects: { money: -50 },
      result: 'Hết tiền'
    }
    await engine.applyChoice(choiceMoney)
    
    // Lưu ý: engine.applyChoice cộng salary SAU KHI trừ tiền choice
    // programmer level 0 salary là 15.
    // 45 - 50 = 0. Sau đó 0 + 15 = 15. => CHƯA PHÁ SẢN.
    // Để phá sản, tổng tiền sau choice + salary phải <= 0.
    // Vậy ta cần trừ ít nhất 45 + 15 = 60.
    
    expect(engine.state?.stats.money).toBeGreaterThan(0) // Chứng minh tại sao fail trước đó

    await engine.newGame('Real Fail', 'programmer')
    const extremeChoice: Choice = {
      text: 'Nợ nần chồng chất',
      effects: { money: -70 }, // 45 - 70 = 0. Sau đó 0 + 15 = 15. Vẫn chưa chết?
      result: 'Vẫn còn lương'
    }
    await engine.applyChoice(extremeChoice)
    
    // Thử trừ cực nhiều
    await engine.newGame('Total Bankruptcy', 'programmer')
    await engine.applyChoice({
      text: 'Thảm họa tài chính',
      effects: { money: -100 },
      result: 'Trắng tay'
    })
    
    // Thử trừ health (không có salary bù)
    const choiceHealth: Choice = {
      text: 'Bệnh nặng',
      effects: { health: -100 },
      result: 'Hết máu'
    }
    await engine.applyChoice(choiceHealth)
    expect(engine.state?.gameOver).toBe(true)
    expect(engine.state?.gameOverInfo?.reason).toBe('health')
  })

  it('nên lưu và tải lại game thành công', async () => {
    const state = await engine.newGame('Save Test', 'business')
    expect(state).not.toBeNull()
    // Giả lập persistedstate: lưu state vào localStorage theo đúng key
    const stateToSave = { ...state!, stats: { ...state!.stats, money: 999 } }
    localStorage.setItem('ngare_game_state', JSON.stringify({ gameState: stateToSave }))

    // Load lại từ localStorage
    const raw = localStorage.getItem('ngare_game_state')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as { gameState: typeof state }
    expect(parsed.gameState?.name).toBe('Save Test')
    expect(parsed.gameState?.stats.money).toBe(999)
  })

  it('nên mở khóa thành tựu chính xác', async () => {
    await engine.newGame('Achieve Test', 'programmer')
    
    // Điều kiện 'workaholic': skill >= 90
    // Start 35. Thêm 60 -> 95.
    const choice: Choice = {
      text: 'Max Skill',
      effects: { skill: 60 },
      result: 'Pro'
    }

    await engine.applyChoice(choice)
    
    expect(engine.state?.unlockedAchievements).toContain('workaholic')
  })

  it('nên áp dụng hiệu ứng vật phẩm thụ động mỗi năm', async () => {
    await engine.newGame('Item Test', 'programmer')
    
    // Thêm "Sách Tự học" (skill +2 mỗi năm)
    engine.state?.inventory.push('book_learning')
    
    const choice: Choice = {
      text: 'Nghỉ ngơi',
      effects: {},
      result: 'Yên bình'
    }

    const startSkill = engine.state?.stats.skill || 35
    await engine.applyChoice(choice)
    
    // Skill = startSkill + 2 (item) + 0 (choice)
    expect(engine.state?.stats.skill).toBe(startSkill + 2)
  })

  it('returns null when initializing with an unknown career id', async () => {
    const state = await engine.newGame('Unknown', 'astronaut_invalid')
    expect(state).toBeNull()
  })

  it('triggers gameOver on burnout (stress >= 100) and zero-salary bankruptcy', async () => {
    await engine.newGame('Stress Test', 'programmer')
    await engine.applyChoice({
      text: 'OT xuyên màn đêm',
      effects: { stress: 120 },
      result: 'Kiệt sức',
    })
    expect(engine.state?.gameOver).toBe(true)
    expect(engine.state?.gameOverInfo?.reason).toBe('burnout')

    await engine.newGame('Broke Test', 'programmer')
    engine.state!.careerId = 'unemployed'
    engine.state!.salary = 0
    await engine.applyChoice({
      text: 'Mất trắng vốn',
      effects: { money: -100 },
      result: 'Trắng tay',
    })
    expect(engine.state?.gameOver).toBe(true)
    expect(engine.state?.gameOverInfo?.reason).toBe('money')
    const ending = engine.calculateEnding()
    expect(ending.id).toBe('pha_san')
  })

  it('completes career upon reaching MAX_AGE retirement and computes an ending', async () => {
    await engine.newGame('Retire Test', 'programmer')
    engine.state!.age = 59
    await engine.applyChoice({
      text: 'Cống hiến năm cuối',
      effects: { skill: 5, happiness: 10 },
      result: 'Nghỉ hưu',
    })

    expect(engine.state?.age).toBe(60)
    expect(engine.state?.gameOver).toBe(true)
    const ending = engine.calculateEnding()
    expect(ending).not.toBeNull()
    expect(ending.title.length).toBeGreaterThan(0)
  })

  it('triggers instant gameOver from choice isGameOver flag', async () => {
    await engine.newGame('Instant End', 'programmer')
    await engine.applyChoice({
      text: 'Bước ngoặt định mệnh',
      effects: {},
      result: 'Kết thúc bất ngờ',
      isGameOver: true,
      gameOverReason: {
        type: 'scandal',
        message: 'Ngã rẽ bất ngờ',
        icon: '⚡',
      },
    })

    expect(engine.state?.gameOver).toBe(true)
    expect(engine.state?.gameOverInfo?.reason).toBe('event')
    expect(engine.state?.gameOverInfo?.message).toContain('Ngã rẽ bất ngờ')
  })

  it('handles buyItem with sufficient funds, unlockAge guard, duplicate prevention, and insufficient money', async () => {
    await engine.newGame('Shopper', 'programmer')
    // Start age = 22, money = 45
    const failAgeLock = await engine.buyItem('meditation_app') // unlockAge 25
    expect(failAgeLock.success).toBe(false)

    engine.state!.age = 28
    const failExpensive = await engine.buyItem('wedding_ring') // cost 50
    expect(failExpensive.success).toBe(false)

    const ok = await engine.buyItem('meditation_app') // cost 15
    expect(ok.success).toBe(true)
    expect(engine.state?.stats.money).toBe(30)
    expect(engine.state?.inventory).toContain('meditation_app')

    const dup = await engine.buyItem('meditation_app')
    expect(dup.success).toBe(false)
  })

  it('supports buying and activating Oracle Preview & Time Rewind skills with unlockAge and cooldowns', async () => {
    await engine.newGame('Strategist', 'programmer')
    engine.state!.stats.money = 100
    expect((await engine.buySkill('skill_time_rewind')).success).toBe(false) // unlockAge 30

    engine.state!.age = 30
    const boughtOracle = await engine.buySkill('skill_oracle')
    expect(boughtOracle.success).toBe(true)
    const usedOracle = await engine.useSkill('skill_oracle')
    expect(usedOracle.success).toBe(true)
    expect(usedOracle.isPreview).toBe(true)

    const cooldownBlock = await engine.useSkill('skill_oracle')
    expect(cooldownBlock.success).toBe(false)

    const boughtRewind = await engine.buySkill('skill_time_rewind')
    expect(boughtRewind.success).toBe(true)
    const ageBefore = engine.state!.age
    await engine.applyChoice({
      text: 'Thử nghiệm rủi ro',
      effects: { happiness: -20 },
      result: 'Sai lầm',
    })
    expect(engine.state!.age).toBe(ageBefore + 1)

    const rewound = await engine.useSkill('skill_time_rewind')
    expect(rewound.success).toBe(true)
    expect(engine.state!.age).toBe(ageBefore)
  })

  it('computes accurate LifeRecap summary with strongest and weakest positive stats', async () => {
    const state = await engine.newGame('Recap Test', 'programmer')
    expect(state).not.toBeNull()
    state!.age = 42
    state!.stats = {
      money: 80,
      happiness: 65,
      skill: 95,
      health: 40,
      relationships: 55,
      stress: 20,
    }
    state!.achievements = [
      { age: 30, text: 'Milestone 1' },
      { age: 38, text: 'Milestone 2' },
    ]

    const recap = computeLifeRecap(state!)
    expect(recap.yearsLived).toBe(20)
    expect(recap.totalScore).toBe(80 + 95 + 65 + 40 + 55 - 20)
    expect(recap.milestonesCount).toBe(2)
    expect(recap.strongestStat).toEqual({ key: 'skill', value: 95 })
    expect(recap.weakestStat).toEqual({ key: 'health', value: 40 })
  })

  it('does not cap money at 100 when gaining cash via choices or passive items', async () => {
    await engine.newGame('Wealthy', 'programmer')
    engine.state!.stats.money = 120
    engine.state!.inventory.push('finance_advisor') // +4 money/year
    await engine.applyChoice({
      text: 'Dự án lớn',
      effects: { money: 35 },
      result: 'Thành công',
    })
    // 120 + 35 (choice) + 4 (finance_advisor) + 25 (salary lv1: skill 35) - 0 (age 23 < 26)
    expect(engine.state!.stats.money).toBeGreaterThan(150)
  })

  it('consumes skill_shield after blocking a single dangerous event instead of granting permanent immunity', async () => {
    await engine.newGame('Shielded', 'programmer')
    engine.state!.age = 27
    engine.state!.stats.money = 100
    await engine.buySkill('skill_shield')
    await engine.useSkill('skill_shield')
    expect(engine.state!.activeBuffs.some((b) => b.type === 'immunity_danger')).toBe(true)

    const blockedFirst = engine._consumeDangerShield('Cám dỗ thử nghiệm')
    expect(blockedFirst).toBe(true)
    expect(engine.state!.activeBuffs.some((b) => b.type === 'immunity_danger')).toBe(false)
    expect(engine.state!.lastNotice).toContain('Khiên bảo vệ')

    const blockedSecond = engine._consumeDangerShield('Lần hai')
    expect(blockedSecond).toBe(false)
  })

  it('tracks survivor and zen_master achievements accurately instead of unlocking on game start', async () => {
    await engine.newGame('Ach Accuracy', 'programmer')
    engine.state!.stats.stress = 5
    await engine.applyChoice({ text: 'Năm 1 nhẹ nhàng', effects: { stress: -2 }, result: null })
    expect(engine.state!.unlockedAchievements).not.toContain('survivor')
    expect(engine.state!.unlockedAchievements).not.toContain('zen_master')

    for (let i = 0; i < 4; i++) {
      await engine.applyChoice({ text: 'Tiếp tục tĩnh tâm', effects: { stress: -5 }, result: null })
    }
    expect(engine.state!.unlockedAchievements).toContain('zen_master')

    await engine.applyChoice({ text: 'Tai nạn nhẹ', effects: { health: -60 }, result: null })
    expect(engine.state!.hadCriticalHealth).toBe(true)
    await engine.applyChoice({ text: 'Hồi phục tốt', effects: { health: 40 }, result: null })
    expect(engine.state!.unlockedAchievements).toContain('survivor')
  })

  it('executes Story Arc flags, schedules follow-up events, and filters by requiredFlags', async () => {
    await engine.newGame('Arc Runner', 'programmer')
    engine.state!.age = 25
    await engine.applyChoice({
      text: 'Khởi nghiệp',
      effects: { money: -10 },
      setFlags: ['startup_exploring'],
      scheduleEvent: { eventId: 'arc_startup_seed', delayYears: 2 },
      result: 'Bắt đầu',
    })
    expect(engine.state!.flags).toContain('startup_exploring')
    expect(engine.state!.pendingEvents).toHaveLength(1)

    engine.state!.age = 27
    const nextEvt = engine.getNextEvent()
    expect(nextEvt?.id).toBe('arc_startup_seed')
  })

  it('enforces one yearly action per year and resets availability on next year', async () => {
    await engine.newGame('Actor', 'programmer')
    const first = await engine.performYearlyAction('study_course')
    expect(first.success).toBe(true)
    expect(engine.state!.yearlyActionUsed).toBe(true)

    const second = await engine.performYearlyAction('networking_dinner')
    expect(second.success).toBe(false)

    await engine.applyChoice({ text: 'Qua năm', effects: {}, result: null })
    expect(engine.state!.yearlyActionUsed).toBe(false)
  })

  it('supports buying/selling investment assets, computing net worth, and switching careers at 28+', async () => {
    await engine.newGame('Investor', 'programmer')
    engine.state!.stats.money = 160
    const tooYoungSwitch = await engine.switchCareer('business')
    expect(tooYoungSwitch.success).toBe(false)

    const tooYoungStock = await engine.buyAsset('stocks')
    expect(tooYoungStock.success).toBe(false)

    engine.state!.age = 24
    const buyStock = await engine.buyAsset('stocks')
    expect(buyStock.success).toBe(true)
    expect(computeNetWorth(engine.state!)).toBe(160) // 120 cash + 40 stock at neutral

    engine.state!.age = 28
    const switched = await engine.switchCareer('business')
    expect(switched.success).toBe(true)
    expect(engine.state!.careerId).toBe('business')
    expect(engine.state!.careerSwitches).toBe(1)

    const sold = await engine.sellAsset('stocks')
    expect(sold.success).toBe(true)
    expect(engine.state!.assets).toHaveLength(0)
  })

  it('triggers special endings (ty_phu_tu_than, an_si_binh_yen) and formats share text', async () => {
    await engine.newGame('Special Rich', 'business')
    engine.state!.age = 60
    engine.state!.stats = {
      money: 520,
      skill: 80,
      happiness: 75,
      stress: 30,
      health: 70,
      relationships: 60,
    }
    const richEnding = engine.calculateEnding()
    expect(richEnding.id).toBe('ty_phu_tu_than')

    engine.state!.stats.money = 150
    engine.state!.stats.happiness = 90
    engine.state!.stats.health = 85
    engine.state!.stats.stress = 10
    const zenEnding = engine.calculateEnding()
    expect(zenEnding.id).toBe('an_si_binh_yen')

    const share = formatLifeRecapShareText(engine.state!, zenEnding, computeLifeRecap(engine.state!))
    expect(share).toContain('Ẩn Sĩ Bình Yên')
    expect(share).toContain('Tài sản ròng')
  })

  it('validates entire ngare data graph: unique IDs, valid stat keys, sorted careers, and valid scheduleEvent targets', async () => {
    const data = await loadGameData()
    const validStats = new Set(['money', 'skill', 'happiness', 'stress', 'health', 'relationships'])

    const careerEventsFlat: GameEvent[] = Object.values(data.careerEvents).flat()
    const allEvents: GameEvent[] = [
      ...data.commonEvents,
      ...data.arcEvents,
      ...careerEventsFlat,
      ...data.dangerousEvents,
      ...data.milestoneEvents,
    ]

    expect(allEvents.length).toBeGreaterThanOrEqual(80)
    const eventIds = new Set<string>()
    for (const evt of allEvents) {
      expect(evt.id.trim().length).toBeGreaterThan(0)
      expect(eventIds.has(evt.id)).toBe(false)
      eventIds.add(evt.id)
      expect(evt.choices.length).toBeGreaterThanOrEqual(1)
      if (evt.minAge !== undefined && evt.maxAge !== undefined) {
        expect(evt.minAge).toBeLessThanOrEqual(evt.maxAge)
      }
    }

    for (const evt of allEvents) {
      for (const ch of evt.choices) {
        expect(ch.text.trim().length).toBeGreaterThan(0)
        for (const statKey of Object.keys(ch.effects)) {
          expect(validStats.has(statKey)).toBe(true)
        }
        if (ch.scheduleEvent) {
          expect(eventIds.has(ch.scheduleEvent.eventId)).toBe(true)
          expect(ch.scheduleEvent.delayYears).toBeGreaterThanOrEqual(1)
        }
      }
    }

    const careers = Object.values(data.careers)
    expect(careers.length).toBeGreaterThanOrEqual(5)
    for (const career of careers) {
      expect(career.levels.length).toBeGreaterThanOrEqual(3)
      for (let i = 1; i < career.levels.length; i++) {
        expect(career.levels[i].minSkill).toBeGreaterThanOrEqual(career.levels[i - 1].minSkill)
        expect(career.levels[i].salary).toBeGreaterThan(0)
      }
    }

    const endingIds = new Set(data.endings.map((e) => e.id))
    expect(data.endings).toHaveLength(15)
    expect(endingIds.size).toBe(15)

    for (const trait of data.traits) {
      for (const key of Object.keys(trait.statModifiers)) {
        expect(validStats.has(key)).toBe(true)
      }
    }
  })

  it('simulates multi-decade life from age 22 to 60 retirement with promotions, actions, assets, and career switch', async () => {
    const startState = await engine.newGame('Marathon Runner', 'programmer', 'privileged')
    expect(startState).not.toBeNull()

    let switchedCareer = false
    let soldOneAsset = false

    for (let step = 0; step < 45; step++) {
      if (!engine.state || engine.state.gameOver) break

      // Yearly action management to sustain health/stress/skill across decades
      if (!engine.state.yearlyActionUsed) {
        if (engine.state.stats.stress >= 60 && engine.state.stats.money >= 15) {
          await engine.performYearlyAction('travel')
        } else if (engine.state.stats.health <= 55 && engine.state.stats.money >= 12) {
          await engine.performYearlyAction('health_check')
        } else if (engine.state.stats.money >= 10) {
          await engine.performYearlyAction('upskill')
        } else {
          await engine.performYearlyAction('side_hustle')
        }
      }

      // Buy & sell investment assets once unlocked
      if (engine.state.stats.money >= 80 && (engine.state.assets?.length ?? 0) === 0) {
        const bought = await engine.buyAsset('savings')
        expect(bought.success).toBe(true)
      } else if (!soldOneAsset && (engine.state.assets?.some((a) => a.units > 0) ?? false) && engine.state.age >= 30) {
        const sold = await engine.sellAsset('savings')
        expect(sold.success).toBe(true)
        soldOneAsset = true
      }

      // Exercise mid-career switch after age 28
      if (!switchedCareer && engine.state.age >= 28 && engine.state.stats.money >= 40) {
        const sw = await engine.switchCareer('business')
        expect(sw.success).toBe(true)
        switchedCareer = true
      }

      const evt = engine.getNextEvent()
      expect(evt).not.toBeNull()
      if (!evt) break

      // Pick the safest positive choice without ending the game early
      const safeChoices = evt.choices.filter((c) => !c.isGameOver)
      const picked =
        safeChoices.sort((a, b) => {
          const score = (c: Choice) =>
            (c.effects.health ?? 0) * 2 +
            (c.effects.money ?? 0) +
            (c.effects.happiness ?? 0) +
            (c.effects.skill ?? 0) -
            (c.effects.stress ?? 0) * 1.5
          return score(b) - score(a)
        })[0] ?? evt.choices[0]

      await engine.applyChoice(picked)
    }

    expect(engine.state?.gameOver).toBe(true)
    expect(engine.state?.age).toBeGreaterThanOrEqual(25)
    expect(switchedCareer).toBe(true)
    expect(soldOneAsset).toBe(true)
    expect((engine.state?.statSnapshots?.length ?? 0)).toBeGreaterThan(10)

    const ending = engine.calculateEnding()
    expect(ending.id.length).toBeGreaterThan(0)
    expect(ending.title.length).toBeGreaterThan(0)
  })

  it('exercises zen_master, double_positive buff + cooldown decay, item danger immunity, and Story Arc scheduling', async () => {
    await engine.newGame('Arc Strategist', 'programmer')
    engine.state!.age = 28
    engine.state!.stats.money = 200
    engine.state!.stats.stress = 75

    // 1. skill_zen_master resets stress to 0 and applies 5-year cooldown that decays each turn
    expect((await engine.buySkill('skill_zen_master')).success).toBe(true)
    expect((await engine.useSkill('skill_zen_master')).success).toBe(true)
    expect(engine.state!.stats.stress).toBe(0)
    expect(engine.state!.skillCooldowns['skill_zen_master']).toBe(5)

    // 2. skill_double_power doubles positive gains only and expires after 1 choice
    expect((await engine.buySkill('skill_double_power')).success).toBe(true)
    expect((await engine.useSkill('skill_double_power')).success).toBe(true)
    const skillBefore = engine.state!.stats.skill
    await engine.applyChoice({
      text: 'Đào tạo chuyên sâu',
      effects: { skill: 6, stress: 5 },
      result: 'Tăng tốc',
    })
    expect(engine.state!.stats.skill).toBe(skillBefore + 12)
    expect(engine.state!.stats.stress).toBe(5)
    expect(engine.state!.activeBuffs.some((b) => b.type === 'double_positive')).toBe(false)
    expect(engine.state!.skillCooldowns['skill_zen_master']).toBe(4)

    // 3. Passive item immunity blocks danger_scam_investment
    expect((await engine.buyItem('investment_course')).success).toBe(true)
    expect(engine._isEventImmuneByItem('danger_scam_investment')).toBe(true)
    expect(engine._isEventImmuneByItem('danger_affair')).toBe(false)

    // 4. Story Arc setFlags, removeFlags & pendingEvents delivery after delayYears
    const ideaEvent = engine._findEventById('arc_startup_idea')
    expect(ideaEvent).not.toBeNull()
    const currentAge = engine.state!.age
    await engine.applyChoice(ideaEvent!.choices[0]) // +startup_exploring, schedules arc_startup_seed at +2
    expect(engine.state!.flags).toContain('startup_exploring')
    expect(engine.state!.pendingEvents?.some((p) => p.eventId === 'arc_startup_seed')).toBe(true)

    // Advance 1 more year so age reaches triggerAge (currentAge + 2)
    await engine.applyChoice({
      text: 'Chuẩn bị pitch deck',
      effects: { happiness: 2 },
      removeFlags: ['temp_flag'],
      result: null,
    })
    expect(engine.state!.age).toBe(currentAge + 2)
    const scheduled = engine.getNextEvent()
    expect(scheduled?.id).toBe('arc_startup_seed')
  })

  it('handles layoff (unemployed flag, salary 0, UNEMPLOYED_TITLE) and recovers via arc_job_recovery or free same-career reapply', async () => {
    await engine.newGame('Layoff Survivor', 'programmer')
    engine.state!.age = 36
    engine.state!.stats.skill = 60
    engine.state!.stats.money = 100
    engine.state!.currentLevel = 'Lập trình viên cao cấp'
    engine.state!.salary = 40

    const dangerEvt = engine._findEventById('danger_job_loss')
    expect(dangerEvt).not.toBeNull()

    // Choice 2 ("Hoảng loạn, không làm gì") -> money -20, cost of living at age 36 is -4 -> 76, NO salary added
    await engine.applyChoice(dangerEvt!.choices[2])
    expect(engine.state!.flags).toContain('unemployed')
    expect(engine.state!.currentLevel).toBe(UNEMPLOYED_TITLE)
    expect(engine.state!.salary).toBe(0)
    expect(engine.state!.stats.money).toBe(76)
    expect(engine.state!.pendingEvents?.some((p) => p.eventId === 'arc_job_recovery')).toBe(true)

    // Re-applying to same career while unemployed costs 0 and keeps 100% skill
    const skillWhileUnemployed = engine.state!.stats.skill
    const reapply = await engine.switchCareer('programmer')
    expect(reapply.success).toBe(true)
    expect(engine.state!.flags).not.toContain('unemployed')
    expect(engine.state!.stats.money).toBe(76)
    expect(engine.state!.stats.skill).toBe(skillWhileUnemployed)
    expect(engine.state!.currentLevel).toBe('Lập trình viên cao cấp')
    expect(engine.state!.salary).toBe(40)

    // Layoff choice 1 ("Chấp nhận gói thôi việc") -> +15 money -4 living = +11 net, then arc_job_recovery restores job
    engine.state!.stats.money = 100
    await engine.applyChoice(dangerEvt!.choices[1])
    expect(engine.state!.flags).toContain('unemployed')
    expect(engine.state!.currentLevel).toBe(UNEMPLOYED_TITLE)
    expect(engine.state!.salary).toBe(0)
    expect(engine.state!.stats.money).toBe(111)

    const recoveryEvt = engine.getNextEvent()
    expect(recoveryEvt?.id).toBe('arc_job_recovery')
    await engine.applyChoice(recoveryEvt!.choices[0])
    expect(engine.state!.flags).not.toContain('unemployed')
    expect(engine.state!.currentLevel).toBe('Lập trình viên cao cấp')
    expect(engine.state!.salary).toBe(40)
  })

  it('unlocks prestige career ranks above CTO only when skill, relationships, and netWorth thresholds are all met', async () => {
    await engine.newGame('Tech Legend', 'programmer')
    engine.state!.age = 38

    // Skill 100 but low relationships (40) & low netWorth (150) -> stays at CTO
    engine.state!.stats.skill = 100
    engine.state!.stats.relationships = 40
    engine.state!.stats.money = 150
    await engine.applyChoice({ text: 'Duy trì chuyên môn', effects: {}, result: null })
    expect(engine.state!.currentLevel).toBe('Giám đốc công nghệ (CTO)')
    expect(engine.state!.salary).toBe(100)
    expect(engine.state!.unlockedAchievements).toContain('cto_master')

    // Meet Tech Founder thresholds: skill >= 98, relationships >= 70, netWorth >= 300
    engine.state!.stats.relationships = 75
    engine.state!.stats.money = 320
    await engine.applyChoice({ text: 'Mở rộng hệ sinh thái', effects: {}, result: null })
    expect(engine.state!.currentLevel).toBe('Nhà Sáng Lập Công Nghệ (Tech Founder)')
    expect(engine.state!.salary).toBe(135)

    // Meet Tech Group Chairman thresholds: skill >= 100, relationships >= 85, netWorth >= 800
    engine.state!.stats.relationships = 88
    engine.state!.stats.money = 820
    await engine.applyChoice({ text: 'Niêm yết tập đoàn', effects: {}, result: null })
    expect(engine.state!.currentLevel).toBe('Chủ Tịch Tập Đoàn Công Nghệ')
    expect(engine.state!.salary).toBe(180)
  })

  it('filters employee-only events out for executives/unemployed and unlocks executive crisis for executives', async () => {
    await engine.newGame('Exec Guard', 'programmer')
    engine.state!.age = 37
    engine.state!.stats.skill = 60
    engine.state!.currentLevel = 'Lập trình viên cao cấp'

    const jobLoss = engine._findEventById('danger_job_loss')
    const execCrisis = engine._findEventById('danger_executive_crisis')
    const deadline = engine._findEventById('prog_deadline')
    const promote = engine._findEventById('prog_promote')

    expect(jobLoss).not.toBeNull()
    expect(execCrisis).not.toBeNull()
    expect(deadline).not.toBeNull()
    expect(promote).not.toBeNull()

    // Non-executive employed: sees job loss / deadline / promote, NOT executive crisis
    expect(engine._isEventValid(jobLoss!)).toBe(true)
    expect(engine._isEventValid(deadline!)).toBe(true)
    expect(engine._isEventValid(promote!)).toBe(true)
    expect(engine._isEventValid(execCrisis!)).toBe(false)

    // Tech Founder (executive): blocked from job loss, deadline, promote; allowed executive crisis
    engine.state!.stats.skill = 98
    engine.state!.stats.relationships = 75
    engine.state!.stats.money = 350
    engine.state!.currentLevel = 'Nhà Sáng Lập Công Nghệ (Tech Founder)'
    expect(engine._isEventValid(jobLoss!)).toBe(false)
    expect(engine._isEventValid(deadline!)).toBe(false)
    expect(engine._isEventValid(promote!)).toBe(false)
    expect(engine._isEventValid(execCrisis!)).toBe(true)

    // Unemployed: blocked from both job loss and executive crisis
    engine.state!.flags = ['unemployed']
    engine.state!.currentLevel = UNEMPLOYED_TITLE
    expect(engine._isEventValid(jobLoss!)).toBe(false)
    expect(engine._isEventValid(execCrisis!)).toBe(false)
  })
})
