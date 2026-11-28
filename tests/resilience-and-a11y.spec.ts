import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { mount } from '@vue/test-utils'
import { routerKey } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppEmbedFrame from '@/components/AppEmbedFrame.vue'
import BackToTop from '@/components/BackToTop.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import { VIBE_THEMES, useHomeSettings } from '@/composables/useHomeSettings'
import { useColorGameStore } from '@/stores/colorGame'
import { useCoTuongStore } from '@/stores/coTuong'
import { useHomNayAnGiStore } from '@/stores/homNayAnGi'
import { useMiniPianoStore } from '@/stores/miniPiano'
import { useNeonTypingStore } from '@/stores/neonTyping'
import { useNgareStore } from '@/stores/ngare'
import { useOopFlashcardsStore } from '@/stores/oopFlashcards'
import { useOracleTarotStore } from '@/stores/oracleTarot'
import { useDailyChallengeStore } from '@/stores/useDailyChallengeStore'
import { usePagesStore } from '@/stores/usePagesStore'
import { createSafeAudioManager } from '@/utils/audio'
import { buildBackupPayload, parseAndValidateBackup, restoreBackupPayload } from '@/utils/backup'
import { hasOpenDialog, isEditableEventTarget } from '@/utils/keyboard'
import CoTuongView from '@/views/co-tuong/index.vue'
import ColorGameView from '@/views/color-game/index.vue'
import HomNayAnGiView from '@/views/hom-nay-an-gi/index.vue'
import MiniPianoView from '@/views/mini-piano/index.vue'
import NeonTypingView from '@/views/neon-typing/index.vue'
import NgareView from '@/views/ngare/index.vue'
import OopFlashcardsView from '@/views/oop-flashcards/index.vue'
import OracleTarotView from '@/views/oracle-tarot/index.vue'

function setupCleanPinia() {
  const app = createApp({})
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
  setActivePinia(pinia)
  return pinia
}

