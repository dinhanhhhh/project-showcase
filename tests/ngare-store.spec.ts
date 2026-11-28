import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNgareStore } from '@/stores/ngare'
import NgareView from '@/views/ngare/index.vue'

function activatePersistedPinia() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  createApp(() => null).use(pinia)
  setActivePinia(pinia)
}

describe('Ngare Pinia Store Persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('chỉ lưu gameState (không serialize class instance engine) và tự phục hồi Set usedEvents khi tải save cũ', async () => {
    activatePersistedPinia()
    const store1 = useNgareStore()
    await store1.startNewGame('Anh', 'programmer')
    await nextTick()

    const savedRaw = localStorage.getItem('ngare_game_state')
    expect(savedRaw).toBeTruthy()
    expect(savedRaw).not.toContain('"usedEvents"')

    // Mô phỏng dữ liệu save cũ từng bị pinia-plugin-persistedstate ghi đè engine thành plain object
    localStorage.setItem(
      'ngare_game_state',
      JSON.stringify({
        gameState: store1.gameState,
        engine: { state: store1.gameState, usedEvents: {} },
      }),
    )

    activatePersistedPinia()
    const store2 = useNgareStore()
    store2.loadFromStorage()
    await store2.engine.ensureData()
    const nextEvent = store2.engine.getNextEvent()

    expect(nextEvent).not.toBeNull()
    expect(store2.engine.usedEvents instanceof Set).toBe(true)
  })

  it('recovers gracefully when persisted state has partial fields or legacy shapes', async () => {
    localStorage.setItem(
      'ngare_game_state',
      JSON.stringify({
        gameState: {
          name: 'Legacy',
          careerId: 'programmer',
          age: 26,
          stats: { money: 40, happiness: 60, skill: 55, stress: 25 },
        },
      }),
    )

    activatePersistedPinia()
    const store = useNgareStore()
    store.loadFromStorage()
    await store.engine.ensureData()

    expect(store.engine.usedEvents instanceof Set).toBe(true)
    const ev = store.engine.getNextEvent()
    expect(ev).not.toBeNull()
  })

  it('resets active game state and clears saved game via resetGame()', async () => {
    activatePersistedPinia()
    const store = useNgareStore()
    await store.startNewGame('Reset Tester', 'programmer')
    await nextTick()
    expect(store.gameState).not.toBeNull()

    store.resetGame()
    await nextTick()
    expect(store.gameState).toBeNull()
    expect(store.engine.state).toBeNull()
  })

  it('syncs item purchases, assets, yearly actions, and usedEventIds cleanly across store reload', async () => {
    activatePersistedPinia()
    const store1 = useNgareStore()
    await store1.startNewGame('Investor', 'programmer', 'privileged')
    await nextTick()

    expect(store1.gameState?.stats.money).toBe(80) // 45 + 35 (privileged)
    store1.gameState!.age = 25 // investment_course yêu cầu tối thiểu 25 tuổi
    const bought = await store1.buyItem('investment_course') // cost 20 -> 60
    expect(bought.success).toBe(true)
    const assetBuy = await store1.buyAsset('savings') // cost 30 -> 30
    expect(assetBuy.success).toBe(true)
    const actionRes = await store1.performYearlyAction('side_hustle') // +16 -> 46
    expect(actionRes.success).toBe(true)
    expect(store1.gameState?.stats.money).toBe(46)

    await nextTick()
    activatePersistedPinia()
    const store2 = useNgareStore()
    store2.loadFromStorage()
    expect(store2.gameState?.inventory).toContain('investment_course')
    expect(store2.gameState?.assets?.[0]?.units).toBe(1)
    expect(store2.gameState?.yearlyActionUsed).toBe(true)
  })

  it('persists unlockedEndings, Hall of Fame ranking, and migrates legacy ngare_endings', async () => {
    localStorage.setItem('ngare_endings', JSON.stringify(['binh_di']))
    activatePersistedPinia()
    const store = useNgareStore()
    store.loadFromStorage()
    expect(store.unlockedEndings).toContain('binh_di')

    await store.startNewGame('Legend', 'business')
    store.gameState!.age = 60
    store.gameState!.stats.money = 320
    const ending = {
      id: 'ty_phu_tu_than',
      icon: '💎',
      title: 'Tỷ Phú Tự Thân',
      subtitle: 'Tự do tài chính',
      condition: '>= 500',
      isSpecial: true,
    }
    const newlyUnlocked = store.recordCompletedLife(ending)
    expect(newlyUnlocked).toBe(true)
    expect(store.unlockedEndings).toContain('ty_phu_tu_than')
    expect(store.hallOfFame).toHaveLength(1)
    expect(store.hallOfFame[0].name).toBe('Legend')
  })

  it('mounts NgareView, navigates EndingsGalleryModal -> character creation -> Shop & Inventory modals -> first choice', async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    setActivePinia(pinia)

    const wrapper = mount(NgareView, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    // 1. Open and close EndingsGalleryModal from intro screen
    const galleryBtn = wrapper.findAll('button').find((b) => b.text().includes('Kết Cục'))
    expect(galleryBtn).toBeDefined()
    await galleryBtn!.trigger('click')
    expect(wrapper.find('[aria-label="Bộ sưu tập kết cục và Bảng vàng"]').exists()).toBe(true)
    await wrapper.get('[aria-label="Đóng"]').trigger('click')
    expect(wrapper.find('[aria-label="Bộ sưu tập kết cục và Bảng vàng"]').exists()).toBe(false)

    // 2. Navigate to character creation screen, pick trait & start life
    const startBtn = wrapper.findAll('button').find((b) => b.text().includes('Bắt Đầu Hành Trình'))
    expect(startBtn).toBeDefined()
    await startBtn!.trigger('click')
    await wrapper.get('#ngare-name').setValue('An')
    const traitChips = wrapper.findAll('.trait-chip')
    if (traitChips.length > 1) {
      await traitChips[1].trigger('click')
    }
    const launchBtn = wrapper.findAll('button').find((b) => b.text().includes('Bắt Đầu Cuộc Đời'))
    expect(launchBtn).toBeDefined()
    await launchBtn!.trigger('click')
    await flushPromises()

    const store = useNgareStore()
    expect(store.gameState?.name).toBe('An')
    expect(store.gameState?.age).toBe(22)

    // 3. Open and close ShopSkillModal & InventoryModal
    await wrapper.get('[aria-label="Mở cửa hàng và đầu tư"]').trigger('click')
    expect(wrapper.find('[aria-label="Cửa hàng và Đầu tư"]').exists()).toBe(true)
    await wrapper.get('[aria-label="Đóng"]').trigger('click')
    expect(wrapper.find('[aria-label="Cửa hàng và Đầu tư"]').exists()).toBe(false)

    await wrapper.get('[aria-label="Mở túi đồ và thành tựu"]').trigger('click')
    expect(wrapper.find('[aria-label="Túi đồ, Kỹ năng và Thành tựu"]').exists()).toBe(true)
    await wrapper.get('[aria-label="Đóng"]').trigger('click')
    expect(wrapper.find('[aria-label="Túi đồ, Kỹ năng và Thành tựu"]').exists()).toBe(false)

    // 4. Pick first event choice and verify age advances to 23
    const firstChoice = wrapper.find('.choice-btn')
    expect(firstChoice.exists()).toBe(true)
    await firstChoice.trigger('click')
    await flushPromises()
    expect(store.gameState?.age).toBe(23)

    wrapper.unmount()
    vi.restoreAllMocks()
  })

  it('renders 2-column choice grid for >= 3 choices and displays unemployed warning pill + free reapply in Shop', async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    setActivePinia(pinia)

    const store = useNgareStore()
    await store.startNewGame('Layoff UI Tester', 'programmer')
    // Set age to 49 before loading view or trigger milestone 50 and unemployed flag
    store.gameState!.age = 50
    store.gameState!.flags = ['unemployed']
    store.gameState!.currentLevel = 'Đang thất nghiệp'
    store.gameState!.salary = 0

    const wrapper = mount(NgareView, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    const loadBtn = wrapper.findAll('button').find((b) => b.text().includes('Tiếp Tục Ván Đã Lưu'))
    expect(loadBtn).toBeDefined()
    await loadBtn!.trigger('click')
    await flushPromises()

    // Age 50 loads ms_50 (3 choices) -> .event-choices must have .is-multi and .is-three
    const choicesBox = wrapper.find('.event-choices')
    expect(choicesBox.exists()).toBe(true)
    expect(choicesBox.classes()).toContain('is-multi')
    expect(choicesBox.classes()).toContain('is-three')
    expect(wrapper.findAll('.choice-btn')).toHaveLength(3)

    // Dashboard shows unemployed warning pill and career header shows unemployed status
    expect(wrapper.find('.danger-pill').text()).toContain('Đang thất nghiệp')
    expect(wrapper.find('.player-career.unemployed').exists()).toBe(true)

    // Open Shop -> Invest tab -> shows free reapply for programmer
    await wrapper.get('[aria-label="Mở cửa hàng và đầu tư"]').trigger('click')
    const investTab = wrapper.findAll('.tab-btn').find((b) => b.text().includes('Đầu Tư & Nghề'))
    expect(investTab).toBeDefined()
    await investTab!.trigger('click')
    expect(wrapper.text()).toContain('Ứng tuyển lại · Miễn phí')

    wrapper.unmount()
    vi.restoreAllMocks()
  })
})
