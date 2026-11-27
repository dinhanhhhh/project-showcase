<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHomNayAnGiStore } from '@/stores/homNayAnGi'
import { useFoodAudio } from './composables/useFoodAudio'
import {
  FOOD_CATEGORY_LABELS,
  MEAL_TIME_LABELS,
  PRICE_TIER_LABELS,
  SAMPLE_FOODS,
} from './data'
import {
  filterFoodsAdvanced,
  generateDailyMealPlan,
  getSpinDelays,
  pickRandomFood,
  validateFoodInput,
  type DailyMealPlan,
} from './engine'
import type {
  FoodCategory,
  FoodFilter,
  FoodItem,
  MealTime,
  MealTimeFilter,
  PriceTier,
  PriceTierFilter,
} from './types'

const store = useHomNayAnGiStore()
const { playTick, playReveal, cleanup: cleanupAudio } = useFoodAudio()

const activeFilter = ref<FoodFilter>('all')
const activeMealTime = ref<MealTimeFilter>('all')
const activePriceTier = ref<PriceTierFilter>('all')
const currentFood = ref<FoodItem | null>(null)
const isRolling = ref(false)
const brokenImageIds = ref<Record<string, boolean>>({})
const dailyPlan = ref<DailyMealPlan | null>(null)

const newName = ref('')
const newImage = ref('')
const newCategory = ref<FoodCategory>('custom')
const newEmoji = ref('🍽️')
const newMealTime = ref<MealTime>('trua')
const newPriceTier = ref<PriceTier>('vua-tui')
const newPriceLabel = ref('')
const formError = ref('')
const formSuccess = ref('')

let rollTimer: ReturnType<typeof setTimeout> | null = null
let successTimer: ReturnType<typeof setTimeout> | null = null

const FILTER_ORDER: FoodFilter[] = ['all', 'nuoc', 'kho', 'an-vat', 'favorite', 'custom']
const MEAL_TIME_ORDER: MealTimeFilter[] = ['all', 'sang', 'trua', 'toi', 'an-vat']
const PRICE_TIER_ORDER: PriceTierFilter[] = ['all', 'tiet-kiem', 'vua-tui', 'sang-chanh']
const EMOJI_OPTIONS = ['🍽️', '🍜', '🍛', '🍕', '🍔', '🍣', '🥗', '🧋', '🍰', '🍗']

interface MealSlotPreset {
  id: 'morning' | 'lunch' | 'afternoon' | 'night'
  label: string
  hint: string
  mealTime: MealTime
}

const MEAL_PRESETS: readonly MealSlotPreset[] = [
  { id: 'morning', label: '🌅 Sáng', hint: 'Nhẹ bụng đầu ngày', mealTime: 'sang' },
  { id: 'lunch', label: '☀️ Trưa', hint: 'Chắc bụng đầy năng lượng', mealTime: 'trua' },
  { id: 'afternoon', label: '🌇 Chiều', hint: 'Ăn vặt xế chiều', mealTime: 'an-vat' },
  { id: 'night', label: '🌙 Đêm', hint: 'Ấm bụng đêm khuya', mealTime: 'toi' },
]

const currentMealId = computed<MealSlotPreset['id']>(() => {
  const hour = new Date().getHours()
  if (hour < 10) return 'morning'
  if (hour < 14) return 'lunch'
  if (hour < 18) return 'afternoon'
  return 'night'
})

const allFoods = computed<FoodItem[]>(() => [...store.customFoods, ...SAMPLE_FOODS])

const filteredFoods = computed<FoodItem[]>(() =>
  filterFoodsAdvanced(allFoods.value, {
    category: activeFilter.value,
    mealTime: activeMealTime.value,
    priceTier: activePriceTier.value,
    favoriteIds: store.favoriteIds,
  }),
)

const isCurrentFavorite = computed(() =>
  currentFood.value ? store.favoriteIds.includes(currentFood.value.id) : false,
)

function hasValidImage(food: FoodItem | null): boolean {
  if (!food || !food.image) return false
  return !brokenImageIds.value[food.id]
}

function handleImageError(foodId: string) {
  brokenImageIds.value = { ...brokenImageIds.value, [foodId]: true }
}

function syncSpotlightToPool() {
  const pool = filteredFoods.value
  if (!currentFood.value || !pool.some((f) => f.id === currentFood.value?.id)) {
    currentFood.value = pickRandomFood(pool)
  }
}

