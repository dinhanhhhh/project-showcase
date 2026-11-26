import {
  BOARD_FILES,
  BOARD_RANKS,
  PIECE_NAMES_VI,
  PIECE_VALUES,
  createInitialBoardState,
} from './constants'
import type {
  BoardState,
  BotDifficulty,
  BotMove,
  GameStatus,
  MoveRecord,
  Piece,
  Position,
  Side,
} from './types'

export function isSamePosition(a: Position, b: Position): boolean {
  return a.file === b.file && a.rank === b.rank
}

export function getOppositeSide(side: Side): Side {
  return side === 'red' ? 'black' : 'red'
}

export function getPieceAt(boardState: BoardState, pos: Position): Piece | undefined {
  return boardState.pieces.find((p) => isSamePosition(p.position, pos))
}

function isWithinBoard(pos: Position): boolean {
  return pos.file >= 0 && pos.file < BOARD_FILES && pos.rank >= 0 && pos.rank < BOARD_RANKS
}

function isRedPalace(pos: Position): boolean {
  return pos.file >= 3 && pos.file <= 5 && pos.rank >= 7 && pos.rank <= 9
}

function isBlackPalace(pos: Position): boolean {
  return pos.file >= 3 && pos.file <= 5 && pos.rank >= 0 && pos.rank <= 2
}

function isRedTerritory(rank: number): boolean {
  return rank >= 5
}

function getGeneralMoves(piece: Piece, boardState: BoardState): Position[] {
  const moves: Position[] = []
  const { file, rank } = piece.position
  const deltas: ReadonlyArray<[number, number]> = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]
  const palaceCheck = piece.side === 'red' ? isRedPalace : isBlackPalace

  for (const [df, dr] of deltas) {
    const nextPos: Position = { file: file + df, rank: rank + dr }
    if (palaceCheck(nextPos)) {
      moves.push(nextPos)
    }
  }

  // Luật lộ mặt tướng (Flying General)
  const enemyGeneral = boardState.pieces.find(
    (p) => p.type === 'general' && p.side !== piece.side,
  )
  if (enemyGeneral && enemyGeneral.position.file === file) {
    const startRank = Math.min(rank, enemyGeneral.position.rank) + 1
    const endRank = Math.max(rank, enemyGeneral.position.rank)
    let blockerFound = false
    for (let r = startRank; r < endRank; r++) {
      if (getPieceAt(boardState, { file, rank: r })) {
        blockerFound = true
        break
      }
    }
    if (!blockerFound) {
      moves.push({ ...enemyGeneral.position })
    }
  }

  return moves
}

function getAdvisorMoves(piece: Piece): Position[] {
  const moves: Position[] = []
  const { file, rank } = piece.position
  const deltas: ReadonlyArray<[number, number]> = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]
  const palaceCheck = piece.side === 'red' ? isRedPalace : isBlackPalace

  for (const [df, dr] of deltas) {
    const nextPos: Position = { file: file + df, rank: rank + dr }
    if (palaceCheck(nextPos)) {
      moves.push(nextPos)
    }
  }
  return moves
}

function getElephantMoves(piece: Piece, boardState: BoardState): Position[] {
  const moves: Position[] = []
  const { file, rank } = piece.position
  const deltas: ReadonlyArray<[number, number]> = [
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2],
  ]

  for (const [df, dr] of deltas) {
    const nextPos: Position = { file: file + df, rank: rank + dr }
    const eyePos: Position = { file: file + df / 2, rank: rank + dr / 2 }
    const crossesRiver = piece.side === 'red' ? nextPos.rank < 5 : nextPos.rank > 4

    if (isWithinBoard(nextPos) && !crossesRiver && !getPieceAt(boardState, eyePos)) {
      moves.push(nextPos)
    }
  }
  return moves
}

function getHorseMoves(piece: Piece, boardState: BoardState): Position[] {
  const moves: Position[] = []
  const { file, rank } = piece.position
  const deltas: ReadonlyArray<[number, number]> = [
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
  ]

  for (const [df, dr] of deltas) {
    const nextPos: Position = { file: file + df, rank: rank + dr }
    const legPos: Position =
      Math.abs(df) === 2
        ? { file: file + df / 2, rank }
        : { file, rank: rank + dr / 2 }

    if (isWithinBoard(nextPos) && !getPieceAt(boardState, legPos)) {
      moves.push(nextPos)
    }
  }
  return moves
}

