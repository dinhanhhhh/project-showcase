<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useOopFlashcardsStore } from '@/stores/oopFlashcards'
import { OOP_FLASHCARDS, OOP_TOPICS } from './data'
import {
  buildDeck,
  getAccuracyPercent,
  getCompletionTitle,
  tokenizeJavaCode,
} from './engine'
import type { Flashcard, TopicFilter } from './types'

const store = useOopFlashcardsStore()

const deck = ref<Flashcard[]>([])
const currentIndex = ref(0)
const isFlipped = ref(false)
const isShuffled = ref(false)
const isShaking = ref(false)
const sessionKnown = ref(0)
const sessionNope = ref(0)
const copiedCardId = ref<string | null>(null)
const sessionRatings = ref<Array<{ cardId: string; known: boolean }>>([])

let touchStartX = 0
let rateTimer: ReturnType<typeof setTimeout> | null = null
let shakeTimer: ReturnType<typeof setTimeout> | null = null
let copyTimer: ReturnType<typeof setTimeout> | null = null

const isDone = computed(() => deck.value.length > 0 && currentIndex.value >= deck.value.length)
const currentCard = computed<Flashcard | null>(() => deck.value[currentIndex.value] ?? null)

const currentTopicTitle = computed(() => {
  if (!currentCard.value) return ''
  return OOP_TOPICS.find((t) => t.id === currentCard.value?.topicId)?.title ?? 'OOP'
})

const highlightedCodeTokens = computed(() => {
  const code = currentCard.value?.codeExample
  return code ? tokenizeJavaCode(code) : []
})

const remainingCount = computed(() => Math.max(0, deck.value.length - currentIndex.value))

const progressPercent = computed(() => {
  if (deck.value.length === 0) return 0
  return Math.min(100, Math.round((currentIndex.value / deck.value.length) * 100))
})

const completionTitle = computed(() => getCompletionTitle(sessionKnown.value, deck.value.length))
const accuracyPercent = computed(() => getAccuracyPercent(sessionKnown.value, deck.value.length))

function countByTopic(topicId: number): number {
  return OOP_FLASHCARDS.filter((c) => c.topicId === topicId).length
}

function rebuildDeck(shuffle = isShuffled.value) {
  isShuffled.value = shuffle
  let activeFilter: TopicFilter = store.selectedTopic
  if (activeFilter === 'review' && store.reviewIds.length === 0) {
    activeFilter = 'all'
    store.setSelectedTopic('all')
  }

  deck.value = buildDeck(OOP_FLASHCARDS, activeFilter, store.reviewIds, shuffle)
  currentIndex.value = 0
  isFlipped.value = false
  sessionKnown.value = 0
  sessionNope.value = 0
  sessionRatings.value = []
}

function selectTopic(filter: TopicFilter) {
  store.setSelectedTopic(filter)
  rebuildDeck(false)
}

function toggleFlip() {
  if (isDone.value || !currentCard.value) return
  isFlipped.value = !isFlipped.value
}

function rateCard(known: boolean) {
  const card = currentCard.value
  if (!card || isDone.value) return

  store.markCardResult(card.id, known)
  sessionRatings.value = [...sessionRatings.value, { cardId: card.id, known }]

  if (known) {
    sessionKnown.value += 1
  } else {
    sessionNope.value += 1
    triggerShake()
  }

  if (rateTimer) clearTimeout(rateTimer)
  rateTimer = setTimeout(() => {
    isFlipped.value = false
    currentIndex.value += 1
    if (currentIndex.value >= deck.value.length && deck.value.length > 0) {
      store.incrementSessions()
    }
  }, 160)
}

function goPrev() {
  if (currentIndex.value <= 0) return
  currentIndex.value -= 1
  isFlipped.value = false

  const lastRating = sessionRatings.value[sessionRatings.value.length - 1]
  if (lastRating) {
    if (lastRating.known) {
      sessionKnown.value = Math.max(0, sessionKnown.value - 1)
    } else {
      sessionNope.value = Math.max(0, sessionNope.value - 1)
    }
    sessionRatings.value = sessionRatings.value.slice(0, -1)
  }
}

function triggerShake() {
  isShaking.value = false
  if (shakeTimer) clearTimeout(shakeTimer)
  requestAnimationFrame(() => {
    isShaking.value = true
    shakeTimer = setTimeout(() => {
      isShaking.value = false
    }, 360)
  })
}

async function copyCode() {
  const card = currentCard.value
  if (!card?.codeExample) return
  try {
    await navigator.clipboard.writeText(card.codeExample)
    copiedCardId.value = card.id
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedCardId.value = null
    }, 1800)
  } catch {
    // Clipboard có thể không khả dụng trên môi trường không bảo mật
  }
}

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0]?.screenX ?? 0
}

