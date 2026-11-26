<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { OracleCard } from './data'
import { drawSpread } from './engine'

type SpreadMode = 1 | 3

interface DrawnSlot {
  slotLabel: string
  card: OracleCard
  flipped: boolean
}

const THREE_CARD_LABELS = ['Quá Khứ', 'Hiện Tại', 'Tương Lai'] as const

const spreadMode = ref<SpreadMode>(1)
const drawnSlots = ref<DrawnSlot[]>([])
const activeSlotIndex = ref(0)
const isShuffling = ref(false)
const readingHistory = ref<Array<{ time: string; mode: SpreadMode; names: string[] }>>([])

const activeTimers = new Set<ReturnType<typeof setTimeout>>()

function schedule(fn: () => void, ms: number) {
  const id = setTimeout(() => {
    activeTimers.delete(id)
    fn()
  }, ms)
  activeTimers.add(id)
}

function clearAllTimers() {
  for (const id of activeTimers) {
    clearTimeout(id)
  }
  activeTimers.clear()
}

const activeSlot = computed<DrawnSlot | null>(() => {
  const slot = drawnSlots.value[activeSlotIndex.value]
  return slot && slot.flipped ? slot : null
})

function setSpreadMode(mode: SpreadMode) {
  if (spreadMode.value === mode) return
  clearAllTimers()
  spreadMode.value = mode
  drawnSlots.value = []
  isShuffling.value = false
  activeSlotIndex.value = 0
}

function performDraw() {
  if (isShuffling.value) return
  clearAllTimers()
  isShuffling.value = true
  drawnSlots.value = []
  activeSlotIndex.value = 0

  schedule(() => {
    const cards = drawSpread(spreadMode.value)
    drawnSlots.value = cards.map((card, idx) => ({
      slotLabel: spreadMode.value === 1 ? 'Thông Điệp Hôm Nay' : THREE_CARD_LABELS[idx] ?? `Lá ${idx + 1}`,
      card,
      flipped: false,
    }))
    isShuffling.value = false

    // Lật lần lượt từng lá tạo cảm giác huyền bí
    drawnSlots.value.forEach((_, idx) => {
      schedule(() => {
        if (drawnSlots.value[idx]) {
          drawnSlots.value[idx].flipped = true
          if (idx === 0) activeSlotIndex.value = 0
        }
      }, 280 + idx * 340)
    })

    readingHistory.value = [
      {
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        mode: spreadMode.value,
        names: cards.map((c) => `${c.image} ${c.name}`),
      },
      ...readingHistory.value,
    ].slice(0, 5)
  }, 650)
}

function selectSlot(idx: number) {
  const slot = drawnSlots.value[idx]
  if (!slot) return
  slot.flipped = true
  activeSlotIndex.value = idx
}

function resetReading() {
  clearAllTimers()
  drawnSlots.value = []
  isShuffling.value = false
  activeSlotIndex.value = 0
}

onUnmounted(() => {
  clearAllTimers()
})
</script>

