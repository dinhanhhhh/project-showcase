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
    MAX_ROUNDS: number
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
    action?: string
  }

  export const SAIGON_BOARD_DATA: BoardTile[]
}

declare module '../public/apps/saigon-tycoon/shared/data/chance-cards.js' {
  export interface SaigonCard {
    id: string
    title: string
    desc: string
    icon: string
    action: {
      type: string
      amount?: number
      target?: number
      passGoReward?: boolean
      steps?: number
      doubleRent?: boolean
      multiplier?: number
      houseFee?: number
      hotelFee?: number
    }
  }

  export const CHANCE_CARDS: SaigonCard[]
}

declare module '../public/apps/saigon-tycoon/shared/data/chest-cards.js' {
  import type { SaigonCard } from '../public/apps/saigon-tycoon/shared/data/chance-cards.js'
  export const CHEST_CARDS: SaigonCard[]
}

declare module '../public/apps/saigon-tycoon/shared/rules.js' {
  import type { BoardTile } from '../public/apps/saigon-tycoon/shared/data/board-data.js'

  export interface PropertyState {
    owner: string | null
    houses: number
    isMortgaged: boolean
  }

  export type BotPersonality = 'cautious' | 'balanced' | 'standard' | 'tycoon' | null

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
    personality?: BotPersonality
    mood?: number
  }

  export interface BuildCheckResult {
    canBuild: boolean
    code?: string
    reason?: string
    isHotel?: boolean
    cost?: number
    nextLevel?: number
  }

  export interface MortgageCheckResult {
    canMortgage: boolean
    reason?: string
    mortgageValue?: number
  }

  export interface UnmortgageCheckResult {
    canUnmortgage: boolean
    reason?: string
    unmortgageCost?: number
  }

  export interface SellHouseCheckResult {
    canSell: boolean
    reason?: string
    refund?: number
    nextHouses?: number
  }

  export interface TradeCheckResult {
    canTrade: boolean
    reason?: string
  }

  export interface LiquidationPlan {
    sells: number[]
    mortgages: number[]
    cash: number
    enough: boolean
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
    comparePlayersNetWorth(
      a: PlayerState,
      b: PlayerState,
      propertiesState: Record<number, PropertyState>,
    ): number
    calculateMaxLiquidation(
      player: PlayerState,
      propertiesState: Record<number, PropertyState>,
    ): number
    canMortgage(
      tile: BoardTile,
      player: PlayerState,
      propertiesState: Record<number, PropertyState>,
    ): MortgageCheckResult
    canUnmortgage(
      tile: BoardTile,
      player: PlayerState,
      propertiesState: Record<number, PropertyState>,
    ): UnmortgageCheckResult
    canSellHouse(
      tile: BoardTile,
      player: PlayerState,
      propertiesState: Record<number, PropertyState>,
    ): SellHouseCheckResult
    canTradeProperty(
      tile: BoardTile,
      propertiesState: Record<number, PropertyState>,
      ownerId?: string | null,
    ): TradeCheckResult
    getLiquidationPlan(
      player: PlayerState,
      amountOwed: number,
      propertiesState: Record<number, PropertyState>,
    ): LiquidationPlan
  }
}

declare module '../public/apps/saigon-tycoon/shared/engine.js' {
  import type { BoardTile } from '../public/apps/saigon-tycoon/shared/data/board-data.js'
  import type { SaigonCard } from '../public/apps/saigon-tycoon/shared/data/chance-cards.js'
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

  export interface AuctionState {
    tile: BoardTile
    currentBid: number
    highestBidder: string | null
    activePlayerIds: string[]
    currentTurnPlayerId: string
  }

  export interface PendingActionState {
    type: string
    playerId?: string
    debtType?: string
    creditorId?: string | null
    amount?: number
    tileId?: number
    card?: SaigonCard
    result?: {
      message?: string
      moveTarget?: number
      doubleRent?: boolean
      utility10x?: boolean
    }
    [key: string]: unknown
  }

