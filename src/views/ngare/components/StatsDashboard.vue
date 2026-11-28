<script setup lang="ts">
import { computed } from 'vue'
import { computeNetWorth, getLifeStage } from '../engine'
import type { GameState } from '../types'

interface Props {
  gameState: GameState
  statDeltas: Partial<Record<string, number>> | null
}

const props = defineProps<Props>()

const STAT_META: ReadonlyArray<{
  key: 'money' | 'skill' | 'happiness' | 'stress' | 'health' | 'relationships'
  icon: string
  label: string
}> = [
  { key: 'money', icon: '💰', label: 'Tiền mặt' },
  { key: 'skill', icon: '🧠', label: 'Kỹ năng' },
  { key: 'happiness', icon: '😊', label: 'Hạnh phúc' },
  { key: 'stress', icon: '😰', label: 'Áp lực' },
  { key: 'health', icon: '❤️', label: 'Sức khỏe' },
  { key: 'relationships', icon: '🤝', label: 'Quan hệ' },
]

const lifeStage = computed(() => getLifeStage(props.gameState.age))
const netWorth = computed(() => computeNetWorth(props.gameState))
const marketInfo = computed(() => {
  const trend = props.gameState.marketTrend ?? 'neutral'
  if (trend === 'bull') return { icon: '📈', label: 'Thị trường Tăng', cls: 'bull' }
  if (trend === 'bear') return { icon: '📉', label: 'Thị trường Giảm', cls: 'bear' }
  return { icon: '⚖️', label: 'Thị trường Ổn định', cls: 'neutral' }
})
const hasShield = computed(() =>
  (props.gameState.activeBuffs ?? []).some((b) => b.type === 'immunity_danger'),
)
const hasDouble = computed(() =>
  (props.gameState.activeBuffs ?? []).some((b) => b.type === 'double_positive'),
)
const isUnemployed = computed(() => Boolean(props.gameState.flags?.includes('unemployed')))

function barWidthPercent(key: string, val: number): string {
  const pct = Math.max(0, Math.min(100, val))
  if (key === 'money' && val > 100) return '100%'
  return `${pct}%`
}

function isDeltaPositive(key: string, delta: number): boolean {
  return key === 'stress' ? delta < 0 : delta > 0
}
</script>

<template>
  <section class="dashboard-box">
    <div class="stage-meta-row">
      <span
        class="stage-pill"
        :class="`stage-${lifeStage.id}`"
      >
        {{ lifeStage.emoji }} {{ lifeStage.label }}
      </span>
      <span class="meta-pill">
        💎 Tài sản ròng: <strong>{{ netWorth }}</strong>
      </span>
      <span
        class="meta-pill market-pill"
        :class="marketInfo.cls"
      >
        {{ marketInfo.icon }} {{ marketInfo.label }}
      </span>
      <span
        v-if="hasShield"
        class="meta-pill buff-pill"
      >
        🛡️ Khiên sẵn sàng
      </span>
      <span
        v-if="hasDouble"
        class="meta-pill buff-pill"
      >
        ✨ Nhân đôi lượt tới
      </span>
      <span
        v-if="isUnemployed"
        class="meta-pill danger-pill"
      >
        ⚠️ Đang thất nghiệp (Lương 0)
      </span>
    </div>

    <div class="stats-grid">
      <div
        v-for="item in STAT_META"
        :key="item.key"
        class="stat-item"
        :data-stat="item.key"
        :class="{
          'stat-warning':
            (item.key === 'stress' && gameState.stats[item.key] >= 80) ||
            (item.key === 'health' && gameState.stats[item.key] <= 20) ||
            (item.key === 'money' && gameState.stats[item.key] <= 12),
          'stat-positive': item.key !== 'stress' && gameState.stats[item.key] >= 100,
        }"
      >
        <div class="stat-header">
          <span class="stat-label-wrap">
            <span class="stat-icon">{{ item.icon }}</span>
            <span class="stat-name">{{ item.label }}</span>
          </span>
          <span class="stat-value-wrap">
            <span
              v-if="statDeltas && typeof statDeltas[item.key] === 'number' && statDeltas[item.key] !== 0"
              class="delta-chip"
              :class="isDeltaPositive(item.key, statDeltas[item.key] ?? 0) ? 'pos' : 'neg'"
            >
              {{ (statDeltas[item.key] ?? 0) > 0 ? `+${statDeltas[item.key]}` : statDeltas[item.key] }}
            </span>
            <strong class="stat-value">{{ gameState.stats[item.key] }}</strong>
          </span>
        </div>
        <div class="stat-bar">
          <div
            class="stat-fill"
            :class="`fill-${item.key}`"
            :style="{ width: barWidthPercent(item.key, gameState.stats[item.key]) }"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stage-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.stage-pill,
.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.68rem;
  border-radius: 99px;
  font-size: 0.76rem;
  font-weight: 700;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
}

.stage-pill {
  background: var(--primary-soft);
  border-color: var(--outline-strong);
  color: var(--primary);
}

.market-pill.bull {
  color: var(--success);
}

.market-pill.bear {
  color: var(--danger);
}

.buff-pill {
  background: var(--accent-soft);
  border-color: var(--accent-glow);
  color: var(--accent);
}

.danger-pill {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.stat-item {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 14px;
  padding: 0.52rem 0.72rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.stat-item.stat-warning {
  border-color: var(--danger);
  box-shadow: 0 0 12px var(--danger-bg);
}

.stat-item.stat-positive {
  border-color: var(--primary);
  box-shadow: 0 0 12px var(--primary-soft);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.stat-label-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.stat-name {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.stat-value {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.delta-chip {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.06rem 0.35rem;
  border-radius: 99px;
}

.delta-chip.pos {
  background: rgba(16, 185, 129, 0.16);
  color: var(--success);
}

.delta-chip.neg {
  background: var(--danger-bg);
  color: var(--danger);
}

.stat-bar {
  height: 7px;
  border-radius: 99px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

.fill-money { background: var(--warning); }
.fill-skill { background: var(--primary); }
.fill-happiness { background: var(--accent); }
.fill-stress { background: var(--danger); }
.fill-health { background: var(--success); }
.fill-relationships { background: var(--property-group-b); }

@media (max-width: 720px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
