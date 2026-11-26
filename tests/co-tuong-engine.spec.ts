import { describe, expect, it } from 'vitest'
import { createInitialBoardState } from '@/views/co-tuong/constants'
import {
  applyMove,
  findBestMove,
  formatNotation,
  getGameStatus,
  getLegalMovesForPiece,
  getPieceAt,
  isKingInCheck,
  isRepetition,
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
})
