<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { copyTextWithFallback } from '@/utils/clipboard'
import { formatLifeRecapShareText, type LifeRecap } from '../engine'
import type { EndingDefinition, GameState, StatSnapshot } from '../types'

interface Props {
  gameState: GameState
  ending: EndingDefinition
  recap: LifeRecap
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'restart'): void
}>()

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const CHART_SERIES: ReadonlyArray<{
  key: keyof Pick<StatSnapshot, 'money' | 'skill' | 'happiness' | 'health' | 'stress'>
  label: string
  color: string
}> = [
  { key: 'money', label: 'Tiền', color: '#f59e0b' },
  { key: 'skill', label: 'Kỹ năng', color: '#38bdf8' },
  { key: 'happiness', label: 'Hạnh phúc', color: '#c084fc' },
  { key: 'health', label: 'Sức khỏe', color: '#34d399' },
  { key: 'stress', label: 'Áp lực', color: '#f87171' },
]

const STAT_META: ReadonlyArray<{ key: string; icon: string; label: string }> = [
  { key: 'money', icon: '💰', label: 'Tiền mặt' },
  { key: 'skill', icon: '🧠', label: 'Kỹ năng' },
  { key: 'happiness', icon: '😊', label: 'Hạnh phúc' },
  { key: 'stress', icon: '😰', label: 'Áp lực' },
  { key: 'health', icon: '❤️', label: 'Sức khỏe' },
  { key: 'relationships', icon: '🤝', label: 'Quan hệ' },
]

const snapshots = computed<StatSnapshot[]>(() => {
  const list = props.gameState.statSnapshots ?? []
  if (list.length >= 2) return list
  const s = props.gameState.stats
  return [
    {
      age: 22,
      money: s.money,
      skill: s.skill,
      happiness: s.happiness,
      stress: s.stress,
      health: s.health,
      relationships: s.relationships,
      netWorth: props.recap.netWorth,
    },
    {
      age: props.gameState.age,
      money: s.money,
      skill: s.skill,
      happiness: s.happiness,
      stress: s.stress,
      health: s.health,
      relationships: s.relationships,
      netWorth: props.recap.netWorth,
    },
  ]
})

const maxChartMoney = computed(() => {
  let maxVal = 100
  for (const snap of snapshots.value) {
    if (snap.money > maxVal) maxVal = snap.money
  }
  return maxVal
})

const chartLines = computed(() => {
  const list = snapshots.value
  const w = 520
  const h = 150
  const padX = 16
  const padY = 14
  const span = Math.max(1, list.length - 1)

  return CHART_SERIES.map((series) => {
    const pts = list
      .map((snap, idx) => {
        const x = padX + (idx / span) * (w - padX * 2)
        const raw = snap[series.key]
        const norm =
          series.key === 'money'
            ? Math.min(1, Math.max(0, raw / maxChartMoney.value))
            : Math.min(1, Math.max(0, raw / 100))
        const y = h - padY - norm * (h - padY * 2)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    return {
      ...series,
      points: pts,
    }
  })
})

function getStatLabel(key: string): string {
  return STAT_META.find((s) => s.key === key)?.label ?? key
}

async function copyLifeSummary() {
  const text = formatLifeRecapShareText(props.gameState, props.ending, props.recap)
  const ok = await copyTextWithFallback(text)
  if (!ok) return
  copied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copied.value = false
  }, 2200)
}

