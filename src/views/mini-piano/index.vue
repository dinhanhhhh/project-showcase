<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useMiniPianoStore } from '@/stores/miniPiano'
import { createSafeAudioManager } from '@/utils/audio'
import { copyTextWithFallback } from '@/utils/clipboard'
import { getDailyDateKey } from '@/utils/daily-seed'
import { hasOpenDialog, isEditableEventTarget } from '@/utils/keyboard'
import PianoKeyboard from './components/PianoKeyboard.vue'
import {
  SONG_PRESETS,
  calculateChallengeAccuracy,
  formatMelodyDuration,
  formatPitchForOctave,
  formatRecordedMelodyText,
  getDailyFeaturedSong,
  getKeysForOctave,
  getSynthReleaseSeconds,
  scoreChallengeHit,
} from './engine'
import type {
  ChallengeStats,
  OctaveNumber,
  PianoKey,
  PianoPlayMode,
  RecordedNoteEvent,
  SavedMelody,
  SongPreset,
} from './types'

const store = useMiniPianoStore()

const playMode = ref<PianoPlayMode>('free')
const octave = computed(() => store.octave)
const waveform = computed(() => store.waveform)
const activeNotes = ref<Record<string, boolean>>({})
const lastPlayedKey = ref<PianoKey | null>(null)
const selectedSong = ref<SongPreset>(SONG_PRESETS[0])
const songStepIndex = ref(0)
const isAutoPlaying = ref(false)
const recentNotes = ref<string[]>([])
const wrongFlashNote = ref<string | null>(null)
const melodyNameInput = ref('')

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

const { ensureContext: ensureAudio, closeContext: closeAudio } = createSafeAudioManager()
const noteTimers = new Map<string, ReturnType<typeof setTimeout>>()
let wrongTimer: ReturnType<typeof setTimeout> | null = null
let autoPlayTimer: ReturnType<typeof setInterval> | null = null
let playbackTimers: Array<ReturnType<typeof setTimeout>> = []
const copiedMelody = ref(false)
let copyMelodyTimer: ReturnType<typeof setTimeout> | null = null

const octaveKeys = computed(() => getKeysForOctave(octave.value))
const whiteKeys = computed(() => octaveKeys.value.whiteKeys)
const blackKeys = computed(() => octaveKeys.value.blackKeys)
const allKeys = computed(() => octaveKeys.value.allKeys)

const expectedPitchClass = computed(() => selectedSong.value.notes[songStepIndex.value] ?? null)

const challengeAccuracy = computed(() =>
  calculateChallengeAccuracy(challenge.value.hits, challenge.value.misses),
)

const currentSongBestScore = computed(
  () => store.bestScoreBySong?.[selectedSong.value.id] ?? 0,
)

const todayKey = getDailyDateKey()
const dailyFeaturedSong = computed(() => getDailyFeaturedSong(todayKey))
const dailyBestScore = computed(() => store.dailyBestByDate?.[todayKey] ?? 0)
const isPlayingDailySong = computed(() => selectedSong.value.id === dailyFeaturedSong.value.id)

function playSynthTone(freq: number) {
  const ctx = ensureAudio()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const releaseSec = getSynthReleaseSeconds(store.sustainEnabled)

    osc.type = waveform.value
    osc.frequency.setValueAtTime(freq, now)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.36, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, now + releaseSec)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + releaseSec + 0.03)
  } catch {
    // Ignore restricted Web Audio playback errors
  }
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
  activeNotes.value = { ...activeNotes.value, [key.note]: true }
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
        store.recordSongScore(selectedSong.value.id, challenge.value.score)
        if (isPlayingDailySong.value) {
          store.recordDailyScore(challenge.value.score, todayKey)
        }
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

  const prevTimer = noteTimers.get(key.note)
  if (prevTimer) clearTimeout(prevTimer)
  const nextTimer = setTimeout(() => {
    const copy = { ...activeNotes.value }
    delete copy[key.note]
    activeNotes.value = copy
    noteTimers.delete(key.note)
  }, 220)
  noteTimers.set(key.note, nextTimer)
}

function setMode(mode: PianoPlayMode) {
  stopAutoPlay()
  playMode.value = mode
  resetChallengeStats()
}

