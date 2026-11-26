export type Side = 'red' | 'black'

export type PieceType =
  | 'general'
  | 'advisor'
  | 'elephant'
  | 'horse'
  | 'chariot'
  | 'cannon'
  | 'soldier'

export interface Position {
  file: number // 0..8
  rank: number // 0..9
}

export interface Piece {
  id: string
  side: Side
  type: PieceType
  position: Position
}

export interface BoardState {
  pieces: Piece[]
}

export interface MoveRecord {
  moveNumber: number
  side: Side
  from: Position
  to: Position
  piece: Piece
  capturedPiece?: Piece
  notation: string
}

export type GameMode = 'vs_bot' | 'pvp_local' | 'puzzle'
export type GameStatus = 'ongoing' | 'check' | 'checkmate' | 'stalemate' | 'draw'
export type BotDifficulty = 'easy' | 'medium' | 'hard'
export type TimeControlMinutes = 0 | 5 | 10

export interface XiangqiPuzzle {
  id: string
  title: string
  difficulty: 'Cơ bản' | 'Trung bình' | 'Cao thủ'
  description: string
  hint: string
  boardState: BoardState
}

export interface BotMove {
  piece: Piece
  to: Position
}

export interface CoTuongStats {
  wins: number
  losses: number
  draws: number
}
