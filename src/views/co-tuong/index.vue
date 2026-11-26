<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useCoTuongStore } from '@/stores/coTuong'
import XiangqiBoard from './components/XiangqiBoard.vue'
import { useCoTuongAudio } from './composables/useCoTuongAudio'
import { PIECE_CHARS } from './constants'
import {
  applyMove,
  findBestMove,
  formatNotation,
  getGameStatus,
  getLegalMovesForPiece,
  getOppositeSide,
  getPieceAt,
  isRepetition,
  isSamePosition,
  replayHistory,
} from './engine'
import type { BotDifficulty, GameMode, MoveRecord, Piece, Position, Side } from './types'

const store = useCoTuongStore()
const { playSound } = useCoTuongAudio()

const selectedPiece = ref<Piece | null>(null)
const legalMoves = ref<Position[]>([])
const isBotThinking = ref(false)
const manualFlipped = ref(false)

let botTimer: ReturnType<typeof setTimeout> | null = null
let gameOverSoundTimer: ReturnType<typeof setTimeout> | null = null

const isGameOver = computed(
  () =>
    store.gameStatus === 'checkmate' ||
    store.gameStatus === 'stalemate' ||
    store.gameStatus === 'draw',
)

const isBoardFlipped = computed(() => {
  const autoFlip = store.gameMode === 'vs_bot' && store.humanSide === 'black'
  return manualFlipped.value ? !autoFlip : autoFlip
})

const lastMove = computed(() => {
  const latest = store.moveHistory[store.moveHistory.length - 1]
  return latest ? { from: latest.from, to: latest.to } : null
})

const capturedByRed = computed(() =>
  store.moveHistory
    .filter((m) => m.side === 'red' && m.capturedPiece)
    .map((m) => m.capturedPiece as Piece),
)

const capturedByBlack = computed(() =>
  store.moveHistory
    .filter((m) => m.side === 'black' && m.capturedPiece)
    .map((m) => m.capturedPiece as Piece),
)

const statusBanner = computed(() => {
  if (store.gameStatus === 'checkmate') {
    const winner = getOppositeSide(store.currentPlayer)
    return winner === 'red' ? '🏆 Bên Đỏ chiếu bí giành chiến thắng!' : '🏆 Bên Đen chiếu bí giành chiến thắng!'
  }
  if (store.gameStatus === 'stalemate') {
    return '🤝 Hòa cờ do hết nước đi hợp lệ (Stalemate)!'
  }
  if (store.gameStatus === 'draw') {
    return '🤝 Hòa cờ do lặp nước liên tiếp!'
  }
  if (store.gameStatus === 'check') {
    return store.currentPlayer === 'red' ? '⚠️ Bên Đỏ đang bị CHIẾU TƯỚNG!' : '⚠️ Bên Đen đang bị CHIẾU TƯỚNG!'
  }
  if (isBotThinking.value) {
    return '🤖 Máy đang tính toán nước đi...'
  }
  return store.currentPlayer === 'red' ? '🔴 Lượt đi của Bên Đỏ' : '⚫ Lượt đi của Bên Đen'
})

function clearTimers() {
  if (botTimer) {
    clearTimeout(botTimer)
    botTimer = null
  }
  if (gameOverSoundTimer) {
    clearTimeout(gameOverSoundTimer)
    gameOverSoundTimer = null
  }
  isBotThinking.value = false
}

function executeMove(piece: Piece, to: Position) {
  const from = { ...piece.position }
  const capturedPiece = getPieceAt(store.boardState, to)
  const nextBoard = applyMove(store.boardState, piece, to)

  const record: MoveRecord = {
    moveNumber: Math.floor(store.moveHistory.length / 2) + 1,
    side: store.currentPlayer,
    from,
    to: { ...to },
    piece: { ...piece, position: from },
    capturedPiece,
    notation: formatNotation(piece, from, to),
  }

  const nextPlayer = getOppositeSide(store.currentPlayer)
  const updatedHistory = [...store.moveHistory, record]
  let nextStatus = getGameStatus(nextPlayer, nextBoard)

  if (nextStatus === 'ongoing' && isRepetition(updatedHistory)) {
    nextStatus = 'draw'
  }

  store.boardState = nextBoard
  store.moveHistory = updatedHistory
  store.currentPlayer = nextPlayer
  store.gameStatus = nextStatus
  selectedPiece.value = null
  legalMoves.value = []

  if (nextStatus === 'check' || nextStatus === 'checkmate') {
    playSound('check', store.soundEnabled)
  } else if (capturedPiece) {
    playSound('capture', store.soundEnabled)
  } else {
    playSound('move', store.soundEnabled)
  }

  if (nextStatus === 'checkmate' || nextStatus === 'stalemate' || nextStatus === 'draw') {
    if (store.gameMode === 'vs_bot') {
      if (nextStatus === 'checkmate') {
        const winner = getOppositeSide(nextPlayer)
        store.recordResult(winner === store.humanSide ? 'win' : 'loss')
      } else {
        store.recordResult('draw')
      }
    }
    gameOverSoundTimer = setTimeout(() => {
      playSound('gameover', store.soundEnabled)
    }, 350)
  }
}

