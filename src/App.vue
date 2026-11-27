<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import BackToTop from '@/components/BackToTop.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import { applyThemeToDocument, type VibeThemeId } from '@/composables/useHomeSettings'

onMounted(() => {
  const saved = localStorage.getItem('vibe:theme') as VibeThemeId | null
  if (saved) {
    applyThemeToDocument(saved)
  }
})
</script>

<template>
  <div id="vibe-app">
    <RouterView v-slot="{ Component }">
      <Transition
        name="page-transition"
        mode="out-in"
      >
        <component :is="Component" />
      </Transition>
    </RouterView>
    <BackToTop />
    <CommandPalette />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg);
  color: var(--text);
  overflow-x: hidden;
}

#vibe-app {
  min-height: 100vh;
}

.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .page-transition-enter-active,
  .page-transition-leave-active {
    transition: none;
  }

  .page-transition-enter-from,
  .page-transition-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
