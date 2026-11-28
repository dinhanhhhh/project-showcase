<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { type OracleReadingRecord, type OracleSpreadMode, useOracleTarotStore } from '@/stores/oracleTarot'
import { copyTextWithFallback } from '@/utils/clipboard'
import { getDailyDateKey } from '@/utils/daily-seed'
import OracleJournalSection from './components/OracleJournalSection.vue'
import { ORACLE_CARDS, type OracleCard } from './data'
import {
  drawOracleReading,
  formatReadingShareText,
  getCardAdvice,
  getDailyOracleCard,
  synthesizeSpreadSummary,
} from './engine'

interface DrawnSlot {
  slotLabel: string
  card: OracleCard
  reversed: boolean
  flipped: boolean
}

const store = useOracleTarotStore()

const spreadMode = ref<OracleSpreadMode>(1)
const userQuestion = ref('')
const drawnSlots = ref<DrawnSlot[]>([])
const activeSlotIndex = ref(0)
const isShuffling = ref(false)
const viewingSavedId = ref<string | null>(null)
const copiedReading = ref(false)

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

const spreadSummary = computed(() => {
  const allFlipped = drawnSlots.value.length > 0 && drawnSlots.value.every((s) => s.flipped)
  if (!allFlipped) return ''
  return synthesizeSpreadSummary(
    drawnSlots.value.map((s) => ({ slotLabel: s.slotLabel, card: s.card, reversed: s.reversed })),
  )
})

const activeAdvice = computed(() => {
  if (!activeSlot.value) return ''
  return getCardAdvice(activeSlot.value.card, activeSlot.value.reversed)
})

function setSpreadMode(mode: OracleSpreadMode) {
  if (spreadMode.value === mode) return
  clearAllTimers()
  spreadMode.value = mode
  drawnSlots.value = []
  isShuffling.value = false
  activeSlotIndex.value = 0
  viewingSavedId.value = null
}

