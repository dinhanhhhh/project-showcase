import { describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { mount } from '@vue/test-utils'
import { routerKey } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { useHomeSettings } from '@/composables/useHomeSettings'
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
})
