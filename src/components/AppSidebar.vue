<script setup lang="ts">
import { VIBE_THEMES, type VibeThemeId } from '@/composables/useHomeSettings'

interface Props {
  isSidebarCollapsed: boolean
  userName: string
  userRole: string
  onlyShowFavorites: boolean
  selectedCategory: string
  searchQuery: string
  totalApps?: number
  favoriteCount?: number
  theme?: VibeThemeId
}

const props = withDefaults(defineProps<Props>(), {
  totalApps: 0,
  favoriteCount: 0,
  theme: 'cosmos',
})

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
  (e: 'open-settings'): void
  (e: 'set-view', view: 'home' | 'favorites' | 'categories'): void
  (e: 'update:theme', val: VibeThemeId): void
}>()

function openPalette() {
  window.dispatchEvent(new CustomEvent('vibe:open-palette'))
}

function cycleTheme() {
  const idx = VIBE_THEMES.findIndex((t) => t.id === props.theme)
  const next = VIBE_THEMES[(idx + 1) % VIBE_THEMES.length]
  emit('update:theme', next.id)
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{ collapsed: isSidebarCollapsed }"
  >
    <div class="logo-area">
      <div class="v-logo">
        <span>V</span>
      </div>
      <div
        v-if="!isSidebarCollapsed"
        class="v-brand"
      >
        <div class="brand-row">
          <span class="brand-name">Vibe</span>
          <span class="brand-version">v3.0</span>
        </div>
        <span class="brand-tag">Digital Curator</span>
      </div>
    </div>

    <!-- Nút mở nhanh Command Palette -->
    <button
      type="button"
      class="palette-trigger"
      aria-label="Tìm kiếm nhanh ứng dụng (Ctrl+K)"
      :data-tooltip="isSidebarCollapsed ? 'Tìm nhanh (Ctrl+K)' : undefined"
      @click="openPalette"
    >
      <span class="p-sym">⌘</span>
      <span
        v-if="!isSidebarCollapsed"
        class="p-text"
      >Nhảy nhanh...</span>
      <kbd
        v-if="!isSidebarCollapsed"
        class="p-kbd"
      >Ctrl K</kbd>
    </button>

    <div
      v-if="!isSidebarCollapsed"
      class="nav-section-title"
    >
      ĐIỀU HƯỚNG
    </div>

    <nav class="side-nav">
      <button
        type="button"
        class="nav-item"
        aria-label="Trang chủ"
        :class="{ active: !onlyShowFavorites && selectedCategory === 'all' && !searchQuery }"
        :data-tooltip="isSidebarCollapsed ? 'Trang chủ' : undefined"
        @click="emit('set-view', 'home')"
      >
        <span class="icon">🏠</span>
        <span
          v-if="!isSidebarCollapsed"
          class="label"
        >Trang chủ</span>
        <span
          v-if="!isSidebarCollapsed && totalApps > 0"
          class="nav-badge"
        >{{ totalApps }}</span>
      </button>

      <button
        type="button"
        class="nav-item"
        aria-label="Khám phá danh mục"
        :class="{ active: !onlyShowFavorites && selectedCategory !== 'all' }"
        :data-tooltip="isSidebarCollapsed ? 'Khám phá danh mục' : undefined"
        @click="emit('set-view', 'categories')"
      >
        <span class="icon">🧭</span>
        <span
          v-if="!isSidebarCollapsed"
          class="label"
        >Danh mục</span>
      </button>

      <button
        type="button"
        class="nav-item"
        aria-label="Ứng dụng yêu thích"
        :class="{ active: onlyShowFavorites }"
        :data-tooltip="isSidebarCollapsed ? 'Đã ghim yêu thích' : undefined"
        @click="emit('set-view', 'favorites')"
      >
        <span class="icon">⭐</span>
        <span
          v-if="!isSidebarCollapsed"
          class="label"
        >Yêu thích</span>
        <span
          v-if="!isSidebarCollapsed && favoriteCount > 0"
          class="nav-badge accent"
        >{{ favoriteCount }}</span>
      </button>

      <button
        type="button"
        class="nav-item"
        aria-label="Đổi chủ đề màu"
        :data-tooltip="isSidebarCollapsed ? 'Đổi chủ đề màu' : undefined"
        @click="cycleTheme"
      >
        <span class="icon">🎨</span>
        <span
          v-if="!isSidebarCollapsed"
          class="label"
        >Đổi Theme</span>
      </button>

      <button
        type="button"
        class="nav-item"
        aria-label="Mở cài đặt hệ thống"
        :data-tooltip="isSidebarCollapsed ? 'Cài đặt hệ thống' : undefined"
        @click="emit('open-settings')"
      >
        <span class="icon">⚙️</span>
        <span
          v-if="!isSidebarCollapsed"
          class="label"
        >Cài đặt</span>
      </button>
    </nav>

    <button
      type="button"
      class="collapse-trigger"
      :aria-label="isSidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'"
      :data-tooltip="isSidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn'"
      @click="emit('toggle-sidebar')"
    >
      <span class="t-icon">
        <svg
          v-if="isSidebarCollapsed"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><path d="m9 18 6-6-6-6" /></svg>
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><path d="m15 18-6-6 6-6" /></svg>
      </span>
      <span
        v-if="!isSidebarCollapsed"
        class="label"
      >Thu gọn thanh bên</span>
    </button>

    <button
      type="button"
      class="user-profile"
      :aria-label="`Hồ sơ cá nhân (${userName}) — mở cài đặt`"
      :data-tooltip="isSidebarCollapsed ? userName : undefined"
      @click="emit('open-settings')"
    >
      <div class="avatar">
        {{ userName.substring(0, 2).toUpperCase() }}
      </div>
      <div
        v-if="!isSidebarCollapsed"
        class="user-info"
      >
        <div class="u-name">
          {{ userName }}
        </div>
        <div class="u-role">
          {{ userRole }}
        </div>
      </div>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 268px;
  flex-shrink: 0;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--outline);
  display: flex;
  flex-direction: column;
  padding: 1.6rem 1.2rem;
  z-index: 10;
  position: sticky;
  top: 0;
  height: 100dvh;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease;
}

