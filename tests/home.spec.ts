import { describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { mount } from '@vue/test-utils'
import { routerKey } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import BackToTop from '@/components/BackToTop.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { useHomeSettings } from '@/composables/useHomeSettings'
import AppCoverArt from '@/views/home/AppCoverArt.vue'
import HomeView from '@/views/home/index.vue'
import { usePagesStore } from '@/stores/usePagesStore'

function setupPinia() {
  const app = createApp({})
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
  setActivePinia(pinia)
  return pinia
}

describe('Home launcher', () => {
  it('renders page cards with SVG cover arts from store state', () => {
    const pinia = setupPinia()
    const store = usePagesStore()

    store.pages = [
      {
        slug: 'mini-piano',
        path: '/mini-piano',
        name: 'Mini Piano',
        description: 'Play piano',
        category: 'creative',
      },
    ]

    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
        provide: {
          [routerKey as symbol]: { push: vi.fn() },
        },
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Mini Piano')
    expect(wrapper.text()).toContain('Danh sách mini-app')
    expect(wrapper.text()).toContain('NHIỆM VỤ HẰNG NGÀY')
    expect(wrapper.find('.cover-art').exists()).toBe(true)
  })

  it('updates search filter, switches theme, and toggles favorite from UI', async () => {
    const pinia = setupPinia()
    const store = usePagesStore()

    store.pages = [
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

    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
        provide: {
          [routerKey as symbol]: { push: vi.fn() },
        },
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    const input = wrapper.get('input[type="search"]')
    await input.setValue('color')
    expect(wrapper.text()).toContain('Color Game')
    expect(wrapper.text()).not.toContain('Mini Piano')

    await input.setValue('')
    const favoriteButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Favorite'))

    expect(favoriteButton).toBeDefined()
    await favoriteButton!.trigger('click')
    await nextTick()

    expect(store.favoriteSlugs).toHaveLength(1)
    const persisted = JSON.parse(localStorage.getItem('vibe:pages-store') || '{}') as {
      favoriteSlugs?: string[]
    }
    expect(persisted.favoriteSlugs).toHaveLength(1)

    // Kiểm tra chuyển nhanh chủ đề màu
    const themeBtns = wrapper.findAll('.theme-dot-btn')
    expect(themeBtns.length).toBeGreaterThanOrEqual(4)
    await themeBtns[1].trigger('click')
    await nextTick()
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald')

    // Kiểm tra màu nhấn tương phản cao khi chọn Arctic Light (nút thứ 4)
    await themeBtns[3].trigger('click')
    await nextTick()
    expect(document.documentElement.getAttribute('data-theme')).toBe('arctic')
    const colorCard = wrapper.findAll('.app-card').find((card) => card.text().includes('Color Game'))
    expect(colorCard?.attributes('style')).toContain('#be185d')
  })

  it('requires two-tap confirmation to clear data and closes SettingsModal on Escape', async () => {
    const wrapper = mount(SettingsModal, {
      attachTo: document.body,
      props: {
        modelValue: true,
        userName: 'Tester',
        userRole: 'QA',
        enableParticles: true,
        theme: 'arctic',
      },
    })

    const clearBtn = document.body.querySelector('button.btn-danger') as HTMLButtonElement | null
    expect(clearBtn).not.toBeNull()
    expect(clearBtn!.textContent).toContain('Xóa dữ liệu')

    clearBtn!.click()
    await nextTick()
    expect(wrapper.emitted('clear-data')).toBeUndefined()
    expect(clearBtn!.textContent).toContain('Bấm lại để xác nhận')

    clearBtn!.click()
    await nextTick()
    expect(wrapper.emitted('clear-data')).toHaveLength(1)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])

    wrapper.unmount()
  })

  it('recovers safely when stored settings JSON is corrupted and renders backup actions in SettingsModal', () => {
    localStorage.setItem('vibe:sidebar-collapsed', '{corrupted-json')
    localStorage.setItem('vibe:view-mode', 'list')
    localStorage.setItem('vibe:sort-mode', 'alpha')

    const settings = useHomeSettings()
    expect(settings.isSidebarCollapsed.value).toBe(false)
    expect(settings.viewMode.value).toBe('list')
    expect(settings.sortMode.value).toBe('alpha')

    const wrapper = mount(SettingsModal, {
      attachTo: document.body,
      props: {
        modelValue: true,
        userName: 'Tester',
        userRole: 'QA',
        enableParticles: true,
        theme: 'cosmos',
      },
    })

    expect(document.body.textContent).toContain('Xuất sao lưu')
    expect(document.body.textContent).toContain('Khôi phục')
    wrapper.unmount()
  })

  it('provides accessible aria-label attributes on all collapsed AppSidebar buttons', () => {
    const wrapper = mount(AppSidebar, {
      props: {
        isSidebarCollapsed: true,
        userName: 'Tester',
        userRole: 'Developer',
        onlyShowFavorites: false,
        selectedCategory: 'all',
        searchQuery: '',
        totalApps: 10,
        favoriteCount: 2,
        theme: 'cosmos',
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(7)
    for (const btn of buttons) {
      const label = btn.attributes('aria-label')?.trim() ?? ''
      expect(label.length).toBeGreaterThan(0)
    }
    wrapper.unmount()
  })

  it('handles SettingsModal theme switch, particle toggle, JSON backup export, and valid/invalid import', async () => {
    localStorage.setItem('vibe:theme', 'cosmos')
    localStorage.setItem('vibe_color_game', '{"bestStreak":9}')

    const createObjectUrlMock = vi.fn(() => 'blob:vibe-backup-test')
    const revokeObjectUrlMock = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrlMock })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrlMock })

    const wrapper = mount(SettingsModal, {
      attachTo: document.body,
      props: {
        modelValue: true,
        userName: 'An',
        userRole: 'Engineer',
        enableParticles: true,
        theme: 'cosmos',
      },
    })

    // Theme click & particle switch
    const themeCards = document.body.querySelectorAll('.theme-card')
    expect(themeCards.length).toBeGreaterThanOrEqual(4)
    ;(themeCards[1] as HTMLButtonElement).click()
    await nextTick()
    expect(wrapper.emitted('update:theme')?.[0]).toEqual(['emerald'])

    const particleCheckbox = document.body.querySelector('#ptSwitch') as HTMLInputElement
    particleCheckbox.checked = false
    particleCheckbox.dispatchEvent(new Event('change'))
    await nextTick()
    expect(wrapper.emitted('update:enableParticles')?.[0]).toEqual([false])

    // Export JSON backup
    const backupBtns = Array.from(document.body.querySelectorAll('button.btn-backup')) as HTMLButtonElement[]
    expect(backupBtns).toHaveLength(2)
    backupBtns[0].click()
    await nextTick()
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:vibe-backup-test')
    expect(document.body.querySelector('.backup-status.ok')?.textContent).toContain('Đã xuất')

    // Invalid JSON file import reports clear error message
    const fileInput = document.body.querySelector('input[type="file"]') as HTMLInputElement
    const invalidFile = { text: () => Promise.resolve('{invalid-json') } as unknown as File
    Object.defineProperty(fileInput, 'files', { configurable: true, value: [invalidFile] })
    fileInput.dispatchEvent(new Event('change'))
    await new Promise((resolve) => setTimeout(resolve, 10))
    await nextTick()
    expect(document.body.querySelector('.backup-status.err')).not.toBeNull()

    // Valid JSON file import restores keys and emits data-restored
    const validRaw = JSON.stringify({
      version: 1,
      exportedAt: '2026-11-28T07:00:00.000Z',
      entries: { 'vibe:theme': 'sunset', 'vibe_neon_typing': '{"bestWpm":91}' },
    })
    const validFile = { text: () => Promise.resolve(validRaw) } as unknown as File
    Object.defineProperty(fileInput, 'files', { configurable: true, value: [validFile] })
    fileInput.dispatchEvent(new Event('change'))
    await new Promise((resolve) => setTimeout(resolve, 10))
    await nextTick()
    expect(document.body.querySelector('.backup-status.ok')?.textContent).toContain('Đã khôi phục 2 mục')
    expect(localStorage.getItem('vibe_neon_typing')).toBe('{"bestWpm":91}')
    expect(wrapper.emitted('data-restored')).toHaveLength(1)

    wrapper.unmount()
  })

  it('shows BackToTop after scrolling past 360px, scrolls smoothly to top on click, and cleans listener on unmount', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })

    const wrapper = mount(BackToTop)
    expect(wrapper.find('button.back-to-top').exists()).toBe(false)

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 420 })
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    const btn = wrapper.get('button.back-to-top')
    await btn.trigger('click')
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })

    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    scrollToSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('renders distinct SVG cover arts for all 10 slugs and fallback glyph for unknown slugs in AppCoverArt', () => {
    const knownSlugs = [
      'ngare',
      'co-tuong',
      'saigon-tycoon',
      'anime-farm',
      'oop-flashcards',
      'hom-nay-an-gi',
      'oracle-tarot',
      'neon-typing',
      'mini-piano',
      'color-game',
    ]
    const svgOutputs = new Set<string>()

    for (const slug of knownSlugs) {
      const wrapper = mount(AppCoverArt, {
        props: { slug, accent: '#6dddff', icon: '🎮' },
      })
      const svg = wrapper.find('.art-svg')
      expect(svg.exists()).toBe(true)
      svgOutputs.add(svg.html())
      wrapper.unmount()
    }
    expect(svgOutputs.size).toBe(knownSlugs.length)

    const fallbackWrapper = mount(AppCoverArt, {
      props: { slug: 'experimental-app', accent: '#6dddff', icon: '🛰️' },
    })
    expect(fallbackWrapper.find('.art-svg').exists()).toBe(false)
    expect(fallbackWrapper.get('.art-fallback').text()).toBe('🛰️')
    fallbackWrapper.unmount()
  })

  it('reorders app cards across featured, alpha, and recent sort modes and navigates on Surprise Me', async () => {
    const pushMock = vi.fn()
    const pinia = setupPinia()
    const store = usePagesStore()
    store.pages = [
      { slug: 'mini-piano', path: '/mini-piano', name: 'Mini Piano', description: 'Piano', category: 'creative' },
      { slug: 'color-game', path: '/color-game', name: 'Color Game', description: 'Colors', category: 'game' },
      { slug: 'ngare', path: '/ngare', name: 'Ngã Rẽ Cuộc Đời', description: 'Life sim', category: 'game' },
    ]
    store.recentlyViewedSlugs = ['color-game']

    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
        provide: { [routerKey as symbol]: { push: pushMock } },
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    const getCardNames = () => wrapper.findAll('.app-card h3').map((el) => el.text())
    const sortButtons = wrapper.findAll('[aria-label="Sắp xếp"] button')
    expect(sortButtons).toHaveLength(3)

    // Featured priority order: ngare (1) -> mini-piano (9) -> color-game (10)
    await sortButtons[0].trigger('click')
    expect(getCardNames()).toEqual(['Ngã Rẽ Cuộc Đời', 'Mini Piano', 'Color Game'])

    // Alphabetical (vi): Color Game -> Mini Piano -> Ngã Rẽ Cuộc Đời
    await sortButtons[1].trigger('click')
    expect(getCardNames()).toEqual(['Color Game', 'Mini Piano', 'Ngã Rẽ Cuộc Đời'])

    // Recently viewed first: Color Game -> alphabetical remainder
    await sortButtons[2].trigger('click')
    expect(getCardNames()).toEqual(['Color Game', 'Mini Piano', 'Ngã Rẽ Cuộc Đời'])

    await wrapper.get('.surprise-btn').trigger('click')
    expect(pushMock).toHaveBeenCalledTimes(1)
    expect(['/mini-piano', '/color-game', '/ngare']).toContain(pushMock.mock.calls[0][0])

    wrapper.unmount()
  })
})