function handleTouchEnd(e: TouchEvent) {
  const endX = e.changedTouches[0]?.screenX ?? 0
  const diff = touchStartX - endX
  if (Math.abs(diff) > 55) {
    rateCard(diff > 0)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

  if (isDone.value) {
    if (e.key === 'Enter') {
      e.preventDefault()
      rebuildDeck(isShuffled.value)
    }
    return
  }

  if (e.code === 'Space' || e.code === 'ArrowDown') {
    e.preventDefault()
    toggleFlip()
  } else if (e.code === 'ArrowRight') {
    e.preventDefault()
    rateCard(true)
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault()
    rateCard(false)
  } else if (e.code === 'ArrowUp') {
    e.preventDefault()
    goPrev()
  }
}

function handleResetAll() {
  store.resetProgress()
  rebuildDeck(false)
}

onMounted(() => {
  rebuildDeck(false)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (rateTimer) clearTimeout(rateTimer)
  if (shakeTimer) clearTimeout(shakeTimer)
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
  <div class="flashcard-page">
    <div class="flashcard-shell">
      <header class="top-nav">
        <RouterLink
          to="/"
          class="back-btn"
        >
          ← Về Launcher
        </RouterLink>

        <div class="brand-block">
          <h1 class="brand-title">
            OOP<span>Cards</span>
          </h1>
          <p class="brand-sub">
            Lý thuyết OOP & SOLID · Đã thuộc {{ store.masteredIds.length }}/{{ OOP_FLASHCARDS.length }}
          </p>
        </div>

        <button
          type="button"
          class="ghost-btn"
          title="Đặt lại toàn bộ tiến trình"
          @click="handleResetAll"
        >
          ↺ Reset
        </button>
      </header>

      <section class="stats-row">
        <div class="stat-pill stat-know">
          <span class="stat-num">{{ sessionKnown }}</span>
          <span class="stat-lbl">Đã biết</span>
        </div>
        <div class="stat-pill stat-nope">
          <span class="stat-num">{{ sessionNope }}</span>
          <span class="stat-lbl">Cần ôn</span>
        </div>
        <div class="stat-pill stat-left">
          <span class="stat-num">{{ remainingCount }}</span>
          <span class="stat-lbl">Còn lại</span>
        </div>
      </section>

      <div class="progress-track">
        <div
          class="progress-bar"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <section class="topic-bar">
        <button
          type="button"
          class="topic-pill"
          :class="{ active: store.selectedTopic === 'all' }"
          @click="selectTopic('all')"
        >
          Tất cả ({{ OOP_FLASHCARDS.length }})
        </button>

        <button
          v-if="store.reviewIds.length > 0"
          type="button"
          class="topic-pill topic-review"
          :class="{ active: store.selectedTopic === 'review' }"
          @click="selectTopic('review')"
        >
          ⚡ Cần ôn ({{ store.reviewIds.length }})
        </button>

        <button
          v-for="topic in OOP_TOPICS"
          :key="topic.id"
          type="button"
          class="topic-pill"
          :class="{ active: store.selectedTopic === topic.id }"
          @click="selectTopic(topic.id)"
        >
          {{ topic.title }} ({{ countByTopic(topic.id) }})
        </button>
      </section>

      <main class="stage">
        <div
          v-if="isDone"
          class="done-card"
        >
          <div class="done-trophy">
            🏆
          </div>
          <h2 class="done-title">
            {{ completionTitle }}
          </h2>
          <p class="done-sub">
            Độ chính xác phiên này: <strong>{{ accuracyPercent }}%</strong> · Tổng phiên đã hoàn thành: {{ store.sessionsCompleted }}
          </p>

          <div class="done-metrics">
            <div class="metric-item">
              <span>Đã thuộc phiên này</span>
              <strong class="text-know">{{ sessionKnown }}</strong>
            </div>
            <div class="metric-item">
              <span>Cần ôn lại</span>
              <strong class="text-nope">{{ sessionNope }}</strong>
            </div>
          </div>

          <div class="done-actions">
            <button
              type="button"
              class="primary-cta"
              @click="rebuildDeck(false)"
            >
              Học lại bộ này
            </button>
            <button
              v-if="store.reviewIds.length > 0"
              type="button"
              class="secondary-cta"
              @click="selectTopic('review')"
            >
              Ôn {{ store.reviewIds.length }} câu chưa nhớ
            </button>
          </div>
          <p class="kbd-note">
            Nhấn <kbd>Enter</kbd> để học lại nhanh
          </p>
        </div>

        <div
          v-else-if="currentCard"
          class="card-scene"
          @touchstart.passive="handleTouchStart"
          @touchend.passive="handleTouchEnd"
        >
          <div
            class="flip-card"
            :class="{ 'is-flipped': isFlipped, 'is-shaking': isShaking }"
            role="button"
            tabindex="0"
            @click="toggleFlip"
          >
            <article class="card-face card-front">
              <div class="face-meta">
                <span class="topic-badge">{{ currentTopicTitle }}</span>
                <span
                  class="diff-badge"
                  :data-level="currentCard.difficulty"
                >
                  {{ currentCard.difficulty }}
                </span>
                <span class="index-badge">{{ currentIndex + 1 }} / {{ deck.length }}</span>
              </div>

              <div class="front-body">
                <h2 class="question-text">
                  {{ currentCard.question }}
                </h2>
              </div>

              <div class="card-hint">
                Chạm vào thẻ hoặc nhấn <kbd>Space</kbd> để xem đáp án
              </div>
            </article>

            <article class="card-face card-back">
              <div class="back-header">
                <span class="eyebrow">ĐÁP ÁN · {{ currentCard.answerTitle }}</span>
                <span class="index-badge">{{ currentIndex + 1 }} / {{ deck.length }}</span>
              </div>

              <div class="answer-scroll">
                <ul class="answer-list">
                  <li
                    v-for="(point, idx) in currentCard.answerPoints"
                    :key="idx"
                  >
                    {{ point }}
                  </li>
                </ul>

                <div
                  v-if="currentCard.codeExample"
                  class="code-panel"
                  @click.stop
                >
                  <div class="code-topbar">
                    <span class="code-dots">● ● ●</span>
                    <button
                      type="button"
                      class="copy-btn"
                      @click.stop="copyCode"
                    >
                      {{ copiedCardId === currentCard.id ? '✓ Đã chép' : 'Sao chép' }}
                    </button>
                  </div>
                  <pre class="code-pre"><code><span
                    v-for="(tok, idx) in highlightedCodeTokens"
                    :key="idx"
                    :class="`hl-${tok.kind}`"
                  >{{ tok.text }}</span></code></pre>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>

      <footer
        v-if="!isDone"
        class="controls-bar"
      >
        <button
          type="button"
          class="ctrl-btn ctrl-icon"
          :disabled="currentIndex === 0"
          title="Câu trước (↑)"
          @click="goPrev"
        >
          ‹
        </button>

        <button
          type="button"
          class="ctrl-btn ctrl-nope"
          @click="rateCard(false)"
        >
          ✕ Chưa nhớ
        </button>

        <button
          type="button"
          class="ctrl-btn ctrl-icon ctrl-shuffle"
          :class="{ active: isShuffled }"
          title="Xáo trộn bộ thẻ"
          @click="rebuildDeck(true)"
        >
          🔀
        </button>

        <button
          type="button"
          class="ctrl-btn ctrl-know"
          @click="rateCard(true)"
        >
          ✓ Đã biết
        </button>
      </footer>

      <p
        v-if="!isDone"
        class="shortcut-footer"
      >
        <kbd>Space</kbd> lật thẻ · <kbd>←</kbd> chưa nhớ · <kbd>→</kbd> đã biết · <kbd>↑</kbd> quay lại
      </p>
    </div>
  </div>
</template>

<style scoped>
.flashcard-page {
  min-height: 100dvh;
  width: 100%;
  background: var(--bg);
  color: var(--text);
  display: flex;
  justify-content: center;
  padding: 1rem;
  font-family: 'Inter', sans-serif;
}

.flashcard-shell {
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-height: calc(100dvh - 2rem);
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.back-btn,
.ghost-btn {
  padding: 0.48rem 0.9rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.ghost-btn {
  color: var(--text-dim);
}

.back-btn:hover,
.ghost-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.brand-block {
  text-align: center;
  min-width: 0;
}

.brand-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.1;
}

.brand-title span {
  color: var(--accent);
}

.brand-sub {
  font-size: 0.82rem;
  color: var(--text-dim);
  margin-top: 0.2rem;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

.stat-pill {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 14px;
  padding: 0.65rem 0.8rem;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.45rem;
}

.stat-num {
  font-family: 'Manrope', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
}

.stat-lbl {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-dim);
  font-weight: 600;
}

.stat-know .stat-num,
.text-know {
  color: var(--property-group-a);
}

.stat-nope .stat-num,
.text-nope {
  color: var(--danger);
}

.stat-left .stat-num {
  color: var(--primary);
}

.progress-track {
  height: 6px;
  background: var(--bg-card);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid var(--outline);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transition: width 0.3s ease;
}

.topic-bar {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.topic-pill {
  flex-shrink: 0;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.topic-pill:hover {
  border-color: var(--primary);
  color: var(--text);
}

.topic-pill.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-inverse);
  box-shadow: 0 0 16px var(--primary-glow);
}

.topic-review {
  border-color: rgba(255, 85, 85, 0.35);
  color: var(--danger);
}

.stage {
  flex: 1;
  min-height: 360px;
  display: flex;
  align-items: stretch;
}

.card-scene {
  width: 100%;
  perspective: 1800px;
  display: flex;
}

.flip-card {
  position: relative;
  width: 100%;
  min-height: 360px;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.flip-card.is-flipped {
  transform: rotateY(180deg);
}

.flip-card.is-shaking {
  animation: shake 0.35s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 24px;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}

.card-back {
  transform: rotateY(180deg);
  border-color: rgba(109, 221, 255, 0.35);
}

.face-meta,
.back-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.topic-badge,
.eyebrow {
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: rgba(109, 221, 255, 0.14);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.diff-badge {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(210, 119, 255, 0.14);
  color: var(--accent);
}

.index-badge {
  margin-left: auto;
  font-size: 0.82rem;
  color: var(--text-dim);
  font-weight: 700;
}

.front-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1.5rem 0.5rem;
}

.question-text {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.3rem, 3vw, 1.9rem);
  font-weight: 800;
  line-height: 1.35;
  color: var(--text);
}

.card-hint {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-dim);
}

.answer-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-top: 1rem;
  padding-right: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.answer-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.answer-list li {
  position: relative;
  padding-left: 1.5rem;
  line-height: 1.55;
  font-size: 0.98rem;
  color: var(--text);
}

.answer-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary);
  font-weight: 800;
}

.code-panel {
  background: var(--bg);
  border: 1px solid var(--outline);
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
}

.code-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.9rem;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--outline);
}

