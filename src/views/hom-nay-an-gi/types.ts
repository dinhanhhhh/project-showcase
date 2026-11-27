export type FoodCategory = 'nuoc' | 'kho' | 'an-vat' | 'custom'
export type FoodFilter = 'all' | 'favorite' | FoodCategory

export type MealTime = 'sang' | 'trua' | 'toi' | 'an-vat'
export type MealTimeFilter = 'all' | MealTime

export type PriceTier = 'tiet-kiem' | 'vua-tui' | 'sang-chanh'
export type PriceTierFilter = 'all' | PriceTier

export interface FoodItem {
  id: string
  name: string
  image: string
  emoji: string
  category: FoodCategory
  mealTimes?: MealTime[]
  priceTier?: PriceTier
  priceLabel?: string
  isCustom?: boolean
}

export interface PickHistoryEntry {
  foodId: string
  foodName: string
  emoji: string
  pickedAt: string
}

export interface FoodValidationResult {
  valid: boolean
  error?: string
  sanitizedName: string
  sanitizedImage: string
}
