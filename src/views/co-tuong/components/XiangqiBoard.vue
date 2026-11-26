<script setup lang="ts">
import { computed } from 'vue'
import { PIECE_CHARS, PIECE_NAMES_VI } from '../constants'
import { isKingInCheck, isSamePosition } from '../engine'
import type { BoardState, Piece, Position, Side } from '../types'

interface Props {
  boardState: BoardState
  currentPlayer: Side
  selectedPiece: Piece | null
  legalMoves: Position[]
  lastMove: { from: Position; to: Position } | null
  hintMove?: { from: Position; to: Position } | null
  flipped: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hintMove: null,
})

const emit = defineEmits<{
  (e: 'square-click', pos: Position): void
}>()

// Các vị trí đánh dấu góc chữ thập (vị trí pháo & tốt)
const MARKER_POINTS: ReadonlyArray<[number, number]> = [
  [1, 2],
  [7, 2],
  [0, 3],
  [2, 3],
  [4, 3],
  [6, 3],
  [8, 3],
  [0, 6],
  [2, 6],
  [4, 6],
  [6, 6],
  [8, 6],
  [1, 7],
  [7, 7],
]

const redInCheck = computed(() => isKingInCheck('red', props.boardState))
const blackInCheck = computed(() => isKingInCheck('black', props.boardState))

const intersections = computed(() => {
  const list: Array<{ file: number; rank: number; displayFile: number; displayRank: number }> = []
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const rank = props.flipped ? 9 - r : r
      const file = props.flipped ? 8 - f : f
      list.push({ file, rank, displayFile: f, displayRank: r })
    }
  }
  return list
})

function toPercentStyle(pos: Position): Record<string, string> {
  const displayFile = props.flipped ? 8 - pos.file : pos.file
  const displayRank = props.flipped ? 9 - pos.rank : pos.rank
  return {
    left: `${(displayFile / 8) * 100}%`,
    top: `${(displayRank / 9) * 100}%`,
  }
}

