<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

interface PianoKey {
  note: string
  freq: number
  label: string
  kbd: string
  isSharp: boolean
  leftPercent?: number
}

interface SongPreset {
  id: string
  title: string
  notes: string[]
}

const WHITE_KEYS: PianoKey[] = [
  { note: 'C4', freq: 261.63, label: 'Đô', kbd: 'A', isSharp: false },
  { note: 'D4', freq: 293.66, label: 'Rê', kbd: 'S', isSharp: false },
  { note: 'E4', freq: 329.63, label: 'Mi', kbd: 'D', isSharp: false },
  { note: 'F4', freq: 349.23, label: 'Pha', kbd: 'F', isSharp: false },
  { note: 'G4', freq: 392.0, label: 'Son', kbd: 'G', isSharp: false },
  { note: 'A4', freq: 440.0, label: 'La', kbd: 'H', isSharp: false },
  { note: 'B4', freq: 493.88, label: 'Si', kbd: 'J', isSharp: false },
  { note: 'C5', freq: 523.25, label: 'Đô 2', kbd: 'K', isSharp: false },
]

const BLACK_KEYS: PianoKey[] = [
  { note: 'C#4', freq: 277.18, label: 'C♯', kbd: 'W', isSharp: true, leftPercent: 12.5 },
  { note: 'D#4', freq: 311.13, label: 'D♯', kbd: 'E', isSharp: true, leftPercent: 25 },
  { note: 'F#4', freq: 369.99, label: 'F♯', kbd: 'T', isSharp: true, leftPercent: 50 },
  { note: 'G#4', freq: 415.3, label: 'G♯', kbd: 'Y', isSharp: true, leftPercent: 62.5 },
  { note: 'A#4', freq: 466.16, label: 'A♯', kbd: 'U', isSharp: true, leftPercent: 75 },
]

const ALL_KEYS: PianoKey[] = [...WHITE_KEYS, ...BLACK_KEYS]

const SONG_PRESETS: SongPreset[] = [
  {
    id: 'twinkle',
    title: '⭐ Twinkle Little Star',
    notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
  },
  {
    id: 'ode',
    title: '🎼 Ode to Joy (Beethoven)',
    notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'],
  },
  {
    id: 'birthday',
    title: '🎂 Happy Birthday',
    notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4', 'C4', 'C4', 'D4', 'C4', 'G4', 'F4'],
  },
]

const waveform = ref<OscillatorType>('triangle')
const activeNote = ref<string | null>(null)
const lastPlayedKey = ref<PianoKey | null>(null)
const selectedSong = ref<SongPreset>(SONG_PRESETS[0])
const songStepIndex = ref(0)
const isAutoPlaying = ref(false)
const recentNotes = ref<string[]>([])

let audioCtx: AudioContext | null = null
let activeTimer: ReturnType<typeof setTimeout> | null = null
let autoPlayTimer: ReturnType<typeof setInterval> | null = null

function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtor = window.AudioContext || (window as unknown as ExtendedWindow).webkitAudioContext
    if (!AudioCtor) return null
    audioCtx = new AudioCtor()
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  return audioCtx
}

function triggerKey(key: PianoKey) {
  activeNote.value = key.note
  lastPlayedKey.value = key
  recentNotes.value = [...recentNotes.value.slice(-11), key.note]

  if (selectedSong.value.notes[songStepIndex.value] === key.note) {
    songStepIndex.value = (songStepIndex.value + 1) % selectedSong.value.notes.length
  }

  const ctx = ensureAudio()
  if (ctx) {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = waveform.value
    osc.frequency.setValueAtTime(key.freq, now)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.38, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.95)
  }

  if (activeTimer) clearTimeout(activeTimer)
  activeTimer = setTimeout(() => {
    if (activeNote.value === key.note) {
      activeNote.value = null
    }
  }, 220)
}

function selectSong(song: SongPreset) {
  stopAutoPlay()
  selectedSong.value = song
  songStepIndex.value = 0
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
  isAutoPlaying.value = false
}

function toggleAutoPlay() {
  if (isAutoPlaying.value) {
    stopAutoPlay()
    return
  }

  isAutoPlaying.value = true
  songStepIndex.value = 0
  autoPlayTimer = setInterval(() => {
    const noteName = selectedSong.value.notes[songStepIndex.value]
    const key = ALL_KEYS.find((k) => k.note === noteName)
    if (key) {
      triggerKey(key)
    }
    if (songStepIndex.value === 0) {
      stopAutoPlay()
    }
  }, 360)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.repeat || e.target instanceof HTMLInputElement) return
  const upper = e.key.toUpperCase()
  const matched = ALL_KEYS.find((k) => k.kbd === upper)
  if (matched) {
    e.preventDefault()
    triggerKey(matched)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopAutoPlay()
  if (activeTimer) clearTimeout(activeTimer)
  if (audioCtx) {
    void audioCtx.close()
    audioCtx = null
  }
})
</script>

