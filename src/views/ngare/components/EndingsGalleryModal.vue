<script setup lang="ts">
import { ref } from 'vue'
import { ALL_ENDINGS } from '../data/endings'
import type { HallOfFameEntry } from '../types'
import NgareHallOfFame from './NgareHallOfFame.vue'

interface Props {
  unlockedEndings: readonly string[]
  hallOfFame: readonly HallOfFameEntry[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeTab = ref<'endings' | 'hall'>('endings')
</script>

<template>
  <div
    class="modal-overlay"
    @click.self="emit('close')"
  >
    <div
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-label="Bộ sưu tập kết cục và Bảng vàng"
    >
      <div class="modal-head">
        <h3>📚 Chặng Cuối & Bảng Vàng</h3>
        <button
          type="button"
          class="close-x"
          aria-label="Đóng"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="modal-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'endings' }"
          @click="activeTab = 'endings'"
        >
          🎭 Kết Cục ({{ unlockedEndings.length }}/{{ ALL_ENDINGS.length }})
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'hall' }"
          @click="activeTab = 'hall'"
        >
          🏛️ Bảng Vàng ({{ hallOfFame.length }})
        </button>
      </div>

      <div class="modal-scroll">
        <div
          v-if="activeTab === 'endings'"
          class="gallery-grid"
        >
          <div
            v-for="ending in ALL_ENDINGS"
            :key="ending.id"
            class="gallery-item"
            :class="{
              locked: !unlockedEndings.includes(ending.id),
              special: Boolean(ending.isSpecial),
            }"
          >
            <div class="gallery-icon">
              {{ unlockedEndings.includes(ending.id) ? ending.icon : '🔒' }}
            </div>
            <div class="gallery-info">
              <div class="title-row">
                <h4>{{ unlockedEndings.includes(ending.id) ? ending.title : '???' }}</h4>
                <span
                  v-if="ending.isSpecial"
                  class="special-badge"
                >
                  Đặc biệt
                </span>
              </div>
              <p>{{ ending.condition }}</p>
            </div>
          </div>
        </div>

        <NgareHallOfFame
          v-else
          :hall-of-fame="hallOfFame"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(4, 9, 20, 0.72);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem;
}

.modal-card {
  width: 100%;
  max-width: 720px;
  max-height: 88dvh;
  background: var(--bg-modal);
  border: 1px solid var(--outline-strong);
  border-radius: 20px;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  color: var(--text);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.modal-head h3 {
  font-size: 1.1rem;
  font-weight: 800;
}

.close-x {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid var(--outline);
  background: var(--bg-card);
  color: var(--text);
  cursor: pointer;
  font-weight: 700;
}

.modal-tabs {
  display: flex;
  gap: 0.45rem;
}

.tab-btn {
  flex: 1;
  padding: 0.55rem 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--outline);
  background: var(--bg-card);
  color: var(--text-dim);
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.tab-btn.active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
}

.modal-scroll {
  overflow-y: auto;
  min-height: 0;
  padding-right: 0.2rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.gallery-item {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.75rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
}

.gallery-item.special:not(.locked) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.gallery-item.locked {
  opacity: 0.62;
}

.gallery-icon {
  font-size: 1.65rem;
  flex-shrink: 0;
}

.gallery-info {
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.gallery-info h4 {
  font-size: 0.88rem;
  font-weight: 700;
}

.special-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 99px;
  background: var(--accent-soft);
  color: var(--accent);
}

.gallery-info p {
  font-size: 0.76rem;
  color: var(--text-dim);
  margin-top: 0.2rem;
}

@media (max-width: 600px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
