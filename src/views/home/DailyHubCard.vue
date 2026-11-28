<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useDailyChallengeStore } from '@/stores/useDailyChallengeStore'
import {
  type CrossAppProgressSummary,
  detectTodayCompletedApps,
  getDailyChallengesForDate,
  readCrossAppProgress,
} from '@/utils/daily-challenge'
import { getDailyDateKey } from '@/utils/daily-seed'
import { OOP_FLASHCARDS } from '@/views/oop-flashcards/data'

const challengeStore = useDailyChallengeStore()
const todayKey = getDailyDateKey()
const dailyChallenges = computed(() => getDailyChallengesForDate(todayKey))
const completedIds = computed(() => challengeStore.getCompletedForDate(todayKey))
const completedCount = computed(
  () => dailyChallenges.value.filter((item) => completedIds.value.includes(item.id)).length,
)

function createInitialProgress(): CrossAppProgressSummary {
  if (typeof localStorage !== 'undefined') {
    return readCrossAppProgress(localStorage)
  }
  return {
    chessWins: 0,
    chessPuzzlesSolved: 0,
    ngareEndingsUnlocked: 0,
    ngareRunsRecorded: 0,
    oopMasteredCount: 0,
    oopBestQuiz: 0,
    typingBestWpm: 0,
    colorBestStreak: 0,
    oracleReadings: 0,
    pianoMelodies: 0,
    farmHarvests: 0,
    saigonAchievements: 0,
    activeAppsCount: 0,
  }
}

const progressSummary = ref<CrossAppProgressSummary>(createInitialProgress())

function refreshCrossAppProgress() {
  if (typeof localStorage !== 'undefined') {
    progressSummary.value = readCrossAppProgress(localStorage)
    const detected = detectTodayCompletedApps(localStorage, todayKey)
    const todayIds = new Set(dailyChallenges.value.map((item) => item.id))
    for (const id of detected.challengeIds) {
      if (todayIds.has(id) && !challengeStore.isCompleted(id, todayKey)) {
        challengeStore.toggleChallenge(id, todayKey)
      }
    }
  }
}

onMounted(() => {
  challengeStore.hydrateSafely()
  refreshCrossAppProgress()
})

const highlightBadges = computed(() => {
  const s = progressSummary.value
  return [
    { icon: '🧭', label: 'Kết cục Ngã Rẽ', value: `${s.ngareEndingsUnlocked}/15` },
    { icon: '♟️', label: 'Thắng Cờ Tướng', value: `${s.chessWins} ván` },
    { icon: '🎴', label: 'Thẻ OOP thuộc', value: `${s.oopMasteredCount}/${OOP_FLASHCARDS.length}` },
    { icon: '⌨️', label: 'Kỷ lục WPM', value: `${s.typingBestWpm}` },
    { icon: '🎨', label: 'Chuỗi Color', value: `${s.colorBestStreak}` },
    { icon: '🌾', label: 'Thu hoạch Farm', value: `${s.farmHarvests}` },
  ]
})
</script>

