<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useCoTuongStore } from '@/stores/coTuong'
import XiangqiBoard from './components/XiangqiBoard.vue'
import { useCoTuongAudio } from './composables/useCoTuongAudio'
import { PIECE_CHARS, XIANGQI_PUZZLES, cloneBoardState } from './constants'
import {
  applyMove,
  calculateRedAdvantagePercent,
  evaluateBoard,
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
import type {
  BotDifficulty,
  GameMode,
  MoveRecord,
  Piece,
  Position,
  Side,
  TimeControlMinutes,
} from './types'

const store = useCoTuongStore()
const { playSound } = useCoTuongAudio()

const selectedPiece = ref<Piece | null>(null)
const legalMoves = ref<Position[]>([])
const hintMove = ref<{ from: Position; to: Position; notation: string } | null>(null)
const isBotThinking = ref(false)
const manualFlipped = ref(false)
const isVictoryModalOpen = ref(false)

// Cờ Thế (Endgame Puzzles)
const activePuzzleIndex = ref(0)
const showPuzzleHint = ref(false)

// Đồng hồ cờ & Đầu hàng
const redTimeSec = ref(0)
const blackTimeSec = ref(0)
const timedOutSide = ref<Side | null>(null)
const resignedSide = ref<Side | null>(null)

let botTimer: ReturnType<typeof setTimeout> | null = null
let gameOverSoundTimer: ReturnType<typeof setTimeout> | null = null
let clockInterval: ReturnType<typeof setInterval> | null = null

const activePuzzle = computed(() => XIANGQI_PUZZLES[activePuzzleIndex.value] ?? XIANGQI_PUZZLES[0])

const isGameOver = computed(
  () =>
    store.gameStatus === 'checkmate' ||
    store.gameStatus === 'stalemate' ||
    store.gameStatus === 'draw' ||
    timedOutSide.value !== null ||
    resignedSide.value !== null,
)

const isBoardFlipped = computed(() => {
  if (store.gameMode === 'puzzle') return manualFlipped.value
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

const redEvalScore = computed(() => evaluateBoard(store.boardState, 'red'))
const redAdvantagePercent = computed(() => calculateRedAdvantagePercent(store.boardState))
const evalScoreLabel = computed(() => {
  if (Math.abs(redEvalScore.value) < 30) return 'Cân bằng (0.0)'
  const pawns = (Math.abs(redEvalScore.value) / 100).toFixed(1)
  return redEvalScore.value > 0 ? `Đỏ ưu +${pawns}` : `Đen ưu +${pawns}`
})

const hasClock = computed(() => store.gameMode !== 'puzzle' && store.timeControl > 0)

const statusBanner = computed(() => {
  if (timedOutSide.value) {
    return timedOutSide.value === 'red'
      ? '⏱️ Bên Đỏ hết giờ — Bên Đen chiến thắng!'
      : '⏱️ Bên Đen hết giờ — Bên Đỏ chiến thắng!'
  }
  if (resignedSide.value) {
    return resignedSide.value === 'red'
      ? '🏳️ Bên Đỏ đã đầu hàng — Bên Đen chiến thắng!'
      : '🏳️ Bên Đen đã đầu hàng — Bên Đỏ chiến thắng!'
  }
  if (store.gameStatus === 'checkmate') {
    const winner = getOppositeSide(store.currentPlayer)
    if (store.gameMode === 'puzzle') {
      return winner === 'red'
        ? `🎉 Phá giải thành công ${activePuzzle.value.title}!`
        : '💥 Phá thế thất bại! Hãy thử đi lại hoặc chơi lại thế này.'
    }
    return winner === 'red'
      ? '🏆 Bên Đỏ chiếu bí giành chiến thắng!'
      : '🏆 Bên Đen chiếu bí giành chiến thắng!'
  }
  if (store.gameStatus === 'stalemate') {
    return '🤝 Hòa cờ do hết nước đi hợp lệ (Stalemate)!'
  }
  if (store.gameStatus === 'draw') {
    return '🤝 Hòa cờ do lặp nước liên tiếp!'
  }
  if (store.gameStatus === 'check') {
    return store.currentPlayer === 'red'
      ? '⚠️ Bên Đỏ đang bị CHIẾU TƯỚNG!'
      : '⚠️ Bên Đen đang bị CHIẾU TƯỚNG!'
  }
  if (isBotThinking.value) {
    return '🤖 Máy đang tính toán nước đi...'
  }
  if (store.gameMode === 'puzzle') {
    return `🧩 ${activePuzzle.value.title} — Lượt Bên Đỏ chiếu bí!`
  }
  return store.currentPlayer === 'red' ? '🔴 Lượt đi của Bên Đỏ' : '⚫ Lượt đi của Bên Đen'
})

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function stopClock() {
  if (clockInterval) {
    clearInterval(clockInterval)
    clockInterval = null
  }
}

function resetClocks() {
  stopClock()
  const initialSec = store.timeControl * 60
  redTimeSec.value = initialSec
  blackTimeSec.value = initialSec
  timedOutSide.value = null
  resignedSide.value = null
}

function startClockIfNeeded() {
  if (!hasClock.value || isGameOver.value || store.moveHistory.length === 0) {
    stopClock()
    return
  }
  if (clockInterval) return
  clockInterval = setInterval(() => {
    if (isGameOver.value || !hasClock.value) {
      stopClock()
      return
    }
    if (store.currentPlayer === 'red') {
      redTimeSec.value = Math.max(0, redTimeSec.value - 1)
      if (redTimeSec.value <= 0) {
        handleTimeout('red')
      }
    } else {
      blackTimeSec.value = Math.max(0, blackTimeSec.value - 1)
      if (blackTimeSec.value <= 0) {
        handleTimeout('black')
      }
    }
  }, 1000)
}

function handleTimeout(loser: Side) {
  clearTimers()
  timedOutSide.value = loser
  isVictoryModalOpen.value = true
  if (store.gameMode === 'vs_bot') {
    store.recordResult(loser === store.humanSide ? 'loss' : 'win')
  }
  playSound('gameover', store.soundEnabled)
}

function clearTimers() {
  if (botTimer) {
    clearTimeout(botTimer)
    botTimer = null
  }
  if (gameOverSoundTimer) {
    clearTimeout(gameOverSoundTimer)
    gameOverSoundTimer = null
  }
  stopClock()
  isBotThinking.value = false
}

function isHumanTurn(): boolean {
  if (store.gameMode === 'puzzle') return store.currentPlayer === 'red'
  if (store.gameMode === 'vs_bot') return store.currentPlayer === store.humanSide
  return true
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
  hintMove.value = null

  if (nextStatus === 'check' || nextStatus === 'checkmate') {
    playSound('check', store.soundEnabled)
  } else if (capturedPiece) {
    playSound('capture', store.soundEnabled)
  } else {
    playSound('move', store.soundEnabled)
  }

  if (nextStatus === 'checkmate' || nextStatus === 'stalemate' || nextStatus === 'draw') {
    stopClock()
    isVictoryModalOpen.value = true
    if (store.gameMode === 'vs_bot') {
      if (nextStatus === 'checkmate') {
        const winner = getOppositeSide(nextPlayer)
        store.recordResult(winner === store.humanSide ? 'win' : 'loss')
      } else {
        store.recordResult('draw')
      }
    } else if (store.gameMode === 'puzzle' && nextStatus === 'checkmate') {
      const winner = getOppositeSide(nextPlayer)
      if (winner === 'red') {
        store.markPuzzleSolved(activePuzzle.value.id)
      }
    }
    gameOverSoundTimer = setTimeout(() => {
      playSound('gameover', store.soundEnabled)
    }, 350)
  } else {
    startClockIfNeeded()
  }
}

function requestHint() {
  if (isGameOver.value || isBotThinking.value || !isHumanTurn()) return
  const searchLevel: BotDifficulty = store.gameMode === 'puzzle' ? 'hard' : 'medium'
  const suggested = findBestMove(store.boardState, store.currentPlayer, searchLevel)
  if (!suggested) return

  hintMove.value = {
    from: { ...suggested.piece.position },
    to: { ...suggested.to },
    notation: formatNotation(suggested.piece, suggested.piece.position, suggested.to),
  }
  selectedPiece.value = suggested.piece
  legalMoves.value = getLegalMovesForPiece(suggested.piece, store.boardState)
}

function handleSquareClick(pos: Position) {
  if (isGameOver.value || isBotThinking.value || !isHumanTurn()) return

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

function loadPuzzle(index: number) {
  clearTimers()
  const safeIndex = Math.max(0, Math.min(XIANGQI_PUZZLES.length - 1, index))
  activePuzzleIndex.value = safeIndex
  const puzzle = XIANGQI_PUZZLES[safeIndex]
  store.boardState = cloneBoardState(puzzle.boardState)
  store.currentPlayer = 'red'
  store.moveHistory = []
  store.gameStatus = 'ongoing'
  selectedPiece.value = null
  legalMoves.value = []
  hintMove.value = null
  showPuzzleHint.value = false
  manualFlipped.value = false
  isVictoryModalOpen.value = false
  timedOutSide.value = null
  resignedSide.value = null
}

function handleNextPuzzle() {
  const nextIndex = (activePuzzleIndex.value + 1) % XIANGQI_PUZZLES.length
  loadPuzzle(nextIndex)
}

function handleNewGame() {
  clearTimers()
  selectedPiece.value = null
  legalMoves.value = []
  hintMove.value = null
  isVictoryModalOpen.value = false
  if (store.gameMode === 'puzzle') {
    loadPuzzle(activePuzzleIndex.value)
    return
  }
  store.resetMatch()
  resetClocks()
}

function handleResign() {
  if (isGameOver.value || store.gameMode === 'puzzle') return
  clearTimers()
  const loser: Side = store.gameMode === 'vs_bot' ? store.humanSide : store.currentPlayer
  resignedSide.value = loser
  isVictoryModalOpen.value = true
  if (store.gameMode === 'vs_bot') {
    store.recordResult('loss')
  }
  playSound('gameover', store.soundEnabled)
}

function handleUndo() {
  if (store.moveHistory.length === 0) return
  clearTimers()

  const isBotGame = store.gameMode === 'vs_bot' || store.gameMode === 'puzzle'
  const playerSide: Side = store.gameMode === 'puzzle' ? 'red' : store.humanSide
  const stepsBack =
    isBotGame && store.currentPlayer === playerSide && store.moveHistory.length >= 2 ? 2 : 1

  const nextHistory = store.moveHistory.slice(0, Math.max(0, store.moveHistory.length - stepsBack))
  const baseBoard = store.gameMode === 'puzzle' ? activePuzzle.value.boardState : undefined
  const nextBoard = replayHistory(nextHistory, baseBoard)
  const lastRecord = nextHistory[nextHistory.length - 1]
  const nextPlayer: Side = lastRecord ? getOppositeSide(lastRecord.side) : 'red'

  store.moveHistory = nextHistory
  store.boardState = nextBoard
  store.currentPlayer = nextPlayer
  store.gameStatus = getGameStatus(nextPlayer, nextBoard)
  selectedPiece.value = null
  legalMoves.value = []
  hintMove.value = null
  isVictoryModalOpen.value = false
  timedOutSide.value = null
  resignedSide.value = null
  startClockIfNeeded()
}

function setMode(mode: GameMode) {
  if (store.gameMode === mode) return
  store.gameMode = mode
  if (mode === 'puzzle') {
    loadPuzzle(activePuzzleIndex.value)
  } else {
    handleNewGame()
  }
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

function setTimeControl(minutes: TimeControlMinutes) {
  if (store.timeControl === minutes) return
  store.timeControl = minutes
  handleNewGame()
}

// Tự động cho Bot suy nghĩ khi tới lượt máy (vs_bot hoặc puzzle)
watch(
  () =>
    [
      store.currentPlayer,
      store.gameMode,
      store.humanSide,
      store.gameStatus,
      timedOutSide.value,
      resignedSide.value,
    ] as const,
  ([currentPlayer, mode, humanSide, status, timedOut, resigned]) => {
    if (botTimer) {
      clearTimeout(botTimer)
      botTimer = null
    }
    if (timedOut !== null || resigned !== null) {
      isBotThinking.value = false
      return
    }

    const activeStatus = status === 'ongoing' || status === 'check'
    const shouldBotPlay =
      activeStatus &&
      ((mode === 'vs_bot' && currentPlayer !== humanSide) ||
        (mode === 'puzzle' && currentPlayer === 'black'))

    if (!shouldBotPlay) {
      isBotThinking.value = false
      return
    }

    const aiDifficulty: BotDifficulty = mode === 'puzzle' ? 'hard' : store.botDifficulty
    isBotThinking.value = true
    botTimer = setTimeout(() => {
      const best = findBestMove(store.boardState, currentPlayer, aiDifficulty)
      isBotThinking.value = false
      if (best) {
        executeMove(best.piece, best.to)
      }
    }, 360)
  },
  { immediate: true },
)

onMounted(() => {
  if (store.gameMode === 'puzzle') {
    loadPuzzle(activePuzzleIndex.value)
  } else {
    resetClocks()
  }
})

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
          <p>Xiangqi chuẩn luật · AI Minimax Alpha-Beta · Cờ Thế Tàn Cuộc</p>
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
          'is-check': store.gameStatus === 'check' && !isGameOver,
          'is-over': isGameOver,
        }"
      >
        <span>{{ statusBanner }}</span>
        <span class="turn-counter">Nước: {{ store.moveHistory.length }}</span>
      </div>

      <!-- Đồng hồ bấm giờ (khi bật giới hạn thời gian) -->
      <div
        v-if="hasClock"
        class="clock-bar"
      >
        <div
          class="clock-chip red"
          :class="{
            active: !isGameOver && store.currentPlayer === 'red',
            low: redTimeSec <= 30 && redTimeSec > 0,
          }"
        >
          <span class="clock-label">🔴 Đỏ</span>
          <strong class="clock-time">{{ formatClock(redTimeSec) }}</strong>
        </div>
        <span class="clock-vs">⏱️ {{ store.timeControl }} PHÚT</span>
        <div
          class="clock-chip black"
          :class="{
            active: !isGameOver && store.currentPlayer === 'black',
            low: blackTimeSec <= 30 && blackTimeSec > 0,
          }"
        >
          <span class="clock-label">⚫ Đen</span>
          <strong class="clock-time">{{ formatClock(blackTimeSec) }}</strong>
        </div>
      </div>

      <div class="chess-grid">
        <section class="board-column">
          <!-- Thanh Đánh Giá Thế Trận (Evaluation Bar) -->
          <div class="eval-widget">
            <div class="eval-meta">
              <span>🔴 Đỏ {{ redAdvantagePercent }}%</span>
              <strong class="eval-score">{{ evalScoreLabel }}</strong>
              <span>{{ 100 - redAdvantagePercent }}% Đen ⚫</span>
            </div>
            <div class="eval-track">
              <div
                class="eval-red-fill"
                :style="{ width: `${redAdvantagePercent}%` }"
              />
            </div>
          </div>

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
            :hint-move="hintMove"
            :flipped="isBoardFlipped"
            @square-click="handleSquareClick"
          />

          <div
            v-if="hintMove"
            class="hint-banner"
          >
            💡 Gợi ý AI: <strong>{{ hintMove.notation }}</strong> (đã tô sáng tím trên bàn cờ)
          </div>

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
                <button
                  type="button"
                  :class="{ active: store.gameMode === 'puzzle' }"
                  @click="setMode('puzzle')"
                >
                  🧩 Cờ Thế
                </button>
              </div>
            </div>

            <!-- Danh sách Cờ Thế Tàn Cuộc -->
            <div
              v-if="store.gameMode === 'puzzle'"
              class="puzzle-panel"
            >
              <div class="puzzle-header-row">
                <span class="setting-label">Chọn thế cờ kinh điển</span>
                <span class="puzzle-progress">
                  Đã giải {{ store.solvedPuzzleIds.length }}/{{ XIANGQI_PUZZLES.length }}
                </span>
              </div>

              <div class="puzzle-list">
                <button
                  v-for="(pz, idx) in XIANGQI_PUZZLES"
                  :key="pz.id"
                  type="button"
                  class="puzzle-btn"
                  :class="{
                    active: activePuzzleIndex === idx,
                    solved: store.solvedPuzzleIds.includes(pz.id),
                  }"
                  @click="loadPuzzle(idx)"
                >
                  <span class="pz-name">
                    {{ store.solvedPuzzleIds.includes(pz.id) ? '✅ ' : '♟️ ' }}{{ pz.title }}
                  </span>
                  <span class="pz-diff">{{ pz.difficulty }}</span>
                </button>
              </div>

              <p class="puzzle-desc">
                {{ activePuzzle.description }}
              </p>

              <button
                type="button"
                class="puzzle-clue-btn"
                @click="showPuzzleHint = !showPuzzleHint"
              >
                {{ showPuzzleHint ? '🙈 Ẩn manh mối' : '🔍 Xem manh mối thế cờ' }}
              </button>

              <p
                v-if="showPuzzleHint"
                class="puzzle-clue-box"
              >
                {{ activePuzzle.hint }}
              </p>
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

            <div
              v-if="store.gameMode !== 'puzzle'"
              class="setting-group"
            >
              <span class="setting-label">Đồng hồ bấm giờ</span>
              <div class="segmented">
                <button
                  type="button"
                  :class="{ active: store.timeControl === 0 }"
                  @click="setTimeControl(0)"
                >
                  ∞ Tự do
                </button>
                <button
                  type="button"
                  :class="{ active: store.timeControl === 5 }"
                  @click="setTimeControl(5)"
                >
                  5 phút
                </button>
                <button
                  type="button"
                  :class="{ active: store.timeControl === 10 }"
                  @click="setTimeControl(10)"
                >
                  10 phút
                </button>
              </div>
            </div>

            <div class="action-buttons three-cols">
              <button
                type="button"
                class="btn-secondary"
                :disabled="isGameOver || isBotThinking || !isHumanTurn()"
                title="AI gợi ý nước đi tối ưu"
                @click="requestHint"
              >
                💡 Gợi ý
              </button>
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
                {{ store.gameMode === 'puzzle' ? '🔄 Thử lại' : '🔄 Ván mới' }}
              </button>
            </div>

            <button
              v-if="store.gameMode !== 'puzzle' && !isGameOver && store.moveHistory.length > 0"
              type="button"
              class="btn-resign"
              @click="handleResign"
            >
              🏳️ Xin thua / Đầu hàng
            </button>
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

    <!-- Modal Kết thúc ván đấu -->
    <div
      v-if="isVictoryModalOpen && isGameOver"
      class="victory-backdrop"
      @click.self="isVictoryModalOpen = false"
    >
      <div
        class="victory-dialog glass-card"
        role="dialog"
        aria-modal="true"
      >
        <div class="victory-trophy">
          {{ store.gameStatus === 'checkmate' || timedOutSide || resignedSide ? '🏆' : '🤝' }}
        </div>
        <h2>{{ statusBanner }}</h2>
        <p class="victory-meta">
          Tổng cộng <strong>{{ store.moveHistory.length }}</strong> nước đi · Quân Đỏ ăn {{ capturedByRed.length }} · Quân Đen ăn {{ capturedByBlack.length }}
        </p>
        <div class="victory-actions">
          <button
            v-if="store.gameMode === 'puzzle'"
            type="button"
            class="btn-primary"
            @click="handleNextPuzzle"
          >
            🧩 Thế tiếp theo →
          </button>
          <button
            v-else
            type="button"
            class="btn-primary"
            @click="handleNewGame"
          >
            🔄 Chơi ván mới
          </button>
          <button
            type="button"
            class="btn-secondary"
            @click="isVictoryModalOpen = false"
          >
            Xem lại bàn cờ
          </button>
        </div>
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
  gap: 0.9rem;
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
  font-size: 0.84rem;
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
  padding: 0.72rem 1.15rem;
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

.clock-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.clock-chip {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.45rem 0.95rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1.5px solid var(--outline);
  min-width: 140px;
  justify-content: space-between;
  transition: var(--transition-fast);
}

.clock-chip.active {
  border-color: var(--primary);
  box-shadow: 0 0 14px var(--primary-glow);
}

.clock-chip.low {
  border-color: var(--danger);
  color: var(--danger);
  animation: clockPulse 0.9s infinite;
}

@keyframes clockPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

.clock-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-dim);
}