function handleSquareClick(pos: Position) {
  if (isGameOver.value || isBotThinking.value) return
  if (store.gameMode === 'vs_bot' && store.currentPlayer !== store.humanSide) return

  if (selectedPiece.value) {
    const canMoveTo = legalMoves.value.some((m) => isSamePosition(m, pos))
    if (canMoveTo) {
      executeMove(selectedPiece.value, pos)
      return
    }
  }

  const clickedPiece = getPieceAt(store.boardState, pos)
  if (clickedPiece && clickedPiece.side === store.currentPlayer) {
    selectedPiece.value = clickedPiece
    legalMoves.value = getLegalMovesForPiece(clickedPiece, store.boardState)
  } else {
    selectedPiece.value = null
    legalMoves.value = []
  }
}

function handleNewGame() {
  clearTimers()
  selectedPiece.value = null
  legalMoves.value = []
  store.resetMatch()
}

function handleUndo() {
  if (store.moveHistory.length === 0) return
  clearTimers()

  const stepsBack =
    store.gameMode === 'vs_bot' && store.currentPlayer === store.humanSide && store.moveHistory.length >= 2
      ? 2
      : 1

  const nextHistory = store.moveHistory.slice(0, Math.max(0, store.moveHistory.length - stepsBack))
  const nextBoard = replayHistory(nextHistory)
  const lastRecord = nextHistory[nextHistory.length - 1]
  const nextPlayer: Side = lastRecord ? getOppositeSide(lastRecord.side) : 'red'

  store.moveHistory = nextHistory
  store.boardState = nextBoard
  store.currentPlayer = nextPlayer
  store.gameStatus = getGameStatus(nextPlayer, nextBoard)
  selectedPiece.value = null
  legalMoves.value = []
}

function setMode(mode: GameMode) {
  if (store.gameMode === mode) return
  store.gameMode = mode
  handleNewGame()
}

function setHumanSide(side: Side) {
  if (store.humanSide === side) return
  store.humanSide = side
  manualFlipped.value = false
  handleNewGame()
}

function setDifficulty(level: BotDifficulty) {
  store.botDifficulty = level
}

// Tự động cho Bot suy nghĩ khi tới lượt máy
watch(
  () => [store.currentPlayer, store.gameMode, store.humanSide, store.gameStatus] as const,
  ([currentPlayer, mode, humanSide, status]) => {
    if (botTimer) {
      clearTimeout(botTimer)
      botTimer = null
    }
    const shouldBotPlay =
      mode === 'vs_bot' &&
      currentPlayer !== humanSide &&
      (status === 'ongoing' || status === 'check')

    if (!shouldBotPlay) {
      isBotThinking.value = false
      return
    }

    isBotThinking.value = true
    botTimer = setTimeout(() => {
      const best = findBestMove(store.boardState, currentPlayer, store.botDifficulty)
      isBotThinking.value = false
      if (best) {
        executeMove(best.piece, best.to)
      }
    }, 380)
  },
  { immediate: true },
)

onUnmounted(() => {
  clearTimers()
})
</script>

