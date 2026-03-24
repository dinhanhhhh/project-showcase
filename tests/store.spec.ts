import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePagesStore } from '@/stores/usePagesStore'

const pagesFixture = [
  {
    slug: 'mini-piano',
    path: '/mini-piano',
    name: 'Mini Piano',
    description: 'Play piano',
    category: 'creative',
  },
  {
    slug: 'color-game',
    path: '/color-game',
    name: 'Color Game',
    description: 'Guess colors',
    category: 'game',
  },
]

describe('usePagesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('loads pages and supports search + category filter', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => pagesFixture,
    } as Response)

    const store = usePagesStore()
    await store.loadPages()

    expect(store.pages).toHaveLength(2)

    store.query = 'mini'
    expect(store.filteredPages.map((page) => page.slug)).toEqual(['mini-piano'])

    store.query = ''
    store.category = 'game'
    expect(store.filteredPages.map((page) => page.slug)).toEqual(['color-game'])
  })

  it('persists favorites and keeps recently viewed deduplicated', () => {
    const store = usePagesStore()

    store.toggleFavorite('mini-piano')
    expect(store.isFavorite('mini-piano')).toBe(true)
    expect(JSON.parse(localStorage.getItem('vibe:favorites') || '[]')).toContain('mini-piano')

    store.trackRecentlyViewed('mini-piano')
    store.trackRecentlyViewed('color-game')
    store.trackRecentlyViewed('mini-piano')

    expect(store.recentlyViewedSlugs).toEqual(['mini-piano', 'color-game'])
    expect(JSON.parse(localStorage.getItem('vibe:recently-viewed') || '[]')).toEqual([
      'mini-piano',
      'color-game',
    ])
  })
})
