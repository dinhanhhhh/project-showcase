export interface AnimeFarmCropDef {
  id: string
  name: string
  icon: string
  seedIcon: string
  levelReq: number
  growTime: number
  waterBoost: number
  seedCost: number
  sellPrice: number
  orderPrice: number
  expGain: number
  color: string
  description: string
}

export interface AnimeFarmLevelDef {
  level: number
  expRequired: number
  rewardCoins: number
  unlockNote: string
}

export interface AnimeFarmWeatherDef {
  id: string
  icon: string
  label: string
  desc: string
  durationSec: number
}

export interface AnimeFarmPlot {
  id: number
  status: 'LOCKED' | 'RAW' | 'TILLED' | 'PLANTED_DRY' | 'PLANTED_WATERED' | 'MATURE'
  cropId: string | null
  growthProgress: number
  elapsedSeconds: number
  growDuration: number
  isWatered: boolean
  unlockCost: number
  reqLevel: number
}

export interface AnimeFarmLevelInfo {
  level: number
  totalExp: number
  expCurrentLevel: number
  expToNext: number
  progress: number
  rewardCoins: number
  unlockNote: string
  currentLevel: AnimeFarmLevelDef
  nextLevel: AnimeFarmLevelDef | null
}

export interface AnimeFarmOrderItem {
  cropId: string
  quantity: number
}

export interface AnimeFarmOrder {
  id: string
  customerName: string
  customerAvatar: string
  dialog: string
  items: AnimeFarmOrderItem[]
  rewardCoins: number
  rewardExp: number
}

export interface AnimeFarmActionResult {
  success?: boolean
  reason?: string
  [key: string]: unknown
}

export interface AnimeFarmGameStateInstance {
  coins: number
  exp: number
  energy: number
  maxEnergy: number
  energyTickCounter: number
  barnCapacity: number
  selectedTool: string
  selectedSeed: string
  weather: string
  weatherTimeLeft: number
  harvestCombo: number
  lastHarvestAt: number
  lastSavedAt: number
  plots: AnimeFarmPlot[]
  inventory: {
    seeds: Record<string, number>
    crops: Record<string, number>
  }
  stats: {
    totalHarvests: number
    totalEarned: number
    ordersCompleted: number
    goldenHarvests: number
  }
  getLevelData(): AnimeFarmLevelInfo
  getWeatherData(): AnimeFarmWeatherDef
  getBarnUsage(): number
  addEnergy(amount: number): void
  addCoins(amount: number): void
  addExp(amount: number): void
  unlockPlot(plotId: number): AnimeFarmActionResult
  plantSeed(plotId: number, cropId?: string): AnimeFarmActionResult
  waterPlot(plotId: number): AnimeFarmActionResult
  fertilizePlot(plotId: number, energyCost?: number, progressBoostRatio?: number): AnimeFarmActionResult
  fertilizeAll(energyCost?: number, progressBoostRatio?: number): AnimeFarmActionResult
  harvestPlot(plotId: number): AnimeFarmActionResult | null
  digPlot(plotId: number): AnimeFarmActionResult
  advanceWeather(): void
  tick(seconds?: number): void
  buySeeds(cropId: string, quantity?: number): AnimeFarmActionResult
  sellCrop(cropId: string, quantity?: number): AnimeFarmActionResult
  sellAllCrops(): { totalEarned: number; itemsSold: number }
  upgradeBarn(): AnimeFarmActionResult
  resetFarm(): void
  save(): void
  load(): { loaded: boolean; offlineSeconds?: number; maturedCount?: number }
}

export interface AnimeFarmOrderSystemInstance {
  orders: AnimeFarmOrder[]
  getUnlockedCrops(): AnimeFarmCropDef[]
  generateSingleOrder(id?: string): AnimeFarmOrder
  generateOrders(count?: number): void
  canCompleteOrder(order: AnimeFarmOrder): boolean
  getDeliverableCount(): number
  completeOrder(orderId: string): {
    success: boolean
    reason?: string
    rewardCoins?: number
    rewardExp?: number
  }
  discardOrder(orderId: string): boolean
  saveOrders(): void
  loadOrders(): void
}

export interface AnimeFarmApi {
  CROPS: Record<string, AnimeFarmCropDef>
  LEVELS: AnimeFarmLevelDef[]
  WEATHER_TYPES: Record<string, AnimeFarmWeatherDef>
  getLevelInfo(totalExp: number): AnimeFarmLevelInfo
  getRemainingRealSeconds(plot: AnimeFarmPlot | null): number
  GameState: new () => AnimeFarmGameStateInstance
  OrderSystem: new () => AnimeFarmOrderSystemInstance
  getPlantSvg(cropId: string, progress?: number): string
  state: AnimeFarmGameStateInstance
  orderSystem: AnimeFarmOrderSystemInstance
}

declare global {
  const __ANIME_FARM_API__: AnimeFarmApi | undefined
}

export {}
