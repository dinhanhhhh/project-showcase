<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useNgareStore } from '@/stores/ngare'
import { isEditableEventTarget } from '@/utils/keyboard'
import { useNgareAudio } from './composables/useNgareAudio'
import { CHARACTER_TRAITS } from './data/traits'
import { UNEMPLOYED_TITLE, clampStatValue, computeLifeRecap, computeNetWorth } from './engine'
import {
  getNextCareerLevel,
  loadGameData,
  type ActiveSkill,
  type AssetId,
  type Choice,
  type EndingDefinition,
  type GameDataJson,
  type GameEvent,
  type PassiveItem,
  type Stats,
  type TraitId,
} from './game-data'
import EndingsGalleryModal from './components/EndingsGalleryModal.vue'
import InventoryModal from './components/InventoryModal.vue'
import LifeRecapScreen from './components/LifeRecapScreen.vue'
import ShopSkillModal from './components/ShopSkillModal.vue'
import StatsDashboard from './components/StatsDashboard.vue'
import YearlyActionsBar from './components/YearlyActionsBar.vue'

const ngareStore = useNgareStore()
const {
  playChoice,
  playCoin,
  playLevelUp,
  playAchievement,
  playWarning,
  playEnding,
  cleanup: cleanupAudio,
} = useNgareAudio()

const currentScreen = ref<'intro' | 'create' | 'game' | 'end'>('intro')
const gameData = ref<GameDataJson | null>(null)
const currentEvent = ref<GameEvent | null>(null)
const charNameInput = ref('')
const selectedCareerId = ref('programmer')
const selectedTraitId = ref<TraitId>('balanced')

const isShopOpen = ref(false)
const isInventoryOpen = ref(false)
const isMenuOpen = ref(false)
const isGalleryOpen = ref(false)
const isSidebarCollapsed = ref(false)
const previewModalEvent = ref<GameEvent | null>(null)
const confirmingDeleteSave = ref(false)
const confirmingRestart = ref(false)

const toasts = ref<Array<{ id: number; message: string; type: 'info' | 'positive' | 'negative' }>>([])
const statDeltas = ref<Partial<Record<string, number>> | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const activeTimers = new Set<ReturnType<typeof setTimeout>>()
let stopParticles: (() => void) | null = null

const gameState = computed(() => ngareStore.gameState)
const lifeRecap = computed(() => (gameState.value ? computeLifeRecap(gameState.value) : null))
const hasSavedGame = computed(() => Boolean(ngareStore.gameState && !ngareStore.gameState.gameOver))

const currentEnding = computed<EndingDefinition>(() => ngareStore.engine.calculateEnding())

const isUnemployed = computed(() => Boolean(gameState.value?.flags?.includes('unemployed')))

const nextLevelTooltip = computed(() => {
  if (!gameState.value || !gameData.value) return ''
  if (isUnemployed.value) {
    return 'Đang thất nghiệp (Lương 0). Có thể mở Cửa hàng → Đầu tư & Nghề để tìm việc mới.'
  }
  const next = getNextCareerLevel(
    gameState.value.careerId,
    gameState.value.stats.skill,
    gameData.value.careers,
    {
      relationships: gameState.value.stats.relationships,
      netWorth: computeNetWorth(gameState.value),
      age: gameState.value.age,
    },
  )
  if (!next) return 'Đã đạt cấp bậc cao nhất của ngành!'
  const reqs = [`Kỹ năng ≥ ${next.minSkill}`]
  if (next.minRelationships !== undefined) reqs.push(`Quan hệ ≥ ${next.minRelationships}`)
  if (next.minNetWorth !== undefined) reqs.push(`Tài sản ròng ≥ ${next.minNetWorth}`)
  if (next.minAge !== undefined) reqs.push(`Tuổi ≥ ${next.minAge}`)
  return `Cấp tiếp theo: ${next.title} (${reqs.join(' · ')})`
})

const careerPreview = computed(() => {
  if (!selectedCareerId.value || !gameData.value) return null
  return gameData.value.careers[selectedCareerId.value] ?? null
})

const previewCombinedStats = computed<Stats | null>(() => {
  if (!careerPreview.value) return null
  const trait = CHARACTER_TRAITS.find((t) => t.id === selectedTraitId.value) ?? CHARACTER_TRAITS[0]
  const base: Stats = { ...careerPreview.value.startStats }
  for (const [k, delta] of Object.entries(trait.statModifiers)) {
    if (typeof delta === 'number' && base[k] !== undefined) {
      base[k] = clampStatValue(k, base[k] + delta)
    }
  }
  return base
})

