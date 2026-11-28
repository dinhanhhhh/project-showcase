<script setup lang="ts">
import type { ColorFormat, ColorSwatch } from '../types'

defineProps<{
  colorFormat: ColorFormat
  target: ColorSwatch
}>()
</script>

<template>
  <!-- Phân tích kênh HSL khi chọn hệ màu HSL -->
  <div
    v-if="colorFormat === 'hsl'"
    class="channel-bars"
  >
    <div class="channel-item">
      <div class="ch-label">
        <span>H (Tông màu)</span>
        <strong>{{ target.hslValue.h }}°</strong>
      </div>
      <div class="ch-track">
        <div
          class="ch-fill hue"
          :style="{ width: `${(target.hslValue.h / 360) * 100}%` }"
        />
      </div>
    </div>

    <div class="channel-item">
      <div class="ch-label">
        <span>S (Độ bão hòa)</span>
        <strong>{{ target.hslValue.s }}%</strong>
      </div>
      <div class="ch-track">
        <div
          class="ch-fill sat"
          :style="{ width: `${target.hslValue.s}%` }"
        />
      </div>
    </div>

    <div class="channel-item">
      <div class="ch-label">
        <span>L (Độ sáng)</span>
        <strong>{{ target.hslValue.l }}%</strong>
      </div>
      <div class="ch-track">
        <div
          class="ch-fill light"
          :style="{ width: `${target.hslValue.l}%` }"
        />
      </div>
    </div>
  </div>

  <!-- Phân tích kênh RGB -->
  <div
    v-else
    class="channel-bars"
  >
    <div class="channel-item">
      <div class="ch-label">
        <span>R (Đỏ)</span>
        <strong>{{ Math.round((target.r / 255) * 100) }}%</strong>
      </div>
      <div class="ch-track">
        <div
          class="ch-fill red"
          :style="{ width: `${(target.r / 255) * 100}%` }"
        />
      </div>
    </div>

    <div class="channel-item">
      <div class="ch-label">
        <span>G (Lục)</span>
        <strong>{{ Math.round((target.g / 255) * 100) }}%</strong>
      </div>
      <div class="ch-track">
        <div
          class="ch-fill green"
          :style="{ width: `${(target.g / 255) * 100}%` }"
        />
      </div>
    </div>

    <div class="channel-item">
      <div class="ch-label">
        <span>B (Lam)</span>
        <strong>{{ Math.round((target.b / 255) * 100) }}%</strong>
      </div>
      <div class="ch-track">
        <div
          class="ch-fill blue"
          :style="{ width: `${(target.b / 255) * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.channel-bars {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.channel-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.ch-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-dim);
}

.ch-track {
  height: 7px;
  border-radius: 99px;
  background: var(--bg-elevated);
  overflow: hidden;
}

.ch-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
}

.ch-fill.red { background: #ff5555; }
.ch-fill.green { background: #34d399; }
.ch-fill.blue { background: #38bdf8; }
.ch-fill.hue { background: linear-gradient(90deg, #ff5555, #fbbf24, #34d399, #38bdf8, #a855f7, #ff5555); }
.ch-fill.sat { background: var(--accent); }
.ch-fill.light { background: var(--primary); }
</style>
