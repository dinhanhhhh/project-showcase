<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  SONG_PRESETS,
  calculateChallengeAccuracy,
  formatPitchForOctave,
  getKeysForOctave,
  scoreChallengeHit,
} from './engine'
import type {
  ChallengeStats,
  OctaveNumber,
  PianoKey,
  PianoPlayMode,
  RecordedNoteEvent,
  SongPreset,
} from './types'

interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

const playMode = ref<PianoPlayMode>('free')
const octave = ref<OctaveNumber>(4)
const waveform = ref<OscillatorType>('triangle')
const activeNote = ref<string | null>(null)
const lastPlayedKey = ref<PianoKey | null>(null)
const selectedSong = ref<SongPreset>(SONG_PRESETS[0])
const songStepIndex = ref(0)
const isAutoPlaying = ref(false)
const recentNotes = ref<string[]>([])
const wrongFlashNote = ref<string | null>(null)

// Challenge mode stats
const challenge = ref<ChallengeStats>({
  hits: 0,
  misses: 0,
  combo: 0,
  maxCombo: 0,
  score: 0,
  completed: false,
})

// Melody Recorder
const isRecording = ref(false)
const isPlayingRecording = ref(false)
const recordedNotes = ref<RecordedNoteEvent[]>([])
let recordStartMs = 0

let audioCtx: AudioContext | null = null
let activeTimer: ReturnType<typeof setTimeout> | null = null
let wrongTimer: ReturnType<typeof setTimeout> | null = null
let autoPlayTimer: ReturnType<typeof setInterval> | null = null
let playbackTimers: Array<ReturnType<typeof setTimeout>> = []

const octaveKeys = computed(() => getKeysForOctave(octave.value))
const whiteKeys = computed(() => octaveKeys.value.whiteKeys)
const blackKeys = computed(() => octaveKeys.value.blackKeys)
const allKeys = computed(() => octaveKeys.value.allKeys)

const expectedPitchClass = computed(() => selectedSong.value.notes[songStepIndex.value] ?? null)

const challengeAccuracy = computed(() =>
  calculateChallengeAccuracy(challenge.value.hits, challenge.value.misses),
)

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

function playSynthTone(freq: number) {
  const ctx = ensureAudio()
  if (!ctx) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = waveform.value
  osc.frequency.setValueAtTime(freq, now)

  gain.gain.setValueAtTime(0.001, now)
  gain.gain.linearRampToValueAtTime(0.36, now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.92)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.95)
}

function resetChallengeStats() {
  songStepIndex.value = 0
  challenge.value = {
    hits: 0,
    misses: 0,
    combo: 0,
    maxCombo: 0,
    score: 0,
    completed: false,
  }
}

function triggerKey(key: PianoKey, isAutomated = false) {
  activeNote.value = key.note
  lastPlayedKey.value = key
  recentNotes.value = [...recentNotes.value.slice(-11), key.note]
  playSynthTone(key.freq)

  if (isRecording.value && !isAutomated) {
    const now = performance.now()
    if (recordedNotes.value.length === 0) {
      recordStartMs = now
    }
    recordedNotes.value = [
      ...recordedNotes.value,
      {
        pitchClass: key.pitchClass,
        octave: octave.value,
        offsetMs: Math.round(now - recordStartMs),
      },
    ]
  }

  if (!isAutomated && playMode.value === 'challenge' && !challenge.value.completed) {
    if (expectedPitchClass.value === key.pitchClass) {
      const nextCombo = challenge.value.combo + 1
      challenge.value.hits += 1
      challenge.value.combo = nextCombo
      if (nextCombo > challenge.value.maxCombo) {
        challenge.value.maxCombo = nextCombo
      }
      challenge.value.score += scoreChallengeHit(nextCombo)

      if (songStepIndex.value + 1 >= selectedSong.value.notes.length) {
        challenge.value.completed = true
      } else {
        songStepIndex.value += 1
      }
    } else {
      challenge.value.misses += 1
      challenge.value.combo = 0
      wrongFlashNote.value = key.note
      if (wrongTimer) clearTimeout(wrongTimer)
      wrongTimer = setTimeout(() => {
        wrongFlashNote.value = null
      }, 260)
    }
  } else if (expectedPitchClass.value === key.pitchClass) {
    songStepIndex.value = (songStepIndex.value + 1) % selectedSong.value.notes.length
  }

  if (activeTimer) clearTimeout(activeTimer)
  activeTimer = setTimeout(() => {
    if (activeNote.value === key.note) {
      activeNote.value = null
    }
  }, 220)
}

