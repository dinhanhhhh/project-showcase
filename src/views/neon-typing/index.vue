<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useIntervalFn, useLocalStorage } from '@vueuse/core'
import { calculateAccuracy, calculateWPM, createInitialState, getRandomWords } from './engine'
import type { GameState } from './types'

type DurationOption = 15 | 30 | 60

const topScore = useLocalStorage('neon_typing_highscore', 0)
const selectedDuration = ref<DurationOption>(30)
const state = ref<GameState>(createInitialState(40))
const inputRef = ref<HTMLInputElement | null>(null)
const timerRef = ref<number>(30)
const combo = ref(0)
const maxCombo = ref(0)
const recentResults = ref<Array<{ word: string; ok: boolean }>>([])
const isShaking = ref(false)

let shakeTimer: ReturnType<typeof setTimeout> | null = null

const { pause, resume } = useIntervalFn(
  () => {
    if (timerRef.value > 0) {
      timerRef.value -= 1
      state.value.timeLeft = timerRef.value
    }
    if (timerRef.value <= 0) {
      finishGame()
    }
  },
  1000,
  { immediate: false },
)

const currentWord = computed(() => state.value.words[state.value.currentIndex] ?? '')
const upcomingWords = computed(() =>
  state.value.words.slice(state.value.currentIndex + 1, state.value.currentIndex + 6),
)

const elapsedSeconds = computed(() => Math.max(0, selectedDuration.value - timerRef.value))

const wpmRealtime = computed(() =>
  calculateWPM(state.value.score.correctCount, elapsedSeconds.value),
)

const liveAccuracy = computed(() =>
  calculateAccuracy(state.value.score.correctCount, state.value.score.totalTyped),
)

const timeProgressPercent = computed(() =>
  Math.max(0, Math.min(100, (timerRef.value / selectedDuration.value) * 100)),
)

const inputProgressPercent = computed(() => {
  const len = currentWord.value.length
  if (len === 0) return 0
  return Math.min(100, (state.value.inputValue.trim().length / len) * 100)
})

const characterStates = computed(() => {
  const target = currentWord.value
  const typed = state.value.inputValue
  return target.split('').map((ch, idx) => {
    if (idx >= typed.length) return { char: ch, status: 'pending' as const }
    return {
      char: ch,
      status: typed[idx] === ch ? ('correct' as const) : ('wrong' as const),
    }
  })
})

const extraTypedChars = computed(() => {
  const typed = state.value.inputValue.trim()
  if (typed.length <= currentWord.value.length) return ''
  return typed.slice(currentWord.value.length)
})

function resetGame(autoFocus = true) {
  pause()
  state.value = createInitialState(40)
  timerRef.value = selectedDuration.value
  state.value.timeLeft = selectedDuration.value
  combo.value = 0
  maxCombo.value = 0
  recentResults.value = []
  if (autoFocus) {
    void nextTick(() => inputRef.value?.focus())
  }
}

function setDuration(seconds: DurationOption) {
  selectedDuration.value = seconds
  resetGame(true)
}

function triggerInputShake() {
  isShaking.value = false
  if (shakeTimer) clearTimeout(shakeTimer)
  requestAnimationFrame(() => {
    isShaking.value = true
    shakeTimer = setTimeout(() => {
      isShaking.value = false
    }, 320)
  })
}

function handleInput(e: Event) {
  if (state.value.isFinished) return

  const val = (e.target as HTMLInputElement).value

  // Tự động bắt đầu đếm giờ ngay khi người dùng gõ ký tự đầu tiên
  if (!state.value.isActive && val.trim().length > 0) {
    state.value.isActive = true
    resume()
  }

  if (val.endsWith(' ')) {
    const typed = val.trim()
    if (typed.length === 0) {
      state.value.inputValue = ''
      return
    }

    const isCorrect = typed === currentWord.value
    if (isCorrect) {
      state.value.score.correctCount += 1
      combo.value += 1
      if (combo.value > maxCombo.value) {
        maxCombo.value = combo.value
      }
    } else {
      combo.value = 0
      triggerInputShake()
    }

    recentResults.value = [...recentResults.value.slice(-7), { word: currentWord.value, ok: isCorrect }]
    state.value.score.totalTyped += 1
    state.value.score.accuracy = calculateAccuracy(
      state.value.score.correctCount,
      state.value.score.totalTyped,
    )
    state.value.currentIndex += 1
    state.value.inputValue = ''

    if (state.value.currentIndex + 10 >= state.value.words.length) {
      state.value.words.push(...getRandomWords(20))
    }
  }
}

function finishGame() {
  pause()
  state.value.isActive = false
  state.value.isFinished = true
  state.value.score.wpm = calculateWPM(state.value.score.correctCount, selectedDuration.value)
  state.value.score.accuracy = calculateAccuracy(
    state.value.score.correctCount,
    state.value.score.totalTyped,
  )

  if (state.value.score.wpm > topScore.value) {
    topScore.value = state.value.score.wpm
  }
}

