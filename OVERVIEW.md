# 🗺️ Vibe Platform Architecture Overview

Bạn là Senior Fullstack Developer đang tham gia phát triển **Vibe Platform** - Một hệ sinh thái Launcher chứa các Mini Apps độc lập. 

## 📐 Design Principles (Nguyên tắc thiết kế cốt lõi)

1.  **Strict Type-Safety (Zero Any Policy):** 
    - Tuyệt đối KHÔNG sử dụng `any` trong toàn bộ dự án. 
    - Lỗi `no-explicit-any` phải được fix bằng cách định nghĩa Interface/Type rõ ràng.
    - AI Agent sử dụng `any` sẽ bị coi là **Không tuân thủ kiến trúc**.

2.  **Modular & Decoupled Architecture:** 
    - Mỗi mini-app là một "ốc đảo" tách biệt hoàn toàn. 
    - CẤM import chéo logic, store, hoặc engine giữa các mini-apps khác nhau (`views/`). 
    - Logic dùng chung bắt buộc phải nằm ở `src/utils/` hoặc `src/types/`.

3.  **State-Driven Development:** 
    - Trạng thái game/app phải được quản lý tập trung qua **Pinia Stores** (`src/stores/`).
    - Sử dụng `persistedstate` để tự động hóa việc lưu trữ (Persistence) thay vì `localStorage` thủ công.

## 🏗️ Core Architecture (App Shell)
- **Kiến trúc:** Modular Micro-frontend. Mỗi mini-app nằm trong `src/views/<slug>/`.
- **Discovery:** Hệ thống tự động quét các thư mục con trong `views` để sinh định tuyến (Router).
- **Metadata:** Mỗi app bắt buộc phải có `meta.ts` export một object `PageMeta`.
- **Data Registry:** File `/public/data/pages.json` lưu trữ toàn bộ dữ liệu meta của các app, được sinh ra bởi lệnh `pnpm generate:pages`.

## 🛠️ Tech Stack & Rules
- **Framework:** Vue 3 (Composition API) + Pinia (State Management).
- **TypeScript:** Chế độ nghiêm ngặt (Strict Mode). Không dùng `any`.
- **Validation:** Sử dụng **Zod** để validate metadata tại `src/types/page.ts`.
- **Routing:** Tự động tạo route dựa trên thư mục folder.
- **CSS:** Vanilla CSS + Tailwind. Sử dụng CSS Variables cho màu sắc và glassmorphism.

## 📂 Directory Layout
- `scripts/`: Chứa các công cụ tự động (Tạo app mới, sinh tệp JSON meta).
- `src/stores/`: `usePagesStore.ts` quản lý lịch sử (history), yêu thích (favorites) và bộ lọc ứng dụng.
- `src/types/`: Nơi định nghĩa các interface chuẩn cho toàn hệ thống.
- `src/views/`: Nơi chứa 100% các mini-app. Quy tắc: **Không import chéo logic giữa các thư mục trong này.**

## 🤖 AI Guidelines for This Project
1. **Trước khi thực hiện bất kỳ task nào:** Phải đọc `.antigravity/rules/coding_standards.md` để nắm bắt kỹ thuật.
2. **Khi viết logic:** Luôn định nghĩa Interface trước. Nếu gặp lỗi `any`, hãy tìm cách định nghĩa Type thay vì dùng `@ts-ignore`.
3. **Khi cập nhật Meta:** Tuyệt đối không xóa các trường bắt buộc (`name`, `description`, `category`) vì sẽ làm lỗi build script.
4. **Style:** Giữ phong cách UI hiện đại (Digital Curator), dark mode, glow và micro-animations.

---
*Lưu ý: Luôn chạy `pnpm generate:pages` sau khi thêm hoặc đổi tên App để Launcher cập nhật dữ liệu.*


## 📦 Danh sách Mini-Apps (Tự động cập nhật)
- **Color Game** (`color-game`): Tro choi doan mau sac don gian
- **Mini Piano** (`mini-piano`): Choi piano tren trinh duyet
- **Ngã Rẽ Cuộc Đời** (`ngare`): Game mô phỏng cuộc đời, nơi mỗi lựa chọn định hình tương lai của bạn.

---