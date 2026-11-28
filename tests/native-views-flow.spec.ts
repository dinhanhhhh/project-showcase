import { mount } from '@vue/test-utils'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDailyDateKey } from '@/utils/daily-seed'
import ColorGameView from '@/views/color-game/index.vue'
import HomNayAnGiView from '@/views/hom-nay-an-gi/index.vue'
import MiniPianoView from '@/views/mini-piano/index.vue'
import NeonTypingView from '@/views/neon-typing/index.vue'
import OopFlashcardsView from '@/views/oop-flashcards/index.vue'
import OracleTarotView from '@/views/oracle-tarot/index.vue'

function setupPinia() {
  const app = createApp({})
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
  setActivePinia(pinia)
  return pinia
}

const MOUNT_STUBS = {
  RouterLink: {
    template: '<a><slot /></a>',
  },
}

describe('Native Mini-App Interactive UI User Flows', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('HomNayAnGiView filters dishes by name and generates + copies 4-meal plan', async () => {
    const pinia = setupPinia()
    const wrapper = mount(HomNayAnGiView, {
      global: { plugins: [pinia], stubs: MOUNT_STUBS },
    })

    const searchInput = wrapper.get('.menu-search-input')
    await searchInput.setValue('pho')
    expect(wrapper.find('.menu-panel').text()).toContain('Phở bò')

    await wrapper.get('.daily-plan-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.daily-plan-box').exists()).toBe(true)
    expect(wrapper.findAll('.plan-slot-card')).toHaveLength(4)

    await wrapper.get('.copy-plan-btn').trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 10))
    await nextTick()
    expect(wrapper.get('.copy-plan-btn').text()).toContain('Đã chép')
    wrapper.unmount()
  })

  it('OopFlashcardsView filters by difficulty and runs interactive Quiz mode', async () => {
    const pinia = setupPinia()
    const wrapper = mount(OopFlashcardsView, {
      global: { plugins: [pinia], stubs: MOUNT_STUBS },
    })

    const advPill = wrapper.findAll('.diff-pill').find((b) => b.text().includes('Nâng cao'))
    expect(advPill).toBeDefined()
    await advPill!.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Nâng cao')

    const quizTab = wrapper.findAll('button').find((b) => b.text().includes('Quiz nhanh'))
    expect(quizTab).toBeDefined()
    await quizTab!.trigger('click')
    await nextTick()

    expect(wrapper.findAll('.quiz-opt-btn')).toHaveLength(4)
    await wrapper.find('.quiz-opt-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.quiz-feedback').exists()).toBe(true)
    wrapper.unmount()
  })

  it('OracleTarotView draws deterministic Daily Card immediately without waiting for shuffle animation', async () => {
    const pinia = setupPinia()
    const wrapper = mount(OracleTarotView, {
      global: { plugins: [pinia], stubs: MOUNT_STUBS },
    })

    const dailyBtn = wrapper.findAll('button').find((b) => b.text().includes('📅 Lá Hôm Nay'))
    expect(dailyBtn).toBeDefined()
    await dailyBtn!.trigger('click')
    await nextTick()

    expect(wrapper.find('.spread-stage').exists()).toBe(true)
    expect(wrapper.text()).toContain(getDailyDateKey())
    wrapper.unmount()
  })

  it('ColorGameView switches RGB -> HSL channels and triggers 50:50 lifeline elimination', async () => {
    const pinia = setupPinia()
    const wrapper = mount(ColorGameView, {
      global: { plugins: [pinia], stubs: MOUNT_STUBS },
    })

    const hslBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'HSL')
    expect(hslBtn).toBeDefined()
    await hslBtn!.trigger('click')
    await nextTick()
    expect(wrapper.find('.channel-bars').text()).toContain('H (Tông màu)')

    await wrapper.get('.lifeline-btn').trigger('click')
    await nextTick()
    expect(wrapper.findAll('.color-tile.eliminated').length).toBeGreaterThanOrEqual(1)
    wrapper.unmount()
  })

  it('NeonTypingView switches to Daily Seed and Sudden Death modes cleanly', async () => {
    const pinia = setupPinia()
    const wrapper = mount(NeonTypingView, {
      global: { plugins: [pinia], stubs: MOUNT_STUBS },
    })

    const sdBtn = wrapper.findAll('button').find((b) => b.text().includes('Sudden Death'))
    expect(sdBtn).toBeDefined()
    await sdBtn!.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('SINH MẠNG')

    const dailyBtn = wrapper.findAll('button').find((b) => b.text().includes('Daily Seed'))
    expect(dailyBtn).toBeDefined()
    await dailyBtn!.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('THỜI GIAN')
    wrapper.unmount()
  })

  it('MiniPianoView activates Challenge mode, selects 8-song presets, and reacts to white key press', async () => {
    const pinia = setupPinia()
    const wrapper = mount(MiniPianoView, {
      global: { plugins: [pinia], stubs: MOUNT_STUBS },
    })

    const challengeBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Thử thách giai điệu'))
    expect(challengeBtn).toBeDefined()
    await challengeBtn!.trigger('click')
    await nextTick()
    expect(wrapper.find('.challenge-hud').exists()).toBe(true)

    const furEliseTab = wrapper.findAll('.song-tab').find((b) => b.text().includes('Für Elise'))
    expect(furEliseTab).toBeDefined()
    await furEliseTab!.trigger('click')
    await nextTick()

    await wrapper.get('.white-key').trigger('mousedown')
    await nextTick()
    expect(wrapper.find('.note-readout').text()).toContain('Đô')
    wrapper.unmount()
  })

  it('HomNayAnGiView creates, rejects duplicate, and removes custom dishes via FoodAddForm', async () => {
    const pinia = setupPinia()
    const wrapper = mount(HomNayAnGiView, {
      global: { plugins: [pinia], stubs: MOUNT_STUBS },
    })

    const nameInput = wrapper.get('.add-form input[type="text"]')
    await nameInput.setValue('Mì Quảng Đặc Biệt')
    await wrapper.get('.add-form').trigger('submit')
    await nextTick()

    expect(wrapper.find('.menu-panel').text()).toContain('Mì Quảng Đặc Biệt')
    expect(wrapper.get('.dish-name').text()).toContain('Mì Quảng Đặc Biệt')

    // Reject duplicate dish name cleanly
    await nameInput.setValue('Mì Quảng Đặc Biệt')
    await wrapper.get('.add-form').trigger('submit')
    await nextTick()
    expect(wrapper.find('.msg-error').exists()).toBe(true)

    // Remove custom dish cleanly
    await wrapper.get('[title="Xóa món tự thêm"]').trigger('click')
    await nextTick()
    expect(wrapper.find('.menu-panel').text()).not.toContain('Mì Quảng Đặc Biệt')
    wrapper.unmount()
  })

  it('OracleTarotView draws 3-card spread, enforces clipboard status guard, replays journal entry, and clears journal', async () => {
    vi.useFakeTimers()
    try {
      const pinia = setupPinia()
      const wrapper = mount(OracleTarotView, {
        global: { plugins: [pinia], stubs: MOUNT_STUBS },
      })

      const threeBtn = wrapper.findAll('button').find((b) => b.text().includes('3 Lá Thời Gian'))
      expect(threeBtn).toBeDefined()
      await threeBtn!.trigger('click')

      await wrapper.get('.question-input').setValue('Dự án sắp tới thế nào?')
      await wrapper.get('.draw-cta').trigger('click')
      await vi.advanceTimersByTimeAsync(1600)
      await nextTick()

      expect(wrapper.findAll('.card-slot')).toHaveLength(3)
      expect(wrapper.find('.summary-box').exists()).toBe(true)
      expect(wrapper.findAll('.journal-row')).toHaveLength(1)

      // Clipboard rejection must NOT mark copiedReading = true
      const writeSpy = vi.fn().mockRejectedValue(new Error('denied'))
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: writeSpy },
      })
      const copyBtn = wrapper.findAll('button').find((b) => b.text().includes('Chép lời giải'))
      expect(copyBtn).toBeDefined()
      await copyBtn!.trigger('click')
      await Promise.resolve()
      await nextTick()
      expect(copyBtn!.text()).toContain('Chép lời giải')

      // Clipboard success updates confirmation state cleanly
      writeSpy.mockResolvedValue(undefined)
      await copyBtn!.trigger('click')
      await Promise.resolve()
      await nextTick()
      expect(copyBtn!.text()).toContain('Đã chép lời giải')

      // Reset board, then restore from journal, then clear journal
      const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Đặt lại bộ bài'))
      await resetBtn!.trigger('click')
      await nextTick()
      expect(wrapper.find('.spread-stage').exists()).toBe(false)

      await wrapper.get('.journal-row').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.card-slot')).toHaveLength(3)

      await wrapper.get('.clear-journal-btn').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.journal-row')).toHaveLength(0)

      wrapper.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('MiniPianoView records, saves, copies, and deletes custom melody and scores challenge combo', async () => {
    const pinia = setupPinia()
    const wrapper = mount(MiniPianoView, {
      global: { plugins: [pinia], stubs: MOUNT_STUBS },
    })

    // Start recording, hit 2 white keys, stop recording
    await wrapper.get('.rec-btn').trigger('click')
    const whiteKeys = wrapper.findAll('.white-key')
    await whiteKeys[0].trigger('mousedown')
    await whiteKeys[4].trigger('mousedown')
    await wrapper.get('.rec-btn').trigger('click')
    await nextTick()

    await wrapper.get('.melody-name-input').setValue('Giai Điệu Test')
    const saveBtn = wrapper.findAll('.save-rec-btn').find((b) => b.text().includes('Lưu'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')
    await nextTick()
    expect(wrapper.find('.saved-melodies-bar').text()).toContain('Giai Điệu Test')

    // Copy recorded melody text (needs fresh note if save cleared? No, save keeps recordedNotes)
    const copyNotesBtn = wrapper.findAll('.save-rec-btn').find((b) => b.text().includes('Chép nốt'))
    expect(copyNotesBtn).toBeDefined()
    await copyNotesBtn!.trigger('click')
    await Promise.resolve()
    await nextTick()
    expect(copyNotesBtn!.text()).toContain('Đã chép')

    // Delete saved melody
    await wrapper.get('.saved-del').trigger('click')
    await nextTick()
    expect(wrapper.find('.saved-melodies-bar').exists()).toBe(false)

    // Challenge mode: click hinted key -> score > 0 & combo === 1, click black key -> miss resets combo
    const challengeBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Thử thách giai điệu'))
    await challengeBtn!.trigger('click')
    await nextTick()
    await wrapper.get('.white-key.hint').trigger('mousedown')
    await nextTick()
    expect(wrapper.find('.challenge-hud').text()).toContain('115')
    await wrapper.get('.black-key').trigger('mousedown')
    await nextTick()
    expect(wrapper.find('.challenge-hud').text()).toContain('0 🔥')

    wrapper.unmount()
  })

  it('ColorGameView handles copy code, Time Attack countdown completion, and clean timer teardown', async () => {
    vi.useFakeTimers()
    try {
      const pinia = setupPinia()
      const wrapper = mount(ColorGameView, {
        global: { plugins: [pinia], stubs: MOUNT_STUBS },
      })

      await wrapper.get('.copy-code-btn').trigger('click')
      await Promise.resolve()
      await nextTick()
      expect(wrapper.get('.copy-code-btn').text()).toContain('Đã chép')

      const taBtn = wrapper.findAll('button').find((b) => b.text().includes('Time Attack'))
      expect(taBtn).toBeDefined()
      await taBtn!.trigger('click')
      await nextTick()

      // First pick starts 45s countdown ticker
      await wrapper.get('.color-tile').trigger('click')
      await vi.advanceTimersByTimeAsync(50_000)
      await nextTick()

      expect(wrapper.find('.summary-card').exists()).toBe(true)
      expect(wrapper.text()).toContain('HẾT GIỜ TIME ATTACK')
      wrapper.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('NeonTypingView scores matching words, ends Sudden Death after 3 mistakes, and copies result card', async () => {
    const pinia = setupPinia()
    const wrapper = mount(NeonTypingView, {
      global: { plugins: [pinia], stubs: MOUNT_STUBS },
    })

    const sdBtn = wrapper.findAll('button').find((b) => b.text().includes('Sudden Death'))
    expect(sdBtn).toBeDefined()
    await sdBtn!.trigger('click')
    await nextTick()

    const input = wrapper.get('.input-wrap input')
    const currentWord = wrapper.findAll('.target-word .char').map((c) => c.text()).join('')
    await input.setValue(`${currentWord} `)
    await nextTick()
    expect(wrapper.find('.recent-word.ok').text()).toBe(currentWord)

    // Make 3 wrong word submissions to exhaust all 3 Sudden Death hearts
    for (let i = 0; i < 3; i++) {
      await input.setValue('__wrong_word__ ')
      await nextTick()
    }

    expect(wrapper.find('.result-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('1 / 4')

    await wrapper.get('.cta-copy').trigger('click')
    await Promise.resolve()
    await nextTick()
    expect(wrapper.get('.cta-copy').text()).toContain('Đã chép')
    wrapper.unmount()
  })
})