function setMode(mode: PianoPlayMode) {
  stopAutoPlay()
  playMode.value = mode
  resetChallengeStats()
}

function setOctave(next: OctaveNumber) {
  octave.value = next
}

function selectSong(song: SongPreset) {
  stopAutoPlay()
  selectedSong.value = song
  resetChallengeStats()
}

function selectNextSong() {
  const idx = SONG_PRESETS.findIndex((s) => s.id === selectedSong.value.id)
  const next = SONG_PRESETS[(idx + 1) % SONG_PRESETS.length]
  selectSong(next)
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

  stopPlayback()
  isAutoPlaying.value = true
  songStepIndex.value = 0
  autoPlayTimer = setInterval(() => {
    const pitch = selectedSong.value.notes[songStepIndex.value]
    const key = allKeys.value.find((k) => k.pitchClass === pitch)
    if (key) {
      triggerKey(key, true)
    }
    if (songStepIndex.value === 0) {
      stopAutoPlay()
    }
  }, 340)
}

function stopPlayback() {
  for (const timer of playbackTimers) {
    clearTimeout(timer)
  }
  playbackTimers = []
  isPlayingRecording.value = false
}

function toggleRecording() {
  if (isRecording.value) {
    isRecording.value = false
    return
  }
  stopAutoPlay()
  stopPlayback()
  recordedNotes.value = []
  recordStartMs = performance.now()
  isRecording.value = true
}

function clearRecording() {
  stopPlayback()
  isRecording.value = false
  recordedNotes.value = []
}