.sidebar.collapsed {
  width: 82px;
  padding: 1.6rem 0.85rem;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.4rem;
  padding: 0 0.35rem;
}

.sidebar.collapsed .logo-area {
  justify-content: center;
  padding: 0;
}

.v-logo {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.45rem;
  color: var(--text-inverse);
  box-shadow: 0 8px 20px var(--primary-glow);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.brand-name {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.25rem;
  line-height: 1.1;
  color: var(--text);
}

.brand-version {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.42rem;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  border: 1px solid var(--outline-strong);
}

.brand-tag {
  display: block;
  margin-top: 0.18rem;
  font-size: 0.7rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1.6px;
}

.palette-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  margin-bottom: 1.35rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  cursor: pointer;
  font-size: 0.85rem;
  transition: var(--transition-fast);
}

.sidebar.collapsed .palette-trigger {
  justify-content: center;
  padding: 0.65rem 0;
}

.palette-trigger:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.p-sym {
  font-weight: 800;
  color: var(--primary);
}

.p-text {
  flex: 1;
  text-align: left;
}

.p-kbd {
  padding: 0.12rem 0.42rem;
  border-radius: 6px;
  background: var(--bg-input);
  border: 1px solid var(--outline);
  font-size: 0.68rem;
  font-family: monospace;
  color: var(--text-dim);
}

.nav-section-title {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1.8px;
  color: var(--text-muted);
  padding: 0 0.75rem;
  margin-bottom: 0.5rem;
}

.side-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.74rem 0.9rem;
  border-radius: 12px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-dim);
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
  text-align: left;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.74rem 0;
}

.nav-item:hover {
  background: var(--bg-card-hover);
  color: var(--text);
}

.nav-item.active {
  background: var(--primary-soft);
  border-color: var(--outline-strong);
  color: var(--primary);
  font-weight: 600;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  left: -1px;
  top: 22%;
  bottom: 22%;
  width: 3px;
  border-radius: 0 4px 4px 0;
  background: var(--primary);
  box-shadow: 0 0 10px var(--primary);
}

.nav-badge {
  margin-left: auto;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--bg-elevated);
  color: var(--text);
}

.nav-badge.accent {
  background: var(--accent-soft);
  color: var(--accent);
}

.collapse-trigger {
  margin-top: 0.75rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 12px;
  color: var(--text-dim);
  cursor: pointer;
  transition: var(--transition-fast);
  width: 100%;
}

.sidebar.collapsed .collapse-trigger {
  justify-content: center;
  padding: 0.7rem 0;
}

.collapse-trigger:hover {
  background: var(--primary-soft);
  color: var(--primary);
  border-color: var(--outline-strong);
}

.collapse-trigger .t-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-trigger .label {
  font-size: 0.84rem;
  font-weight: 500;
}

[data-tooltip] {
  position: relative;
}

[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%) translateX(8px);
  padding: 0.45rem 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--outline-strong);
  border-radius: 8px;
  color: var(--text);
  font-size: 0.78rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: var(--transition-fast);
  z-index: 100;
}

[data-tooltip]:hover::before {
  opacity: 1;
  transform: translateY(-50%) translateX(14px);
}

.user-profile {
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.72rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  cursor: pointer;
  transition: var(--transition-fast);
  text-align: left;
}

.user-profile:hover {
  border-color: var(--outline-strong);
}

.sidebar.collapsed .user-profile {
  justify-content: center;
  padding: 0.55rem;
}

.avatar {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  background: var(--primary-soft);
  border: 1px solid var(--outline-strong);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--primary);
}

.user-info {
  min-width: 0;
}

.u-name {
  font-weight: 600;
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.u-role {
  font-size: 0.74rem;
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
