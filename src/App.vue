<script setup lang="ts">
import { RouterView } from 'vue-router'
import BackToTop from '@/components/BackToTop.vue'
</script>

<template>
  <div id="vibe-app">
    <RouterView />
    <BackToTop />
  </div>
</template>

<style>
/* Reset cơ bản cho toàn project */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #060e20;
  overflow-x: hidden;
}

#vibe-app {
  min-height: 100vh;
}
</style>
