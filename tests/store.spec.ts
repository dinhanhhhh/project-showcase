import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, ref, toRef } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { mount } from '@vue/test-utils'
import { useParticlesBackground } from '@/composables/useParticlesBackground'
import { loadPagesRegistry } from '@/data/pages-loader'
import { usePagesStore } from '@/stores/usePagesStore'

const ParticlesTestHost = defineComponent({
  props: {
    enabled: { type: Boolean, default: false },
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const { init } = useParticlesBackground(canvasRef, toRef(props, 'enabled'))
    return { canvasRef, init }
  },
  template: '<canvas ref="canvasRef" />',
})

describe('usePagesStore', () => {
  beforeEach(() => {
    const app = createApp(ParticlesTestHost)
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

  it('loadPagesRegistry discovers >= 10 valid non-home mini-apps sorted alphabetically', async () => {
    const pages = await loadPagesRegistry()
    expect(pages.length).toBeGreaterThanOrEqual(10)
    expect(pages.some((p) => p.slug === 'home')).toBe(false)
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i - 1].name.localeCompare(pages[i].name)).toBeLessThanOrEqual(0)
    }
  })

  it('useParticlesBackground respects prefers-reduced-motion, clears canvas on disable, and cleans resize/rAF on unmount', async () => {
    const clearRectMock = vi.fn()
    const fakeCtx = {
      clearRect: clearRectMock,
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    } as unknown as CanvasRenderingContext2D

    const getCtxSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(fakeCtx)
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(77)
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const originalMatchMedia = window.matchMedia

    try {
      // 1. Reduced motion -> skips animation and resize binding
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches: true }),
      })
      const reducedWrapper = mount(ParticlesTestHost, { props: { enabled: true } })
      reducedWrapper.vm.init()
      expect(rafSpy).not.toHaveBeenCalled()
      reducedWrapper.unmount()

      // 2. Normal motion -> animates, clears canvas on toggle false, and removes resize/rAF on unmount
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches: false }),
      })
      const normalWrapper = mount(ParticlesTestHost, { props: { enabled: true } })
      normalWrapper.vm.init()
      expect(rafSpy).toHaveBeenCalledTimes(1)
      expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))

      await normalWrapper.setProps({ enabled: false })
      await nextTick()
      expect(clearRectMock).toHaveBeenCalled()
      expect(cancelSpy).toHaveBeenCalledWith(77)

      normalWrapper.unmount()
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      })
      getCtxSpy.mockRestore()
      addSpy.mockRestore()
      removeSpy.mockRestore()
      rafSpy.mockRestore()
      cancelSpy.mockRestore()
    }
  })
})
