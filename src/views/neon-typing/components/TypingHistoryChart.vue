<script setup lang="ts">
import { WORD_PACKS } from '../engine'
import type { TypingRunRecord } from '../types'

defineProps<{
  history: TypingRunRecord[]
  averageWpm: number
  maxHistoryWpm: number
}>()

const emit = defineEmits<{
  (e: 'clear-history'): void
}>()
</script>

<template>
  <section
    v-if="history.length > 0"
    class="history-panel glass-card"
  >
    <div class="history-head">
      <div>
        <strong>📊 Lịch sử {{ history.length }} ván gần nhất</strong>
        <span class="avg-badge">TB {{ averageWpm }} WPM</span>
      </div>
      <button
        type="button"
        class="clear-hist-btn"
        @click="emit('clear-history')"
      >
        Xóa lịch sử
      </button>
    </div>

    <div
      class="wpm-bars"
      role="list"
      aria-label="Biểu đồ WPM 10 ván gần nhất"
    >
      <div
        v-for="run in history"
        :key="run.id"
        class="wpm-col"
        role="listitem"
        :title="`${run.wpm} WPM · ${run.accuracy}% · ${WORD_PACKS[run.pack]?.label ?? run.pack} (${run.timestamp})`"
      >
        <span class="bar-val">{{ run.wpm }}</span>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{ height: `${Math.max(12, Math.round((run.wpm / maxHistoryWpm) * 100))}%` }"
          />
        </div>
        <span class="bar-meta">{{ run.rank }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.history-panel {
  padding: 1rem 1.15rem;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.avg-badge {
  margin-left: 0.55rem;
  padding: 0.16rem 0.55rem;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 700;
}

.clear-hist-btn {
  padding: 0.3rem 0.65rem;
  border-radius: 9px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.76rem;
  cursor: pointer;
}

.wpm-bars {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 0.45rem;
  align-items: end;
}

.wpm-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.bar-val {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text);
}

.bar-track {
  width: 100%;
  height: 64px;
  border-radius: 8px;
  background: var(--bg-input);
  border: 1px solid var(--outline);
  display: flex;
  align-items: flex-end;
  padding: 3px;
}

.bar-fill {
  width: 100%;
  border-radius: 5px;
  background: linear-gradient(180deg, var(--primary), var(--accent));
}

.bar-meta {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-dim);
}
</style>
