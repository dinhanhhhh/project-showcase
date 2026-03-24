# 🗺️ Vibe Platform Architecture Overview

Bạn là Senior Fullstack Developer đang tham gia phát triển **Vibe Platform** - Một hệ sinh thái Launcher chứa các Mini Apps độc lập. 

## 🏗️ Core Architecture (App Shell)
- **Kiến trúc:** Modular Micro-frontend. Mỗi mini-app nằm trong `src/views/<slug>/`.
- **Discovery:** Hệ thống tự động quét các thư mục con trong `views` để sinh định tuyến (Router).
- **Metadata:** Mỗi app bắt buộc phải có `meta.ts` export một object `PageMeta`.
- **Data Registry:** File `/public/data/pages.json` lưu trữ toàn bộ dữ liệu meta của các app, được sinh ra bởi lệnh `pnpm generate:pages`.

## 🛠️ Tech Stack & Rules
- **Framework:** Vue 3 (Composition API) + Pinia (State Management).
- **Validation:** Sử dụng **Zod** để validate metadata tại `src/types/page.ts`. Tuyệt đối tuân thủ schema này.
- **Routing:** Tự động tạo route dựa trên thư mục folder. Trang chủ là `/home`.
- **CSS:** Vanilla CSS kết hợp Tailwind. Ưu tiên Variable và Glassmorphism (Digital Curator style).

## 📂 Directory Layout
- `scripts/`: Chứa các công cụ tự động (Tạo app mới, sinh tệp JSON meta).
- `src/stores/`: `usePagesStore.ts` quản lý lịch sử (history), yêu thích (favorites) và bộ lọc ứng dụng.
- `src/types/`: Nơi định nghĩa các interface chuẩn cho toàn hệ thống.
- `src/views/`: Nơi chứa 100% các mini-app. Quy tắc: **Không import chéo logic giữa các thư mục trong này.**

## 🤖 AI Guidelines for This Project
1. **Trước khi tạo app mới:** Luôn kiểm tra cấu trúc `index.vue` và `meta.ts`.
2. **Khi fix bug logic:** Hãy đảm bảo dữ liệu luôn đi qua Store (`usePagesStore`) để cập nhật history/favorites.
3. **Khi cập nhật Meta:** Tuyệt đối không xóa các trường bắt buộc (`name`, `description`, `category`) vì sẽ làm lỗi build script.
4. **Style:** Giữ phong cách UI hiện đại, dark mode, nhiều hiệu ứng lề nhòe (glow) và micro-animations.

---
*Lưu ý: Luôn chạy `pnpm generate:pages` sau khi thêm hoặc đổi tên App để Launcher cập nhật dữ liệu.*


## 📦 Danh sách Mini-Apps (Tự động cập nhật)
- **Color Game** (`color-game`): Tro choi doan mau sac don gian
- **Mini Piano** (`mini-piano`): Choi piano tren trinh duyet
- **Ngã Rẽ Cuộc Đời** (`ngare`): Game mô phỏng cuộc đời, nơi mỗi lựa chọn định hình tương lai của bạn.

---