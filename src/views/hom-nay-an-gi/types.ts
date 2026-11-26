export type FoodCategory = 'nuoc' | 'kho' | 'an-vat' | 'custom'
export type FoodFilter = 'all' | 'favorite' | FoodCategory

export interface FoodItem {
  id: string
  name: string
  image: string
  emoji: string
  category: FoodCategory
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
