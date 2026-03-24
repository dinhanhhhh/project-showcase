<script setup lang="ts">
import { ref } from 'vue'

const audioContext = ref<AudioContext | null>(null)

interface ExtendedWindow extends Window {
  webkitAudioContext: typeof AudioContext
}

const notes = [
  { note: 'C', freq: 261.63, label: 'Đô' },
  { note: 'D', freq: 293.66, label: 'Rê' },
  { note: 'E', freq: 329.63, label: 'Mi' },
  { note: 'F', freq: 349.23, label: 'Pha' },
  { note: 'G', freq: 392.00, label: 'Son' },
  { note: 'A', freq: 440.00, label: 'La' },
  { note: 'B', freq: 493.88, label: 'Si' },
  { note: 'C5', freq: 523.25, label: 'Đô 2' },
]

const playNote = (freq: number) => {
  if (!audioContext.value) {
    const AudioContextClass = window.AudioContext || (window as unknown as ExtendedWindow).webkitAudioContext
    audioContext.value = new AudioContextClass()
  }
  
  const osc = audioContext.value.createOscillator()
  const gain = audioContext.value.createGain()
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, audioContext.value.currentTime)
  
  gain.gain.setValueAtTime(0.5, audioContext.value.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.value.currentTime + 1)
  
  osc.connect(gain)
  gain.connect(audioContext.value.destination)
  
  osc.start()
  osc.stop(audioContext.value.currentTime + 1)
}

const activeNote = ref<string | null>(null)

const handlePress = (n: { note: string, freq: number }) => {
  activeNote.value = n.note
  playNote(n.freq)
  setTimeout(() => {
    if (activeNote.value === n.note) activeNote.value = null
  }, 200)
}
</script>

<template>
  <div class="piano-container">
    <div class="piano-header">
      <RouterLink
        class="back-link"
        to="/"
      >
        ← Về trang chủ
      </RouterLink>
      <div class="piano-brand">
        VIBE MINI PIANO
      </div>
    </div>

    <main class="piano-body">
      <div class="piano-info">
        <h1 class="title">
          Đàn Piano Mini
        </h1>
        <p class="desc">
          Bấm phím để tạo ra những giai điệu tuyệt vời!
        </p>
      </div>

      <div class="keyboard">
        <button 
          v-for="n in notes" 
          :key="n.note"
          class="white-key"
          :class="{ active: activeNote === n.note }"
          @mousedown="handlePress(n)"
          @touchstart.prevent="handlePress(n)"
        >
          <span class="key-label">{{ n.label }}</span>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.piano-container {
  min-height: 100vh;
  background: #091328;
  color: #dee5ff;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.piano-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5rem;
}

.back-link {
  color: #6dddff;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.back-link:hover { opacity: 0.8; }

.piano-brand {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  letter-spacing: 2px;
  color: rgba(109, 221, 255, 0.4);
}

.piano-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 1000px;
  margin: 0 auto;
}

.piano-info {
  text-align: center;
  margin-bottom: 4rem;
}

.title {
  font-family: 'Manrope', sans-serif;
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.desc {
  color: #a3aac4;
  font-size: 1.1rem;
}

.keyboard {
  display: flex;
  background: #141f38;
  padding: 1.5rem;
  padding-bottom: 1rem;
  border-radius: 20px;
  box-shadow: 0 40px 100px rgba(0,0,0,0.6);
  border: 1px solid rgba(109, 221, 255, 0.1);
}

.white-key {
  width: 70px;
  height: 280px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 0 0 10px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 1.5rem;
  color: #333;
  margin: 0 2px;
  transition: all 0.1s;
  user-select: none;
}

.white-key.active {
  background: #6dddff;
  transform: translateY(10px);
  box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
}

.key-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  pointer-events: none;
}
</style>
