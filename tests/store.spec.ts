import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { usePagesStore } from '@/stores/usePagesStore'

describe('usePagesStore', () => {
  beforeEach(() => {
    const app = createApp({})
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    app.use(pinia)
    setActivePinia(pinia)
  })

  it('loads discovered pages dynamically and supports search + category filter', async () => {
    const store = usePagesStore()
    await store.loadPages()

    expect(store.pages.length).toBeGreaterThanOrEqual(10)

    store.query = 'piano'
    expect(store.filteredPages.map((page) => page.slug)).toEqual(['mini-piano'])

    store.query = ''
    store.category = 'education'
    expect(store.filteredPages.map((page) => page.slug)).toEqual(['oop-flashcards'])
  })

  it('persists favorites and keeps recently viewed deduplicated', async () => {
    const store = usePagesStore()

    store.toggleFavorite('mini-piano')
    expect(store.isFavorite('mini-piano')).toBe(true)

    store.trackRecentlyViewed('mini-piano')
    store.trackRecentlyViewed('color-game')
    store.trackRecentlyViewed('mini-piano')
    await nextTick()

    expect(store.recentlyViewedSlugs).toEqual(['mini-piano', 'color-game'])

    const raw = JSON.parse(localStorage.getItem('vibe:pages-store') || '{}') as {
      favoriteSlugs?: string[]
      recentlyViewedSlugs?: string[]
    }
    expect(raw.favoriteSlugs).toContain('mini-piano')
    expect(raw.recentlyViewedSlugs).toEqual(['mini-piano', 'color-game'])
  })
})
