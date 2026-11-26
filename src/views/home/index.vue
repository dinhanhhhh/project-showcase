<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { useHomeSettings } from '@/composables/useHomeSettings'
import { useParticlesBackground } from '@/composables/useParticlesBackground'
import { usePagesStore } from '@/stores/usePagesStore'
import type { PageEntry } from '@/types/page'

interface AppVisualMeta {
  icon: string
  accent: string
  badge: string
  tags: string[]
  featured?: boolean
}

const APP_VISUALS: Record<string, AppVisualMeta> = {
  ngare: {
    icon: '🧭',
    accent: '#6dddff',
    badge: 'Flagship RPG',
    tags: ['Mô phỏng cuộc đời', 'Sự kiện & Nghề nghiệp', 'Pinia Persist'],
    featured: true,
  },
  'co-tuong': {
    icon: '♟️',
    accent: '#fbbf24',
    badge: 'AI Minimax',
    tags: ['Cờ Tướng chuẩn luật', 'AI 3 cấp độ', '2 Người & Web Audio'],
    featured: true,
  },
  'saigon-tycoon': {
    icon: '🎲',
    accent: '#34d399',
    badge: '40 Ô Sài Gòn',
    tags: ['Luật quốc tế', 'Bot AI & Đấu giá', 'Đài Radio Lo-Fi'],
    featured: true,
  },
  'anime-farm': {
    icon: '🌾',
    accent: '#a3e635',
    badge: 'Isometric 2.5D',
    tags: ['Nông trại Anime', 'Kéo thả gieo hạt', 'Kho & Đơn hàng'],
    featured: true,
  },
  'oop-flashcards': {
    icon: '🎴',
    accent: '#38bdf8',
    badge: '21 Thẻ Phỏng Vấn',
    tags: ['OOP & SOLID', 'Thẻ lật 3D', 'Code Highlight'],
  },
  'hom-nay-an-gi': {
    icon: '🍜',
    accent: '#fb7185',
    badge: 'Food Roulette',
    tags: ['20+ Món Việt', 'Thực đơn cá nhân', 'Lọc theo bữa'],
  },
  'oracle-tarot': {
    icon: '🔮',
    accent: '#d277ff',
    badge: 'Mystic Tarot',
    tags: ['Trải bài Tarot', 'Thông điệp vũ trụ', 'Hiệu ứng lật bài'],
  },
  'neon-typing': {
    icon: '⌨️',
    accent: '#22d3ee',
    badge: 'Realtime WPM',
    tags: ['Luyện gõ tốc độ', 'Đếm WPM & Combo', 'Hiệu ứng Neon'],
  },
  'mini-piano': {
    icon: '🎹',
    accent: '#c084fc',
    badge: 'Web Audio Synth',
    tags: ['13 Phím trắng & đen', '4 Âm sắc Synth', 'Bản nhạc mẫu'],
  },
  'color-game': {
    icon: '🎨',
    accent: '#f472b6',
    badge: 'RGB & HEX',
    tags: ['Phản xạ màu sắc', '3 Cấp độ 4/6/9 ô', 'Chuỗi Streak'],
  },
  monopoly: {
    icon: '🏦',
    accent: '#f59e0b',
    badge: 'Classic 20 Ô',
    tags: ['Neo-Monopoly', 'Ván nhanh với AI'],
  },
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  all: { label: 'Tất cả', icon: '✨' },
  game: { label: 'Trò chơi', icon: '🎮' },
  tool: { label: 'Công cụ', icon: '🛠️' },
  education: { label: 'Học tập', icon: '🎓' },
  creative: { label: 'Sáng tạo', icon: '🎨' },
  spiritual: { label: 'Tâm linh', icon: '🔮' },
}

const store = usePagesStore()
const searchQuery = ref('')
const selectedCategory = ref('all')
const onlyShowFavorites = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

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

function getCategoryLabel(category: string): string {
  return CATEGORY_META[category]?.label ?? category
}

function getCategoryIcon(category: string): string {
  return CATEGORY_META[category]?.icon ?? '📦'
}