<template>
  <div class="piano-page">
    <div class="piano-shell">
      <header class="piano-header">
        <RouterLink
          class="back-btn"
          to="/"
        >
          ← Về Launcher
        </RouterLink>

        <div class="title-block">
          <h1>🎹 Vibe Synth Piano</h1>
          <p>Bấm chuột, chạm màn hình hoặc gõ phím <kbd>A</kbd>–<kbd>K</kbd> &amp; <kbd>W E T Y U</kbd></p>
        </div>

        <div class="wave-selector">
          <button
            type="button"
            :class="{ active: waveform === 'triangle' }"
            @click="waveform = 'triangle'"
          >
            🎻 Warm
          </button>
          <button
            type="button"
            :class="{ active: waveform === 'sine' }"
            @click="waveform = 'sine'"
          >
            🎹 Pure
          </button>
          <button
            type="button"
            :class="{ active: waveform === 'square' }"
            @click="waveform = 'square'"
          >
            👾 8-Bit
          </button>
          <button
            type="button"
            :class="{ active: waveform === 'sawtooth' }"
            @click="waveform = 'sawtooth'"
          >
            ⚡ Cyber
          </button>
        </div>
      </header>

      <!-- Khu vực Hiển thị Nốt đang vang & Bản nhạc mẫu -->
      <section class="synth-hud">
        <div class="now-playing">
          <span class="hud-label">NỐT ĐANG VANG</span>
          <div class="note-readout">
            <strong>{{ lastPlayedKey ? `${lastPlayedKey.note} (${lastPlayedKey.label})` : 'Sẵn sàng' }}</strong>
            <small>{{ lastPlayedKey ? `${lastPlayedKey.freq} Hz · Phím [${lastPlayedKey.kbd}]` : 'Hãy gõ phím đầu tiên!' }}</small>
          </div>
          <div class="note-trail">
            <span
              v-for="(n, idx) in recentNotes"
              :key="`${n}-${idx}`"
              class="trail-chip"
            >{{ n }}</span>
          </div>
        </div>

        <div class="song-trainer">
          <div class="trainer-top">
            <div class="song-tabs">
              <button
                v-for="song in SONG_PRESETS"
                :key="song.id"
                type="button"
                class="song-tab"
                :class="{ active: selectedSong.id === song.id }"
                @click="selectSong(song)"
              >
                {{ song.title }}
              </button>
            </div>
            <button
              type="button"
              class="autoplay-btn"
              @click="toggleAutoPlay"
            >
              {{ isAutoPlaying ? '⏹ Dừng phát' : '▶ Phát mẫu' }}
            </button>
          </div>

          <div class="sheet-notes">
            <span
              v-for="(note, idx) in selectedSong.notes"
              :key="`${selectedSong.id}-${idx}`"
              class="sheet-pill"
              :class="{
                current: idx === songStepIndex,
                passed: idx < songStepIndex,
              }"
            >
              {{ note }}
            </span>
          </div>
        </div>
      </section>

      <!-- Bàn phím Piano 13 phím (8 Trắng + 5 Đen) -->
      <main class="keyboard-frame">
        <div class="keyboard-stage">
          <!-- 8 Phím Trắng -->
          <div class="white-keys-row">
            <button
              v-for="wk in WHITE_KEYS"
              :key="wk.note"
              type="button"
              class="white-key"
              :class="{
                active: activeNote === wk.note,
                hint: selectedSong.notes[songStepIndex] === wk.note,
              }"
              @mousedown="triggerKey(wk)"
              @touchstart.prevent="triggerKey(wk)"
            >
              <span class="wk-kbd">{{ wk.kbd }}</span>
              <span class="wk-note">{{ wk.note }}</span>
              <span class="wk-label">{{ wk.label }}</span>
            </button>
          </div>

          <!-- 5 Phím Đen (♯) -->
          <button
            v-for="bk in BLACK_KEYS"
            :key="bk.note"
            type="button"
            class="black-key"
            :class="{ active: activeNote === bk.note }"
            :style="{ left: `${bk.leftPercent}%` }"
            @mousedown.stop="triggerKey(bk)"
            @touchstart.stop.prevent="triggerKey(bk)"
          >
            <span class="bk-kbd">{{ bk.kbd }}</span>
            <span class="bk-label">{{ bk.label }}</span>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.piano-page {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  padding: 1.25rem;
  font-family: 'Inter', sans-serif;
}

