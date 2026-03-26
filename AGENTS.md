# 🤖 AI AGENT GUIDELINES — Vibe Platform

Chào Senior AI Agent! File này là "bản đồ" để bạn vận hành trong dự án **Project Showcase (Digital Curator Style)**. Hãy đọc kỹ trước khi thực hiện bất kỳ lệnh code nào.

## 🚀 Project Overview
Vibe Platform là một Launcher chứa hàng loạt Mini Apps/Games độc lập. Homepage (`src/views/home/`) là nơi khám phá, lọc và yêu thích các ứng dụng.

## 🛠 Tech Stack (Sử dụng đúng công cụ)
- **Vue 3.x** (Composition API, `<script setup lang="ts">`)
- **TypeScript** (Strict Mode — **ZERO ANY POLICY**)
- **Vite 6** (Bundler)
- **Pinia** (State Management) + `pinia-plugin-persistedstate` (Tự động lưu localStorage)
- **Zod** (Runtime Validation) — Dùng cho mọi dữ liệu JSON nạp vào máy.
- **Vanilla CSS + CSS Variables** (Design System linh hoạt)

## 📐 Architecture: The "Modular View" Rule
Mọi ứng dụng con nằm trong `src/views/<slug>/`.

### 📂 Recommended Internal Structure:
```
src/views/<slug>/
  index.vue       # UI Controller (Template + Event Handlers)
  meta.ts         # Metadata (Bắt buộc để Launcher tự động Discovery)
  engine.ts       # Pure Logic (Game logic, calculations) - Phải tách khỏi UI
  types.ts        # Interface & Types riêng cho app
  components/     # UI Components dùng riêng
  composables/    # Business logic hooks (use-*.ts)
  data/           # Static data (JSON/TS)
```

## 🎨 Design System (Must Follow)
Tham khảo file chi tiết: [docs/DESIGN_SYSTEM.md](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/docs/DESIGN_SYSTEM.md)

- **Màu sắc:** Tuyệt đối không hard-code mã màu hex. Luôn dùng CSS Variables:
  - `--bg`, `--primary` (Xanh Neon), `--accent` (Tím Neon).
- **Glassmorphism:** Dùng `backdrop-filter: blur(12px)` + Border mỏng (`1px solid var(--outline)`).
- **Trạng thái:** Dùng `--primary-glow` cho các hiệu ứng ánh sáng.

## 🚦 AI Implementation Checklist (Làm đúng luật)

### 1. Zero-Any Commitment
- **CẤM DÙNG `any`**. Vi phạm là "Failed".
- Nếu không chắc kiểu, dùng `unknown` + Zod schema validation.
- Xem mẫu tại: `src/data/pages-loader.ts`.

### 2. Logic Separation (U - L Rule)
- UI (Vue file) chỉ lo hiển thị và gắn event. 
- Logic nặng (tính điểm, xử lý va chạm game, lọc dữ liệu phức tạp) **phải** nằm ở `engine.ts` hoặc `composables`.

### 3. Persistence by Default
- Không dùng `localStorage.setItem/getItem` trực tiếp cho state game.
- Hãy dùng **Pinia Store** và khai báo `persist: true`.

### 4. Shared Style Centralization
- Mọi CSS tokens mới phải được thêm vào `src/assets/styles/variables.css`.

## 📦 Adding a New Mini App
Để thêm 1 app mới (`my-game`):
1. Tạo folder `src/views/my-game/`.
2. Tạo `index.vue` (UI) và `meta.ts` (Metadata).
3. Export `PageMeta` từ `meta.ts`:
   ```ts
   import type { PageMeta } from '@/types/page'
   const meta: PageMeta = { name: 'My Game', description: 'desc', category: 'game', author: 'Truong Dinh Anh' }
   export default meta
   ```
4. Chạy `pnpm generate:pages` để Launcher cập nhật (AI hãy tự chạy lệnh này).

## 🧬 Discovery System
Hệ thống tự động quét folder `views`. Đừng cố gắng sửa file Router bằng tay. Router sẽ lấy dữ liệu từ `/public/data/pages.json`.

---
🚨 **Antigravity Alert:** Luôn chạy `pnpm lint` trước khi kết thúc một phần việc. Nếu có lỗi đỏ, hãy tự sửa ngay lập tức!
