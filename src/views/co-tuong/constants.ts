import type { BoardState, Piece, PieceType, Side } from './types'

export const BOARD_FILES = 9
export const BOARD_RANKS = 10

export const PIECE_NAMES_VI: Record<PieceType, string> = {
  general: 'Tướng',
  advisor: 'Sĩ',
  elephant: 'Tượng',
  horse: 'Mã',
  chariot: 'Xe',
  cannon: 'Pháo',
  soldier: 'Tốt',
}

export const PIECE_CHARS: Record<Side, Record<PieceType, string>> = {
  red: {
    general: '帥',
    advisor: '仕',
    elephant: '相',
    horse: '傌',
    chariot: '俥',
    cannon: '炮',
    soldier: '兵',
  },
  black: {
    general: '將',
    advisor: '士',
    elephant: '象',
    horse: '馬',
    chariot: '車',
    cannon: '砲',
    soldier: '卒',
  },
}

export const PIECE_VALUES: Record<PieceType, number> = {
  soldier: 100,
  advisor: 200,
  elephant: 200,
  horse: 400,
  cannon: 450,
  chariot: 900,
  general: 10000,
}

function createPiece(
  id: string,
  side: Side,
  type: PieceType,
  file: number,
  rank: number,
): Piece {
  return {
    id,
    side,
    type,
    position: { file, rank },
  }
}

export function createInitialBoardState(): BoardState {
  return {
    pieces: [
      // Quân Đỏ (phía dưới: rank 6..9, tiến về rank 0)
      createPiece('r_chariot_1', 'red', 'chariot', 0, 9),
      createPiece('r_horse_1', 'red', 'horse', 1, 9),
      createPiece('r_elephant_1', 'red', 'elephant', 2, 9),
      createPiece('r_advisor_1', 'red', 'advisor', 3, 9),
      createPiece('r_general_1', 'red', 'general', 4, 9),
      createPiece('r_advisor_2', 'red', 'advisor', 5, 9),
      createPiece('r_elephant_2', 'red', 'elephant', 6, 9),
      createPiece('r_horse_2', 'red', 'horse', 7, 9),
      createPiece('r_chariot_2', 'red', 'chariot', 8, 9),
      createPiece('r_cannon_1', 'red', 'cannon', 1, 7),
      createPiece('r_cannon_2', 'red', 'cannon', 7, 7),
      createPiece('r_soldier_1', 'red', 'soldier', 0, 6),
      createPiece('r_soldier_2', 'red', 'soldier', 2, 6),
      createPiece('r_soldier_3', 'red', 'soldier', 4, 6),
      createPiece('r_soldier_4', 'red', 'soldier', 6, 6),
      createPiece('r_soldier_5', 'red', 'soldier', 8, 6),

      // Quân Đen (phía trên: rank 0..3, tiến về rank 9)
      createPiece('b_chariot_1', 'black', 'chariot', 0, 0),
      createPiece('b_horse_1', 'black', 'horse', 1, 0),
      createPiece('b_elephant_1', 'black', 'elephant', 2, 0),
      createPiece('b_advisor_1', 'black', 'advisor', 3, 0),
      createPiece('b_general_1', 'black', 'general', 4, 0),
      createPiece('b_advisor_2', 'black', 'advisor', 5, 0),
      createPiece('b_elephant_2', 'black', 'elephant', 6, 0),
      createPiece('b_horse_2', 'black', 'horse', 7, 0),
      createPiece('b_chariot_2', 'black', 'chariot', 8, 0),
      createPiece('b_cannon_1', 'black', 'cannon', 1, 2),
      createPiece('b_cannon_2', 'black', 'cannon', 7, 2),
      createPiece('b_soldier_1', 'black', 'soldier', 0, 3),
      createPiece('b_soldier_2', 'black', 'soldier', 2, 3),
      createPiece('b_soldier_3', 'black', 'soldier', 4, 3),
      createPiece('b_soldier_4', 'black', 'soldier', 6, 3),
      createPiece('b_soldier_5', 'black', 'soldier', 8, 3),
    ],
  }
}
