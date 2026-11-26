<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { VIBE_THEMES, useHomeSettings } from '@/composables/useHomeSettings'
import { useParticlesBackground } from '@/composables/useParticlesBackground'
import { usePagesStore } from '@/stores/usePagesStore'
import type { PageEntry } from '@/types/page'
import AppCoverArt from './AppCoverArt.vue'

interface AppVisualMeta {
  icon: string
  accent: string
  badge: string
  tags: string[]
  featured?: boolean
  priority?: number
}

const APP_VISUALS: Record<string, AppVisualMeta> = {
  ngare: {
    icon: '🧭',
    accent: '#6dddff',
    badge: 'Flagship RPG',
    tags: ['Mô phỏng cuộc đời', 'Sự kiện & Nghề nghiệp', 'Pinia Persist'],
    featured: true,
    priority: 1,
  },
  'co-tuong': {
    icon: '♟️',
    accent: '#fbbf24',
    badge: 'AI Minimax',
    tags: ['Cờ Tướng chuẩn luật', 'AI 3 cấp độ', '2 Người & Web Audio'],
    featured: true,
    priority: 2,
  },
  'saigon-tycoon': {
    icon: '🎲',
    accent: '#34d399',
    badge: '40 Ô Sài Gòn',
    tags: ['Luật quốc tế', 'Bot AI & Đấu giá', 'Đài Radio Lo-Fi'],
    featured: true,
    priority: 3,
  },
  'anime-farm': {
    icon: '🌾',
    accent: '#a3e635',
    badge: 'Isometric 2.5D',
    tags: ['Nông trại Anime', 'Kéo thả gieo hạt', 'Kho & Đơn hàng'],
    featured: true,
    priority: 4,
  },
  'oop-flashcards': {
    icon: '🎴',
    accent: '#38bdf8',
    badge: '21 Thẻ Phỏng Vấn',
    tags: ['OOP & SOLID', 'Thẻ lật 3D', 'Code Highlight'],
    priority: 5,
  },
  'hom-nay-an-gi': {
    icon: '🍜',
    accent: '#fb7185',
    badge: 'Food Roulette',
    tags: ['20+ Món Việt', 'Thực đơn cá nhân', 'Lọc theo bữa'],
    priority: 6,
  },
  'oracle-tarot': {
    icon: '🔮',
    accent: '#d277ff',
    badge: 'Mystic Tarot',
    tags: ['Trải bài 1 & 3 lá', 'Thông điệp vũ trụ', 'Hình học thần bí'],
    priority: 7,
  },
  'neon-typing': {
    icon: '⌨️',
    accent: '#22d3ee',
    badge: 'Realtime WPM',
    tags: ['Highlight từng ký tự', 'Đếm WPM & Combo', '15s / 30s / 60s'],
    priority: 8,
  },
  'mini-piano': {
    icon: '🎹',
    accent: '#c084fc',
    badge: 'Web Audio Synth',
    tags: ['13 Phím trắng & đen', '4 Âm sắc Synth', 'Bản nhạc mẫu'],
    priority: 9,
  },
  'color-game': {
    icon: '🎨',
    accent: '#f472b6',
    badge: 'RGB & HEX',
    tags: ['Phản xạ màu sắc', '3 Cấp độ 4/6/9 ô', 'Chuỗi Streak'],
    priority: 10,
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

type ViewMode = 'grid' | 'list'
type SortMode = 'featured' | 'alpha' | 'recent'

const store = usePagesStore()
const searchQuery = ref('')
const selectedCategory = ref('all')
const onlyShowFavorites = ref(false)
const viewMode = ref<ViewMode>('grid')
const sortMode = ref<SortMode>('featured')
const searchInputRef = ref<HTMLInputElement | null>(null)

const {
  userName,
  userRole,
  enableParticles,
  isSidebarCollapsed,
  theme,
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
      priority: 99,
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

function openPalette() {
  window.dispatchEvent(new CustomEvent('vibe:open-palette'))
}

function handleCardMouseMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
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
  store.pages
    .filter((page) => APP_VISUALS[page.slug]?.featured)
    .sort((a, b) => (APP_VISUALS[a.slug]?.priority ?? 99) - (APP_VISUALS[b.slug]?.priority ?? 99)),
)

const lastVisitedPage = computed<PageEntry | null>(() => store.recentlyViewedPages[0] ?? null)

const filteredPages = computed(() => {
  let list = store.pages
  if (onlyShowFavorites.value) {
    list = list.filter((p) => store.isFavorite(p.slug))
  }
  const q = searchQuery.value.trim().toLowerCase()
  const matched = list.filter((page) => {
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

  if (sortMode.value === 'alpha') {
    return [...matched].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  }

  if (sortMode.value === 'recent') {
    const recentIndex = new Map(store.recentlyViewedSlugs.map((slug, idx) => [slug, idx]))
    return [...matched].sort((a, b) => {
      const ia = recentIndex.get(a.slug) ?? 999
      const ib = recentIndex.get(b.slug) ?? 999
      if (ia !== ib) return ia - ib
      return a.name.localeCompare(b.name, 'vi')
    })
  }

  return [...matched].sort((a, b) => {
    const pa = APP_VISUALS[a.slug]?.priority ?? 99
    const pb = APP_VISUALS[b.slug]?.priority ?? 99
    if (pa !== pb) return pa - pb
    return a.name.localeCompare(b.name, 'vi')
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
      :theme="theme"
      @toggle-sidebar="toggleSidebar"
      @open-settings="isSettingsOpen = true"
      @set-view="setView"
      @update:theme="theme = $event"
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
            aria-label="Tìm nhanh"
            @click="openPalette"
          >
            ⌘
          </button>
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

      <!-- Hero Banner & Quick Theme Bar -->
      <header class="hub-hero">
        <div class="hero-top-row">
          <div class="eyebrow-pill">
            <span class="pulse-dot" />
            <span>DIGITAL CURATOR · VIBE PLATFORM</span>
          </div>

          <div
            class="quick-theme-bar"
            role="group"
            aria-label="Chọn nhanh chủ đề màu"
          >
            <button
              v-for="t in VIBE_THEMES"
              :key="t.id"
              type="button"
              class="theme-dot-btn"
              :class="{ active: theme === t.id }"
              :title="`Chủ đề: ${t.name}`"
              @click="theme = t.id"
            >
              <span
                class="dot-fill"
                :style="{ background: `linear-gradient(135deg, ${t.swatches[1]}, ${t.swatches[2]})` }"
              />
            </button>
          </div>
        </div>

        <div class="hero-main">
          <div class="hero-copy">
            <h1 class="display-title">
              Khám phá <span class="text-glow">vũ trụ Mini-Apps</span> &amp; Trò chơi tương tác.
            </h1>
            <p class="body-text">
              Bộ sưu tập game chiến thuật, mô phỏng và công cụ học tập chạy tức thì trên trình duyệt — tự động lưu tiến trình và hỗ trợ 4 giao diện màu.
            </p>
          </div>

          <div class="hero-right">
            <div class="telemetry-row">
              <div class="kpi-card">
                <span class="kpi-icon">📦</span>
                <div>
                  <strong class="kpi-val">{{ store.pages.length }}</strong>
                  <span class="kpi-lbl">Ứng dụng</span>
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
                  <span class="kpi-lbl">Gần đây</span>
                </div>
              </div>
            </div>

            <RouterLink
              v-if="lastVisitedPage"
              :to="lastVisitedPage.path"
              class="resume-banner"
            >
              <span class="resume-icon">{{ getAppVisual(lastVisitedPage).icon }}</span>
              <div class="resume-copy">
                <small>TIẾP TỤC TRẢI NGHIỆM</small>
                <strong>{{ lastVisitedPage.name }}</strong>
              </div>
              <span class="resume-go">Mở lại →</span>
            </RouterLink>
          </div>
        </div>
      </header>

      <!-- Khu vực Tâm Điểm Nổi Bật -->
      <section
        v-if="!onlyShowFavorites && selectedCategory === 'all' && !searchQuery && featuredPages.length > 0"
        class="spotlight-strip"
      >
        <div class="spotlight-head">
          <span class="spotlight-tag">🔥 TÂM ĐIỂM NỔI BẬT</span>
          <span class="spotlight-sub">4 tựa game có chiều sâu chiến thuật &amp; đồ họa đặc sắc nhất</span>
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

      <!-- Thanh Tìm kiếm, Bộ lọc & Chế độ hiển thị -->
      <section class="controls-toolbar">
        <div class="toolbar-top">
          <div class="search-box">
            <span class="s-icon">🔍</span>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="search"
              placeholder="Tìm ứng dụng, thể loại, tính năng... (Nhấn / hoặc Ctrl+K)"
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

          <div class="view-controls">
            <div
              class="segmented-control"
              role="group"
              aria-label="Sắp xếp"
            >
              <button
                type="button"
                :class="{ active: sortMode === 'featured' }"
                @click="sortMode = 'featured'"
              >
                Nổi bật
              </button>
              <button
                type="button"
                :class="{ active: sortMode === 'alpha' }"
                @click="sortMode = 'alpha'"
              >
                A–Z
              </button>
              <button
                type="button"
                :class="{ active: sortMode === 'recent' }"
                @click="sortMode = 'recent'"
              >
                Gần đây
              </button>
            </div>

            <div
              class="segmented-control"
              role="group"
              aria-label="Chế độ hiển thị"
            >
              <button
                type="button"
                :class="{ active: viewMode === 'grid' }"
                title="Dạng lưới có ảnh bìa"
                @click="viewMode = 'grid'"
              >
                ⊞
              </button>
              <button
                type="button"
                :class="{ active: viewMode === 'list' }"
                title="Dạng danh sách gọn"
                @click="viewMode = 'list'"
              >
                ☰
              </button>
            </div>
          </div>
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
          :class="{ 'is-list': viewMode === 'list' }"
        >
          <RouterLink
            v-for="page in filteredPages"
            :key="page.slug"
            :to="page.path"
            class="app-card"
            :style="{ '--card-accent': getAppVisual(page).accent }"
            @mousemove="handleCardMouseMove"
          >
            <div class="cursor-spotlight" />
            <div class="card-content">
              <AppCoverArt
                v-if="viewMode === 'grid'"
                :slug="page.slug"
                :accent="getAppVisual(page).accent"
                :icon="getAppVisual(page).icon"
              />

              <div class="card-body">
                <div class="app-header">
                  <div class="app-icon">
                    <span>{{ getAppVisual(page).icon }}</span>
                  </div>
                  <div class="title-col">
                    <h3 class="app-name">
                      {{ page.name }}
                    </h3>
                    <div class="meta-line">
                      <span class="app-badge">{{ getAppVisual(page).badge }}</span>
                      <span class="app-category">
                        {{ getCategoryIcon(page.category) }} {{ getCategoryLabel(page.category) }}
                      </span>
                    </div>
                  </div>
                </div>

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
      :theme="theme"
      @update:user-name="userName = $event"
      @update:user-role="userRole = $event"
      @update:enable-particles="enableParticles = $event"
      @update:theme="theme = $event"
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
    radial-gradient(circle at 15% 10%, var(--primary-soft) 0%, transparent 40%),
    radial-gradient(circle at 86% 18%, var(--accent-soft) 0%, transparent 42%),
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
  max-width: 1440px;
  margin: 0 auto;
  padding: 2rem 2.75rem 4rem;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1.85rem;
}

/* Mobile Topbar */
.mobile-topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.72rem 0.95rem;
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
  font-size: 0.74rem;
}

.m-actions {
  display: flex;
  gap: 0.42rem;
}

.m-btn {
  padding: 0.44rem 0.72rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.84rem;
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
  flex-direction: column;
  gap: 1.35rem;
  padding: 1.85rem 2.15rem;
  border-radius: 24px;
  background: var(--surface-glass);
  border: 1px solid var(--outline);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(16px);
}

.hero-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  background: var(--primary-soft);
  border: 1px solid var(--outline-strong);
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 8px var(--primary);
}

.quick-theme-bar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.45rem;
  border-radius: 999px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.theme-dot-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  padding: 3px;
  border: 1.5px solid transparent;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.theme-dot-btn:hover {
  transform: scale(1.12);
}

.theme-dot-btn.active {
  border-color: var(--primary);
}

.dot-fill {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
}

.hero-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
}

.hero-copy {
  max-width: 660px;
}

.display-title {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.85rem, 3.1vw, 2.7rem);
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 0.7rem;
}

.text-glow {
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.body-text {
  color: var(--text-dim);
  font-size: 0.98rem;
  line-height: 1.62;
}

.hero-right {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
}

.telemetry-row {
  display: flex;
  gap: 0.7rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.78rem 1rem;
  border-radius: 15px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  min-width: 124px;
}

.kpi-icon {
  font-size: 1.3rem;
}

.kpi-val {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text);
}

.kpi-lbl {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.resume-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.95rem;
  border-radius: 14px;
  background: var(--primary-soft);
  border: 1px solid var(--outline-strong);
  text-decoration: none;
  color: var(--text);
  transition: var(--transition-fast);
}

.resume-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -8px var(--primary-glow);
}

.resume-icon {
  font-size: 1.4rem;
}

.resume-copy {
  flex: 1;
  min-width: 0;
}

.resume-copy small {
  display: block;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--primary);
}

.resume-copy strong {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.resume-go {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
}

/* Spotlight Strip */
.spotlight-strip {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
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
  gap: 0.85rem;
}

.spotlight-item {
  --item-accent: var(--primary);
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1.1rem;
  border-radius: 18px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  text-decoration: none;
  color: inherit;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-card);
}

.spotlight-item:hover {
  transform: translateY(-3px);
  border-color: var(--item-accent);
}

.spot-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
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
  font-size: 0.94rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spot-badge {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: var(--bg-sidebar);
  color: var(--item-accent);
  border: 1px solid var(--outline);
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

/* Search, View & Category Controls */
.controls-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.toolbar-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 240px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  padding: 0.7rem 1.05rem;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 0.7rem;
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
  font-size: 0.94rem;
  width: 100%;
  outline: none;
}

.search-box input::placeholder {
  color: var(--text-muted);
}

.clear-search {
  background: var(--bg-elevated);
  border: none;
  color: var(--text-dim);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.74rem;
}

.search-kbd {
  padding: 0.14rem 0.5rem;
  border-radius: 6px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.74rem;
  font-family: monospace;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.segmented-control {
  display: inline-flex;
  gap: 0.2rem;
  padding: 0.24rem;
  border-radius: 13px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.segmented-control button {
  padding: 0.42rem 0.72rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
}

.segmented-control button.active {
  background: var(--primary);
  color: var(--text-inverse);
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.48rem 0.9rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.84rem;
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
  box-shadow: 0 0 16px var(--primary-glow);
}

.cat-count {
  padding: 0.08rem 0.42rem;
  border-radius: 999px;
  background: var(--bg-elevated);
  color: var(--text);
  font-size: 0.7rem;
  font-weight: 700;
}

.cat-pill.active .cat-count {
  background: rgba(6, 14, 32, 0.22);
  color: var(--text-inverse);
}

.fav-pill.active {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 16px var(--accent-glow);
}

/* App Section & Storefront Cards */
.app-section {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
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
  font-size: 0.84rem;
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

.app-grid.is-list {
  grid-template-columns: 1fr;
  gap: 0.85rem;
}

.app-card {
  --card-accent: var(--primary);
  --mx: 50%;
  --my: 0%;
  position: relative;
  background: var(--bg-card);
  border-radius: 22px;
  padding: 1.15rem 1.25rem 1.25rem;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: var(--transition-normal);
  border: 1px solid var(--outline);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-card);
}

.app-card:hover {
  transform: translateY(-5px);
  border-color: var(--card-accent);
}

.cursor-spotlight {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    340px circle at var(--mx) var(--my),
    var(--primary-soft),
    transparent 70%
  );
  transition: opacity 0.25s ease;
  z-index: 0;
}

.app-card:hover .cursor-spotlight {
  opacity: 1;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.app-grid.is-list .card-content {
  flex-direction: row;
  align-items: center;
  gap: 1.25rem;
}

.app-grid.is-list .card-footer {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
  flex-shrink: 0;
}

.card-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.app-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
}

.title-col {
  min-width: 0;
  flex: 1;
}

.app-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.18rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 0.22rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.app-badge {
  font-size: 0.66rem;
  font-weight: 700;
  padding: 0.14rem 0.5rem;
  border-radius: 999px;
  background: var(--bg-sidebar);
  color: var(--card-accent);
  border: 1px solid var(--outline);
}

.app-category {
  font-size: 0.7rem;
  color: var(--text-dim);
  font-weight: 600;
}

.app-desc {
  color: var(--text-dim);
  font-size: 0.86rem;
  line-height: 1.55;
  margin-bottom: 0.9rem;
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
  gap: 0.38rem;
}

.feature-tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.54rem;
  border-radius: 8px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.1rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--outline);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.launch-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.44rem 0.88rem;
  border-radius: 10px;
  background: var(--primary-soft);
  border: 1px solid var(--outline-strong);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--primary);
  transition: var(--transition-fast);
  white-space: nowrap;
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
  font-size: 0.74rem;
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
  background: var(--bg-sidebar);
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
  border-color: var(--warning);
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
  padding: 1.35rem;
  border: 1px solid var(--outline);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.panel-head h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 0.98rem;
  font-weight: 800;
}

.panel-count {
  padding: 0.14rem 0.55rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--primary);
}

.mini-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.mini-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.68rem 0.88rem;
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
  font-size: 1.3rem;
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
  font-size: 0.85rem;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: var(--surface-glass);
  border-radius: 24px;
  border: 1px dashed var(--outline-strong);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.empty-icon {
  font-size: 3rem;
}

.empty-state h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.18rem;
}

.empty-state p {
  color: var(--text-dim);
  font-size: 0.88rem;
}

.reset-filter-btn {
  margin-top: 0.4rem;
  padding: 0.62rem 1.2rem;
  border-radius: 12px;
  background: var(--primary);
  border: none;
  color: var(--text-inverse);
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 1180px) {
  .hero-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-right {
    width: 100%;
  }

  .telemetry-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .content-hub {
    padding: 0.95rem 0.95rem 3rem;
    gap: 1.25rem;
  }

  .mobile-topbar {
    display: flex;
  }

  .hub-hero {
    padding: 1.25rem;
  }

  .telemetry-row {
    grid-template-columns: 1fr;
  }

  .app-grid.is-list .card-content {
    flex-direction: column;
    align-items: stretch;
  }

  .secondary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
