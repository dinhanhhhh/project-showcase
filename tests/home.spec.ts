import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import HomeView from '@/views/home/index.vue'
import { usePagesStore } from '@/stores/usePagesStore'

describe('Home launcher', () => {
  it('renders page cards from store state', async () => {
    setActivePinia(createPinia())
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
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Mini Piano')
    expect(wrapper.text()).toContain('Danh sách mini-app')
  })

  it('updates search filter and toggles favorite from UI', async () => {
    setActivePinia(createPinia())
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
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    const input = wrapper.get('input[type=\"search\"]')
    await input.setValue('color')
    expect(wrapper.text()).toContain('Color Game')
    expect(wrapper.text()).not.toContain('Mini Piano')

    await input.setValue('')
    const favoriteButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Favorite'))

    expect(favoriteButton).toBeDefined()
    await favoriteButton!.trigger('click')

    expect(store.favoriteSlugs.length).toBe(1)
    expect(JSON.parse(localStorage.getItem('vibe:favorites') || '[]')).toHaveLength(1)
  })
})