const topFileLabels = computed(() =>
  props.flipped ? ['9', '8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
)

const bottomFileLabels = computed(() =>
  props.flipped ? ['1', '2', '3', '4', '5', '6', '7', '8', '9'] : ['9', '8', '7', '6', '5', '4', '3', '2', '1'],
)

function hasPieceAt(pos: Position): boolean {
  return props.boardState.pieces.some((p) => isSamePosition(p.position, pos))
}

function isCheckedGeneral(piece: Piece): boolean {
  if (piece.type !== 'general') return false
  return piece.side === 'red' ? redInCheck.value : blackInCheck.value
}
</script>

<template>
  <div class="board-outer">
    <div
      class="file-coords top-coords"
      aria-hidden="true"
    >
      <span
        v-for="n in topFileLabels"
        :key="`t-${n}`"
      >{{ n }}</span>
    </div>

    <div class="board-canvas">
      <!-- Lưới đường kẻ bàn cờ SVG 9x10 -->
      <svg
        class="board-svg"
        viewBox="0 0 800 900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <!-- Khung ngoài -->
        <rect
          x="0"
          y="0"
          width="800"
          height="900"
          fill="none"
          stroke="#5c3a1e"
          stroke-width="5"
        />

        <!-- 8 đường ngang bên trong -->
        <line
          v-for="r in 8"
          :key="`h-${r}`"
          x1="0"
          :y1="r * 100"
          x2="800"
          :y2="r * 100"
          stroke="#6b4423"
          stroke-width="2"
        />

        <!-- 7 đường dọc nửa trên (rank 0..4) -->
        <line
          v-for="f in 7"
          :key="`vt-${f}`"
          :x1="f * 100"
          y1="0"
          :x2="f * 100"
          y2="400"
          stroke="#6b4423"
          stroke-width="2"
        />

        <!-- 7 đường dọc nửa dưới (rank 5..9) -->
        <line
          v-for="f in 7"
          :key="`vb-${f}`"
          :x1="f * 100"
          y1="500"
          :x2="f * 100"
          y2="900"
          stroke="#6b4423"
          stroke-width="2"
        />

        <!-- Cung Tướng trên & dưới -->
        <line
          x1="300"
          y1="0"
          x2="500"
          y2="200"
          stroke="#6b4423"
          stroke-width="2"
        />
        <line
          x1="500"
          y1="0"
          x2="300"
          y2="200"
          stroke="#6b4423"
          stroke-width="2"
        />
        <line
          x1="300"
          y1="700"
          x2="500"
          y2="900"
          stroke="#6b4423"
          stroke-width="2"
        />
        <line
          x1="500"
          y1="700"
          x2="300"
          y2="900"
          stroke="#6b4423"
          stroke-width="2"
        />

        <!-- Dấu chữ thập vị trí Pháo & Tốt -->
        <g
          v-for="([mf, mr], idx) in MARKER_POINTS"
          :key="`mark-${idx}`"
          stroke="#6b4423"
          stroke-width="2"
          fill="none"
        >
          <polyline
            v-if="mf > 0"
            :points="`${mf * 100 - 18},${mr * 100 - 7} ${mf * 100 - 7},${mr * 100 - 7} ${mf * 100 - 7},${mr * 100 - 18}`"
          />
          <polyline
            v-if="mf > 0"
            :points="`${mf * 100 - 18},${mr * 100 + 7} ${mf * 100 - 7},${mr * 100 + 7} ${mf * 100 - 7},${mr * 100 + 18}`"
          />
          <polyline
            v-if="mf < 8"
            :points="`${mf * 100 + 18},${mr * 100 - 7} ${mf * 100 + 7},${mr * 100 - 7} ${mf * 100 + 7},${mr * 100 - 18}`"
          />
          <polyline
            v-if="mf < 8"
            :points="`${mf * 100 + 18},${mr * 100 + 7} ${mf * 100 + 7},${mr * 100 + 7} ${mf * 100 + 7},${mr * 100 + 18}`"
          />
        </g>
      </svg>

      <!-- Sông Sở Hà - Hán Giới -->
      <div class="river-banner">
        <span :class="{ flipped: props.flipped }">楚 河</span>
        <span :class="{ flipped: props.flipped }">漢 界</span>
      </div>

      <!-- Highlight nước đi gần nhất -->
      <template v-if="props.lastMove">
        <div
          class="last-move-ring from-ring"
          :style="toPercentStyle(props.lastMove.from)"
        />
        <div
          class="last-move-ring to-ring"
          :style="toPercentStyle(props.lastMove.to)"
        />
      </template>

      <!-- Highlight gợi ý nước đi từ AI -->
      <template v-if="props.hintMove">
        <div
          class="hint-ring hint-from"
          :style="toPercentStyle(props.hintMove.from)"
        />
        <div
          class="hint-ring hint-to"
          :style="toPercentStyle(props.hintMove.to)"
        />
      </template>

      <!-- Giao điểm click -->
      <button
        v-for="cell in intersections"
        :key="`cell-${cell.file}-${cell.rank}`"
        type="button"
        class="intersection-hit"
        :style="{
          left: `${(cell.displayFile / 8) * 100}%`,
          top: `${(cell.displayRank / 9) * 100}%`,
        }"
        :aria-label="`Ô cột ${cell.file + 1} hàng ${cell.rank + 1}`"
        @click="emit('square-click', { file: cell.file, rank: cell.rank })"
      />

      <!-- Gợi ý nước đi hợp lệ -->
      <div
        v-for="(move, idx) in props.legalMoves"
        :key="`legal-${idx}`"
        class="legal-marker"
        :class="{ 'is-capture': hasPieceAt(move) }"
        :style="toPercentStyle(move)"
      />

      <!-- Quân cờ -->
      <button
        v-for="piece in props.boardState.pieces"
        :key="piece.id"
        type="button"
        class="xiangqi-piece"
        :class="[
          piece.side === 'red' ? 'piece-red' : 'piece-black',
          {
            'is-selected': props.selectedPiece?.id === piece.id,
            'is-checked': isCheckedGeneral(piece),
            'is-turn': piece.side === props.currentPlayer,
          },
        ]"
        :style="toPercentStyle(piece.position)"
        :title="`${piece.side === 'red' ? 'Đỏ' : 'Đen'} · ${PIECE_NAMES_VI[piece.type]}`"
        :aria-label="`${piece.side === 'red' ? 'Quân Đỏ' : 'Quân Đen'} ${PIECE_NAMES_VI[piece.type]}`"
        @click.stop="emit('square-click', piece.position)"
      >
        <span class="piece-inner">
          {{ PIECE_CHARS[piece.side][piece.type] }}
        </span>
      </button>
    </div>

    <div
      class="file-coords bottom-coords"
      aria-hidden="true"
    >
      <span
        v-for="n in bottomFileLabels"
        :key="`b-${n}`"
      >{{ n }}</span>
    </div>
  </div>