function playRecording() {
  if (recordedNotes.value.length === 0) return
  if (isPlayingRecording.value) {
    stopPlayback()
    return
  }
  stopAutoPlay()
  isRecording.value = false
  isPlayingRecording.value = true

  const events = [...recordedNotes.value]
  let maxDelay = 0

  events.forEach((ev) => {
    if (ev.offsetMs > maxDelay) maxDelay = ev.offsetMs
    const timer = setTimeout(() => {
      const targetKeys = getKeysForOctave(ev.octave).allKeys
      const matched = targetKeys.find((k) => k.pitchClass === ev.pitchClass)
      if (matched) {
        octave.value = ev.octave
        triggerKey(matched, true)
      }
    }, ev.offsetMs)
    playbackTimers.push(timer)
  })

  const endTimer = setTimeout(() => {
    isPlayingRecording.value = false
    playbackTimers = []
  }, maxDelay + 450)
  playbackTimers.push(endTimer)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.repeat || e.target instanceof HTMLInputElement) return

  if (e.key === '[') {
    if (octave.value > 3) octave.value = (octave.value - 1) as OctaveNumber
    return
  }
  if (e.key === ']') {
    if (octave.value < 5) octave.value = (octave.value + 1) as OctaveNumber
    return
  }

  const upper = e.key.toUpperCase()
  const matched = allKeys.value.find((k) => k.kbd === upper)
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
  stopPlayback()
  if (activeTimer) clearTimeout(activeTimer)
  if (wrongTimer) clearTimeout(wrongTimer)
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
          <p>
            Phím <kbd>A</kbd>–<kbd>K</kbd> &amp; <kbd>W E T Y U</kbd> · Đổi quãng tám bằng <kbd>[</kbd> <kbd>]</kbd>
          </p>
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

      <!-- Thanh điều khiển Chế độ, Quãng tám & Thu âm -->
      <section class="studio-controls">
        <div class="segmented">
          <button
            type="button"
            :class="{ active: playMode === 'free' }"
            @click="setMode('free')"
          >
            🎹 Chơi tự do
          </button>
          <button
            type="button"
            :class="{ active: playMode === 'challenge' }"
            @click="setMode('challenge')"
          >
            🎯 Thử thách giai điệu
          </button>
        </div>

        <div class="segmented">
          <button
            v-for="oct in ([3, 4, 5] as const)"
            :key="oct"
            type="button"
            :class="{ active: octave === oct }"
            @click="setOctave(oct)"
          >
            Quãng {{ oct }} (C{{ oct }})
          </button>
        </div>

        <div class="recorder-bar">
          <button
            type="button"
            class="rec-btn"
            :class="{ recording: isRecording }"
            @click="toggleRecording"
          >
            {{ isRecording ? '⏹ Dừng thu' : '⏺ Thu âm' }}
          </button>
          <button
            type="button"
            class="play-rec-btn"
            :disabled="recordedNotes.length === 0"
            @click="playRecording"
          >
            {{ isPlayingRecording ? '⏹ Dừng phát' : `▶ Phát lại (${recordedNotes.length})` }}
          </button>
          <button
            v-if="recordedNotes.length > 0"
            type="button"
            class="clear-rec-btn"
            title="Xóa bản thu"
            @click="clearRecording"
          >
            🗑️
          </button>
        </div>
      </section>

      <!-- HUD Thử thách Giai điệu (khi ở chế độ Challenge) -->
      <section
        v-if="playMode === 'challenge'"
        class="challenge-hud"
      >
        <div class="ch-stat">
          <span>ĐIỂM</span>
          <strong class="neon">{{ challenge.score }}</strong>
        </div>
        <div class="ch-stat">
          <span>COMBO</span>
          <strong class="warn">{{ challenge.combo }} 🔥</strong>
        </div>
        <div class="ch-stat">
          <span>CHÍNH XÁC</span>
          <strong>{{ challengeAccuracy }}%</strong>
        </div>
        <div class="ch-stat">
          <span>TIẾN ĐỘ</span>
          <strong>
            {{ challenge.completed ? selectedSong.notes.length : songStepIndex }} / {{ selectedSong.notes.length }}
          </strong>
        </div>
        <button
          type="button"
          class="ch-reset"
          @click="resetChallengeStats"
        >
          🔄 Chơi lại
        </button>
      </section>

      <!-- Banner chúc mừng hoàn thành thử thách -->
      <section
        v-if="playMode === 'challenge' && challenge.completed"
        class="challenge-win"
      >
        <div>
          <strong>🎉 Xuất sắc! Bạn đã hoàn thành "{{ selectedSong.title }}"</strong>
          <p>
            Điểm: <strong>{{ challenge.score }}</strong> · Độ chính xác: <strong>{{ challengeAccuracy }}%</strong> · Max Combo: <strong>{{ challenge.maxCombo }} 🔥</strong>
          </p>
        </div>
        <div class="win-actions">
          <button
            type="button"
            class="autoplay-btn"
            @click="selectNextSong"
          >
            Bài tiếp theo →
          </button>
          <button
            type="button"
            class="ch-reset"
            @click="resetChallengeStats"
          >
            Đánh lại
          </button>
        </div>
      </section>

      <!-- Khu vực Hiển thị Nốt đang vang & Bản nhạc mẫu -->
      <section class="synth-hud">
        <div class="now-playing">
          <span class="hud-label">
            {{ isRecording ? '🔴 ĐANG THU ÂM GIAI ĐIỆU...' : 'NỐT ĐANG VANG' }}
          </span>
          <div class="note-readout">
            <strong>{{ lastPlayedKey ? `${lastPlayedKey.note} (${lastPlayedKey.label})` : `Sẵn sàng · Quãng ${octave}` }}</strong>
            <small>{{ lastPlayedKey ? `${lastPlayedKey.freq} Hz · Phím [${lastPlayedKey.kbd}]` : 'Hãy gõ phím hoặc bấm nốt đầu tiên!' }}</small>
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
              v-for="(pitch, idx) in selectedSong.notes"
              :key="`${selectedSong.id}-${idx}`"
              class="sheet-pill"
              :class="{
                current: !challenge.completed && idx === songStepIndex,
                passed: challenge.completed || idx < songStepIndex,
              }"
            >
              {{ formatPitchForOctave(pitch, octave) }}
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
              v-for="wk in whiteKeys"
              :key="wk.note"
              type="button"
              class="white-key"
              :class="{
                active: activeNote === wk.note,
                hint: !challenge.completed && expectedPitchClass === wk.pitchClass,
                wrong: wrongFlashNote === wk.note,
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
            v-for="bk in blackKeys"
            :key="bk.note"
            type="button"
            class="black-key"
            :class="{
              active: activeNote === bk.note,
              hint: !challenge.completed && expectedPitchClass === bk.pitchClass,
              wrong: wrongFlashNote === bk.note,
            }"
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
  max-width: 1020px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.wave-selector,
.segmented {
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
}

.wave-selector button,
.segmented button {
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

.wave-selector button.active,
.segmented button.active {
  background: var(--primary);
  color: var(--text-inverse);
}

.studio-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.recorder-bar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.rec-btn,
.play-rec-btn,
.clear-rec-btn,
.ch-reset {
  padding: 0.46rem 0.85rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.rec-btn.recording {
  background: var(--danger-bg);
  border-color: var(--danger);
  color: var(--danger);
  animation: recPulse 1s infinite;
}

@keyframes recPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.play-rec-btn {
  border-color: var(--outline-strong);
  color: var(--primary);
}

.play-rec-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.challenge-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  flex-wrap: wrap;
  padding: 0.85rem 1.2rem;
  border-radius: 16px;
  background: var(--bg-card);
  border: 1px solid var(--outline-strong);
}

.ch-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 72px;
}

