<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useColorGameStore } from '@/stores/colorGame'
import { useColorAudio } from './composables/useColorAudio'
import {
  MAX_LIFELINES,
  TIME_ATTACK_BONUS_SECONDS,
  TIME_ATTACK_PENALTY_SECONDS,
  TIME_ATTACK_START_SECONDS,
  applyFiftyFifty,
  buildColorRound,
  createSwatch,
  formatColorSwatch,
  getComboMultiplier,
  getFormatAccuracy,
  getRoundPoints,
} from './engine'
import type { ColorFormat, ColorGameMode, ColorSwatch, GridSize } from './types'

const store = useColorGameStore()
const { playCorrect, playWrong, playLifeline, playTimeUp } = useColorAudio()

const gameMode = ref<ColorGameMode>('classic')
const colorFormat = ref<ColorFormat>('rgb')
const gridSize = ref<GridSize>(6)

const target = ref<ColorSwatch>(createSwatch(109, 221, 255))
const options = ref<ColorSwatch[]>([])
const eliminatedHexes = ref<Record<string, boolean>>({})
const score = ref(0)
const streak = ref(0)
const sessionMaxStreak = ref(0)
const roundsCleared = ref(0)
const lifelinesLeft = ref(MAX_LIFELINES)
const usedLifelineThisRound = ref(false)

const timeLeft = ref(TIME_ATTACK_START_SECONDS)
const isTimeAttackRunning = ref(false)
const isTimeAttackOver = ref(false)
const timeDeltaHint = ref<string | null>(null)

const statusText = ref('Quan sát thông số màu và chọn ô màu khớp nhất!')
const statusType = ref<'neutral' | 'win' | 'miss'>('neutral')
const isRoundWon = ref(false)

let nextRoundTimer: ReturnType<typeof setTimeout> | null = null
let timeAttackInterval: ReturnType<typeof setInterval> | null = null
let deltaHintTimer: ReturnType<typeof setTimeout> | null = null
let copyTimer: ReturnType<typeof setTimeout> | null = null

const isCopied = ref(false)

const displayCode = computed(() => formatColorSwatch(target.value, colorFormat.value))

const currentBestScore = computed(() =>
  gameMode.value === 'classic' ? store.bestClassicScore : store.bestTimeAttackScore,
)

const activeMultiplier = computed(() => getComboMultiplier(streak.value))

const timeProgressPercent = computed(() =>
  Math.max(0, Math.min(100, (timeLeft.value / TIME_ATTACK_START_SECONDS) * 100)),
)

const formatAccuracies = computed(() => {
  const stats = store.formatStats ?? {
    rgb: { hits: 0, attempts: 0 },
    hex: { hits: 0, attempts: 0 },
    hsl: { hits: 0, attempts: 0 },
  }
  return (['rgb', 'hex', 'hsl'] as const).map((fmt) => ({
    format: fmt,
    label: fmt.toUpperCase(),
    attempts: stats[fmt]?.attempts ?? 0,
    accuracy: getFormatAccuracy(stats[fmt]?.hits ?? 0, stats[fmt]?.attempts ?? 0),
  }))
})

const canUseLifeline = computed(
  () =>
    !isRoundWon.value &&
    !isTimeAttackOver.value &&
    lifelinesLeft.value > 0 &&
    !usedLifelineThisRound.value,
)

function clearTimers() {
  if (nextRoundTimer) {
    clearTimeout(nextRoundTimer)
    nextRoundTimer = null
  }
  if (timeAttackInterval) {
    clearInterval(timeAttackInterval)
    timeAttackInterval = null
  }
  if (deltaHintTimer) {
    clearTimeout(deltaHintTimer)
    deltaHintTimer = null
  }
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
}

async function copyTargetCode() {
  try {
    await navigator.clipboard?.writeText(displayCode.value)
    isCopied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      isCopied.value = false
    }, 1600)
  } catch {
    // Trình duyệt không cấp quyền clipboard
  }
}

function flashTimeDelta(label: string) {
  timeDeltaHint.value = label
  if (deltaHintTimer) clearTimeout(deltaHintTimer)
  deltaHintTimer = setTimeout(() => {
    timeDeltaHint.value = null
  }, 900)
}

