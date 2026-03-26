<script setup lang="ts">
import { computed } from 'vue'
import { useMonopolyStore } from './engine'

const store = useMonopolyStore()

const handleRoll = () => {
  store.rollDice()
}

const handleBuy = (buy: boolean) => {
  store.buyProperty(buy)
}

const handleEndTurn = () => {
  store.endTurn()
}

const handleReset = () => {
  store.resetGame()
}

const isHumanTurn = computed(() => store.currentPlayer?.type === 'human')

// Tính toán ô trên bảng 
// Bảng có 20 ô: 6 ô cạnh trên (0->5), 6 ô cạnh phải (5->10)...
// Map id sang style column, row. Grid: 6x6.
const getSquareStyle = (id: number) => {
  let row = 1, col = 1
  if (id >= 0 && id <= 5) {
    row = 1
    col = id + 1
  } else if (id >= 5 && id <= 10) {
    col = 6
    row = (id - 5) + 1
  } else if (id >= 10 && id <= 15) {
    row = 6
    col = 6 - (id - 10)
  } else if (id >= 15 && id <= 19) {
    col = 1
    row = 6 - (id - 15)
  }
  return {
    gridColumn: col,
    gridRow: row
  }
}

// 3D Dice transform logic
const getTransformForDice = (value: number, rollCount: number, isDice2 = false) => {
  // Add some random variation to spin direction and extra tumbling distance
  const baseSpins = rollCount * 360 * 2; // 2 full extra spins
  const spinsX = baseSpins + (isDice2 ? 720 : 0);
  const spinsY = baseSpins + (isDice2 ? 0 : 720);

  let targetX = 0, targetY = 0;
  // Map values to cube face rotations
  switch (value) {
    case 1: targetX = 0; targetY = 0; break; // front
    case 2: targetX = 0; targetY = 180; break; // back
    case 3: targetX = 0; targetY = -90; break; // right
    case 4: targetX = 0; targetY = 90; break; // left
    case 5: targetX = -90; targetY = 0; break; // top
    case 6: targetX = 90; targetY = 0; break; // bottom
  }
  
  return `rotateX(${targetX - spinsX}deg) rotateY(${targetY - spinsY}deg)`;
}

</script>

<template>
  <div class="monopoly-app">
    <header class="game-header">
      <h1>💰 Neo Monopoly</h1>
      <button
        class="reset-btn"
        @click="handleReset"
      >
        Chơi Lại
      </button>
    </header>

    <div class="game-layout">
      <!-- Player Status Side -->
      <aside class="side-panel">
        <div 
          v-for="p in store.players" 
          :key="p.id" 
          class="player-card"
          :class="{'active-player': p.id === store.currentPlayer?.id}"
          :style="{'--player-color': p.color}"
        >
          <div
            class="p-avatar"
            :style="{ backgroundColor: p.color}"
          />
          <div class="p-info">
            <h3>{{ p.name }}</h3>
            <p class="balance">
              ${{ p.balance }}
            </p>
            <span
              v-if="p.inJail"
              class="tag jail"
            >In Jail</span>
          </div>
        </div>

        <div class="logs">
          <h3>Nhật ký trận đấu</h3>
          <div class="log-entries">
            <div
              v-for="(log, idx) in store.logs"
              :key="idx"
              class="log-entry"
            >
              > {{ log }}
            </div>
          </div>
        </div>
      </aside>

      <!-- Center Board -->
      <main class="board-container">
        <div class="board-grid">
          <div 
            v-for="sq in store.board" 
            :key="sq.id" 
            class="board-square"
            :style="getSquareStyle(sq.id)"
            :class="[sq.type]"
          >
            <div
              class="sq-top"
              :style="{ backgroundColor: sq.colorGroup || 'transparent' }"
            >
              <span v-if="sq.type === 'property' && sq.price">${{ sq.price }}</span>
            </div>
            <div class="sq-body">
              <p class="sq-name">
                {{ sq.name }}
              </p>
            </div>
            <div
              v-if="sq.ownerId"
              class="sq-owner"
            >
              <div 
                class="owner-tag" 
                :style="{backgroundColor: store.players?.find(x => x.id === sq.ownerId)?.color}"
              />
            </div>

            <!-- Player Tokens -->
            <div class="tokens">
              <div 
                v-for="p in store.players.filter(x => x.position === sq.id)" 
                :key="p.id"
                class="token"
                :style="{ backgroundColor: p.color }"
              />
            </div>
          </div>
          
          <!-- Board Center Actions -->
          <div class="board-center">
            <div class="dice-scene">
              <!-- Xúc xắc 1 -->
              <div 
                class="die-3d" 
                :class="{ 'is-rolling-3d': store.isRolling }"
                :style="!store.isRolling ? { transform: getTransformForDice(store.diceValue1, store.rollCount) } : {}"
              >
                <div class="face front face-val-1">
                  <div
                    v-for="n in 9"
                    :key="'1-1-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face back face-val-2">
                  <div
                    v-for="n in 9"
                    :key="'1-2-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face right face-val-3">
                  <div
                    v-for="n in 9"
                    :key="'1-3-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face left face-val-4">
                  <div
                    v-for="n in 9"
                    :key="'1-4-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face top face-val-5">
                  <div
                    v-for="n in 9"
                    :key="'1-5-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face bottom face-val-6">
                  <div
                    v-for="n in 9"
                    :key="'1-6-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
              </div>

              <!-- Xúc xắc 2 -->
              <div 
                class="die-3d" 
                :class="{ 'is-rolling-3d': store.isRolling }"
                :style="!store.isRolling ? { transform: getTransformForDice(store.diceValue2, store.rollCount, true) } : {}"
              >
                <div class="face front face-val-1">
                  <div
                    v-for="n in 9"
                    :key="'2-1-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face back face-val-2">
                  <div
                    v-for="n in 9"
                    :key="'2-2-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face right face-val-3">
                  <div
                    v-for="n in 9"
                    :key="'2-3-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face left face-val-4">
                  <div
                    v-for="n in 9"
                    :key="'2-4-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face top face-val-5">
                  <div
                    v-for="n in 9"
                    :key="'2-5-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
                <div class="face bottom face-val-6">
                  <div
                    v-for="n in 9"
                    :key="'2-6-'+n"
                    class="dot"
                    :class="'dot-' + n"
                  />
                </div>
              </div>
            </div>
            
            <div
              v-if="isHumanTurn"
              class="action-panel"
            >
              <button 
                v-if="store.turnState === 'idle'" 
                class="btn action" 
                @click="handleRoll"
              >
                🎲 Đổ Xúc Xắc
              </button>
              
              <div
                v-if="store.turnState === 'buying'"
                class="buy-prompt"
              >
                <p>Mua <strong>{{ store.currentActionSquare?.name }}</strong> với giá ${{ store.currentActionSquare?.price }}?</p>
                <div class="btn-group">
                  <button
                    class="btn accent"
                    @click="handleBuy(true)"
                  >
                    MUA
                  </button>
                  <button
                    class="btn danger"
                    @click="handleBuy(false)"
                  >
                    BỎ QUA
                  </button>
                </div>
              </div>

              <button 
                v-if="store.turnState === 'finished'" 
                class="btn action end-turn" 
                @click="handleEndTurn"
              >
                ▶️ Kết thúc Lượt
              </button>
            </div>
            
            <div
              v-else
              class="action-panel waiting"
            >
              <p>⏳ Chờ Bot hành động...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.monopoly-app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
  overflow: hidden;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--outline);
  margin-bottom: 1rem;
}

