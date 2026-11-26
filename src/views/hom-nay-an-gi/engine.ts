import type { FoodFilter, FoodItem, FoodValidationResult } from './types'

export function filterFoods(
  foods: readonly FoodItem[],
  filter: FoodFilter,
  favoriteIds: readonly string[],
): FoodItem[] {
  if (filter === 'all') return [...foods]
  if (filter === 'favorite') {
    const favSet = new Set(favoriteIds)
    return foods.filter((f) => favSet.has(f.id))
  }
  if (filter === 'custom') {
    return foods.filter((f) => f.isCustom || f.category === 'custom')
  }
  return foods.filter((f) => f.category === filter)
}

export function pickRandomFood(
  foods: readonly FoodItem[],
  excludeId?: string,
  rng: () => number = Math.random,
): FoodItem | null {
  if (foods.length === 0) return null
  if (foods.length === 1) return foods[0]

  const candidates = excludeId ? foods.filter((item) => item.id !== excludeId) : foods
  const pool = candidates.length > 0 ? candidates : foods
  const index = Math.floor(rng() * pool.length)
  return pool[index] ?? null
}

export function isSafeHttpUrl(url: string): boolean {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateFoodInput(
  rawName: string,
  rawImage: string,
  existingFoods: readonly FoodItem[],
): FoodValidationResult {
  const sanitizedName = rawName.trim()
  const sanitizedImage = rawImage.trim()

  if (sanitizedName.length < 2) {
    return {
      valid: false,
      error: 'Tên món ăn cần ít nhất 2 ký tự.',
      sanitizedName,
      sanitizedImage,
    }
  }

  if (sanitizedName.length > 60) {
    return {
      valid: false,
      error: 'Tên món ăn tối đa 60 ký tự.',
      sanitizedName,
      sanitizedImage,
    }
  }

  const normalized = sanitizedName.toLowerCase()
  const duplicated = existingFoods.some((item) => item.name.trim().toLowerCase() === normalized)
  if (duplicated) {
    return {
      valid: false,
      error: 'Món này đã có trong thực đơn rồi.',
      sanitizedName,
      sanitizedImage,
    }
  }

  if (sanitizedImage && !isSafeHttpUrl(sanitizedImage)) {
    return {
      valid: false,
      error: 'URL ảnh phải bắt đầu bằng http:// hoặc https://.',
      sanitizedName,
      sanitizedImage,
    }
  }

  return {
    valid: true,
    sanitizedName,
    sanitizedImage,
  }
}