function selectFilter(filter: FoodFilter) {
  activeFilter.value = filter
  syncSpotlightToPool()
}

function selectMealTime(mealTime: MealTimeFilter) {
  activeMealTime.value = mealTime
  syncSpotlightToPool()
}

function selectPriceTier(priceTier: PriceTierFilter) {
  activePriceTier.value = priceTier
  syncSpotlightToPool()
}

function resetAllFilters() {
  activeFilter.value = 'all'
  activeMealTime.value = 'all'
  activePriceTier.value = 'all'
  syncSpotlightToPool()
}

function applyMealPreset(preset: MealSlotPreset) {
  activeFilter.value = 'all'
  activeMealTime.value = preset.mealTime
  syncSpotlightToPool()
  rollRandomFood()
}

function rollRandomFood() {
  const pool = filteredFoods.value
  if (pool.length === 0) {
    currentFood.value = null
    return
  }

  if (pool.length === 1) {
    currentFood.value = pool[0]
    store.recordPick(pool[0])
    playReveal(store.isMuted)
    return
  }

  if (rollTimer) {
    clearTimeout(rollTimer)
    rollTimer = null
  }
  isRolling.value = true

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const delays = getSpinDelays(prefersReduced ? 3 : 14)
  let step = 0

  const runStep = () => {
    const candidate = pickRandomFood(pool, currentFood.value?.id)
    if (candidate) {
      currentFood.value = candidate
    }
    playTick(step, delays.length, store.isMuted)

    step += 1
    if (step >= delays.length) {
      rollTimer = null
      isRolling.value = false
      if (currentFood.value) {
        store.recordPick(currentFood.value)
        playReveal(store.isMuted)
      }
      return
    }

    rollTimer = setTimeout(runStep, delays[step] ?? 120)
  }

  rollTimer = setTimeout(runStep, delays[0] ?? 45)
}

function handleAddFood() {
  formError.value = ''
  formSuccess.value = ''

  const validation = validateFoodInput(newName.value, newImage.value, allFoods.value)
  if (!validation.valid) {
    formError.value = validation.error ?? 'Dữ liệu không hợp lệ.'
    return
  }

  const created: FoodItem = {
    id: `custom-${Date.now()}`,
    name: validation.sanitizedName,
    image: validation.sanitizedImage,
    emoji: newEmoji.value,
    category: newCategory.value,
    mealTimes: [newMealTime.value],
    priceTier: newPriceTier.value,
    priceLabel: newPriceLabel.value.trim() || PRICE_TIER_LABELS[newPriceTier.value],
    isCustom: true,
  }

  store.addCustomFood(created)
  currentFood.value = created
  store.recordPick(created)

  newName.value = ''
  newImage.value = ''
  newPriceLabel.value = ''
  formSuccess.value = `Đã thêm "${created.name}" vào thực đơn!`
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    formSuccess.value = ''
  }, 2400)
}

function handleRemoveCustom(foodId: string) {
  store.removeCustomFood(foodId)
  if (currentFood.value?.id === foodId) {
    currentFood.value = pickRandomFood(filteredFoods.value)
  }
}

function pickFromMenu(food: FoodItem) {
  currentFood.value = food
  store.recordPick(food)
  playReveal(store.isMuted)
}

function jumpToHistory(foodId: string) {
  const found = allFoods.value.find((f) => f.id === foodId)
  if (!found) return
  currentFood.value = found
}

const DAILY_PLAN_SLOTS: ReadonlyArray<{ key: keyof DailyMealPlan; label: string }> = [
  { key: 'sang', label: '🌅 Sáng' },
  { key: 'trua', label: '☀️ Trưa' },
  { key: 'toi', label: '🌙 Tối' },
  { key: 'anVat', label: '🧋 Ăn vặt' },
]

function buildDailyPlan() {
  dailyPlan.value = generateDailyMealPlan(allFoods.value)
  playReveal(store.isMuted)
}

function selectPlanDish(food: FoodItem | null) {
  if (!food) return
  pickFromMenu(food)
}

onMounted(() => {
  currentFood.value = pickRandomFood(allFoods.value)
})

onUnmounted(() => {
  if (rollTimer) clearTimeout(rollTimer)
  if (successTimer) clearTimeout(successTimer)
  cleanupAudio()
})
</script>

