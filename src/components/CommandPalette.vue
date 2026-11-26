<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePagesStore } from '@/stores/usePagesStore'
import type { PageEntry } from '@/types/page'

const ICON_BY_SLUG: Record<string, string> = {
  ngare: '🧭',
  'co-tuong': '♟️',
  'saigon-tycoon': '🎲',
  'anime-farm': '🌾',
  'oop-flashcards': '🎴',
  'hom-nay-an-gi': '🍜',
  'oracle-tarot': '🔮',
  'neon-typing': '⌨️',
  'mini-piano': '🎹',
  'color-game': '🎨',
}

const router = useRouter()
const store = usePagesStore()

const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

interface PaletteItem {
  id: string
  name: string
  description: string
  path: string
  icon: string
  category: string
}

const allItems = computed<PaletteItem[]>(() => {
  const homeItem: PaletteItem = {
    id: 'home',
    name: 'Trang chủ Launcher',
    description: 'Quay về bảng điều khiển trung tâm Vibe Platform',
    path: '/',
    icon: '🏠',
    category: 'Điều hướng',
  }

  const appItems: PaletteItem[] = store.pages.map((p: PageEntry) => ({
    id: p.slug,
    name: p.name,
    description: p.description,
    path: p.path,
    icon: ICON_BY_SLUG[p.slug] ?? '✨',
    category: p.category,
  }))

  return [homeItem, ...appItems]
})

const filteredItems = computed<PaletteItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allItems.value
  return allItems.value.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q),
  )
})

function openPalette() {
  if (store.pages.length === 0) {
    void store.loadPages()
  }
  isOpen.value = true
  query.value = ''
  activeIndex.value = 0
  void nextTick(() => inputRef.value?.focus())
}

function closePalette() {
  isOpen.value = false
}

function selectItem(item: PaletteItem) {
  closePalette()
  void router.push(item.path)
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (isOpen.value) closePalette()
    else openPalette()
    return
  }

  if (!isOpen.value) return

  if (e.key === 'Escape') {
    e.preventDefault()
    closePalette()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (filteredItems.value.length > 0) {
      activeIndex.value = (activeIndex.value + 1) % filteredItems.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredItems.value.length > 0) {
      activeIndex.value =
        (activeIndex.value - 1 + filteredItems.value.length) % filteredItems.value.length
    }
  } else if (e.key === 'Enter') {
    const target = filteredItems.value[activeIndex.value]
    if (target) {
      e.preventDefault()
      selectItem(target)
    }
  }
}

function handleCustomOpenEvent() {
  openPalette()
}

watch(query, () => {
  activeIndex.value = 0
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('vibe:open-palette', handleCustomOpenEvent)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('vibe:open-palette', handleCustomOpenEvent)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="palette-fade">
      <div
        v-if="isOpen"
        class="palette-backdrop"
        @click.self="closePalette"
      >
        <div
          class="palette-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Tìm kiếm và mở nhanh ứng dụng"
        >
          <div class="palette-search">
            <span class="p-icon">⌘</span>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Gõ tên trò chơi hoặc công cụ để nhảy nhanh..."
              autocomplete="off"
            >
            <button
              type="button"
              class="esc-btn"
              @click="closePalette"
            >
              ESC
            </button>
          </div>

          <div
            v-if="filteredItems.length > 0"
            class="palette-list"
          >
            <button
              v-for="(item, idx) in filteredItems"
              :key="item.id"
              type="button"
              class="palette-item"
              :class="{ active: idx === activeIndex }"
              @mouseenter="activeIndex = idx"
              @click="selectItem(item)"
            >
              <span class="item-icon">{{ item.icon }}</span>
              <div class="item-meta">
                <strong>{{ item.name }}</strong>
                <span>{{ item.description }}</span>
              </div>
              <span class="item-cat">{{ item.category }}</span>
            </button>
          </div>

          <div
            v-else
            class="palette-empty"
          >
            Không tìm thấy ứng dụng nào khớp với "{{ query }}".
          </div>

          <footer class="palette-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> Di chuyển</span>
            <span><kbd>Enter</kbd> Mở ứng dụng</span>
            <span><kbd>Ctrl+K</kbd> Đóng / Mở</span>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(3, 8, 20, 0.72);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh 1rem 1rem;
}

.palette-dialog {
  width: 100%;
  max-width: 600px;
  max-height: 75dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg-modal);
  border: 1px solid var(--outline-strong);
  border-radius: 20px;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.65);
  overflow: hidden;
  color: var(--text);
}

.palette-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.15rem;
  border-bottom: 1px solid var(--outline);
}

.p-icon {
  color: var(--primary);
  font-size: 1.15rem;
  font-weight: 800;
}

.palette-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 1rem;
}

.palette-search input::placeholder {
  color: var(--text-muted);
}

.esc-btn {
  padding: 0.25rem 0.55rem;
  border-radius: 7px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.palette-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.palette-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.72rem 0.85rem;
  border-radius: 13px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: var(--transition-fast);
}

.palette-item.active {
  background: var(--primary-soft);
  border-color: var(--outline-strong);
}

.item-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.item-meta {
  flex: 1;
  min-width: 0;
}

.item-meta strong {
  display: block;
  font-size: 0.92rem;
  font-weight: 700;
}

.item-meta span {
  display: block;
  font-size: 0.78rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-cat {
  flex-shrink: 0;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--primary);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}

.palette-empty {
  padding: 2.5rem 1.25rem;
  text-align: center;
  color: var(--text-dim);
  font-size: 0.9rem;
}

.palette-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.65rem 1.15rem;
  background: var(--bg-sidebar);
  border-top: 1px solid var(--outline);
  font-size: 0.74rem;
  color: var(--text-dim);
}

.palette-footer kbd {
  padding: 0.12rem 0.4rem;
  border-radius: 5px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.7rem;
  margin-right: 0.25rem;
}

.palette-fade-enter-active,
.palette-fade-leave-active {
  transition: opacity 0.18s ease;
}

.palette-fade-enter-from,
.palette-fade-leave-to {
  opacity: 0;
}
</style>
