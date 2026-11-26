import { describe, expect, it } from 'vitest'
import { XIANGQI_PUZZLES, cloneBoardState, createInitialBoardState } from '@/views/co-tuong/constants'
import {
  applyMove,
  calculateRedAdvantagePercent,
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

  it('validates all 4 endgame puzzles have legal start states and forced checkmates', () => {
    expect(XIANGQI_PUZZLES).toHaveLength(4)

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
  })

  it('supports replayHistory from custom puzzle board and evaluates advantage percentage', () => {
    const startBoard = createInitialBoardState()
    expect(calculateRedAdvantagePercent(startBoard)).toBe(50)

    const p1 = XIANGQI_PUZZLES[0].boardState
    expect(calculateRedAdvantagePercent(p1)).toBeGreaterThan(75)

    const replayedEmpty = replayHistory([], p1)
    expect(replayedEmpty.pieces).toHaveLength(p1.pieces.length)
  })
})
