import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useOopFlashcardsStore } from '@/stores/oopFlashcards'
import { OOP_FLASHCARDS } from '@/views/oop-flashcards/data'
import {
  buildDeck,
  computeGroupProgress,
  generateQuizQuestions,
  getAccuracyPercent,
  getCompletionTitle,
  tokenizeJavaCode,
} from '@/views/oop-flashcards/engine'

describe('OOP Flashcards Engine & Store', () => {
  beforeEach(() => {
    localStorage.clear()
    const app = createApp({})
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    app.use(pinia)
    setActivePinia(pinia)
  })

  it('filters deck by topic, review ids, and unmastered cards', () => {
    const solidDeck = buildDeck(OOP_FLASHCARDS, 7, [], false)
    expect(solidDeck.length).toBeGreaterThan(0)
    expect(solidDeck.every((c) => c.topicId === 7)).toBe(true)

    const reviewDeck = buildDeck(OOP_FLASHCARDS, 'review', ['1.1', '7.5'], false)
    expect(reviewDeck.map((c) => c.id)).toEqual(['1.1', '7.5'])

    const mastered = ['1.1', '1.2']
    const unmastered = buildDeck(OOP_FLASHCARDS, 'unmastered', [], false, Math.random, mastered)
    expect(unmastered).toHaveLength(OOP_FLASHCARDS.length - 2)
    expect(unmastered.some((c) => c.id === '1.1')).toBe(false)
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

  it('computes group mastery progress across OOP Core, Pillars, and SOLID/Patterns', () => {
    const coreIds = OOP_FLASHCARDS.filter((c) => c.topicId === 1 || c.topicId === 2).map(
      (c) => c.id,
    )
    const groups = computeGroupProgress(OOP_FLASHCARDS, coreIds)
    expect(groups).toHaveLength(3)
    expect(groups[0].id).toBe('oop-core')
    expect(groups[0].percent).toBe(100)
    expect(groups[1].mastered).toBe(0)
    expect(groups[2].id).toBe('solid-patterns')
  })

  it('generates 4-option quiz questions with exactly 1 correct answer and records best quiz score', async () => {
    const questions = generateQuizQuestions(OOP_FLASHCARDS, OOP_FLASHCARDS, 5, () => 0.42)
    expect(questions).toHaveLength(5)
    for (const q of questions) {
      expect(q.options).toHaveLength(4)
      expect(q.options.filter((opt) => opt.isCorrect)).toHaveLength(1)
    }

    const store = useOopFlashcardsStore()
    store.recordQuizResult(6, 8)
    store.recordQuizResult(4, 8)
    await nextTick()
    expect(store.quizzesCompleted).toBe(2)
    expect(store.bestQuizPercent).toBe(75)
  })

  it('handles small quiz pools, empty pools, and empty code tokenization safely', () => {
    expect(tokenizeJavaCode('')).toEqual([])

    const emptyQuiz = generateQuizQuestions([], OOP_FLASHCARDS, 4)
    expect(emptyQuiz).toEqual([])

    const tinyPool = OOP_FLASHCARDS.slice(0, 2)
    const tinyQuiz = generateQuizQuestions(tinyPool, tinyPool, 5, () => 0.25)
    expect(tinyQuiz).toHaveLength(2)
    for (const q of tinyQuiz) {
      expect(q.options.filter((opt) => opt.isCorrect)).toHaveLength(1)
    }
  })

  it('toggles mastered/review flags and resets store progress cleanly', async () => {
    const store = useOopFlashcardsStore()
    store.markCardResult('1.1', true)
    store.markCardResult('2.1', false)
    await nextTick()
    expect(store.masteredIds).toContain('1.1')
    expect(store.reviewIds).toContain('2.1')

    // Moving mastered card back to review removes it from masteredIds cleanly
    store.markCardResult('1.1', false)
    expect(store.masteredIds).not.toContain('1.1')
    expect(store.reviewIds).toContain('1.1')

    store.markCardResult('1.2', true)
    store.recordQuizResult(5, 5)
    store.resetProgress()
    await nextTick()

    expect(store.masteredIds).toEqual([])
    expect(store.reviewIds).toEqual([])
    expect(store.quizzesCompleted).toBe(0)
    expect(store.bestQuizPercent).toBe(0)
  })

  it('includes 32 unique cards covering OOP, SOLID, Design Patterns, and Concurrency/Architecture plus difficulty filter', () => {
    expect(OOP_FLASHCARDS).toHaveLength(32)
    const uniqueIds = new Set(OOP_FLASHCARDS.map((card) => card.id))
    expect(uniqueIds.size).toBe(32)

    for (const id of ['7.6', '7.7', '7.8', '7.9', '7.10', '7.11', '7.12', '7.13', '7.14', '7.15', '7.16']) {
      expect(uniqueIds.has(id)).toBe(true)
    }

    const solidGroup = computeGroupProgress(OOP_FLASHCARDS, ['7.6', '7.7', '7.8']).find(
      (g) => g.id === 'solid-patterns',
    )
    expect(solidGroup).toBeDefined()
    expect(solidGroup!.total).toBe(16)
    expect(solidGroup!.mastered).toBe(3)

    const advancedDeck = buildDeck(OOP_FLASHCARDS, 'all', [], false, Math.random, [], 'Nâng cao')
    expect(advancedDeck.length).toBeGreaterThan(0)
    expect(advancedDeck.every((card) => card.difficulty === 'Nâng cao')).toBe(true)
  })

  it('treats HTML-like snippets as plain safe tokens and builds 1-option quiz for single-card pool', () => {
    const tokens = tokenizeJavaCode('<script>alert(1)</script>')
    expect(tokens.map((t) => t.text).join('')).toBe('<script>alert(1)</script>')
    expect(tokens.some((t) => t.kind === 'plain')).toBe(true)

    const singleQuiz = generateQuizQuestions([OOP_FLASHCARDS[0]], [OOP_FLASHCARDS[0]], 4)
    expect(singleQuiz).toHaveLength(1)
    expect(singleQuiz[0].options).toHaveLength(1)
    expect(singleQuiz[0].options[0].isCorrect).toBe(true)
  })
})
