import type { BoardState, Piece, PieceType, Side, XiangqiPuzzle } from './types'

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

export const XIANGQI_PUZZLES: readonly XiangqiPuzzle[] = [
  {
    id: 'song-xa-thac',
    title: 'Thế 1: Song Xa Thác',
    difficulty: 'Cơ bản',
    description: 'Đỏ đi trước — Phối hợp 2 Xe khóa chặt cung Tướng để chiếu bí trong 1 nước!',
    hint: 'Giữ Xe hàng 1 khóa đường xuống, đưa Xe ở cột 7 dâng thẳng lên hàng 0 (Xe 2 tấn 2) để chiếu bí.',
    boardState: {
      pieces: [
        createPiece('p1_b_gen', 'black', 'general', 4, 0),
        createPiece('p1_r_gen', 'red', 'general', 3, 9),
        createPiece('p1_r_chariot_1', 'red', 'chariot', 1, 1),
        createPiece('p1_r_chariot_2', 'red', 'chariot', 7, 2),
      ],
    },
  },
  {
    id: 'phao-trung-lo',
    title: 'Thế 2: Trọng Pháo Sát Cục',
    difficulty: 'Cơ bản',
    description: 'Đỏ đi trước — Kinh điển Trọng Pháo: 2 Pháo xếp thẳng trục giữa chiếu bí 1 nước!',
    hint: 'Bình Pháo ngoài vào trục giữa (Pháo 7 bình 5) tạo thế Trọng Pháo khóa cả Tướng lẫn Sĩ Đen.',
    boardState: {
      pieces: [
        createPiece('p2_b_gen', 'black', 'general', 4, 0),
        createPiece('p2_b_adv1', 'black', 'advisor', 3, 0),
        createPiece('p2_b_adv2', 'black', 'advisor', 5, 0),
        createPiece('p2_r_gen', 'red', 'general', 4, 9),
        createPiece('p2_r_cannon_1', 'red', 'cannon', 4, 3),
        createPiece('p2_r_cannon_2', 'red', 'cannon', 2, 4),
      ],
    },
  },
  {
    id: 'ma-hau-phao',
    title: 'Thế 3: Mã Hậu Pháo',
    difficulty: 'Trung bình',
    description: 'Đỏ đi trước — Thế sát chiêu kinh điển Mã nhảy làm ngòi cho Pháo kẹp chiếu bí 1 nước!',
    hint: 'Nhảy Mã từ trục giữa sang cột 4 (Mã 5 tấn 4) vừa làm ngòi cho Pháo vừa khóa đường chạy của Tướng Đen.',
    boardState: {
      pieces: [
        createPiece('p3_b_gen', 'black', 'general', 5, 0),
        createPiece('p3_b_adv', 'black', 'advisor', 3, 0),
        createPiece('p3_b_sol', 'black', 'soldier', 2, 7),
        createPiece('p3_r_gen', 'red', 'general', 3, 9),
        createPiece('p3_r_horse', 'red', 'horse', 4, 4),
        createPiece('p3_r_cannon', 'red', 'cannon', 5, 5),
      ],
    },
  },
  {
    id: 'ngoa-tao-ma',
    title: 'Thế 4: Ngọa Tào Mã (2 nước)',
    difficulty: 'Cao thủ',
    description: 'Đỏ đi trước — Chiếu bí trong 2 nước! Đừng vội đẩy Xe ngay, hãy nhảy Mã Ngọa Tào ép Tướng xuất cung trước.',
    hint: 'Nước 1: Nhảy Mã vào điểm Ngọa Tào (Mã 2 tấn 3) ép Tướng Đen chạy sang phải. Nước 2: Đẩy Xe lên hàng đáy chiếu bí!',
    boardState: {
      pieces: [
        createPiece('p4_b_gen', 'black', 'general', 4, 0),
        createPiece('p4_b_adv1', 'black', 'advisor', 3, 0),
        createPiece('p4_b_adv2', 'black', 'advisor', 4, 1),
        createPiece('p4_r_gen', 'red', 'general', 3, 9),
        createPiece('p4_r_chariot', 'red', 'chariot', 8, 4),
        createPiece('p4_r_horse', 'red', 'horse', 7, 3),
        createPiece('p4_r_soldier', 'red', 'soldier', 5, 2),
      ],
    },
  },
  {
    id: 'thiet-mon-thoan',
    title: 'Thế 5: Thiết Môn Thoan',
    difficulty: 'Trung bình',
    description: 'Đỏ đi trước — Dùng Pháo đầu ghim chặt đôi Sĩ và đưa Xe khóa chốt trung lộ chiếu bí trong 1 nước!',
    hint: 'Đưa Xe cánh phải từ (7,1) vào tâm cung (4,1) — Tướng Đen không ăn được Xe vì có Pháo (1,1) bắn cách quân Tốt (3,1), còn đôi Sĩ thì bị Pháo (4,5) ghim!',
    boardState: {
      pieces: [
        createPiece('p5_b_gen', 'black', 'general', 4, 0),
        createPiece('p5_b_adv1', 'black', 'advisor', 3, 0),
        createPiece('p5_b_adv2', 'black', 'advisor', 5, 0),
        createPiece('p5_b_ele', 'black', 'elephant', 2, 0),
        createPiece('p5_b_sol', 'black', 'soldier', 3, 1),
        createPiece('p5_r_gen', 'red', 'general', 5, 9),
        createPiece('p5_r_cannon_mid', 'red', 'cannon', 4, 5),
        createPiece('p5_r_cannon_guard', 'red', 'cannon', 1, 1),
        createPiece('p5_r_chariot', 'red', 'chariot', 7, 1),
      ],
    },
  },
  {
    id: 'muon-tuong-sat',
    title: 'Thế 6: Mượn Tướng Sát',
    difficulty: 'Cao thủ',
    description: 'Đỏ đi trước — Tận dụng luật Mặt Tướng ghim chặt Sĩ Đen ở trục giữa để Xe chiếu bí 1 nước!',
    hint: 'Đẩy Xe lên hàng đáy (5,0) có Tốt (5,1) yểm trợ — Sĩ (4,1) không thể ăn Xe vì lộ mặt Tướng.',
    boardState: {
      pieces: [
        createPiece('p6_b_gen', 'black', 'general', 4, 0),
        createPiece('p6_b_adv1', 'black', 'advisor', 3, 0),
        createPiece('p6_b_adv2', 'black', 'advisor', 4, 1),
        createPiece('p6_b_ele', 'black', 'elephant', 6, 2),
        createPiece('p6_r_gen', 'red', 'general', 4, 9),
        createPiece('p6_r_chariot', 'red', 'chariot', 5, 4),
        createPiece('p6_r_soldier', 'red', 'soldier', 5, 1),
      ],
    },
  },
]

export function cloneBoardState(board: BoardState): BoardState {
  return {
    pieces: board.pieces.map((p) => ({
      ...p,
      position: { ...p.position },
    })),
  }
}
