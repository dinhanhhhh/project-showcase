<script setup lang="ts">
import { computed, ref } from 'vue'
import { getAssetPrice, INVESTMENT_ASSETS } from '../data/assets'
import type {
  ActiveSkill,
  AssetId,
  Career,
  GameDataJson,
  GameState,
  MarketTrend,
  PassiveItem,
} from '../types'

interface Props {
  gameState: GameState
  gameData: GameDataJson
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'buy-item', item: PassiveItem): void
  (e: 'buy-skill', skill: ActiveSkill): void
  (e: 'buy-asset', assetId: AssetId): void
  (e: 'sell-asset', assetId: AssetId): void
  (e: 'switch-career', careerId: string): void
}>()

const activeTab = ref<'items' | 'skills' | 'invest'>('items')

const marketTrend = computed<MarketTrend>(() => props.gameState.marketTrend ?? 'neutral')

const marketNote = computed(() => {
  if (marketTrend.value === 'bull') return '📈 Thị trường hưng phấn: Giá cổ phiếu tăng +40%, BĐS +15%'
  if (marketTrend.value === 'bear') return '📉 Thị trường điều chỉnh: Giá cổ phiếu giảm -40% (cơ hội gom giá rẻ)'
  return '⚖️ Thị trường cân bằng: Các tài sản giao dịch quanh giá gốc'
})

const isUnemployed = computed(() => Boolean(props.gameState.flags?.includes('unemployed')))

const availableCareers = computed<Career[]>(() => {
  const all = Object.values(props.gameData.careers)
  return isUnemployed.value ? all : all.filter((c) => c.id !== props.gameState.careerId)
})

function isCareerActionDisabled(careerId: string): boolean {
  if (isUnemployed.value) {
    if (careerId === props.gameState.careerId) return false
    return props.gameState.stats.money < 15
  }
  return props.gameState.age < 28 || props.gameState.stats.money < 15
}

function getOwnedUnits(assetId: AssetId): number {
  return props.gameState.assets?.find((a) => a.assetId === assetId)?.units ?? 0
}

function canBuyItem(item: PassiveItem): boolean {
  return (
    props.gameState.stats.money >= item.cost &&
    !props.gameState.inventory.includes(item.id) &&
    props.gameState.age >= item.unlockAge
  )
}

