<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useOopFlashcardsStore } from '@/stores/oopFlashcards'
import { copyTextWithFallback } from '@/utils/clipboard'
import { hasOpenDialog, isEditableEventTarget } from '@/utils/keyboard'
import OopQuizPanel from './components/OopQuizPanel.vue'
import { OOP_FLASHCARDS, OOP_TOPICS } from './data'
import {
  buildDeck,
  computeGroupProgress,
  generateQuizQuestions,
  getAccuracyPercent,
  getCompletionTitle,
  tokenizeJavaCode,
} from './engine'
import type {
  DifficultyFilter,
  Flashcard,
  QuizOption,
  QuizQuestion,
  StudyMode,
  TopicFilter,
} from './types'

const store = useOopFlashcardsStore()

const DIFFICULTY_OPTIONS: ReadonlyArray<{ id: DifficultyFilter; label: string }> = [
  { id: 'all', label: 'Mọi độ khó' },
  { id: 'Cơ bản', label: '🟢 Cơ bản' },
  { id: 'Trung bình', label: '🟡 Trung bình' },
  { id: 'Nâng cao', label: '🔴 Nâng cao' },
]

const studyMode = ref<StudyMode>('flashcard')
const selectedDifficulty = ref<DifficultyFilter>('all')
const deck = ref<Flashcard[]>([])
const currentIndex = ref(0)
const isFlipped = ref(false)
const isShuffled = ref(false)
const isShaking = ref(false)
const sessionKnown = ref(0)
const sessionNope = ref(0)
const copiedCardId = ref<string | null>(null)
const sessionRatings = ref<Array<{ cardId: string; known: boolean }>>([])
const searchKeyword = ref('')

const quizQuestions = ref<QuizQuestion[]>([])
const quizIndex = ref(0)
const selectedOptionId = ref<string | null>(null)
const quizCorrect = ref(0)
const quizDone = ref(false)

const isConfirmingReset = ref(false)

let touchStartX = 0
let rateTimer: ReturnType<typeof setTimeout> | null = null
let shakeTimer: ReturnType<typeof setTimeout> | null = null
let shakeRafId: number | null = null
let copyTimer: ReturnType<typeof setTimeout> | null = null
let resetConfirmTimer: ReturnType<typeof setTimeout> | null = null

const isDone = computed(() => deck.value.length > 0 && currentIndex.value >= deck.value.length)
const currentCard = computed<Flashcard | null>(() => deck.value[currentIndex.value] ?? null)
const currentQuiz = computed<QuizQuestion | null>(() => quizQuestions.value[quizIndex.value] ?? null)
const unmasteredCount = computed(() => Math.max(0, OOP_FLASHCARDS.length - store.masteredIds.length))
const groupProgress = computed(() => computeGroupProgress(OOP_FLASHCARDS, store.masteredIds))

const currentTopicTitle = computed(() => {
  const topicId =
    studyMode.value === 'quiz' ? currentQuiz.value?.topicId : currentCard.value?.topicId
  if (!topicId) return 'OOP'
  return OOP_TOPICS.find((t) => t.id === topicId)?.title ?? 'OOP'
})

const highlightedCodeTokens = computed(() => {
  const code = currentCard.value?.codeExample
  return code ? tokenizeJavaCode(code) : []
})

const remainingCount = computed(() => Math.max(0, deck.value.length - currentIndex.value))

const progressPercent = computed(() => {
  if (studyMode.value === 'quiz') {
    if (quizQuestions.value.length === 0) return 0
    if (quizDone.value) return 100
    return Math.min(100, Math.round((quizIndex.value / quizQuestions.value.length) * 100))
  }
  if (deck.value.length === 0) return 0
  return Math.min(100, Math.round((currentIndex.value / deck.value.length) * 100))
})

