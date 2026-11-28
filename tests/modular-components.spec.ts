import { RouterLinkStub, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyTextWithFallback } from '@/utils/clipboard'
import ChessHistoryPanel from '@/views/co-tuong/components/ChessHistoryPanel.vue'
import ColorChannelBars from '@/views/color-game/components/ColorChannelBars.vue'
import { createSwatch } from '@/views/color-game/engine'
import FoodAddForm from '@/views/hom-nay-an-gi/components/FoodAddForm.vue'
import HomeAppCard from '@/views/home/components/HomeAppCard.vue'
import PianoKeyboard from '@/views/mini-piano/components/PianoKeyboard.vue'
import { getKeysForOctave } from '@/views/mini-piano/engine'
import TypingHistoryChart from '@/views/neon-typing/components/TypingHistoryChart.vue'
import LifeRecapScreen from '@/views/ngare/components/LifeRecapScreen.vue'
import NgareHallOfFame from '@/views/ngare/components/NgareHallOfFame.vue'
import { computeLifeRecap } from '@/views/ngare/engine'
import type { GameState } from '@/views/ngare/types'
import OopQuizPanel from '@/views/oop-flashcards/components/OopQuizPanel.vue'
import OracleJournalSection from '@/views/oracle-tarot/components/OracleJournalSection.vue'

