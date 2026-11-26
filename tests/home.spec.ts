import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { mount } from '@vue/test-utils'
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
  })
})