function getChariotMoves(piece: Piece, boardState: BoardState): Position[] {
  const moves: Position[] = []
  const { file, rank } = piece.position
  const directions: ReadonlyArray<[number, number]> = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]

  for (const [df, dr] of directions) {
    for (let step = 1; step < BOARD_RANKS; step++) {
      const nextPos: Position = { file: file + step * df, rank: rank + step * dr }
      if (!isWithinBoard(nextPos)) break
      const target = getPieceAt(boardState, nextPos)
      if (target) {
        if (target.side !== piece.side) {
          moves.push(nextPos)
        }
        break
      }
      moves.push(nextPos)
    }
  }
  return moves
}

function getCannonMoves(piece: Piece, boardState: BoardState): Position[] {
  const moves: Position[] = []
  const { file, rank } = piece.position
  const directions: ReadonlyArray<[number, number]> = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]

  for (const [df, dr] of directions) {
    let hasScreen = false
    for (let step = 1; step < BOARD_RANKS; step++) {
      const nextPos: Position = { file: file + step * df, rank: rank + step * dr }
      if (!isWithinBoard(nextPos)) break
      const target = getPieceAt(boardState, nextPos)

      if (!hasScreen) {
        if (target) {
          hasScreen = true
        } else {
          moves.push(nextPos)
        }
      } else if (target) {
        if (target.side !== piece.side) {
          moves.push(nextPos)
        }
        break
      }
    }
  }
  return moves
}

function getSoldierMoves(piece: Piece): Position[] {
  const moves: Position[] = []
  const { file, rank } = piece.position
  const forward = piece.side === 'red' ? -1 : 1

  moves.push({ file, rank: rank + forward })

  const acrossRiver =
    piece.side === 'red' ? !isRedTerritory(rank) : isRedTerritory(rank)
  if (acrossRiver) {
    moves.push({ file: file - 1, rank })
    moves.push({ file: file + 1, rank })
  }

  return moves.filter(isWithinBoard)
}

export function getPseudoLegalMoves(piece: Piece, boardState: BoardState): Position[] {
  switch (piece.type) {
    case 'general':
      return getGeneralMoves(piece, boardState)
    case 'advisor':
      return getAdvisorMoves(piece)
    case 'elephant':
      return getElephantMoves(piece, boardState)
    case 'horse':
      return getHorseMoves(piece, boardState)
    case 'chariot':
      return getChariotMoves(piece, boardState)
    case 'cannon':
      return getCannonMoves(piece, boardState)
    case 'soldier':
      return getSoldierMoves(piece)
  }
}

export function applyMove(boardState: BoardState, piece: Piece, to: Position): BoardState {
  const newPieces = boardState.pieces
    .filter((p) => !isSamePosition(p.position, to))
    .map((p) => (p.id === piece.id ? { ...p, position: { ...to } } : p))
  return { pieces: newPieces }
}

export function isKingInCheck(side: Side, boardState: BoardState): boolean {
  const king = boardState.pieces.find((p) => p.type === 'general' && p.side === side)
  if (!king) return false

  const opponent = getOppositeSide(side)
  for (const piece of boardState.pieces) {
    if (piece.side !== opponent) continue
    const moves = getPseudoLegalMoves(piece, boardState)
    if (moves.some((m) => isSamePosition(m, king.position))) {
      return true
    }
  }
  return false
}

export function getLegalMovesForPiece(piece: Piece, boardState: BoardState): Position[] {
  const pseudoMoves = getPseudoLegalMoves(piece, boardState)
  const legalMoves: Position[] = []

  for (const move of pseudoMoves) {
    const target = getPieceAt(boardState, move)
    if (target && target.side === piece.side) continue

    const nextBoard = applyMove(boardState, piece, move)
    if (!isKingInCheck(piece.side, nextBoard)) {
      legalMoves.push(move)
    }
  }
  return legalMoves
}

