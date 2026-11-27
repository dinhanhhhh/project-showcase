declare module '../public/apps/saigon-tycoon/shared/constants.js' {
  export interface ColorGroupMeta {
    id: string
    name: string
    hex: string
    count: number
  }

  export const GAME_CONSTANTS: {
    CURRENCY_UNIT: string
    STARTING_MONEY: number
    GO_REWARD: number
    JAIL_FINE: number
    INCOME_TAX: number
    LUXURY_TAX: number
    MORTGAGE_INTEREST_RATE: number
    BANK_LIMITS: { houses: number | null; hotels: number | null }
    MAX_JAIL_TURNS: number
    RAILROAD_RENTS: number[]
    UTILITY_MULTIPLIERS: number[]
    COLOR_GROUPS: Record<string, ColorGroupMeta>
  }

  export function formatVND(
    amount: number,
    withSignOrOptions?: boolean | { withSign?: boolean; full?: boolean },
    fullParam?: boolean,
  ): string
}

declare module '../public/apps/saigon-tycoon/shared/data/board-data.js' {
  export interface BoardTile {
    id: number
    name: string
    type: 'corner' | 'property' | 'railroad' | 'utility' | 'chance' | 'chest' | 'tax'
    group?: string
    colorHex?: string
    price?: number
    rent?: number[]
    houseCost?: number
    mortgage?: number
    amount?: number
  }

  export const SAIGON_BOARD_DATA: BoardTile[]
}

declare module '../public/apps/saigon-tycoon/shared/rules.js' {
  import type { BoardTile } from '../public/apps/saigon-tycoon/shared/data/board-data.js'

  export interface PropertyState {
    owner: string | null
    houses: number
    isMortgaged: boolean
  }

  export interface PlayerState {
    id: string
    name: string
    money: number
    position: number
    inJail: boolean
    jailTurns: number
    hasJailCard: boolean
    isBankrupt: boolean
    isBot: boolean
  }

  export interface BuildCheckResult {
    canBuild: boolean
    code?: string
    reason?: string
    isHotel?: boolean
    cost?: number
    nextLevel?: number
  }

  export interface PhaseStatus {
    round: number
    maxRounds: number | null
    salary: number
    rentMult: number
    taxToBank: boolean
    phaseName: string
    nextRound: number | null
    roundsToNext: number | null
    isNearPhase: boolean
    isGameOver: boolean
  }

  export const GameRules: {
    hasFullColorSet(
      group: string | undefined,
      ownerId: string,
      propertiesState: Record<number, PropertyState>,
    ): boolean
    canBuildHouse(
      tile: BoardTile,
      player: PlayerState,
      propertiesState: Record<number, PropertyState>,
      bank?: { houses: number | null; hotels: number | null },
    ): BuildCheckResult
    getPhase(round: number, maxRounds?: number | null): PhaseStatus
    calculateRent(
      tile: BoardTile,
      owner: PlayerState,
      propertiesState: Record<number, PropertyState>,
      diceTotal?: number,
      rentMult?: number,
      bonusOptions?: { doubleRent?: boolean; utility10x?: boolean },
    ): number
    calculateNetWorth(
      player: PlayerState,
      propertiesState: Record<number, PropertyState>,
    ): number
  }
}

declare module '../public/apps/saigon-tycoon/shared/engine.js' {
  import type { BoardTile } from '../public/apps/saigon-tycoon/shared/data/board-data.js'
  import type { PlayerState, PropertyState } from '../public/apps/saigon-tycoon/shared/rules.js'

  export const TURN_STATES: {
    WAIT_ROLL: string
    ROLLING: string
    MOVING: string
    ACTION_REQUIRED: string
    END_TURN: string
    GAME_OVER: string
  }

  export function hashString(str: string): number
  export function createMulberry32(seed: number | string): () => number

  export interface EngineState {
    seed: number | string
    players: PlayerState[]
    properties: Record<number, PropertyState>
    currentTurnIndex: number
    turnState: string
    consecutiveDoubles: number
    round: number
    isEndless: boolean
    maxRounds: number | null
  }

  export interface EngineAction {
    type: string
    val1?: number
    val2?: number
    tileId?: number
    position?: number
  }

  export interface EngineActionResult {
    success?: boolean
    event?: string
    error?: string
    message?: string
    steps?: number
    val1?: number
    val2?: number
    total?: number
    isDoubles?: boolean
    state?: EngineState
  }

  export class GameEngine {
    state: EngineState
    constructor(
      playerConfigs?: Array<{ id?: string; name?: string; token?: string; money?: number; isBot?: boolean }>,
      options?: { seed?: number | string; rng?: () => number; fastMode?: boolean; isEndless?: boolean },
    )
    getTile(id: number): BoardTile
    getCurrentPlayer(): PlayerState
    sendToJail(player: PlayerState): void
    applyAction(action: EngineAction): EngineActionResult
  }
}