function scheduleTimer(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
  const id = setTimeout(() => {
    activeTimers.delete(id)
    fn()
  }, ms)
  activeTimers.add(id)
  return id
}

function showToast(message: string, type: 'info' | 'positive' | 'negative' = 'info') {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type })
  scheduleTimer(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3000)
}

function getStatName(stat: string): string {
  const names: Record<string, string> = {
    money: 'Tiền mặt',
    skill: 'Kỹ năng',
    happiness: 'Hạnh phúc',
    stress: 'Áp lực',
    health: 'Sức khỏe',
    relationships: 'Quan hệ',
  }
  return names[stat] ?? stat
}

function flashDeltas(deltas: Partial<Record<string, number>> | undefined) {
  if (!deltas || Object.keys(deltas).length === 0) return
  statDeltas.value = deltas
  scheduleTimer(() => {
    statDeltas.value = null
  }, 2200)
}

async function startNewGame() {
  if (!charNameInput.value.trim()) {
    showToast('Vui lòng nhập tên nhân vật!', 'negative')
    return
  }
  if (!selectedCareerId.value) {
    showToast('Vui lòng chọn nghề nghiệp!', 'negative')
    return
  }
  await ngareStore.startNewGame(
    charNameInput.value.trim(),
    selectedCareerId.value,
    selectedTraitId.value,
  )
  currentEvent.value = ngareStore.engine.getNextEvent()
  currentScreen.value = 'game'
  playChoice(ngareStore.soundEnabled)
  window.scrollTo({ top: 0, behavior: 'instant' })
}

