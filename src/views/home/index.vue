<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { usePagesStore } from '@/stores/usePagesStore'
import { RouterLink } from 'vue-router'
import { useHomeSettings } from '@/composables/useHomeSettings'
import { useParticlesBackground } from '@/composables/useParticlesBackground'
import AppSidebar from '@/components/AppSidebar.vue'
import SettingsModal from '@/components/SettingsModal.vue'

const store = usePagesStore()
const searchQuery = ref('')
const selectedCategory = ref('all')
const onlyShowFavorites = ref(false)

const {
  userName,
  userRole,
  enableParticles,
  isSidebarCollapsed,
  isSettingsOpen,
  toggleSidebar,
} = useHomeSettings()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { init: initParticles } = useParticlesBackground(canvasRef, enableParticles)

function setView(view: 'home' | 'favorites' | 'categories') {
  if (view === 'home') {
    onlyShowFavorites.value = false
    selectedCategory.value = 'all'
    searchQuery.value = ''
  } else if (view === 'favorites') {
    onlyShowFavorites.value = true
  } else {
    onlyShowFavorites.value = false
    document.querySelector('.search-wrap')?.scrollIntoView({ behavior: 'smooth' })
  }
}

function handleClearData() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu yêu thích và lịch sử?')) {
    store.clearUserData()
  }
}

const filteredPages = computed(() => {
  let list = store.pages
  if (onlyShowFavorites.value) {
    list = list.filter((p) => store.isFavorite(p.slug))
  }
  return list.filter((page) => {
    const matchesQuery =
      page.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory =
      selectedCategory.value === 'all' || page.category === selectedCategory.value
    return matchesQuery && matchesCategory
  })
})

const categories = computed(() => {
  const cats = new Set(store.pages.map((p) => p.category))
  return ['all', ...Array.from(cats)]
})

onMounted(() => {
  if (store.pages.length === 0) {
    void store.loadPages()
  }
  initParticles()
})
</script>

<template>
  <div class="vibe-layout">
    <canvas
      ref="canvasRef"
      class="nebula-canvas"
    />

    <!-- Sidebar -->
    <AppSidebar
      :is-sidebar-collapsed="isSidebarCollapsed"
      :user-name="userName"
      :user-role="userRole"
      :only-show-favorites="onlyShowFavorites"
      :selected-category="selectedCategory"
      :search-query="searchQuery"
      @toggle-sidebar="toggleSidebar"
      @open-settings="isSettingsOpen = true"
      @set-view="setView"
    />

    <!-- Main Content -->
    <main class="content-hub">
      <header class="hub-header">
        <div class="header-text">
          <h1 class="display-title">
            Kiến tạo <span class="text-glow">thực tại số</span> của bạn.
          </h1>
          <p class="body-text">
            Truy cập các ứng dụng mini hiệu năng cao từ một trung tâm đắm chìm duy nhất.
          </p>
        </div>

        <div class="search-wrap">
          <div class="search-box">
            <span class="s-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm ứng dụng..."
            >
          </div>
          <div class="filter-box">
            <select v-model="selectedCategory">
              <option
                v-for="cat in categories"
                :key="cat"
                :value="cat"
              >
                {{ cat === 'all' ? 'Tất cả' : (cat === 'game' ? 'Trò chơi' : (cat === 'creative' ? 'Sáng tạo' : cat)) }}
              </option>
            </select>
          </div>
        </div>
      </header>

      <!-- App Grid -->
      <section class="app-section">
        <h2 class="section-label">
          {{ onlyShowFavorites ? 'Ứng dụng yêu thích' : 'Vừa thêm gần đây' }}
        </h2>
        <div
          v-if="filteredPages.length > 0"
          class="app-grid"
        >
          <RouterLink 
            v-for="page in filteredPages" 
            :key="page.slug" 
            :to="page.path"
            class="app-card"
          >
            <div class="card-glow" />
            <div class="card-content">
              <div class="card-body">
                <div class="app-header">
                  <div class="app-icon">
                    {{ page.name.charAt(0) }}
                  </div>
                  <div class="app-category">
                    {{ page.category }}
                  </div>
                </div>
                <h3 class="app-name">
                  {{ page.name }}
                </h3>
                <p class="app-desc">
                  {{ page.description }}
                </p>
              </div>
              <div class="card-footer">
                <span class="launch-btn">Khởi chạy</span>
                <button
                  class="fav-btn"
                  @click.prevent="store.toggleFavorite(page.slug)"
                >
                  {{ store.isFavorite(page.slug) ? '★' : '☆' }}
                </button>
              </div>
            </div>
          </RouterLink>
        </div>

        <div
          v-else
          class="empty-state"
        >
          <div class="empty-icon">
            🕳️
          </div>
          <p>Không tìm thấy ứng dụng nào khớp với tiêu chí của bạn.</p>
        </div>
      </section>

      <!-- History / Favorites side by side -->
      <div class="secondary-grid">
        <section class="mini-panel">
          <h3>Yêu thích đã ghim</h3>
          <div
            v-if="store.favoritePages.length"
            class="mini-list"
          >
            <RouterLink
              v-for="p in store.favoritePages"
              :key="p.slug"
              :to="p.path"
              class="mini-item"
            >
              <span>{{ p.name }}</span>
              <span class="m-icon">↗</span>
            </RouterLink>
          </div>
          <p
            v-else
            class="dim-text"
          >
            Thêm ứng dụng vào mục yêu thích để truy cập nhanh.
          </p>
        </section>

        <section class="mini-panel">
          <h3>Hoạt động gần đây</h3>
          <div
            v-if="store.recentlyViewedPages.length"
            class="mini-list"
          >
            <RouterLink
              v-for="p in store.recentlyViewedPages"
              :key="p.slug"
              :to="p.path"
              class="mini-item"
            >
              <span>{{ p.name }}</span>
              <span class="m-icon">⌚</span>
            </RouterLink>
          </div>
          <p
            v-else
            class="dim-text"
          >
            Các ứng dụng gần đây của bạn sẽ xuất hiện ở đây.
          </p>
        </section>
      </div>
    </main>

    <!-- Settings Modal -->
    <SettingsModal
      v-model="isSettingsOpen"
      :user-name="userName"
      :user-role="userRole"
      :enable-particles="enableParticles"
      @update:user-name="userName = $event"
      @update:user-role="userRole = $event"
      @update:enable-particles="enableParticles = $event"
      @clear-data="handleClearData"
    />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@700;800&display=swap');