<template>
  <main class="oracle-page">
    <div class="oracle-shell">
      <header class="oracle-topbar">
        <RouterLink
          to="/"
          class="back-btn"
        >
          ← Về Launcher
        </RouterLink>

        <div class="header-copy">
          <h1>🔮 Oracle Tarot</h1>
          <p>Tĩnh tâm 3 giây, nghĩ về câu hỏi của bạn rồi rút bài</p>
        </div>

        <div
          class="mode-switch"
          role="group"
          aria-label="Chọn kiểu trải bài"
        >
          <button
            type="button"
            :class="{ active: spreadMode === 1 }"
            @click="setSpreadMode(1)"
          >
            1 Lá Hôm Nay
          </button>
          <button
            type="button"
            :class="{ active: spreadMode === 3 }"
            @click="setSpreadMode(3)"
          >
            3 Lá Thời Gian
          </button>
        </div>
      </header>

      <!-- Sân khấu bài Tarot -->
      <section class="altar-stage">
        <!-- Trạng thái chưa rút hoặc đang xáo bài -->
        <div
          v-if="drawnSlots.length === 0"
          class="deck-center"
        >
          <button
            type="button"
            class="tarot-card-btn"
            :class="{ shuffling: isShuffling }"
            @click="performDraw"
          >
            <div class="card-back-art">
              <svg
                viewBox="0 0 180 270"
                class="sacred-svg"
                aria-hidden="true"
              >
                <rect
                  x="10"
                  y="10"
                  width="160"
                  height="250"
                  rx="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  opacity="0.45"
                />
                <circle
                  cx="90"
                  cy="135"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.3"
                  opacity="0.6"
                />
                <polygon
                  points="90,82 136,162 44,162"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.2"
                  opacity="0.7"
                />
                <polygon
                  points="90,188 136,108 44,108"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.2"
                  opacity="0.7"
                />
                <circle
                  cx="90"
                  cy="44"
                  r="8"
                  fill="currentColor"
                  opacity="0.5"
                />
                <circle
                  cx="90"
                  cy="226"
                  r="8"
                  fill="currentColor"
                  opacity="0.5"
                />
              </svg>
              <span class="center-eye">✦</span>
              <span class="tap-hint">{{ isShuffling ? 'Đang xáo bài...' : 'Chạm để rút bài' }}</span>
            </div>
          </button>

          <button
            type="button"
            class="draw-cta"
            :disabled="isShuffling"
            @click="performDraw"
          >
            {{ isShuffling ? '✨ Đang kết nối năng lượng...' : (spreadMode === 1 ? '🔮 Xáo bài & Rút 1 lá' : '🔮 Trải bộ 3 lá (Quá khứ · Hiện tại · Tương lai)') }}
          </button>
        </div>

        <!-- Trạng thái đã trải bài -->
        <div
          v-else
          class="spread-stage"
        >
          <div
            class="cards-row"
            :class="{ 'is-three': spreadMode === 3 }"
          >
            <div
              v-for="(slot, idx) in drawnSlots"
              :key="slot.card.id"
              class="card-slot"
            >
              <span class="slot-label">{{ slot.slotLabel }}</span>
              <div
                class="flip-wrapper"
                :class="{ flipped: slot.flipped, active: activeSlotIndex === idx }"
                role="button"
                tabindex="0"
                @click="selectSlot(idx)"
              >
                <div class="face face-back">
                  <span class="center-eye">✦</span>
                </div>
                <div class="face face-front">
                  <span class="roman-num">{{ slot.card.roman }}</span>
                  <div class="card-emoji">
                    {{ slot.card.image }}
                  </div>
                  <strong class="card-title">{{ slot.card.name }}</strong>
                  <span class="card-element">{{ slot.card.element }}</span>
                </div>
              </div>
            </div>
          </div>

          <transition name="reveal-up">
            <article
              v-if="activeSlot"
              class="reading-panel glass-card"
            >
              <div class="reading-head">
                <span class="reading-tag">{{ activeSlot.slotLabel }} · {{ activeSlot.card.keyword }}</span>
                <span class="reading-el">{{ activeSlot.card.element }}</span>
              </div>

              <h2 class="reading-name">
                {{ activeSlot.card.image }} {{ activeSlot.card.name }}
              </h2>

              <blockquote class="reading-quote">
                “{{ activeSlot.card.message }}”
              </blockquote>

              <div class="advice-box">
                <span class="advice-title">💡 LỜI KHUYÊN HÀNH ĐỘNG</span>
                <p>{{ activeSlot.card.advice }}</p>
              </div>

              <div class="reading-actions">
                <button
                  type="button"
                  class="draw-cta"
                  @click="performDraw"
                >
                  🔮 Rút trải bài mới
                </button>
                <button
                  type="button"
                  class="reset-btn"
                  @click="resetReading"
                >
                  Đặt lại bộ bài
                </button>
              </div>
            </article>
          </transition>
        </div>
      </section>

      <!-- Nhật ký trải bài trong phiên -->
      <section
        v-if="readingHistory.length > 0"
        class="journal-box glass-card"
      >
        <h3>📜 Nhật ký trải bài phiên này</h3>
        <div class="journal-list">
          <div
            v-for="(entry, idx) in readingHistory"
            :key="idx"
            class="journal-row"
          >
            <span class="j-time">{{ entry.time }}</span>
            <span class="j-mode">{{ entry.mode }} lá</span>
            <span class="j-cards">{{ entry.names.join('  ·  ') }}</span>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.oracle-page {
  min-height: 100dvh;
  width: 100%;
  background:
    radial-gradient(circle at 50% 0%, var(--accent-soft) 0%, transparent 50%),
    radial-gradient(circle at 85% 90%, var(--primary-soft) 0%, transparent 45%),
    var(--bg);
  color: var(--text);
  padding: 1.25rem;
  font-family: 'Inter', sans-serif;
}

