<script setup lang="ts">
import type { NotePitchClass, PianoKey } from '../types'

defineProps<{
  whiteKeys: PianoKey[]
  blackKeys: PianoKey[]
  activeNotes: Record<string, boolean>
  challengeCompleted: boolean
  expectedPitchClass: NotePitchClass | null
  wrongFlashNote: string | null
}>()

const emit = defineEmits<{
  (e: 'trigger-key', key: PianoKey): void
}>()
</script>

<template>
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
            active: activeNotes[wk.note],
            hint: !challengeCompleted && expectedPitchClass === wk.pitchClass,
            wrong: wrongFlashNote === wk.note,
          }"
          @mousedown="emit('trigger-key', wk)"
          @touchstart.prevent="emit('trigger-key', wk)"
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
          active: activeNotes[bk.note],
          hint: !challengeCompleted && expectedPitchClass === bk.pitchClass,
          wrong: wrongFlashNote === bk.note,
        }"
        :style="{ left: `${bk.leftPercent}%` }"
        @mousedown.stop="emit('trigger-key', bk)"
        @touchstart.stop.prevent="emit('trigger-key', bk)"
      >
        <span class="bk-kbd">{{ bk.kbd }}</span>
        <span class="bk-label">{{ bk.label }}</span>
      </button>
    </div>
  </main>
</template>

<style scoped>
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
  grid-template-columns: repeat(8, minmax(0, 1fr));
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
