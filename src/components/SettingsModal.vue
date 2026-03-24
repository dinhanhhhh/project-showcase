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
      <div class="modal-content">
        <header class="modal-header">
          <h2>Cài đặt hệ thống</h2>
          <button
            class="close-btn"
            @click="emit('update:modelValue', false)"
          >
            ✕
          </button>
        </header>

        <section class="st-group">
          <label>Tên hiển thị</label>
          <input
            :value="userName"
            type="text"
            placeholder="Nhập tên..."
            @input="emit('update:userName', ($event.target as HTMLInputElement).value)"
          >
        </section>

        <section class="st-group">
          <label>Vai trò</label>
          <input
            :value="userRole"
            type="text"
            placeholder="Nhập vai trò..."
            @input="emit('update:userRole', ($event.target as HTMLInputElement).value)"
          >
        </section>

        <section class="st-group st-row">
          <div class="st-info">
            <label>Hiệu ứng nền (Particles)</label>
            <span class="desc">Tắt nếu máy bạn bị giật/lag.</span>
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
            <label>Xóa dữ liệu</label>
            <span class="desc">Gỡ ghim ứng dụng yêu thích và lịch sử.</span>
          </div>
          <button
            class="btn-danger"
            @click="emit('clear-data')"
          >
            Xóa
          </button>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* === SETTINGS MODAL — Self-contained styles === */
.settings-modal {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
  font-family: 'Inter', sans-serif;
}

.overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
}

.modal-content {
  position: relative;
  background: #091328;
  border: 1px solid rgba(109, 117, 140, 0.2);
  border-radius: 16px;
  width: 90%; max-width: 480px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  color: #dee5ff;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: 1.5rem;
}

.close-btn {
  background: none; border: none;
  color: #a3aac4; font-size: 1.2rem; cursor: pointer;
}
.close-btn:hover { color: white; }

.st-group {
  margin-bottom: 1.5rem;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.st-group label { font-size: 0.9rem; font-weight: 500; }
.desc { font-size: 0.8rem; color: #a3aac4; }

.st-group input[type="text"] {
  background: #141f38;
  border: 1px solid rgba(109, 117, 140, 0.2);
  padding: 0.8rem;
  border-radius: 8px;
  color: white;
  outline: none;
  transition: border-color 0.2s;
}
.st-group input[type="text"]:focus {
  border-color: #6dddff;
}

.st-row {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.st-info { display: flex; flex-direction: column; }

/* Toggle Switch */
.st-switch input { display: none; }
.st-switch .toggle {
  display: inline-block; width: 44px; height: 24px;
  background: #141f38;
  border-radius: 99px; position: relative; cursor: pointer;
  border: 1px solid rgba(109, 117, 140, 0.2);
  transition: all 0.3s ease;
}
.st-switch .toggle::after {
  content: ""; position: absolute;
  top: 2px; left: 2px; width: 18px; height: 18px;
  background: #a3aac4; border-radius: 50%;
  transition: all 0.3s ease;
}
.st-switch input:checked + .toggle {
  background: #6dddff;
  border-color: #6dddff;
}
.st-switch input:checked + .toggle::after {
  left: calc(100% - 2px);
  transform: translateX(-100%);
  background: #000;
}

.danger-zone {
  border-top: 1px solid rgba(109, 117, 140, 0.2);
  padding-top: 1.5rem;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.btn-danger {
  background: rgba(255, 60, 60, 0.1);
  color: #ff5555;
  border: 1px solid rgba(255, 60, 60, 0.3);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}
.btn-danger:hover {
  background: rgba(255, 60, 60, 0.2);
  border-color: rgba(255, 60, 60, 0.5);
}
</style>