<template>
  <section
    class="daily-hub-card"
    aria-label="Trung tâm Thành tích và Thử thách hằng ngày"
  >
    <div class="hub-top">
      <div class="hub-title-group">
        <span class="hub-kicker">🎯 NHIỆM VỤ HẰNG NGÀY · {{ todayKey }}</span>
        <span class="hub-progress-pill">
          Hoàn thành <strong>{{ completedCount }}/{{ dailyChallenges.length }}</strong>
        </span>
      </div>

      <div class="hub-stats-pills">
        <span class="stat-badge xp-badge">✨ {{ challengeStore.totalXp }} XP</span>
        <span class="stat-badge streak-badge">🔥 {{ challengeStore.streakDays }} ngày liên tiếp</span>
        <button
          type="button"
          class="collapse-btn"
          :aria-expanded="!challengeStore.isCollapsed"
          :aria-label="challengeStore.isCollapsed ? 'Mở rộng Nhiệm vụ hằng ngày' : 'Thu gọn Nhiệm vụ hằng ngày'"
          @click="challengeStore.toggleCollapsed()"
        >
          {{ challengeStore.isCollapsed ? 'Mở rộng ▾' : 'Thu gọn ▴' }}
        </button>
      </div>
    </div>

    <div
      v-show="!challengeStore.isCollapsed"
      class="hub-body"
    >
      <div class="challenges-grid">
        <div
          v-for="item in dailyChallenges"
          :key="item.id"
          class="challenge-row"
          :class="{ 'is-done': completedIds.includes(item.id) }"
        >
          <button
            type="button"
            class="check-btn"
            :aria-pressed="completedIds.includes(item.id)"
            :aria-label="`Đánh dấu hoàn thành: ${item.title}`"
            @click="challengeStore.toggleChallenge(item.id, todayKey)"
          >
            {{ completedIds.includes(item.id) ? '✓' : '' }}
          </button>

          <div class="challenge-info">
            <div class="challenge-head">
              <span class="ch-app">{{ item.icon }} {{ item.appName }}</span>
              <span class="ch-xp">+{{ item.xpReward }} XP</span>
            </div>
            <strong class="ch-title">{{ item.title }}</strong>
            <p class="ch-hint">
              {{ item.hint }}
            </p>
          </div>

          <RouterLink
            :to="item.route"
            class="ch-go-btn"
            :aria-label="`Mở ${item.appName}`"
          >
            Chơi →
          </RouterLink>
        </div>
      </div>

      <div class="cross-progress-strip">
        <div class="cross-head">
          <span class="cross-label">🏆 HỒ SƠ LIÊN ỨNG DỤNG</span>
          <span class="cross-sub">{{ progressSummary.activeAppsCount }}/9 mini-app đã ghi nhận thành tích</span>
        </div>
        <div class="cross-badges">
          <div
            v-for="badge in highlightBadges"
            :key="badge.label"
            class="cross-badge-item"
          >
            <span class="cb-icon">{{ badge.icon }}</span>
            <div class="cb-copy">
              <strong>{{ badge.value }}</strong>
              <small>{{ badge.label }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.daily-hub-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.1rem 1.35rem;
  border-radius: 22px;
  background: var(--surface-glass);
  border: 1px solid var(--outline);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(14px);
}

.hub-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hub-title-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.hub-kicker {
  font-family: 'Manrope', sans-serif;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 1.2px;
  color: var(--primary);
}

.hub-progress-pill {
  font-size: 0.78rem;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  background: var(--primary-soft);
  border: 1px solid var(--outline-strong);
  color: var(--text);
}

.hub-stats-pills {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stat-badge {
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.24rem 0.65rem;
  border-radius: 999px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  white-space: nowrap;
}

.xp-badge {
  color: var(--primary);
}

.streak-badge {
  color: var(--warning);
}

.collapse-btn {
  padding: 0.28rem 0.7rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
}

.collapse-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.hub-body {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 275px), 1fr));
  gap: 0.75rem;
}

.challenge-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.95rem;
  border-radius: 16px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  transition: var(--transition-fast);
}

.challenge-row:hover {
  border-color: var(--outline-strong);
}

.challenge-row.is-done {
  border-color: var(--success);
  background: var(--bg-sidebar);
}

.challenge-row.is-done .ch-title {
  text-decoration: line-through;
  opacity: 0.78;
}

.check-btn {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1.5px solid var(--outline-strong);
  background: var(--bg-input);
  color: var(--text-inverse);
  font-weight: 900;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.challenge-row.is-done .check-btn {
  background: var(--success);
  border-color: var(--success);
}

.challenge-info {
  flex: 1;
  min-width: 0;
}

.challenge-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
}

.ch-app {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ch-xp {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--accent);
  white-space: nowrap;
}

.ch-title {
  display: block;
  font-size: 0.86rem;
  color: var(--text);
  line-height: 1.3;
}

.ch-hint {
  font-size: 0.74rem;
  color: var(--text-dim);
  line-height: 1.35;
  margin-top: 0.15rem;
}

.ch-go-btn {
  flex-shrink: 0;
  padding: 0.36rem 0.68rem;
  border-radius: 10px;
  background: var(--primary-soft);
  border: 1px solid var(--outline-strong);
  color: var(--primary);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
  transition: var(--transition-fast);
}

.ch-go-btn:hover {
  background: var(--primary);
  color: var(--text-inverse);
}

.cross-progress-strip {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 0.7rem;
  border-top: 1px dashed var(--outline);
}

.cross-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.cross-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--text-dim);
}

.cross-sub {
  font-size: 0.74rem;
  color: var(--text-dim);
}

.cross-badges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
  gap: 0.55rem;
}

.cross-badge-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.65rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.cb-icon {
  font-size: 1.05rem;
  flex-shrink: 0;
}

.cb-copy strong {
  display: block;
  font-size: 0.84rem;
  line-height: 1.15;
  color: var(--text);
}

.cb-copy small {
  display: block;
  font-size: 0.68rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 600px) {
  .daily-hub-card {
    padding: 0.95rem 1rem;
  }

  .challenges-grid {
    grid-template-columns: 1fr;
  }
}
</style>