.piano-shell {
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.piano-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.back-btn {
  padding: 0.5rem 0.95rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.86rem;
}

.title-block {
  text-align: center;
  flex: 1;
}

.title-block h1 {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.35rem, 2.8vw, 1.9rem);
  font-weight: 800;
}

.title-block p {
  font-size: 0.84rem;
  color: var(--text-dim);
  margin-top: 0.2rem;
}

kbd {
  padding: 0.1rem 0.4rem;
  border-radius: 5px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-size: 0.76rem;
  color: var(--primary);
}

.wave-selector {
  display: flex;
  gap: 0.35rem;
  padding: 0.25rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.wave-selector button {
  padding: 0.42rem 0.75rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
}

.wave-selector button.active {
  background: var(--primary);
  color: var(--text-inverse);
}

.synth-hud {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 1rem;
}

.now-playing,
.song-trainer {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 20px;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.hud-label {
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  color: var(--text-dim);
  font-weight: 700;
}

.note-readout strong {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 1.45rem;
  color: var(--primary);
}

.note-readout small {
  color: var(--text-dim);
  font-size: 0.8rem;
}

.note-trail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  min-height: 24px;
}

.trail-chip {
  padding: 0.12rem 0.45rem;
  border-radius: 6px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  font-size: 0.72rem;
  color: var(--text-dim);
}

.trainer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.song-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.song-tab {
  padding: 0.35rem 0.7rem;
  border-radius: 99px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.song-tab.active {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.autoplay-btn {
  padding: 0.38rem 0.85rem;
  border-radius: 10px;
  background: var(--accent);
  border: none;
  color: var(--text-inverse);
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}

.sheet-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
}

.sheet-pill {
  padding: 0.25rem 0.55rem;
  border-radius: 8px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-dim);
}

.sheet-pill.passed {
  opacity: 0.45;
}

.sheet-pill.current {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-inverse);
  box-shadow: 0 0 12px var(--primary-glow);
}

.keyboard-frame {
  background: linear-gradient(180deg, #162340 0%, #0b1326 100%);
  padding: 1.5rem 1.25rem 1.35rem;
  border-radius: 26px;
  border: 1px solid var(--outline-strong);
  box-shadow: var(--shadow-card);
}

.keyboard-stage {
  position: relative;
  width: 100%;
  user-select: none;
}

.white-keys-row {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.white-key {
  height: 270px;
  background: linear-gradient(180deg, #ffffff 0%, #eef2ff 90%, #dbe4ff 100%);
  border: 1px solid #cbd5e1;
  border-radius: 6px 6px 14px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 1.1rem;
  gap: 0.25rem;
  color: #1e293b;
  box-shadow: 0 8px 0 #94a3b8, 0 14px 24px rgba(0, 0, 0, 0.45);
  transition: transform 0.08s ease, background 0.1s ease, box-shadow 0.08s ease;
}

.white-key.hint {
  box-shadow: 0 8px 0 var(--primary), 0 0 22px var(--primary-glow);
}

.white-key.active {
  background: linear-gradient(180deg, #e0f9ff 0%, var(--primary) 100%);
  transform: translateY(6px);
  box-shadow: 0 2px 0 #38bdf8, 0 6px 14px rgba(109, 221, 255, 0.45);
}

.wk-kbd {
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
}

.wk-note {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
}

.wk-label {
  font-family: 'Manrope', sans-serif;
  font-size: 0.92rem;
  font-weight: 800;
  text-transform: uppercase;
}

.black-key {
  position: absolute;
  top: 0;
  width: 7.8%;
  height: 165px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, #27324b 0%, #0f172a 85%, #020617 100%);
  border: 1px solid #334155;
  border-radius: 0 0 10px 10px;
  color: var(--text);
  cursor: pointer;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 0.75rem;
  gap: 0.25rem;
  box-shadow: 0 6px 0 #020617, 0 12px 18px rgba(0, 0, 0, 0.65);
  transition: transform 0.08s ease, background 0.1s ease;
}

.black-key.active {
  background: linear-gradient(180deg, var(--accent) 0%, #7e22ce 100%);
  transform: translateX(-50%) translateY(5px);
}

.bk-kbd {
  font-size: 0.68rem;
  color: var(--primary);
  font-weight: 800;
}

.bk-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-dim);
}

@media (max-width: 768px) {
  .synth-hud {
    grid-template-columns: 1fr;
  }

  .keyboard-frame {
    padding: 0.85rem 0.5rem 1rem;
  }

  .white-keys-row {
    gap: 3px;
  }

  .white-key {
    height: 190px;
    padding-bottom: 0.65rem;
  }

  .black-key {
    height: 115px;
    width: 8.6%;
  }

  .wk-kbd,
  .bk-kbd {
    display: none;
  }

  .wk-label {
    font-size: 0.7rem;
  }
}
</style>
