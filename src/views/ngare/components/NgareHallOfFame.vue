<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HallOfFameEntry } from '../types'

type HallSortMode = 'score' | 'netWorth'

const props = defineProps<{
  hallOfFame: readonly HallOfFameEntry[]
}>()

const sortMode = ref<HallSortMode>('score')
const query = ref('')

const visibleEntries = computed(() => {
  const q = query.value.trim().toLowerCase()
  const filtered = q
    ? props.hallOfFame.filter(
        (entry) =>
          entry.name.toLowerCase().includes(q) ||
          entry.careerName.toLowerCase().includes(q) ||
          entry.endingTitle.toLowerCase().includes(q),
      )
    : [...props.hallOfFame]

  return filtered.sort((a, b) =>
    sortMode.value === 'netWorth'
      ? b.netWorth - a.netWorth
      : b.totalScore - a.totalScore,
  )
})
</script>

<template>
  <div class="hall-wrapper">
    <div
      v-if="hallOfFame.length > 0"
      class="hall-controls"
    >
      <input
        v-model="query"
        type="search"
        class="hall-search"
        placeholder="Tìm tên, nghề nghiệp hoặc kết cục..."
        aria-label="Tìm trong Bảng Vàng"
      >
      <div
        class="hall-sort-pills"
        role="group"
        aria-label="Sắp xếp Bảng Vàng"
      >
        <button
          type="button"
          class="sort-pill"
          :class="{ active: sortMode === 'score' }"
          @click="sortMode = 'score'"
        >
          🏅 Điểm
        </button>
        <button
          type="button"
          class="sort-pill"
          :class="{ active: sortMode === 'netWorth' }"
          @click="sortMode = 'netWorth'"
        >
          💎 Tài sản
        </button>
      </div>
    </div>

    <div class="hall-list">
      <div
        v-if="hallOfFame.length === 0"
        class="empty-box"
      >
        Chưa có cuộc đời nào được ghi danh. Hãy hoàn thành 1 hành trình!
      </div>
      <div
        v-else-if="visibleEntries.length === 0"
        class="empty-box"
      >
        Không tìm thấy cuộc đời phù hợp với "{{ query }}".
      </div>
      <div
        v-for="(entry, idx) in visibleEntries"
        :key="entry.id"
        class="hall-row"
      >
        <span class="hall-rank">#{{ idx + 1 }}</span>
        <span class="hall-icon">{{ entry.endingIcon }}</span>
        <div class="hall-main">
          <strong>{{ entry.name }} · {{ entry.careerEmoji }} {{ entry.careerName }}</strong>
          <small>{{ entry.endingTitle }} · Tuổi {{ entry.age }} · {{ entry.finishedAt }}</small>
        </div>
        <div class="hall-metrics">
          <span class="score-pill">🏅 {{ entry.totalScore }}</span>
          <small>💎 {{ entry.netWorth }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hall-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.hall-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.hall-search {
  flex: 1;
  min-width: 170px;
  padding: 0.42rem 0.7rem;
  border-radius: 10px;
  background: var(--bg-input);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.8rem;
  outline: none;
}

.hall-search:focus {
  border-color: var(--primary);
}

.hall-sort-pills {
  display: flex;
  gap: 0.3rem;
}

.sort-pill {
  padding: 0.36rem 0.68rem;
  border-radius: 9px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
}

.sort-pill.active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
}

.hall-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hall-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.85rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
}

.hall-rank {
  font-weight: 800;
  color: var(--primary);
  min-width: 28px;
}

.hall-icon {
  font-size: 1.4rem;
}

.hall-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.hall-main strong {
  font-size: 0.86rem;
}

.hall-main small {
  font-size: 0.74rem;
  color: var(--text-dim);
}

.hall-metrics {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
}

.score-pill {
  font-weight: 800;
  font-size: 0.84rem;
  color: var(--warning);
}

.empty-box {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-dim);
  font-size: 0.88rem;
}
</style>