function getAppVisual(page: PageEntry): AppVisualMeta {
  return (
    APP_VISUALS[page.slug] ?? {
      icon: getCategoryIcon(page.category),
      accent: '#6dddff',
      badge: getCategoryLabel(page.category),
      tags: [getCategoryLabel(page.category)],
    }
  )
}

function setView(view: 'home' | 'favorites' | 'categories') {
  if (view === 'home') {
    onlyShowFavorites.value = false
    selectedCategory.value = 'all'
    searchQuery.value = ''
  } else if (view === 'favorites') {
    onlyShowFavorites.value = true
  } else {
    onlyShowFavorites.value = false
    document.querySelector('.controls-toolbar')?.scrollIntoView({ behavior: 'smooth' })
  }
}

function selectCategoryPill(category: string) {
  onlyShowFavorites.value = false
  selectedCategory.value = category
}

function handleClearData() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu yêu thích và lịch sử?')) {
    store.clearUserData()
  }
}

const categories = computed(() => {
  const cats = new Set(store.pages.map((p) => p.category))
  return ['all', ...Array.from(cats)]
})

function countByCategory(category: string): number {
  if (category === 'all') return store.pages.length
  return store.pages.filter((p) => p.category === category).length
}

const featuredPages = computed(() =>
  store.pages.filter((page) => APP_VISUALS[page.slug]?.featured),
)

const filteredPages = computed(() => {
  let list = store.pages
  if (onlyShowFavorites.value) {
    list = list.filter((p) => store.isFavorite(p.slug))
  }
  const q = searchQuery.value.trim().toLowerCase()
  return list.filter((page) => {
    const visual = getAppVisual(page)
    const matchesQuery =
      q.length === 0 ||
      page.name.toLowerCase().includes(q) ||
      page.description.toLowerCase().includes(q) ||
      visual.tags.some((t) => t.toLowerCase().includes(q))
    const matchesCategory =
      selectedCategory.value === 'all' || page.category === selectedCategory.value
    return matchesQuery && matchesCategory
  })
})

