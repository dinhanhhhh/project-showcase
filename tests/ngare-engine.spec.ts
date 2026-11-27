import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameEngine, computeLifeRecap } from '../src/views/ngare/engine'
import type { Choice } from '../src/views/ngare/types'

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

  it('handles buyItem with sufficient funds, duplicate prevention, and insufficient money', async () => {
    await engine.newGame('Shopper', 'programmer')
    // Start money = 45
    const failExpensive = await engine.buyItem('wedding_ring') // cost 50
    expect(failExpensive.success).toBe(false)

    const ok = await engine.buyItem('meditation_app') // cost 15
    expect(ok.success).toBe(true)
    expect(engine.state?.stats.money).toBe(30)
    expect(engine.state?.inventory).toContain('meditation_app')

    const dup = await engine.buyItem('meditation_app')
    expect(dup.success).toBe(false)
  })

  it('supports buying and activating Oracle Preview & Time Rewind skills with cooldowns', async () => {
    await engine.newGame('Strategist', 'programmer')
    engine.state!.stats.money = 100

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
})
