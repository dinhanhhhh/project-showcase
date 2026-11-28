import type {
  FoodFilter,
  FoodItem,
  FoodValidationResult,
  MealTimeFilter,
  PriceTierFilter,
} from './types'

export interface FoodAdvancedFilterOptions {
  category: FoodFilter
  mealTime: MealTimeFilter
  priceTier: PriceTierFilter
  favoriteIds: readonly string[]
  searchQuery?: string
}

function normalizeSearchText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

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

export function filterFoodsAdvanced(
  foods: readonly FoodItem[],
  options: FoodAdvancedFilterOptions,
): FoodItem[] {
  let pool = filterFoods(foods, options.category, options.favoriteIds)

  if (options.mealTime !== 'all') {
    pool = pool.filter((item) => {
      if (item.mealTimes && item.mealTimes.length > 0) {
        return item.mealTimes.includes(options.mealTime as Exclude<MealTimeFilter, 'all'>)
      }
      if (item.isCustom) return true
      return options.mealTime === 'an-vat' && item.category === 'an-vat'
    })
  }

  if (options.priceTier !== 'all') {
    pool = pool.filter((item) => {
      if (item.priceTier) return item.priceTier === options.priceTier
      return Boolean(item.isCustom)
    })
  }

  if (options.searchQuery && options.searchQuery.trim().length > 0) {
    const q = normalizeSearchText(options.searchQuery)
    pool = pool.filter((item) => normalizeSearchText(item.name).includes(q))
  }

  return pool
}

export function getSpinDelays(totalSteps = 14): number[] {
  if (totalSteps <= 0) return []
  if (totalSteps === 1) return [80]
  const delays: number[] = []
  for (let i = 0; i < totalSteps; i++) {
    const progress = i / (totalSteps - 1)
    delays.push(Math.round(45 + Math.pow(progress, 2) * 195))
  }
  return delays
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

export interface DailyMealPlan {
  sang: FoodItem | null
  trua: FoodItem | null
  toi: FoodItem | null
  anVat: FoodItem | null
}

/**
 * Gợi ý trọn bộ thực đơn 4 bữa trong ngày (Sáng · Trưa · Tối · Ăn vặt),
 * ưu tiên không trùng món giữa các bữa nếu danh sách đủ phong phú.
 */
export function generateDailyMealPlan(
  foods: readonly FoodItem[],
  rng: () => number = Math.random,
): DailyMealPlan {
  const usedIds = new Set<string>()
  const pickFor = (mealTime: Exclude<MealTimeFilter, 'all'>): FoodItem | null => {
    const candidates = filterFoodsAdvanced(foods, {
      category: 'all',
      mealTime,
      priceTier: 'all',
      favoriteIds: [],
    })
    if (candidates.length === 0) return null
    const fresh = candidates.filter((item) => !usedIds.has(item.id))
    const pool = fresh.length > 0 ? fresh : candidates
    const chosen = pickRandomFood(pool, null, rng)
    if (chosen) usedIds.add(chosen.id)
    return chosen
  }

  return {
    sang: pickFor('sang'),
    trua: pickFor('trua'),
    toi: pickFor('toi'),
    anVat: pickFor('an-vat'),
  }
}

export function formatDailyMealPlanText(plan: DailyMealPlan): string {
  const slots: Array<{ label: string; food: FoodItem | null }> = [
    { label: '🌅 Sáng', food: plan.sang },
    { label: '☀️ Trưa', food: plan.trua },
    { label: '🌙 Tối', food: plan.toi },
    { label: '🧋 Ăn vặt', food: plan.anVat },
  ]
  const filled = slots.filter((slot) => slot.food !== null)
  if (filled.length === 0) return ''

  const lines = slots.map((slot) => {
    const food = slot.food
    if (!food) return `- ${slot.label}: (Chưa chọn)`
    const price = food.priceLabel ? ` (${food.priceLabel})` : ''
    return `- ${slot.label}: ${food.emoji} ${food.name}${price}`
  })

  return ['🍽️ Thực đơn Hôm Nay Ăn Gì:', ...lines].join('\n')
}