.code-dots {
  font-size: 0.65rem;
  letter-spacing: 3px;
  color: var(--accent);
}

.copy-btn {
  padding: 0.25rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--outline);
  background: var(--bg-card);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.code-pre {
  padding: 0.9rem;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--text);
}

.hl-comment { color: var(--text-dim); font-style: italic; }
.hl-string { color: var(--property-group-a); }
.hl-keyword { color: var(--accent); font-weight: 700; }
.hl-func { color: var(--primary); }

.controls-bar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.ctrl-btn {
  border-radius: 16px;
  padding: 0.9rem 1rem;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 0.98rem;
  cursor: pointer;
  border: 1px solid var(--outline);
  transition: var(--transition-fast);
}

.ctrl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ctrl-icon {
  min-width: 54px;
  background: var(--bg-card);
  color: var(--text);
  font-size: 1.25rem;
}

.ctrl-shuffle.active {
  border-color: var(--accent);
  color: var(--accent);
}

.ctrl-nope {
  flex: 1;
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger);
}

.ctrl-nope:hover {
  transform: translateY(-2px);
}

.ctrl-know {
  flex: 1;
  background: rgba(139, 195, 74, 0.14);
  border-color: rgba(139, 195, 74, 0.4);
  color: var(--property-group-a);
}