function canBuySkill(skill: ActiveSkill): boolean {
  return (
    props.gameState.stats.money >= skill.cost &&
    !props.gameState.activeSkills.includes(skill.id) &&
    props.gameState.age >= skill.unlockAge
  )
}
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
      aria-label="Cửa hàng và Đầu tư"
    >
      <div class="modal-head">
        <div>
          <h3>🛒 Cửa Hàng & Đầu Tư</h3>
          <p class="cash-sub">
            Tiền mặt khả dụng: <strong>💰 {{ gameState.stats.money }}</strong> · Tuổi {{ gameState.age }}
          </p>
        </div>
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
          📦 Vật Phẩm
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'skills' }"
          @click="activeTab = 'skills'"
        >
          ✨ Kỹ Năng
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'invest' }"
          @click="activeTab = 'invest'"
        >
          📈 Đầu Tư & Nghề
        </button>
      </div>

      <div class="modal-scroll">
        <!-- TAB VẬT PHẨM -->
        <div
          v-if="activeTab === 'items'"
          class="list-col"
        >
          <div
            v-for="item in gameData.passiveItems"
            :key="item.id"
            class="shop-card"
          >
            <span class="item-emoji">{{ item.name.split(' ')[0] }}</span>
            <div class="item-body">
              <div class="item-top">
                <strong>{{ item.name.substring(item.name.indexOf(' ') + 1) }}</strong>
                <span class="price-tag">💰 {{ item.cost }}</span>
              </div>
              <p class="item-desc">
                {{ item.description }}
              </p>
              <div class="item-foot">
                <span
                  v-if="gameState.age < item.unlockAge"
                  class="lock-hint"
                >
                  🔒 Mở ở tuổi {{ item.unlockAge }}
                </span>
                <button
                  type="button"
                  class="act-btn"
                  :disabled="!canBuyItem(item)"
                  @click="emit('buy-item', item)"
                >
                  {{ gameState.inventory.includes(item.id) ? '✓ Đã sở hữu' : '🛒 Mua ngay' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB KỸ NĂNG -->
        <div
          v-else-if="activeTab === 'skills'"
          class="list-col"
        >
          <div
            v-for="skill in gameData.activeSkills"
            :key="skill.id"
            class="shop-card"
          >
            <span class="item-emoji">{{ skill.name.split(' ')[0] }}</span>
            <div class="item-body">
              <div class="item-top">
                <strong>{{ skill.name.substring(skill.name.indexOf(' ') + 1) }}</strong>
                <span class="price-tag">💰 {{ skill.cost }} · ⏱ {{ skill.cooldown }}n</span>
              </div>
              <p class="item-desc">
                {{ skill.description }}
              </p>
              <div class="item-foot">
                <span
                  v-if="gameState.age < skill.unlockAge"
                  class="lock-hint"
                >
                  🔒 Mở ở tuổi {{ skill.unlockAge }}
                </span>
                <button
                  type="button"
                  class="act-btn"
                  :disabled="!canBuySkill(skill)"
                  @click="emit('buy-skill', skill)"
                >
                  {{ gameState.activeSkills.includes(skill.id) ? '✓ Đã học' : '✨ Mở khóa' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB ĐẦU TƯ & CHUYỂN NGHỀ -->
        <div
          v-else
          class="list-col"
        >
          <div
            class="market-banner"
            :class="marketTrend"
          >
            {{ marketNote }}
          </div>

          <div
            v-for="asset in INVESTMENT_ASSETS"
            :key="asset.id"
            class="shop-card"
          >
            <span class="item-emoji">{{ asset.emoji }}</span>
            <div class="item-body">
              <div class="item-top">
                <strong>{{ asset.name }}</strong>
                <span class="price-tag">
                  Giá: 💰 {{ getAssetPrice(asset, marketTrend) }} · Lãi +{{ asset.yearlyYield }}/năm
                </span>
              </div>
              <p class="item-desc">
                {{ asset.description }}
              </p>
              <div class="item-foot">
                <span class="lock-hint">
                  Đang nắm giữ: <strong>{{ getOwnedUnits(asset.id) }}</strong>
                  <template v-if="gameState.age < asset.unlockAge">
                    · 🔒 Mở tuổi {{ asset.unlockAge }}
                  </template>
                </span>
                <div class="pair-btns">
                  <button
                    type="button"
                    class="act-btn secondary"
                    :disabled="getOwnedUnits(asset.id) <= 0"
                    @click="emit('sell-asset', asset.id)"
                  >
                    Bán 1
                  </button>
                  <button
                    type="button"
                    class="act-btn"
                    :disabled="gameState.age < asset.unlockAge || gameState.stats.money < getAssetPrice(asset, marketTrend)"
                    @click="emit('buy-asset', asset.id)"
                  >
                    Mua 1
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="career-switch-box">
            <div class="cs-head">
              <strong>{{ isUnemployed ? '💼 Tìm Việc Mới / Chuyển Ngành' : '🔀 Chuyển Ngành Nghề' }}</strong>
              <small>
                {{
                  isUnemployed
                    ? 'Đang thất nghiệp: Ứng tuyển lại ngành cũ miễn phí (giữ 100% kỹ năng), đổi ngành phí 15'
                    : gameState.age < 28
                      ? 'Mở khóa từ tuổi 28'
                      : 'Phí: 💰 15 · Bảo lưu 70% kỹ năng hiện tại'
                }}
              </small>
            </div>
            <div class="cs-grid">
              <button
                v-for="career in availableCareers"
                :key="career.id"
                type="button"
                class="cs-btn"
                :disabled="isCareerActionDisabled(career.id)"
                @click="emit('switch-career', career.id)"
              >
                <span>{{ career.emoji }} {{ career.name }}</span>
                <small>
                  {{
                    isUnemployed && career.id === gameState.careerId
                      ? 'Ứng tuyển lại · Miễn phí'
                      : `Lương nền ${career.salary}`
                  }}
                </small>
              </button>
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
  max-width: 720px;
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.modal-head h3 {
  font-size: 1.08rem;
  font-weight: 800;
}

.cash-sub {
  font-size: 0.8rem;
  color: var(--text-dim);
  margin-top: 0.15rem;
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
  padding: 0.52rem 0.65rem;
  border-radius: 12px;
  border: 1px solid var(--outline);
  background: var(--bg-card);
  color: var(--text-dim);
  font-weight: 700;
  font-size: 0.8rem;
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
  gap: 0.65rem;
}

.shop-card {
  display: flex;
  gap: 0.75rem;
  padding: 0.8rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
}

.item-emoji {
  font-size: 1.65rem;
  line-height: 1;
  padding-top: 0.1rem;
}

.item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.item-top strong {
  font-size: 0.9rem;
}

.price-tag {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--warning);
}

.item-desc {
  font-size: 0.8rem;
  color: var(--text-dim);
  line-height: 1.45;
}

.item-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.2rem;
  flex-wrap: wrap;
}

.lock-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pair-btns {
  display: flex;
  gap: 0.4rem;
  margin-left: auto;
}

.act-btn {
  padding: 0.4rem 0.78rem;
  border-radius: 10px;
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--text-inverse);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: auto;
}

.act-btn.secondary {
  background: var(--bg-sidebar);
  border-color: var(--outline);
  color: var(--text);
}

.act-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.market-banner {
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-size: 0.8rem;
  font-weight: 700;
}

.market-banner.bull {
  border-color: var(--success);
  color: var(--success);
}

.market-banner.bear {
  border-color: var(--danger);
  color: var(--danger);
}

.career-switch-box {
  padding: 0.85rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px dashed var(--outline-strong);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.cs-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cs-head strong {
  font-size: 0.88rem;
}

.cs-head small {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.cs-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.cs-btn {
  padding: 0.55rem 0.68rem;
  border-radius: 11px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  cursor: pointer;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.cs-btn:hover:not(:disabled) {
  border-color: var(--primary);
}

.cs-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cs-btn small {
  font-size: 0.7rem;
  color: var(--text-dim);
  font-weight: 500;
}

@media (max-width: 560px) {
  .cs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