onMounted(() => {
  resetGame(true)
})

onUnmounted(() => {
  pause()
  if (shakeTimer) clearTimeout(shakeTimer)
})
</script>

<template>
  <div class="typing-page">
    <div class="typing-shell">
      <header class="top-nav">
        <RouterLink
          to="/"
          class="back-btn"
        >
          ← Về Launcher
        </RouterLink>

        <div class="title-block">
          <h1>⌨️ Neon Speed Typist</h1>
          <p>Gõ ngay ký tự đầu tiên để tự động kích hoạt đồng hồ</p>
        </div>

        <div
          class="duration-pills"
          role="group"
          aria-label="Chọn thời lượng"
        >
          <button
            v-for="sec in ([15, 30, 60] as const)"
            :key="sec"
            type="button"
            :class="{ active: selectedDuration === sec }"
            @click="setDuration(sec)"
          >
            {{ sec }}s
          </button>
        </div>
      </header>

      <!-- Thanh Telemetry 4 chỉ số + Combo -->
      <section class="stats-bar glass-card">
        <div class="stat-cell">
          <span class="label">THỜI GIAN</span>
          <strong
            class="val"
            :class="{ danger: timerRef <= 10 && state.isActive }"
          >{{ timerRef }}s</strong>
        </div>
        <div class="stat-cell featured">
          <span class="label">TỐC ĐỘ (WPM)</span>
          <strong class="val neon">{{ state.isFinished ? state.score.wpm : wpmRealtime }}</strong>
        </div>
        <div class="stat-cell">
          <span class="label">CHÍNH XÁC</span>
          <strong class="val">{{ liveAccuracy }}%</strong>
        </div>
        <div class="stat-cell">
          <span class="label">COMBO</span>
          <strong class="val combo">{{ combo }} 🔥</strong>
        </div>
        <div class="stat-cell">
          <span class="label">KỶ LỤC</span>
          <strong class="val accent">{{ topScore }}</strong>
        </div>
      </section>

      <!-- Thanh tiến trình thời gian -->
      <div class="time-track">
        <div
          class="time-fill"
          :class="{ danger: timerRef <= 10 && state.isActive }"
          :style="{ width: `${timeProgressPercent}%` }"
        />
      </div>

      <!-- Khu vực chơi chính -->
      <main
        v-if="!state.isFinished"
        class="arena-card glass-card"
      >
        <div
          v-if="recentResults.length > 0"
          class="recent-strip"
        >
          <span
            v-for="(item, idx) in recentResults"
            :key="`${item.word}-${idx}`"
            class="recent-word"
            :class="item.ok ? 'ok' : 'bad'"
          >
            {{ item.word }}
          </span>
        </div>

        <div class="target-stage">
          <div
            class="target-word"
            aria-live="polite"
          >
            <span
              v-for="(c, idx) in characterStates"
              :key="idx"
              class="char"
              :class="c.status"
            >{{ c.char }}</span>
            <span
              v-if="extraTypedChars"
              class="char wrong extra"
            >{{ extraTypedChars }}</span>
          </div>

          <div class="upcoming-row">
            <span
              v-for="(w, idx) in upcomingWords"
              :key="`${w}-${idx}`"
              class="upcoming-word"
            >{{ w }}</span>
          </div>
        </div>

        <div
          class="input-wrap"
          :class="{ shake: isShaking }"
        >
          <input
            ref="inputRef"
            v-model="state.inputValue"
            type="text"
            placeholder="Bắt đầu gõ từ hiển thị ở trên rồi nhấn Space..."
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            @input="handleInput"
          >
          <div
            class="input-glow-bar"
            :style="{ width: `${inputProgressPercent}%` }"
          />
        </div>

        <div class="arena-footer">
          <span class="hint-text">
            Mẹo: Nhấn <kbd>Space</kbd> để chốt từng từ · Trạng thái:
            <strong>{{ state.isActive ? 'Đang chạy ⚡' : 'Chờ gõ phím đầu tiên' }}</strong>
          </span>
          <button
            type="button"
            class="restart-ghost"
            @click="resetGame(true)"
          >
            🔄 Làm mới
          </button>
        </div>
      </main>

      <!-- Kết quả cuối ván -->
      <section
        v-else
        class="result-card glass-card"
      >
        <div class="result-badge">
          ⚡ HOÀN THÀNH THỬ THÁCH {{ selectedDuration }}S
        </div>
        <h2 class="result-wpm">
          {{ state.score.wpm }} <span>WPM</span>
        </h2>

        <div class="result-grid">
          <div class="res-box">
            <span>Độ chính xác</span>
            <strong>{{ state.score.accuracy }}%</strong>
          </div>
          <div class="res-box">
            <span>Từ đúng / Tổng</span>
            <strong>{{ state.score.correctCount }} / {{ state.score.totalTyped }}</strong>
          </div>
          <div class="res-box">
            <span>Combo cao nhất</span>
            <strong class="combo">{{ maxCombo }} 🔥</strong>
          </div>
          <div class="res-box">
            <span>Kỷ lục cá nhân</span>
            <strong class="accent">{{ topScore }} WPM</strong>
          </div>
        </div>

        <button
          type="button"
          class="cta-retry"
          @click="resetGame(true)"
        >
          ⚡ Thử lại ngay
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.typing-page {
  min-height: 100dvh;
  width: 100%;
  background: var(--bg);
  color: var(--text);
  padding: 1.25rem;
  display: flex;
  justify-content: center;
  font-family: 'Inter', sans-serif;
}