function startTimeAttackTicker() {
  if (timeAttackInterval) return
  isTimeAttackRunning.value = true
  timeAttackInterval = setInterval(() => {
    timeLeft.value = Math.max(0, timeLeft.value - 1)
    if (timeLeft.value <= 0) {
      finishTimeAttack()
    }
  }, 1000)
}

function finishTimeAttack() {
  clearTimers()
  isTimeAttackRunning.value = false
  isTimeAttackOver.value = true
  store.recordTimeAttack(score.value, sessionMaxStreak.value)
  playTimeUp(store.soundEnabled)
}

function startNewRound() {
  if (nextRoundTimer) {
    clearTimeout(nextRoundTimer)
    nextRoundTimer = null
  }
  const round = buildColorRound(gridSize.value)
  target.value = round.target
  options.value = round.options
  eliminatedHexes.value = {}
  usedLifelineThisRound.value = false
  isRoundWon.value = false
  isCopied.value = false
  statusType.value = 'neutral'
  statusText.value = 'Chọn ô màu khớp với mã bên trên (hoặc nhấn phím 1–9)!'
}

function resetSession() {
  clearTimers()
  score.value = 0
  streak.value = 0
  sessionMaxStreak.value = 0
  roundsCleared.value = 0
  lifelinesLeft.value = MAX_LIFELINES
  timeLeft.value = TIME_ATTACK_START_SECONDS
  isTimeAttackRunning.value = false
  isTimeAttackOver.value = false
  timeDeltaHint.value = null
  startNewRound()
}

function setMode(mode: ColorGameMode) {
  if (gameMode.value === mode) return
  gameMode.value = mode
  resetSession()
}

function setGridSize(size: GridSize) {
  gridSize.value = size
  startNewRound()
}

function useLifeline() {
  if (!canUseLifeline.value) return
  eliminatedHexes.value = applyFiftyFifty(
    options.value,
    target.value.hex,
    eliminatedHexes.value,
  )
  lifelinesLeft.value -= 1
  usedLifelineThisRound.value = true
  statusType.value = 'neutral'
  statusText.value = '🪄 Đã loại bỏ 50% ô màu sai!'
  playLifeline(store.soundEnabled)
}