export function hasLegalMoves(side: Side, boardState: BoardState): boolean {
  for (const piece of boardState.pieces) {
    if (piece.side !== side) continue
    if (getLegalMovesForPiece(piece, boardState).length > 0) {
      return true
    }
  }
  return false
}

export function getGameStatus(currentPlayer: Side, boardState: BoardState): GameStatus {
  const hasGeneral = boardState.pieces.some(
    (p) => p.side === currentPlayer && p.type === 'general',
  )
  if (!hasGeneral) return 'checkmate'

  const inCheck = isKingInCheck(currentPlayer, boardState)
  const canMove = hasLegalMoves(currentPlayer, boardState)

  if (!canMove) {
    return inCheck ? 'checkmate' : 'stalemate'
  }
  return inCheck ? 'check' : 'ongoing'
}

export function formatNotation(piece: Piece, from: Position, to: Position): string {
  const pieceName = PIECE_NAMES_VI[piece.type]
  const fromFile = piece.side === 'red' ? 9 - from.file : from.file + 1
  const toFile = piece.side === 'red' ? 9 - to.file : to.file + 1

  const rankDiff = to.rank - from.rank
  const forwardDir = piece.side === 'red' ? -1 : 1
  const isAdvancing = rankDiff * forwardDir > 0

  if (from.file === to.file) {
    const moveDist = Math.abs(rankDiff)
    const dirLabel = isAdvancing ? 'tấn' : 'thoái'
    return `${pieceName} ${fromFile} ${dirLabel} ${moveDist}`
  }

  if (from.rank === to.rank) {
    return `${pieceName} ${fromFile} bình ${toFile}`
  }

  const dirLabel = isAdvancing ? 'tấn' : 'thoái'
  return `${pieceName} ${fromFile} ${dirLabel} ${toFile}`
}

export function isRepetition(moveHistory: readonly MoveRecord[]): boolean {
  if (moveHistory.length < 8) return false

  const n = moveHistory.length
  const m1 = moveHistory[n - 1]
  const m2 = moveHistory[n - 2]
  const m3 = moveHistory[n - 3]
  const m4 = moveHistory[n - 4]
  const m5 = moveHistory[n - 5]
  const m6 = moveHistory[n - 6]

  if (!m1 || !m2 || !m3 || !m4 || !m5 || !m6) return false

  return (
    isSamePosition(m1.from, m5.from) &&
    isSamePosition(m1.to, m5.to) &&
    isSamePosition(m2.from, m6.from) &&
    isSamePosition(m2.to, m6.to) &&
    isSamePosition(m1.from, m3.to) &&
    isSamePosition(m1.to, m3.from) &&
    isSamePosition(m2.from, m4.to) &&
    isSamePosition(m2.to, m4.from)
  )
}

export function replayHistory(history: readonly MoveRecord[]): BoardState {
  let board = createInitialBoardState()
  for (const move of history) {
    const piece = board.pieces.find((p) => p.id === move.piece.id)
    if (piece) {
      board = applyMove(board, piece, move.to)
    }
  }
  return board
}

// =========================================================================
// Bot AI — Minimax + Alpha-Beta Pruning
// =========================================================================

// Bảng giá trị vị trí Tốt theo độ tiến từ sân nhà (row 0) tới cung địch (row 9)
const SOLDIER_ADVANCE_BONUS: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [5, 0, 8, 0, 12, 0, 8, 0, 5],
  [8, 0, 12, 0, 18, 0, 12, 0, 8],
  [25, 32, 38, 42, 46, 42, 38, 32, 25], // Qua sông
  [30, 40, 48, 54, 58, 54, 48, 40, 30],
  [35, 45, 55, 62, 66, 62, 55, 45, 35],
  [30, 40, 50, 58, 60, 58, 50, 40, 30],
  [15, 20, 25, 30, 30, 30, 25, 20, 15],
]

