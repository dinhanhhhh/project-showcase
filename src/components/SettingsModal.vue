<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { VIBE_THEMES, type VibeThemeId } from '@/composables/useHomeSettings'
import {
  buildBackupPayload,
  parseAndValidateBackup,
  restoreBackupPayload,
} from '@/utils/backup'

interface Props {
  modelValue: boolean
  userName: string
  userRole: string
  enableParticles: boolean
  theme?: VibeThemeId
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'cosmos',
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'update:userName', val: string): void
  (e: 'update:userRole', val: string): void
  (e: 'update:enableParticles', val: boolean): void
  (e: 'update:theme', val: VibeThemeId): void
  (e: 'clear-data'): void
  (e: 'data-restored'): void
}>()

const isConfirmingClear = ref(false)
const backupStatus = ref<{ kind: 'ok' | 'err'; text: string } | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
let clearConfirmTimer: ReturnType<typeof setTimeout> | null = null

function resetClearConfirm() {
  isConfirmingClear.value = false
  if (clearConfirmTimer) {
    clearTimeout(clearConfirmTimer)
    clearConfirmTimer = null
  }
}

function handleExportBackup() {
  const payload = buildBackupPayload(localStorage)
  const count = Object.keys(payload.entries).length
  const json = JSON.stringify(payload, null, 2)
  const dateStr = new Date().toISOString().slice(0, 10)

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `vibe-platform-backup-${dateStr}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)

  backupStatus.value = {
    kind: 'ok',
    text: `✅ Đã xuất ${count} mục dữ liệu.`,
  }
}

function triggerImportClick() {
  fileInputRef.value?.click()
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  try {
    const raw = await file.text()
    const parsed = parseAndValidateBackup(raw)
    if (!parsed.ok) {
      backupStatus.value = { kind: 'err', text: `⚠️ ${parsed.error}` }
      return
    }
    const restoredCount = restoreBackupPayload(localStorage, parsed.data)
    backupStatus.value = {
      kind: 'ok',
      text: `✅ Đã khôi phục ${restoredCount} mục — tải lại trang để áp dụng.`,
    }
    emit('data-restored')
  } catch {
    backupStatus.value = { kind: 'err', text: '⚠️ Không thể đọc tệp sao lưu.' }
  }
}

function closeModal() {
  resetClearConfirm()
  backupStatus.value = null
  emit('update:modelValue', false)
}

function handleClearClick() {
  if (!isConfirmingClear.value) {
    isConfirmingClear.value = true
    if (clearConfirmTimer) clearTimeout(clearConfirmTimer)
    clearConfirmTimer = setTimeout(() => {
      isConfirmingClear.value = false
      clearConfirmTimer = null
    }, 4000)
    return
  }

  resetClearConfirm()
  emit('clear-data')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    e.preventDefault()
    closeModal()
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      resetClearConfirm()
    }
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  resetClearConfirm()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="settings-modal"
    >
      <div
        class="overlay"
        @click="closeModal"
      />
      <div
        class="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <header class="modal-header">
          <div>
            <h2 id="settings-modal-title">
              ⚙️ Cài đặt hệ thống
            </h2>
            <p class="modal-sub">
              Tùy biến giao diện màu sắc, hồ sơ cá nhân &amp; hiệu năng
            </p>
          </div>
          <button
            type="button"
            class="close-btn"
            aria-label="Đóng cài đặt"
            @click="closeModal"
          >
            ✕
          </button>
        </header>

        <section class="st-group">
          <label>🎨 Chủ đề giao diện (Theme)</label>
          <div class="theme-grid">
            <button
              v-for="item in VIBE_THEMES"
              :key="item.id"
              type="button"
              class="theme-card"
              :class="{ active: theme === item.id }"
              @click="emit('update:theme', item.id)"
            >
              <div class="swatch-row">
                <span
                  v-for="(color, idx) in item.swatches"
                  :key="idx"
                  class="swatch-dot"
                  :style="{ backgroundColor: color }"
                />
              </div>
              <strong>{{ item.name }}</strong>
              <small>{{ item.tagline }}</small>
            </button>
          </div>
        </section>

        <section class="st-group">
          <label for="st-user-name">Tên hiển thị</label>
          <input
            id="st-user-name"
            :value="userName"
            type="text"
            placeholder="Nhập tên của bạn..."
            @input="emit('update:userName', ($event.target as HTMLInputElement).value)"
          >
        </section>

        <section class="st-group">
          <label for="st-user-role">Vai trò / Chức danh</label>
          <input
            id="st-user-role"
            :value="userRole"
            type="text"
            placeholder="Ví dụ: Frontend Engineer..."
            @input="emit('update:userRole', ($event.target as HTMLInputElement).value)"
          >
        </section>

        <section class="st-group st-row">
          <div class="st-info">
            <label for="ptSwitch">Hiệu ứng tinh vân (Constellation Particles)</label>
            <span class="desc">Tắt nếu muốn tiết kiệm pin hoặc tăng độ mượt trên máy yếu.</span>
          </div>
          <div class="st-switch">
            <input
              id="ptSwitch"
              :checked="enableParticles"
              type="checkbox"
              @change="emit('update:enableParticles', ($event.target as HTMLInputElement).checked)"
            >
            <label
              for="ptSwitch"
              class="toggle"
            />
          </div>
        </section>

        <section class="st-group backup-zone">
          <div class="st-info">
            <label>💾 Sao lưu &amp; Khôi phục dữ liệu</label>
            <span class="desc">Xuất hoặc nhập toàn bộ điểm cao, lịch sử và tiến trình game qua tệp JSON chuẩn Zod.</span>
          </div>
          <div class="backup-actions">
            <button
              type="button"
              class="btn-backup"
              @click="handleExportBackup"
            >
              ⬇️ Xuất sao lưu (.json)
            </button>
            <button
              type="button"
              class="btn-backup"
              @click="triggerImportClick"
            >
              ⬆️ Khôi phục (.json)
            </button>
            <input
              ref="fileInputRef"
              type="file"
              accept="application/json,.json"
              hidden
              aria-label="Chọn tệp sao lưu JSON"
              @change="handleImportFile"
            >
          </div>
          <p
            v-if="backupStatus"
            class="backup-status"
            :class="backupStatus.kind"
            role="status"
            aria-live="polite"
          >
            {{ backupStatus.text }}
          </p>
        </section>

        <section class="st-group danger-zone">
          <div class="st-info">
            <label>Đặt lại dữ liệu cá nhân</label>
            <span class="desc">Xóa danh sách ứng dụng đã ghim và lịch sử mở gần đây.</span>
          </div>
          <button
            type="button"
            class="btn-danger"
            :class="{ confirming: isConfirmingClear }"
            @click="handleClearClick"
          >
            {{ isConfirmingClear ? 'Bấm lại để xác nhận' : 'Xóa dữ liệu' }}
          </button>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.settings-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 9999;
  font-family: 'Inter', sans-serif;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(3, 8, 20, 0.72);
  backdrop-filter: blur(8px);
}

.modal-content {
  position: relative;
  background: var(--bg-modal);
  border: 1px solid var(--outline-strong);
  border-radius: 22px;
  width: 100%;
  max-width: 520px;
  max-height: 90dvh;
  overflow-y: auto;
  padding: 1.75rem;
  box-shadow: var(--shadow-card);
  color: var(--text);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.35rem;
}

.modal-header h2 {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
}

.modal-sub {
  margin-top: 0.25rem;
  font-size: 0.82rem;
  color: var(--text-dim);
}

.close-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 1rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.close-btn:hover {
  color: var(--text);
  border-color: var(--primary);
}

.st-group {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.st-group label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.theme-card {
  padding: 0.72rem 0.85rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1.5px solid var(--outline);
  color: var(--text);
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  transition: var(--transition-fast);
}

.theme-card:hover {
  border-color: var(--outline-strong);
}

.theme-card.active {
  border-color: var(--primary);
  background: var(--primary-soft);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

.swatch-row {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.2rem;
}

.swatch-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--outline);
}

.theme-card strong {
  font-family: 'Manrope', sans-serif;
  font-size: 0.88rem;
}

.theme-card small {
  font-size: 0.72rem;
  color: var(--text-dim);
  line-height: 1.35;
}

.desc {
  font-size: 0.78rem;
  color: var(--text-dim);
  line-height: 1.45;
}

.st-group input[type='text'] {
  background: var(--bg-input);
  border: 1px solid var(--outline);
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  color: var(--text);
  font-size: 0.92rem;
  outline: none;
  transition: var(--transition-fast);
}

.st-group input[type='text']:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.st-row {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
}

.st-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.st-switch {
  flex-shrink: 0;
}

.st-switch input {
  display: none;
}

.st-switch .toggle {
  display: inline-block;
  width: 46px;
  height: 26px;
  background: var(--bg-input);
  border-radius: 99px;
  position: relative;
  cursor: pointer;
  border: 1px solid var(--outline);
  transition: var(--transition-normal);
}

.st-switch .toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: var(--text-dim);
  border-radius: 50%;
  transition: var(--transition-normal);
}

.st-switch input:checked + .toggle {
  background: var(--primary);
  border-color: var(--primary);
}

.st-switch input:checked + .toggle::after {
  left: calc(100% - 3px);
  transform: translateX(-100%);
  background: var(--text-inverse);
}

.danger-zone {
  border-top: 1px solid var(--outline);
  padding-top: 1.2rem;
  margin-bottom: 0;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.btn-danger {
  flex-shrink: 0;
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  padding: 0.65rem 1.05rem;
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition-fast);
  font-weight: 700;
  font-size: 0.85rem;
}

.btn-danger:hover {
  background: var(--danger-bg);
  border-color: var(--danger);
}

.btn-danger.confirming {
  background: var(--danger);
  color: var(--text-inverse);
  border-color: var(--danger);
}

@media (max-width: 480px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }
}

.backup-zone {
  border-top: 1px solid var(--outline);
  padding-top: 1.15rem;
}

.backup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.btn-backup {
  flex: 1 1 160px;
  padding: 0.62rem 0.9rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-backup:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.backup-status {
  font-size: 0.8rem;
  font-weight: 600;
}

.backup-status.ok {
  color: var(--primary);
}

.backup-status.err {
  color: var(--danger);
}
</style>
