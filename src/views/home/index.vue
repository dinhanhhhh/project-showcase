<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { usePagesStore } from '@/stores/usePagesStore'
import { RouterLink } from 'vue-router'

const store = usePagesStore()
const searchQuery = ref('')
const selectedCategory = ref('all')
const isSidebarCollapsed = ref(false)
const onlyShowFavorites = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  localStorage.setItem('vibe:sidebar-collapsed', JSON.stringify(isSidebarCollapsed.value))
}

const setView = (view: string) => {
  if (view === 'home') {
    onlyShowFavorites.value = false
    selectedCategory.value = 'all'
    searchQuery.value = ''
  } else if (view === 'favorites') {
    onlyShowFavorites.value = true
  } else if (view === 'categories') {
    onlyShowFavorites.value = false
    // Scroll to filter area
    document.querySelector('.search-wrap')?.scrollIntoView({ behavior: 'smooth' })
  }
}

// Particles Background (Digital Curator style)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number

const initParticles = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let particles: any[] = []
  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.3 + 0.1,
    })
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach((p) => {
      p.x += p.dx
      p.y += p.dy
      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(109, 221, 255, ${p.alpha})`
      ctx.fill()
    })
    animationFrameId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => {
  const savedCollapsed = localStorage.getItem('vibe:sidebar-collapsed')
  if (savedCollapsed !== null) {
    isSidebarCollapsed.value = JSON.parse(savedCollapsed)
  }

  if (store.pages.length === 0) {
    void store.loadPages()
  }
  initParticles()
})

const filteredPages = computed(() => {
  let list = store.pages
  
  if (onlyShowFavorites.value) {
    list = list.filter(p => store.isFavorite(p.slug))
  }

  return list.filter(page => {
    const matchesQuery = page.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                         page.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || page.category === selectedCategory.value
    return matchesQuery && matchesCategory
  })
})

const categories = computed(() => {
  const cats = new Set(store.pages.map(p => p.category))
  return ['all', ...Array.from(cats)]
})
</script>

<template>
  <div class="vibe-layout">
    <canvas ref="canvasRef" class="nebula-canvas"></canvas>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="logo-area">
        <div class="v-logo">V</div>
        <div class="v-brand" v-if="!isSidebarCollapsed">
          <span class="brand-name">Vibe</span>
          <span class="brand-tag">Platform</span>
        </div>
      </div>

      <nav class="side-nav">
        <a 
          href="javascript:void(0)" 
          class="nav-item" 
          :class="{ active: !onlyShowFavorites && selectedCategory === 'all' && !searchQuery }"
          @click="setView('home')"
          :data-tooltip="isSidebarCollapsed ? 'Trang chủ' : null"
        >
          <span class="icon">🏠</span>
          <span class="label" v-if="!isSidebarCollapsed">Trang chủ</span>
        </a>
        <a 
          href="javascript:void(0)" 
          class="nav-item"
          @click="setView('categories')"
          :data-tooltip="isSidebarCollapsed ? 'Danh mục' : null"
        >
          <span class="icon">🔍</span>
          <span class="label" v-if="!isSidebarCollapsed">Danh mục</span>
        </a>
        <a 
          href="javascript:void(0)" 
          class="nav-item" 
          :class="{ active: onlyShowFavorites }"
          @click="setView('favorites')"
          :data-tooltip="isSidebarCollapsed ? 'Yêu thích' : null"
        >
          <span class="icon">⭐</span>
          <span class="label" v-if="!isSidebarCollapsed">Yêu thích</span>
        </a>
        <a href="javascript:void(0)" class="nav-item" :data-tooltip="isSidebarCollapsed ? 'Cài đặt' : null">
          <span class="icon">⚙️</span>
          <span class="label" v-if="!isSidebarCollapsed">Cài đặt</span>
        </a>
      </nav>

      <!-- Re-styled Collapse Button at Bottom of Nav -->
      <button class="collapse-trigger" @click="toggleSidebar" :data-tooltip="isSidebarCollapsed ? 'Mở rộng' : 'Thu nhỏ'">
        <span class="t-icon">
          <svg v-if="isSidebarCollapsed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </span>
        <span class="label" v-if="!isSidebarCollapsed">Thu nhỏ thanh bên</span>
      </button>

      <div class="user-profile" :data-tooltip="isSidebarCollapsed ? 'Quản trị viên' : null">
        <div class="avatar">AD</div>
        <div class="user-info" v-if="!isSidebarCollapsed">
          <div class="u-name">Quản trị viên</div>
          <div class="u-role">Nhà phát triển</div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="content-hub">
      <header class="hub-header">
        <div class="header-text">
          <h1 class="display-title">Kiến tạo <span class="text-glow">thực tại số</span> của bạn.</h1>
          <p class="body-text">Truy cập các ứng dụng mini hiệu năng cao từ một trung tâm đắm chìm duy nhất.</p>
        </div>

        <div class="search-wrap">
          <div class="search-box">
            <span class="s-icon">🔍</span>
            <input v-model="searchQuery" type="text" placeholder="Tìm kiếm ứng dụng..." />
          </div>
          <div class="filter-box">
            <select v-model="selectedCategory">
              <option v-for="cat in categories" :key="cat" :value="cat">
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
        <div class="app-grid">
          <RouterLink 
            v-for="page in filteredPages" 
            :key="page.slug" 
            :to="page.path"
            class="app-card"
          >
            <div class="card-glow"></div>
            <div class="card-content">
              <div class="app-header">
                <div class="app-icon">{{ page.name.charAt(0) }}</div>
                <div class="app-category">{{ page.category }}</div>
              </div>
              <h3 class="app-name">{{ page.name }}</h3>
              <p class="app-desc">{{ page.description }}</p>
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

        <div v-if="filteredPages.length === 0" class="empty-state">
          <div class="empty-icon">🕳️</div>
          <p>Không tìm thấy ứng dụng nào khớp với tiêu chí của bạn.</p>
        </div>
      </section>

      <!-- History / Favorites side by side -->
      <div class="secondary-grid">
        <section class="mini-panel">
          <h3>Yêu thích đã ghim</h3>
          <div v-if="store.favoritePages.length" class="mini-list">
            <RouterLink v-for="p in store.favoritePages" :key="p.slug" :to="p.path" class="mini-item">
              <span>{{ p.name }}</span>
              <span class="m-icon">↗</span>
            </RouterLink>
          </div>
          <p v-else class="dim-text">Thêm ứng dụng vào mục yêu thích để truy cập nhanh.</p>
        </section>

        <section class="mini-panel">
          <h3>Hoạt động gần đây</h3>
          <div v-if="store.recentlyViewedPages.length" class="mini-list">
            <RouterLink v-for="p in store.recentlyViewedPages" :key="p.slug" :to="p.path" class="mini-item">
              <span>{{ p.name }}</span>
              <span class="m-icon">⌚</span>
            </RouterLink>
          </div>
          <p v-else class="dim-text">Các ứng dụng gần đây của bạn sẽ xuất hiện ở đây.</p>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@700;800&display=swap');

.vibe-layout {
  --bg: #060e20;
  --bg-sidebar: #091328;
  --bg-card: #141f38;
  --primary: #6dddff;
  --primary-glow: rgba(109, 221, 255, 0.4);
  --accent: #d277ff;
  --text: #dee5ff;
  --text-dim: #a3aac4;
  --outline: rgba(109, 117, 140, 0.2);
  
  display: flex;
  width: 100%;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  overflow: hidden;
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

/* Sidebar */
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

/* Tooltips for Collapsed Sidebar */
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

/* Content Hub */
.content-hub {
  flex: 1;
  padding: 3rem 4rem;
  overflow-y: auto;
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
  width: 300px;
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
}

/* App Grid */
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
  margin-bottom: 4rem;
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

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  .content-hub { padding: 2rem; }
  .secondary-grid { grid-template-columns: 1fr; }
}
</style>
