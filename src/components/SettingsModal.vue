<script setup lang="ts">
interface Props {
  modelValue: boolean
  userName: string
  userRole: string
  enableParticles: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'update:userName', val: string): void
  (e: 'update:userRole', val: string): void
  (e: 'update:enableParticles', val: boolean): void
  (e: 'clear-data'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="settings-modal"
    >
      <div
        class="overlay"
        @click="emit('update:modelValue', false)"
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
              Cá nhân hóa hồ sơ & hiệu năng giao diện Launcher
            </p>
          </div>
          <button
            type="button"
            class="close-btn"
            aria-label="Đóng cài đặt"
            @click="emit('update:modelValue', false)"
          >
            ✕
          </button>
        </header>

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
            <label for="ptSwitch">Hiệu ứng hạt tinh vân (Particles)</label>
            <span class="desc">Tắt nếu muốn tiết kiệm pin hoặc tăng độ mượt trên máy cấu hình thấp.</span>
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

        <section class="st-group danger-zone">
          <div class="st-info">
            <label>Đặt lại dữ liệu cá nhân</label>
            <span class="desc">Xóa danh sách ứng dụng đã ghim và lịch sử mở gần đây.</span>
          </div>
          <button
            type="button"
            class="btn-danger"
            @click="emit('clear-data')"
          >
            Xóa dữ liệu
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
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
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
  margin-bottom: 1.5rem;
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
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.st-group label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text);
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
  padding-top: 1.25rem;
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
  background: rgba(255, 85, 85, 0.22);
  border-color: var(--danger);
}
</style>
