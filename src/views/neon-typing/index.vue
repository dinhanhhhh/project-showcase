<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useIntervalFn, useLocalStorage } from '@vueuse/core'
import { createInitialState, calculateWPM, calculateAccuracy, getRandomWords } from './engine'
import type { GameState } from './types'

// Persistence Highscore
const topScore = useLocalStorage('neon_typing_highscore', 0)

// Reactive Local State
const state = ref<GameState>(createInitialState())
const inputRef = ref<HTMLInputElement | null>(null)
const timerRef = ref<number>(30)

// Logic đếm ngược
const { pause, resume } = useIntervalFn(() => {
  if (timerRef.value > 0) {
    timerRef.value--
    state.value.timeLeft = timerRef.value
  } else {
    finishGame()
  }
}, 1000, { immediate: false })

// Computed cho hiển thị
const currentWord = computed(() => state.value.words[state.value.currentIndex])
const wpmRealtime = computed(() => calculateWPM(state.value.score.correctCount, 30 - timerRef.value))

// Hành động Game
const startGame = () => {
  state.value = createInitialState()
  timerRef.value = 30
  state.value.isActive = true
  resume()
  nextTick(() => inputRef.value?.focus())
}

const handleInput = (e: Event) => {
  if (!state.value.isActive || state.value.isFinished) return
  
  const val = (e.target as HTMLInputElement).value
  
  // Nếu gõ space hoặc đúng toàn bộ từ
  if (val.endsWith(' ')) {
    const typed = val.trim()
    if (typed === currentWord.value) {
      state.value.score.correctCount++
    }
    state.value.score.totalTyped++
    state.value.currentIndex++
    state.value.inputValue = ''
    
    // Nếu hết từ thì nạp thêm
    if (state.value.currentIndex >= state.value.words.length) {
      state.value.words.push(...getRandomWords(10))
    }
  }
}

const finishGame = () => {
  pause()
  state.value.isActive = false
  state.value.isFinished = true
  state.value.score.wpm = calculateWPM(state.value.score.correctCount, 30)
  state.value.score.accuracy = calculateAccuracy(state.value.score.correctCount, state.value.score.totalTyped)
  
  if (state.value.score.wpm > topScore.value) {
    topScore.value = state.value.score.wpm
  }
}