onUnmounted(() => {
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
  <div class="end-container">
    <div class="end-header">
      <div class="end-icon">
        {{ ending.icon }}
      </div>
      <div class="end-header-text">
        <span
          v-if="ending.isSpecial"
          class="special-tag"
        >
          ✨ KẾT CỤC ĐẶC BIỆT
        </span>
        <h2 class="end-title">
          {{ ending.title }}
        </h2>
        <p class="end-subtitle">
          {{ ending.subtitle }}
        </p>
      </div>
    </div>

    <div class="recap-highlights">
      <span class="recap-chip">
        🏅 Điểm: <strong>{{ recap.totalScore }}</strong>
      </span>
      <span class="recap-chip">
        ⏳ Hành trình: <strong>{{ recap.yearsLived }} năm (Tuổi {{ gameState.age }})</strong>
      </span>
      <span class="recap-chip">
        💎 Tài sản ròng: <strong>{{ recap.netWorth }}</strong>
      </span>
      <span class="recap-chip">
        🏆 Thành tựu: <strong>{{ recap.milestonesCount }}</strong>
      </span>
      <span class="recap-chip best">
        💪 Mạnh nhất:
        <strong>{{ getStatLabel(String(recap.strongestStat.key)) }} ({{ recap.strongestStat.value }})</strong>
      </span>
      <span class="recap-chip weak">
        🌱 Cần rèn:
        <strong>{{ getStatLabel(String(recap.weakestStat.key)) }} ({{ recap.weakestStat.value }})</strong>
      </span>
    </div>

    <div class="end-body-grid">
      <div class="chart-card">
        <div class="chart-head">
          <strong>📈 Đồ Thị Cuộc Đời ({{ snapshots[0]?.age ?? 22 }} → {{ snapshots[snapshots.length - 1]?.age ?? gameState.age }} tuổi)</strong>
          <div class="chart-legend">
            <span
              v-for="s in CHART_SERIES"
              :key="s.key"
              class="legend-item"
            >
              <i :style="{ background: s.color }" />{{ s.label }}
            </span>
          </div>
        </div>
        <svg
          class="life-svg"
          viewBox="0 0 520 150"
          preserveAspectRatio="none"
          role="img"
          aria-label="Biểu đồ diễn biến chỉ số qua các năm"
        >
          <line
            x1="16"
            y1="38"
            x2="504"
            y2="38"
            stroke="currentColor"
            stroke-opacity="0.12"
            stroke-dasharray="4 4"
          />
          <line
            x1="16"
            y1="75"
            x2="504"
            y2="75"
            stroke="currentColor"
            stroke-opacity="0.12"
            stroke-dasharray="4 4"
          />
          <line
            x1="16"
            y1="112"
            x2="504"
            y2="112"
            stroke="currentColor"
            stroke-opacity="0.12"
            stroke-dasharray="4 4"
          />
          <polyline
            v-for="line in chartLines"
            :key="line.key"
            fill="none"
            :stroke="line.color"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="line.points"
          />
        </svg>
      </div>

      <div class="end-stats">
        <div
          v-for="stat in STAT_META"
          :key="stat.key"
          class="end-stat-card"
        >
          <span class="es-icon">{{ stat.icon }}</span>
          <div class="es-info">
            <strong class="es-value">{{ gameState.stats[stat.key] }}</strong>
            <span class="es-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="end-actions">
      <button
        type="button"
        class="btn-action primary"
        @click="emit('restart')"
      >
        🔄 Chơi Lại
      </button>
      <button
        type="button"
        class="btn-action secondary"
        @click="copyLifeSummary"
      >
        {{ copied ? '✅ Đã chép hồ sơ' : '📋 Chép hồ sơ cuộc đời' }}
      </button>
      <RouterLink
        to="/"
        class="btn-action secondary"
      >
        🏠 Về Trang Chủ
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.end-container {
  max-width: 1080px;
  width: 100%;
  margin: 0 auto;
  padding: 0.35rem 0.25rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.end-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--outline-strong);
  border-radius: 20px;
  padding: 0.9rem 1.25rem;
}

.end-header-text {
  min-width: 0;
}

.end-icon {
  font-size: 2.6rem;
  line-height: 1.1;
  flex-shrink: 0;
}

.special-tag {
  display: inline-block;
  margin-bottom: 0.25rem;
  padding: 0.16rem 0.6rem;
  border-radius: 99px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 800;
}

.end-title {
  font-size: clamp(1.3rem, 2.4vw, 1.7rem);
  font-weight: 800;
  color: var(--primary);
  line-height: 1.2;
}

.end-subtitle {
  margin-top: 0.2rem;
  font-size: 0.88rem;
  color: var(--text-dim);
}

.recap-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
}

.recap-chip {
  padding: 0.28rem 0.65rem;
  border-radius: 99px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-size: 0.78rem;
  color: var(--text);
}

.recap-chip.best {
  border-color: var(--success);
}

.recap-chip.weak {
  border-color: var(--warning);
}

.end-body-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 0.85rem;
  align-items: stretch;
}

.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 18px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chart-head strong {
  font-size: 0.86rem;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  font-size: 0.72rem;
  color: var(--text-dim);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
}

.legend-item i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.life-svg {
  width: 100%;
  height: 172px;
  color: var(--text-dim);
}

.end-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.end-stat-card {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 14px;
  padding: 0.6rem 0.8rem;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.es-icon {
  font-size: 1.35rem;
  flex-shrink: 0;
}

.es-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.es-value {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.15;
}

.es-label {
  font-size: 0.74rem;
  color: var(--text-dim);
}

.end-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  justify-content: center;
}

.btn-action {
  padding: 0.65rem 1.2rem;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-action.primary {
  background: var(--primary);
  border: 1px solid var(--primary);
  color: var(--text-inverse);
}

.btn-action.secondary {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
}

.btn-action.secondary:hover {
  border-color: var(--primary);
}

@media (max-width: 860px) {
  .end-body-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .life-svg {
    height: 150px;
  }
}

@media (max-width: 580px) {
  .end-header {
    flex-direction: column;
    text-align: center;
    gap: 0.45rem;
  }

  .end-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