function getPositionalBonus(piece: Piece): number {
  const { file, rank } = piece.position

  if (piece.type === 'soldier') {
    const advanceRow = piece.side === 'red' ? 9 - rank : rank
    return SOLDIER_ADVANCE_BONUS[advanceRow]?.[file] ?? 0
  }

  if (piece.type === 'horse' || piece.type === 'cannon') {
    // Khuyến khích kiểm soát trung tâm (cột 2..6)
    const centerDist = Math.abs(4 - file)
    return Math.max(0, 16 - centerDist * 4)
  }

  if (piece.type === 'chariot') {
    // Khuyến khích xe ra trục dọc thoáng (cột 1, 2, 6, 7, 4)
    return file === 0 || file === 8 ? 0 : 12
  }

  return 0
}

export function evaluateBoard(boardState: BoardState, perspective: Side): number {
  let redScore = 0

  for (const piece of boardState.pieces) {
    const value = PIECE_VALUES[piece.type] + getPositionalBonus(piece)
    if (piece.side === 'red') {
      redScore += value
    } else {
      redScore -= value
    }
  }

  return perspective === 'red' ? redScore : -redScore
}

function collectOrderedMoves(boardState: BoardState, side: Side): BotMove[] {
  const moves: Array<{ move: BotMove; priority: number }> = []

  for (const piece of boardState.pieces) {
    if (piece.side !== side) continue
    const legal = getLegalMovesForPiece(piece, boardState)
    for (const to of legal) {
      const target = getPieceAt(boardState, to)
      const priority = target ? PIECE_VALUES[target.type] * 10 - PIECE_VALUES[piece.type] : 0
      moves.push({ move: { piece, to }, priority })
    }
  }

  moves.sort((a, b) => b.priority - a.priority)
  return moves.map((entry) => entry.move)
}

function minimax(
  boardState: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiSide: Side,
): number {
  const turnSide = isMaximizing ? aiSide : getOppositeSide(aiSide)
  const status = getGameStatus(turnSide, boardState)

  if (status === 'checkmate') {
    return isMaximizing ? -100000 - depth : 100000 + depth
  }
  if (status === 'stalemate') {
    return 0
  }
  if (depth === 0) {
    return evaluateBoard(boardState, aiSide)
  }

  const orderedMoves = collectOrderedMoves(boardState, turnSide)
  if (orderedMoves.length === 0) return 0

  let currentAlpha = alpha
  let currentBeta = beta

  if (isMaximizing) {
    let bestVal = -Infinity
    for (const candidate of orderedMoves) {
      const nextBoard = applyMove(boardState, candidate.piece, candidate.to)
      const val = minimax(nextBoard, depth - 1, currentAlpha, currentBeta, false, aiSide)
      if (val > bestVal) bestVal = val
      if (bestVal > currentAlpha) currentAlpha = bestVal
      if (currentBeta <= currentAlpha) break
    }
    return bestVal
  }

  let bestVal = Infinity
  for (const candidate of orderedMoves) {
    const nextBoard = applyMove(boardState, candidate.piece, candidate.to)
    const val = minimax(nextBoard, depth - 1, currentAlpha, currentBeta, true, aiSide)
    if (val < bestVal) bestVal = val
    if (bestVal < currentBeta) currentBeta = bestVal
    if (currentBeta <= currentAlpha) break
  }
  return bestVal
}

export function findBestMove(
  boardState: BoardState,
  aiSide: Side,
  difficulty: BotDifficulty = 'medium',
  rng: () => number = Math.random,
): BotMove | null {
  const depth = difficulty === 'easy' ? 1 : difficulty === 'hard' ? 3 : 2
  const jitter = difficulty === 'easy' ? 25 : difficulty === 'medium' ? 5 : 0

  const rootMoves = collectOrderedMoves(boardState, aiSide)
  if (rootMoves.length === 0) return null

  let bestMove: BotMove = rootMoves[0]
  let bestScore = -Infinity
  let alpha = -Infinity
  const beta = Infinity

  for (const candidate of rootMoves) {
    const nextBoard = applyMove(boardState, candidate.piece, candidate.to)
    const rawScore = minimax(nextBoard, depth - 1, alpha, beta, false, aiSide)
    const noisyScore = jitter > 0 ? rawScore + (rng() - 0.5) * jitter : rawScore

    if (noisyScore > bestScore) {
      bestScore = noisyScore
      bestMove = candidate
    }
    if (rawScore > alpha) {
      alpha = rawScore
    }
  }

  return bestMove
}
