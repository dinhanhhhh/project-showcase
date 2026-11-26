import { describe, expect, it } from 'vitest'
import { SAMPLE_FOODS } from '@/views/hom-nay-an-gi/data'
import {
  filterFoods,
  isSafeHttpUrl,
  pickRandomFood,
  validateFoodInput,
} from '@/views/hom-nay-an-gi/engine'

describe('Hom Nay An Gi Engine', () => {
  it('filters foods by category and favorites', () => {
    const soups = filterFoods(SAMPLE_FOODS, 'nuoc', [])
    expect(soups.length).toBeGreaterThan(0)
    expect(soups.every((f) => f.category === 'nuoc')).toBe(true)

    const favs = filterFoods(SAMPLE_FOODS, 'favorite', ['1', '5'])
    expect(favs.map((f) => f.id)).toEqual(['1', '5'])
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
})