async function loadGame() {
  await ngareStore.engine.ensureData()
  ngareStore.loadFromStorage()
  if (ngareStore.gameState) {
    currentEvent.value = ngareStore.engine.getNextEvent()
    currentScreen.value = ngareStore.gameState.gameOver ? 'end' : 'game'
    showToast('Đã khôi phục hành trình trước đó!', 'info')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}

async function handleChoice(choice: Choice) {
  if (!gameState.value) return
  const prevLevel = gameState.value.currentLevel
  const prevAchCount = gameState.value.unlockedAchievements.length

  const result = await ngareStore.makeChoice(choice)
  if (!result) return

  if (choice.result) {
    showToast(choice.result, 'info')
  }
  flashDeltas(result.lastDeltas)

  if (result.gameOver) {
    const ending = ngareStore.engine.calculateEnding()
    const isNegative =
      ending.id === 'pha_san' ||
      ending.id === 'benh_tat' ||
      ending.id === 'luc_bat_tong_tam' ||
      ending.id === 'hoan_toan_guc_nga' ||
      ending.id === 'ket_thuc_dot_ngot'
    playEnding(ngareStore.soundEnabled, isNegative)
    const isNewEnding = ngareStore.recordCompletedLife(ending)
    currentScreen.value = 'end'
    if (isNewEnding) {
      scheduleTimer(() => {
        showToast(`🏆 Mở khóa kết cục mới: ${ending.title}`, 'positive')
      }, 650)
    }
    return
  }

  if (result.unlockedAchievements.length > prevAchCount) {
    playAchievement(ngareStore.soundEnabled)
    showToast('🎉 Đạt thành tựu mới!', 'positive')
  } else if (result.currentLevel === UNEMPLOYED_TITLE && prevLevel !== UNEMPLOYED_TITLE) {
    playWarning(ngareStore.soundEnabled)
    showToast('📉 Bạn đã mất việc! Chức danh chuyển sang Đang thất nghiệp (Lương 0)', 'negative')
  } else if (prevLevel === UNEMPLOYED_TITLE && result.currentLevel !== UNEMPLOYED_TITLE) {
    playLevelUp(ngareStore.soundEnabled)
    showToast(`💼 Đã có việc trở lại: ${result.currentLevel}!`, 'positive')
  } else if (result.currentLevel !== prevLevel && result.currentLevel !== UNEMPLOYED_TITLE) {
    playLevelUp(ngareStore.soundEnabled)
    showToast(`📈 Thăng tiến: ${result.currentLevel}!`, 'positive')
  } else if (result.stats.stress >= 80 || result.stats.health <= 20) {
    playWarning(ngareStore.soundEnabled)
  } else {
    playChoice(ngareStore.soundEnabled)
  }

  currentEvent.value = ngareStore.engine.getNextEvent()
  if (ngareStore.gameState && ngareStore.engine.state?.lastNotice) {
    ngareStore.loadFromStorage()
    showToast(ngareStore.engine.state.lastNotice, 'positive')
  }
}

async function handleYearlyAction(actionId: string) {
  const res = await ngareStore.performYearlyAction(actionId)
  if (res.success) {
    playCoin(ngareStore.soundEnabled)
    flashDeltas(ngareStore.gameState?.lastDeltas)
    showToast(res.message, 'positive')
    if (ngareStore.gameState?.gameOver) {
      const ending = ngareStore.engine.calculateEnding()
      ngareStore.recordCompletedLife(ending)
      currentScreen.value = 'end'
    }
  } else {
    showToast(res.message, 'negative')
  }
}

async function handleBuyItem(item: PassiveItem) {
  const res = await ngareStore.buyItem(item.id)
  if (res.success) playCoin(ngareStore.soundEnabled)
  showToast(res.message, res.success ? 'positive' : 'negative')
}

async function handleBuySkill(skill: ActiveSkill) {
  const res = await ngareStore.buySkill(skill.id)
  if (res.success) playCoin(ngareStore.soundEnabled)
  showToast(res.message, res.success ? 'positive' : 'negative')
}

async function handleBuyAsset(assetId: AssetId) {
  const res = await ngareStore.buyAsset(assetId)
  if (res.success) playCoin(ngareStore.soundEnabled)
  showToast(res.message, res.success ? 'positive' : 'negative')
}

async function handleSellAsset(assetId: AssetId) {
  const res = await ngareStore.sellAsset(assetId)
  if (res.success) playCoin(ngareStore.soundEnabled)
  showToast(res.message, res.success ? 'positive' : 'negative')
}

async function handleSwitchCareer(careerId: string) {
  const res = await ngareStore.switchCareer(careerId)
  if (res.success) {
    playLevelUp(ngareStore.soundEnabled)
    isShopOpen.value = false
  }
  showToast(res.message, res.success ? 'positive' : 'negative')
}

async function handleUseSkill(skillId: string) {
  const res = await ngareStore.useSkill(skillId)
  if (res.success) {
    playAchievement(ngareStore.soundEnabled)
    showToast(`⚡ ${res.message}`, 'info')
    if ('isPreview' in res && res.isPreview && 'previewEvent' in res && res.previewEvent) {
      previewModalEvent.value = res.previewEvent
      isInventoryOpen.value = false
    }
    if (skillId === 'skill_time_rewind' && gameState.value) {
      currentEvent.value = ngareStore.engine.getNextEvent()
    }
  } else {
    showToast(`❌ ${res.message}`, 'negative')
  }
}

function saveGame() {
  showToast('💾 Đã lưu tự động vào trình duyệt!', 'info')
  isMenuOpen.value = false
}

function deleteSaveGame() {
  if (!confirmingDeleteSave.value) {
    confirmingDeleteSave.value = true
    showToast('Bấm lại "Xóa Save" trong 4s để xác nhận', 'info')
    scheduleTimer(() => {
      confirmingDeleteSave.value = false
    }, 4000)
    return
  }
  confirmingDeleteSave.value = false
  ngareStore.resetGame()
  showToast('Đã xóa dữ liệu ván chơi hiện tại!', 'info')
}

function restartGame() {
  if (currentScreen.value !== 'end' && !confirmingRestart.value) {
    confirmingRestart.value = true
    showToast('Bấm lại "Chơi Lại" trong 4s để bắt đầu ván mới', 'info')
    scheduleTimer(() => {
      confirmingRestart.value = false
    }, 4000)
    return
  }
  confirmingRestart.value = false
  ngareStore.resetGame()
  currentScreen.value = 'intro'
  currentEvent.value = null
  isMenuOpen.value = false
}

function getMilestoneBadge(text: string): string {
  if (text.includes('Thăng tiến') || text.includes('Chuyển ngành')) return 'ms-promo'
  if (text.includes('thành tựu') || text.includes('Thành tựu')) return 'ms-ach'
  if (text.includes('Khiên bảo vệ')) return 'ms-shield'
  return ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (previewModalEvent.value) {
      previewModalEvent.value = null
      return
    }
    if (isGalleryOpen.value) {
      isGalleryOpen.value = false
      return
    }
    if (isShopOpen.value) {
      isShopOpen.value = false
      return
    }
    if (isInventoryOpen.value) {
      isInventoryOpen.value = false
      return
    }
    if (isMenuOpen.value) {
      isMenuOpen.value = false
      return
    }
  }

  if (
    currentScreen.value !== 'game' ||
    isShopOpen.value ||
    isInventoryOpen.value ||
    isMenuOpen.value ||
    isGalleryOpen.value ||
    previewModalEvent.value
  ) {
    return
  }
  if (e.ctrlKey || e.metaKey || e.altKey || isEditableEventTarget(e.target)) return

  const index = Number(e.key) - 1
  if (index >= 0 && index < (currentEvent.value?.choices.length ?? 0)) {
    const choice = currentEvent.value?.choices[index]
    if (choice) void handleChoice(choice)
  }
}