function handleGlobalKeydown(e: KeyboardEvent) {
  if (
    e.key === '/' &&
    !(e.target instanceof HTMLInputElement) &&
    !(e.target instanceof HTMLTextAreaElement)
  ) {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  if (store.pages.length === 0) {
    void store.loadPages()
  }
  initParticles()
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="vibe-layout">
    <canvas
      ref="canvasRef"
      class="nebula-canvas"
    />

    <AppSidebar
      :is-sidebar-collapsed="isSidebarCollapsed"
      :user-name="userName"
      :user-role="userRole"
      :only-show-favorites="onlyShowFavorites"
      :selected-category="selectedCategory"
      :search-query="searchQuery"
      :total-apps="store.pages.length"
      :favorite-count="store.favoritePages.length"
      @toggle-sidebar="toggleSidebar"
      @open-settings="isSettingsOpen = true"
      @set-view="setView"
    />

    <main class="content-hub">
      <!-- Thanh điều hướng nhanh dành riêng cho Mobile (< 768px) -->
      <div class="mobile-topbar">
        <div class="m-brand">
          <span class="m-logo">V</span>
          <div>
            <strong>Vibe Platform</strong>
            <small>{{ store.pages.length }} mini-apps</small>
          </div>
        </div>
        <div class="m-actions">
          <button
            type="button"
            class="m-btn"
            :class="{ active: onlyShowFavorites }"
            @click="onlyShowFavorites = !onlyShowFavorites"
          >
            ⭐ {{ store.favoritePages.length }}
          </button>
          <button
            type="button"
            class="m-btn"
            aria-label="Mở cài đặt"
            @click="isSettingsOpen = true"
          >
            ⚙️
          </button>
        </div>
      </div>

      <!-- Hero Banner & Thống kê nhanh -->
      <header class="hub-hero">
        <div class="hero-copy">
          <div class="eyebrow-pill">
            <span class="pulse-dot" />
            <span>DIGITAL CURATOR ECOSYSTEM · VIBE PLATFORM</span>
          </div>
          <h1 class="display-title">
            Khám phá <span class="text-glow">vũ trụ Mini-Apps</span> &amp; Trò chơi tương tác.
          </h1>
          <p class="body-text">
            Hệ sinh thái ứng dụng &amp; boardgame hiệu năng cao chạy trực tiếp trên trình duyệt — không cần cài đặt, tự động lưu tiến trình.
          </p>
        </div>

        <div class="telemetry-row">
          <div class="kpi-card">
            <span class="kpi-icon">📦</span>
            <div>
              <strong class="kpi-val">{{ store.pages.length }}</strong>
              <span class="kpi-lbl">Tổng ứng dụng</span>
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-icon">⭐</span>
            <div>
              <strong class="kpi-val">{{ store.favoritePages.length }}</strong>
              <span class="kpi-lbl">Đã ghim</span>
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-icon">⚡</span>
            <div>
              <strong class="kpi-val">{{ store.recentlyViewedPages.length }}</strong>
              <span class="kpi-lbl">Mở gần đây</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Khu vực Tâm Điểm Nổi Bật (chỉ hiện khi ở chế độ xem tất cả) -->
      <section
        v-if="!onlyShowFavorites && selectedCategory === 'all' && !searchQuery && featuredPages.length > 0"
        class="spotlight-strip"
      >
        <div class="spotlight-head">
          <span class="spotlight-tag">🔥 TÂM ĐIỂM NỔI BẬT</span>
          <span class="spotlight-sub">Các dự án có chiều sâu gameplay &amp; đồ họa đặc sắc nhất</span>
        </div>
        <div class="spotlight-grid">
          <RouterLink
            v-for="fp in featuredPages"
            :key="`spot-${fp.slug}`"
            :to="fp.path"
            class="spotlight-item"
            :style="{ '--item-accent': getAppVisual(fp).accent }"
          >
            <span class="spot-icon">{{ getAppVisual(fp).icon }}</span>
            <div class="spot-info">
              <div class="spot-top">
                <strong>{{ fp.name }}</strong>
                <span class="spot-badge">{{ getAppVisual(fp).badge }}</span>
              </div>
              <p>{{ fp.description }}</p>
            </div>
            <span class="spot-arrow">→</span>
          </RouterLink>
        </div>
      </section>

      <!-- Thanh Tìm kiếm & Bộ lọc Category Pills -->
      <section class="controls-toolbar">
        <div class="search-box">
          <span class="s-icon">🔍</span>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            placeholder="Tìm ứng dụng, thể loại, tính năng... (Nhấn / để tìm nhanh)"
            aria-label="Tìm kiếm ứng dụng"
          >
          <button
            v-if="searchQuery"
            type="button"
            class="clear-search"
            title="Xóa từ khóa"
            @click="searchQuery = ''"
          >
            ✕
          </button>
          <kbd
            v-else
            class="search-kbd"
          >/</kbd>
        </div>

        <div class="category-pills">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="cat-pill"
            :class="{ active: !onlyShowFavorites && selectedCategory === cat }"
            @click="selectCategoryPill(cat)"
          >
            <span>{{ getCategoryIcon(cat) }}</span>
            <span>{{ getCategoryLabel(cat) }}</span>
            <span class="cat-count">{{ countByCategory(cat) }}</span>
          </button>

          <button
            type="button"
            class="cat-pill fav-pill"
            :class="{ active: onlyShowFavorites }"
            @click="onlyShowFavorites = !onlyShowFavorites"
          >
            <span>⭐</span>
            <span>Yêu thích</span>
            <span class="cat-count">{{ store.favoritePages.length }}</span>
          </button>
        </div>
      </section>

      <!-- Danh sách Ứng dụng chính -->
      <section class="app-section">
        <div class="section-header">
          <h2 class="section-label">
            {{ onlyShowFavorites ? '⭐ Ứng dụng yêu thích đã ghim' : 'Danh sách mini-app' }}
          </h2>
          <span class="result-count">
            Hiển thị <strong>{{ filteredPages.length }}</strong> / {{ store.pages.length }} ứng dụng
          </span>
        </div>

        <div
          v-if="filteredPages.length > 0"
          class="app-grid"
        >
          <RouterLink
            v-for="page in filteredPages"
            :key="page.slug"
            :to="page.path"
            class="app-card"
            :style="{ '--card-accent': getAppVisual(page).accent }"
          >
            <div class="card-glow" />
            <div class="card-content">
              <div class="card-body">
                <div class="app-header">
                  <div class="app-icon">
                    <span>{{ getAppVisual(page).icon }}</span>
                  </div>
                  <div class="header-badges">
                    <span class="app-badge">
                      {{ getAppVisual(page).badge }}
                    </span>
                    <span class="app-category">
                      {{ getCategoryIcon(page.category) }} {{ getCategoryLabel(page.category) }}
                    </span>
                  </div>
                </div>

                <h3 class="app-name">
                  {{ page.name }}
                </h3>
                <p class="app-desc">
                  {{ page.description }}
                </p>

                <div class="tag-row">
                  <span
                    v-for="tag in getAppVisual(page).tags"
                    :key="tag"
                    class="feature-tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <div class="card-footer">
                <div class="footer-left">
                  <span class="launch-cta">
                    Khởi chạy <span class="cta-arrow">→</span>
                  </span>
                  <span
                    v-if="page.author"
                    class="author-meta"
                  >
                    bởi {{ page.author }}
                  </span>
                </div>

                <button
                  type="button"
                  class="fav-btn"
                  :class="{ active: store.isFavorite(page.slug) }"
                  :title="store.isFavorite(page.slug) ? 'Bỏ ghim yêu thích' : 'Ghim yêu thích'"
                  aria-label="Favorite"
                  @click.prevent="store.toggleFavorite(page.slug)"
                >
                  <span aria-hidden="true">{{ store.isFavorite(page.slug) ? '★' : '☆' }}</span>
                  <span class="sr-only">Favorite</span>
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
            🪐
          </div>
          <h3>Không tìm thấy ứng dụng phù hợp</h3>
          <p>Thử đổi từ khóa tìm kiếm hoặc chuyển sang danh mục khác.</p>
          <button
            type="button"
            class="reset-filter-btn"
            @click="setView('home')"
          >
            Xem lại tất cả ứng dụng
          </button>
        </div>
      </section>

      <!-- Khu vực Ghim & Hoạt động gần đây -->
      <div class="secondary-grid">
        <section class="mini-panel">
          <div class="panel-head">
            <h3>⭐ Yêu thích đã ghim</h3>
            <span class="panel-count">{{ store.favoritePages.length }}</span>
          </div>
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
              <span class="mini-emoji">{{ getAppVisual(p).icon }}</span>
              <div class="mini-text">
                <strong>{{ p.name }}</strong>
                <small>{{ getCategoryLabel(p.category) }}</small>
              </div>
              <span class="m-icon">↗</span>
            </RouterLink>
          </div>
          <p
            v-else
            class="dim-text"
          >
            Bấm biểu tượng ngôi sao ☆ trên thẻ ứng dụng để ghim truy cập nhanh tại đây.
          </p>
        </section>

        <section class="mini-panel">
          <div class="panel-head">
            <h3>⚡ Hoạt động gần đây</h3>
            <span class="panel-count">{{ store.recentlyViewedPages.length }}</span>
          </div>
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
              <span class="mini-emoji">{{ getAppVisual(p).icon }}</span>
              <div class="mini-text">
                <strong>{{ p.name }}</strong>
                <small>{{ getAppVisual(p).badge }}</small>
              </div>
              <span class="m-icon">→</span>
            </RouterLink>
          </div>
          <p
            v-else
            class="dim-text"
          >
            Các ứng dụng bạn vừa trải nghiệm sẽ tự động lưu lịch sử tại đây.
          </p>
        </section>
      </div>
    </main>

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
.vibe-layout {
  display: flex;
  width: 100%;
  min-height: 100dvh;
  background:
    radial-gradient(circle at 15% 10%, rgba(109, 221, 255, 0.08) 0%, transparent 38%),
    radial-gradient(circle at 85% 18%, rgba(210, 119, 255, 0.08) 0%, transparent 40%),
    var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  position: relative;
}

.nebula-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.content-hub {
  flex: 1;
  min-width: 0;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2.25rem 3rem 4rem;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Mobile Topbar */
.mobile-topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 16px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.m-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.m-logo {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--text-inverse);
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-brand strong {
  display: block;
  font-size: 0.95rem;
}

.m-brand small {
  color: var(--text-dim);
  font-size: 0.75rem;
}

.m-actions {
  display: flex;
  gap: 0.45rem;
}

.m-btn {
  padding: 0.45rem 0.75rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.m-btn.active {
  border-color: var(--primary);
  color: var(--primary);
}

/* Hero Section */
.hub-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
  padding: 2rem 2.25rem;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(18, 29, 53, 0.88) 0%, rgba(9, 19, 40, 0.92) 100%);
  border: 1px solid var(--outline);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(14px);
}

.hero-copy {
  max-width: 680px;
}

.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.32rem 0.8rem;
  border-radius: 999px;
  background: var(--primary-soft);
  border: 1px solid rgba(109, 221, 255, 0.25);
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  margin-bottom: 1rem;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 8px var(--primary);
}

.display-title {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.85rem, 3.2vw, 2.75rem);
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 0.75rem;
}

