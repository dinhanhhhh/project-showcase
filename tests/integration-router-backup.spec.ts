import { mount } from '@vue/test-utils'
import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter, routerKey } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppEmbedFrame from '@/components/AppEmbedFrame.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import { buildAppRoutes } from '@/router/routes'
import { useCoTuongStore } from '@/stores/coTuong'
import { useDailyChallengeStore } from '@/stores/useDailyChallengeStore'
import { useNeonTypingStore } from '@/stores/neonTyping'
import { useOopFlashcardsStore } from '@/stores/oopFlashcards'
import { usePagesStore } from '@/stores/usePagesStore'
import type { MiniAppLoader } from '@/types/page'
import {
  buildBackupPayload,
  parseAndValidateBackup,
  restoreBackupPayload,
} from '@/utils/backup'

function initFreshPinia() {
  const app = createApp({})
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
  setActivePinia(pinia)
  return pinia
}

const SAMPLE_MODULES: Record<string, MiniAppLoader> = {
  '../views/home/index.vue': async () => ({ default: {} }),
  '../views/ngare/index.vue': async () => ({ default: {} }),
  '../views/co-tuong/index.vue': async () => ({ default: {} }),
  '../views/mini-piano/index.vue': async () => ({ default: {} }),
  '../views/oop-flashcards/index.vue': async () => ({ default: {} }),
}

