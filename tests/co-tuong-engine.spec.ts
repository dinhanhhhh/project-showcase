import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useCoTuongStore } from '@/stores/coTuong'
import { XIANGQI_PUZZLES, cloneBoardState, createInitialBoardState } from '@/views/co-tuong/constants'
import {
  applyMove,
  calculateRedAdvantagePercent,
  exportMoveNotationText,
  findBestMove,
  formatNotation,
  getGameStatus,
  getLegalMovesForPiece,
  getPieceAt,
  isKingInCheck,
  isRepetition,
  replayHistory,
} from '@/views/co-tuong/engine'
import type { BoardState, MoveRecord, Piece } from '@/views/co-tuong/types'

describe('Co Tuong Engine', () => {
  it('initializes 32 pieces and prevents horse from jumping when blocked', () => {
    const board = createInitialBoardState()
    expect(board.pieces).toHaveLength(32)

    const redHorse = getPieceAt(board, { file: 1, rank: 9 })
    expect(redHorse).toBeDefined()
    const legal = getLegalMovesForPiece(redHorse!, board)
    // Đầu ván Mã (1,9) chỉ nhảy được 2 ô (0,7) và (2,7)
    expect(legal).toHaveLength(2)
    expect(legal).toEqual(
      expect.arrayContaining([
        { file: 0, rank: 7 },
        { file: 2, rank: 7 },
      ]),
    )
  })

  it('enforces flying general rule (cannot expose general face-to-face)', () => {
    const board: BoardState = {
      pieces: [
        { id: 'r_gen', side: 'red', type: 'general', position: { file: 4, rank: 9 } },
        { id: 'b_gen', side: 'black', type: 'general', position: { file: 4, rank: 0 } },
        { id: 'r_chariot', side: 'red', type: 'chariot', position: { file: 4, rank: 5 } },
      ],
    }

    const chariot = board.pieces[2]
    const legal = getLegalMovesForPiece(chariot, board)
    // Xe ở cột 4 không được rời cột 4 vì sẽ làm 2 Tướng đối mặt nhau
    expect(legal.every((m) => m.file === 4)).toBe(true)
  })

  it('detects check and checkmate accurately', () => {
    // Thế chiếu bí Song Xa kinh điển: 2 Xe đỏ khóa chặt hàng 0 và hàng 1
    const checkmateBoard: BoardState = {
      pieces: [
        { id: 'b_gen', side: 'black', type: 'general', position: { file: 4, rank: 0 } },
        { id: 'r_gen', side: 'red', type: 'general', position: { file: 3, rank: 9 } },
        { id: 'r_chariot_1', side: 'red', type: 'chariot', position: { file: 0, rank: 0 } },
        { id: 'r_chariot_2', side: 'red', type: 'chariot', position: { file: 0, rank: 1 } },
      ],
    }

    expect(isKingInCheck('black', checkmateBoard)).toBe(true)
    expect(getGameStatus('black', checkmateBoard)).toBe('checkmate')
  })

  it('formats Vietnamese notation correctly for advancing and retreating', () => {
    const redSoldier: Piece = {
      id: 'r_s',
      side: 'red',
      type: 'soldier',
      position: { file: 4, rank: 6 },
    }
    expect(formatNotation(redSoldier, { file: 4, rank: 6 }, { file: 4, rank: 5 })).toBe(
      'Tốt 5 tấn 1',
    )

    const blackChariot: Piece = {
      id: 'b_c',
      side: 'black',
      type: 'chariot',
      position: { file: 0, rank: 2 },
    }
    expect(formatNotation(blackChariot, { file: 0, rank: 2 }, { file: 0, rank: 0 })).toBe(
      'Xe 1 thoái 2',
    )
    expect(formatNotation(blackChariot, { file: 0, rank: 2 }, { file: 3, rank: 2 })).toBe(
      'Xe 1 bình 4',
    )
  })

  it('finds winning capture move via minimax AI', () => {
    const board: BoardState = {
      pieces: [
        { id: 'r_gen', side: 'red', type: 'general', position: { file: 3, rank: 9 } },
        { id: 'b_gen', side: 'black', type: 'general', position: { file: 5, rank: 0 } },
        { id: 'b_chariot', side: 'black', type: 'chariot', position: { file: 0, rank: 5 } },
        { id: 'r_chariot', side: 'red', type: 'chariot', position: { file: 4, rank: 5 } },
      ],
    }

    const best = findBestMove(board, 'black', 'hard', () => 0.5)
    expect(best).not.toBeNull()
    expect(best?.piece.id).toBe('b_chariot')
    expect(best?.to).toEqual({ file: 4, rank: 5 })

    const after = applyMove(board, best!.piece, best!.to)
    expect(getPieceAt(after, { file: 4, rank: 5 })?.side).toBe('black')
  })

  it('detects 3-fold back-and-forth repetition', () => {
    const dummyRed: Piece = { id: 'r1', side: 'red', type: 'chariot', position: { file: 0, rank: 9 } }
    const dummyBlack: Piece = { id: 'b1', side: 'black', type: 'chariot', position: { file: 0, rank: 0 } }
    const makeRec = (idx: number, side: 'red' | 'black', fromF: number, toF: number): MoveRecord => ({
      moveNumber: Math.floor(idx / 2) + 1,
      side,
      from: { file: fromF, rank: side === 'red' ? 9 : 0 },
      to: { file: toF, rank: side === 'red' ? 9 : 0 },
      piece: side === 'red' ? dummyRed : dummyBlack,
      notation: 'Xe',
    })

    const history: MoveRecord[] = [
      makeRec(0, 'red', 0, 1),
      makeRec(1, 'black', 0, 1),
      makeRec(2, 'red', 1, 0),
      makeRec(3, 'black', 1, 0),
      makeRec(4, 'red', 0, 1),
      makeRec(5, 'black', 0, 1),
      makeRec(6, 'red', 1, 0),
      makeRec(7, 'black', 1, 0),
    ]

    expect(isRepetition(history)).toBe(true)
  })

  it('validates all 6 endgame puzzles have legal start states and forced checkmates', () => {
    expect(XIANGQI_PUZZLES).toHaveLength(6)

    for (const puzzle of XIANGQI_PUZZLES) {
      expect(isKingInCheck('red', puzzle.boardState)).toBe(false)
      expect(isKingInCheck('black', puzzle.boardState)).toBe(false)
      expect(getGameStatus('red', puzzle.boardState)).toBe('ongoing')
    }

    // Thế 1: Song Xa Thác — Xe (7,2) -> (7,0) chiếu bí 1 nước
    const p1 = cloneBoardState(XIANGQI_PUZZLES[0].boardState)
    const p1Chariot = getPieceAt(p1, { file: 7, rank: 2 })!
    const p1After = applyMove(p1, p1Chariot, { file: 7, rank: 0 })
    expect(getGameStatus('black', p1After)).toBe('checkmate')

    // Thế 2: Trọng Pháo Sát Cục — Pháo (2,4) -> (4,4) chiếu bí 1 nước
    const p2 = cloneBoardState(XIANGQI_PUZZLES[1].boardState)
    const p2Cannon = getPieceAt(p2, { file: 2, rank: 4 })!
    const p2After = applyMove(p2, p2Cannon, { file: 4, rank: 4 })
    expect(getGameStatus('black', p2After)).toBe('checkmate')

    // Thế 3: Mã Hậu Pháo — Mã (4,4) -> (5,2) chiếu bí 1 nước
    const p3 = cloneBoardState(XIANGQI_PUZZLES[2].boardState)
    const p3Horse = getPieceAt(p3, { file: 4, rank: 4 })!
    const p3After = applyMove(p3, p3Horse, { file: 5, rank: 2 })
    expect(getGameStatus('black', p3After)).toBe('checkmate')

    // Thế 4: Ngọa Tào Mã — chiếu bí 2 nước (Mã (7,3)->(6,1), Tướng Đen buộc (4,0)->(5,0), Xe (8,4)->(8,0))
    const p4 = cloneBoardState(XIANGQI_PUZZLES[3].boardState)
    const p4Horse = getPieceAt(p4, { file: 7, rank: 3 })!
    const p4Step1 = applyMove(p4, p4Horse, { file: 6, rank: 1 })
    expect(getGameStatus('black', p4Step1)).toBe('check')

    const blackGen = getPieceAt(p4Step1, { file: 4, rank: 0 })!
    const blackGenMoves = getLegalMovesForPiece(blackGen, p4Step1)
    expect(blackGenMoves).toEqual([{ file: 5, rank: 0 }])

    const p4Step2 = applyMove(p4Step1, blackGen, { file: 5, rank: 0 })
    const p4Chariot = getPieceAt(p4Step2, { file: 8, rank: 4 })!
    const p4Mate = applyMove(p4Step2, p4Chariot, { file: 8, rank: 0 })
    expect(getGameStatus('black', p4Mate)).toBe('checkmate')

    // Thế 5: Thiết Môn Thoan — Xe (7,1) -> (4,1) là nước hợp lệ & chiếu bí duy nhất 1 nước
    const p5 = cloneBoardState(XIANGQI_PUZZLES[4].boardState)
    const p5Chariot = getPieceAt(p5, { file: 7, rank: 1 })!
    expect(getLegalMovesForPiece(p5Chariot, p5)).toContainEqual({ file: 4, rank: 1 })
    const p5Hint = findBestMove(p5, 'red', 'hard', () => 0.5)
    expect(p5Hint?.piece.id).toBe('p5_r_chariot')
    expect(p5Hint?.to).toEqual({ file: 4, rank: 1 })
    const p5Mate = applyMove(p5, p5Chariot, { file: 4, rank: 1 })
    expect(getGameStatus('black', p5Mate)).toBe('checkmate')

    // Thế 6: Mượn Tướng Sát — Xe (5,4) -> (5,0) chiếu bí 1 nước
    const p6 = cloneBoardState(XIANGQI_PUZZLES[5].boardState)
    const p6Chariot = getPieceAt(p6, { file: 5, rank: 4 })!
    const p6Mate = applyMove(p6, p6Chariot, { file: 5, rank: 0 })
    expect(getGameStatus('black', p6Mate)).toBe('checkmate')
  })

  it('exports Vietnamese move notation text grouped by full turns cleanly', () => {
    expect(exportMoveNotationText([])).toBe('')

    const redChariot: Piece = { id: 'r_ch', side: 'red', type: 'chariot', position: { file: 0, rank: 9 } }
    const blackChariot: Piece = { id: 'b_ch', side: 'black', type: 'chariot', position: { file: 0, rank: 0 } }
    const moves: MoveRecord[] = [
      {
        moveNumber: 1,
        side: 'red',
        from: { file: 0, rank: 9 },
        to: { file: 0, rank: 8 },
        piece: redChariot,
        notation: 'X9.1',
      },
      {
        moveNumber: 1,
        side: 'black',
        from: { file: 0, rank: 0 },
        to: { file: 1, rank: 0 },
        piece: blackChariot,
        notation: 'X1-2',
      },
      {
        moveNumber: 2,
        side: 'red',
        from: { file: 0, rank: 8 },
        to: { file: 4, rank: 8 },
        piece: redChariot,
        notation: 'X9-5',
      },
    ]

    const exported = exportMoveNotationText(moves)
    expect(exported).toBe('1. Đỏ: X9.1 | Đen: X1-2\n2. Đỏ: X9-5')
  })

  it('supports replayHistory from custom puzzle board and evaluates advantage percentage', () => {
    const startBoard = createInitialBoardState()
    expect(calculateRedAdvantagePercent(startBoard)).toBe(50)

    const p1 = XIANGQI_PUZZLES[0].boardState
    expect(calculateRedAdvantagePercent(p1)).toBeGreaterThan(75)

    const replayedEmpty = replayHistory([], p1)
    expect(replayedEmpty.pieces).toHaveLength(p1.pieces.length)
  })

  it('detects stalemate accurately and returns null from findBestMove when no legal move exists', () => {
    const stalemateBoard: BoardState = {
      pieces: [
        { id: 'r_gen', side: 'red', type: 'general', position: { file: 3, rank: 9 } },
        { id: 'b_gen', side: 'black', type: 'general', position: { file: 5, rank: 0 } },
        { id: 'r_chariot_file', side: 'red', type: 'chariot', position: { file: 4, rank: 5 } },
        { id: 'r_chariot_rank', side: 'red', type: 'chariot', position: { file: 8, rank: 1 } },
      ],
    }

    expect(isKingInCheck('black', stalemateBoard)).toBe(false)
    expect(getGameStatus('black', stalemateBoard)).toBe('stalemate')
    expect(findBestMove(stalemateBoard, 'black', 'medium', () => 0.5)).toBeNull()

    const mateBoard = applyMove(
      cloneBoardState(XIANGQI_PUZZLES[0].boardState),
      getPieceAt(XIANGQI_PUZZLES[0].boardState, { file: 7, rank: 2 })!,
      { file: 7, rank: 0 },
    )
    expect(findBestMove(mateBoard, 'black', 'easy', () => 0.5)).toBeNull()
  })

  it('enforces elephant river boundary and elephant-eye blocking', () => {
    const board: BoardState = {
      pieces: [
        { id: 'r_gen', side: 'red', type: 'general', position: { file: 3, rank: 9 } },
        { id: 'b_gen', side: 'black', type: 'general', position: { file: 5, rank: 0 } },
        { id: 'r_ele', side: 'red', type: 'elephant', position: { file: 2, rank: 5 } },
        { id: 'eye_blocker', side: 'red', type: 'soldier', position: { file: 3, rank: 6 } },
      ],
    }

    const ele = getPieceAt(board, { file: 2, rank: 5 })!
    const moves = getLegalMovesForPiece(ele, board)
    expect(moves).toEqual([{ file: 0, rank: 7 }])
  })

  it('enforces cannon slide and single-screen capture without jumping two pieces', () => {
    const board: BoardState = {
      pieces: [
        { id: 'r_gen', side: 'red', type: 'general', position: { file: 3, rank: 9 } },
        { id: 'b_gen', side: 'black', type: 'general', position: { file: 5, rank: 0 } },
        { id: 'r_can', side: 'red', type: 'cannon', position: { file: 1, rank: 5 } },
        { id: 'b_screen', side: 'black', type: 'soldier', position: { file: 4, rank: 5 } },
        { id: 'b_target', side: 'black', type: 'chariot', position: { file: 7, rank: 5 } },
        { id: 'b_behind', side: 'black', type: 'soldier', position: { file: 8, rank: 5 } },
      ],
    }

    const cannon = getPieceAt(board, { file: 1, rank: 5 })!
    const moves = getLegalMovesForPiece(cannon, board).filter((m) => m.rank === 5)
    expect(moves).toEqual(
      expect.arrayContaining([
        { file: 0, rank: 5 },
        { file: 2, rank: 5 },
        { file: 3, rank: 5 },
        { file: 7, rank: 5 },
      ]),
    )
    expect(moves.some((m) => m.file === 4 || m.file === 8)).toBe(false)
  })

  it('restricts soldier to forward-only before river and allows sideways after river', () => {
    const board: BoardState = {
      pieces: [
        { id: 'r_gen', side: 'red', type: 'general', position: { file: 3, rank: 9 } },
        { id: 'b_gen', side: 'black', type: 'general', position: { file: 5, rank: 0 } },
        { id: 'r_sol_home', side: 'red', type: 'soldier', position: { file: 2, rank: 6 } },
        { id: 'r_sol_crossed', side: 'red', type: 'soldier', position: { file: 6, rank: 3 } },
      ],
    }

    const homeMoves = getLegalMovesForPiece(getPieceAt(board, { file: 2, rank: 6 })!, board)
    expect(homeMoves).toEqual([{ file: 2, rank: 5 }])

    const crossedMoves = getLegalMovesForPiece(getPieceAt(board, { file: 6, rank: 3 })!, board)
    expect(crossedMoves).toHaveLength(3)
    expect(crossedMoves).toEqual(
      expect.arrayContaining([
        { file: 6, rank: 2 },
        { file: 5, rank: 3 },
        { file: 7, rank: 3 },
      ]),
    )
  })

  it('confines advisor to palace and blocks pinned piece from exposing flying general', () => {
    const board: BoardState = {
      pieces: [
        { id: 'r_gen', side: 'red', type: 'general', position: { file: 4, rank: 9 } },
        { id: 'b_gen', side: 'black', type: 'general', position: { file: 4, rank: 0 } },
        { id: 'r_adv', side: 'red', type: 'advisor', position: { file: 3, rank: 7 } },
        { id: 'r_pin', side: 'red', type: 'chariot', position: { file: 4, rank: 5 } },
      ],
    }

    const advisorMoves = getLegalMovesForPiece(getPieceAt(board, { file: 3, rank: 7 })!, board)
    expect(advisorMoves).toEqual([{ file: 4, rank: 8 }])

    const pinnedMoves = getLegalMovesForPiece(getPieceAt(board, { file: 4, rank: 5 })!, board)
    expect(pinnedMoves.length).toBeGreaterThan(0)
    expect(pinnedMoves.every((m) => m.file === 4)).toBe(true)
  })

  it('returns false from isRepetition for short or non-repeating move histories', () => {
    expect(isRepetition([])).toBe(false)
    const piece: Piece = { id: 'r_ch', side: 'red', type: 'chariot', position: { file: 0, rank: 9 } }
    const diverseHistory: MoveRecord[] = Array.from({ length: 8 }, (_, idx) => ({
      moveNumber: Math.floor(idx / 2) + 1,
      side: idx % 2 === 0 ? 'red' : 'black',
      from: { file: idx % 9, rank: 9 },
      to: { file: (idx + 1) % 9, rank: 9 },
      piece,
      notation: `Xe ${idx}`,
    }))
    expect(isRepetition(diverseHistory)).toBe(false)
  })

  it('formats Vietnamese move notation cleanly for vertical and horizontal moves', () => {
    const redChariot: Piece = { id: 'r_ch', side: 'red', type: 'chariot', position: { file: 0, rank: 9 } }
    const advanceNote = formatNotation(redChariot, { file: 0, rank: 9 }, { file: 0, rank: 5 })
    expect(advanceNote.length).toBeGreaterThan(0)
    expect(advanceNote).toContain('X')
  })

  it('persists match stats, puzzle progress, and sound preferences in useCoTuongStore', async () => {
    localStorage.clear()
    const app = createApp({})
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    app.use(pinia)
    setActivePinia(pinia)

    const store = useCoTuongStore()
    store.recordResult('win')
    store.recordResult('draw')
    store.markPuzzleSolved('puzzle-1')
    store.toggleSound()
    store.gameMode = 'puzzle'
    store.boardState = cloneBoardState(XIANGQI_PUZZLES[0].boardState)
    store.resetMatch()
    await nextTick()

    expect(store.stats.wins).toBe(1)
    expect(store.stats.draws).toBe(1)
    expect(store.solvedPuzzleIds).toContain('puzzle-1')
    expect(store.gameStatus).toBe('ongoing')
    expect(store.boardState.pieces).toHaveLength(32)

    const persisted = JSON.parse(localStorage.getItem('vibe_co_tuong') || '{}') as {
      stats?: { wins: number }
      solvedPuzzleIds?: string[]
    }
    expect(persisted.stats?.wins).toBe(1)
    expect(persisted.solvedPuzzleIds).toContain('puzzle-1')
  })
})