.typing-shell {
  width: 100%;
  max-width: 860px;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.top-nav {
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
  font-size: 0.86rem;
}

.title-block {
  text-align: center;
  flex: 1;
}

.title-block h1 {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.35rem, 2.8vw, 1.9rem);
  font-weight: 800;
}

.title-block p {
  font-size: 0.84rem;
  color: var(--text-dim);
}

.duration-pills {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.duration-pills button {
  padding: 0.42rem 0.8rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.duration-pills button.active {
  background: var(--primary);
  color: var(--text-inverse);
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  padding: 1.1rem 1.25rem;
}

.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.stat-cell .label {
  font-size: 0.68rem;
  letter-spacing: 1.3px;
  color: var(--text-dim);
  font-weight: 700;
}

.stat-cell .val {
  font-family: 'Manrope', sans-serif;
  font-size: 1.55rem;
  font-weight: 800;
}

.val.neon {
  color: var(--primary);
  text-shadow: 0 0 18px var(--primary-glow);
}

.val.combo,
.combo {
  color: var(--warning);
}

.val.accent,
.accent {
  color: var(--accent);
}

.val.danger {
  color: var(--danger);
  animation: pulseWarn 0.8s infinite;
}

@keyframes pulseWarn {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.time-track {
  height: 6px;
  border-radius: 99px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  overflow: hidden;
}

.time-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transition: width 0.35s linear;
}

.time-fill.danger {
  background: var(--danger);
}

.arena-card {
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.recent-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.45rem;
}

.recent-word {
  padding: 0.18rem 0.55rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
}

.recent-word.ok {
  background: rgba(52, 211, 153, 0.14);
  color: var(--success);
}

.recent-word.bad {
  background: var(--danger-bg);
  color: var(--danger);
  text-decoration: line-through;
}

.target-stage {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.target-word {
  font-family: 'JetBrains Mono', 'Manrope', monospace;
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 0.65rem 1.4rem;
  border-radius: 18px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline-strong);
  box-shadow: 0 0 28px var(--primary-soft);
}

.char.pending {
  color: var(--text-dim);
}

.char.correct {
  color: var(--success);
  text-shadow: 0 0 12px rgba(52, 211, 153, 0.45);
}

.char.wrong {
  color: var(--danger);
  text-decoration: underline;
}

.upcoming-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
}

.upcoming-word {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.input-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 14px;
}

.input-wrap.shake {
  animation: inputShake 0.3s ease;
}

@keyframes inputShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-7px); }
  75% { transform: translateX(7px); }
}

.input-wrap input {
  width: 100%;
  padding: 1.05rem 1.25rem;
  background: var(--bg-input);
  border: 1.5px solid var(--outline);
  border-radius: 14px;
  color: var(--text);
  font-size: 1.15rem;
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
  outline: none;
  transition: var(--transition-fast);
}

.input-wrap input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.input-glow-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transition: width 0.12s ease;
}

.arena-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hint-text {
  font-size: 0.84rem;
  color: var(--text-dim);
}

.hint-text kbd {
  padding: 0.14rem 0.45rem;
  border-radius: 6px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.76rem;
}

.restart-ghost {
  padding: 0.5rem 0.95rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--primary);
  font-weight: 700;
  font-size: 0.84rem;
  cursor: pointer;
}

.result-card {
  padding: 2.25rem 1.75rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.35rem;
}

.result-badge {
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  background: var(--primary-soft);
  border: 1px solid var(--outline-strong);
  color: var(--primary);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 1px;
}

.result-wpm {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2.8rem, 7vw, 4.2rem);
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}

.result-wpm span {
  font-size: 1.25rem;
  color: var(--text-dim);
}

.result-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.res-box {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  border-radius: 14px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.res-box span {
  font-size: 0.78rem;
  color: var(--text-dim);
}

.res-box strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.3rem;
}

.cta-retry {
  padding: 0.9rem 2rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--text-inverse);
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 680px) {
  .stats-bar {
    grid-template-columns: repeat(3, 1fr);
  }

  .arena-card {
    padding: 1.25rem 1rem;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
