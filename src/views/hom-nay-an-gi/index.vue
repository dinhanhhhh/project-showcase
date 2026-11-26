<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHomNayAnGiStore } from '@/stores/homNayAnGi'
import { FOOD_CATEGORY_LABELS, SAMPLE_FOODS } from './data'
import { filterFoods, pickRandomFood, validateFoodInput } from './engine'
import type { FoodCategory, FoodFilter, FoodItem } from './types'

const store = useHomNayAnGiStore()

const activeFilter = ref<FoodFilter>('all')
const currentFood = ref<FoodItem | null>(null)
const isRolling = ref(false)
const brokenImageIds = ref<Record<string, boolean>>({})

const newName = ref('')
const newImage = ref('')
const newCategory = ref<FoodCategory>('custom')
const newEmoji = ref('🍽️')
const formError = ref('')
const formSuccess = ref('')

let rollTimer: ReturnType<typeof setInterval> | null = null
let successTimer: ReturnType<typeof setTimeout> | null = null

const FILTER_ORDER: FoodFilter[] = ['all', 'nuoc', 'kho', 'an-vat', 'favorite', 'custom']
const EMOJI_OPTIONS = ['🍽️', '🍜', '🍛', '🍕', '🍔', '🍣', '🥗', '🧋', '🍰', '🍗']

const allFoods = computed<FoodItem[]>(() => [...store.customFoods, ...SAMPLE_FOODS])

const filteredFoods = computed<FoodItem[]>(() =>
  filterFoods(allFoods.value, activeFilter.value, store.favoriteIds),
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

function selectFilter(filter: FoodFilter) {
  activeFilter.value = filter
  const pool = filterFoods(allFoods.value, filter, store.favoriteIds)
  if (!currentFood.value || !pool.some((f) => f.id === currentFood.value?.id)) {
    currentFood.value = pickRandomFood(pool)
  }
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
    return
  }

  if (rollTimer) clearInterval(rollTimer)
  isRolling.value = true

  let ticks = 0
  const maxTicks = 10
  rollTimer = setInterval(() => {
    ticks += 1
    const candidate = pickRandomFood(pool, currentFood.value?.id)
    if (candidate) {
      currentFood.value = candidate
    }
    if (ticks >= maxTicks) {
      if (rollTimer) {
        clearInterval(rollTimer)
        rollTimer = null
      }
      isRolling.value = false
      if (currentFood.value) {
        store.recordPick(currentFood.value)
      }
    }
  }, 75)
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
    isCustom: true,
  }

  store.addCustomFood(created)
  currentFood.value = created
  store.recordPick(created)

  newName.value = ''
  newImage.value = ''
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
}

onMounted(() => {
  currentFood.value = pickRandomFood(allFoods.value)
})

onUnmounted(() => {
  if (rollTimer) clearInterval(rollTimer)
  if (successTimer) clearTimeout(successTimer)
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
        <div class="menu-count">
          {{ allFoods.length }} món
        </div>
      </header>

      <section class="filter-bar">
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
      </section>

      <div class="main-grid">
        <section class="spotlight-card">
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
              </div>
              <button
                type="button"
                class="fav-floating"
                :class="{ active: isCurrentFavorite }"
                title="Lưu yêu thích"
                @click="store.toggleFavorite(currentFood.id)"
              >
                {{ isCurrentFavorite ? '★' : '☆' }}
              </button>
            </div>

            <div class="dish-info">
              <span class="dish-cat-tag">{{ FOOD_CATEGORY_LABELS[currentFood.category] }}</span>
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
            <p>Nhóm này chưa có món nào. Hãy chọn nhóm khác hoặc tự thêm món bên cạnh!</p>
          </div>

          <button
            type="button"
            class="roll-btn"
            :disabled="isRolling || filteredFoods.length === 0"
            @click="rollRandomFood"
          >
            {{ isRolling ? '🎲 Đang quay món...' : '🎲 Quay món ngẫu nhiên' }}
          </button>

          <div
            v-if="store.history.length > 0"
            class="history-box"
          >
            <div class="history-head">
              <h3>Gợi ý gần đây</h3>
              <button
                type="button"
                class="link-btn"
                @click="store.clearHistory()"
              >
                Xóa lịch sử
              </button>
            </div>
            <div class="history-chips">
              <span
                v-for="(item, idx) in store.history"
                :key="`${item.foodId}-${idx}`"
                class="history-chip"
              >
                {{ item.emoji }} {{ item.foodName }}
                <small>{{ item.pickedAt }}</small>
              </span>
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

.menu-count {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: rgba(109, 221, 255, 0.12);
  color: var(--primary);
  font-weight: 700;
  font-size: 0.85rem;
}

.filter-bar {
  display: flex;
  gap: 0.55rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
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
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-sidebar), var(--bg));
}

.fallback-emoji {
  font-size: 4.5rem;
}

.fav-floating {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--outline);
  background: rgba(9, 19, 40, 0.82);
  color: var(--text-dim);
  font-size: 1.25rem;
  cursor: pointer;
}

.fav-floating.active {
  color: var(--property-group-d);
  border-color: var(--property-group-d);
}

.dish-info {
  text-align: center;
}

.dish-cat-tag {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: rgba(210, 119, 255, 0.14);
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 0.45rem;
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
  gap: 0.65rem;
  color: var(--text-dim);
}

.empty-spotlight span {
  font-size: 3rem;
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
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  font-size: 0.8rem;
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
</style>