.text-glow {
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.body-text {
  color: var(--text-dim);
  font-size: 1rem;
  line-height: 1.6;
}

.telemetry-row {
  display: flex;
  gap: 0.85rem;
  flex-shrink: 0;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.15rem;
  border-radius: 16px;
  background: rgba(6, 14, 32, 0.6);
  border: 1px solid var(--outline);
  min-width: 138px;
}

.kpi-icon {
  font-size: 1.4rem;
}

.kpi-val {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text);
}

.kpi-lbl {
  font-size: 0.74rem;
  color: var(--text-dim);
}

/* Spotlight Strip */
.spotlight-strip {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.spotlight-head {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.spotlight-tag {
  font-family: 'Manrope', sans-serif;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--primary);
}

.spotlight-sub {
  font-size: 0.84rem;
  color: var(--text-dim);
}

.spotlight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.9rem;
}

.spotlight-item {
  --item-accent: var(--primary);
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.15rem;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(23, 37, 68, 0.85), rgba(18, 29, 53, 0.75));
  border: 1px solid var(--outline);
  text-decoration: none;
  color: inherit;
  transition: var(--transition-normal);
}

.spotlight-item:hover {
  transform: translateY(-3px);
  border-color: var(--item-accent);
  box-shadow: 0 12px 28px -10px rgba(0, 0, 0, 0.65);
}

