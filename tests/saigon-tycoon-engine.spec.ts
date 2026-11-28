import { describe, expect, it } from 'vitest'
import { BotAI } from '../public/apps/saigon-tycoon/shared/BotAI.js'
import { GAME_CONSTANTS, formatVND } from '../public/apps/saigon-tycoon/shared/constants.js'
import { SAIGON_BOARD_DATA } from '../public/apps/saigon-tycoon/shared/data/board-data.js'
import { CHANCE_CARDS } from '../public/apps/saigon-tycoon/shared/data/chance-cards.js'
import { CHEST_CARDS } from '../public/apps/saigon-tycoon/shared/data/chest-cards.js'
import {
  GameEngine,
  TURN_STATES,
  createMulberry32,
  hashString,
} from '../public/apps/saigon-tycoon/shared/engine.js'
import { GameRules, type PropertyState } from '../public/apps/saigon-tycoon/shared/rules.js'

function createPropertiesMap(): Record<number, PropertyState> {
  const map: Record<number, PropertyState> = {}
  for (const tile of SAIGON_BOARD_DATA) {
    if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') {
      map[tile.id] = { owner: null, houses: 0, isMortgaged: false }
    }
  }
  return map
}

describe('Saigon Tycoon Shared Engine & Rules', () => {
  it('validates 40 board tiles including 4 railroads and 2 utilities', () => {
    expect(SAIGON_BOARD_DATA).toHaveLength(40)
    expect(SAIGON_BOARD_DATA.map((t) => t.id)).toEqual(Array.from({ length: 40 }, (_, i) => i))
    expect(SAIGON_BOARD_DATA.filter((t) => t.type === 'railroad')).toHaveLength(4)
    expect(SAIGON_BOARD_DATA.filter((t) => t.type === 'utility')).toHaveLength(2)
  })

  it('produces deterministic seeded PRNG sequences and string hashes', () => {
    expect(hashString('saigon')).toBe(hashString('saigon'))
    const rngA = createMulberry32('match-42')
    const rngB = createMulberry32('match-42')
    const seqA = [rngA(), rngA(), rngA()]
    const seqB = [rngB(), rngB(), rngB()]
    expect(seqA).toEqual(seqB)
  })

  it('formats Vietnamese currency cleanly in compact and full forms', () => {
    expect(formatVND(15_000_000)).toBe('15tr')
    expect(formatVND(500_000)).toBe('500k')
    expect(formatVND(2_000_000, { withSign: true })).toBe('+2tr')
    expect(formatVND(1_500_000, { full: true })).toContain('1.500.000')
  })

  it('enforces full color set, even-building rule, bank stock limit, and max hotel cap', () => {
    const props = createPropertiesMap()
    const tile1 = SAIGON_BOARD_DATA[1] // Brown group: ids 1 & 3
    const tile3 = SAIGON_BOARD_DATA[3]
    const player = {
      id: 'p1',
      name: 'Tester',
      money: 20_000_000,
      position: 1,
      inJail: false,
      jailTurns: 0,
      hasJailCard: false,
      isBankrupt: false,
      isBot: false,
    }

    props[1].owner = 'p1'
    expect(GameRules.hasFullColorSet('brown', 'p1', props)).toBe(false)
    expect(GameRules.canBuildHouse(tile1, player, props).canBuild).toBe(false)

    // Completing color set allows even building
    props[3].owner = 'p1'
    expect(GameRules.hasFullColorSet('brown', 'p1', props)).toBe(true)
    expect(GameRules.canBuildHouse(tile1, player, props).canBuild).toBe(true)

    // Cannot build house 2 on tile 1 before tile 3 reaches 1
    props[1].houses = 1
    expect(GameRules.canBuildHouse(tile1, player, props).canBuild).toBe(false)
    expect(GameRules.canBuildHouse(tile3, player, props).canBuild).toBe(true)

    // Blocked when bank runs out of houses
    expect(
      GameRules.canBuildHouse(tile3, player, props, { houses: 0, hotels: 12 }).code,
    ).toBe('NO_STOCK')

    // Max 5 levels (Hotel)
    props[1].houses = 5
    props[3].houses = 5
    expect(GameRules.canBuildHouse(tile1, player, props).canBuild).toBe(false)

    // Blocked if any sibling tile in the group is mortgaged
    props[1].houses = 0
    props[3].houses = 0
    props[3].isMortgaged = true
    expect(GameRules.canBuildHouse(tile1, player, props).canBuild).toBe(false)
  })

  it('calculates property rent with monopoly doubling, houses, mortgage zeroing, and inflation multiplier', () => {
    const props = createPropertiesMap()
    const tile1 = SAIGON_BOARD_DATA[1]
    const owner = {
      id: 'p1',
      name: 'Owner',
      money: 5_000_000,
      position: 0,
      inJail: false,
      jailTurns: 0,
      hasJailCard: false,
      isBankrupt: false,
      isBot: false,
    }

    props[1].owner = 'p1'
    expect(GameRules.calculateRent(tile1, owner, props)).toBe(tile1.rent![0])

    props[3].owner = 'p1'
    expect(GameRules.calculateRent(tile1, owner, props)).toBe(tile1.rent![0] * 2)

    props[1].houses = 2
    expect(GameRules.calculateRent(tile1, owner, props, 7, 1.5)).toBe(
      Math.round(tile1.rent![2] * 1.5),
    )

    props[1].isMortgaged = true
    expect(GameRules.calculateRent(tile1, owner, props)).toBe(0)
  })

  it('calculates railroad and utility rents accurately including card bonus multipliers', () => {
    const props = createPropertiesMap()
    const rr1 = SAIGON_BOARD_DATA[5]
    const util1 = SAIGON_BOARD_DATA[12]
    const owner = {
      id: 'p1',
      name: 'Owner',
      money: 5_000_000,
      position: 0,
      inJail: false,
      jailTurns: 0,
      hasJailCard: false,
      isBankrupt: false,
      isBot: false,
    }

    props[5].owner = 'p1'
    props[15].owner = 'p1'
    expect(GameRules.calculateRent(rr1, owner, props)).toBe(GAME_CONSTANTS.RAILROAD_RENTS[1])
    expect(GameRules.calculateRent(rr1, owner, props, 7, 1, { doubleRent: true })).toBe(
      GAME_CONSTANTS.RAILROAD_RENTS[1] * 2,
    )

    props[12].owner = 'p1'
    expect(GameRules.calculateRent(util1, owner, props, 8)).toBe(4 * 8 * 10_000)
    props[28].owner = 'p1'
    expect(GameRules.calculateRent(util1, owner, props, 8)).toBe(10 * 8 * 10_000)
  })

  it('computes Sudden Death phases vs Endless mode and Net Worth accounting for mortgaged tiles', () => {
    expect(GameRules.getPhase(10, null).phaseName).toBe('Kinh điển')
    expect(GameRules.getPhase(30, 50).rentMult).toBe(1.5)
    expect(GameRules.getPhase(51, 50).isGameOver).toBe(true)

    const props = createPropertiesMap()
    const tile1 = SAIGON_BOARD_DATA[1] // price 600_000, mortgage 300_000
    props[1].owner = 'p1'
    props[1].isMortgaged = true
    const player = {
      id: 'p1',
      name: 'Wealthy',
      money: 1_000_000,
      position: 0,
      inJail: false,
      jailTurns: 0,
      hasJailCard: false,
      isBankrupt: false,
      isBot: false,
    }

    // 1_000_000 + (600_000 - round(300_000 * 1.1)) = 1_270_000
    expect(GameRules.calculateNetWorth(player, props)).toBe(1_270_000)
    expect(tile1.price).toBe(600_000)
  })

  it('initializes GameEngine with starting money, fastMode distribution, and sends 3 consecutive doubles to jail', () => {
    const fastEngine = new GameEngine(
      [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2', isBot: true },
      ],
      { seed: 7, fastMode: true },
    )
    const p1Owned = Object.values(fastEngine.state.properties).filter((p) => p.owner === 'p1')
    expect(p1Owned).toHaveLength(3)
    expect(fastEngine.state.players[0].money).toBe(GAME_CONSTANTS.STARTING_MONEY)

    const engine = new GameEngine([{ id: 'p1', name: 'Runner' }], { seed: 99 })
    for (let i = 0; i < 2; i++) {
      engine.state.turnState = TURN_STATES.WAIT_ROLL
      const r = engine.applyAction({ type: 'ROLL_DICE', val1: 4, val2: 4 })
      expect(r.event).toBe('DICE_ROLLED')
    }

    engine.state.turnState = TURN_STATES.WAIT_ROLL
    const thirdDoubles = engine.applyAction({ type: 'ROLL_DICE', val1: 2, val2: 2 })
    expect(thirdDoubles.event).toBe('JAIL_THREE_DOUBLES')
    expect(engine.getCurrentPlayer().inJail).toBe(true)
  })

  it('supports buying property and paying jail fine safely through GameEngine actions', () => {
    const engine = new GameEngine([{ id: 'p1', name: 'Buyer' }], { seed: 12 })
    const player = engine.getCurrentPlayer()
    player.position = 1 // Bến Vân Đồn (price 600_000)

    const bought = engine.applyAction({ type: 'BUY_PROPERTY' })
    expect(bought.success).toBe(true)
    expect(engine.state.properties[1].owner).toBe('p1')
    expect(player.money).toBe(GAME_CONSTANTS.STARTING_MONEY - 600_000)

    engine.sendToJail(player)
    expect(player.inJail).toBe(true)
    const finePaid = engine.applyAction({ type: 'PAY_JAIL_FINE' })
    expect(finePaid.success).toBe(true)
    expect(player.inJail).toBe(false)
  })

  it('validates 16 Chance & 16 Community Chest cards and executes REPAIR_HOUSES accurately', () => {
    expect(CHANCE_CARDS).toHaveLength(16)
    expect(CHEST_CARDS).toHaveLength(16)

    const engine = new GameEngine(
      [
        { id: 'p1', name: 'Owner', money: 10_000_000 },
        { id: 'p2', name: 'Guest', money: 5_000_000 },
      ],
      { seed: 21 },
    )
    const p1 = engine.state.players[0]
    engine.state.properties[1].owner = 'p1'
    engine.state.properties[1].houses = 2 // 2 houses -> 500_000
    engine.state.properties[3].owner = 'p1'
    engine.state.properties[3].houses = 5 // 1 hotel -> 1_000_000

    const repairCard = CHANCE_CARDS.find((c) => c.action.type === 'REPAIR_HOUSES')
    expect(repairCard).toBeDefined()
    const res = engine.executeCard(p1, repairCard!)
    expect(res.amount).toBe(-1_500_000)
    expect(p1.money).toBe(8_500_000)

    const giftCard = CHEST_CARDS.find((c) => c.action.type === 'RECEIVE_FROM_ALL')!
    const giftAmount = giftCard.action.amount ?? 0
    engine.executeCard(p1, giftCard)
    expect(p1.money).toBe(8_500_000 + giftAmount)
    expect(engine.state.players[1].money).toBe(5_000_000 - giftAmount)

    const nearestBus = CHANCE_CARDS.find((c) => c.action.type === 'MOVE_NEAREST_RAILROAD')!
    p1.position = 22
    const railRes = engine.executeCard(p1, nearestBus)
    expect(railRes.moveTarget).toBe(25)
    expect(railRes.doubleRent).toBe(true)
  })

  it('runs a full Auction cycle with bidding, passing, completion, and cancellation', () => {
    const engine = new GameEngine(
      [
        { id: 'p1', name: 'P1', money: 5_000_000 },
        { id: 'p2', name: 'P2', money: 5_000_000 },
        { id: 'p3', name: 'P3', money: 5_000_000 },
      ],
      { seed: 33 },
    )

    const start = engine.applyAction({ type: 'START_AUCTION', tileId: 6 }) // price 1_000_000, startBid 100_000
    expect(start.success).toBe(true)
    expect(engine.state.auction?.currentBid).toBe(100_000)

    // P1 bids 300_000
    const bid1 = engine.applyAction({ type: 'BID_AUCTION', playerId: 'p1', amount: 300_000 })
    expect(bid1.event).toBe('AUCTION_BID_PLACED')
    expect(engine.state.auction?.currentTurnPlayerId).toBe('p2')

    // P2 passes -> turn goes to P3
    const pass2 = engine.applyAction({ type: 'PASS_AUCTION', playerId: 'p2' })
    expect(pass2.event).toBe('AUCTION_PASSED')

    // P3 passes -> only P1 remains -> P1 wins at 300_000
    const pass3 = engine.applyAction({ type: 'PASS_AUCTION', playerId: 'p3' })
    expect(pass3.event).toBe('AUCTION_COMPLETED')
    expect(pass3.winner?.id).toBe('p1')
    expect(engine.state.properties[6].owner).toBe('p1')
    expect(engine.state.players[0].money).toBe(4_700_000)

    // Cancelled auction when nobody bids
    const engine2 = new GameEngine(
      [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
      { seed: 34 },
    )
    engine2.applyAction({ type: 'START_AUCTION', tileId: 8 })
    engine2.applyAction({ type: 'PASS_AUCTION', playerId: 'a' })
    const cancel = engine2.applyAction({ type: 'PASS_AUCTION', playerId: 'b' })
    expect(cancel.event).toBe('AUCTION_CANCELLED')
    expect(engine2.state.properties[8].owner).toBeNull()
  })

  it('supports mortgaging, unmortgaging with 10% interest, even-selling houses, and executing trades', () => {
    const engine = new GameEngine(
      [
        { id: 'p1', name: 'Seller', money: 10_000_000 },
        { id: 'p2', name: 'Trader', money: 10_000_000 },
      ],
      { seed: 44 },
    )
    engine.state.properties[1].owner = 'p1'
    engine.state.properties[3].owner = 'p1'
    engine.state.properties[5].owner = 'p2'

    // Build 1 house each evenly on brown set (1 & 3)
    expect(engine.applyAction({ type: 'BUILD_HOUSE', tileId: 1 }).success).toBe(true)
    expect(engine.applyAction({ type: 'BUILD_HOUSE', tileId: 3 }).success).toBe(true)

    // Cannot trade or mortgage while color group still has houses
    expect(
      engine.applyAction({
        type: 'EXECUTE_TRADE',
        senderId: 'p1',
        receiverId: 'p2',
        offerTiles: [1],
        requestTiles: [5],
      }).success,
    ).toBe(false)
    expect(engine.applyAction({ type: 'MORTGAGE_PROPERTY', tileId: 1 }).success).toBe(false)

    // Sell houses evenly, then mortgage & redeem (+10% interest), then trade
    expect(engine.applyAction({ type: 'SELL_HOUSE', tileId: 1 }).success).toBe(true)
    expect(engine.applyAction({ type: 'SELL_HOUSE', tileId: 3 }).success).toBe(true)

    const moneyBeforeMortgage = engine.state.players[0].money
    const mort = engine.applyAction({ type: 'MORTGAGE_PROPERTY', tileId: 1 })
    expect(mort.success).toBe(true)
    expect(engine.state.properties[1].isMortgaged).toBe(true)
    expect(engine.state.players[0].money).toBe(moneyBeforeMortgage + 300_000)

    const unmort = engine.applyAction({ type: 'UNMORTGAGE_PROPERTY', tileId: 1 })
    expect(unmort.success).toBe(true)
    expect(engine.state.properties[1].isMortgaged).toBe(false)
    expect(engine.state.players[0].money).toBe(moneyBeforeMortgage + 300_000 - 330_000)

    const trade = engine.applyAction({
      type: 'EXECUTE_TRADE',
      senderId: 'p1',
      receiverId: 'p2',
      offerMoney: 500_000,
      offerTiles: [1],
      requestTiles: [5],
    })
    expect(trade.event).toBe('TRADE_EXECUTED')
    expect(engine.state.properties[1].owner).toBe('p2')
    expect(engine.state.properties[5].owner).toBe('p1')
  })

  it('resolves rent debt via AUTO_RESOLVE_DEBT, awards Jackpot on tile 20, and handles Bankruptcy/Victory', () => {
    const engine = new GameEngine(
      [
        { id: 'p1', name: 'Debtor', money: 200_000 },
        { id: 'p2', name: 'Landlord', money: 5_000_000 },
        { id: 'p3', name: 'Third', money: 5_000_000 },
      ],
      { seed: 55 },
    )
    // p1 owns tile 6 (price 1_000_000, mortgage 500_000)
    engine.state.properties[6].owner = 'p1'
    // p2 owns both brown tiles 1 & 3 + 2 houses on tile 3 (rent 360_000 or similar > 200_000)
    engine.state.properties[1].owner = 'p2'
    engine.state.properties[3].owner = 'p2'
    engine.state.properties[3].houses = 2

    const rentRes = engine.evaluateLanding(engine.state.players[0], 3)
    expect(rentRes.event).toBe('DEBT_REQUIRED')
    expect(engine.state.turnState).toBe(TURN_STATES.ACTION_REQUIRED)

    const resolved = engine.applyAction({ type: 'AUTO_RESOLVE_DEBT' })
    expect(resolved.event).toBe('DEBT_RESOLVED')
    expect(engine.state.properties[6].isMortgaged).toBe(true)

    // P3 collects Jackpot on tile 20
    const initialPot = engine.state.jackpotPot
    const p3Before = engine.state.players[2].money
    const jp = engine.evaluateLanding(engine.state.players[2], 20)
    expect(jp.event).toBe('JACKPOT_WON')
    expect(engine.state.players[2].money).toBe(p3Before + initialPot)
    expect(engine.state.jackpotPot).toBe(500_000)

    // Bankruptcy cascades creditor takeover & last survivor victory
    const b1 = engine.declareBankruptcy(engine.state.players[0], engine.state.players[1])
    expect(b1?.isGameOver).toBe(false)
    expect(engine.state.properties[6].owner).toBe('p2')

    const b2 = engine.declareBankruptcy(engine.state.players[2], engine.state.players[1])
    expect(b2?.isGameOver).toBe(true)
    expect(b2?.winner?.id).toBe('p2')
    expect(engine.state.isGameOver).toBe(true)
  })

  it('determines max-rounds Sudden Death winner cleanly by Net Worth', () => {
    const engine = new GameEngine(
      [
        { id: 'p1', name: 'RichCash', money: 8_000_000 },
        { id: 'p2', name: 'AssetKing', money: 2_000_000 },
      ],
      { seed: 66, maxRounds: 2 },
    )
    // Give p2 Nguyễn Huệ (id 39, price 4_000_000) + Đồng Khởi (id 37, price 3_500_000) => Net worth 9_500_000
    engine.state.properties[37].owner = 'p2'
    engine.state.properties[39].owner = 'p2'
    engine.state.currentTurnIndex = 1
    engine.state.round = 2
    engine.state.turnState = TURN_STATES.END_TURN

    const endRes = engine.applyAction({ type: 'END_TURN' })
    expect(endRes.event).toBe('GAME_OVER_MAX_ROUNDS')
    expect(endRes.winner?.id).toBe('p2')
    expect(engine.state.turnState).toBe(TURN_STATES.GAME_OVER)
  })

  it('drives BotAI decisions: buying strategic monopoly, auctioning, building evenly, unmortgaging, and evaluating trades', () => {
    const engine = new GameEngine(
      [
        { id: 'bot', name: 'Cậu Ba AI', money: 10_000_000, isBot: true, personality: 'tycoon' },
        { id: 'human', name: 'Người Chơi', money: 10_000_000, isBot: false },
      ],
      { seed: 77 },
    )
    const [bot, human] = engine.state.players
    bot.mood = 1
    engine.state.properties[1].owner = 'bot'
    engine.state.properties[1].isMortgaged = true

    // Bot unmortgages its tile when cash exceeds reserve
    expect(BotAI.getUnmortgageDecisions(bot, engine.state)).toContain(1)
    engine.state.properties[1].isMortgaged = false

    // Bot wants tile 3 to finish Brown monopoly
    const buyDecision = BotAI.shouldBuyProperty(bot, SAIGON_BOARD_DATA[3], engine.state)
    expect(buyDecision.shouldBuy).toBe(true)

    // Auction bid vs pass
    const bidDecision = BotAI.getAuctionDecision(
      bot,
      {
        tile: SAIGON_BOARD_DATA[3],
        currentBid: 200_000,
        highestBidder: 'human',
        activePlayerIds: ['bot', 'human'],
        currentTurnPlayerId: 'bot',
      },
      engine.state,
    )
    expect(bidDecision.action).toBe('BID')
    expect((bidDecision.amount ?? 0) > 200_000).toBe(true)

    // Complete monopoly -> BotAI generates even build plan across tile 1 & 3
    engine.state.properties[3].owner = 'bot'
    const buildPlan = BotAI.getBuildDecisions(bot, engine.state)
    expect(buildPlan.length).toBeGreaterThanOrEqual(2)
    expect(buildPlan).toContain(1)
    expect(buildPlan).toContain(3)

    // Evaluate Trade: reject giving away a tile from an already completed monopoly
    engine.state.properties[6].owner = 'bot'
    engine.state.properties[8].owner = 'human'
    const rejectMonopolyTrade = BotAI.evaluateTradeOffer(
      bot,
      {
        sender: human,
        offerMoney: 5_000_000,
        requestTiles: [1],
      },
      engine.state,
    )
    expect(rejectMonopolyTrade.accept).toBe(false)

    // Accept profitable trade for loose tile 6
    const acceptFairTrade = BotAI.evaluateTradeOffer(
      bot,
      {
        sender: human,
        offerMoney: 2_500_000,
        requestTiles: [6],
      },
      engine.state,
    )
    expect(acceptFairTrade.accept).toBe(true)
  })

  it('handles 3 consecutive doubles to jail, bail fine jackpot credit, jail card, and forced release', () => {
    const engine = new GameEngine(
      [
        { id: 'p1', name: 'Player 1', money: 5_000_000 },
        { id: 'p2', name: 'Player 2', money: 5_000_000 },
      ],
      { seed: 88 },
    )
    const p1 = engine.state.players[0]

    // 3 doubles in a row -> JAIL_THREE_DOUBLES
    engine.applyAction({ type: 'ROLL_DICE', val1: 2, val2: 2 })
    engine.state.turnState = TURN_STATES.WAIT_ROLL
    engine.applyAction({ type: 'ROLL_DICE', val1: 3, val2: 3 })
    engine.state.turnState = TURN_STATES.WAIT_ROLL
    const third = engine.applyAction({ type: 'ROLL_DICE', val1: 4, val2: 4 })
    expect(third.event).toBe('JAIL_THREE_DOUBLES')
    expect(p1.inJail).toBe(true)
    expect(p1.position).toBe(10)

    // Fail doubles twice then forced pay on 3rd turn -> jackpotPot credited
    const initialPot = engine.state.jackpotPot
    engine.state.turnState = TURN_STATES.WAIT_ROLL
    expect(engine.applyAction({ type: 'ROLL_DICE', val1: 1, val2: 2 }).event).toBe('JAIL_STAY')
    engine.state.turnState = TURN_STATES.WAIT_ROLL
    expect(engine.applyAction({ type: 'ROLL_DICE', val1: 2, val2: 3 }).event).toBe('JAIL_STAY')
    engine.state.turnState = TURN_STATES.WAIT_ROLL
    const forced = engine.applyAction({ type: 'ROLL_DICE', val1: 3, val2: 4 })
    expect(forced.event).toBe('JAIL_FORCED_PAY')
    expect(p1.inJail).toBe(false)
    expect(engine.state.jackpotPot).toBe(initialPot + GAME_CONSTANTS.JAIL_FINE)

    // Jail card frees immediately
    p1.inJail = true
    p1.jailTurns = 1
    p1.hasJailCard = true
    const cardOut = engine.applyAction({ type: 'USE_JAIL_CARD' })
    expect(cardOut.event).toBe('JAIL_USED_CARD')
    expect(p1.inJail).toBe(false)
    expect(p1.hasJailCard).toBe(false)

    // Pay bail directly when in jail
    p1.inJail = true
    const bailOut = engine.applyAction({ type: 'PAY_JAIL_FINE' })
    expect(bailOut.event).toBe('JAIL_PAID_FINE')
    expect(engine.state.jackpotPot).toBe(initialPot + GAME_CONSTANTS.JAIL_FINE * 2)
  })

  it('transfers bankrupt player properties to creditor and declares sole survivor winner', () => {
    const engine = new GameEngine(
      [
        { id: 'p1', name: 'Debtor', money: 100_000 },
        { id: 'p2', name: 'Creditor', money: 4_000_000 },
      ],
      { seed: 99 },
    )
    engine.state.properties[1].owner = 'p1'
    engine.state.properties[3].owner = 'p1'
    engine.state.pendingAction = {
      type: 'DEBT_PROMPT',
      debtType: 'RENT',
      amount: 1_500_000,
      creditorId: 'p2',
    }

    const res = engine.applyAction({ type: 'CONCEDE_BANKRUPTCY' })
    expect(res.event).toBe('BANKRUPTCY')
    expect(res.winner?.id).toBe('p2')
    expect(engine.state.properties[1].owner).toBe('p2')
    expect(engine.state.properties[3].owner).toBe('p2')
    expect(engine.state.isGameOver).toBe(true)
  })

  it('guards BID_AUCTION floor, rejects negative/self EXECUTE_TRADE, and handles mortgage/unmortgage rent & auction pass', () => {
    const engine = new GameEngine(
      [
        { id: 'p1', name: 'Alice', money: 8_000_000 },
        { id: 'p2', name: 'Bob', money: 8_000_000 },
      ],
      { seed: 101 },
    )

    // Mortgage & unmortgage lifecycle
    engine.state.properties[1].owner = 'p1'
    const mRes = engine.applyAction({ type: 'MORTGAGE_PROPERTY', tileId: 1 })
    expect(mRes.success).toBe(true)
    expect(engine.state.properties[1].isMortgaged).toBe(true)
    expect(
      GameRules.calculateRent(SAIGON_BOARD_DATA[1], engine.state.players[0], engine.state.properties),
    ).toBe(0)

    const uRes = engine.applyAction({ type: 'UNMORTGAGE_PROPERTY', tileId: 1 })
    expect(uRes.success).toBe(true)
    expect(engine.state.properties[1].isMortgaged).toBe(false)

    // Trade validation: reject negative money & self-trade
    expect(
      engine.applyAction({
        type: 'EXECUTE_TRADE',
        senderId: 'p1',
        receiverId: 'p1',
        offerMoney: 100_000,
      }).success,
    ).toBe(false)
    expect(
      engine.applyAction({
        type: 'EXECUTE_TRADE',
        senderId: 'p1',
        receiverId: 'p2',
        offerMoney: -500_000,
      }).success,
    ).toBe(false)

    // Auction: startBid floor guard & PASS_AUCTION completion
    const start = engine.applyAction({ type: 'START_AUCTION', tileId: 6 })
    expect(start.success).toBe(true)
    expect(
      engine.applyAction({ type: 'BID_AUCTION', playerId: 'p1', amount: 0 }).success,
    ).toBe(false)
    expect(
      engine.applyAction({ type: 'BID_AUCTION', playerId: 'p1', amount: 150_000 }).success,
    ).toBe(true)
    const pass = engine.applyAction({ type: 'PASS_AUCTION', playerId: 'p2' })
    expect(pass.event).toBe('AUCTION_COMPLETED')
    expect(engine.state.properties[6].owner).toBe('p1')
  })

  it('validates cautious BotAI reserve guards, auction PASS, monopoly-grant trade rejection, and mortgaged Net Worth', () => {
    const engine = new GameEngine(
      [
        { id: 'bot', name: 'Ông Hội Đồng', money: 2_500_000, isBot: true, personality: 'cautious' },
        { id: 'opp', name: 'Khách', money: 10_000_000, isBot: false },
      ],
      { seed: 202 },
    )
    const [bot, opp] = engine.state.players

    // Cautious bot keeps 3tr reserve -> refuses 600k tile when money drops below 3tr
    expect(BotAI.shouldBuyProperty(bot, SAIGON_BOARD_DATA[1], engine.state).shouldBuy).toBe(false)

    // Auction bid passes when exceeding auctionReserve cap (2.5tr - 2tr reserve = 500k cap)
    const auctionPass = BotAI.getAuctionDecision(
      bot,
      {
        tile: SAIGON_BOARD_DATA[1],
        currentBid: 600_000,
        highestBidder: 'opp',
        activePlayerIds: ['bot', 'opp'],
        currentTurnPlayerId: 'bot',
      },
      engine.state,
    )
    expect(auctionPass.action).toBe('PASS')

    // Opp already owns tile 6 (of cyan 6, 8, 9 — let's own 6 & 8 so 9 finishes monopoly) -> Bot must reject giving tile 9
    engine.state.properties[6].owner = 'opp'
    engine.state.properties[8].owner = 'opp'
    engine.state.properties[9].owner = 'bot'
    const tradeReject = BotAI.evaluateTradeOffer(
      bot,
      {
        sender: opp,
        offerMoney: 3_000_000,
        requestTiles: [9],
      },
      engine.state,
    )
    expect(tradeReject.accept).toBe(false)

    // Net worth with mortgaged tile 9 (price 1_200_000, mortgage 600_000, +10% redeem 660_000 -> net value 540_000)
    engine.state.properties[9].isMortgaged = true
    const nw = GameRules.calculateNetWorth(bot, engine.state.properties)
    expect(nw).toBe(bot.money + 1_200_000 - Math.round(600_000 * 1.1))
  })
})