function performDraw() {
  if (isShuffling.value) return
  clearAllTimers()
  isShuffling.value = true
  drawnSlots.value = []
  activeSlotIndex.value = 0
  viewingSavedId.value = null

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const shuffleDelay = prefersReduced ? 120 : 620

  schedule(() => {
    const drawn = drawOracleReading(spreadMode.value, store.includeReversed)
    drawnSlots.value = drawn.map((item) => ({
      slotLabel: item.slotLabel,
      card: item.card,
      reversed: item.reversed,
      flipped: prefersReduced,
    }))
    isShuffling.value = false

    if (!prefersReduced) {
      drawnSlots.value.forEach((_, idx) => {
        schedule(() => {
          if (drawnSlots.value[idx]) {
            drawnSlots.value[idx].flipped = true
            if (idx === 0) activeSlotIndex.value = 0
          }
        }, 260 + idx * 320)
      })
    }

    const cleanQuestion = userQuestion.value.trim()
    store.addReading({
      id: `oracle-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      mode: spreadMode.value,
      question: cleanQuestion,
      cards: drawn.map((item) => ({
        cardId: item.card.id,
        name: item.card.name,
        image: item.card.image,
        slotLabel: item.slotLabel,
        reversed: item.reversed,
      })),
    })
  }, shuffleDelay)
}

function restoreReading(entry: OracleReadingRecord) {
  clearAllTimers()
  isShuffling.value = false
  spreadMode.value = entry.mode
  userQuestion.value = entry.question
  viewingSavedId.value = entry.id
  const restored: DrawnSlot[] = []
  for (const saved of entry.cards) {
    const found = ORACLE_CARDS.find((c) => c.id === saved.cardId)
    if (found) {
      restored.push({
        slotLabel: saved.slotLabel,
        card: found,
        reversed: saved.reversed,
        flipped: true,
      })
    }
  }
  drawnSlots.value = restored
  activeSlotIndex.value = 0
}

function selectSlot(idx: number) {
  const slot = drawnSlots.value[idx]
  if (!slot) return
  slot.flipped = true
  activeSlotIndex.value = idx
}

async function copyReadingText() {
  const flippedSlots = drawnSlots.value.filter((s) => s.flipped)
  if (flippedSlots.length === 0) return
  const text = formatReadingShareText(
    userQuestion.value,
    flippedSlots.map((s) => ({
      slotLabel: s.slotLabel,
      card: s.card,
      reversed: s.reversed,
    })),
    spreadSummary.value,
  )
  if (!text) return

  const ok = await copyTextWithFallback(text)
  if (!ok) return

  copiedReading.value = true
  schedule(() => {
    copiedReading.value = false
  }, 2200)
}

function resetReading() {
  clearAllTimers()
  drawnSlots.value = []
  isShuffling.value = false
  activeSlotIndex.value = 0
  viewingSavedId.value = null
  copiedReading.value = false
}

function drawDailyCard() {
  if (isShuffling.value) return
  clearAllTimers()
  const todayKey = getDailyDateKey()
  const daily = getDailyOracleCard(todayKey, store.includeReversed)
  spreadMode.value = 1
  viewingSavedId.value = null
  copiedReading.value = false
  drawnSlots.value = [
    {
      slotLabel: daily.slotLabel,
      card: daily.card,
      reversed: daily.reversed,
      flipped: true,
    },
  ]
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

      <!-- Câu hỏi tâm niệm & Tùy chọn lá ngược -->
      <section class="intention-bar glass-card">
        <input
          v-model="userQuestion"
          type="text"
          maxlength="120"
          class="question-input"
          placeholder="Nhập câu hỏi bạn đang trăn trở (tùy chọn)..."
          aria-label="Câu hỏi khi bói bài"
        >
        <button
          type="button"
          class="reversed-toggle"
          :class="{ active: store.includeReversed }"
          :aria-pressed="store.includeReversed"
          @click="store.setIncludeReversed(!store.includeReversed)"
        >
          ↺ Cho phép Lá Ngược: {{ store.includeReversed ? 'Bật' : 'Tắt' }}
        </button>
      </section>

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

          <div class="draw-cta-group">
            <button
              type="button"
              class="draw-cta"
              :disabled="isShuffling"
              @click="performDraw"
            >
              {{ isShuffling ? '✨ Đang kết nối năng lượng...' : (spreadMode === 1 ? '🔮 Xáo bài & Rút 1 lá' : '🔮 Trải bộ 3 lá (Quá khứ · Hiện tại · Tương lai)') }}
            </button>
            <button
              type="button"
              class="reversed-toggle"
              :disabled="isShuffling"
              @click="drawDailyCard"
            >
              📅 Lá Hôm Nay
            </button>
          </div>
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
              :key="`${slot.card.id}-${idx}`"
              class="card-slot"
            >
              <span class="slot-label">{{ slot.slotLabel }}</span>
              <div
                class="flip-wrapper"
                :class="{ flipped: slot.flipped, active: activeSlotIndex === idx }"
                role="button"
                tabindex="0"
                :aria-label="`Xem lá ${slot.slotLabel}: ${slot.card.name}`"
                @click="selectSlot(idx)"
                @keydown.enter.prevent="selectSlot(idx)"
                @keydown.space.prevent="selectSlot(idx)"
              >
                <div class="face face-back">
                  <span class="center-eye">✦</span>
                </div>
                <div
                  class="face face-front"
                  :class="{ 'is-reversed': slot.reversed }"
                >
                  <span class="roman-num">{{ slot.card.roman }}</span>
                  <span
                    v-if="slot.reversed"
                    class="reversed-pill"
                  >
                    ↺ Ngược
                  </span>
                  <div
                    class="card-emoji"
                    :class="{ flipped: slot.reversed }"
                  >
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
                <span class="reading-tag">
                  {{ activeSlot.slotLabel }} · {{ activeSlot.card.keyword }}
                  <template v-if="activeSlot.reversed"> · ↺ Lá Ngược</template>
                </span>
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
                <p>{{ activeAdvice }}</p>
              </div>

              <div
                v-if="spreadSummary && spreadMode === 3"
                class="summary-box"
              >
                <span class="advice-title">🌌 TỔNG QUAN TRẢI BÀI 3 LÁ</span>
                <p>{{ spreadSummary }}</p>
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
                  @click="copyReadingText"
                >
                  {{ copiedReading ? '✅ Đã chép lời giải' : '📋 Chép lời giải' }}
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

      <!-- Nhật ký trải bài lưu bền vững qua Pinia (tối đa 10 lần) -->
      <OracleJournalSection
        :history="store.history"
        :viewing-saved-id="viewingSavedId"
        @restore="restoreReading"
        @clear="store.clearHistory()"
      />
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

.intention-bar {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.question-input {
  flex: 1;
  min-width: min(100%, 240px);
  padding: 0.58rem 0.9rem;
  border-radius: 12px;
  background: var(--bg-input);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.9rem;
  outline: none;
}

.question-input:focus {
  border-color: var(--primary);
}

.reversed-toggle {
  padding: 0.55rem 0.95rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: var(--transition-fast);
}

.reversed-toggle.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
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

.draw-cta-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
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

.face-front.is-reversed {
  border-color: var(--accent);
}

.reversed-pill {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.14rem 0.48rem;
  border-radius: 999px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 800;
}

.roman-num {
  position: absolute;
  top: 12px;
  left: 14px;
  font-family: 'Manrope', sans-serif;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--accent);
}

.card-emoji {
  font-size: 3.6rem;
  filter: drop-shadow(0 0 14px var(--primary-glow));
  transition: transform 0.4s ease;
}

.card-emoji.flipped {
  transform: rotate(180deg);
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

.advice-box,
.summary-box {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  border-radius: 14px;
  padding: 1rem 1.15rem;
  text-align: left;
}

.summary-box {
  background: var(--primary-soft);
  border-color: var(--outline-strong);
}

.advice-title {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--primary);
  margin-bottom: 0.35rem;
}

.advice-box p,
.summary-box p {
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

@media (max-width: 640px) {
  .oracle-topbar {
    justify-content: space-between;
  }

  .header-copy {
    order: 3;
    flex-basis: 100%;
  }
}

.reveal-up-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.reveal-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
</style>