.vibe-layout {
  display: flex;
  width: 100%;
  min-height: 100vh; /* Thay đổi từ height: 100vh */
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  position: relative;
}

.nebula-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* Content Hub */
.content-hub {
  flex: 1;
  padding: 3rem 4rem;
  position: relative;
  z-index: 1;
}

.hub-header {
  margin-bottom: 4rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.display-title {
  font-family: 'Manrope', sans-serif;
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  max-width: 600px;
  margin-bottom: 1rem;
}

.text-glow {
  color: var(--primary);
  text-shadow: 0 0 30px var(--primary-glow);
}

.body-text {
  color: var(--text-dim);
  font-size: 1.2rem;
}

.search-wrap {
  display: flex;
  gap: 1rem;
}

.search-box {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  padding: 0.8rem 1.5rem;
  border-radius: 99px;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1; /* Thay đổi từ width cố định sang flex: 1 */
  min-width: 200px;
}

.search-box input {
  background: none;
  border: none;
  color: white;
  width: 100%;
  outline: none;
}

.filter-box select {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  padding: 0.8rem 1.5rem;
  border-radius: 99px;
  color: var(--text-dim);
  outline: none;
  width: 100%; /* Đảm bảo chiếm hết ngang trên mobile */
}

/* App Grid */
.app-section {
  margin-bottom: 4rem;
}

.section-label {
  font-family: 'Manrope', sans-serif;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 0.8rem;
  color: var(--text-dim);
  margin-bottom: 2rem;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.app-card {
  position: relative;
  background: var(--bg-card);
  border-radius: 20px;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--outline);
  display: flex;
  flex-direction: column;
}

.app-card:hover {
  transform: translateY(-8px);
  border-color: var(--primary);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, var(--primary-glow) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.app-card:hover .card-glow {
  opacity: 0.15;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.app-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.app-category {
  font-size: 0.7rem;
  background: rgba(109, 221, 255, 0.1);
  color: var(--primary);
  padding: 0.3rem 0.6rem;
  border-radius: 99px;
  text-transform: uppercase;
  font-weight: 600;
}

.app-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.4rem;
  margin-bottom: 0.8rem;
}

.app-desc {
  color: var(--text-dim);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.card-body {
  flex-grow: 1; /* Đẩy footer xuống dưới */
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem; /* Khoảng cách tối thiểu với mô tả */
}

.launch-btn {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
}

.fav-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 1.2rem;
  cursor: pointer;
}

.fav-btn:hover { color: var(--accent); }

/* Secondary Grid */
.secondary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.mini-panel {
  background: var(--bg-sidebar);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid var(--outline);
}

.mini-panel h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.mini-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.mini-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-dim);
  transition: all 0.2s ease;
}

.mini-item:hover {
  background: rgba(109, 221, 255, 0.05);
  color: var(--primary);
  transform: translateX(5px);
}

.dim-text {
  color: var(--text-dim);
  font-size: 0.9rem;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 24px;
  border: 2px dashed var(--outline);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--bg-card); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--outline); }

@media (max-width: 1200px) {
  .display-title { font-size: 2.5rem; }
  .hub-header { flex-direction: column; align-items: flex-start; gap: 2rem; }
}

@media (max-width: 768px) {
  .sidebar { display: none; }
  .content-hub { padding: 1.5rem; }
  .secondary-grid { grid-template-columns: 1fr; }
  
  .display-title { font-size: 2.2rem; }
  
  .search-wrap {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  
  .search-box {
    width: 100%;
  }

  .hub-header {
    margin-bottom: 2rem;
  }
}
</style>