.clock-time {
  font-family: 'JetBrains Mono', 'Manrope', monospace;
  font-size: 1.15rem;
  font-weight: 800;
}

.clock-vs {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--text-dim);
}

.chess-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
  gap: 1.25rem;
  align-items: start;
}

.board-column {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.eval-widget {
  max-width: 540px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.eval-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-dim);
}

.eval-score {
  color: var(--primary);
  font-family: 'Manrope', sans-serif;
}

.eval-track {
  height: 8px;
  border-radius: 99px;
  background: #1e293b;
  border: 1px solid var(--outline);
  overflow: hidden;
}

.eval-red-fill {
  height: 100%;
  background: linear-gradient(90deg, #dc2626, #f97316);
  transition: width 0.35s ease;
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
  gap: 0.35rem;
  background: var(--bg-sidebar);
  padding: 0.25rem;
  border-radius: 12px;
  border: 1px solid var(--outline);
}

.segmented button {
  flex: 1;
  padding: 0.46rem 0.4rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
}

.segmented button.active {
  background: var(--primary);
  color: var(--text-inverse);
}

.puzzle-panel {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.puzzle-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.puzzle-progress {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--success);
}

.puzzle-list {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
}

.puzzle-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.52rem 0.7rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: var(--transition-fast);
}

.puzzle-btn.active {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
}