<template>
  <div class="chess-page">
    <div class="chess-shell">
      <header class="chess-header">
        <RouterLink
          to="/"
          class="back-btn"
        >
          ← Về Launcher
        </RouterLink>

        <div class="title-block">
          <h1>♟️ Cờ Tướng Master</h1>
          <p>Xiangqi chuẩn luật · AI Minimax Alpha-Beta</p>
        </div>

        <div class="header-tools">
          <button
            type="button"
            class="icon-btn"
            :title="store.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'"
            @click="store.toggleSound()"
          >
            {{ store.soundEnabled ? '🔊' : '🔇' }}
          </button>
          <button
            type="button"
            class="icon-btn"
            title="Xoay bàn cờ"
            @click="manualFlipped = !manualFlipped"
          >
            ⇅ Xoay
          </button>
        </div>
      </header>

      <div
        class="status-banner"
        :class="{
          'is-check': store.gameStatus === 'check',
          'is-over': isGameOver,
        }"
      >
        <span>{{ statusBanner }}</span>
        <span class="turn-counter">Nước: {{ store.moveHistory.length }}</span>
      </div>

      <div class="chess-grid">
        <section class="board-column">
          <div class="captured-strip">
            <span class="cap-label">Quân Đen ăn:</span>
            <div class="cap-pieces">
              <span
                v-for="p in capturedByBlack"
                :key="p.id"
                class="cap-chip red"
              >
                {{ PIECE_CHARS[p.side][p.type] }}
              </span>
              <span
                v-if="capturedByBlack.length === 0"
                class="cap-empty"
              >Chưa có</span>
            </div>
          </div>

          <XiangqiBoard
            :board-state="store.boardState"
            :current-player="store.currentPlayer"
            :selected-piece="selectedPiece"
            :legal-moves="legalMoves"
            :last-move="lastMove"
            :flipped="isBoardFlipped"
            @square-click="handleSquareClick"
          />

          <div class="captured-strip">
            <span class="cap-label">Quân Đỏ ăn:</span>
            <div class="cap-pieces">
              <span
                v-for="p in capturedByRed"
                :key="p.id"
                class="cap-chip black"
              >
                {{ PIECE_CHARS[p.side][p.type] }}
              </span>
              <span
                v-if="capturedByRed.length === 0"
                class="cap-empty"
              >Chưa có</span>
            </div>
          </div>
        </section>

        <aside class="control-column">
          <div class="panel-card">
            <h2>⚙️ Thiết lập ván đấu</h2>

            <div class="setting-group">
              <span class="setting-label">Chế độ chơi</span>
              <div class="segmented">
                <button
                  type="button"
                  :class="{ active: store.gameMode === 'vs_bot' }"
                  @click="setMode('vs_bot')"
                >
                  🤖 Đấu Máy
                </button>
                <button
                  type="button"
                  :class="{ active: store.gameMode === 'pvp_local' }"
                  @click="setMode('pvp_local')"
                >
                  👥 2 Người
                </button>
              </div>
            </div>

            <div
              v-if="store.gameMode === 'vs_bot'"
              class="setting-group"
            >
              <span class="setting-label">Độ khó AI</span>
              <div class="segmented">
                <button
                  type="button"
                  :class="{ active: store.botDifficulty === 'easy' }"
                  @click="setDifficulty('easy')"
                >
                  Dễ
                </button>
                <button
                  type="button"
                  :class="{ active: store.botDifficulty === 'medium' }"
                  @click="setDifficulty('medium')"
                >
                  Trung bình
                </button>
                <button
                  type="button"
                  :class="{ active: store.botDifficulty === 'hard' }"
                  @click="setDifficulty('hard')"
                >
                  Khó
                </button>
              </div>
            </div>

            <div
              v-if="store.gameMode === 'vs_bot'"
              class="setting-group"
            >
              <span class="setting-label">Cầm quân</span>
              <div class="segmented">
                <button
                  type="button"
                  :class="{ active: store.humanSide === 'red' }"
                  @click="setHumanSide('red')"
                >
                  🔴 Đỏ (Đi trước)
                </button>
                <button
                  type="button"
                  :class="{ active: store.humanSide === 'black' }"
                  @click="setHumanSide('black')"
                >
                  ⚫ Đen (Đi sau)
                </button>
              </div>
            </div>

            <div class="action-buttons">
              <button
                type="button"
                class="btn-secondary"
                :disabled="store.moveHistory.length === 0 || isBotThinking"
                @click="handleUndo"
              >
                ↩ Đi lại
              </button>
              <button
                type="button"
                class="btn-primary"
                @click="handleNewGame"
              >
                🔄 Ván mới
              </button>
            </div>
          </div>

          <div
            v-if="store.gameMode === 'vs_bot'"
            class="panel-card stats-card"
          >
            <div class="stat-item">
              <span>Thắng</span>
              <strong class="stat-win">{{ store.stats.wins }}</strong>
            </div>
            <div class="stat-item">
              <span>Hòa</span>
              <strong class="stat-draw">{{ store.stats.draws }}</strong>
            </div>
            <div class="stat-item">
              <span>Thua</span>
              <strong class="stat-loss">{{ store.stats.losses }}</strong>
            </div>
          </div>

          <div class="panel-card history-card">
            <h2>📜 Biên bản ván đấu</h2>
            <div
              v-if="store.moveHistory.length === 0"
              class="empty-history"
            >
              Chưa có nước đi nào. Bên Đỏ đi trước!
            </div>
            <ol
              v-else
              class="move-list"
            >
              <li
                v-for="(move, idx) in store.moveHistory"
                :key="idx"
                class="move-row"
              >
                <span class="move-idx">#{{ idx + 1 }}</span>
                <span
                  class="move-side"
                  :class="move.side"
                >
                  {{ move.side === 'red' ? 'Đỏ' : 'Đen' }}
                </span>
                <span class="move-notation">{{ move.notation }}</span>
                <span
                  v-if="move.capturedPiece"
                  class="move-cap"
                >
                  ăn {{ PIECE_CHARS[move.capturedPiece.side][move.capturedPiece.type] }}
                </span>
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chess-page {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  padding: 1rem;
  font-family: 'Inter', sans-serif;
}