describe('Modular Extracted Components & Clipboard Helper', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('copyTextWithFallback resolves safely when Clipboard API hangs or rejects', async () => {
    expect(await copyTextWithFallback('')).toBe(false)

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    })
    // JSDOM does not implement execCommand natively; ensure no uncaught error is thrown
    const ok = await copyTextWithFallback('Phao 2 binh 5', 20)
    expect(typeof ok).toBe('boolean')
  })

  it('OracleJournalSection emits restore and clear events', async () => {
    const entry = {
      id: 'r1',
      timestamp: '07:00',
      mode: 3 as const,
      question: 'Tương lai?',
      cards: [{ cardId: 'fool', name: 'Kẻ Khờ', image: '🌟', slotLabel: 'Quá khứ', reversed: false }],
    }
    const wrapper = mount(OracleJournalSection, {
      props: { history: [entry], viewingSavedId: null },
    })

    await wrapper.get('.journal-row').trigger('click')
    expect(wrapper.emitted('restore')?.[0]).toEqual([entry])

    await wrapper.get('.clear-journal-btn').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    wrapper.unmount()
  })

  it('ChessHistoryPanel renders stats, move history, and emits copy-notation', async () => {
    const wrapper = mount(ChessHistoryPanel, {
      props: {
        showStats: true,
        stats: { wins: 3, draws: 1, losses: 2 },
        moveHistory: [
          {
            from: { file: 1, rank: 7 },
            to: { file: 4, rank: 7 },
            piece: { id: 'r1', side: 'red', type: 'cannon', file: 1, rank: 7 },
            side: 'red',
            notation: 'Pháo 2 bình 5',
          },
        ],
        copiedNotation: false,
      },
    })

    expect(wrapper.text()).toContain('Pháo 2 bình 5')
    expect(wrapper.find('.stat-win').text()).toBe('3')
    await wrapper.get('.copy-notation-btn').trigger('click')
    expect(wrapper.emitted('copy-notation')).toHaveLength(1)
    wrapper.unmount()
  })

  it('OopQuizPanel renders options, feedback, and summary', async () => {
    const option = { id: 'o1', text: 'Encapsulation', isCorrect: true }
    const wrapper = mount(OopQuizPanel, {
      props: {
        quizDone: false,
        quizCorrect: 0,
        quizQuestionsLength: 4,
        quizAccuracyPercent: 0,
        currentQuiz: {
          cardId: 'c1',
          topicId: 1,
          difficulty: 'Cơ bản',
          question: 'Che giấu dữ liệu nội bộ gọi là gì?',
          answerTitle: 'Đóng gói',
          explanation: ['Ẩn thuộc tính private qua getter/setter.'],
          options: [option, { id: 'o2', text: 'Polymorphism', isCorrect: false }],
        },
        currentTopicTitle: '4 Trụ cột OOP',
        quizIndex: 0,
        selectedOptionId: null,
      },
    })

    await wrapper.get('.quiz-opt-btn').trigger('click')
    expect(wrapper.emitted('select-option')?.[0]).toEqual([option])
    wrapper.unmount()
  })

  it('FoodAddForm submits cleanly via emit', async () => {
    const wrapper = mount(FoodAddForm, {
      props: {
        name: 'Bún bò Huế',
        image: '',
        category: 'nuoc',
        emoji: '🍜',
        mealTime: 'sang',
        priceTier: 'vua-tui',
        emojiOptions: ['🍜', '🍛'],
        formError: '',
        formSuccess: '',
      },
    })

    await wrapper.get('form.add-form').trigger('submit')
    expect(wrapper.emitted('submit')).toHaveLength(1)
    wrapper.unmount()
  })

  it('TypingHistoryChart displays run history, average WPM, and emits clear-history', async () => {
    const wrapper = mount(TypingHistoryChart, {
      props: {
        history: [
          {
            id: 't1',
            wpm: 72,
            accuracy: 96,
            rank: 'S',
            mode: 'timed',
            pack: 'dev',
            timestamp: '07:15',
          },
        ],
        averageWpm: 72,
        maxHistoryWpm: 72,
      },
    })

    expect(wrapper.text()).toContain('TB 72 WPM')
    expect(wrapper.find('.bar-meta').text()).toBe('S')
    await wrapper.get('.clear-hist-btn').trigger('click')
    expect(wrapper.emitted('clear-history')).toHaveLength(1)
    wrapper.unmount()
  })

  it('PianoKeyboard renders 8 white keys, 5 black keys, and emits trigger-key', async () => {
    const { whiteKeys, blackKeys } = getKeysForOctave(4)
    const wrapper = mount(PianoKeyboard, {
      props: {
        whiteKeys,
        blackKeys,
        activeNotes: {},
        challengeCompleted: false,
        expectedPitchClass: 'C',
        wrongFlashNote: null,
      },
    })

    expect(wrapper.findAll('.white-key')).toHaveLength(8)
    expect(wrapper.findAll('.black-key')).toHaveLength(5)
    expect(wrapper.find('.white-key.hint').exists()).toBe(true)
    await wrapper.get('.white-key').trigger('mousedown')
    expect(wrapper.emitted('trigger-key')?.[0]?.[0]).toEqual(whiteKeys[0])
    wrapper.unmount()
  })

  it('ColorChannelBars switches between RGB and HSL channel readouts', async () => {
    const target = createSwatch(255, 128, 0)
    const wrapper = mount(ColorChannelBars, {
      props: {
        colorFormat: 'rgb',
        target,
      },
    })

    expect(wrapper.text()).toContain('R (Đỏ)')
    expect(wrapper.text()).toContain('100%')

    await wrapper.setProps({ colorFormat: 'hsl' })
    expect(wrapper.text()).toContain('H (Tông màu)')
    expect(wrapper.text()).toContain(`${target.hslValue.h}°`)
    wrapper.unmount()
  })

  it('HomeAppCard renders metadata, cover art in grid mode, and emits toggle-favorite', async () => {
    const wrapper = mount(HomeAppCard, {
      props: {
        page: {
          slug: 'color-game',
          name: 'Color Vision Game',
          description: 'Đoán mã màu RGB / HSL',
          category: 'game',
          path: '/color-game',
          author: 'Truong Dinh Anh',
        },
        visual: {
          icon: '🎨',
          accent: '#be185d',
          badge: 'Arcade',
          tags: ['RGB', 'HSL'],
        },
        cardAccent: '#be185d',
        categoryIcon: '🎮',
        categoryLabel: 'Trò chơi',
        isFavorite: false,
        viewMode: 'grid',
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    })

    expect(wrapper.find('.app-card').attributes('style')).toContain('#be185d')
    expect(wrapper.find('.cover-art').exists()).toBe(true)
    await wrapper.get('.fav-btn').trigger('click')
    expect(wrapper.emitted('toggle-favorite')?.[0]).toEqual(['color-game'])

    await wrapper.setProps({ viewMode: 'list' })
    expect(wrapper.find('.app-card.is-list').exists()).toBe(true)
    expect(wrapper.find('.cover-art').exists()).toBe(false)
    wrapper.unmount()
  })

  it('NgareHallOfFame sorts by totalScore or netWorth and filters by query', async () => {
    const entries = [
      {
        id: 'h1',
        name: 'Minh',
        careerName: 'Lập trình viên',
        careerEmoji: '💻',
        age: 60,
        endingId: 'tycoon',
        endingTitle: 'Đại Gia Công Nghệ',
        endingIcon: '👑',
        totalScore: 280,
        netWorth: 950,
        finishedAt: '28/11',
      },
      {
        id: 'h2',
        name: 'Lan',
        careerName: 'Bác sĩ',
        careerEmoji: '🩺',
        age: 62,
        endingId: 'zen',
        endingTitle: 'Hiền Triết Bình An',
        endingIcon: '🪷',
        totalScore: 340,
        netWorth: 420,
        finishedAt: '27/11',
      },
    ]

    const wrapper = mount(NgareHallOfFame, {
      props: { hallOfFame: entries },
    })

    // Mặc định xếp theo Điểm cao nhất (#1 Lan: 340)
    expect(wrapper.findAll('.hall-row')[0].text()).toContain('Lan')

    // Đổi sang sắp xếp theo Tài sản ròng (#1 Minh: 950)
    await wrapper.findAll('.sort-pill')[1].trigger('click')
    expect(wrapper.findAll('.hall-row')[0].text()).toContain('Minh')

    // Lọc theo tên / nghề
    await wrapper.get('.hall-search').setValue('Bác sĩ')
    expect(wrapper.findAll('.hall-row')).toHaveLength(1)
    expect(wrapper.find('.hall-row').text()).toContain('Lan')
    wrapper.unmount()
  })

  it('OopQuizPanel progresses through option selection, answer feedback, next emit, and done actions', async () => {
    const sampleQuestion = {
      cardId: '1.1',
      topicId: 1,
      difficulty: 'Cơ bản' as const,
      question: 'Encapsulation giải quyết vấn đề gì?',
      answerTitle: 'Đóng gói dữ liệu',
      explanation: ['Ẩn trạng thái nội bộ', 'Expose qua method công khai'],
      options: [
        { id: 'a', text: 'Ẩn trạng thái và bảo vệ invariant', isCorrect: true },
        { id: 'b', text: 'Tự động xóa RAM', isCorrect: false },
      ],
    }

    const wrapper = mount(OopQuizPanel, {
      props: {
        quizDone: false,
        quizCorrect: 0,
        quizQuestionsLength: 1,
        quizAccuracyPercent: 0,
        currentQuiz: sampleQuestion,
        currentTopicTitle: 'Encapsulation',
        quizIndex: 0,
        selectedOptionId: null,
      },
    })

    const optBtns = wrapper.findAll('.quiz-opt-btn')
    expect(optBtns).toHaveLength(2)
    await optBtns[0].trigger('click')
    expect(wrapper.emitted('select-option')?.[0]?.[0]).toEqual(sampleQuestion.options[0])

    await wrapper.setProps({ selectedOptionId: 'a' })
    expect(wrapper.find('.quiz-feedback').text()).toContain('Đóng gói dữ liệu')
    await wrapper.get('.quiz-next-btn').trigger('click')
    expect(wrapper.emitted('next-question')).toHaveLength(1)

    await wrapper.setProps({ quizDone: true, quizCorrect: 1, quizAccuracyPercent: 100 })
    expect(wrapper.get('.done-card').text()).toContain('1 / 1')
    await wrapper.get('.primary-cta').trigger('click')
    await wrapper.get('.secondary-cta').trigger('click')
    expect(wrapper.emitted('start-quiz')).toHaveLength(1)
    expect(wrapper.emitted('switch-flashcard')).toHaveLength(1)
    wrapper.unmount()
  })

  it('LifeRecapScreen renders 5 SVG chart traces across multi-year snapshots, copies recap, and emits restart', async () => {
    const writeSpy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeSpy },
    })

    const gameState: GameState = {
      name: 'Minh Khôi',
      careerId: 'programmer',
      careerName: 'Lập trình viên',
      careerEmoji: '💻',
      age: 60,
      year: 2064,
      stats: { money: 420, skill: 92, happiness: 85, stress: 22, health: 80, relationships: 76 },
      history: [{ age: 60, year: 2064, text: 'Nghỉ hưu an nhàn' }],
      currentLevel: 'CTO',
      salary: 65,
      achievements: [{ age: 40, text: '🏆 Đỉnh cao' }],
      unlockedAchievements: ['workaholic'],
      inventory: [],
      activeSkills: [],
      skillCooldowns: {},
      activeBuffs: [],
      statSnapshots: [
        { age: 22, money: 45, skill: 35, happiness: 60, stress: 25, health: 80, relationships: 50, netWorth: 45 },
        { age: 40, money: 210, skill: 78, happiness: 72, stress: 40, health: 75, relationships: 68, netWorth: 260 },
        { age: 60, money: 420, skill: 92, happiness: 85, stress: 22, health: 80, relationships: 76, netWorth: 500 },
      ],
      gameOver: true,
    }
    const ending = {
      id: 'dai_gia_cong_nghe',
      icon: '👑',
      title: 'Đại Gia Công Nghệ',
      subtitle: 'Làm chủ tương lai số',
      condition: 'Kỹ năng >= 90',
      isSpecial: true,
    }
    const recap = computeLifeRecap(gameState)

    const wrapper = mount(LifeRecapScreen, {
      props: { gameState, ending, recap },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.findAll('.life-svg polyline')).toHaveLength(5)
    expect(wrapper.text()).toContain('22 → 60 tuổi')

    const btns = wrapper.findAll('.end-actions button')
    await btns[1].trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('Minh Khôi'))
    expect(btns[1].text()).toContain('Đã chép hồ sơ')

    await btns[0].trigger('click')
    expect(wrapper.emitted('restart')).toHaveLength(1)
    wrapper.unmount()
  })
})
