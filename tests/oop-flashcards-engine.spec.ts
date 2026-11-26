import { describe, expect, it } from 'vitest'
import { OOP_FLASHCARDS } from '@/views/oop-flashcards/data'
import {
  buildDeck,
  getAccuracyPercent,
  getCompletionTitle,
  tokenizeJavaCode,
} from '@/views/oop-flashcards/engine'

describe('OOP Flashcards Engine', () => {
  it('filters deck by topic and review ids', () => {
    const solidDeck = buildDeck(OOP_FLASHCARDS, 7, [], false)
    expect(solidDeck.length).toBeGreaterThan(0)
    expect(solidDeck.every((c) => c.topicId === 7)).toBe(true)

    const reviewDeck = buildDeck(OOP_FLASHCARDS, 'review', ['1.1', '7.5'], false)
    expect(reviewDeck.map((c) => c.id)).toEqual(['1.1', '7.5'])
  })

  it('shuffles deterministically when provided a seeded rng', () => {
    const deck = buildDeck(OOP_FLASHCARDS, 1, [], true, () => 0)
    expect(deck).toHaveLength(3)
    expect(deck.map((c) => c.id)).not.toEqual(['1.1', '1.2', '1.3'])
  })

  it('tokenizes Java snippets cleanly into keyword, string, comment, and func tokens', () => {
    const tokens = tokenizeJavaCode('public void greet() { // hi\n String s = "ok"; }')
    expect(tokens.some((t) => t.kind === 'keyword' && t.text === 'public')).toBe(true)
    expect(tokens.some((t) => t.kind === 'func' && t.text === 'greet')).toBe(true)
    expect(tokens.some((t) => t.kind === 'comment' && t.text === '// hi')).toBe(true)
    expect(tokens.some((t) => t.kind === 'string' && t.text === '"ok"')).toBe(true)
  })

  it('calculates accuracy and completion titles', () => {
    expect(getAccuracyPercent(0, 0)).toBe(0)
    expect(getAccuracyPercent(10, 10)).toBe(100)
    expect(getCompletionTitle(10, 10)).toContain('100%')
    expect(getCompletionTitle(7, 10)).toContain('tốt')
    expect(getCompletionTitle(3, 10)).toContain('Cố lên')
  })
})