  export interface EngineState {
    seed: number | string
    players: PlayerState[]
    properties: Record<number, PropertyState>
    chanceDeck: SaigonCard[]
    chestDeck: SaigonCard[]
    currentTurnIndex: number
    turnState: string
    consecutiveDoubles: number
    lastRoll: { val1: number; val2: number; total: number; isDoubles: boolean } | null
    pendingAction: PendingActionState | null
    auction?: AuctionState | null
    jackpotPot: number
    round: number
    isEndless: boolean
    maxRounds: number | null
    winner?: PlayerState | null
    isGameOver?: boolean
    endReason?: string
  }

  export interface EngineAction {
    type: string
    val1?: number
    val2?: number
    tileId?: number
    position?: number
    playerId?: string
    amount?: number
    senderId?: string
    receiverId?: string
    offerMoney?: number
    offerTiles?: number[]
    requestMoney?: number
    requestTiles?: number[]
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
    rent?: number
    amount?: number
    taxAmount?: number
    winningBid?: number
    winner?: PlayerState | null
    ranked?: PlayerState[]
    bankruptPlayer?: PlayerState
    card?: SaigonCard
    auction?: AuctionState | null
    state?: EngineState
  }

  export class GameEngine {
    state: EngineState
    constructor(
      playerConfigs?: Array<{
        id?: string
        name?: string
        token?: string
        money?: number
        isBot?: boolean
        personality?: 'cautious' | 'balanced' | 'standard' | 'tycoon'
      }>,
      options?: {
        seed?: number | string
        rng?: () => number
        fastMode?: boolean
        isEndless?: boolean
        maxRounds?: number
      },
    )
    getTile(id: number): BoardTile
    getCurrentPlayer(): PlayerState
    getOwner(tileId: number): PlayerState | null
    drawCard(deckType: 'chance' | 'chest'): SaigonCard
    executeCard(
      player: PlayerState,
      card: SaigonCard,
    ): {
      amount?: number
      actionType?: string
      message: string
      moveTarget?: number
      doubleRent?: boolean
      utility10x?: boolean
    }
    evaluateLanding(
      player: PlayerState,
      landingPos: number,
      action?: Record<string, unknown>,
    ): EngineActionResult
    sendToJail(player: PlayerState): void
    declareBankruptcy(
      player: PlayerState,
      creditor?: PlayerState | null,
    ): EngineActionResult | null
    applyAction(action: EngineAction): EngineActionResult
    loadState(state: EngineState): EngineState
  }
}

declare module '../public/apps/saigon-tycoon/shared/BotAI.js' {
  import type { BoardTile } from '../public/apps/saigon-tycoon/shared/data/board-data.js'
  import type { AuctionState, EngineState } from '../public/apps/saigon-tycoon/shared/engine.js'
  import type { PlayerState } from '../public/apps/saigon-tycoon/shared/rules.js'

  export interface BotProfile {
    buyReserve: number
    auctionMult: number
    auctionReserve: number
    buildReserve: number
    tradeThreshold: number
  }

  export const BOT_PROFILES: Record<string, BotProfile>

  export const BotAI: {
    groupStatus(
      group: string,
      ownerId: string | undefined,
      state: EngineState,
    ): { total: number; owned: number; missing: number }
    shouldBuyProperty(
      bot: PlayerState,
      tile: BoardTile,
      state: EngineState,
    ): { shouldBuy: boolean; reason: string }
    getAuctionDecision(
      bot: PlayerState,
      auction: AuctionState,
      state: EngineState,
    ): { action: 'BID' | 'PASS' | 'WAIT'; amount?: number }
    getUnmortgageDecisions(bot: PlayerState, state: EngineState): number[]
    getBuildDecisions(bot: PlayerState, state: EngineState): number[]
    evaluateTradeOffer(
      bot: PlayerState,
      tradeOffer: {
        sender: PlayerState
        offerMoney?: number
        offerTiles?: number[]
        requestMoney?: number
        requestTiles?: number[]
      },
      state: EngineState,
    ): { accept: boolean; reason: string }
  }
}