.game-header h1 {
  background: linear-gradient(45deg, var(--primary), var(--accent));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.reset-btn {
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.reset-btn:hover {
  background: var(--danger-bg);
}

.game-layout {
  display: flex;
  flex: 1;
  gap: 1.5rem;
  overflow: hidden;
}

.side-panel {
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-card {
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: var(--transition-fast);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.player-card.active-player {
  border: 2px solid var(--player-color, var(--primary));
  box-shadow: 0 0 12px var(--player-color);
  animation: playerPulse 2s infinite ease-in-out;
  z-index: 10;
}

@keyframes playerPulse {
  0% { box-shadow: 0 0 8px var(--player-color); }
  50% { box-shadow: 0 0 16px var(--player-color); }
  100% { box-shadow: 0 0 8px var(--player-color); }
}

.p-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--text);
  flex-shrink: 0;
}

.p-info h3 {
  margin: 0;
  font-size: 1rem;
}
.balance {
  margin: 0;
  color: var(--primary);
  font-weight: bold;
  font-size: 1.1rem;
}

.tag.jail {
  display: inline-block;
  font-size: 0.7rem;
  background: var(--danger-bg);
  color: var(--danger);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
}

.logs {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* Quyết định: Ngăn .logs bị phồng ra lớn hơn flex space */
  box-sizing: border-box;
}

.logs h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--text-dim);
  flex-shrink: 0;
}

.log-entries {
  flex: 1;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-entry {
  color: var(--text-dim);
}

.log-entry:first-child {
  color: var(--text);
  font-weight: bold;
}

/* Board Area */
.board-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 1rem;
  overflow: hidden;
}

.board-grid {
  display: grid;
  width: 100%;
  max-width: 80vh; /* Giữ bảng luôn nằm gọn trong màn hình laptop/PC */
  aspect-ratio: 1 / 1; /* Luôn giữ form hình vuông */
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 4px;
  padding: 4px;
  background: var(--outline);
  border-radius: 8px;
  position: relative;
}

