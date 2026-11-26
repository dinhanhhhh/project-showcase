<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

interface Props {
  title: string
  subtitle?: string
  src: string
  badge?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  badge: 'Static App',
})

const containerRef = ref<HTMLElement | null>(null)
const iframeKey = ref(0)
const isLoaded = ref(false)
const isFullscreen = ref(false)
const isTheaterMode = ref(false)

function handleReload() {
  isLoaded.value = false
  iframeKey.value += 1
}

function handleLoad() {
  isLoaded.value = true
}

function openQuickSwitcher() {
  window.dispatchEvent(new CustomEvent('vibe:open-palette'))
}

async function toggleFullscreen() {
  const el = containerRef.value
  if (!el) return

  try {
    if (!document.fullscreenElement) {
      await el.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch {
    // Trình duyệt có thể chặn fullscreen trong một số ngữ cảnh
  }
}

function onFullscreenChange() {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div
    ref="containerRef"
    class="embed-shell"
    :class="{ theater: isTheaterMode }"
  >
    <header
      v-if="!isTheaterMode"
      class="embed-topbar"
    >
      <div class="topbar-left">
        <RouterLink
          to="/"
          class="back-btn"
        >
          ← Launcher
        </RouterLink>
        <div class="title-group">
          <h1 class="app-title">
            {{ props.title }}
          </h1>
          <span
            v-if="props.subtitle"
            class="app-subtitle"
          >
            {{ props.subtitle }}
          </span>
        </div>
        <span class="embed-badge">{{ props.badge }}</span>
      </div>

      <div class="topbar-actions">
        <button
          type="button"
          class="tool-btn"
          title="Chuyển nhanh ứng dụng (Ctrl+K)"
          @click="openQuickSwitcher"
        >
          ⌘ <span class="btn-label">Chuyển app</span>
        </button>
        <button
          type="button"
          class="tool-btn"
          title="Ẩn thanh trên để chơi rộng hơn"
          @click="isTheaterMode = true"
        >
          🎬 <span class="btn-label">Rộng khung</span>
        </button>
        <button
          type="button"
          class="tool-btn"
          title="Tải lại ứng dụng"
          @click="handleReload"
        >
          🔄 <span class="btn-label">Tải lại</span>
        </button>
        <button
          type="button"
          class="tool-btn"
          :title="isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'"
          @click="toggleFullscreen"
        >
          {{ isFullscreen ? '🗗' : '⛶' }}
          <span class="btn-label">{{ isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình' }}</span>
        </button>
        <a
          :href="props.src"
          target="_blank"
          rel="noopener noreferrer"
          class="tool-btn"
          title="Mở ở tab mới"
        >
          ↗ <span class="btn-label">Tab mới</span>
        </a>
      </div>
    </header>

    <div class="embed-stage">
      <button
        v-if="isTheaterMode"
        type="button"
        class="exit-theater-pill"
        title="Hiện lại thanh điều khiển"
        @click="isTheaterMode = false"
      >
        ↓ Hiện thanh điều khiển
      </button>

      <div
        v-if="!isLoaded"
        class="embed-loader"
      >
        <div class="loader-spinner" />
        <p>Đang khởi chạy {{ props.title }}...</p>
      </div>

      <iframe
        :key="iframeKey"
        :src="props.src"
        :title="props.title"
        class="embed-iframe"
        allow="autoplay; fullscreen"
        @load="handleLoad"
      />
    </div>
  </div>
</template>

<style scoped>
.embed-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100dvh;
  min-height: 0;
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
}

.embed-topbar {
  height: 54px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0 1rem;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--outline);
  backdrop-filter: blur(12px);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.back-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--primary);
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 700;
  transition: var(--transition-fast);
}

.back-btn:hover {
  border-color: var(--primary);
  box-shadow: 0 0 12px var(--primary-glow);
}

.title-group {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
}

.app-title {
  font-family: 'Manrope', sans-serif;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-subtitle {
  font-size: 0.78rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.embed-badge {
  flex-shrink: 0;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--accent-glow);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.38rem 0.68rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition-fast);
}

.tool-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.embed-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  background: var(--bg);
}

.exit-theater-pill {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: var(--surface-glass);
  border: 1px solid var(--outline-strong);
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.exit-theater-pill:hover {
  opacity: 1;
  transform: translateX(-50%) translateY(2px);
}

.embed-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}

.embed-loader {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  background: var(--bg);
  color: var(--text-dim);
  font-size: 0.95rem;
}

.loader-spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid var(--outline);
  border-top-color: var(--primary);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .app-subtitle,
  .embed-badge,
  .btn-label {
    display: none;
  }

  .tool-btn {
    padding: 0.38rem 0.55rem;
  }
}
</style>