.oracle-shell {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.oracle-topbar {
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

.header-copy {
  text-align: center;
  flex: 1;
}

.header-copy h1 {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.45rem, 3vw, 2.05rem);
  font-weight: 800;
}

.header-copy p {
  color: var(--text-dim);
  font-size: 0.86rem;
  margin-top: 0.2rem;
}

.mode-switch {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.mode-switch button {
  padding: 0.45rem 0.8rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.mode-switch button.active {
  background: var(--accent);
  color: var(--text-inverse);
}

.altar-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.deck-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 0;
}

.tarot-card-btn {
  width: 215px;
  height: 320px;
  padding: 0;
  border-radius: 22px;
  background: var(--bg-card);
  border: 2px solid var(--outline-strong);
  color: var(--accent);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 24px 55px rgba(0, 0, 0, 0.45), 0 0 32px var(--accent-glow);
  transition: transform 0.3s ease;
}

.tarot-card-btn:hover {
  transform: translateY(-8px) scale(1.02);
}

.tarot-card-btn.shuffling {
  animation: tarotShuffle 0.45s infinite ease-in-out;
}

@keyframes tarotShuffle {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-4deg) scale(1.03); }
  75% { transform: rotate(4deg) scale(0.98); }
}

.card-back-art {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sacred-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.center-eye {
  font-size: 2.5rem;
  color: var(--primary);
  text-shadow: 0 0 18px var(--primary-glow);
}

.tap-hint {
  position: absolute;
  bottom: 22px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}

.draw-cta {
  padding: 0.88rem 1.85rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--text-inverse);
  font-family: 'Manrope', sans-serif;
  font-size: 0.96rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 30px var(--accent-glow);
  transition: var(--transition-fast);
}

.draw-cta:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
}

.draw-cta:disabled {
  opacity: 0.65;
  cursor: wait;
}

.spread-stage {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
}

.cards-row {
  display: flex;
  justify-content: center;
  gap: 1.35rem;
  flex-wrap: wrap;
}

.card-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  perspective: 1200px;
}

.slot-label {
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--primary);
}

.flip-wrapper {
  width: 196px;
  height: 288px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.flip-wrapper.flipped {
  transform: rotateY(180deg);
}

.flip-wrapper.active .face-front {
  border-color: var(--primary);
  box-shadow: 0 0 28px var(--primary-glow);
}

.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 20px;
  border: 1.5px solid var(--outline);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  text-align: center;
  box-shadow: var(--shadow-card);
}

.face-back {
  background: var(--bg-card);
}

.face-front {
  transform: rotateY(180deg);
  background: linear-gradient(160deg, var(--bg-card) 0%, var(--bg-sidebar) 100%);
  gap: 0.65rem;
}

.roman-num {
  position: absolute;
  top: 12px;
  font-family: 'Manrope', sans-serif;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--accent);
}

.card-emoji {
  font-size: 3.6rem;
  filter: drop-shadow(0 0 14px var(--primary-glow));
}

.card-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  line-height: 1.3;
  color: var(--text);
}

.card-element {
  font-size: 0.72rem;
  color: var(--text-dim);
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  background: var(--bg-input);
  border: 1px solid var(--outline);
}

.reading-panel {
  width: 100%;
  max-width: 720px;
  padding: 1.65rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}

.reading-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.reading-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
}

.reading-el {
  font-size: 0.78rem;
  color: var(--text-dim);
}

.reading-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.55rem;
  font-weight: 800;
}

.reading-quote {
  font-size: 1.15rem;
  font-style: italic;
  line-height: 1.6;
  color: var(--text);
}

.advice-box {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  border-radius: 14px;
  padding: 1rem 1.15rem;
  text-align: left;
}

.advice-title {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--primary);
  margin-bottom: 0.35rem;
}

.advice-box p {
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--text-dim);
}

.reading-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.reset-btn {
  padding: 0.82rem 1.3rem;
  border-radius: 999px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}

.reset-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.journal-box {
  padding: 1.15rem 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.journal-box h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
}

.journal-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.journal-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.82rem;
  padding: 0.45rem 0.7rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  flex-wrap: wrap;
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

.j-cards {
  color: var(--text);
  font-weight: 500;
}

.reveal-up-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.reveal-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
</style>
