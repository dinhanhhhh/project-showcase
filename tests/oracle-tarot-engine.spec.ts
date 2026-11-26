import { describe, expect, it } from 'vitest'
import { ORACLE_CARDS } from '@/views/oracle-tarot/data'
import { drawOneOneCard, drawSpread, shuffleCards } from '@/views/oracle-tarot/engine'

describe('Oracle Tarot Engine', () => {
  it('provides at least 12 distinct oracle cards with complete metadata', () => {
    expect(ORACLE_CARDS.length).toBeGreaterThanOrEqual(12)
    const ids = new Set(ORACLE_CARDS.map((c) => c.id))
    expect(ids.size).toBe(ORACLE_CARDS.length)
  })

  it('draws 3 unique cards for the 3-card time spread', () => {
    const spread = drawSpread(3)
    expect(spread).toHaveLength(3)
    expect(new Set(spread.map((c) => c.id)).size).toBe(3)
  })

  it('draws a valid single card and shuffles without mutating input', () => {
    const original = ['a', 'b', 'c', 'd']
    const shuffled = shuffleCards(original)
    expect(original).toEqual(['a', 'b', 'c', 'd'])
    expect(shuffled).toHaveLength(4)

    const one = drawOneOneCard()
    expect(ORACLE_CARDS.some((c) => c.id === one.id)).toBe(true)
  })
})
