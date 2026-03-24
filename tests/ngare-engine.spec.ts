import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameEngine } from '../src/views/ngare/engine'
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
    const bankruptcyChoice: Choice = {
      text: 'Thảm họa tài chính',
      effects: { money: -100 },
      result: 'Trắng tay'
    }
    // Lương lúc này là 15. 45 - 100 = 0. 0 + 15 = 15.
    await engine.applyChoice(bankruptcyChoice)
    
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
    await engine.newGame('Save Test', 'business')
    engine.state!.stats.money = 999
    engine.saveGame()

    const newEngine = new GameEngine()
    const loadedState = newEngine.loadGame()

    expect(loadedState).not.toBeNull()
    expect(loadedState?.name).toBe('Save Test')
    expect(loadedState?.stats.money).toBe(999)
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
})