function initParticles(): () => void {
  const canvas = canvasRef.value
  if (!canvas) return () => {}
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return () => {}
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  let animId = 0
  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const particles = Array.from({ length: 28 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    size: Math.random() * 2 + 0.8,
  }))

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const rgb =
      getComputedStyle(document.documentElement).getPropertyValue('--particle-rgb').trim() ||
      '109, 221, 255'
    ctx.fillStyle = `rgba(${rgb}, 0.22)`
    for (const p of particles) {
      p.x = (p.x + p.vx + canvas.width) % canvas.width
      p.y = (p.y + p.vy + canvas.height) % canvas.height
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    animId = window.requestAnimationFrame(render)
  }
  render()

  return () => {
    window.cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
  }
}

onMounted(async () => {
  gameData.value = await loadGameData()
  ngareStore.loadFromStorage()
  stopParticles = initParticles()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopParticles?.()
  for (const id of activeTimers) {
    clearTimeout(id)
  }
  activeTimers.clear()
  cleanupAudio()
})
</script>

<template>
  <div class="ngare-wrapper">
    <canvas
      ref="canvasRef"
      class="bg-particles"
      aria-hidden="true"
    />

    <!-- INTRO SCREEN -->
    <div
      v-if="currentScreen === 'intro'"
      class="screen-center"
    >
      <div class="intro-card">
        <RouterLink
          to="/"
          class="intro-back"
        >
          ← Về Launcher
        </RouterLink>
        <div class="intro-badge">
          ✨ Phiên bản Nâng cấp · 83 Sự Kiện & 15 Kết Cục
        </div>
        <h1 class="intro-title">
          Ngã Rẽ Cuộc Đời
        </h1>
        <p class="intro-subtitle">
          Từ tuổi 22 tốt nghiệp đến tuổi 60 nghỉ hưu: chọn xuất thân, xây dựng sự nghiệp, đầu tư tài sản,
          vượt qua biến cố cốt truyện đa nhánh và khắc tên lên Bảng Vàng.
        </p>

        <div class="intro-pills">
          <span>🚀 4 Chuỗi Cốt Truyện</span>
          <span>📈 Đầu Tư & Chu Kỳ Thị Trường</span>
          <span>🎭 5 Tính Cách Khởi Đầu</span>
          <span>🏆 12 Thành Tựu</span>
        </div>

        <div class="intro-actions">
          <button
            type="button"
            class="btn-main"
            @click="currentScreen = 'create'"
          >
            Bắt Đầu Hành Trình →
          </button>
          <div class="intro-sub-actions">
            <button
              v-if="hasSavedGame"
              type="button"
              class="btn-ghost"
              @click="loadGame"
            >
              📂 Tiếp Tục Ván Đã Lưu
            </button>
            <button
              type="button"
              class="btn-ghost"
              @click="isGalleryOpen = true"
            >
              📚 Kết Cục ({{ ngareStore.unlockedEndings.length }}/15) & Bảng Vàng
            </button>
            <button
              v-if="hasSavedGame"
              type="button"
              class="btn-danger"
              @click="deleteSaveGame"
            >
              {{ confirmingDeleteSave ? '⚠️ Bấm lại để xóa save' : '🗑️ Xóa Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CREATE SCREEN -->
    <div
      v-else-if="currentScreen === 'create'"
      class="screen-center"
    >
      <div class="create-card">
        <div class="create-head">
          <button
            type="button"
            class="btn-icon-sm"
            @click="currentScreen = 'intro'"
          >
            ← Quay lại
          </button>
          <h2>Tạo Nhân Vật</h2>
          <RouterLink
            to="/"
            class="btn-icon-sm"
          >
            🏠 Launcher
          </RouterLink>
        </div>

        <div class="create-grid">
          <div class="create-left">
            <div class="field-box">
              <label for="ngare-name">Tên nhân vật</label>
              <input
                id="ngare-name"
                v-model="charNameInput"
                type="text"
                maxlength="24"
                placeholder="Nhập tên của bạn..."
                autocomplete="off"
                @keyup.enter="startNewGame"
              >
            </div>

            <div class="field-box">
              <span class="field-lbl">Chọn ngành nghề khởi điểm</span>
              <div class="career-grid">
                <button
                  v-for="career in Object.values(gameData?.careers ?? {})"
                  :key="career.id"
                  type="button"
                  class="pick-card"
                  :class="{ selected: selectedCareerId === career.id }"
                  @click="selectedCareerId = career.id"
                >
                  <span class="pick-emoji">{{ career.emoji }}</span>
                  <strong>{{ career.name }}</strong>
                </button>
              </div>
            </div>

            <div class="field-box">
              <span class="field-lbl">Chọn xuất thân / tính cách</span>
              <div class="trait-grid">
                <button
                  v-for="trait in CHARACTER_TRAITS"
                  :key="trait.id"
                  type="button"
                  class="trait-chip"
                  :class="{ selected: selectedTraitId === trait.id }"
                  :title="trait.description"
                  @click="selectedTraitId = trait.id"
                >
                  <span>{{ trait.emoji }} {{ trait.name }}</span>
                </button>
              </div>
              <p class="trait-desc">
                {{ CHARACTER_TRAITS.find((t) => t.id === selectedTraitId)?.description }}
              </p>
            </div>
          </div>

          <div
            v-if="careerPreview && previewCombinedStats"
            class="create-preview"
          >
            <div class="cp-head">
              <span class="cp-icon">{{ careerPreview.emoji }}</span>
              <div>
                <h3>{{ careerPreview.name }}</h3>
                <p>{{ careerPreview.description }}</p>
              </div>
            </div>
            <div class="cp-salary">
              Lương khởi điểm: <strong>💰 {{ careerPreview.salary }} / năm</strong>
            </div>
            <div class="cp-stats">
              <div
                v-for="(val, key) in previewCombinedStats"
                :key="String(key)"
                class="cp-stat"
              >
                <span>{{ getStatName(String(key)) }}</span>
                <strong>{{ val }}</strong>
              </div>
            </div>
            <button
              type="button"
              class="btn-main full"
              :disabled="!charNameInput.trim()"
              @click="startNewGame"
            >
              Bắt Đầu Cuộc Đời (Tuổi 22) →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- GAMEPLAY SCREEN -->
    <div
      v-else-if="currentScreen === 'game' && gameState"
      class="game-container"
    >
      <header class="game-header">
        <div class="header-left">
          <RouterLink
            to="/"
            class="btn-icon"
            title="Về Launcher"
            aria-label="Về Launcher"
          >
            🏠
          </RouterLink>
          <div class="player-info">
            <span class="player-name">{{ gameState.name }}</span>
            <span
              class="player-career"
              :class="{ unemployed: isUnemployed }"
              :title="nextLevelTooltip"
            >
              {{ gameState.careerEmoji }} {{ gameState.currentLevel }} · Lương {{ gameState.salary }}
            </span>
          </div>
        </div>

        <div class="header-center">
          <div class="age-pill">
            <span>Tuổi</span>
            <strong>{{ gameState.age }}</strong>
          </div>
          <div class="age-pill">
            <span>Năm</span>
            <strong>{{ gameState.year }}</strong>
          </div>
        </div>

        <div class="header-right">
          <button
            type="button"
            class="btn-icon"
            title="Cửa hàng & Đầu tư"
            aria-label="Mở cửa hàng và đầu tư"
            @click="isShopOpen = true"
          >
            🛒
          </button>
          <button
            type="button"
            class="btn-icon"
            title="Túi đồ & Thành tựu"
            aria-label="Mở túi đồ và thành tựu"
            @click="isInventoryOpen = true"
          >
            🎒
          </button>
          <button
            type="button"
            class="btn-icon"
            :title="ngareStore.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'"
            :aria-label="ngareStore.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'"
            @click="ngareStore.toggleSound()"
          >
            {{ ngareStore.soundEnabled ? '🔊' : '🔇' }}
          </button>
          <button
            type="button"
            class="btn-icon hide-mobile"
            :title="isSidebarCollapsed ? 'Hiện Nhật ký' : 'Ẩn Nhật ký'"
            aria-label="Bật tắt nhật ký"
            @click="isSidebarCollapsed = !isSidebarCollapsed"
          >
            📖
          </button>
          <button
            type="button"
            class="btn-icon"
            title="Menu"
            aria-label="Mở menu"
            @click="isMenuOpen = true"
          >
            ☰
          </button>
        </div>
      </header>

      <div
        class="game-layout"
        :class="{ collapsed: isSidebarCollapsed }"
      >
        <div class="game-main-col">
          <StatsDashboard
            :game-state="gameState"
            :stat-deltas="statDeltas"
          />

          <YearlyActionsBar
            :money="gameState.stats.money"
            :used-this-year="Boolean(gameState.yearlyActionUsed)"
            @perform="handleYearlyAction"
          />

          <div
            v-if="currentEvent"
            class="event-card"
          >
            <div class="event-badges">
              <span class="event-type">{{ currentEvent.type }}</span>
              <span
                v-if="currentEvent.arcLabel"
                class="arc-badge"
              >
                {{ currentEvent.arcLabel }}
              </span>
            </div>
            <h3 class="event-title">
              {{ currentEvent.title }}
            </h3>
            <p class="event-desc">
              {{ currentEvent.description }}
            </p>
            <div
              class="event-choices"
              :class="{
                'is-multi': currentEvent.choices.length >= 3,
                'is-three': currentEvent.choices.length === 3,
              }"
            >
              <button
                v-for="(choice, idx) in currentEvent.choices"
                :key="`${currentEvent.id}-${idx}`"
                type="button"
                class="choice-btn"
                @click="handleChoice(choice)"
              >
                <span class="choice-kbd">{{ idx + 1 }}</span>
                <span class="choice-icon">{{ choice.icon || '👉' }}</span>
                <div class="choice-text">
                  <strong>{{ choice.text }}</strong>
                  <span
                    v-if="choice.hint"
                    class="choice-hint"
                  >{{ choice.hint }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <aside
          v-if="!isSidebarCollapsed"
          class="timeline-col"
        >
          <div class="timeline-card">
            <h3>📜 Nhật Ký Cuộc Đời</h3>
            <div class="timeline-list">
              <div
                v-for="(entry, idx) in gameState.history"
                :key="`${entry.age}-${idx}`"
                class="timeline-row"
                :class="getMilestoneBadge(entry.text)"
              >
                <span class="tl-age">{{ entry.age }}t</span>
                <span class="tl-text">{{ entry.text }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- END SCREEN -->
    <div
      v-else-if="currentScreen === 'end' && gameState && lifeRecap"
      class="screen-center"
    >
      <LifeRecapScreen
        :game-state="gameState"
        :ending="currentEnding"
        :recap="lifeRecap"
        @restart="restartGame"
      />
    </div>

    <!-- MODALS -->
    <ShopSkillModal
      v-if="isShopOpen && gameState && gameData"
      :game-state="gameState"
      :game-data="gameData"
      @close="isShopOpen = false"
      @buy-item="handleBuyItem"
      @buy-skill="handleBuySkill"
      @buy-asset="handleBuyAsset"
      @sell-asset="handleSellAsset"
      @switch-career="handleSwitchCareer"
    />

    <InventoryModal
      v-if="isInventoryOpen && gameState && gameData"
      :game-state="gameState"
      :game-data="gameData"
      @close="isInventoryOpen = false"
      @use-skill="handleUseSkill"
    />

    <EndingsGalleryModal
      v-if="isGalleryOpen"
      :unlocked-endings="ngareStore.unlockedEndings"
      :hall-of-fame="ngareStore.hallOfFame"
      @close="isGalleryOpen = false"
    />

    <!-- ORACLE PREVIEW MODAL -->
    <div
      v-if="previewModalEvent"
      class="modal-overlay"
      @click.self="previewModalEvent = null"
    >
      <div
        class="menu-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Nhìn trước tương lai"
      >
        <h3>🔮 Thần Nhãn — Sự kiện năm tới</h3>
        <p class="preview-title">
          {{ previewModalEvent.type }} · {{ previewModalEvent.title }}
        </p>
        <p class="preview-desc">
          {{ previewModalEvent.description }}
        </p>
        <button
          type="button"
          class="btn-main full"
          @click="previewModalEvent = null"
        >
          ✓ Đã nắm bắt
        </button>
      </div>
    </div>

    <!-- MENU MODAL -->
    <div
      v-if="isMenuOpen"
      class="modal-overlay"
      @click.self="isMenuOpen = false"
    >
      <div
        class="menu-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Menu trò chơi"
      >
        <h3>⚙️ Tùy Chọn</h3>
        <button
          type="button"
          class="btn-ghost"
          @click="saveGame"
        >
          💾 Lưu Trạng Thái
        </button>
        <button
          type="button"
          class="btn-ghost"
          @click="isGalleryOpen = true; isMenuOpen = false"
        >
          📚 Kết Cục & Bảng Vàng
        </button>
        <button
          type="button"
          class="btn-danger"
          @click="restartGame"
        >
          {{ confirmingRestart ? '⚠️ Bấm lại để Chơi Lại' : '🔄 Chơi Lại Từ Đầu' }}
        </button>
        <RouterLink
          to="/"
          class="btn-ghost"
        >
          🏠 Về Trang Chủ Launcher
        </RouterLink>
        <button
          type="button"
          class="btn-ghost"
          @click="isMenuOpen = false"
        >
          ✕ Đóng
        </button>
      </div>
    </div>

    <!-- TOASTS -->
    <div
      class="toast-stack"
      aria-live="polite"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="toast.type"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.ngare-wrapper {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  position: relative;
  overflow-x: hidden;
  font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
}

.bg-particles {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.screen-center {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1rem;
}

/* INTRO */
.intro-card {
  width: 100%;
  max-width: 680px;
  background: var(--bg-card);
  border: 1px solid var(--outline-strong);
  border-radius: 24px;
  padding: 1.75rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  box-shadow: var(--shadow-card);
}

.intro-back {
  align-self: flex-start;
  padding: 0.36rem 0.78rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--primary);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 700;
}

.intro-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 99px;
  background: var(--primary-soft);
  border: 1px solid var(--outline-strong);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 700;
}

.intro-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  color: var(--primary);
}

.intro-subtitle {
  font-size: 0.94rem;
  color: var(--text-dim);
  max-width: 540px;
  line-height: 1.6;
}

.intro-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  justify-content: center;
}

