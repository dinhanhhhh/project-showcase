export type PlayerType = 'human' | 'bot'

export type SquareType = 'go' | 'property' | 'tax' | 'chance' | 'jail' | 'parking' | 'gotojail'

export interface Player {
  id: string
  name: string
  type: PlayerType
  position: number
  balance: number
  inJail: boolean
  jailTurns: number
  color: string
}

export interface Square {
  id: number
  name: string
  type: SquareType
  price?: number
  rent?: number
  colorGroup?: string
  ownerId?: string | null
}
