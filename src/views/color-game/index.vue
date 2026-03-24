<script setup lang="ts">
import { ref, onMounted } from 'vue'

const targetColor = ref('')
const colorOptions = ref<string[]>([])
const message = ref('Hãy chọn màu đúng!')
const score = ref(0)
const isGameOver = ref(false)

const generateRandomColor = () => {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return `rgb(${r}, ${g}, ${b})`
}

const startNewGame = () => {
  targetColor.value = generateRandomColor()
  const options = [targetColor.value]
  while (options.length < 4) {
    const randomColor = generateRandomColor()
    if (!options.includes(randomColor)) {
      options.push(randomColor)
    }
  }
  colorOptions.value = options.sort(() => Math.random() - 0.5)
  message.value = 'Hãy chọn màu đúng!'
  isGameOver.value = false
}

const checkColor = (color: string) => {
  if (isGameOver.value) return
  
  if (color === targetColor.value) {
    score.value++
    message.value = 'Chính xác! 🎉'
    isGameOver.value = true
    setTimeout(startNewGame, 1500)
  } else {
    message.value = 'Sai rồi! Thử lại nhé. ❌'
    score.value = Math.max(0, score.value - 1)
  }
}

onMounted(() => {
  startNewGame()
})
</script>

<template>
  <div class="color-game-container">
    <div class="game-header">
      <RouterLink class="back-link" to="/">← Về trang chủ</RouterLink>
      <div class="stats">
        <span class="score">Điểm: {{ score }}</span>
      </div>
    </div>

    <main class="game-content">
      <h1 class="title">Trò chơi Màu sắc</h1>
      <p class="description">Tìm xem màu nào tương ứng với mã RGB dưới đây:</p>
      
      <div class="target-code">{{ targetColor }}</div>

      <div class="color-grid">
        <button 
          v-for="color in colorOptions" 
          :key="color"
          class="color-btn"
          :style="{ backgroundColor: color }"
          @click="checkColor(color)"
        ></button>
      </div>

      <p class="message" :class="{ success: isGameOver }">{{ message }}</p>
      
      <button class="reset-btn" @click="startNewGame">Đổi mã màu khác</button>
    </main>
  </div>
</template>

<style scoped>
.color-game-container {
  min-height: 100vh;
  background: #060e20;
  color: #dee5ff;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.back-link {
  color: #6dddff;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.back-link:hover { opacity: 0.8; }

.score {
  font-size: 1.2rem;
  font-weight: 700;
  background: rgba(109, 221, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 99px;
  color: #6dddff;
}

.game-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.description {
  color: #a3aac4;
  margin-bottom: 2rem;
}

.target-code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 2rem;
  font-weight: 800;
  padding: 1.5rem 3rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(109, 221, 255, 0.2);
  border-radius: 20px;
  margin-bottom: 3rem;
  color: #6dddff;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  width: 100%;
  margin-bottom: 2rem;
}

.color-btn {
  height: 120px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
}

.color-btn:hover {
  transform: scale(1.05);
}

.message {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  height: 1.5rem;
}

.message.success { color: #4ade80; }

.reset-btn {
  background: none;
  border: 1px solid rgba(109, 221, 255, 0.3);
  color: #a3aac4;
  padding: 0.8rem 1.5rem;
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: rgba(109, 221, 255, 0.1);
  color: #6dddff;
  border-color: #6dddff;
}
</style>