.intro-pills span {
  padding: 0.3rem 0.7rem;
  border-radius: 99px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  font-size: 0.76rem;
  font-weight: 600;
}

.intro-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 0.35rem;
}

.intro-sub-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

/* BUTTONS */
.btn-main {
  padding: 0.82rem 1.4rem;
  border-radius: 14px;
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--text-inverse);
  font-size: 0.94rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s;
}

.btn-main.full {
  width: 100%;
}

.btn-main:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px var(--primary-glow);
}

.btn-main:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-ghost {
  padding: 0.6rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--outline);
  background: var(--bg-sidebar);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-ghost:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-danger {
  padding: 0.6rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--danger-border);
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

/* CREATE SCREEN */
.create-card {
  width: 100%;
  max-width: 960px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 22px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.create-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.create-head h2 {
  font-size: 1.2rem;
  font-weight: 800;
}

.btn-icon-sm {
  padding: 0.36rem 0.72rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
}

.create-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 1rem;
  align-items: start;
}

.create-left {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-box label,
.field-lbl {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-dim);
}

.field-box input {
  padding: 0.68rem 0.85rem;
  border-radius: 12px;
  background: var(--bg-input);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.92rem;
}

.field-box input:focus {
  outline: none;
  border-color: var(--primary);
}

.career-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.48rem;
}

