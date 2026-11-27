import { beforeEach, describe, expect, it } from 'vitest'
import type { PageEntry } from '@/types/page'
import {
  buildBackupPayload,
  isAllowedBackupKey,
  parseAndValidateBackup,
  restoreBackupPayload,
} from '@/utils/backup'
import { pickSurprisePage } from '@/utils/launcher'

const SAMPLE_PAGES: PageEntry[] = [
  { slug: 'ngare', path: '/ngare', name: 'Ngã Rẽ Cuộc Đời', description: 'RPG', category: 'game' },
  { slug: 'co-tuong', path: '/co-tuong', name: 'Cờ Tướng', description: 'Xiangqi', category: 'game' },
  { slug: 'mini-piano', path: '/mini-piano', name: 'Mini Piano', description: 'Synth', category: 'creative' },
]

describe('Launcher & Backup Utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('pickSurprisePage handles empty, single, and avoids repeating the last visited app', () => {
    expect(pickSurprisePage([], 'ngare')).toBeNull()
    expect(pickSurprisePage([SAMPLE_PAGES[0]], 'ngare')?.slug).toBe('ngare')

    const picked = pickSurprisePage(SAMPLE_PAGES, 'ngare', () => 0)
    expect(picked?.slug).toBe('co-tuong')
  })

  it('isAllowedBackupKey and buildBackupPayload whitelist only Vibe Platform keys', () => {
    expect(isAllowedBackupKey('vibe:theme')).toBe(true)
    expect(isAllowedBackupKey('vibe_co_tuong')).toBe(true)
    expect(isAllowedBackupKey('ngare_game_state')).toBe(true)
    expect(isAllowedBackupKey('saigon_tycoon_save')).toBe(true)
    expect(isAllowedBackupKey('anime_farm_save')).toBe(true)
    expect(isAllowedBackupKey('third_party_secret')).toBe(false)

    localStorage.setItem('vibe:theme', 'arctic')
    localStorage.setItem('vibe_color_game', '{"bestStreak":5}')
    localStorage.setItem('unrelated_token', 'do-not-export')

    const payload = buildBackupPayload(localStorage)
    expect(payload.version).toBe(1)
    expect(Object.keys(payload.entries).sort()).toEqual(['vibe:theme', 'vibe_color_game'])
  })

  it('parseAndValidateBackup rejects malformed JSON or wrong schema versions', () => {
    expect(parseAndValidateBackup('{not-json').ok).toBe(false)
    expect(
      parseAndValidateBackup(JSON.stringify({ version: 99, exportedAt: 'now', entries: {} })).ok,
    ).toBe(false)
    expect(
      parseAndValidateBackup(
        JSON.stringify({ version: 1, exportedAt: 'now', entries: { 'vibe:theme': 123 } }),
      ).ok,
    ).toBe(false)
  })

  it('parseAndValidateBackup strips unknown keys and restoreBackupPayload writes back valid keys', () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAt: '2026-11-27T02:00:00.000Z',
      entries: {
        'vibe:theme': 'emerald',
        'vibe_mini_piano': '{"octave":5}',
        evil_injection: 'nope',
      },
    })

    const validated = parseAndValidateBackup(raw)
    expect(validated.ok).toBe(true)
    if (!validated.ok) return

    expect(Object.keys(validated.data.entries).sort()).toEqual(['vibe:theme', 'vibe_mini_piano'])
    const count = restoreBackupPayload(localStorage, validated.data)
    expect(count).toBe(2)
    expect(localStorage.getItem('vibe:theme')).toBe('emerald')
    expect(localStorage.getItem('evil_injection')).toBeNull()
  })
})