<template>
  <div class="food-page">
    <div class="food-shell">
      <header class="food-header">
        <RouterLink
          to="/"
          class="back-btn"
        >
          ← Về Launcher
        </RouterLink>
        <div class="header-title">
          <h1>Hôm Nay Ăn Gì? 🍜</h1>
          <p>Chốt món nhanh trong 1 giây — không còn cảnh suy nghĩ cả tiếng!</p>
        </div>
        <div class="header-right-tools">
          <button
            type="button"
            class="mute-btn"
            :title="store.isMuted ? 'Bật âm thanh quay món' : 'Tắt âm thanh'"
            :aria-label="store.isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'"
            @click="store.toggleMute()"
          >
            {{ store.isMuted ? '🔇' : '🔊' }}
          </button>
          <div class="menu-count">
            {{ allFoods.length }} món
          </div>
        </div>
      </header>

      <section class="meal-time-bar">
        <span class="meal-label">⏰ Gợi ý nhanh theo khung giờ:</span>
        <div class="meal-pills">
          <button
            v-for="preset in MEAL_PRESETS"
            :key="preset.id"
            type="button"
            class="meal-pill"
            :class="{ current: currentMealId === preset.id, active: activeMealTime === preset.mealTime }"
            :title="preset.hint"
            @click="applyMealPreset(preset)"
          >
            <strong>{{ preset.label }}</strong>
            <small>{{ preset.hint }}</small>
          </button>
        </div>
      </section>

      <section class="filters-stack">
        <div
          class="filter-bar"
          role="group"
          aria-label="Lọc theo nhóm món"
        >
          <button
            v-for="filter in FILTER_ORDER"
            :key="filter"
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === filter }"
            @click="selectFilter(filter)"
          >
            {{ FOOD_CATEGORY_LABELS[filter] }}
          </button>
        </div>

        <div class="sub-filters">
          <div
            class="sub-filter-group"
            role="group"
            aria-label="Lọc theo buổi ăn"
          >
            <button
              v-for="mt in MEAL_TIME_ORDER"
              :key="mt"
              type="button"
              class="mini-chip"
              :class="{ active: activeMealTime === mt }"
              @click="selectMealTime(mt)"
            >
              {{ MEAL_TIME_LABELS[mt] }}
            </button>
          </div>

          <div
            class="sub-filter-group"
            role="group"
            aria-label="Lọc theo mức giá"
          >
            <button
              v-for="pt in PRICE_TIER_ORDER"
              :key="pt"
              type="button"
              class="mini-chip price-chip"
              :class="{ active: activePriceTier === pt }"
              @click="selectPriceTier(pt)"
            >
              {{ PRICE_TIER_LABELS[pt] }}
            </button>
          </div>
        </div>
      </section>

      <div class="main-grid">
        <section class="spotlight-card">
          <div
            v-if="isRolling"
            class="slot-reel"
            aria-hidden="true"
          >
            <div class="reel-track">
              <span
                v-for="(em, idx) in [...EMOJI_OPTIONS, ...EMOJI_OPTIONS]"
                :key="`reel-${idx}`"
                class="reel-item"
              >{{ em }}</span>
            </div>
          </div>

          <div
            v-if="currentFood"
            class="dish-showcase"
            :class="{ rolling: isRolling }"
          >
            <div class="dish-media">
              <img
                v-if="hasValidImage(currentFood)"
                :src="currentFood.image"
                :alt="currentFood.name"
                class="dish-img"
                @error="handleImageError(currentFood.id)"
              >
              <div
                v-else
                class="dish-fallback"
              >
                <span class="fallback-emoji">{{ currentFood.emoji }}</span>
                <span class="fallback-tag">{{ FOOD_CATEGORY_LABELS[currentFood.category] }}</span>
              </div>
              <button
                type="button"
                class="fav-floating"
                :class="{ active: isCurrentFavorite }"
                title="Lưu yêu thích"
                aria-label="Lưu món yêu thích"
                @click="store.toggleFavorite(currentFood.id)"
              >
                {{ isCurrentFavorite ? '★' : '☆' }}
              </button>
            </div>

            <div class="dish-info">
              <div class="dish-tags-row">
                <span class="dish-cat-tag">{{ FOOD_CATEGORY_LABELS[currentFood.category] }}</span>
                <span
                  v-if="currentFood.priceLabel"
                  class="dish-price-tag"
                >
                  💵 {{ currentFood.priceLabel }}
                </span>
              </div>
              <h2 class="dish-name">
                {{ currentFood.emoji }} {{ currentFood.name }}
              </h2>
            </div>
          </div>

          <div
            v-else
            class="empty-spotlight"
          >
            <span>🍽️</span>
            <p>Không có món nào khớp bộ lọc hiện tại. Thử nới bộ lọc hoặc tự thêm món!</p>
            <button
              type="button"
              class="reset-filters-btn"
              @click="resetAllFilters"
            >
              🔄 Đặt lại bộ lọc
            </button>
          </div>

          <div class="roll-actions">
            <button
              type="button"
              class="roll-btn"
              :disabled="isRolling || filteredFoods.length === 0"
              @click="rollRandomFood"
            >
              {{ isRolling ? '🎲 Đang quay món...' : '🎲 Quay món ngẫu nhiên' }}
            </button>
            <button
              type="button"
              class="daily-plan-btn"
              :disabled="isRolling || allFoods.length === 0"
              @click="buildDailyPlan"
            >
              📅 Gợi ý cả ngày
            </button>
          </div>

          <div
            v-if="dailyPlan"
            class="daily-plan-box"
          >
            <div class="history-head">
              <h3>📅 Thực đơn gợi ý cả ngày</h3>
              <button
                type="button"
                class="link-btn"
                @click="buildDailyPlan"
              >
                🔄 Đổi thực đơn
              </button>
            </div>
            <div class="daily-plan-grid">
              <button
                v-for="slot in DAILY_PLAN_SLOTS"
                :key="slot.key"
                type="button"
                class="plan-slot-card"
                :disabled="!dailyPlan[slot.key]"
                @click="selectPlanDish(dailyPlan[slot.key])"
              >
                <span class="plan-slot-label">{{ slot.label }}</span>
                <strong class="plan-slot-name">
                  {{ dailyPlan[slot.key]?.emoji ?? '🍽️' }} {{ dailyPlan[slot.key]?.name ?? 'Chưa có món' }}
                </strong>
                <small
                  v-if="dailyPlan[slot.key]?.priceLabel"
                  class="plan-slot-price"
                >
                  {{ dailyPlan[slot.key]?.priceLabel }}
                </small>
              </button>
            </div>
          </div>

          <div
            v-if="store.history.length > 0"
            class="history-box"
          >
            <div class="history-head">
              <h3>Gợi ý gần đây ({{ store.history.length }}/10)</h3>
              <button
                type="button"
                class="link-btn"
                @click="store.clearHistory()"
              >
                Xóa lịch sử
              </button>
            </div>
            <div class="history-chips">
              <button
                v-for="(item, idx) in store.history"
                :key="`${item.foodId}-${idx}`"
                type="button"
                class="history-chip"
                @click="jumpToHistory(item.foodId)"
              >
                {{ item.emoji }} {{ item.foodName }}
                <small>{{ item.pickedAt }}</small>
              </button>
            </div>
          </div>
        </section>

        <aside class="side-panel">
          <form
            class="add-form"
            @submit.prevent="handleAddFood"
          >
            <h2>✨ Thêm món của riêng bạn</h2>

            <label class="field">
              <span>Tên món ăn *</span>
              <input
                v-model="newName"
                type="text"
                placeholder="Ví dụ: Cơm gà xối mỡ, Mì cay..."
                maxlength="60"
              >
            </label>

            <label class="field">
              <span>Link ảnh (tùy chọn)</span>
              <input
                v-model="newImage"
                type="url"
                placeholder="https://..."
              >
            </label>

            <div class="form-row">
              <label class="field">
                <span>Phân loại</span>
                <select v-model="newCategory">
                  <option value="nuoc">Món nước</option>
                  <option value="kho">Món khô</option>
                  <option value="an-vat">Ăn vặt</option>
                  <option value="custom">Món của tôi</option>
                </select>
              </label>

              <label class="field">
                <span>Biểu tượng</span>
                <select v-model="newEmoji">
                  <option
                    v-for="em in EMOJI_OPTIONS"
                    :key="em"
                    :value="em"
                  >
                    {{ em }}
                  </option>
                </select>
              </label>
            </div>

            <div class="form-row">
              <label class="field">
                <span>Buổi phù hợp</span>
                <select v-model="newMealTime">
                  <option value="sang">Sáng</option>
                  <option value="trua">Trưa</option>
                  <option value="toi">Tối</option>
                  <option value="an-vat">Ăn vặt</option>
                </select>
              </label>

              <label class="field">
                <span>Mức giá</span>
                <select v-model="newPriceTier">
                  <option value="tiet-kiem">Dưới 40k</option>
                  <option value="vua-tui">40k – 80k</option>
                  <option value="sang-chanh">Trên 80k</option>
                </select>
              </label>
            </div>

            <p
              v-if="formError"
              class="msg-error"
            >
              {{ formError }}
            </p>
            <p
              v-if="formSuccess"
              class="msg-success"
            >
              {{ formSuccess }}
            </p>

            <button
              type="submit"
              class="submit-btn"
            >
              + Thêm vào thực đơn
            </button>
          </form>

          <div class="menu-panel">
            <h3>Danh sách món ({{ filteredFoods.length }})</h3>
            <div class="menu-list">
              <div
                v-for="food in filteredFoods"
                :key="food.id"
                class="menu-item"
                :class="{ selected: currentFood?.id === food.id }"
              >
                <button
                  type="button"
                  class="menu-select"
                  @click="pickFromMenu(food)"
                >
                  <span>{{ food.emoji }}</span>
                  <span class="menu-name">{{ food.name }}</span>
                  <span
                    v-if="food.priceLabel"
                    class="menu-price"
                  >{{ food.priceLabel }}</span>
                </button>
                <div class="menu-actions">
                  <button
                    type="button"
                    class="mini-icon"
                    title="Yêu thích"
                    @click="store.toggleFavorite(food.id)"
                  >
                    {{ store.favoriteIds.includes(food.id) ? '★' : '☆' }}
                  </button>
                  <button
                    v-if="food.isCustom"
                    type="button"
                    class="mini-icon danger"
                    title="Xóa món tự thêm"
                    @click="handleRemoveCustom(food.id)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.food-page {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  padding: 1.25rem;
  font-family: 'Inter', sans-serif;
}

