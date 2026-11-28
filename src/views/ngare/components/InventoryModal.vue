<script setup lang="ts">
import { ref } from 'vue'
import { ACHIEVEMENTS } from '../data/achievements'
import type { GameDataJson, GameState } from '../types'

interface Props {
  gameState: GameState
  gameData: GameDataJson
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'use-skill', skillId: string): void
}>()

const activeTab = ref<'items' | 'skills' | 'achievements'>('items')
</script>

<template>
  <div
    class="modal-overlay"
    @click.self="emit('close')"
  >
    <div
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-label="Túi đồ, Kỹ năng và Thành tựu"
    >
      <div class="modal-head">
        <h3>🎒 Túi Đồ & Thành Tựu</h3>
        <button
          type="button"
          class="close-x"
          aria-label="Đóng"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="modal-tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'items' }"
          @click="activeTab = 'items'"
        >
          📦 Vật Phẩm ({{ gameState.inventory.length }})
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'skills' }"
          @click="activeTab = 'skills'"
        >
          ⚡ Kỹ Năng ({{ gameState.activeSkills.length }})
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'achievements' }"
          @click="activeTab = 'achievements'"
        >
          🏆 Thành Tựu ({{ gameState.unlockedAchievements.length }}/{{ ACHIEVEMENTS.length }})
        </button>
      </div>

      <div class="modal-scroll">
        <!-- TAB VẬT PHẨM -->
        <div
          v-if="activeTab === 'items'"
          class="list-col"
        >
          <div
            v-if="gameState.inventory.length === 0"
            class="empty-box"
          >
            Bạn chưa sở hữu vật phẩm thụ động nào. Ghé Cửa hàng 🛒 để mua!
          </div>
          <div
            v-for="id in gameState.inventory"
            :key="id"
            class="inv-card"
          >
            <span class="inv-emoji">
              {{ gameData.passiveItems.find((i) => i.id === id)?.name.split(' ')[0] }}
            </span>
            <div class="inv-body">
              <strong>
                {{
                  ((n) => (n ? n.substring(n.indexOf(' ') + 1) : id))(
                    gameData.passiveItems.find((i) => i.id === id)?.name ?? '',
                  )
                }}
              </strong>
              <p>{{ gameData.passiveItems.find((i) => i.id === id)?.description }}</p>
            </div>
          </div>
        </div>

        <!-- TAB KỸ NĂNG -->
        <div
          v-else-if="activeTab === 'skills'"
          class="list-col"
        >
          <div
            v-if="gameState.activeSkills.length === 0"
            class="empty-box"
          >
            Bạn chưa học kỹ năng chủ động nào.
          </div>
          <div
            v-for="id in gameState.activeSkills"
            :key="id"
            class="inv-card"
          >
            <span class="inv-emoji">
              {{ gameData.activeSkills.find((s) => s.id === id)?.name.split(' ')[0] }}
            </span>
            <div class="inv-body">
              <strong>
                {{
                  ((n) => (n ? n.substring(n.indexOf(' ') + 1) : id))(
                    gameData.activeSkills.find((s) => s.id === id)?.name ?? '',
                  )
                }}
              </strong>
              <p>{{ gameData.activeSkills.find((s) => s.id === id)?.description }}</p>
              <small :class="(gameState.skillCooldowns[id] ?? 0) === 0 ? 'cd-ready' : 'cd-wait'">
                {{
                  (gameState.skillCooldowns[id] ?? 0) === 0
                    ? '✅ Sẵn sàng kích hoạt'
                    : `⏱️ Hồi chiêu còn ${gameState.skillCooldowns[id]} năm`
                }}
              </small>
            </div>
            <button
              type="button"
              class="use-btn"
              :disabled="(gameState.skillCooldowns[id] ?? 0) > 0"
              @click="emit('use-skill', id)"
            >
              ⚡ Dùng
            </button>
          </div>
        </div>

        <!-- TAB THÀNH TỰU -->
        <div
          v-else
          class="ach-grid"
        >
          <div
            v-for="ach in ACHIEVEMENTS"
            :key="ach.id"
            class="ach-card"
            :class="{ unlocked: gameState.unlockedAchievements.includes(ach.id) }"
          >
            <span class="ach-emoji">
              {{ gameState.unlockedAchievements.includes(ach.id) ? ach.emoji : '🔒' }}
            </span>
            <div>
              <strong>{{ ach.title }}</strong>
              <p>{{ ach.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(4, 9, 20, 0.72);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem;
}

.modal-card {
  width: 100%;
  max-width: 700px;
  max-height: 88dvh;
  background: var(--bg-modal);
  border: 1px solid var(--outline-strong);
  border-radius: 20px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  color: var(--text);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-head h3 {
  font-size: 1.08rem;
  font-weight: 800;
}

.close-x {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid var(--outline);
  background: var(--bg-card);
  color: var(--text);
  cursor: pointer;
  font-weight: 700;
}

.modal-tabs {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tab-btn {
  flex: 1 1 110px;
  padding: 0.5rem 0.65rem;
  border-radius: 12px;
  border: 1px solid var(--outline);
  background: var(--bg-card);
  color: var(--text-dim);
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;
}

.tab-btn.active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
}

.modal-scroll {
  overflow-y: auto;
  min-height: 0;
  padding-right: 0.2rem;
}

.list-col {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.inv-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.78rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
}

.inv-emoji {
  font-size: 1.6rem;
}

.inv-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.inv-body strong {
  font-size: 0.88rem;
}

.inv-body p {
  font-size: 0.78rem;
  color: var(--text-dim);
}

.cd-ready {
  font-size: 0.74rem;
  color: var(--success);
  font-weight: 700;
}

.cd-wait {
  font-size: 0.74rem;
  color: var(--warning);
  font-weight: 700;
}

.use-btn {
  padding: 0.42rem 0.78rem;
  border-radius: 10px;
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--text-inverse);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

.use-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.ach-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.ach-card {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.72rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  opacity: 0.56;
}

.ach-card.unlocked {
  opacity: 1;
  border-color: var(--success);
}

.ach-emoji {
  font-size: 1.45rem;
}

.ach-card strong {
  font-size: 0.84rem;
  display: block;
}

.ach-card p {
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-top: 0.15rem;
}

.empty-box {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-dim);
  font-size: 0.86rem;
}

@media (max-width: 580px) {
  .ach-grid {
    grid-template-columns: 1fr;
  }
}
</style>
