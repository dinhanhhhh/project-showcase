import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PageMetaSchema } from '@/types/page'
import { BOARD_FILES, BOARD_RANKS, XIANGQI_PUZZLES } from '@/views/co-tuong/constants'
import { SAMPLE_FOODS } from '@/views/hom-nay-an-gi/data'
import { getKeysForOctave, SONG_PRESETS } from '@/views/mini-piano/engine'
import { WORD_PACK_LIST } from '@/views/neon-typing/engine'
import { OOP_FLASHCARDS, OOP_TOPICS } from '@/views/oop-flashcards/data'
import { ORACLE_CARDS } from '@/views/oracle-tarot/data'

describe('Platform Static Datasets Integrity', () => {
  it('validates public/data/pages.json entries against PageMetaSchema with unique slugs and paths', () => {
    const raw = readFileSync(resolve(process.cwd(), 'public/data/pages.json'), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    expect(Array.isArray(parsed)).toBe(true)

    const entries = parsed as Array<Record<string, unknown>>
    expect(entries.length).toBeGreaterThanOrEqual(10)

    const slugs = new Set<string>()
    for (const entry of entries) {
      const metaCheck = PageMetaSchema.safeParse(entry)
      expect(metaCheck.success).toBe(true)
      expect(typeof entry.slug).toBe('string')
      expect(entry.path).toBe(`/${String(entry.slug)}`)
      expect(slugs.has(String(entry.slug))).toBe(false)
      slugs.add(String(entry.slug))
    }
  })

  it('validates hom-nay-an-gi SAMPLE_FOODS unique IDs, categories, meal times, and price tiers', () => {
    const validCategories = new Set(['nuoc', 'kho', 'an-vat'])
    const validMeals = new Set(['sang', 'trua', 'toi', 'an-vat'])
    const validTiers = new Set(['tiet-kiem', 'vua-tui', 'sang-chanh'])
    const ids = new Set<string>()

    expect(SAMPLE_FOODS.length).toBeGreaterThanOrEqual(10)
    for (const food of SAMPLE_FOODS) {
      expect(food.id.trim().length).toBeGreaterThan(0)
      expect(ids.has(food.id)).toBe(false)
      ids.add(food.id)
      expect(food.name.trim().length).toBeGreaterThan(0)
      expect(food.emoji.trim().length).toBeGreaterThan(0)
      expect(validCategories.has(food.category)).toBe(true)
      expect((food.mealTimes ?? []).length).toBeGreaterThan(0)
      for (const meal of food.mealTimes ?? []) {
        expect(validMeals.has(meal)).toBe(true)
      }
      if (food.priceTier) {
        expect(validTiers.has(food.priceTier)).toBe(true)
      }
    }
  })

  it('validates oop-flashcards 32 cards, topics linkage, and valid difficulty levels', () => {
    expect(OOP_FLASHCARDS).toHaveLength(32)
    const topicIds = new Set(OOP_TOPICS.map((t) => t.id))
    const cardIds = new Set<string>()
    const validDiff = new Set(['Cơ bản', 'Trung bình', 'Nâng cao'])

    for (const card of OOP_FLASHCARDS) {
      expect(cardIds.has(card.id)).toBe(false)
      cardIds.add(card.id)
      expect(topicIds.has(card.topicId)).toBe(true)
      expect(validDiff.has(card.difficulty)).toBe(true)
      expect(card.question.trim().length).toBeGreaterThan(0)
      expect(card.answerTitle.trim().length).toBeGreaterThan(0)
      expect(card.answerPoints.length).toBeGreaterThan(0)
    }
  })

  it('validates oracle-tarot 22 Major Arcana cards (0–XXI) have unique IDs and non-empty guidance', () => {
    expect(ORACLE_CARDS).toHaveLength(22)
    const ids = new Set<string>()
    const romans = new Set<string>()

    for (const card of ORACLE_CARDS) {
      expect(ids.has(card.id)).toBe(false)
      expect(romans.has(card.roman)).toBe(false)
      ids.add(card.id)
      romans.add(card.roman)
      expect(card.name.trim().length).toBeGreaterThan(0)
      expect(card.keyword.trim().length).toBeGreaterThan(0)
      expect(card.message.trim().length).toBeGreaterThan(0)
      expect(card.advice.trim().length).toBeGreaterThan(0)
    }
  })

  it('validates co-tuong 10 puzzles have valid bounds, non-overlapping pieces, and both generals in palace', () => {
    expect(XIANGQI_PUZZLES).toHaveLength(10)
    const puzzleIds = new Set<string>()

    for (const puzzle of XIANGQI_PUZZLES) {
      expect(puzzleIds.has(puzzle.id)).toBe(false)
      puzzleIds.add(puzzle.id)
      expect(puzzle.title.trim().length).toBeGreaterThan(0)

      const squares = new Set<string>()
      const pieceIds = new Set<string>()
      let redGen: { file: number; rank: number } | null = null
      let blackGen: { file: number; rank: number } | null = null

      for (const piece of puzzle.boardState.pieces) {
        expect(pieceIds.has(piece.id)).toBe(false)
        pieceIds.add(piece.id)
        expect(piece.position.file).toBeGreaterThanOrEqual(0)
        expect(piece.position.file).toBeLessThan(BOARD_FILES)
        expect(piece.position.rank).toBeGreaterThanOrEqual(0)
        expect(piece.position.rank).toBeLessThan(BOARD_RANKS)

        const sq = `${piece.position.file},${piece.position.rank}`
        expect(squares.has(sq)).toBe(false)
        squares.add(sq)

        if (piece.type === 'general' && piece.side === 'red') redGen = piece.position
        if (piece.type === 'general' && piece.side === 'black') blackGen = piece.position
      }

      expect(redGen).not.toBeNull()
      expect(blackGen).not.toBeNull()
      expect(redGen!.file).toBeGreaterThanOrEqual(3)
      expect(redGen!.file).toBeLessThanOrEqual(5)
      expect(redGen!.rank).toBeGreaterThanOrEqual(7)
      expect(redGen!.rank).toBeLessThanOrEqual(9)
      expect(blackGen!.file).toBeGreaterThanOrEqual(3)
      expect(blackGen!.file).toBeLessThanOrEqual(5)
      expect(blackGen!.rank).toBeGreaterThanOrEqual(0)
      expect(blackGen!.rank).toBeLessThanOrEqual(2)
    }
  })

  it('validates mini-piano 8 song presets use valid keyboard pitches and neon-typing 5 packs have trimmed words', () => {
    expect(SONG_PRESETS).toHaveLength(8)
    const validPitches = new Set(getKeysForOctave(4).allKeys.map((k) => k.pitchClass))
    const songIds = new Set<string>()

    for (const song of SONG_PRESETS) {
      expect(songIds.has(song.id)).toBe(false)
      songIds.add(song.id)
      expect(song.notes.length).toBeGreaterThanOrEqual(8)
      for (const pitch of song.notes) {
        expect(validPitches.has(pitch)).toBe(true)
      }
    }

    expect(WORD_PACK_LIST).toHaveLength(5)
    const packIds = new Set<string>()
    for (const pack of WORD_PACK_LIST) {
      expect(packIds.has(pack.id)).toBe(false)
      packIds.add(pack.id)
      expect(pack.words.length).toBeGreaterThanOrEqual(30)
      for (const word of pack.words) {
        expect(word.trim()).toBe(word)
        expect(word.length).toBeGreaterThan(0)
      }
    }
  })
})
