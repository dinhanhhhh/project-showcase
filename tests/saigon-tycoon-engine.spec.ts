import { describe, expect, it } from 'vitest'
import { GAME_CONSTANTS, formatVND } from '../public/apps/saigon-tycoon/shared/constants.js'
import { SAIGON_BOARD_DATA } from '../public/apps/saigon-tycoon/shared/data/board-data.js'
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
})
