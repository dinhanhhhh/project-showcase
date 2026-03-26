<script setup lang="ts">
import { ref } from 'vue'
import { drawOneOneCard } from './engine'
import type { OracleCard } from './data'

// State quản lý game
const currentCard = ref<OracleCard | null>(null)
const isDrawing = ref(false)
const isFlipped = ref(false)
const showResult = ref(false)

/**
 * Xử lý rút một lá bài Oracle
 */
const drawCard = () => {
  if (isDrawing.value) return
  
  isDrawing.value = true
  isFlipped.value = false
  showResult.value = false
  
  // Hiệu ứng delay rút bài
  setTimeout(() => {
    currentCard.value = drawOneOneCard()
    isDrawing.value = false
    
    // Tự động lật bài sau 500ms
    setTimeout(() => {
      isFlipped.value = true
      showResult.value = true
    }, 500);
  }, 800);
}

const resetGame = () => {
  currentCard.value = null
  isDrawing.value = false
  isFlipped.value = false
  showResult.value = false
}
</script>

<template>
  <main class="oracle-container">
    <RouterLink
      to="/"
      class="back-nav"
    >
      ← Về trang chủ
    </RouterLink>

    <div class="oracle-content">
      <header class="oracle-header">
        <h1 class="oracle-title text-glow">
          Oracle Tarot
        </h1>
        <p class="oracle-subtitle">
          Lắng nghe thông điệp huyền thoại từ vũ trụ dành cho bạn.
        </p>
      </header>

      <!-- CARD AREA -->
      <div class="card-area">
        <div 
          class="oracle-card-wrapper" 
          :class="{ 'is-flipped': isFlipped, 'drawing': isDrawing }"
          @click="drawCard"
        >
          <!-- Mặt Sau (Back) -->
          <div class="card-face card-back">
            <div class="back-design">
              <span class="eye-icon">👁️</span>
              <div class="stars-bg" />
            </div>
          </div>

          <!-- Mặt Trước (Front) -->
          <div
            v-if="currentCard"
            class="card-face card-front glow-box"
          >
            <div class="card-illustration">
              {{ currentCard.image }}
            </div>
            <h3 class="card-name">
              {{ currentCard.name }}
            </h3>
          </div>
        </div>
      </div>

      <!-- MESSAGES -->
      <transition name="fade-up">
        <div
          v-if="showResult && currentCard"
          class="oracle-result glass-card"
        >
          <p class="oracle-msg">
            " {{ currentCard.message }} "
          </p>
          <div class="advice-box">
            <span class="label">Lời khuyên:</span>
            <p>{{ currentCard.advice }}</p>
          </div>
          <button
            class="btn-primary"
            @click="resetGame"
          >
            HỎI LỜI KHÁC 🔮
          </button>
        </div>
      </transition>

      <!-- INITIAL CTA -->
      <div
        v-if="!currentCard && !isDrawing"
        class="action-zone"
      >
        <button
          class="btn-draw"
          @click="drawCard"
        >
          XÁO BÀI & RÚT MỘT LÁ ⚡
        </button>
      </div>

      <div
        v-if="isDrawing"
        class="drawing-msg"
      >
        Đang lắng nghe năng lượng vũ trụ...
      </div>
    </div>
  </main>
</template>

<style scoped>
.oracle-container {
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at top right, #1a0b3b 0%, #060e20 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text);
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
}

.back-nav {
  position: absolute;
  top: 2rem;
  left: 2rem;
  color: var(--text-dim);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  z-index: 10;
}
.back-nav:hover { color: var(--primary); }

.oracle-content {
  max-width: 600px;
  width: 100%;
  text-align: center;
  z-index: 1;
}

.oracle-title {
  font-family: 'Manrope', sans-serif;
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}
.text-glow {
  color: var(--primary);
  text-shadow: 0 0 30px var(--primary-glow);
}

.oracle-subtitle {
  color: var(--text-dim);
  font-size: 1.1rem;
  margin-bottom: 3rem;
}

/* CARD SYSTEM */
.card-area {
  perspective: 1000px;
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
}

.oracle-card-wrapper {
  width: 220px;
  height: 320px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

.oracle-card-wrapper.is-flipped {
  transform: rotateY(180deg);
}

.oracle-card-wrapper.drawing {
  animation: shuffle 0.8s infinite ease-in-out;
}

.card-face {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  backface-visibility: hidden;
  border-radius: 20px;
  border: 1px solid var(--outline);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  box-shadow: 0 15px 35px rgba(0,0,0,0.4);
}

/* CARD BACK */
.card-back {
  background: var(--bg-card);
  background-image: 
    linear-gradient(45deg, rgba(109, 221, 255, 0.05) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(109, 221, 255, 0.05) 25%, transparent 25%);
  background-size: 20px 20px;
}
.back-design {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.eye-icon { font-size: 3rem; animation: float 3s infinite ease-in-out; }

/* CARD FRONT */
.card-front {
  background: #141f38;
  transform: rotateY(180deg); /* Start flipped */
  border: 2px solid var(--primary);
}
.card-illustration { font-size: 5rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 15px var(--primary)); }
.card-name { font-family: 'Manrope', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; }

/* RESULTS */
.oracle-result {
  text-align: center;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.oracle-msg { font-size: 1.4rem; font-style: italic; font-weight: 400; color: #fff; }
.advice-box { background: rgba(109, 221, 255, 0.05); padding: 1rem; border-radius: 12px; border: 1px solid var(--outline); }
.advice-box .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); display: block; margin-bottom: 0.5rem; }

/* BUTTONS */
.btn-draw {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 99px;
  color: #060e20;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 30px var(--primary-glow);
}
.btn-draw:hover { transform: scale(1.05); box-shadow: 0 0 50px var(--primary-glow); }

.btn-primary {
  background: rgba(109, 221, 255, 0.1);
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 0.8rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-primary:hover { background: var(--primary); color: #000; }

.drawing-msg { margin-top: 2rem; color: var(--text-dim); font-style: italic; animation: pulse 1.5s infinite; }

/* ANIMATIONS */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes shuffle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(3deg) scale(1.02); }
  75% { transform: rotate(-3deg) scale(0.98); }
}

.fade-up-enter-active { transition: all 0.6s ease-out; }
.fade-up-enter-from { opacity: 0; transform: translateY(30px); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
