<script setup lang="ts">
import { YEARLY_ACTIONS } from '../data/assets'

interface Props {
  money: number
  usedThisYear: boolean
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'perform', actionId: string): void
}>()
</script>

<template>
  <section class="yearly-bar">
    <div class="yearly-head">
      <span class="yearly-title">⚡ Hành động chủ động trong năm</span>
      <span
        class="yearly-badge"
        :class="{ done: usedThisYear }"
      >
        {{ usedThisYear ? '✓ Đã thực hiện năm nay' : 'Còn 1 lượt miễn phí chọn' }}
      </span>
    </div>
    <div class="yearly-actions-row">
      <button
        v-for="action in YEARLY_ACTIONS"
        :key="action.id"
        type="button"
        class="yearly-btn"
        :disabled="usedThisYear || disabled || money < action.cost"
        :title="action.description"
        @click="emit('perform', action.id)"
      >
        <span class="ya-emoji">{{ action.emoji }}</span>
        <span class="ya-text">
          <strong>{{ action.name }}</strong>
          <small>{{ action.cost > 0 ? `💰 ${action.cost}` : 'Miễn phí' }}</small>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.yearly-bar {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 16px;
  padding: 0.56rem 0.78rem;
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
}

.yearly-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.yearly-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text);
}

.yearly-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--primary);
  background: var(--primary-soft);
  padding: 0.15rem 0.55rem;
  border-radius: 99px;
}

.yearly-badge.done {
  color: var(--text-dim);
  background: var(--bg-sidebar);
}

.yearly-actions-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.45rem;
}

.yearly-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.55rem;
  border-radius: 11px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  cursor: pointer;
  text-align: left;
  min-width: 0;
  transition: border-color 0.2s, transform 0.15s;
}

.yearly-btn:hover:not(:disabled) {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.yearly-btn:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}

.ya-emoji {
  font-size: 1.05rem;
  flex-shrink: 0;
}

.ya-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ya-text strong {
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ya-text small {
  font-size: 0.68rem;
  color: var(--text-dim);
}

@media (max-width: 900px) {
  .yearly-actions-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