.spot-icon {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.55rem;
}

.spot-info {
  flex: 1;
  min-width: 0;
}

.spot-top {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.2rem;
}

.spot-top strong {
  font-family: 'Manrope', sans-serif;
  font-size: 0.96rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spot-badge {
  flex-shrink: 0;
  font-size: 0.66rem;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: rgba(109, 221, 255, 0.12);
  color: var(--item-accent);
}

.spot-info p {
  font-size: 0.78rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spot-arrow {
  color: var(--item-accent);
  font-weight: 800;
  font-size: 1.1rem;
  transition: transform 0.2s ease;
}

.spotlight-item:hover .spot-arrow {
  transform: translateX(4px);
}

/* Search & Category Pills */
.controls-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.search-box {
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  padding: 0.75rem 1.15rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: var(--transition-fast);
}

.search-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.search-box input {
  background: none;
  border: none;
  color: var(--text);
  font-size: 0.95rem;
  width: 100%;
  outline: none;
}

.search-box input::placeholder {
  color: var(--text-muted);
}

.clear-search {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: var(--text-dim);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
}

.search-kbd {
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.75rem;
  font-family: monospace;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.52rem 0.95rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.cat-pill:hover {
  border-color: var(--outline-strong);
  color: var(--text);
}

.cat-pill.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-inverse);
  box-shadow: 0 0 18px var(--primary-glow);
}

.cat-count {
  padding: 0.08rem 0.42rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  font-size: 0.72rem;
  font-weight: 700;
}

.cat-pill.active .cat-count {
  background: rgba(6, 14, 32, 0.22);
  color: var(--text-inverse);
}

.fav-pill.active {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 18px var(--accent-glow);
}

/* App Section & Cards */
.app-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-label {
  font-family: 'Manrope', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.85rem;
  color: var(--text-dim);
}

.result-count {
  font-size: 0.84rem;
  color: var(--text-dim);
}

.result-count strong {
  color: var(--primary);
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 1.35rem;
}

.app-card {
  --card-accent: var(--primary);
  position: relative;
  background: linear-gradient(160deg, rgba(23, 37, 68, 0.82) 0%, rgba(14, 23, 44, 0.92) 100%);
  border-radius: 22px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: var(--transition-normal);
  border: 1px solid var(--outline);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-card);
}