const completionTitle = computed(() => getCompletionTitle(sessionKnown.value, deck.value.length))
const accuracyPercent = computed(() => getAccuracyPercent(sessionKnown.value, deck.value.length))
const quizAccuracyPercent = computed(() =>
  getAccuracyPercent(quizCorrect.value, quizQuestions.value.length),
)
const masteryPercent = computed(() =>
  getAccuracyPercent(store.masteredIds.length, OOP_FLASHCARDS.length),
)
const masteryRingOffset = computed(() => {
  const circumference = 2 * Math.PI * 18
  return circumference * (1 - masteryPercent.value / 100)
})

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

  const baseDeck = buildDeck(
    OOP_FLASHCARDS,
    activeFilter,
    store.reviewIds,
    shuffle,
    Math.random,
    store.masteredIds,
    selectedDifficulty.value,
  )
  const q = searchKeyword.value.trim().toLowerCase()
  deck.value = q
    ? baseDeck.filter(
        (c) =>
          c.question.toLowerCase().includes(q) ||
          c.answerTitle.toLowerCase().includes(q) ||
          c.answerPoints.some((p) => p.toLowerCase().includes(q)),
      )
    : baseDeck
  currentIndex.value = 0
  isFlipped.value = false
  sessionKnown.value = 0
  sessionNope.value = 0
  sessionRatings.value = []

  if (studyMode.value === 'quiz') {
    startQuiz()
  }
}

function selectTopic(filter: TopicFilter) {
  store.setSelectedTopic(filter)
  rebuildDeck(false)
}

function selectDifficulty(level: DifficultyFilter) {
  selectedDifficulty.value = level
  rebuildDeck(false)
}

function startQuiz() {
  const pool = deck.value.length > 0 ? deck.value : OOP_FLASHCARDS
  quizQuestions.value = generateQuizQuestions(pool, OOP_FLASHCARDS, 8)
  quizIndex.value = 0
  selectedOptionId.value = null
  quizCorrect.value = 0
  quizDone.value = false
}

function switchStudyMode(mode: StudyMode) {
  if (studyMode.value === mode) return
  studyMode.value = mode
  if (mode === 'quiz') {
    startQuiz()
  }
}

function selectQuizOption(option: QuizOption) {
  const q = currentQuiz.value
  if (!q || selectedOptionId.value !== null || quizDone.value) return
  selectedOptionId.value = option.id
  if (option.isCorrect) {
    quizCorrect.value += 1
  }
  store.markCardResult(q.cardId, option.isCorrect)
}

function nextQuizQuestion() {
  if (selectedOptionId.value === null) return
  if (quizIndex.value + 1 >= quizQuestions.value.length) {
    quizDone.value = true
    store.recordQuizResult(quizCorrect.value, quizQuestions.value.length)
    return
  }
  quizIndex.value += 1
  selectedOptionId.value = null
}

function toggleFlip() {
  if (studyMode.value !== 'flashcard' || isDone.value || !currentCard.value) return
  isFlipped.value = !isFlipped.value
}

function rateCard(known: boolean) {
  const card = currentCard.value
  if (studyMode.value !== 'flashcard' || !card || isDone.value) return

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
  if (shakeRafId !== null) {
    cancelAnimationFrame(shakeRafId)
    shakeRafId = null
  }
  shakeRafId = requestAnimationFrame(() => {
    shakeRafId = null
    isShaking.value = true
    shakeTimer = setTimeout(() => {
      isShaking.value = false
    }, 360)
  })
}

async function copyCode() {
  const card = currentCard.value
  if (!card?.codeExample) return
  copiedCardId.value = card.id
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copiedCardId.value = null
  }, 1800)
  await copyTextWithFallback(card.codeExample)
}

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0]?.screenX ?? 0
}