describe('Router, Backup Integration, CommandPalette & AppEmbedFrame', () => {
  beforeEach(() => {
    localStorage.clear()
    initFreshPinia()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('navigates across generated app routes and updates recentlyViewedSlugs in MRU order', async () => {
    const appRoutes = buildAppRoutes(SAMPLE_MODULES)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>home</div>' } },
        ...appRoutes.map((route) => ({
          ...route,
          component: { template: `<div>${String(route.name)}</div>` },
        })),
      ],
    })

    const pagesStore = usePagesStore()
    router.afterEach((to) => {
      const slug = typeof to.meta.slug === 'string' ? to.meta.slug : null
      if (slug) pagesStore.trackRecentlyViewed(slug)
    })

    await router.push('/ngare')
    await router.push('/co-tuong')
    await router.push('/mini-piano')
    await router.push('/ngare')
    await router.isReady()

    expect(pagesStore.recentlyViewedSlugs).toEqual(['ngare', 'mini-piano', 'co-tuong'])
    expect(router.currentRoute.value.meta.slug).toBe('ngare')
  })

  it('exports and restores multi-store Pinia state plus embedded game saves across sessions', async () => {
    const pagesStore = usePagesStore()
    pagesStore.toggleFavorite('co-tuong')
    pagesStore.trackRecentlyViewed('ngare')

    const dailyStore = useDailyChallengeStore()
    dailyStore.toggleChallenge('oop-flashcards', '2026-11-28')

    const oopStore = useOopFlashcardsStore()
    oopStore.markCardResult('7.16', true)
    oopStore.recordQuizResult(7, 8)

    const coTuongStore = useCoTuongStore()
    coTuongStore.markPuzzleSolved('khai-thien-ma')

    const typingStore = useNeonTypingStore()
    typingStore.recordDailyResult(88, 96, 'dev', '2026-11-28')

    localStorage.setItem('FAM_FARM_GAME_SAVE_V6_3PLOTS', '{"coins":1200}')
    localStorage.setItem('monopoly_saigon_save', '{"round":9}')
    localStorage.setItem('untracked_secret', 'ignore-me')
    await nextTick()

    const payload = buildBackupPayload(localStorage)
    const serialized = JSON.stringify(payload)

    localStorage.clear()
    const parsed = parseAndValidateBackup(serialized)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const restoredCount = restoreBackupPayload(localStorage, parsed.data)
    expect(restoredCount).toBeGreaterThanOrEqual(7)
    expect(localStorage.getItem('untracked_secret')).toBeNull()
    expect(localStorage.getItem('FAM_FARM_GAME_SAVE_V6_3PLOTS')).toBe('{"coins":1200}')
    expect(localStorage.getItem('monopoly_saigon_save')).toBe('{"round":9}')

    initFreshPinia()
    expect(usePagesStore().favoriteSlugs).toContain('co-tuong')
    expect(usePagesStore().recentlyViewedSlugs).toContain('ngare')
    expect(useOopFlashcardsStore().masteredIds).toContain('7.16')
    expect(useCoTuongStore().solvedPuzzleIds).toContain('khai-thien-ma')
    expect(useNeonTypingStore().dailyBestByDate['2026-11-28']).toBe(88)
    expect(useDailyChallengeStore().totalXp).toBeGreaterThan(0)
    expect(useDailyChallengeStore().isCompleted('oop-flashcards', '2026-11-28')).toBe(true)
  })

  it('opens CommandPalette via custom event, filters apps, navigates on Enter, and closes on Escape', async () => {
    const pagesStore = usePagesStore()
    pagesStore.pages = [
      {
        slug: 'mini-piano',
        path: '/mini-piano',
        name: 'Mini Piano',
        description: 'Đàn Synth',
        category: 'creative',
      },
      {
        slug: 'co-tuong',
        path: '/co-tuong',
        name: 'Cờ Tướng Master',
        description: 'Xiangqi AI',
        category: 'game',
      },
    ]

    const pushSpy = vi.fn().mockResolvedValue(undefined)
    const wrapper = mount(CommandPalette, {
      attachTo: document.body,
      global: {
        provide: {
          [routerKey as symbol]: { push: pushSpy },
        },
      },
    })

    window.dispatchEvent(new CustomEvent('vibe:open-palette'))
    await nextTick()

    const input = document.body.querySelector('.palette-search input') as HTMLInputElement | null
    expect(input).not.toBeNull()
    input!.value = 'Cờ Tướng'
    input!.dispatchEvent(new Event('input'))
    await nextTick()

    const options = document.body.querySelectorAll('.palette-item')
    expect(options).toHaveLength(1)
    expect(options[0].textContent).toContain('Cờ Tướng Master')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await nextTick()
    expect(pushSpy).toHaveBeenCalledWith('/co-tuong')

    window.dispatchEvent(new CustomEvent('vibe:open-palette'))
    await nextTick()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()

    wrapper.unmount()
  })

  it('renders AppEmbedFrame safely, reloads iframe, and exits Theater Mode on Escape', async () => {
    const wrapper = mount(AppEmbedFrame, {
      props: {
        title: 'Nông Trại Anime 2.5D',
        subtitle: 'Farm Sim',
        src: '/apps/anime-farm/index.html',
        badge: 'Static Embed',
      },
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })

    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('src')).toBe('/apps/anime-farm/index.html')

    await wrapper.get('button[aria-label="Chế độ rộng khung"]').trigger('click')
    expect(wrapper.find('.embed-shell.theater').exists()).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('.embed-shell.theater').exists()).toBe(false)

    await wrapper.get('button[aria-label="Tải lại ứng dụng"]').trigger('click')
    expect(wrapper.find('iframe').exists()).toBe(true)
    wrapper.unmount()
  })

  it('CommandPalette cycles active selection with ArrowDown/ArrowUp wrap-around and navigates with Enter', async () => {
    const pagesStore = usePagesStore()
    pagesStore.pages = [
      { slug: 'ngare', path: '/ngare', name: 'Ngã Rẽ', description: 'RPG', category: 'game' },
      { slug: 'co-tuong', path: '/co-tuong', name: 'Cờ Tướng', description: 'Xiangqi', category: 'game' },
      { slug: 'mini-piano', path: '/mini-piano', name: 'Mini Piano', description: 'Synth', category: 'creative' },
    ]

    const pushSpy = vi.fn().mockResolvedValue(undefined)
    const wrapper = mount(CommandPalette, {
      attachTo: document.body,
      global: {
        provide: { [routerKey as symbol]: { push: pushSpy } },
      },
    })

    window.dispatchEvent(new CustomEvent('vibe:open-palette'))
    await nextTick()
    const items = document.body.querySelectorAll('.palette-item')
    expect(items.length).toBeGreaterThanOrEqual(3)

    // Move down once -> selects 2nd item (/co-tuong); move up twice wraps to last (/mini-piano)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    await nextTick()
    expect(items[1].classList.contains('active')).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    await nextTick()
    expect(items[items.length - 1].classList.contains('active')).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await nextTick()
    expect(pushSpy).toHaveBeenCalledWith('/mini-piano')
    wrapper.unmount()
  })
})