.food-shell {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.food-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.back-btn {
  padding: 0.5rem 0.95rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
}

.back-btn:hover {
  border-color: var(--primary);
  box-shadow: 0 0 14px var(--primary-glow);
}

.header-title {
  text-align: center;
  flex: 1;
}

.header-title h1 {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 800;
}

.header-title p {
  color: var(--text-dim);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.header-right-tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mute-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.mute-btn:hover {
  border-color: var(--primary);
}

.menu-count {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
  font-size: 0.85rem;
}

.meal-time-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  border-radius: 16px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.meal-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-dim);
}

.meal-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.meal-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: 11px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.meal-pill small {
  color: var(--text-dim);
  font-size: 0.7rem;
}

.meal-pill.current {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.meal-pill:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
}

.slot-reel {
  overflow: hidden;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline-strong);
  padding: 0.4rem 0;
}

.reel-track {
  display: flex;
  gap: 1rem;
  animation: reelScroll 0.65s linear infinite;
  width: max-content;
}

.reel-item {
  font-size: 1.5rem;
}

@keyframes reelScroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.filters-stack {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.filter-bar {
  display: flex;
  gap: 0.55rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.sub-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.6rem;
}

.sub-filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.mini-chip {
  padding: 0.36rem 0.72rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.mini-chip:hover {
  border-color: var(--primary);
  color: var(--text);
}

.mini-chip.active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 700;
}

.mini-chip.price-chip.active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}