.chess-shell {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chess-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.back-btn,
.icon-btn {
  padding: 0.48rem 0.9rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  color: var(--primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.icon-btn {
  color: var(--text);
}

.back-btn:hover,
.icon-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.title-block {
  text-align: center;
  flex: 1;
}

.title-block h1 {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.35rem, 2.8vw, 1.85rem);
  font-weight: 800;
}

.title-block p {
  color: var(--text-dim);
  font-size: 0.85rem;
}

.header-tools {
  display: flex;
  gap: 0.5rem;
}

.status-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.15rem;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  font-weight: 700;
  font-size: 0.95rem;
}

.status-banner.is-check {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger);
}

.status-banner.is-over {
  border-color: var(--primary);
  box-shadow: 0 0 20px var(--primary-glow);
  color: var(--primary);
}

.turn-counter {
  font-size: 0.82rem;
  color: var(--text-dim);
  white-space: nowrap;
}

.chess-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(290px, 0.75fr);
  gap: 1.25rem;
  align-items: start;
}

.board-column {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.captured-strip {
  max-width: 540px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.85rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  min-height: 40px;
}

.cap-label {
  font-size: 0.78rem;
  color: var(--text-dim);
  white-space: nowrap;
}

.cap-pieces {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.cap-chip {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f3d6a4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
}

.cap-chip.red { color: #b91c1c; }
.cap-chip.black { color: #111827; }

.cap-empty {
  font-size: 0.78rem;
  color: var(--text-dim);
  font-style: italic;
}

.control-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-card {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 18px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.panel-card h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 800;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.setting-label {
  font-size: 0.78rem;
  color: var(--text-dim);
  font-weight: 600;
}

.segmented {
  display: flex;
  gap: 0.4rem;
  background: var(--bg-sidebar);
  padding: 0.25rem;
  border-radius: 12px;
  border: 1px solid var(--outline);
}

.segmented button {
  flex: 1;
  padding: 0.48rem 0.5rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
}

.segmented button.active {
  background: var(--primary);
  color: var(--text-inverse);
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 0.25rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.7rem;
  border-radius: 12px;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid var(--outline);
}

.btn-primary {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-inverse);
}

.btn-secondary {
  background: var(--bg-sidebar);
  color: var(--text);
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stats-card {
  flex-direction: row;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat-item span {
  font-size: 0.75rem;
  color: var(--text-dim);
  text-transform: uppercase;
}

.stat-item strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.3rem;
}

.stat-win { color: var(--property-group-a); }
.stat-draw { color: var(--primary); }
.stat-loss { color: var(--danger); }

.history-card {
  max-height: 310px;
}

.empty-history {
  font-size: 0.85rem;
  color: var(--text-dim);
  font-style: italic;
}

.move-list {
  list-style: none;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-right: 0.25rem;
}

.move-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 9px;
  background: var(--bg-sidebar);
  font-size: 0.84rem;
}

.move-idx {
  color: var(--text-dim);
  font-size: 0.75rem;
  min-width: 28px;
}

.move-side {
  padding: 0.12rem 0.42rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
}

.move-side.red {
  background: rgba(239, 68, 68, 0.18);
  color: #f87171;
}

.move-side.black {
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
}

.move-notation {
  font-weight: 600;
}

.move-cap {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--accent);
}

@media (max-width: 880px) {
  .chess-grid {
    grid-template-columns: 1fr;
  }

  .title-block {
    order: 3;
    flex-basis: 100%;
  }
}
</style>