.puzzle-btn.solved .pz-diff {
  color: var(--success);
}

.pz-diff {
  font-size: 0.7rem;
  color: var(--text-dim);
  white-space: nowrap;
}

.puzzle-desc {
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--text-dim);
}

.puzzle-clue-btn {
  align-self: flex-start;
  padding: 0.36rem 0.7rem;
  border-radius: 8px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-glow);
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.puzzle-clue-box {
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  background: var(--bg-sidebar);
  border: 1px dashed var(--accent);
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text);
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
  margin-top: 0.25rem;
}

.action-buttons.three-cols {
  grid-template-columns: repeat(3, 1fr);
}

.btn-resign {
  width: 100%;
  padding: 0.55rem;
  border-radius: 10px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  color: var(--danger);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.hint-banner {
  max-width: 548px;
  width: 100%;
  margin: 0 auto;
  padding: 0.55rem 0.9rem;
  border-radius: 12px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-glow);
  color: var(--text);
  font-size: 0.84rem;
  text-align: center;
}

.victory-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(3, 8, 20, 0.72);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.victory-dialog {
  width: 100%;
  max-width: 430px;
  padding: 2rem 1.6rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.victory-trophy {
  font-size: 3.6rem;
}

.victory-dialog h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.35rem;
  color: var(--primary);
}

.victory-meta {
  font-size: 0.88rem;
  color: var(--text-dim);
}

.victory-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  margin-top: 0.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.7rem 0.5rem;
  border-radius: 12px;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 0.86rem;
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
  .chess-page {
    padding-bottom: 4.5rem;
  }

  .chess-grid {
    grid-template-columns: 1fr;
  }

  .title-block {
    order: 3;
    flex-basis: 100%;
  }
}
</style>
