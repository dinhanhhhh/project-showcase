import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useHomNayAnGiStore } from '@/stores/homNayAnGi'
import { SAMPLE_FOODS } from '@/views/hom-nay-an-gi/data'
import {
  filterFoods,
  filterFoodsAdvanced,
  formatDailyMealPlanText,
  generateDailyMealPlan,
  getSpinDelays,
  isSafeHttpUrl,
  pickRandomFood,
  validateFoodInput,
} from '@/views/hom-nay-an-gi/engine'

describe('Hom Nay An Gi Engine & Store', () => {
  beforeEach(() => {
    localStorage.clear()
    const app = createApp({})
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    app.use(pinia)
    setActivePinia(pinia)
  })

  it('filters foods by category, favorites, mealTime, and priceTier', () => {
    const soups = filterFoods(SAMPLE_FOODS, 'nuoc', [])
    expect(soups.length).toBeGreaterThan(0)
    expect(soups.every((f) => f.category === 'nuoc')).toBe(true)

    const favs = filterFoods(SAMPLE_FOODS, 'favorite', ['1', '5'])
    expect(favs.map((f) => f.id)).toEqual(['1', '5'])

    const morningBudget = filterFoodsAdvanced(SAMPLE_FOODS, {
      category: 'all',
      mealTime: 'sang',
      priceTier: 'tiet-kiem',
      favoriteIds: [],
    })
    expect(morningBudget.length).toBeGreaterThan(0)
    expect(
      morningBudget.every(
        (f) => f.mealTimes?.includes('sang') && f.priceTier === 'tiet-kiem',
      ),
    ).toBe(true)
  })

  it('produces monotonically increasing spin delays for smooth roulette deceleration', () => {
    const delays = getSpinDelays(14)
    expect(delays).toHaveLength(14)
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1])
    }
    expect(delays[delays.length - 1]).toBeGreaterThan(delays[0])
  })

  it('avoids repeating the immediately previous dish when pool has multiple items', () => {
    const twoItems = SAMPLE_FOODS.slice(0, 2)
    const picked = pickRandomFood(twoItems, twoItems[0].id, () => 0)
    expect(picked?.id).toBe(twoItems[1].id)
  })

  it('rejects duplicate names and unsafe image URLs', () => {
    expect(isSafeHttpUrl('https://example.com/pho.jpg')).toBe(true)
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)

    const dup = validateFoodInput('phở bò', '', SAMPLE_FOODS)
    expect(dup.valid).toBe(false)

    const badUrl = validateFoodInput('Mì Quảng', 'javascript:alert(1)', SAMPLE_FOODS)
    expect(badUrl.valid).toBe(false)

    const ok = validateFoodInput('  Mì Quảng  ', 'https://example.com/mi.jpg', SAMPLE_FOODS)
    expect(ok.valid).toBe(true)
    expect(ok.sanitizedName).toBe('Mì Quảng')
  })

  it('persists food pick history capped at 10 entries and mute preference', async () => {
    const store = useHomNayAnGiStore()
    expect(store.isMuted).toBe(false)
    store.toggleMute()
    for (let i = 0; i < 12; i++) {
      store.recordPick(SAMPLE_FOODS[i % SAMPLE_FOODS.length])
    }
    await nextTick()

    expect(store.isMuted).toBe(true)
    expect(store.history).toHaveLength(10)
    const persisted = JSON.parse(localStorage.getItem('vibe_hom_nay_an_gi') || '{}') as {
      isMuted?: boolean
      history?: unknown[]
    }
    expect(persisted.isMuted).toBe(true)
    expect(persisted.history).toHaveLength(10)
  })

  it('handles empty pools, invalid food names, and combined favorites + price filters', () => {
    expect(pickRandomFood([], null)).toBeNull()
    expect(getSpinDelays(0)).toEqual([])

    const emptyName = validateFoodInput('   ', '', SAMPLE_FOODS)
    expect(emptyName.valid).toBe(false)

    const snackPicks = filterFoodsAdvanced(SAMPLE_FOODS, {
      category: 'all',
      mealTime: 'an-vat',
      priceTier: 'tiet-kiem',
      favoriteIds: [],
    })
    expect(snackPicks.length).toBeGreaterThan(0)
    expect(snackPicks.every((f) => f.mealTimes?.includes('an-vat'))).toBe(true)

    const favFiltered = filterFoodsAdvanced(SAMPLE_FOODS, {
      category: 'favorite',
      mealTime: 'all',
      priceTier: 'all',
      favoriteIds: [SAMPLE_FOODS[0].id],
    })
    expect(favFiltered.map((f) => f.id)).toEqual([SAMPLE_FOODS[0].id])
  })

  it('persists custom foods, favorite toggles, and clears history cleanly', async () => {
    const store = useHomNayAnGiStore()
    store.toggleFavorite('1')
    expect(store.favoriteIds).toContain('1')

    const custom = {
      id: 'custom-bun-cha',
      name: 'Bún Chả Hà Nội',
      emoji: '🥢',
      category: 'kho' as const,
      description: 'Món tự thêm',
    }
    store.addCustomFood(custom)
    store.recordPick(custom)
    await nextTick()
    expect(store.customFoods).toHaveLength(1)
    expect(store.history).toHaveLength(1)

    store.removeCustomFood(custom.id)
    store.clearHistory()
    await nextTick()
    expect(store.customFoods).toHaveLength(0)
    expect(store.history).toHaveLength(0)
  })

  it('builds a 4-meal daily plan avoiding duplicates when pool allows and handles empty lists', () => {
    const plan = generateDailyMealPlan(SAMPLE_FOODS, () => 0.2)
    expect(plan.sang).not.toBeNull()
    expect(plan.trua).not.toBeNull()
    expect(plan.toi).not.toBeNull()
    expect(plan.anVat).not.toBeNull()

    const ids = new Set([plan.sang!.id, plan.trua!.id, plan.toi!.id, plan.anVat!.id])
    expect(ids.size).toBe(4)

    const emptyPlan = generateDailyMealPlan([])
    expect(emptyPlan).toEqual({
      sang: null,
      trua: null,
      toi: null,
      anVat: null,
    })
  })

  it('falls back cleanly when a single meal pool has limited dishes', () => {
    const oneMorningDish = [SAMPLE_FOODS[0]]
    const plan = generateDailyMealPlan(oneMorningDish, () => 0)
    expect(plan.sang?.id).toBe(oneMorningDish[0].id)
  })

  it('filters dishes by Vietnamese accented or unaccented searchQuery and formats 4-meal plan text', () => {
    const byAccented = filterFoodsAdvanced(SAMPLE_FOODS, {
      category: 'all',
      mealTime: 'all',
      priceTier: 'all',
      favoriteIds: [],
      searchQuery: 'Phở',
    })
    expect(byAccented.length).toBeGreaterThan(0)
    expect(byAccented.every((item) => item.name.toLowerCase().includes('phở'))).toBe(true)

    const byAscii = filterFoodsAdvanced(SAMPLE_FOODS, {
      category: 'all',
      mealTime: 'all',
      priceTier: 'all',
      favoriteIds: [],
      searchQuery: 'pho',
    })
    expect(byAscii.map((item) => item.id)).toEqual(byAccented.map((item) => item.id))

    const fullPlan = generateDailyMealPlan(SAMPLE_FOODS, () => 0)
    const formatted = formatDailyMealPlanText(fullPlan)
    expect(formatted).toContain('🍽️ Thực đơn Hôm Nay Ăn Gì:')
    expect(formatted).toContain(fullPlan.sang!.name)
    expect(formatted).toContain(fullPlan.toi!.name)

    expect(
      formatDailyMealPlanText({ sang: null, trua: null, toi: null, anVat: null }),
    ).toBe('')
  })

  it('blocks data/file/vbscript image URLs and supports unaccented bun cha & banh mi lookup', () => {
    for (const unsafeUrl of [
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'vbscript:msgbox(1)',
    ]) {
      expect(isSafeHttpUrl(unsafeUrl)).toBe(false)
      expect(validateFoodInput('Món An Toàn', unsafeUrl, SAMPLE_FOODS).valid).toBe(false)
    }

    const bunCha = filterFoodsAdvanced(SAMPLE_FOODS, {
      category: 'all',
      mealTime: 'all',
      priceTier: 'all',
      favoriteIds: [],
      searchQuery: 'bun cha',
    })
    expect(bunCha.some((item) => item.name === 'Bún chả')).toBe(true)

    const banhMi = filterFoodsAdvanced(SAMPLE_FOODS, {
      category: 'all',
      mealTime: 'all',
      priceTier: 'all',
      favoriteIds: [],
      searchQuery: 'banh mi',
    })
    expect(banhMi.some((item) => item.name.toLowerCase().includes('bánh mì'))).toBe(true)
  })
})