.board-square {
  background: var(--bg);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.board-square:hover {
  filter: brightness(1.2);
}

.sq-top {
  height: 25%;
  min-height: 12px;
  font-size: clamp(0.55rem, 1vw, 0.7rem);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #fff;
}

.sq-body {
  flex: 1;
  padding: 2px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sq-name {
  margin: 0;
  font-size: clamp(0.5rem, 1vw, 0.8rem);
  line-height: 1.2;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.sq-owner {
  position: absolute;
  top: 25%;
  right: 2px;
}
.owner-tag {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* Specific Types */
.go .sq-body { color: var(--primary); font-weight: bold; }
.jail .sq-body { color: var(--danger); }
.tax .sq-body { color: #ff9800; }
.chance .sq-body { color: var(--accent); }

/* Tokens */
.tokens {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 4px;
}

.token {
  width: clamp(10px, 1.5vw, 18px);
  height: clamp(10px, 1.5vw, 18px);
  border-radius: 50%;
  border: 1px solid #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  animation: dropIn 0.3s ease-out;
}

@keyframes dropIn {
  0% { transform: translateY(-10px); opacity: 0;}
  100% { transform: translateY(0); opacity: 1;}
}

/* center */
.board-center {
  grid-column: 2 / 6;
  grid-row: 2 / 6;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  border-radius: 8px;
  padding: 1rem;
}

.dice-scene {
  perspective: 800px;
  display: flex;
  gap: 10%;
  margin-bottom: 0.5rem;
}

.die-3d {
  width: 40px;
  height: 40px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.is-rolling-3d {
  animation: tumbling 0.4s linear infinite;
  transition: none !important;
}

@keyframes tumbling {
  0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1); }
  50% { transform: rotateX(180deg) rotateY(360deg) rotateZ(180deg) scale(1.1); }
  100% { transform: rotateX(360deg) rotateY(720deg) rotateZ(360deg) scale(1); }
}

.face {
  position: absolute;
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 6px;
  padding: 4px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.2), 0 0 1px 1px var(--outline);
  box-sizing: border-box;
}

.face .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
  margin: auto;
}

.face-val-1 .dot-5,
.face-val-2 .dot-1, .face-val-2 .dot-9,
.face-val-3 .dot-1, .face-val-3 .dot-5, .face-val-3 .dot-9,
.face-val-4 .dot-1, .face-val-4 .dot-3, .face-val-4 .dot-7, .face-val-4 .dot-9,
.face-val-5 .dot-1, .face-val-5 .dot-3, .face-val-5 .dot-5, .face-val-5 .dot-7, .face-val-5 .dot-9,
.face-val-6 .dot-1, .face-val-6 .dot-3, .face-val-6 .dot-4, .face-val-6 .dot-6, .face-val-6 .dot-7, .face-val-6 .dot-9 {
  background: #333;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);
}

.front  { transform: rotateY(0deg) translateZ(20px); }
.back   { transform: rotateY(180deg) translateZ(20px); }
.right  { transform: rotateY(90deg) translateZ(20px); }
.left   { transform: rotateY(-90deg) translateZ(20px); }
.top    { transform: rotateX(90deg) translateZ(20px); }
.bottom { transform: rotateX(-90deg) translateZ(20px); }

.action-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn.action {
  background: var(--primary);
  color: var(--bg);
  box-shadow: 0 0 10px var(--primary-glow);
}

.btn.action:hover {
  transform: scale(1.05);
  filter: brightness(1.2);
}

.btn.end-turn {
  background: var(--text-dim);
  box-shadow: none;
}
.btn.end-turn:hover {
  background: var(--text);
}

.btn-group {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
.btn.accent {
  background: var(--accent);
  color: white;
}
.btn.danger {
  background: var(--danger);
  color: white;
}
.buy-prompt {
  text-align: center;
  background: rgba(0,0,0,0.5);
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--accent);
}
.buy-prompt p {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
}
.waiting {
  color: var(--text-dim);
  font-style: italic;
  font-size: 1rem;
}

/* RESPONSIVE DESIGN - MOBILE & TABLET */
@media screen and (max-width: 900px) {
  .monopoly-app {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
  }
  
  .game-layout {
    flex-direction: column-reverse; /* Đưa bàn cờ lên trên, thông tin người chơi/log xuống dưới */
    overflow: visible;
  }

  .side-panel {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: stretch;
  }

  .player-card {
    flex: 1;
    min-width: 140px;
    padding: 0.75rem;
  }

  .logs {
    width: 100%;
    height: 200px; /* Cố định chiều cao log trên mobile để không chiếm hết chỗ */
  }

  .board-container {
    padding: 0.5rem;
  }

  .board-grid {
    max-width: 100%; /* Trên mobile thì ăn full width màn hình vuông luôn */
  }

  .sq-name {
    font-size: clamp(0.45rem, 2vw, 0.65rem); /* Text siêu nhỏ vẫn đọc được trên đt */
  }

  /* Thu nhỏ xúc xắc khi màn hình bé */
  .die-3d { width: 30px; height: 30px; }
  .face { width: 30px; height: 30px; padding: 2px; }
  .face .dot { width: 5px; height: 5px; }
  .front { transform: rotateY(0deg) translateZ(15px); }
  .back { transform: rotateY(180deg) translateZ(15px); }
  .right { transform: rotateY(90deg) translateZ(15px); }
  .left { transform: rotateY(-90deg) translateZ(15px); }
  .top { transform: rotateX(90deg) translateZ(15px); }
  .bottom { transform: rotateX(-90deg) translateZ(15px); }
}
</style>
