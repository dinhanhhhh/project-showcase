import { ref, watch } from 'vue'

const KEYS = {
  userName: 'vibe:user-name',
  userRole: 'vibe:user-role',
  enableParticles: 'vibe:enable-particles',
  sidebarCollapsed: 'vibe:sidebar-collapsed',
} as const

export function useHomeSettings() {
  const userName = ref(localStorage.getItem(KEYS.userName) || 'Quản trị viên')
  const userRole = ref(localStorage.getItem(KEYS.userRole) || 'Nhà phát triển')
  const enableParticles = ref(localStorage.getItem(KEYS.enableParticles) !== 'false')
  const isSidebarCollapsed = ref(
    JSON.parse(localStorage.getItem(KEYS.sidebarCollapsed) ?? 'false') as boolean,
  )
  const isSettingsOpen = ref(false)

  watch(userName, (val) => localStorage.setItem(KEYS.userName, val))
  watch(userRole, (val) => localStorage.setItem(KEYS.userRole, val))
  watch(enableParticles, (val) =>
    localStorage.setItem(KEYS.enableParticles, val.toString()),
  )
  watch(isSidebarCollapsed, (val) =>
    localStorage.setItem(KEYS.sidebarCollapsed, JSON.stringify(val)),
  )

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  return {
    userName,
    userRole,
    enableParticles,
    isSidebarCollapsed,
    isSettingsOpen,
    toggleSidebar,
  }
}