function handleTouchEnd(e: TouchEvent) {
  if (studyMode.value !== 'flashcard') return
  const endX = e.changedTouches[0]?.screenX ?? 0
  const diff = touchStartX - endX
  if (Math.abs(diff) > 55) {
    rateCard(diff > 0)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (isEditableEventTarget(e.target) || hasOpenDialog()) return
  if (studyMode.value !== 'flashcard') return

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
  if (!isConfirmingReset.value) {
    isConfirmingReset.value = true
    if (resetConfirmTimer) clearTimeout(resetConfirmTimer)
    resetConfirmTimer = setTimeout(() => {
      isConfirmingReset.value = false
      resetConfirmTimer = null
    }, 4000)
    return
  }

  isConfirmingReset.value = false
  if (resetConfirmTimer) {
    clearTimeout(resetConfirmTimer)
    resetConfirmTimer = null
  }
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
  if (shakeRafId !== null) cancelAnimationFrame(shakeRafId)
  if (copyTimer) clearTimeout(copyTimer)
  if (resetConfirmTimer) clearTimeout(resetConfirmTimer)
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
          <div class="brand-heading">
            <div
              class="mastery-ring"
              :title="`Đã thông thạo ${masteryPercent}% (${store.masteredIds.length}/${OOP_FLASHCARDS.length} câu)`"
            >
              <svg
                viewBox="0 0 44 44"
                class="ring-svg"
                aria-hidden="true"
              >
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  class="ring-bg"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  class="ring-fill"
                  :style="{ strokeDashoffset: masteryRingOffset }"
                />
              </svg>
              <span class="ring-pct">{{ masteryPercent }}%</span>
            </div>
            <div>
              <h1 class="brand-title">
                OOP<span>Cards</span>
              </h1>
              <p class="brand-sub">
                Lý thuyết OOP &amp; SOLID · Thuộc {{ store.masteredIds.length }}/{{ OOP_FLASHCARDS.length }}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="ghost-btn"
          :class="{ confirming: isConfirmingReset }"
          title="Đặt lại toàn bộ tiến trình"
          @click="handleResetAll"
        >
          {{ isConfirmingReset ? 'Xác nhận Reset?' : '↺ Reset' }}
        </button>
      </header>

      <div class="mode-toggle-bar">
        <div
          class="study-switch"
          role="group"
          aria-label="Chọn chế độ học"
        >
          <button
            type="button"
            :class="{ active: studyMode === 'flashcard' }"
            @click="switchStudyMode('flashcard')"
          >
            🎴 Thẻ lật
          </button>
          <button
            type="button"
            :class="{ active: studyMode === 'quiz' }"
            @click="switchStudyMode('quiz')"
          >
            ⚡ Quiz nhanh
          </button>
        </div>

        <div class="quiz-best-pill">
          🏆 Kỷ lục Quiz: <strong>{{ store.bestQuizPercent }}%</strong>
          <span>({{ store.quizzesCompleted }} lượt)</span>
        </div>
      </div>

      <section class="group-progress-grid">
        <div
          v-for="group in groupProgress"
          :key="group.id"
          class="group-card"
        >
          <div class="group-head">
            <span class="group-name">{{ group.title }}</span>
            <strong class="group-ratio">{{ group.mastered }}/{{ group.total }}</strong>
          </div>
          <div class="group-bar-track">
            <div
              class="group-bar-fill"
              :style="{ width: `${group.percent}%` }"
            />
          </div>
        </div>
      </section>

      <section class="stats-row">
        <div class="stat-pill stat-know">
          <span class="stat-num">{{ studyMode === 'quiz' ? quizCorrect : sessionKnown }}</span>
          <span class="stat-lbl">{{ studyMode === 'quiz' ? 'Đúng' : 'Đã biết' }}</span>
        </div>
        <div class="stat-pill stat-nope">
          <span class="stat-num">{{ studyMode === 'quiz' ? unmasteredCount : sessionNope }}</span>
          <span class="stat-lbl">{{ studyMode === 'quiz' ? 'Chưa thuộc' : 'Cần ôn' }}</span>
        </div>
        <div class="stat-pill stat-left">
          <span class="stat-num">
            {{
              studyMode === 'quiz'
                ? Math.max(0, quizQuestions.length - quizIndex - (quizDone ? 1 : 0))
                : remainingCount
            }}
          </span>
          <span class="stat-lbl">Còn lại</span>
        </div>
      </section>

      <div class="progress-track">
        <div
          class="progress-bar"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <section class="filter-controls">
        <div class="card-search">
          <span>🔍</span>
          <input
            v-model="searchKeyword"
            type="search"
            placeholder="Lọc nhanh theo từ khóa (vd: SOLID, static, interface)..."
            @input="rebuildDeck(false)"
          >
        </div>
        <div class="topic-bar">
          <button
            type="button"
            class="topic-pill"
            :class="{ active: store.selectedTopic === 'all' }"
            @click="selectTopic('all')"
          >
            Tất cả ({{ OOP_FLASHCARDS.length }})
          </button>

          <button
            type="button"
            class="topic-pill topic-unmastered"
            :class="{ active: store.selectedTopic === 'unmastered' }"
            @click="selectTopic('unmastered')"
          >
            🎯 Chưa thuộc ({{ unmasteredCount }})
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
        </div>

        <div
          class="difficulty-bar"
          role="group"
          aria-label="Lọc theo độ khó"
        >
          <button
            v-for="diff in DIFFICULTY_OPTIONS"
            :key="diff.id"
            type="button"
            class="topic-pill diff-pill"
            :class="{ active: selectedDifficulty === diff.id }"
            @click="selectDifficulty(diff.id)"
          >
            {{ diff.label }}
          </button>
        </div>
      </section>

      <!-- CHẾ ĐỘ QUIZ TRẮC NGHIỆM NHANH -->
      <OopQuizPanel
        v-if="studyMode === 'quiz'"
        :quiz-done="quizDone"
        :quiz-correct="quizCorrect"
        :quiz-questions-length="quizQuestions.length"
        :quiz-accuracy-percent="quizAccuracyPercent"
        :current-quiz="currentQuiz"
        :current-topic-title="currentTopicTitle"
        :quiz-index="quizIndex"
        :selected-option-id="selectedOptionId"
        @start-quiz="startQuiz"
        @switch-flashcard="switchStudyMode('flashcard')"
        @select-option="selectQuizOption"
        @next-question="nextQuizQuestion"
      />

      <!-- CHẾ ĐỘ THẺ LẬT 3D -->
      <main
        v-else
        class="stage"
      >
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
            v-if="remainingCount > 2"
            class="deck-layer layer-2"
            aria-hidden="true"
          />
          <div
            v-if="remainingCount > 1"
            class="deck-layer layer-1"
            aria-hidden="true"
          />
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

        <div
          v-else
          class="done-card"
        >
          <div class="done-trophy">
            {{ store.selectedTopic === 'unmastered' ? '🎉' : '🔎' }}
          </div>
          <h2 class="done-title">
            {{
              store.selectedTopic === 'unmastered'
                ? 'Chúc mừng! Bạn đã thuộc 100% các thẻ!'
                : `Không tìm thấy thẻ khớp "${searchKeyword}"`
            }}
          </h2>
          <p class="done-sub">
            {{
              store.selectedTopic === 'unmastered'
                ? 'Bạn có thể thử sức với chế độ Quiz nhanh hoặc xem lại toàn bộ bộ thẻ.'
                : 'Thử xóa từ khóa hoặc chuyển về mục Tất cả để tiếp tục học.'
            }}
          </p>
          <div class="done-actions">
            <button
              type="button"
              class="primary-cta"
              @click="searchKeyword = ''; selectTopic('all')"
            >
              Xem lại toàn bộ bộ thẻ
            </button>
            <button
              v-if="store.selectedTopic === 'unmastered'"
              type="button"
              class="secondary-cta"
              @click="selectTopic('all'); switchStudyMode('quiz')"
            >
              ⚡ Làm Quiz kiểm tra
            </button>
          </div>
        </div>
      </main>

      <footer
        v-if="studyMode === 'flashcard' && !isDone"
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
        v-if="studyMode === 'flashcard' && !isDone"
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

.ghost-btn.confirming {
  background: var(--danger);
  border-color: var(--danger);
  color: var(--text-inverse);
}

.back-btn:hover,
.ghost-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.ghost-btn.confirming:hover {
  color: var(--text-inverse);
}

.mode-toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.study-switch {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 13px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.study-switch button {
  padding: 0.45rem 0.9rem;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
}

.study-switch button.active {
  background: var(--primary);
  color: var(--text-inverse);
}

.quiz-best-pill {
  padding: 0.42rem 0.85rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-size: 0.8rem;
  color: var(--text-dim);
}

.quiz-best-pill strong {
  color: var(--primary);
}

.group-progress-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.group-card {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 14px;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.group-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
}

.group-name {
  color: var(--text-dim);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-ratio {
  color: var(--primary);
  font-weight: 800;
  flex-shrink: 0;
}

.group-bar-track {
  height: 5px;
  border-radius: 999px;
  background: var(--bg-input);
  overflow: hidden;
}

.group-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transition: width 0.35s ease;
}

.brand-block {
  text-align: left;
  min-width: 0;
}

.brand-heading {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.mastery-ring {
  position: relative;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: var(--outline);
  stroke-width: 3.5;
}

.ring-fill {
  fill: none;
  stroke: var(--primary);
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-dasharray: 113.1;
  transition: stroke-dashoffset 0.45s ease;
}

.ring-pct {
  position: absolute;
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--primary);
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.card-search {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.85rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  transition: var(--transition-fast);
}

.card-search:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.card-search input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 0.86rem;
}

.card-scene {
  position: relative;
  width: 100%;
  perspective: 1800px;
  display: flex;
  padding-bottom: 14px;
}

.deck-layer {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 10px;
  bottom: 0;
  border-radius: 24px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  pointer-events: none;
}

.deck-layer.layer-1 {
  transform: translateY(6px) scale(0.97);
  opacity: 0.72;
}

.deck-layer.layer-2 {
  transform: translateY(12px) scale(0.94);
  opacity: 0.42;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  border-color: var(--danger-border);
  color: var(--danger);
}

.topic-unmastered {
  border-color: var(--outline-strong);
  color: var(--primary);
}

.difficulty-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.diff-pill {
  padding: 0.34rem 0.78rem;
  font-size: 0.78rem;
}

.quiz-card {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 24px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  box-shadow: var(--shadow-card);
}

.quiz-question {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.15rem, 2.5vw, 1.55rem);
  font-weight: 800;
  line-height: 1.38;
  color: var(--text);
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.quiz-opt-btn {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: var(--bg-sidebar);
  border: 1.5px solid var(--outline);
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 0.92rem;
  line-height: 1.45;
}

.quiz-opt-btn:hover:not(:disabled) {
  border-color: var(--primary);
}

.quiz-opt-btn.correct {
  border-color: var(--success);
  background: rgba(52, 211, 153, 0.14);
}

.quiz-opt-btn.wrong {
  border-color: var(--danger);
  background: var(--danger-bg);
}

.opt-letter {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
  color: var(--primary);
}

.opt-text {
  flex: 1;
}

.quiz-feedback {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline-strong);
  border-radius: 16px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.quiz-feedback strong {
  color: var(--primary);
  font-size: 0.92rem;
}

.quiz-feedback ul {
  padding-left: 1.15rem;
  color: var(--text-dim);
  font-size: 0.88rem;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quiz-next-btn {
  align-self: flex-end;
  margin-top: 0.25rem;
}

.stage {
  flex: 1;
  min-height: 360px;
  display: flex;
  align-items: stretch;
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
  border-color: var(--outline-strong);
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
  background: var(--primary-soft);
  border-color: var(--outline-strong);
  color: var(--success);
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

  .top-nav {
    flex-wrap: wrap;
    row-gap: 0.65rem;
  }

  .brand-block {
    order: 3;
    flex-basis: 100%;
  }

  .group-progress-grid {
    grid-template-columns: 1fr;
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