.pick-card {
  padding: 0.6rem 0.45rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  font-size: 0.78rem;
}

.pick-card.selected {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
}

.pick-emoji {
  font-size: 1.4rem;
}

.trait-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.trait-chip {
  padding: 0.36rem 0.68rem;
  border-radius: 99px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.trait-chip.selected {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}

.trait-desc {
  font-size: 0.78rem;
  color: var(--text-dim);
}

.create-preview {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  border-radius: 18px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.cp-head {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.cp-icon {
  font-size: 2.2rem;
}

.cp-head h3 {
  font-size: 1.05rem;
  font-weight: 800;
}

.cp-head p {
  font-size: 0.82rem;
  color: var(--text-dim);
  margin-top: 0.2rem;
}

.cp-salary {
  font-size: 0.84rem;
  color: var(--warning);
}

.cp-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.cp-stat {
  display: flex;
  justify-content: space-between;
  padding: 0.45rem 0.65rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-size: 0.8rem;
}

/* GAMEPLAY */
.game-container {
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0.65rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 16px;
  padding: 0.5rem 0.8rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1 1 200px;
  min-width: 0;
}

.player-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.player-name {
  font-size: 0.94rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-career {
  font-size: 0.76rem;
  color: var(--primary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.player-career.unemployed {
  color: var(--danger);
}

.header-center {
  display: flex;
  gap: 0.45rem;
}

.age-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.age-pill span {
  font-size: 0.66rem;
  color: var(--text-dim);
  text-transform: uppercase;
}

.age-pill strong {
  font-size: 0.95rem;
  font-weight: 800;
}

.header-right {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--outline);
  background: var(--bg-sidebar);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  font-size: 1rem;
}

.btn-icon:hover {
  border-color: var(--primary);
}

.game-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 0.95rem;
  align-items: start;
}

.game-layout.collapsed {
  grid-template-columns: minmax(0, 1fr);
}

.game-main-col {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 0;
}

.event-card {
  background: var(--bg-card);
  border: 1px solid var(--outline-strong);
  border-radius: 20px;
  padding: 0.95rem 1.05rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  max-width: 100%;
}

.event-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.event-type {
  padding: 0.22rem 0.65rem;
  border-radius: 99px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 700;
}

.arc-badge {
  padding: 0.22rem 0.65rem;
  border-radius: 99px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 700;
}

.event-title {
  font-size: 1.18rem;
  font-weight: 800;
}

.event-desc {
  font-size: 0.92rem;
  color: var(--text-dim);
  line-height: 1.6;
}

.event-choices {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0.15rem;
}

.event-choices.is-multi {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.48rem;
}

.event-choices.is-multi.is-three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
}

.choice-btn {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.62rem 0.8rem;
  min-width: 0;
  border-radius: 14px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, transform 0.15s;
}

.event-choices.is-multi.is-three .choice-btn {
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem 0.72rem;
}

.choice-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.choice-btn:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.choice-kbd {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--primary);
  flex-shrink: 0;
}

.choice-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.choice-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.choice-text strong {
  font-size: 0.9rem;
}

.event-choices.is-multi.is-three .choice-text strong {
  font-size: 0.85rem;
  line-height: 1.35;
}

.choice-hint {
  font-size: 0.76rem;
  color: var(--text-dim);
}

/* TIMELINE */
.timeline-card {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 18px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-height: clamp(460px, calc(100dvh - 108px), 620px);
}

.timeline-card h3 {
  font-size: 0.94rem;
  font-weight: 800;
}

.timeline-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-right: 0.2rem;
}

.timeline-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  font-size: 0.78rem;
}