function handlePick(choice: ColorSwatch) {
  if (isRoundWon.value || isTimeAttackOver.value || eliminatedHexes.value[choice.hex]) return

  if (gameMode.value === 'time_attack' && !isTimeAttackRunning.value) {
    startTimeAttackTicker()
  }

  if (choice.hex === target.value.hex) {
    store.recordAttempt(colorFormat.value, true)
    isRoundWon.value = true
    streak.value += 1
    roundsCleared.value += 1
    if (streak.value > sessionMaxStreak.value) {
      sessionMaxStreak.value = streak.value
    }

    const earned = getRoundPoints(gridSize.value, streak.value)
    score.value += earned
    playCorrect(store.soundEnabled, streak.value)

    if (gameMode.value === 'time_attack') {
      timeLeft.value = Math.min(60, timeLeft.value + TIME_ATTACK_BONUS_SECONDS)
      flashTimeDelta(`+${TIME_ATTACK_BONUS_SECONDS}s`)
      store.recordTimeAttack(score.value, sessionMaxStreak.value)
    } else {
      store.recordClassic(score.value, sessionMaxStreak.value)
    }

    const mult = getComboMultiplier(streak.value)
    statusType.value = 'win'
    statusText.value =
      mult > 1
        ? `Chính xác! +${earned} điểm (Combo x${mult} · Chuỗi ${streak.value} 🔥)`
        : `Chính xác! +${earned} điểm (Chuỗi thắng ${streak.value} 🔥)`

    const delayMs = gameMode.value === 'time_attack' ? 650 : 1200
    nextRoundTimer = setTimeout(startNewRound, delayMs)
  } else {
    store.recordAttempt(colorFormat.value, false)
    eliminatedHexes.value = { ...eliminatedHexes.value, [choice.hex]: true }
    streak.value = 0
    score.value = Math.max(0, score.value - 1)
    playWrong(store.soundEnabled)

    if (gameMode.value === 'time_attack') {
      timeLeft.value = Math.max(0, timeLeft.value - TIME_ATTACK_PENALTY_SECONDS)
      flashTimeDelta(`-${TIME_ATTACK_PENALTY_SECONDS}s`)
      if (timeLeft.value <= 0) {
        finishTimeAttack()
        return
      }
    }

    statusType.value = 'miss'
    statusText.value = `Chưa đúng! Ô đó là ${formatColorSwatch(choice, colorFormat.value)} — thử ô khác nhé.`
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (document.querySelector('[role="dialog"]')) return

  if (e.key >= '1' && e.key <= '9') {
    const idx = Number(e.key) - 1
    const opt = options.value[idx]
    if (opt) {
      e.preventDefault()
      handlePick(opt)
    }
    return
  }

  const lower = e.key.toLowerCase()
  if (lower === 'h') {
    e.preventDefault()
    useLifeline()
  } else if (lower === 'r') {
    e.preventDefault()
    if (gameMode.value === 'time_attack') resetSession()
    else startNewRound()
  }
}

onMounted(() => {
  startNewRound()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  clearTimers()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="color-page">
    <div class="color-shell">
      <header class="top-bar">
        <RouterLink
          class="back-btn"
          to="/"
        >
          ← Về Launcher
        </RouterLink>

        <div class="title-wrap">
          <h1>🎨 Color Studio Reflex</h1>
          <p>RGB · HEX · HSL · Phím tắt <kbd>1–9</kbd>, <kbd>H</kbd> (50:50), <kbd>R</kbd> đổi màu</p>
        </div>

        <button
          type="button"
          class="sound-btn"
          :class="{ muted: !store.soundEnabled }"
          @click="store.toggleSound()"
        >
          {{ store.soundEnabled ? '🔊' : '🔇' }}
        </button>
      </header>

      <!-- Thanh chỉ số -->
      <section
        class="metrics-strip"
        :class="{ 'four-cols': gameMode === 'time_attack' }"
      >
        <div class="metric-pill">
          <span>Điểm</span>
          <strong>{{ score }}</strong>
        </div>
        <div
          v-if="gameMode === 'time_attack'"
          class="metric-pill timer"
          :class="{ danger: timeLeft <= 10 && isTimeAttackRunning }"
        >
          <span>Thời gian</span>
          <strong>
            {{ timeLeft }}s
            <em
              v-if="timeDeltaHint"
              class="delta-badge"
            >{{ timeDeltaHint }}</em>
          </strong>
        </div>
        <div class="metric-pill streak">
          <span>Streak</span>
          <strong>{{ streak }} 🔥 <em v-if="activeMultiplier > 1">x{{ activeMultiplier }}</em></strong>
        </div>
        <div class="metric-pill best">
          <span>Kỷ lục</span>
          <strong>{{ currentBestScore }} 🏆</strong>
        </div>
      </section>

      <!-- Thanh thời gian cho Time Attack -->
      <div
        v-if="gameMode === 'time_attack'"
        class="timer-track"
      >
        <div
          class="timer-fill"
          :class="{ danger: timeLeft <= 10 }"
          :style="{ width: `${timeProgressPercent}%` }"
        />
      </div>

      <!-- Thanh công cụ chế độ, định dạng màu, độ khó -->
      <section class="toolbar-row">
        <div class="segmented">
          <button
            type="button"
            :class="{ active: gameMode === 'classic' }"
            @click="setMode('classic')"
          >
            🎨 Tự do
          </button>
          <button
            type="button"
            :class="{ active: gameMode === 'time_attack' }"
            @click="setMode('time_attack')"
          >
            ⏱️ Time Attack 45s
          </button>
        </div>

        <div class="segmented">
          <button
            type="button"
            :class="{ active: colorFormat === 'rgb' }"
            @click="colorFormat = 'rgb'"
          >
            RGB
          </button>
          <button
            type="button"
            :class="{ active: colorFormat === 'hex' }"
            @click="colorFormat = 'hex'"
          >
            HEX
          </button>
          <button
            type="button"
            :class="{ active: colorFormat === 'hsl' }"
            @click="colorFormat = 'hsl'"
          >
            HSL
          </button>
        </div>

        <div class="segmented">
          <button
            type="button"
            :class="{ active: gridSize === 4 }"
            @click="setGridSize(4)"
          >
            4 ô
          </button>
          <button
            type="button"
            :class="{ active: gridSize === 6 }"
            @click="setGridSize(6)"
          >
            6 ô
          </button>
          <button
            type="button"
            :class="{ active: gridSize === 9 }"
            @click="setGridSize(9)"
          >
            9 ô
          </button>
        </div>
      </section>

      <!-- Màn hình tổng kết Time Attack -->
      <section
        v-if="isTimeAttackOver"
        class="studio-card summary-card"
      >
        <div class="summary-badge">
          ⏱️ HẾT GIỜ TIME ATTACK!
        </div>
        <h2 class="summary-score">
          {{ score }} <span>điểm</span>
        </h2>
        <div class="summary-grid">
          <div class="sum-box">
            <span>Số màu đoán đúng</span>
            <strong>{{ roundsCleared }} vòng</strong>
          </div>
          <div class="sum-box">
            <span>Chuỗi cao nhất</span>
            <strong>{{ sessionMaxStreak }} 🔥</strong>
          </div>
          <div class="sum-box">
            <span>Kỷ lục Time Attack</span>
            <strong>{{ store.bestTimeAttackScore }} 🏆</strong>
          </div>
        </div>
        <button
          type="button"
          class="replay-btn"
          @click="resetSession"
        >
          ⚡ Chơi lại Time Attack
        </button>
      </section>

      <!-- Khu vực chơi chính -->
      <main
        v-else
        class="studio-card"
      >
        <div class="code-display">
          <div class="code-header-row">
            <span class="code-eyebrow">
              MÃ MÀU MỤC TIÊU ({{ colorFormat.toUpperCase() }})
            </span>
            <button
              type="button"
              class="copy-code-btn"
              @click="copyTargetCode"
            >
              {{ isCopied ? '✅ Đã chép' : '📋 Copy mã' }}
            </button>
          </div>
          <div class="target-code">
            {{ displayCode }}
          </div>

          <div class="format-acc-strip">
            <span
              v-for="stat in formatAccuracies"
              :key="stat.format"
              class="acc-pill"
              :class="{ active: stat.format === colorFormat }"
            >
              {{ stat.label }}:
              <strong>{{ stat.attempts > 0 ? `${stat.accuracy}%` : '—' }}</strong>
            </span>
          </div>

          <!-- Phân tích kênh HSL khi chọn hệ màu HSL -->
          <div
            v-if="colorFormat === 'hsl'"
            class="channel-bars"
          >
            <div class="channel-item">
              <div class="ch-label">
                <span>H (Tông màu)</span>
                <strong>{{ target.hslValue.h }}°</strong>
              </div>
              <div class="ch-track">
                <div
                  class="ch-fill hue"
                  :style="{ width: `${(target.hslValue.h / 360) * 100}%` }"
                />
              </div>
            </div>

            <div class="channel-item">
              <div class="ch-label">
                <span>S (Độ bão hòa)</span>
                <strong>{{ target.hslValue.s }}%</strong>
              </div>
              <div class="ch-track">
                <div
                  class="ch-fill sat"
                  :style="{ width: `${target.hslValue.s}%` }"
                />
              </div>
            </div>

            <div class="channel-item">
              <div class="ch-label">
                <span>L (Độ sáng)</span>
                <strong>{{ target.hslValue.l }}%</strong>
              </div>
              <div class="ch-track">
                <div
                  class="ch-fill light"
                  :style="{ width: `${target.hslValue.l}%` }"
                />
              </div>
            </div>
          </div>

          <!-- Phân tích kênh RGB -->
          <div
            v-else
            class="channel-bars"
          >
            <div class="channel-item">
              <div class="ch-label">
                <span>R (Đỏ)</span>
                <strong>{{ Math.round((target.r / 255) * 100) }}%</strong>
              </div>
              <div class="ch-track">
                <div
                  class="ch-fill red"
                  :style="{ width: `${(target.r / 255) * 100}%` }"
                />
              </div>
            </div>

            <div class="channel-item">
              <div class="ch-label">
                <span>G (Lục)</span>
                <strong>{{ Math.round((target.g / 255) * 100) }}%</strong>
              </div>
              <div class="ch-track">
                <div
                  class="ch-fill green"
                  :style="{ width: `${(target.g / 255) * 100}%` }"
                />
              </div>
            </div>

            <div class="channel-item">
              <div class="ch-label">
                <span>B (Lam)</span>
                <strong>{{ Math.round((target.b / 255) * 100) }}%</strong>
              </div>
              <div class="ch-track">
                <div
                  class="ch-fill blue"
                  :style="{ width: `${(target.b / 255) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          class="color-grid"
          :class="`cols-${gridSize === 4 ? 2 : 3}`"
        >
          <button
            v-for="(item, idx) in options"
            :key="item.hex"
            type="button"
            class="color-tile"
            :class="{
              eliminated: eliminatedHexes[item.hex],
              winner: isRoundWon && item.hex === target.hex,
            }"
            :style="{ backgroundColor: item.rgb }"
            :aria-label="`Ô màu ${idx + 1} (Phím ${idx + 1})`"
            @click="handlePick(item)"
          >
            <span class="tile-hotkey">{{ idx + 1 }}</span>
            <span
              v-if="eliminatedHexes[item.hex] || isRoundWon"
              class="tile-code"
            >
              {{ isRoundWon && item.hex === target.hex ? '✓ ' : '✕ ' }}{{ formatColorSwatch(item, colorFormat) }}
            </span>
          </button>
        </div>

        <div class="footer-bar">
          <p
            class="status-msg"
            :class="statusType"
          >
            {{ statusText }}
          </p>
          <div class="footer-actions">
            <button
              type="button"
              class="lifeline-btn"
              :disabled="!canUseLifeline"
              @click="useLifeline"
            >
              🪄 50:50 ({{ lifelinesLeft }})
            </button>
            <button
              type="button"
              class="skip-btn"
              @click="gameMode === 'time_attack' ? resetSession() : startNewRound()"
            >
              {{ gameMode === 'time_attack' ? '🔄 Làm mới' : '🔄 Đổi màu' }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.color-page {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  padding: 1.25rem;
  font-family: 'Inter', sans-serif;
}

.color-shell {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.back-btn,
.sound-btn {
  padding: 0.5rem 0.95rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
}

.sound-btn.muted {
  color: var(--text-dim);
}

.title-wrap {
  text-align: center;
  flex: 1;
}

.title-wrap h1 {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.35rem, 2.8vw, 1.85rem);
  font-weight: 800;
}

.title-wrap p {
  font-size: 0.84rem;
  color: var(--text-dim);
}

.metrics-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.metrics-strip.four-cols {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-pill {
  padding: 0.55rem 0.85rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-pill span {
  font-size: 0.68rem;
  color: var(--text-dim);
  text-transform: uppercase;
  font-weight: 700;
}

.metric-pill strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  color: var(--primary);
}

.metric-pill.timer strong {
  color: var(--text);
}

.metric-pill.timer.danger {
  border-color: var(--danger);
}

.metric-pill.timer.danger strong {
  color: var(--danger);
}

.delta-badge {
  font-style: normal;
  font-size: 0.78rem;
  margin-left: 0.3rem;
  color: var(--accent);
}

.metric-pill.streak strong {
  color: var(--warning);
}

.metric-pill.streak em {
  font-style: normal;
  font-size: 0.82rem;
  color: var(--primary);
}

.metric-pill.best strong {
  color: var(--accent);
}

.timer-track {
  height: 6px;
  border-radius: 99px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transition: width 0.3s linear;
}

.timer-fill.danger {
  background: var(--danger);
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.segmented {
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.segmented button {
  padding: 0.44rem 0.78rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
}

.segmented button.active {
  background: var(--primary);
  color: var(--text-inverse);
}

.studio-card {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 24px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  box-shadow: var(--shadow-card);
}

.summary-card {
  text-align: center;
  align-items: center;
  padding: 2.2rem 1.5rem;
}

.summary-badge {
  padding: 0.32rem 0.9rem;
  border-radius: 999px;
  background: var(--primary-soft);
  border: 1px solid var(--outline-strong);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 800;
}

.summary-score {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2.8rem, 6vw, 4rem);
  color: var(--primary);
  line-height: 1;
}

.summary-score span {
  font-size: 1.2rem;
  color: var(--text-dim);
}

.summary-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.sum-box {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  border-radius: 14px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sum-box span {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.sum-box strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.2rem;
}

.replay-btn {
  padding: 0.85rem 1.9rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--text-inverse);
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
}

.code-display {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  border-radius: 18px;
  padding: 1.2rem;
  text-align: center;
}

.code-eyebrow {
  font-size: 0.72rem;
  letter-spacing: 1.6px;
  color: var(--text-dim);
  font-weight: 700;
}

.target-code {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: clamp(1.35rem, 3.5vw, 2.1rem);
  font-weight: 800;
  color: var(--primary);
  margin: 0.35rem 0 1rem;
}

.channel-bars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
}

.channel-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.ch-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-dim);
}

.ch-track {
  height: 7px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.ch-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
}

.ch-fill.red { background: #ff5555; }
.ch-fill.green { background: #34d399; }
.ch-fill.blue { background: #38bdf8; }
.ch-fill.hue { background: linear-gradient(90deg, #ff5555, #fbbf24, #34d399, #38bdf8, #a855f7, #ff5555); }
.ch-fill.sat { background: var(--accent); }
.ch-fill.light { background: var(--primary); }

.color-grid {
  display: grid;
  gap: 1rem;
}

.color-grid.cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.color-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.color-tile {
  height: 118px;
  border-radius: 18px;
  border: 2px solid rgba(255, 255, 255, 0.14);
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0.65rem;
  transition: transform 0.18s ease, opacity 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
}

.color-tile:hover:not(.eliminated) {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.55);
}

.color-tile.eliminated {
  opacity: 0.26;
  transform: scale(0.96);
  cursor: not-allowed;
}

.color-tile.winner {
  border-color: #ffffff;
  box-shadow: 0 0 28px rgba(255, 255, 255, 0.6);
  transform: scale(1.03);
}

.tile-code {
  padding: 0.22rem 0.6rem;
  border-radius: 8px;
  background: rgba(6, 14, 32, 0.84);
  color: #f8fafc;
  font-family: monospace;
  font-size: 0.74rem;
  font-weight: 700;
}

.footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.status-msg {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-dim);
}

.status-msg.win {
  color: var(--success);
}

.status-msg.miss {
  color: var(--danger);
}

.footer-actions {
  display: flex;
  gap: 0.55rem;
}

.lifeline-btn,
.skip-btn {
  padding: 0.58rem 1rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline-strong);
  color: var(--primary);
  font-weight: 700;
  font-size: 0.84rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.lifeline-btn {
  border-color: var(--accent-glow);
  color: var(--accent);
}

.lifeline-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lifeline-btn:not(:disabled):hover {
  background: var(--accent);
  color: var(--text-inverse);
}

.skip-btn:hover {
  background: var(--primary);
  color: var(--text-inverse);
}

@media (max-width: 640px) {
  .color-page {
    padding: 0.85rem 0.75rem 2rem;
  }

  .color-shell {
    gap: 0.65rem;
  }

  .top-bar {
    gap: 0.5rem;
  }

  .title-wrap {
    order: 3;
    flex-basis: 100%;
  }

  .title-wrap h1 {
    font-size: 1.32rem;
  }

  .title-wrap p {
    font-size: 0.74rem;
  }

  .metrics-strip {
    gap: 0.4rem;
  }

  .metric-pill {
    padding: 0.42rem 0.35rem;
    border-radius: 11px;
  }

  .metric-pill span {
    font-size: 0.6rem;
  }

  .metric-pill strong {
    font-size: 0.98rem;
  }

  .toolbar-row {
    gap: 0.45rem;
  }

  .segmented button {
    padding: 0.36rem 0.6rem;
    font-size: 0.75rem;
  }

  .studio-card {
    padding: 0.9rem;
    gap: 0.85rem;
    border-radius: 18px;
  }

  .code-display {
    padding: 0.75rem 0.7rem;
  }

  .target-code {
    font-size: 1.3rem;
    margin: 0.25rem 0 0.65rem;
  }

  .channel-bars {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
  }

  .ch-label {
    font-size: 0.68rem;
  }

  .color-grid {
    gap: 0.65rem;
  }

  .color-grid.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .color-tile {
    height: 80px;
    border-radius: 14px;
    padding: 0.4rem;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.code-header-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.copy-code-btn {
  padding: 0.24rem 0.62rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.copy-code-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.format-acc-strip {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.75rem;
}

.acc-pill {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-size: 0.74rem;
  color: var(--text-dim);
}

.acc-pill.active {
  border-color: var(--primary);
  color: var(--text);
}

.color-tile {
  position: relative;
}

.tile-hotkey {
  position: absolute;
  top: 7px;
  left: 8px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.55);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
</style>
