import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnimeFarmApi, AnimeFarmGameStateInstance } from './anime-farm-bundle.d'

let api: AnimeFarmApi

function createFreshState(): AnimeFarmGameStateInstance {
  return new api.GameState()
}

describe('Anime Farm 2.5D Engine & Economy', () => {
  beforeAll(async () => {
    await import('../public/apps/anime-farm/js/bundle.js')
    if (!globalThis.__ANIME_FARM_API__) {
      throw new Error('Expected globalThis.__ANIME_FARM_API__ to be registered')
    }
    api = globalThis.__ANIME_FARM_API__
  })

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    api.state.resetFarm()
    api.orderSystem.generateOrders(3)
  })

  it('exposes 6 balanced crops, 15 levels, and 3 weather states', () => {
    const cropIds = Object.keys(api.CROPS)
    expect(cropIds).toEqual(['wheat', 'cucumber', 'eggplant', 'pepper', 'carrot', 'corn'])
    expect(api.LEVELS).toHaveLength(15)
    expect(Object.keys(api.WEATHER_TYPES)).toEqual(['sunny', 'rain', 'rainbow'])

    for (const crop of Object.values(api.CROPS)) {
      expect(crop.sellPrice).toBeGreaterThan(crop.seedCost)
      expect(crop.orderPrice).toBeGreaterThan(crop.sellPrice)
      expect(crop.waterBoost).toBeLessThanOrEqual(crop.growTime)
    }
  })

  it('maps sprites cleanly across sprout, growing, and all 6 mature crops', () => {
    expect(api.getPlantSvg('carrot', 10)).toContain('assets/crops/sprout.png')
    expect(api.getPlantSvg('corn', 45)).toContain('assets/crops/growing.png')
    for (const cropId of ['wheat', 'cucumber', 'eggplant', 'pepper', 'carrot', 'corn']) {
      expect(api.getPlantSvg(cropId, 100)).toContain(`assets/crops/${cropId}.png`)
    }
    expect(api.getPlantSvg('unknown_crop', 100)).toContain('assets/crops/wheat.png')
  })

  it('computes level progression and coin rewards accurately', () => {
    const game = createFreshState()
    expect(game.getLevelData().level).toBe(1)
    game.addExp(15) // Level 2 threshold, rewards +50 coins
    expect(game.getLevelData().level).toBe(2)
    expect(game.coins).toBe(150)

    // Multi-level jump (Lv2 -> Lv4: Lv3 +120 + Lv4 +220 = +340 coins)
    game.addExp(85)
    expect(game.getLevelData().level).toBe(4)
    expect(game.coins).toBe(490)

    const maxInfo = api.getLevelInfo(99999)
    expect(maxInfo.level).toBe(15)
    expect(maxInfo.nextLevel).toBeNull()
    expect(maxInfo.progress).toBe(100)
  })

  it('enforces level locks, seed stock, sunny vs rainy auto-watering on plantSeed', () => {
    const game = createFreshState()

    // Eggplant requires level 2
    game.inventory.seeds.eggplant = 2
    const lockedRes = game.plantSeed(0, 'eggplant')
    expect(lockedRes.success).toBe(false)
    expect(lockedRes.reason).toBe('LEVEL_LOCKED')

    // Wheat in sunny weather starts dry
    const dryRes = game.plantSeed(0, 'wheat')
    expect(dryRes.success).toBe(true)
    expect(dryRes.autoWatered).toBe(false)
    expect(game.plots[0].status).toBe('PLANTED_DRY')
    expect(game.inventory.seeds.wheat).toBe(5)

    // Wheat in rainy weather starts watered
    game.weather = 'rain'
    const rainRes = game.plantSeed(1, 'wheat')
    expect(rainRes.success).toBe(true)
    expect(rainRes.autoWatered).toBe(true)
    expect(game.plots[1].status).toBe('PLANTED_WATERED')
    expect(game.plots[1].isWatered).toBe(true)

    // Out of seeds guard
    game.inventory.seeds.wheat = 0
    const emptySeedRes = game.plantSeed(2, 'wheat')
    expect(emptySeedRes.success).toBe(false)
    expect(emptySeedRes.reason).toBe('NO_SEEDS')
  })

  it('applies watering boost, 0.5x dry vs 1.0x wet growth speed, and maturity in tick()', () => {
    const game = createFreshState()
    game.plantSeed(0, 'wheat') // growTime = 10s, waterBoost = 5s
    expect(api.getRemainingRealSeconds(game.plots[0])).toBe(20) // 10s at 0.5x speed

    const waterRes = game.waterPlot(0)
    expect(waterRes.success).toBe(true)
    expect(game.plots[0].elapsedSeconds).toBe(5)
    expect(api.getRemainingRealSeconds(game.plots[0])).toBe(5) // 5s left at 1.0x speed

    // Prevent double-watering
    expect(game.waterPlot(0).success).toBe(false)

    // Tick 5 seconds to reach maturity
    game.tick(5)
    expect(game.plots[0].status).toBe('MATURE')
    expect(game.plots[0].growthProgress).toBe(100)
  })

  it('supports fertilizePlot and fertilizeAll with energy checks and instant maturation', () => {
    const game = createFreshState()
    game.plantSeed(0, 'wheat')
    game.plantSeed(1, 'cucumber')

    const fertOne = game.fertilizePlot(0, 8, 1.0)
    expect(fertOne.success).toBe(true)
    expect(fertOne.matured).toBe(true)
    expect(game.energy).toBe(92)

    // Low energy guard
    game.energy = 5
    const noEnergy = game.fertilizeAll(20, 0.4)
    expect(noEnergy.success).toBe(false)
    expect(noEnergy.reason).toBe('NOT_ENOUGH_ENERGY')
  })

  it('handles harvest golden bonus, rainbow +50% EXP, harvest combo, barn capacity, and digPlot', () => {
    const game = createFreshState()
    game.weather = 'rainbow'
    game.plantSeed(0, 'wheat')
    game.plots[0].status = 'MATURE'
    game.plots[0].growthProgress = 100

    // Force golden harvest (< 0.30 in rainbow)
    vi.spyOn(Math, 'random').mockReturnValue(0.05)
    const harvestRes = game.harvestPlot(0)
    expect(harvestRes?.success).toBe(true)
    expect(harvestRes?.isGolden).toBe(true)
    expect(harvestRes?.yieldCount).toBe(2)
    expect(harvestRes?.bonusGold).toBe(api.CROPS.wheat.sellPrice)
    expect(harvestRes?.earnedExp).toBe(6) // 4 * 1.5 rainbow
    expect(game.inventory.crops.wheat).toBe(2)
    expect(game.stats.goldenHarvests).toBe(1)

    // Barn full blocks harvest
    game.inventory.crops.cucumber = game.barnCapacity - 2
    game.plantSeed(1, 'wheat')
    game.plots[1].status = 'MATURE'
    const fullRes = game.harvestPlot(1)
    expect(fullRes?.success).toBe(false)
    expect(fullRes?.reason).toBe('BARN_FULL')

    // Digging clears planted crop cleanly
    game.plantSeed(2, 'wheat')
    const digRes = game.digPlot(2)
    expect(digRes.success).toBe(true)
    expect(game.plots[2].status).toBe('TILLED')
    expect(game.plots[2].cropId).toBeNull()
  })

  it('handles market transactions, barn upgrades, and plot unlocking', () => {
    const game = createFreshState()
    const buyRes = game.buySeeds('wheat', 5)
    expect(buyRes.success).toBe(true)
    expect(game.coins).toBe(90)
    expect(game.inventory.seeds.wheat).toBe(11)

    game.inventory.crops.wheat = 3
    game.inventory.crops.cucumber = 2
    const soldAll = game.sellAllCrops()
    expect(soldAll.itemsSold).toBe(5)
    expect(soldAll.totalEarned).toBe(3 * 6 + 2 * 14)

    // Unlock plot 3 requires level 2 & 30 coins
    expect(game.unlockPlot(3).reason).toBe('LEVEL_LOCKED')
    game.addExp(20) // reaches Lv2 (+50 coins)
    game.coins = 500
    const unlockRes = game.unlockPlot(3)
    expect(unlockRes.success).toBe(true)
    expect(game.plots[3].status).toBe('TILLED')

    const upgRes = game.upgradeBarn()
    expect(upgRes.success).toBe(true)
    expect(upgRes.newCapacity).toBe(90)
  })

  it('auto-waters thirsty plots when weather shifts to rain', () => {
    const game = createFreshState()
    game.plantSeed(0, 'cucumber')
    expect(game.plots[0].status).toBe('PLANTED_DRY')

    vi.spyOn(Math, 'random').mockReturnValue(0.1) // < 0.55 => rain
    game.weatherTimeLeft = 1
    game.tick(1)

    expect(game.weather).toBe('rain')
    expect(game.plots[0].isWatered).toBe(true)
    expect(game.plots[0].status).toBe('PLANTED_WATERED')
  })

  it('calculates offline crop progress on save/load and tolerates corrupted JSON', () => {
    const game = createFreshState()
    game.plantSeed(0, 'wheat') // 10s growTime
    game.waterPlot(0) // +5s boost => 5s remaining at 1.0x speed
    game.energy = 80
    game.save()

    // Simulate 10 seconds passing while offline
    const savedRaw = localStorage.getItem('FAM_FARM_GAME_SAVE_V6_3PLOTS')
    expect(savedRaw).toBeTruthy()
    const parsed = JSON.parse(savedRaw as string) as { lastSavedAt: number }
    parsed.lastSavedAt = Date.now() - 10_000
    localStorage.setItem('FAM_FARM_GAME_SAVE_V6_3PLOTS', JSON.stringify(parsed))

    const reloaded = createFreshState()
    const loadInfo = reloaded.load()
    expect(loadInfo.loaded).toBe(true)
    expect(loadInfo.maturedCount).toBe(1)
    expect(reloaded.plots[0].status).toBe('MATURE')
    expect(reloaded.energy).toBe(85)

    // Corrupted JSON falls back safely without throwing
    localStorage.setItem('FAM_FARM_GAME_SAVE_V6_3PLOTS', '{broken-json')
    const corrupt = createFreshState()
    expect(corrupt.load()).toEqual({ loaded: false })
  })

  it('completes and discards town orders while rewarding coins, EXP, and energy', () => {
    api.state.energy = 50
    api.state.coins = 100
    const orders = api.orderSystem.orders
    expect(orders).toHaveLength(3)

    const target = orders[0]
    expect(api.orderSystem.canCompleteOrder(target)).toBe(false)

    // Stock exact items for the order
    for (const req of target.items) {
      api.state.inventory.crops[req.cropId] = req.quantity
    }
    expect(api.orderSystem.canCompleteOrder(target)).toBe(true)
    expect(api.orderSystem.getDeliverableCount()).toBeGreaterThanOrEqual(1)

    const res = api.orderSystem.completeOrder(target.id)
    expect(res.success).toBe(true)
    expect(res.rewardCoins).toBe(target.rewardCoins)
    expect(api.state.stats.ordersCompleted).toBe(1)
    expect(api.state.energy).toBe(62)

    const secondId = api.orderSystem.orders[1].id
    expect(api.orderSystem.discardOrder(secondId)).toBe(true)
    expect(api.orderSystem.orders[1].id).not.toBe(secondId)
  })

  it('rejects non-positive or non-integer trade quantities and handles digPlot, fertilizeAll & rainbow EXP boost', () => {
    const game = createFreshState()
    const startCoins = game.coins

    expect(game.buySeeds('wheat', -3)).toEqual({ success: false, reason: 'INVALID_QUANTITY' })
    expect(game.buySeeds('wheat', 0)).toEqual({ success: false, reason: 'INVALID_QUANTITY' })
    expect(game.buySeeds('wheat', 1.5)).toEqual({ success: false, reason: 'INVALID_QUANTITY' })
    expect(game.coins).toBe(startCoins)

    game.inventory.crops.wheat = 2
    expect(game.sellCrop('wheat', -4)).toEqual({ success: false, reason: 'INVALID_QUANTITY' })
    expect(game.sellCrop('wheat', 0)).toEqual({ success: false, reason: 'INVALID_QUANTITY' })
    expect(game.inventory.crops.wheat).toBe(2)

    // digPlot clears planted plot cleanly and rejects empty plot
    expect(game.digPlot(0)).toEqual({ success: false, reason: 'NO_CROP' })
    game.plantSeed(0, 'wheat')
    const dug = game.digPlot(0)
    expect(dug.success).toBe(true)
    expect(game.plots[0].status).toBe('TILLED')
    expect(game.plots[0].cropId).toBeNull()

    // Rainbow weather awards 1.5x EXP boost and fertilizeAll matures multiple plots
    game.weather = 'rainbow'
    game.energy = 50
    game.plantSeed(0, 'wheat')
    game.plantSeed(1, 'cucumber')
    const fertAll = game.fertilizeAll(20, 1.0)
    expect(fertAll.success).toBe(true)
    expect(fertAll.maturedCount).toBe(2)
    expect(game.energy).toBe(30)

    vi.spyOn(Math, 'random').mockReturnValue(0.99) // non-golden deterministic
    const prevExp = game.exp
    const harvested = game.harvestPlot(0)
    expect(harvested?.success).toBe(true)
    expect((harvested?.earnedExp as number) ?? 0).toBe(Math.round(api.CROPS.wheat.expGain * 1.5))
    expect(game.exp).toBeGreaterThan(prevExp)
  })

  it('safely rejects invalid plot IDs, missing order IDs, and corrupted order storage JSON', () => {
    const game = createFreshState()
    expect(game.plantSeed(-1, 'wheat').success).toBe(false)
    expect(game.plantSeed(999, 'wheat').success).toBe(false)
    expect(game.waterPlot(999).success).toBe(false)
    expect(game.fertilizePlot(999).success).toBe(false)
    expect(game.harvestPlot(999)).toBeNull()
    expect(game.digPlot(999)).toEqual({ success: false, reason: 'NOT_FOUND' })

    expect(api.orderSystem.completeOrder('non-existent').success).toBe(false)
    expect(api.orderSystem.discardOrder('non-existent')).toBe(false)

    localStorage.setItem('FAM_ORDERS_SAVE_V4', '{corrupt-orders-json')
    expect(() => api.orderSystem.loadOrders()).not.toThrow()
    expect(api.orderSystem.orders).toEqual([])
  })
})
