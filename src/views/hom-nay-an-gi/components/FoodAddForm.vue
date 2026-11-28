<script setup lang="ts">
import type { FoodCategory, MealTime, PriceTier } from '../types'

defineProps<{
  emojiOptions: readonly string[]
  formError: string
  formSuccess: string
}>()

const newName = defineModel<string>('name', { required: true })
const newImage = defineModel<string>('image', { required: true })
const newCategory = defineModel<FoodCategory>('category', { required: true })
const newEmoji = defineModel<string>('emoji', { required: true })
const newMealTime = defineModel<MealTime>('mealTime', { required: true })
const newPriceTier = defineModel<PriceTier>('priceTier', { required: true })

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <form
    class="add-form"
    @submit.prevent="emit('submit')"
  >
    <h2>✨ Thêm món của riêng bạn</h2>

    <label class="field">
      <span>Tên món ăn *</span>
      <input
        v-model="newName"
        type="text"
        placeholder="Ví dụ: Cơm gà xối mỡ, Mì cay..."
        maxlength="60"
      >
    </label>

    <label class="field">
      <span>Link ảnh (tùy chọn)</span>
      <input
        v-model="newImage"
        type="url"
        placeholder="https://..."
      >
    </label>

    <div class="form-row">
      <label class="field">
        <span>Phân loại</span>
        <select v-model="newCategory">
          <option value="nuoc">Món nước</option>
          <option value="kho">Món khô</option>
          <option value="an-vat">Ăn vặt</option>
          <option value="custom">Món của tôi</option>
        </select>
      </label>

      <label class="field">
        <span>Biểu tượng</span>
        <select v-model="newEmoji">
          <option
            v-for="em in emojiOptions"
            :key="em"
            :value="em"
          >
            {{ em }}
          </option>
        </select>
      </label>
    </div>

    <div class="form-row">
      <label class="field">
        <span>Buổi phù hợp</span>
        <select v-model="newMealTime">
          <option value="sang">Sáng</option>
          <option value="trua">Trưa</option>
          <option value="toi">Tối</option>
          <option value="an-vat">Ăn vặt</option>
        </select>
      </label>

      <label class="field">
        <span>Mức giá</span>
        <select v-model="newPriceTier">
          <option value="tiet-kiem">Dưới 40k</option>
          <option value="vua-tui">40k – 80k</option>
          <option value="sang-chanh">Trên 80k</option>
        </select>
      </label>
    </div>

    <p
      v-if="formError"
      class="msg-error"
    >
      {{ formError }}
    </p>
    <p
      v-if="formSuccess"
      class="msg-success"
    >
      {{ formSuccess }}
    </p>

    <button
      type="submit"
      class="submit-btn"
    >
      + Thêm vào thực đơn
    </button>
  </form>
</template>

<style scoped>
.add-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.add-form h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field span {
  font-size: 0.8rem;
  color: var(--text-dim);
  font-weight: 600;
}

.field input,
.field select {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--outline);
  color: var(--text);
  font-size: 0.9rem;
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: var(--primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.msg-error {
  color: var(--danger);
  font-size: 0.82rem;
}

.msg-success {
  color: var(--property-group-a);
  font-size: 0.82rem;
}

.submit-btn {
  padding: 0.78rem;
  border-radius: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--primary);
  color: var(--primary);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-fast);
}

.submit-btn:hover {
  background: var(--primary);
  color: var(--text-inverse);
}
</style>
