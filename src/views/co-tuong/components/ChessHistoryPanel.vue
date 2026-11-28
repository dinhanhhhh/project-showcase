<script setup lang="ts">
import { PIECE_CHARS } from '../constants'
import type { CoTuongStats, MoveRecord } from '../types'

defineProps<{
  showStats: boolean
  stats: CoTuongStats
  moveHistory: readonly MoveRecord[]
  copiedNotation: boolean
}>()

const emit = defineEmits<{
  'copy-notation': []
}>()
</script>

<template>
  <div
    v-if="showStats"
    class="panel-card stats-card"
  >
    <div class="stat-item">
      <span>Thắng</span>
      <strong class="stat-win">{{ stats.wins }}</strong>
    </div>
    <div class="stat-item">
      <span>Hòa</span>
      <strong class="stat-draw">{{ stats.draws }}</strong>
    </div>
    <div class="stat-item">
      <span>Thua</span>
      <strong class="stat-loss">{{ stats.losses }}</strong>
    </div>
  </div>

  <div class="panel-card history-card">
    <div class="history-header-row">
      <h2>📜 Biên bản ván đấu</h2>
      <button
        v-if="moveHistory.length > 0"
        type="button"
        class="copy-notation-btn"
        @click="emit('copy-notation')"
      >
        {{ copiedNotation ? '✅ Đã chép' : '📋 Chép biên bản' }}
      </button>
    </div>
    <div
      v-if="moveHistory.length === 0"
      class="empty-history"
    >
      Chưa có nước đi nào. Bên Đỏ đi trước!
    </div>
    <ol
      v-else
      class="move-list"
    >
      <li
        v-for="(move, idx) in moveHistory"
        :key="idx"
        class="move-row"
      >
        <span class="move-idx">#{{ idx + 1 }}</span>
        <span
          class="move-side"
          :class="move.side"
        >
          {{ move.side === 'red' ? 'Đỏ' : 'Đen' }}
        </span>
        <span class="move-notation">{{ move.notation }}</span>
        <span
          v-if="move.capturedPiece"
          class="move-cap"
        >
          ăn {{ PIECE_CHARS[move.capturedPiece.side][move.capturedPiece.type] }}
        </span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.panel-card {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 16px;
  padding: 0.82rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel-card h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 0.96rem;
  font-weight: 800;
}

.stats-card {
  flex-direction: row;
  justify-content: space-around;
  text-align: center;
  padding: 0.42rem 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.stat-item span {
  font-size: 0.68rem;
  color: var(--text-dim);
  text-transform: uppercase;
}

.stat-item strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.02rem;
}

.stat-win { color: var(--property-group-a); }
.stat-draw { color: var(--primary); }
.stat-loss { color: var(--danger); }

.history-card {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.history-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.copy-notation-btn {
  padding: 0.2rem 0.55rem;
  border-radius: 7px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
}

.copy-notation-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.empty-history {
  font-size: 0.78rem;
  color: var(--text-dim);
  font-style: italic;
}

.move-list {
  list-style: none;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-right: 0.2rem;
}

.move-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.5rem;
  border-radius: 7px;
  background: var(--bg-sidebar);
  font-size: 0.76rem;
}

.move-idx {
  color: var(--text-dim);
  font-size: 0.7rem;
  min-width: 24px;
}

.move-side {
  padding: 0.08rem 0.36rem;
  border-radius: 5px;
  font-size: 0.68rem;
  font-weight: 700;
}

.move-side.red {
  background: rgba(239, 68, 68, 0.16);
  color: var(--danger);
}

.move-side.black {
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
}

.move-notation {
  font-weight: 600;
}

.move-cap {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--accent);
}

@media (max-width: 880px) {
  .history-card {
    max-height: 220px;
  }
}
</style>
