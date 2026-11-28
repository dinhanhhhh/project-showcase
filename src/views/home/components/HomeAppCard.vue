<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { PageEntry } from '@/types/page'
import AppCoverArt from '../AppCoverArt.vue'

export interface HomeCardVisual {
  icon: string
  accent: string
  badge: string
  tags: string[]
}

defineProps<{
  page: PageEntry
  visual: HomeCardVisual
  cardAccent: string
  categoryIcon: string
  categoryLabel: string
  isFavorite: boolean
  viewMode: 'grid' | 'list'
}>()

const emit = defineEmits<{
  (e: 'toggle-favorite', slug: string): void
}>()

function handleCardMouseMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}
</script>

<template>
  <RouterLink
    :to="page.path"
    class="app-card"
    :class="{ 'is-list': viewMode === 'list' }"
    :style="{ '--card-accent': cardAccent }"
    @mousemove="handleCardMouseMove"
  >
    <div class="cursor-spotlight" />
    <div class="card-content">
      <AppCoverArt
        v-if="viewMode === 'grid'"
        :slug="page.slug"
        :accent="visual.accent"
        :icon="visual.icon"
      />

      <div class="card-body">
        <div class="app-header">
          <div class="app-icon">
            <span>{{ visual.icon }}</span>
          </div>
          <div class="title-col">
            <h3 class="app-name">
              {{ page.name }}
            </h3>
            <div class="meta-line">
              <span class="app-badge">{{ visual.badge }}</span>
              <span class="app-category">
                {{ categoryIcon }} {{ categoryLabel }}
              </span>
            </div>
          </div>
        </div>

        <p class="app-desc">
          {{ page.description }}
        </p>

        <div class="tag-row">
          <span
            v-for="tag in visual.tags"
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
          :class="{ active: isFavorite }"
          :title="isFavorite ? 'Bỏ ghim yêu thích' : 'Ghim yêu thích'"
          aria-label="Favorite"
          @click.prevent="emit('toggle-favorite', page.slug)"
        >
          <span aria-hidden="true">{{ isFavorite ? '★' : '☆' }}</span>
          <span class="sr-only">Favorite</span>
        </button>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
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
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease, box-shadow 0.2s ease;
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

.app-card.is-list .card-content {
  flex-direction: row;
  align-items: center;
  gap: 1.25rem;
}

.app-card.is-list .card-footer {
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

@media (max-width: 768px) {
  .app-card.is-list .card-content {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
