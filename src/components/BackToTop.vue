<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const isVisible = ref(false)

function checkScroll() {
  isVisible.value = window.scrollY > 360
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <transition name="fade">
    <button
      v-if="isVisible"
      type="button"
      class="back-to-top"
      aria-label="Cuộn về đầu trang"
      title="Về đầu trang"
      @click="scrollToTop"
    >
      <span class="icon">↑</span>
    </button>
  </transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 1.75rem;
  right: 1.75rem;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--outline-strong);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 99;
  transition: var(--transition-normal);
  box-shadow: 0 8px 24px var(--primary-glow);
}

.back-to-top:hover {
  transform: translateY(-4px);
  background: var(--primary);
  color: var(--text-inverse);
}

.icon {
  font-size: 1.35rem;
  font-weight: 800;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.88);
}
</style>
