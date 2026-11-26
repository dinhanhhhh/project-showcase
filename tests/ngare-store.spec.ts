import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it } from 'vitest'
import { useNgareStore } from '@/stores/ngare'

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
})