.filter-chip {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.filter-chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-inverse);
  box-shadow: 0 0 16px var(--primary-glow);
}

.main-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.25rem;
  align-items: start;
}

.spotlight-card,
.add-form,
.menu-panel {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 22px;
  padding: 1.35rem;
  backdrop-filter: blur(12px);
}

.spotlight-card {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.dish-showcase {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.15s ease;
}

.dish-showcase.rolling {
  transform: scale(0.985);
}

.dish-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.dish-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dish-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  background:
    radial-gradient(circle at 50% 45%, var(--primary-soft) 0%, transparent 62%),
    linear-gradient(135deg, var(--bg-sidebar), var(--bg-card));
}

.fallback-emoji {
  font-size: 4.5rem;
  filter: drop-shadow(0 6px 14px rgba(2, 6, 23, 0.14));
}

.fallback-tag {
  padding: 0.22rem 0.72rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.76rem;
  font-weight: 700;
}

.fav-floating {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--outline-strong);
  background: var(--bg-card);
  color: var(--text);
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.16);
  cursor: pointer;
  transition: var(--transition-fast);
}

.fav-floating:hover {
  border-color: var(--property-group-d);
  color: var(--property-group-d);
  transform: scale(1.06);
}

.fav-floating.active {
  color: var(--property-group-d);
  border-color: var(--property-group-d);
}