describe('Resilience, Corrupted Storage Hydration, Lifecycle & Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('survives corrupted localStorage JSON across all 10 Pinia stores without crashing', () => {
    const storeKeys = [
      'vibe:pages-store',
      'vibe:daily-challenges',
      'vibe_co_tuong',
      'ngare_game_state',
      'vibe_oop_flashcards',
      'vibe_hom_nay_an_gi',
      'vibe_oracle_tarot',
      'vibe_neon_typing',
      'vibe_mini_piano',
      'vibe_color_game',
    ]
    for (const key of storeKeys) {
      localStorage.setItem(key, '{broken-json:::[')
    }

    setupCleanPinia()

    expect(() => usePagesStore()).not.toThrow()
    expect(() => useDailyChallengeStore().hydrateSafely()).not.toThrow()
    expect(() => useCoTuongStore()).not.toThrow()
    expect(() => useNgareStore()).not.toThrow()
    expect(() => useOopFlashcardsStore()).not.toThrow()
    expect(() => useHomNayAnGiStore()).not.toThrow()
    expect(() => useOracleTarotStore()).not.toThrow()
    expect(() => useNeonTypingStore()).not.toThrow()
    expect(() => useMiniPianoStore()).not.toThrow()
    expect(() => useColorGameStore()).not.toThrow()

    expect(usePagesStore().favoriteSlugs).toEqual([])
    expect(useDailyChallengeStore().totalXp).toBe(0)
    expect(useNeonTypingStore().bestWpm).toBe(0)
  })

  it('mounts and cleans up global listeners in CommandPalette, BackToTop, and AppEmbedFrame', async () => {
    const pinia = setupCleanPinia()
    const pagesStore = usePagesStore()
    pagesStore.pages = [
      {
        slug: 'ngare',
        path: '/ngare',
        name: 'Ngã Rẽ Cuộc Đời',
        description: 'Life sim',
        category: 'game',
      },
    ]

    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const mockRouter = { push: vi.fn() }

    const paletteWrapper = mount(CommandPalette, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
        provide: { [routerKey as symbol]: mockRouter },
      },
    })
    window.dispatchEvent(new CustomEvent('vibe:open-palette'))
    await nextTick()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    paletteWrapper.unmount()

    const backWrapper = mount(BackToTop)
    backWrapper.unmount()

    const embedWrapper = mount(AppEmbedFrame, {
      props: { title: 'Anime Farm', src: '/apps/anime-farm/index.html', accent: '#6dddff' },
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    expect(embedWrapper.get('iframe').attributes('title')).toBe('Anime Farm')
    embedWrapper.unmount()

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it('mounts and unmounts all native interactive views cleanly with accessible controls', async () => {
    const pinia = setupCleanPinia()
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame')

    const views = [
      NeonTypingView,
      MiniPianoView,
      ColorGameView,
      OracleTarotView,
      HomNayAnGiView,
      OopFlashcardsView,
    ]

    for (const ViewComp of views) {
      const wrapper = mount(ViewComp, {
        global: {
          plugins: [pinia],
          stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
      })
      await nextTick()
      expect(wrapper.find('.back-btn').exists()).toBe(true)
      wrapper.unmount()
    }

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(cancelRafSpy).not.toThrow()
  })

  it('switches NeonTyping and ColorGame into Daily Seed mode directly from the toolbar', async () => {
    const pinia = setupCleanPinia()

    const typingWrapper = mount(NeonTypingView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    const dailyTypingBtn = typingWrapper
      .findAll('button')
      .find((b) => b.text().includes('Daily Seed'))
    expect(dailyTypingBtn).toBeDefined()
    await dailyTypingBtn!.trigger('click')
    await nextTick()
    expect(typingWrapper.text()).toContain('DAILY PB')
    typingWrapper.unmount()

    const colorWrapper = mount(ColorGameView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    const dailyColorBtn = colorWrapper
      .findAll('button')
      .find((b) => b.text().includes('Daily Seed'))
    expect(dailyColorBtn).toBeDefined()
    await dailyColorBtn!.trigger('click')
    await nextTick()
    expect(colorWrapper.text()).toContain('1 / 10')
    expect(colorWrapper.text()).toContain('Daily PB')
    colorWrapper.unmount()

    const pianoWrapper = mount(MiniPianoView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    const dailyPianoBtn = pianoWrapper
      .findAll('button')
      .find((b) => b.text().includes('Bài Hôm Nay'))
    expect(dailyPianoBtn).toBeDefined()
    await dailyPianoBtn!.trigger('click')
    await nextTick()
    expect(pianoWrapper.text()).toContain('DAILY PB')
    pianoWrapper.unmount()
  })

  it('supports keyboard shortcuts across ColorGame, CommandPalette Escape, and OopFlashcards', async () => {
    const pinia = setupCleanPinia()
    const colorWrapper = mount(ColorGameView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })

    // Press 'h' for 50:50 lifeline
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }))
    await nextTick()
    expect(colorWrapper.findAll('.color-tile.eliminated').length).toBeGreaterThanOrEqual(1)

    // Press 'r' for new round
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }))
    await nextTick()
    expect(colorWrapper.findAll('.color-tile.eliminated')).toHaveLength(0)
    colorWrapper.unmount()

    const paletteWrapper = mount(CommandPalette, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
        provide: { [routerKey as symbol]: { push: vi.fn() } },
      },
    })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await nextTick()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    paletteWrapper.unmount()
  })

  it('enforces 14-day retention cap on useDailyChallengeStore history', () => {
    setupCleanPinia()
    const store = useDailyChallengeStore()
    for (let day = 1; day <= 18; day++) {
      const dateKey = `2026-11-${String(day).padStart(2, '0')}`
      store.toggleChallenge('dc_ngare_life', dateKey)
    }
    expect(Object.keys(store.completedIdsByDate)).toHaveLength(14)
    expect(store.completedIdsByDate['2026-11-01']).toBeUndefined()
    expect(store.completedIdsByDate['2026-11-18']).toEqual(['dc_ngare_life'])
  })

  it('switches across all 4 Vibe themes including Arctic Light safely', async () => {
    const settings = useHomeSettings()
    expect(VIBE_THEMES.map((t) => t.id)).toEqual(['cosmos', 'emerald', 'sunset', 'arctic'])

    for (const themeId of ['emerald', 'sunset', 'arctic', 'cosmos'] as const) {
      settings.theme.value = themeId
      await nextTick()
      expect(document.documentElement.getAttribute('data-theme')).toBe(themeId)
      expect(localStorage.getItem('vibe:theme')).toBe(themeId)
    }
  })

  it('mounts and cleanly unmounts CoTuongView while preserving keyboard shortcuts and cleanup', async () => {
    const pinia = setupCleanPinia()
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(CoTuongView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await nextTick()
    expect(wrapper.find('.board-outer').exists()).toBe(true)
    expect(wrapper.find('.control-column').exists()).toBe(true)
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('mounts and cleanly unmounts NgareView setup screen with trait picker', async () => {
    const pinia = setupCleanPinia()
    const wrapper = mount(NgareView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await nextTick()
    expect(wrapper.text()).toContain('Ngã Rẽ Cuộc Đời')
    wrapper.unmount()
  })

  it('supports full JSON backup and restore round-trip across all 10 app storage prefixes', () => {
    const allAppEntries: Record<string, string> = {
      'vibe:pages-store': '{"favoriteSlugs":["ngare"]}',
      'vibe:daily-challenges': '{"totalXp":95}',
      vibe_co_tuong: '{"stats":{"wins":2}}',
      ngare_game_state: '{"unlockedEndings":["e1"]}',
      vibe_oop_flashcards: '{"bestQuizPercent":88}',
      vibe_hom_nay_an_gi: '{"isMuted":true}',
      vibe_oracle_tarot: '{"includeReversed":false}',
      vibe_neon_typing: '{"bestWpm":82}',
      vibe_mini_piano: '{"octave":5}',
      vibe_color_game: '{"bestStreak":7}',
      FAM_FARM_GAME_SAVE_V6_3PLOTS: '{"coins":250}',
      FAM_ORDERS_SAVE_V4: '[]',
      monopoly_saigon_achievements: '{"trum_ben_nghe":{"unlocked":true}}',
    }
    for (const [k, v] of Object.entries(allAppEntries)) {
      localStorage.setItem(k, v)
    }

    const exported = JSON.stringify(buildBackupPayload(localStorage))
    localStorage.clear()
    const parsed = parseAndValidateBackup(exported)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const restoredCount = restoreBackupPayload(localStorage, parsed.data)
    expect(restoredCount).toBe(Object.keys(allAppEntries).length)
    for (const [k, v] of Object.entries(allAppEntries)) {
      expect(localStorage.getItem(k)).toBe(v)
    }
  })

  it('clears pages store user data completely without affecting loaded pages registry', () => {
    setupCleanPinia()
    const store = usePagesStore()
    store.pages = [
      { slug: 'ngare', path: '/ngare', name: 'Ngã Rẽ', description: 'RPG', category: 'game' },
    ]
    store.toggleFavorite('ngare')
    store.trackRecentlyViewed('ngare')
    expect(store.favoritePages).toHaveLength(1)
    expect(store.recentlyViewedPages).toHaveLength(1)

    store.clearUserData()
    expect(store.favoritePages).toEqual([])
    expect(store.recentlyViewedPages).toEqual([])
    expect(store.pages).toHaveLength(1)
  })

  it('switches OopFlashcards between Flashcard and Quiz modes directly in UI', async () => {
    const pinia = setupCleanPinia()
    const wrapper = mount(OopFlashcardsView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await nextTick()
    const quizBtn = wrapper.findAll('button').find((b) => b.text().includes('Quiz nhanh'))
    expect(quizBtn).toBeDefined()
    await quizBtn!.trigger('click')
    await nextTick()
    expect(wrapper.find('.quiz-card').exists()).toBe(true)
    wrapper.unmount()
  })

  it('generates 4-meal daily plan directly inside HomNayAnGi UI', async () => {
    const pinia = setupCleanPinia()
    const wrapper = mount(HomNayAnGiView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    const planBtn = wrapper.findAll('button').find((b) => b.text().includes('Gợi ý cả ngày'))
    expect(planBtn).toBeDefined()
    await planBtn!.trigger('click')
    await nextTick()
    expect(wrapper.find('.daily-plan-box').exists()).toBe(true)
    expect(wrapper.findAll('.plan-slot-card')).toHaveLength(4)
    wrapper.unmount()
  })

  it('toggles reversed cards setting inside OracleTarot UI and preserves aria-pressed', async () => {
    const pinia = setupCleanPinia()
    const wrapper = mount(OracleTarotView, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    const toggleBtn = wrapper.get('.reversed-toggle')
    expect(toggleBtn.attributes('aria-pressed')).toBe('true')
    await toggleBtn.trigger('click')
    await nextTick()
    expect(toggleBtn.attributes('aria-pressed')).toBe('false')
    wrapper.unmount()
  })

  it('ignores unsupported theme strings in localStorage and defaults safely to cosmos', () => {
    localStorage.setItem('vibe:theme', '"invalid_theme_name"')
    localStorage.setItem('vibe:view-mode', '"invalid_mode"')
    localStorage.setItem('vibe:sort-mode', '"invalid_sort"')
    const settings = useHomeSettings()
    expect(settings.theme.value).toBe('cosmos')
    expect(settings.viewMode.value).toBe('grid')
    expect(settings.sortMode.value).toBe('featured')
  })

  it('executes CommandPalette search filtering and keyboard navigation cleanly', async () => {
    const pinia = setupCleanPinia()
    const pagesStore = usePagesStore()
    pagesStore.pages = [
      { slug: 'co-tuong', path: '/co-tuong', name: 'Cờ Tướng', description: 'Xiangqi', category: 'game' },
      { slug: 'mini-piano', path: '/mini-piano', name: 'Mini Piano', description: 'Synth', category: 'creative' },
    ]
    const pushSpy = vi.fn()
    const wrapper = mount(CommandPalette, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
        provide: { [routerKey as symbol]: { push: pushSpy } },
      },
    })
    window.dispatchEvent(new CustomEvent('vibe:open-palette'))
    await nextTick()
    const input = document.body.querySelector('input') as HTMLInputElement | null
    expect(input).not.toBeNull()
    input!.value = 'Piano'
    input!.dispatchEvent(new Event('input'))
    await nextTick()
    expect(document.body.textContent).toContain('Mini Piano')
    wrapper.unmount()
  })

  it('guards editable elements, modifier combos, and open dialogs across global shortcut handlers', async () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const select = document.createElement('select')
    const editableDiv = document.createElement('div')
    editableDiv.setAttribute('contenteditable', 'true')
    const plainDiv = document.createElement('div')

    expect(isEditableEventTarget(input)).toBe(true)
    expect(isEditableEventTarget(textarea)).toBe(true)
    expect(isEditableEventTarget(select)).toBe(true)
    expect(isEditableEventTarget(editableDiv)).toBe(true)
    expect(isEditableEventTarget(plainDiv)).toBe(false)
    expect(isEditableEventTarget(null)).toBe(false)

    const pinia = setupCleanPinia()
    const flashcardWrapper = mount(OopFlashcardsView, {
      global: { plugins: [pinia], stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    const store = useOopFlashcardsStore()

    // While a modal dialog is open, Space/ArrowRight must NOT flip or advance cards
    const mockDialog = document.createElement('div')
    mockDialog.setAttribute('role', 'dialog')
    document.body.appendChild(mockDialog)
    try {
      expect(hasOpenDialog()).toBe(true)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight' }))
      await nextTick()
      expect(store.masteredIds).toHaveLength(0)
    } finally {
      mockDialog.remove()
    }
    expect(hasOpenDialog()).toBe(false)

    // With Ctrl modifier held, ArrowRight must NOT rate the card
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', ctrlKey: true }),
    )
    await nextTick()
    expect(store.masteredIds).toHaveLength(0)

    // Without dialog or modifiers, ArrowRight rates known cleanly
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight' }))
    await nextTick()
    expect(store.masteredIds).toHaveLength(1)
    flashcardWrapper.unmount()

    // MiniPiano blocks note shortcuts when dialog is open
    const pianoWrapper = mount(MiniPianoView, {
      global: { plugins: [pinia], stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    const openDialog = document.createElement('div')
    openDialog.setAttribute('role', 'dialog')
    document.body.appendChild(openDialog)
    try {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      await nextTick()
      expect(pianoWrapper.findAll('.active-key')).toHaveLength(0)
    } finally {
      openDialog.remove()
    }
    pianoWrapper.unmount()
  })

  it('recovers store actions cleanly when hydrated with partial/missing array or stats fields', () => {
    setupCleanPinia()
    const chess = useCoTuongStore()
    ;(chess.$state as unknown as Record<string, unknown>).stats = undefined
    ;(chess.$state as unknown as Record<string, unknown>).solvedPuzzleIds = undefined
    expect(() => chess.recordResult('win')).not.toThrow()
    expect(() => chess.markPuzzleSolved('song-xa-thac')).not.toThrow()
    expect(chess.stats.wins).toBe(1)
    expect(chess.solvedPuzzleIds).toEqual(['song-xa-thac'])

    const flashcards = useOopFlashcardsStore()
    ;(flashcards.$state as unknown as Record<string, unknown>).masteredIds = null
    ;(flashcards.$state as unknown as Record<string, unknown>).reviewIds = undefined
    expect(() => flashcards.markCardResult('1.1', true)).not.toThrow()
    expect(flashcards.masteredIds).toEqual(['1.1'])

    const food = useHomNayAnGiStore()
    ;(food.$state as unknown as Record<string, unknown>).favoriteIds = undefined
    ;(food.$state as unknown as Record<string, unknown>).history = null
    expect(() => food.toggleFavorite('1')).not.toThrow()
    expect(() =>
      food.recordPick({ id: '1', name: 'Phở bò', image: '', emoji: '🍜', category: 'nuoc' }),
    ).not.toThrow()
    expect(food.favoriteIds).toEqual(['1'])
    expect(food.history).toHaveLength(1)

    const tarot = useOracleTarotStore()
    ;(tarot.$state as unknown as Record<string, unknown>).history = undefined
    expect(() =>
      tarot.addReading({
        id: 'r1',
        timestamp: '08:00',
        mode: 1,
        question: 'Test',
        cards: [],
      }),
    ).not.toThrow()
    expect(tarot.history).toHaveLength(1)

    const piano = useMiniPianoStore()
    ;(piano.$state as unknown as Record<string, unknown>).savedMelodies = undefined
    expect(() =>
      piano.saveMelody('Test', [{ pitchClass: 'C', octave: 4, offsetMs: 0 }]),
    ).not.toThrow()
    expect(piano.savedMelodies).toHaveLength(1)
  })

  it('createSafeAudioManager handles missing, throwing, and rejecting AudioContext lifecycles cleanly', async () => {
    const originalAudio = window.AudioContext
    try {
      Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })
      const missingMgr = createSafeAudioManager()
      expect(missingMgr.ensureContext()).toBeNull()
      expect(() => missingMgr.closeContext()).not.toThrow()

      Object.defineProperty(window, 'AudioContext', {
        configurable: true,
        value: class ThrowingAudio {
          constructor() {
            throw new Error('Blocked by autoplay policy')
          }
        },
      })
      const throwingMgr = createSafeAudioManager()
      expect(throwingMgr.ensureContext()).toBeNull()

      const resumeSpy = vi.fn(() => Promise.reject(new Error('Suspended')))
      const closeSpy = vi.fn(() => Promise.reject(new Error('Already closed')))
      Object.defineProperty(window, 'AudioContext', {
        configurable: true,
        value: class MockAudio {
          state = 'suspended'
          resume = resumeSpy
          close = closeSpy
        },
      })
      const okMgr = createSafeAudioManager()
      const ctx = okMgr.ensureContext()
      expect(ctx).not.toBeNull()
      expect(resumeSpy).toHaveBeenCalledTimes(1)
      expect(() => okMgr.closeContext()).not.toThrow()
      expect(closeSpy).toHaveBeenCalledTimes(1)
      // flush rejected microtasks cleanly
      await Promise.resolve()
    } finally {
      Object.defineProperty(window, 'AudioContext', { configurable: true, value: originalAudio })
    }
  })
})
