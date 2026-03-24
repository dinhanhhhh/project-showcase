import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { PageEntry } from '@/types/page'
import { loadPagesRegistry } from '@/data/pages-loader'

const FAVORITES_KEY = 'vibe:favorites'
const RECENT_KEY = 'vibe:recently-viewed'
const RECENT_LIMIT = 8

function readLocalStorageList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

export const usePagesStore = defineStore('pages', () => {
  const pages = ref<PageEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const query = ref('')
  const category = ref('all')

  const favoriteSlugs = ref<string[]>(readLocalStorageList(FAVORITES_KEY))
  const recentlyViewedSlugs = ref<string[]>(readLocalStorageList(RECENT_KEY))

  const categories = computed(() => {
    const set = new Set(pages.value.map((page) => page.category))
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  })

  const filteredPages = computed(() => {
    const normalizedQuery = query.value.trim().toLowerCase()

    return pages.value.filter((page) => {
      const categoryMatch = category.value === 'all' || page.category === category.value
      const queryMatch =
        normalizedQuery.length === 0 ||
        page.name.toLowerCase().includes(normalizedQuery) ||
        page.description.toLowerCase().includes(normalizedQuery)

      return categoryMatch && queryMatch
    })
  })

  const favoritePages = computed(() => {
    const favorites = new Set(favoriteSlugs.value)
    return pages.value.filter((page) => favorites.has(page.slug))
  })

  const recentlyViewedPages = computed(() => {
    const map = new Map(pages.value.map((page) => [page.slug, page]))
    return recentlyViewedSlugs.value
      .map((slug) => map.get(slug))
      .filter((page): page is PageEntry => Boolean(page))
  })

  async function loadPages() {
    loading.value = true
    error.value = null

    try {
      pages.value = await loadPagesRegistry()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Không thể tải danh sách ứng dụng'
      pages.value = []
    } finally {
      loading.value = false
    }
  }

  function persistFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteSlugs.value))
  }

  function persistRecentlyViewed() {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewedSlugs.value))
  }

  function toggleFavorite(slug: string) {
    const set = new Set(favoriteSlugs.value)
    if (set.has(slug)) {
      set.delete(slug)
    } else {
      set.add(slug)
    }

    favoriteSlugs.value = Array.from(set)
    persistFavorites()
  }

  function isFavorite(slug: string) {
    return favoriteSlugs.value.includes(slug)
  }

  function trackRecentlyViewed(slug: string) {
    recentlyViewedSlugs.value = [slug, ...recentlyViewedSlugs.value.filter((entry) => entry !== slug)].slice(
      0,
      RECENT_LIMIT,
    )
    persistRecentlyViewed()
  }

  return {
    pages,
    loading,
    error,
    query,
    category,
    categories,
    filteredPages,
    favoritePages,
    favoriteSlugs,
    recentlyViewedPages,
    recentlyViewedSlugs,
    loadPages,
    toggleFavorite,
    isFavorite,
    trackRecentlyViewed,
  }
})
