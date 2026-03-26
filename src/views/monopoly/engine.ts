import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Player, Square } from './types'
import { BOARD_SQUARES } from './data/board'
import { useMonopolyAudio } from './composables/useMonopolyAudio'

function createPlayers(): Player[] {
  return [
    {
      id: 'p1',
      name: 'You (Player)',
      type: 'human',
      position: 0,
      balance: 1500,
      inJail: false,
      jailTurns: 0,
      color: 'var(--primary)',
    },
    {
      id: 'p2',
      name: 'Bot (AI)',
      type: 'bot',
      position: 0,
      balance: 1500,
      inJail: false,
      jailTurns: 0,
      color: 'var(--accent)',
    },
  ]
}

function createBoard(): Square[] {
  return BOARD_SQUARES.map((square) => ({
    ...square,
    ownerId: null,
  }))
}

export const useMonopolyStore = defineStore(
  'monopoly-game',
  () => {
    const players = ref<Player[]>(createPlayers())
    const board = ref<Square[]>(createBoard())
    const currentPlayerIndex = ref(0)
    const diceValue1 = ref(1)
    const diceValue2 = ref(1)
    const logs = ref<string[]>(['Trò chơi bắt đầu!'])

    const turnState = ref<'idle' | 'moving' | 'action' | 'buying' | 'finished'>('idle')
    const currentActionSquare = ref<Square | null>(null)
    const isRolling = ref(false)
    const rollCount = ref(0)

    const hasExtraTurn = ref(false)
    const doublesCount = ref(0)

    const audio = useMonopolyAudio()
    const currentPlayer = computed(() => {
      const idx = currentPlayerIndex.value
      if (idx < 0 || idx >= players.value.length) return players.value[0]
      return players.value[idx]
    })
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>()
    const gameSessionId = ref(0)

    const scheduleTask = (callback: () => void, delay: number) => {
      const sessionId = gameSessionId.value
      const timer = setTimeout(() => {
        pendingTimers.delete(timer)
        if (sessionId !== gameSessionId.value) return
        callback()
      }, delay)

      pendingTimers.add(timer)
    }

    const clearPendingTasks = () => {
      for (const timer of pendingTimers) {
        clearTimeout(timer)
      }
      pendingTimers.clear()
    }

    const addLog = (msg: string) => {
      logs.value.unshift(msg)
      if (logs.value.length > 30) logs.value.pop()
    }

    const botTryEndTurn = () => {
      if (currentPlayer.value.type !== 'bot' || turnState.value !== 'finished') return

      scheduleTask(() => {
        endTurn()
      }, 1000)
    }

    const buyProperty = (buy: boolean) => {
      if (turnState.value !== 'buying' || !currentActionSquare.value) return

      const player = currentPlayer.value
      const square = currentActionSquare.value
      const price = square.price || 0

      if (buy && player.balance >= price) {
        player.balance -= price
        square.ownerId = player.id
        addLog(`${player.name} đã MUA ${square.name} với giá $${price}`)
      } else if (buy) {
        addLog(`${player.name} KHÔNG ĐỦ TIỀN mua ${square.name}`)
      } else {
        addLog(`${player.name} BỎ QUA không mua ${square.name}`)
      }

      turnState.value = 'finished'
      botTryEndTurn()
    }

    const botDecideBuy = (square: Square) => {
      const player = currentPlayer.value

      scheduleTask(() => {
        const bufferMoney = Math.random() < 0.5 ? 50 : 150
        const price = square.price || 0

        if (player.balance >= price + bufferMoney) {
          buyProperty(true)
        } else {
          buyProperty(false)
        }
      }, 1000)
    }

    const handleSquare = (square: Square) => {
      const player = currentPlayer.value
      turnState.value = 'action'
      addLog(`${player.name} đến ô: ${square.name}`)

      if (square.type === 'property') {
        if (!square.ownerId) {
          turnState.value = 'buying'
          if (player.type === 'bot') {
            botDecideBuy(square)
          }
          return
        }

        if (square.ownerId !== player.id) {
          const owner = players.value.find((entry) => entry.id === square.ownerId)
          const rent = square.rent || 0

          if (owner) {
            addLog(`${player.name} phải trả tiền thuê $${rent} cho ${owner.name}`)
            player.balance -= rent
            owner.balance += rent
            audio.playBad()
          }
        }
      } else if (square.type === 'tax') {
        const taxAmount = square.rent || 200
        addLog(`${player.name} nộp thuế $${taxAmount}`)
        player.balance -= taxAmount
        audio.playBad()
      } else if (square.type === 'gotojail') {
        addLog(`${player.name} BỊ BẮT GIAM!`)
        player.position = 5
        player.inJail = true
        player.jailTurns = 0
        hasExtraTurn.value = false
        doublesCount.value = 0
        audio.playBad()
      } else if (square.type === 'chance') {
        const chanceRoll = Math.random()

        if (chanceRoll < 0.3) {
          addLog(`Cơ hội: ${player.name} nhặt được ví. Nhận $100`)
          player.balance += 100
          audio.playMoney()
        } else if (chanceRoll < 0.6) {
          addLog(`Cơ hội: ${player.name} vi phạm giao thông. Phạt $50`)
          player.balance -= 50
          audio.playBad()
        } else {
          addLog(`Cơ hội: ${player.name} được tiến thêm 3 bước.`)
          movePlayer(3)
          return
        }
      }

      turnState.value = 'finished'
      botTryEndTurn()
    }

    const movePlayer = (steps: number) => {
      turnState.value = 'moving'
      const player = currentPlayer.value

      if (player.inJail) {
        if (diceValue1.value === diceValue2.value) {
          addLog(`${player.name} đổ xúc xắc đôi! Thoát khỏi nhà tù.`)
          player.inJail = false
          player.jailTurns = 0
          audio.playMoney()
        } else {
          player.jailTurns++
          addLog(`${player.name} ở trong tù lượt ${player.jailTurns}.`)

          if (player.jailTurns >= 3) {
            addLog(`${player.name} phải nộp tiền bảo lãnh $50 để ra tù.`)
            player.balance -= 50
            player.inJail = false
            player.jailTurns = 0
            audio.playBad()
          } else {
            turnState.value = 'finished'
            botTryEndTurn()
            return
          }
        }
      }

      let remaining = steps

      const moveStep = () => {
        if (remaining <= 0) {
          currentActionSquare.value = board.value[player.position]
          handleSquare(currentActionSquare.value)
          return
        }

        const startPos = player.position
        player.position = (player.position + 1) % board.value.length
        remaining--
        audio.playStep()

        if (player.position < startPos && !player.inJail) {
          addLog(`${player.name} đi qua BẮT ĐẦU. Nhận $200!`)
          player.balance += 200
          audio.playMoney()
        }

        scheduleTask(moveStep, 350)
      }

      moveStep()
    }

    const rollDice = () => {
      if (turnState.value !== 'idle' || isRolling.value) return

      audio.initAudio()
      audio.playShake()

      isRolling.value = true
      turnState.value = 'moving'

      const diceOne = Math.floor(Math.random() * 6) + 1
      const diceTwo = Math.floor(Math.random() * 6) + 1
      const total = diceOne + diceTwo

      diceValue1.value = diceOne
      diceValue2.value = diceTwo
      rollCount.value++

      if (diceOne === diceTwo && !currentPlayer.value.inJail) {
        doublesCount.value++
        hasExtraTurn.value = true

        if (doublesCount.value === 3) {
          scheduleTask(() => {
            isRolling.value = false

            scheduleTask(() => {
              addLog(`🚨 ${currentPlayer.value.name} đổ 3 lần xúc xắc đôi! Đi thẳng vào Tù!`)
              audio.playBad()
              currentPlayer.value.position = 5
              currentPlayer.value.inJail = true
              currentPlayer.value.jailTurns = 0
              hasExtraTurn.value = false
              doublesCount.value = 0
              turnState.value = 'finished'
              botTryEndTurn()
            }, 500)
          }, 1000)

          return
        }

        addLog(`🎲 ${currentPlayer.value.name} quay trúng Cặp đôi! (Được đi thêm 1 lượt)`)
      } else {
        hasExtraTurn.value = false
        if (!currentPlayer.value.inJail) {
          doublesCount.value = 0
        }
      }

      scheduleTask(() => {
        isRolling.value = false

        scheduleTask(() => {
          addLog(`${currentPlayer.value.name} đổ xúc xắc: ${diceOne} + ${diceTwo} = ${total}`)
          movePlayer(total)
        }, 500)
      }, 1000)
    }

    const endTurn = () => {
      if (turnState.value !== 'finished') return

      if (hasExtraTurn.value) {
        addLog(`▶ Lượt phụ: ${currentPlayer.value.name} tiếp tục đổ xúc xắc!`)
      } else {
        currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length
        doublesCount.value = 0
      }

      turnState.value = 'idle'
      currentActionSquare.value = null

      if (currentPlayer.value.type === 'bot') {
        scheduleTask(() => {
          rollDice()
        }, 1000)
      }
    }

    const resetGame = () => {
      gameSessionId.value++
      clearPendingTasks()
      players.value = createPlayers()
      board.value = createBoard()
      currentPlayerIndex.value = 0
      turnState.value = 'idle'
      diceValue1.value = 1
      diceValue2.value = 1
      logs.value = ['Trò chơi bắt đầu!']
      currentActionSquare.value = null
      isRolling.value = false
      rollCount.value = 0
      hasExtraTurn.value = false
      doublesCount.value = 0
    }

    return {
      players,
      board,
      currentPlayerIndex,
      diceValue1,
      diceValue2,
      currentPlayer,
      logs,
      turnState,
      currentActionSquare,
      isRolling,
      rollCount,
      rollDice,
      buyProperty,
      endTurn,
      resetGame,
      hasExtraTurn,
      doublesCount,
    }
  },
  {
    persist: true,
  },
)