</template>

<style scoped>
.board-outer {
  width: 100%;
  max-width: 548px;
  margin: 0 auto;
  padding: 8px clamp(16px, 4%, 26px);
  border-radius: 20px;
  background: linear-gradient(145deg, #d6a469, #b57a3c);
  border: 3px solid #6b4423;
  box-shadow:
    0 24px 55px rgba(0, 0, 0, 0.5),
    inset 0 0 0 2px rgba(255, 244, 214, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.file-coords {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 800;
  color: rgba(68, 37, 13, 0.9);
  user-select: none;
  padding: 0 2px;
  line-height: 1.2;
}

.board-canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 8 / 9;
  margin: 5.5% 0;
  background: radial-gradient(circle at center, #f3d6a4 0%, #e4bc7d 100%);
}

.board-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.river-banner {
  position: absolute;
  top: 44.444%;
  left: 8%;
  right: 8%;
  height: 11.111%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10%;
  font-family: 'Noto Serif TC', 'KaiTi', 'STKaiti', serif;
  font-size: clamp(1rem, 3.5vw, 1.75rem);
  font-weight: 700;
  color: rgba(92, 58, 30, 0.72);
  pointer-events: none;
  user-select: none;
}

.river-banner span.flipped {
  transform: rotate(180deg);
}

.intersection-hit {
  position: absolute;
  width: 11%;
  height: 10%;
  transform: translate(-50%, -50%);
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
}

.last-move-ring {
  position: absolute;
  width: 10.6%;
  height: 9.6%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}

.from-ring {
  background: rgba(109, 221, 255, 0.35);
  border: 2px dashed rgba(6, 14, 32, 0.45);
}

.to-ring {
  background: rgba(139, 195, 74, 0.42);
  box-shadow: 0 0 12px rgba(139, 195, 74, 0.7);
}

.hint-ring {
  position: absolute;
  width: 11.4%;
  height: 10.3%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 4;
  animation: hintPulse 1.1s infinite ease-in-out;
}

.hint-from {
  border: 3px dashed #9333ea;
  background: rgba(210, 119, 255, 0.25);
}

.hint-to {
  border: 3px solid #9333ea;
  background: rgba(210, 119, 255, 0.35);
}

@keyframes hintPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.85; }
  50% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
}

.legal-marker {
  position: absolute;
  width: 3.4%;
  height: 3.1%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.85);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.6);
  pointer-events: none;
  z-index: 4;
}

.legal-marker.is-capture {
  width: 11.4%;
  height: 10.3%;
  background: transparent;
  border: 3px solid #ef4444;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.75);
}

.xiangqi-piece {
  position: absolute;
  width: 10.4%;
  height: 9.36%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  padding: 2px;
  background: radial-gradient(circle at 30% 30%, #fff8e7, #e6c999 70%, #b58d52);
  border: 2px solid #8a6230;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.38),
    inset 0 1px 2px rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3;
  transition: left 0.22s ease, top 0.22s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.xiangqi-piece:hover {
  transform: translate(-50%, -54%) scale(1.07);
}

.piece-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Serif TC', 'KaiTi', 'STKaiti', serif;
  font-size: clamp(0.95rem, 3.2vw, 1.65rem);
  font-weight: 800;
  line-height: 1;
  user-select: none;
}

.piece-red {
  color: #b91c1c;
}

.piece-black {
  color: #111827;
}

.xiangqi-piece.is-selected {
  transform: translate(-50%, -56%) scale(1.12);
  box-shadow:
    0 0 0 3px var(--primary),
    0 10px 20px rgba(0, 0, 0, 0.5);
  z-index: 5;
}

.xiangqi-piece.is-checked {
  animation: checkPulse 1s infinite;
}

@keyframes checkPulse {
  0%, 100% {
    box-shadow: 0 0 0 3px #ef4444, 0 0 18px rgba(239, 68, 68, 0.85);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.4), 0 0 26px rgba(239, 68, 68, 0.95);
  }
}
</style>