function setOctave(next: OctaveNumber) {
  store.setOctave(next)
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

function startDailySongChallenge() {
  stopAutoPlay()
  selectedSong.value = dailyFeaturedSong.value
  playMode.value = 'challenge'
  resetChallengeStats()
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

async function copyRecordedMelody() {
  if (recordedNotes.value.length === 0) return
  const text = formatRecordedMelodyText(melodyNameInput.value, recordedNotes.value)
  if (!text) return
  const ok = await copyTextWithFallback(text)
  if (!ok) return
  copiedMelody.value = true
  if (copyMelodyTimer) clearTimeout(copyMelodyTimer)
  copyMelodyTimer = setTimeout(() => {
    copiedMelody.value = false
  }, 2000)
}

function saveCurrentRecording() {
  if (recordedNotes.value.length === 0) return
  store.saveMelody(melodyNameInput.value, recordedNotes.value)
  melodyNameInput.value = ''
}

function playSavedMelody(melody: SavedMelody) {
  stopPlayback()
  isRecording.value = false
  recordedNotes.value = melody.notes.map((n) => ({ ...n }))
  playRecording()
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
        store.setOctave(ev.octave)
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
  if (e.repeat || isEditableEventTarget(e.target) || hasOpenDialog()) {
    return
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return

  if (e.key === '[') {
    if (octave.value > 3) store.setOctave((octave.value - 1) as OctaveNumber)
    return
  }
  if (e.key === ']') {
    if (octave.value < 5) store.setOctave((octave.value + 1) as OctaveNumber)
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
  for (const t of noteTimers.values()) {
    clearTimeout(t)
  }
  noteTimers.clear()
  if (wrongTimer) clearTimeout(wrongTimer)
  if (copyMelodyTimer) clearTimeout(copyMelodyTimer)
  closeAudio()
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
            Đa âm Polyphony · Phím <kbd>A</kbd>–<kbd>K</kbd> &amp; <kbd>W E T Y U</kbd> · Quãng <kbd>[</kbd> <kbd>]</kbd>
          </p>
        </div>

        <div class="wave-selector">
          <button
            type="button"
            :class="{ active: waveform === 'triangle' }"
            @click="store.setWaveform('triangle')"
          >
            🎻 Warm
          </button>
          <button
            type="button"
            :class="{ active: waveform === 'sine' }"
            @click="store.setWaveform('sine')"
          >
            🎹 Pure
          </button>
          <button
            type="button"
            :class="{ active: waveform === 'square' }"
            @click="store.setWaveform('square')"
          >
            👾 8-Bit
          </button>
          <button
            type="button"
            :class="{ active: waveform === 'sawtooth' }"
            @click="store.setWaveform('sawtooth')"
          >
            ⚡ Cyber
          </button>
          <button
            type="button"
            :class="{ active: store.sustainEnabled }"
            title="Bật/tắt ngân vang Sustain"
            @click="store.toggleSustain()"
          >
            {{ store.sustainEnabled ? '🌊 Ngân dài' : '✂️ Gọn tiếng' }}
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
          <button
            type="button"
            :class="{ active: playMode === 'challenge' && isPlayingDailySong }"
            :title="`Bài nổi bật hôm nay: ${dailyFeaturedSong.title}`"
            @click="startDailySongChallenge"
          >
            📅 Bài Hôm Nay
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
            {{ isPlayingRecording ? '⏹ Dừng phát' : `▶ Phát (${recordedNotes.length})` }}
          </button>
          <input
            v-if="recordedNotes.length > 0 && !isRecording"
            v-model="melodyNameInput"
            type="text"
            class="melody-name-input"
            maxlength="24"
            placeholder="Tên bản thu..."
            aria-label="Đặt tên bản thu âm"
          >
          <button
            v-if="recordedNotes.length > 0 && !isRecording"
            type="button"
            class="save-rec-btn"
            title="Lưu vào thư viện bản thu (tối đa 5)"
            @click="saveCurrentRecording"
          >
            💾 Lưu
          </button>
          <button
            v-if="recordedNotes.length > 0 && !isRecording"
            type="button"
            class="save-rec-btn"
            title="Chép chuỗi nốt vừa thu âm"
            @click="copyRecordedMelody"
          >
            {{ copiedMelody ? '✅ Đã chép' : '📋 Chép nốt' }}
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

      <!-- Danh sách tối đa 5 bản thu đã lưu -->
      <section
        v-if="(store.savedMelodies ?? []).length > 0"
        class="saved-melodies-bar"
      >
        <span class="saved-label">🎼 Bản thu đã lưu:</span>
        <div class="saved-list">
          <div
            v-for="mel in store.savedMelodies"
            :key="mel.id"
            class="saved-chip"
          >
            <button
              type="button"
              class="saved-play"
              @click="playSavedMelody(mel)"
            >
              ▶ {{ mel.name }} ({{ formatMelodyDuration(mel.notes) }})
            </button>
            <button
              type="button"
              class="saved-del"
              :aria-label="`Xóa ${mel.name}`"
              @click="store.deleteMelody(mel.id)"
            >
              ✕
            </button>
          </div>
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
          <span>{{ isPlayingDailySong ? 'DAILY PB' : 'KỶ LỤC BÀI' }}</span>
          <strong class="neon">{{ isPlayingDailySong ? dailyBestScore : currentSongBestScore }}</strong>
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
      <PianoKeyboard
        :white-keys="whiteKeys"
        :black-keys="blackKeys"
        :active-notes="activeNotes"
        :challenge-completed="challenge.completed"
        :expected-pitch-class="expectedPitchClass"
        :wrong-flash-note="wrongFlashNote"
        @trigger-key="triggerKey"
      />
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
}

.melody-name-input {
  width: 120px;
  padding: 0.42rem 0.65rem;
  border-radius: 10px;
  background: var(--bg-input);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.8rem;
  outline: none;
}

.melody-name-input:focus {
  border-color: var(--primary);
}

.save-rec-btn {
  padding: 0.44rem 0.75rem;
  border-radius: 10px;
  background: var(--primary-soft);
  border: 1px solid var(--primary);
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.saved-melodies-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  padding: 0.7rem 0.95rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
}

.saved-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-dim);
}

.saved-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.saved-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--outline);
  overflow: hidden;
}

.saved-play,
.saved-del {
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
  font-size: 0.78rem;
  padding: 0.3rem 0.6rem;
}

.saved-play {
  font-weight: 600;
}

.saved-del {
  color: var(--text-dim);
  border-left: 1px solid var(--outline);
  padding: 0.3rem 0.48rem;
}

.saved-del:hover {
  color: var(--danger);
}
</style>