.timeline-row.ms-promo {
  border-left: 3px solid var(--primary);
}

.timeline-row.ms-ach {
  border-left: 3px solid var(--warning);
}

.timeline-row.ms-shield {
  border-left: 3px solid var(--success);
}

.tl-age {
  font-weight: 800;
  color: var(--primary);
  white-space: nowrap;
}

.tl-text {
  color: var(--text);
  line-height: 1.4;
}

/* MENU & PREVIEW MODALS */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  background: rgba(4, 9, 20, 0.72);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.menu-modal {
  width: 100%;
  max-width: 390px;
  max-height: 86dvh;
  overflow-y: auto;
  background: var(--bg-modal);
  border: 1px solid var(--outline-strong);
  border-radius: 20px;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.menu-modal h3 {
  font-size: 1.05rem;
  font-weight: 800;
  margin-bottom: 0.2rem;
}

.preview-title {
  font-weight: 700;
  color: var(--primary);
  font-size: 0.92rem;
}

.preview-desc {
  font-size: 0.85rem;
  color: var(--text-dim);
  line-height: 1.5;
}

/* TOASTS */
.toast-stack {
  position: fixed;
  bottom: 1.25rem;
  right: 1rem;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-width: min(360px, calc(100vw - 2rem));
  pointer-events: none;
}

.toast-item {
  padding: 0.65rem 0.9rem;
  border-radius: 12px;
  background: var(--bg-modal);
  border: 1px solid var(--outline-strong);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: var(--shadow-card);
}

.toast-item.positive {
  border-color: var(--success);
}

.toast-item.negative {
  border-color: var(--danger);
  color: var(--danger);
}

@media (max-width: 960px) {
  .event-choices.is-multi.is-three {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 860px) {
  .create-grid,
  .game-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .timeline-card {
    max-height: 300px;
  }
}

@media (max-width: 680px) {
  .event-choices.is-multi {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 560px) {
  .career-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hide-mobile {
    display: none;
  }

  .game-container {
    padding: 0.65rem 0.65rem 4.2rem;
  }
}
</style>
