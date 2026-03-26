# 📋 Tổng quan kiến trúc - Vibe Platform

Dự án **Vibe Platform (Project Showcase)** là một nền tảng tập hợp các ứng dụng mini hiệu năng cao, xây dựng trên nền tảng **Vue 3 + TypeScript + Vite**.

## 🏗 Kiến trúc dự án
1. **Core Strategy**: Modular Architecture (Kiến trúc mô-đun). Mỗi Mini App hoạt động độc lập trong thư mục riêng tại `src/views/`.
2. **State Management**: Sử dụng **Pinia** tập trung, tích hợp persistence (lưu trữ tự động thông qua plugin).
3. **Engine Logic**: Toàn bộ logic xử lý nặng tách biệt khỏi UI (`engine.ts`), đảm bảo hiệu năng và tính kế thừa (Pure Logic).

## 📜 Các bộ quy tắc (The Guidelines)
Dự án tuân thủ nghiêm ngặt các quy tắc sau (Hãy đọc kỹ trước khi bắt đầu):

| Tài liệu | Nội dung chính |
| :---| :---|
| 🛠 **[Contributing Guide](docs/CONTRIBUTING.md)** | Zero-Any Policy, TypeScript Rules, Folder Structure, Commit Convention. |
| 🎨 **[Design System](docs/DESIGN_SYSTEM.md)** | Bảng màu tập trung, Glassmorphism, Typography, Animations. |

## 🚀 Tính năng nổi bật
*   **Dynamic Route Generation**: Hệ thống tự động quét folder `views` để sinh định tuyến dựa trên `meta.ts`.
*   **Persistent Save System**: Tự động lưu trữ thông tin game qua `localStorage` nhờ middleware Pinia.
*   **Zero-Any Commitment**: Cam kết type-safe 100% cho mọi agent AI và developer tham gia.

---
📌 *Ghi chú cho AI Agent:* Trước khi thực hiện bất kỳ lệnh code nào, hãy đọc kỹ **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** để đảm bảo không vi phạm Type-safety và cấu trúc dự án.

## 📦 Danh sách Mini-Apps hiện có
- **Bói Bài Oracle** (`oracle-tarot`): Lắng nghe thông điệp huyền bí từ vũ trụ thông qua những lá bài Tarot kỹ thuật số linh ứng.
- **Color Game** (`color-game`): Trò chơi đoán màu sắc đơn giản.
- **Mini Piano** (`mini-piano`): Chơi piano trên trình duyệt.
- **Neon Typing** (`neon-typing`): Thử thách gõ phím tốc độ cao với hiệu ứng Neon và WPM thời gian thực.
- **Ngã Rẽ Cuộc Đời** (`ngare`): Game mô phỏng hành trình định hình tương lai qua những lựa chọn quan trọng.

---
*Lưu ý: Luôn chạy `pnpm generate:pages` sau khi thêm hoặc đổi tên App để Launcher cập nhật dữ liệu JSON.*

## 📦 Danh sách Mini-Apps (Tự động cập nhật)
- **Bói Bài Oracle** (`oracle-tarot`): Lắng nghe thông điệp huyền bí từ vũ trụ thông qua những lá bài Tarot kỹ thuật số linh ứng.
- **Color Game** (`color-game`): Tro choi doan mau sac don gian
- **Mini Piano** (`mini-piano`): Choi piano tren trinh duyet
- **Monopoly** (`monopoly`): Game cờ tỉ phú (Neo-Monopoly) phiên bản web. Chơi với AI để tranh giành tài sản.
- **Neon Typing** (`neon-typing`): Thử thách gõ phím tốc độ cao với hiệu ứng Neon và WPM thời gian thực.
- **Ngã Rẽ Cuộc Đời** (`ngare`): Game mô phỏng cuộc đời, nơi mỗi lựa chọn định hình tương lai của bạn.

---