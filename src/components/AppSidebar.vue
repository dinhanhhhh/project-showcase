<script setup lang="ts">

interface Props {
  isSidebarCollapsed: boolean
  userName: string
  userRole: string
  onlyShowFavorites: boolean
  selectedCategory: string
  searchQuery: string
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
  (e: 'open-settings'): void
  (e: 'set-view', view: 'home' | 'favorites' | 'categories'): void
}>()
</script>

<template>
  <aside
    class="sidebar"
    :class="{ collapsed: isSidebarCollapsed }"
  >
    <div class="logo-area">
      <div class="v-logo">
        V
      </div>
      <div
        v-if="!isSidebarCollapsed"
        class="v-brand"
      >
        <span class="brand-name">Vibe</span>
        <span class="brand-tag">Platform</span>
      </div>
    </div>

    <nav class="side-nav">
      <a
        href="javascript:void(0)"
        class="nav-item"
        :class="{ active: !onlyShowFavorites && selectedCategory === 'all' && !searchQuery }"
        :data-tooltip="isSidebarCollapsed ? 'Trang chủ' : undefined"
        @click="emit('set-view', 'home')"
      >
        <span class="icon">🏠</span>
        <span
          v-if="!isSidebarCollapsed"
          class="label"
        >Trang chủ</span>
      </a>
      <a
        href="javascript:void(0)"
        class="nav-item"
        :data-tooltip="isSidebarCollapsed ? 'Danh mục' : undefined"
        @click="emit('set-view', 'categories')"
      >
        <span class="icon">🔍</span>
        <span
          v-if="!isSidebarCollapsed"
          class="label"
        >Danh mục</span>
      </a>
      <a
        href="javascript:void(0)"
        class="nav-item"
        :class="{ active: onlyShowFavorites }"
        :data-tooltip="isSidebarCollapsed ? 'Yêu thích' : undefined"
        @click="emit('set-view', 'favorites')"
      >
        <span class="icon">⭐</span>
        <span
          v-if="!isSidebarCollapsed"
          class="label"
        >Yêu thích</span>
      </a>
      <a
        href="javascript:void(0)"
        class="nav-item"
        :data-tooltip="isSidebarCollapsed ? 'Cài đặt' : undefined"
        @click="emit('open-settings')"
      >
        <span class="icon">⚙️</span>
        <span
          v-if="!isSidebarCollapsed"
          class="label"
        >Cài đặt</span>
      </a>
    </nav>

    <button
      class="collapse-trigger"
      :data-tooltip="isSidebarCollapsed ? 'Mở rộng' : 'Thu nhỏ'"
      @click="emit('toggle-sidebar')"
    >
      <span class="t-icon">
        <svg
          v-if="isSidebarCollapsed"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><path d="m9 18 6-6-6-6" /></svg>
        <svg
          v-else
          width="20"
          height="20"
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
      >Thu nhỏ thanh bên</span>
    </button>

    <div
      class="user-profile"
      :data-tooltip="isSidebarCollapsed ? userName : undefined"
      style="cursor: pointer;"
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
    </div>
  </aside>
</template>

<style scoped>
/* === SIDEBAR — Self-contained styles === */
.sidebar {
  width: 260px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--outline);
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  z-index: 10;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease;
}

.sidebar.collapsed {
  width: 80px;
  padding: 2rem 1rem;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
  position: relative;
}

.sidebar.collapsed .logo-area {
  justify-content: center;
}

.v-logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  color: #060e20;
}

.brand-name {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  line-height: 1;
}

.brand-tag {
  font-size: 0.75rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.side-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  color: var(--text-dim);
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.8rem 0;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
}

.nav-item.active {
  background: rgba(109, 221, 255, 0.1);
  color: var(--primary);
}

/* Collapse Trigger */
.collapse-trigger {
  margin-top: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--outline);
  border-radius: 12px;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.sidebar.collapsed .collapse-trigger {
  justify-content: center;
  padding: 0.8rem 0;
  border-color: transparent;
  background: none;
}

.collapse-trigger:hover {
  background: rgba(109, 221, 255, 0.1);
  color: var(--primary);
  border-color: var(--primary-glow);
}

.collapse-trigger .t-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.collapse-trigger .label {
  font-size: 0.85rem;
  font-weight: 500;
}

/* Tooltips */
[data-tooltip] {
  position: relative;
}

[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%) translateX(10px);
  padding: 0.5rem 0.8rem;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  border-radius: 8px;
  color: white;
  font-size: 0.8rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 100;
}

[data-tooltip]:hover::before {
  opacity: 1;
  transform: translateY(-50%) translateX(20px);
}

/* User Profile */
.user-profile {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid var(--outline);
}

.sidebar.collapsed .user-profile {
  justify-content: center;
}

.avatar {
  width: 40px;
  height: 40px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
}

.u-name { font-weight: 600; font-size: 0.9rem; }
.u-role { font-size: 0.75rem; color: var(--text-dim); }

@media (max-width: 768px) {
  .sidebar { display: none; }
}
</style>