.app-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--card-accent), transparent 85%);
  opacity: 0.75;
}

.app-card:hover {
  transform: translateY(-6px);
  border-color: var(--card-accent);
  box-shadow: 0 22px 45px -12px rgba(0, 0, 0, 0.75);
}

.card-glow {
  position: absolute;
  top: -40%;
  right: -40%;
  width: 160%;
  height: 160%;
  background: radial-gradient(circle at top right, var(--card-accent) 0%, transparent 55%);
  opacity: 0.05;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.app-card:hover .card-glow {
  opacity: 0.14;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.card-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.15rem;
}

.app-icon {
  width: 54px;
  height: 54px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.12);
}

.header-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.app-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  color: var(--card-accent);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.app-category {
  font-size: 0.7rem;
  color: var(--text-dim);
  font-weight: 600;
}

.app-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 0.55rem;
  color: var(--text);
}

.app-desc {
  color: var(--text-dim);
  font-size: 0.88rem;
  line-height: 1.58;
  margin-bottom: 1.1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tag-row {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.feature-tag {
  font-size: 0.72rem;
  padding: 0.22rem 0.58rem;
  border-radius: 8px;
  background: rgba(6, 14, 32, 0.55);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--outline);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.launch-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  border-radius: 10px;
  background: var(--primary-soft);
  border: 1px solid rgba(109, 221, 255, 0.25);
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--primary);
  transition: var(--transition-fast);
}

.app-card:hover .launch-cta {
  background: var(--primary);
  color: var(--text-inverse);
}

.cta-arrow {
  transition: transform 0.2s ease;
}

.app-card:hover .cta-arrow {
  transform: translateX(3px);
}

.author-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fav-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 11px;
  background: rgba(6, 14, 32, 0.55);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.fav-btn:hover {
  border-color: var(--warning);
  color: var(--warning);
  transform: scale(1.06);
}

.fav-btn.active {
  background: rgba(251, 191, 36, 0.14);
  border-color: rgba(251, 191, 36, 0.45);
  color: var(--warning);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Secondary Grid */
.secondary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.35rem;
}

.mini-panel {
  background: var(--bg-sidebar);
  border-radius: 20px;
  padding: 1.4rem;
  border: 1px solid var(--outline);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.1rem;
}

.panel-head h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 800;
}

.panel-count {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
}

.mini-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.mini-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 14px;
  text-decoration: none;
  color: var(--text);
  transition: var(--transition-fast);
}

.mini-item:hover {
  border-color: var(--primary);
  transform: translateX(4px);
}

.mini-emoji {
  font-size: 1.35rem;
}

.mini-text {
  flex: 1;
  min-width: 0;
}

.mini-text strong {
  display: block;
  font-size: 0.88rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-text small {
  font-size: 0.74rem;
  color: var(--text-dim);
}

.m-icon {
  color: var(--primary);
  font-weight: 700;
}

.dim-text {
  color: var(--text-dim);
  font-size: 0.86rem;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: rgba(18, 29, 53, 0.5);
  border-radius: 24px;
  border: 1px dashed var(--outline-strong);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
}

.empty-icon {
  font-size: 3rem;
}

.empty-state h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.2rem;
}

.empty-state p {
  color: var(--text-dim);
  font-size: 0.9rem;
}

.reset-filter-btn {
  margin-top: 0.5rem;
  padding: 0.65rem 1.2rem;
  border-radius: 12px;
  background: var(--primary);
  border: none;
  color: var(--text-inverse);
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 1180px) {
  .hub-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .telemetry-row {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .content-hub {
    padding: 1rem 1rem 3rem;
    gap: 1.35rem;
  }

  .mobile-topbar {
    display: flex;
  }

  .hub-hero {
    padding: 1.35rem;
  }

  .telemetry-row {
    grid-template-columns: 1fr;
  }

  .secondary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