.ch-stat span {
  font-size: 0.66rem;
  letter-spacing: 1.2px;
  color: var(--text-dim);
  font-weight: 700;
}

.ch-stat strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.25rem;
}

.ch-stat strong.neon {
  color: var(--primary);
}

.ch-stat strong.warn {
  color: var(--warning);
}

.challenge-win {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  background: var(--primary-soft);
  border: 1px solid var(--primary);
}

.challenge-win p {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-top: 0.2rem;
}

.win-actions {
  display: flex;
  gap: 0.5rem;
}

.synth-hud {
  display: grid;
  grid-template-columns: 0.82fr 1.18fr;
  gap: 1rem;
}

.now-playing,
.song-trainer {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 20px;
  padding: 1.1rem;
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
  font-size: 1.4rem;
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
  padding: 0.3rem 0.58rem;
  border-radius: 99px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text-dim);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}

.song-tab.active {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.autoplay-btn {
  padding: 0.35rem 0.78rem;
  border-radius: 10px;
  background: var(--accent);
  border: none;
  color: var(--text-inverse);
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
}

.sheet-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
}

.sheet-pill {
  padding: 0.2rem 0.44rem;
  border-radius: 7px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  font-size: 0.72rem;
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
  height: 265px;
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

.white-key.wrong {
  background: linear-gradient(180deg, #fee2e2 0%, #f87171 100%);
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
  height: 162px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, #27324b 0%, #0f172a 85%, #020617 100%);
  border: 1px solid #334155;
  border-radius: 0 0 10px 10px;
  color: #f8fafc;
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

.black-key.hint {
  border-color: var(--primary);
  box-shadow: 0 6px 0 var(--primary), 0 0 18px var(--primary-glow);
}

.black-key.active {
  background: linear-gradient(180deg, var(--accent) 0%, #7e22ce 100%);
  transform: translateX(-50%) translateY(5px);
}

.black-key.wrong {
  background: linear-gradient(180deg, #ef4444 0%, #991b1b 100%);
}

.bk-kbd {
  font-size: 0.68rem;
  color: var(--primary);
  font-weight: 800;
}

.bk-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #cbd5e1;
}

@media (max-width: 768px) {
  .piano-page {
    padding: 0.8rem 0.65rem 2.2rem;
  }

  .piano-shell {
    gap: 0.65rem;
  }

  .piano-header {
    gap: 0.5rem;
  }

  .title-block {
    order: 3;
    flex-basis: 100%;
  }

  .title-block h1 {
    font-size: 1.32rem;
  }

  .title-block p {
    display: none;
  }

  .wave-selector {
    flex: 1;
    justify-content: space-between;
  }

  .wave-selector button {
    padding: 0.34rem 0.42rem;
    font-size: 0.72rem;
    white-space: nowrap;
  }

  .studio-controls {
    gap: 0.45rem;
  }

  .segmented {
    flex: 1 1 auto;
    justify-content: space-between;
  }

  .segmented button {
    flex: 1;
    padding: 0.36rem 0.42rem;
    font-size: 0.73rem;
    white-space: nowrap;
  }

  .recorder-bar {
    width: 100%;
    justify-content: space-between;
  }

  .rec-btn,
  .play-rec-btn {
    flex: 1;
    padding: 0.4rem 0.6rem;
    font-size: 0.76rem;
  }

  /* Đưa bàn phím lên NGAY TRÊN synth-hud để có thể đánh đàn liền không cần cuộn */
  .keyboard-frame {
    order: 4;
    padding: 0.75rem 0.45rem 0.9rem;
    border-radius: 18px;
  }

  .synth-hud {
    order: 5;
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }

  .now-playing,
  .song-trainer {
    padding: 0.85rem;
    border-radius: 16px;
  }

  .white-keys-row {
    gap: 3px;
  }

  .white-key {
    height: 175px;
    padding-bottom: 0.55rem;
  }

  .black-key {
    height: 108px;
    width: 8.6%;
  }

  .wk-kbd,
  .bk-kbd {
    display: none;
  }

  .wk-label {
    font-size: 0.68rem;
  }
}
</style>