.ctrl-know:hover {
  transform: translateY(-2px);
}

.shortcut-footer,
.kbd-note {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-dim);
}

kbd {
  padding: 0.12rem 0.42rem;
  border-radius: 6px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-size: 0.78rem;
  color: var(--text);
}

.done-card {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
}

.done-trophy {
  font-size: 3.5rem;
}

.done-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.7rem;
  color: var(--primary);
}

.done-sub {
  color: var(--text-dim);
  font-size: 0.95rem;
}

.done-metrics {
  width: 100%;
  max-width: 340px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  border-radius: 16px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.done-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.primary-cta,
.secondary-cta {
  padding: 0.8rem 1.4rem;
  border-radius: 14px;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  cursor: pointer;
  border: 1px solid transparent;
}

.primary-cta {
  background: var(--primary);
  color: var(--text-inverse);
}

.secondary-cta {
  background: var(--bg-sidebar);
  border-color: var(--danger-border);
  color: var(--danger);
}

@media (max-width: 600px) {
  .flashcard-page {
    padding: 0.75rem;
  }

  .card-face {
    padding: 1.15rem;
  }

  .brand-title {
    font-size: 1.3rem;
  }

  .ctrl-btn {
    padding: 0.75rem 0.7rem;
    font-size: 0.9rem;
  }
}
</style>
