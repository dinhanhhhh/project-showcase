import { defineStore } from 'pinia'
import { getDailyDateKey, upsertDailyBest } from '@/utils/daily-seed'
import type { OctaveNumber, RecordedNoteEvent, SavedMelody } from '@/views/mini-piano/types'

interface MiniPianoState {
  octave: OctaveNumber
  waveform: OscillatorType
  sustainEnabled: boolean
  bestScoreBySong: Record<string, number>
  dailyBestByDate: Record<string, number>
  savedMelodies: SavedMelody[]
}

export const useMiniPianoStore = defineStore('mini-piano', {
  state: (): MiniPianoState => ({
    octave: 4,
    waveform: 'triangle',
    sustainEnabled: false,
    bestScoreBySong: {},
    dailyBestByDate: {},
    savedMelodies: [],
  }),

  actions: {
    setOctave(next: OctaveNumber) {
      this.octave = next
    },

    setWaveform(wave: OscillatorType) {
      this.waveform = wave
    },

    toggleSustain() {
      this.sustainEnabled = !this.sustainEnabled
    },

    recordSongScore(songId: string, score: number) {
      if (!this.bestScoreBySong) {
        this.bestScoreBySong = {}
      }
      const prev = this.bestScoreBySong[songId] ?? 0
      if (score > prev) {
        this.bestScoreBySong = { ...this.bestScoreBySong, [songId]: score }
      }
    },

    recordDailyScore(score: number, dateKey: string = getDailyDateKey()) {
      this.dailyBestByDate = upsertDailyBest(this.dailyBestByDate, dateKey, score)
    },

    saveMelody(name: string, notes: readonly RecordedNoteEvent[]): SavedMelody | null {
      if (notes.length === 0) return null
      const current = Array.isArray(this.savedMelodies) ? this.savedMelodies : []
      const cleanName = name.trim() || `Bản thu #${current.length + 1}`
      const entry: SavedMelody = {
        id: `mel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: cleanName,
        createdAt: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        notes: notes.map((n) => ({ ...n })),
      }
      this.savedMelodies = [entry, ...current].slice(0, 5)
      return entry
    },

    deleteMelody(id: string) {
      const current = Array.isArray(this.savedMelodies) ? this.savedMelodies : []
      this.savedMelodies = current.filter((m) => m.id !== id)
    },
  },

  persist: {
    key: 'vibe_mini_piano',
    storage: localStorage,
    pick: [
      'octave',
      'waveform',
      'sustainEnabled',
      'bestScoreBySong',
      'dailyBestByDate',
      'savedMelodies',
    ],
  },
})
