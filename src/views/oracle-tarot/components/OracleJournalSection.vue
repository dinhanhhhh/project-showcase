<script setup lang="ts">
import type { OracleReadingRecord } from '@/stores/oracleTarot'

defineProps<{
  history: readonly OracleReadingRecord[]
  viewingSavedId: string | null
}>()

const emit = defineEmits<{
  restore: [entry: OracleReadingRecord]
  clear: []
}>()
</script>

<template>
  <section
    v-if="history.length > 0"
    class="journal-box glass-card"
  >
    <div class="journal-head">
      <h3>📜 Nhật ký trải bài ({{ history.length }}/10 lần gần nhất)</h3>
      <button
        type="button"
        class="clear-journal-btn"
        @click="emit('clear')"
      >
        Xóa nhật ký
      </button>
    </div>
    <div class="journal-list">
      <button
        v-for="entry in history"
        :key="entry.id"
        type="button"
        class="journal-row"
        :class="{ active: viewingSavedId === entry.id }"
        @click="emit('restore', entry)"
      >
        <span class="j-time">{{ entry.timestamp }}</span>
        <span class="j-mode">{{ entry.mode }} lá</span>
        <span
          v-if="entry.question"
          class="j-question"
        >“{{ entry.question }}”</span>
        <span class="j-cards">
          {{ entry.cards.map((c) => `${c.image} ${c.name}${c.reversed ? ' (Ngược)' : ''}`).join('  ·  ') }}
        </span>
        <span class="j-restore">Xem lại →</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.journal-box {
  padding: 1.15rem 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.journal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.journal-box h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
}

.clear-journal-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.clear-journal-btn:hover {
  color: var(--danger);
}

.journal-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.journal-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.82rem;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  flex-wrap: wrap;
  text-align: left;
  cursor: pointer;
  color: var(--text);
  transition: var(--transition-fast);
}

.journal-row:hover,
.journal-row.active {
  border-color: var(--primary);
}

.j-time {
  color: var(--text-muted);
  font-family: monospace;
}

.j-mode {
  padding: 0.12rem 0.45rem;
  border-radius: 99px;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
  font-size: 0.72rem;
}

.j-question {
  color: var(--accent);
  font-style: italic;
}

.j-cards {
  color: var(--text);
  font-weight: 500;
  flex: 1;
}

.j-restore {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
}
</style>
