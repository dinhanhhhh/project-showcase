<script setup lang="ts">
import { getCompletionTitle } from '../engine'
import type { QuizOption, QuizQuestion } from '../types'

defineProps<{
  quizDone: boolean
  quizCorrect: number
  quizQuestionsLength: number
  quizAccuracyPercent: number
  currentQuiz: QuizQuestion | null
  currentTopicTitle: string
  quizIndex: number
  selectedOptionId: string | null
}>()

const emit = defineEmits<{
  'start-quiz': []
  'switch-flashcard': []
  'select-option': [option: QuizOption]
  'next-question': []
}>()
</script>

<template>
  <main class="stage">
    <div
      v-if="quizDone"
      class="done-card"
    >
      <div class="done-trophy">
        ⚡
      </div>
      <h2 class="done-title">
        {{ getCompletionTitle(quizCorrect, quizQuestionsLength) }}
      </h2>
      <p class="done-sub">
        Bạn trả lời đúng <strong>{{ quizCorrect }} / {{ quizQuestionsLength }}</strong> câu ({{ quizAccuracyPercent }}%)
      </p>
      <div class="done-actions">
        <button
          type="button"
          class="primary-cta"
          @click="emit('start-quiz')"
        >
          Làm bài Quiz mới
        </button>
        <button
          type="button"
          class="secondary-cta"
          @click="emit('switch-flashcard')"
        >
          Về chế độ Thẻ lật
        </button>
      </div>
    </div>

    <div
      v-else-if="currentQuiz"
      class="quiz-card"
    >
      <div class="face-meta">
        <span class="topic-badge">{{ currentTopicTitle }}</span>
        <span class="diff-badge">{{ currentQuiz.difficulty }}</span>
        <span class="index-badge">Câu {{ quizIndex + 1 }} / {{ quizQuestionsLength }}</span>
      </div>

      <h2 class="quiz-question">
        {{ currentQuiz.question }}
      </h2>

      <div class="quiz-options">
        <button
          v-for="(opt, idx) in currentQuiz.options"
          :key="opt.id"
          type="button"
          class="quiz-opt-btn"
          :class="{
            selected: selectedOptionId === opt.id,
            correct: selectedOptionId !== null && opt.isCorrect,
            wrong: selectedOptionId === opt.id && !opt.isCorrect,
          }"
          :disabled="selectedOptionId !== null"
          @click="emit('select-option', opt)"
        >
          <span class="opt-letter">{{ String.fromCharCode(65 + idx) }}</span>
          <span class="opt-text">{{ opt.text }}</span>
        </button>
      </div>

      <div
        v-if="selectedOptionId !== null"
        class="quiz-feedback"
      >
        <strong>Đáp án chuẩn · {{ currentQuiz.answerTitle }}</strong>
        <ul>
          <li
            v-for="(line, idx) in currentQuiz.explanation"
            :key="idx"
          >
            {{ line }}
          </li>
        </ul>
        <button
          type="button"
          class="primary-cta quiz-next-btn"
          @click="emit('next-question')"
        >
          {{ quizIndex + 1 >= quizQuestionsLength ? 'Xem tổng kết Quiz →' : 'Câu tiếp theo →' }}
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.stage {
  flex: 1;
  min-height: 360px;
  display: flex;
  align-items: stretch;
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

.face-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.topic-badge {
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: var(--primary-soft);
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
  background: var(--accent-soft);
  color: var(--accent);
}

.index-badge {
  margin-left: auto;
  font-size: 0.82rem;
  color: var(--text-dim);
  font-weight: 700;
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
</style>