.dish-info {
  text-align: center;
}

.dish-tags-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.45rem;
}

.dish-cat-tag {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
}

.dish-price-tag {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 700;
}

.dish-name {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  font-weight: 800;
}

.empty-spotlight {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.75rem;
  color: var(--text-dim);
}

.empty-spotlight span {
  font-size: 3rem;
}

.reset-filters-btn {
  padding: 0.55rem 1rem;
  border-radius: 12px;
  background: var(--primary);
  border: none;
  color: var(--text-inverse);
  font-weight: 700;
  cursor: pointer;
}

.roll-btn {
  width: 100%;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--text-inverse);
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  transition: var(--transition-fast);
}

.roll-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px var(--primary-glow);
}

.roll-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-box {
  border-top: 1px solid var(--outline);
  padding-top: 0.9rem;
}

.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.history-head h3 {
  font-size: 0.88rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.link-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 0.8rem;
  cursor: pointer;
}

.link-btn:hover {
  color: var(--danger);
}

.history-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.history-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.34rem 0.7rem;
  border-radius: 999px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.history-chip:hover {
  border-color: var(--primary);
}

.menu-price {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--primary);
  font-weight: 700;
  flex-shrink: 0;
}

.history-chip small {
  color: var(--text-dim);
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.add-form h2,
.menu-panel h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field span {
  font-size: 0.8rem;
  color: var(--text-dim);
  font-weight: 600;
}

.field input,
.field select {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.9rem;
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: var(--primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.msg-error {
  color: var(--danger);
  font-size: 0.82rem;
}

.msg-success {
  color: var(--property-group-a);
  font-size: 0.82rem;
}

.submit-btn {
  padding: 0.78rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--primary);
  color: var(--primary);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
}

.submit-btn:hover {
  background: var(--primary);
  color: var(--text-inverse);
}

.menu-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.45rem 0.65rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid transparent;
}

.menu-item.selected {
  border-color: var(--primary);
}

.menu-select {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  font-size: 0.88rem;
}

.menu-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-actions {
  display: flex;
  gap: 0.25rem;
}

.mini-icon {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 0.2rem 0.35rem;
  font-size: 0.95rem;
}

.mini-icon:hover {
  color: var(--primary);
}

.mini-icon.danger:hover {
  color: var(--danger);
}

.roll-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}

.roll-actions .roll-btn {
  flex: 1 1 210px;
}

.daily-plan-btn {
  background: var(--bg-elevated);
  color: var(--text);
  border: 1px solid var(--outline);
  border-radius: 14px;
  padding: 0.85rem 1.15rem;
  font-weight: 700;
  cursor: pointer;
  min-height: 48px;
  transition: border-color 0.2s, background-color 0.2s;
}

.daily-plan-btn:hover:not(:disabled) {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.daily-plan-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.daily-plan-box {
  width: 100%;
  margin-top: 0.85rem;
  padding: 0.85rem;
  border-radius: 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--outline);
}

.daily-plan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.65rem;
}

.plan-slot-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  text-align: left;
  cursor: pointer;
  min-width: 0;
  transition: border-color 0.2s, transform 0.2s;
}

.plan-slot-card:hover:not(:disabled) {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.plan-slot-label {
  font-size: 0.74rem;
  color: var(--primary);
  font-weight: 700;
}

.plan-slot-name {
  font-size: 0.88rem;
  line-height: 1.3;
  word-break: break-word;
}

.plan-slot-price {
  font-size: 0.74rem;
  color: var(--text-dim);
}

@media (max-width: 820px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .food-header {
    justify-content: space-between;
  }

  .header-title {
    order: 3;
    flex-basis: 100%;
  }
}

@media (max-width: 480px) {
  .daily-plan-grid {
    grid-template-columns: 1fr;
  }
}
</style>
