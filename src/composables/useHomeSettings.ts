import { ref, watch } from 'vue'

export type VibeThemeId = 'cosmos' | 'emerald' | 'sunset' | 'arctic'
export type LauncherViewMode = 'grid' | 'list'
export type LauncherSortMode = 'featured' | 'alpha' | 'recent'

export interface VibeThemeOption {
  id: VibeThemeId
  name: string
  tagline: string
  swatches: [string, string, string]
}

export const VIBE_THEMES: readonly VibeThemeOption[] = [
  {
    id: 'cosmos',
    name: 'Deep Cosmos',
    tagline: 'Xanh tinh vân & Tím neon nguyên bản',
    swatches: ['#060e20', '#6dddff', '#d277ff'],
  },
  {
    id: 'emerald',
    name: 'Emerald Synth',
    tagline: 'Ngọc lục bảo & Vàng hổ phách dịu mắt',
    swatches: ['#041312', '#34d399', '#fbbf24'],
  },
  {
    id: 'sunset',
    name: 'Sunset Noir',
    tagline: 'Đêm huyền bí, Cam hoàng hôn & San hô',
    swatches: ['#120b14', '#fb923c', '#f43f5e'],
  },
  {
    id: 'arctic',
    name: 'Arctic Light',
    tagline: 'Giao diện sáng biên tập tương phản cao',
    swatches: ['#f1f5f9', '#0284c7', '#7c3aed'],
  },
] as const

const VALID_THEMES = new Set<string>(VIBE_THEMES.map((t) => t.id))

const KEYS = {
  userName: 'vibe:user-name',
  userRole: 'vibe:user-role',
  enableParticles: 'vibe:enable-particles',
  sidebarCollapsed: 'vibe:sidebar-collapsed',
  theme: 'vibe:theme',
  viewMode: 'vibe:view-mode',
  sortMode: 'vibe:sort-mode',
} as const

function safeReadBoolean(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'boolean' ? parsed : fallback
  } catch {
    return fallback
  }
}

function readStoredViewMode(): LauncherViewMode {
  const saved = localStorage.getItem(KEYS.viewMode)
  return saved === 'list' ? 'list' : 'grid'
}

function readStoredSortMode(): LauncherSortMode {
  const saved = localStorage.getItem(KEYS.sortMode)
  if (saved === 'alpha' || saved === 'recent') return saved
  return 'featured'
}

function readStoredTheme(): VibeThemeId {
  const saved = localStorage.getItem(KEYS.theme)
  if (saved && VALID_THEMES.has(saved)) {
    return saved as VibeThemeId
  }
  return 'cosmos'
}

export function applyThemeToDocument(theme: VibeThemeId) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export function useHomeSettings() {
  const userName = ref(localStorage.getItem(KEYS.userName) || 'Quản trị viên')
  const userRole = ref(localStorage.getItem(KEYS.userRole) || 'Nhà phát triển')
  const enableParticles = ref(localStorage.getItem(KEYS.enableParticles) !== 'false')
  const isSidebarCollapsed = ref(safeReadBoolean(KEYS.sidebarCollapsed, false))
  const theme = ref<VibeThemeId>(readStoredTheme())
  const viewMode = ref<LauncherViewMode>(readStoredViewMode())
  const sortMode = ref<LauncherSortMode>(readStoredSortMode())
  const isSettingsOpen = ref(false)

  applyThemeToDocument(theme.value)

  watch(userName, (val) => localStorage.setItem(KEYS.userName, val))
  watch(userRole, (val) => localStorage.setItem(KEYS.userRole, val))
  watch(enableParticles, (val) =>
    localStorage.setItem(KEYS.enableParticles, val.toString()),
  )
  watch(isSidebarCollapsed, (val) =>
    localStorage.setItem(KEYS.sidebarCollapsed, JSON.stringify(val)),
  )
  watch(theme, (val) => {
    localStorage.setItem(KEYS.theme, val)
    applyThemeToDocument(val)
  })
  watch(viewMode, (val) => localStorage.setItem(KEYS.viewMode, val))
  watch(sortMode, (val) => localStorage.setItem(KEYS.sortMode, val))

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  return {
    userName,
    userRole,
    enableParticles,
    isSidebarCollapsed,
    theme,
    viewMode,
    sortMode,
    isSettingsOpen,
    toggleSidebar,
  }
}