onMounted(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <div class="neon-speed-typist">
    <RouterLink
      to="/"
      class="back-link"
    >
      ← Về trang chủ
    </RouterLink>

    <!-- Header / Stats -->
    <header class="game-header glow-box">
      <div class="stat-item">
        <span class="label">TIME</span>
        <span
          class="value"
          :class="{ 'warning': timerRef < 10 }"
        >{{ timerRef }}s</span>
      </div>
      <div class="stat-item main-stat">
        <span class="label">WPM</span>
        <span class="value text-neon">{{ wpmRealtime || state.score.wpm }}</span>
      </div>
      <div class="stat-item">
        <span class="label">ACC</span>
        <span class="value">{{ state.score.accuracy }}%</span>
      </div>
      <div class="stat-item">
        <span class="label">TOP</span>
        <span class="value accent-text">{{ topScore }}</span>
      </div>
    </header>

    <!-- Game Board -->
    <main
      v-if="!state.isFinished"
      class="game-board glass-card"
    >
      <div class="word-display">
        <span class="prev-word dim">{{ state.words[state.currentIndex - 1] }}</span>
        <span class="target-word glow-text">{{ currentWord }}</span>
        <span class="next-word dim">{{ state.words[state.currentIndex + 1] }}</span>
      </div>

      <div class="input-area">
        <input
          ref="inputRef"
          v-model="state.inputValue"
          type="text"
          placeholder="Gõ từ tại đây..."
          :disabled="state.isFinished"
          spellcheck="false"
          autocomplete="off"
          @input="handleInput"
        >
        <div
          class="input-glow"
          :style="{ width: (state.inputValue.length / currentWord.length) * 100 + '%' }"
        />
      </div>

      <div class="hints">
        Mẹo: Nhấn <b>CÁCH (Space)</b> sau mỗi từ đúng.
      </div>
    </main>

    <!-- Result View -->
    <div
      v-else
      class="result-view glass-card fade-up"
    >
      <h2 class="text-neon">
        GAME OVER
      </h2>
      <div class="result-stats">
        <div class="rs-item">
          <span>Words Per Minute</span>
          <strong>{{ state.score.wpm }}</strong>
        </div>
        <div class="rs-item">
          <span>Accuracy</span>
          <strong>{{ state.score.accuracy }}%</strong>
        </div>
        <div class="rs-item highlight">
          <span>Best Score</span>
          <strong>{{ topScore }} WPM</strong>
        </div>
      </div>
      <button
        class="btn-primary"
        @click="startGame"
      >
        THỬ LẠI NGAY ⚡
      </button>
    </div>

    <!-- Actions -->
    <footer
      v-if="!state.isActive && !state.isFinished"
      class="game-actions"
    >
      <button
        class="btn-primary pulse"
        @click="startGame"
      >
        BẮT ĐẦU THỬ THÁCH 🚀
      </button>
    </footer>
  </div>
</template>

<style scoped>
.neon-speed-typist {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.back-link {
  position: absolute;
  top: 2rem;
  left: 2rem;
  color: var(--text-dim);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.back-link:hover { color: var(--primary); }

/* Header Stats */
.game-header {
  display: flex;
  gap: 3rem;
  padding: 1.5rem 3rem;
  border-radius: 20px;
  background: rgba(20, 31, 56, 0.4);
  border: 1px solid var(--outline);
  margin-bottom: 3rem;
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-item .label {
  font-size: 0.7rem;
  letter-spacing: 2px;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}
.stat-item .value {
  font-size: 1.8rem;
  font-weight: 800;
  font-family: 'Manrope', sans-serif;
}
.stat-item.warning .value { color: #ff5555; animation: pulse-red 1s infinite; }
.text-neon { color: var(--primary); text-shadow: 0 0 15px var(--primary-glow); }
.accent-text { color: var(--accent); }

/* Game Board */
.game-board {
  width: 100%;
  max-width: 600px;
  padding: 4rem;
  text-align: center;
}

.word-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
  font-size: 2.5rem;
  font-weight: 800;
  font-family: 'Manrope', sans-serif;
}

.prev-word, .next-word { font-size: 1.4rem; opacity: 0.2; filter: blur(2px); }
.target-word { 
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  position: relative;
}
.target-word::after {
  content: '';
  position: absolute;
  bottom: -10px; left: 0; width: 100%; height: 2px;
  background: var(--primary);
  box-shadow: 0 0 10px var(--primary);
}

.input-area {
  position: relative;
  width: 100%;
  margin-bottom: 2rem;
}

.input-area input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--outline);
  padding: 1.2rem 2rem;
  border-radius: 12px;
  color: #fff;
  font-size: 1.2rem;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}

.input-area input:focus { border-color: var(--primary); }

.input-glow {
  position: absolute;
  bottom: 0; left: 0;
  height: 3px;
  background: var(--primary);
  box-shadow: 0 0 15px var(--primary);
  transition: width 0.1s ease;
}

.hints { font-size: 0.85rem; color: var(--text-dim); }

/* Result View */
.result-view {
  text-align: center;
  padding: 4rem;
  width: 100%;
  max-width: 450px;
}

.result-stats {
  margin: 2.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.rs-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-dim);
}
.rs-item strong { font-size: 1.5rem; color: #fff; }
.rs-item.highlight strong { color: var(--accent); }

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border: none;
  padding: 1.2rem 3rem;
  border-radius: 12px;
  color: #060e20;
  font-weight: 800;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-primary:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 10px 30px var(--primary-glow);
}

.pulse { animation: pulse-btn 2s infinite; }

@keyframes pulse-btn {
  0% { box-shadow: 0 0 0 0 var(--primary-glow); }
  70% { box-shadow: 0 0 0 20px rgba(109, 221, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(109, 221, 255, 0); }
}

@keyframes pulse-red {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.fade-up { animation: fadeUp 0.6s ease-out; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
