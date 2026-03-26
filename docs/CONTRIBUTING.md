# Hướng dẫn đóng góp

Dự án **Project Showcase (Vibe Platform)** tuân thủ các quy tắc nghiêm ngặt để đảm bảo chất lượng code và tính bảo trì cao nhất.

## 🛠 Yêu cầu kỹ thuật
- **Node.js**: ^20.x hoặc cao hơn.
- **Package Manager**: `pnpm` (Bắt buộc).
- **Type System**: TypeScript (Strict Mode).

## 📐 Quy tắc Code (The Rules)
1. **Zero-Any Policy**: Cấm tuyệt đối sử dụng kiểu dữ liệu `any`. 
   - Mọi biến, tham số, giá trị trả về phải có Type rõ ràng.
   - Nếu dữ liệu không xác định từ bên ngoài, dùng `unknown` kèm Type Guarding/Zod Validation.
2. **Vue 3 Best Practices**:
   - Sử dụng `<script setup lang="ts">`.
   - Sử dụng Composition API (Không dùng Options API).
   - Logic phức tạp (> 20 dòng) phải tách ra `composables/`.
3. **State Management**:
   - Dùng **Pinia** cho các trạng thái cần chia sẻ giữa các trang.
   - Tích hợp `pinia-plugin-persistedstate` để tự động lưu trữ (Persistence).

## 📁 Cấu trúc thư mục (Folder Structure)
Mỗi Mini App phải nằm trong thư mục riêng tại `src/views/<tên-app>/`:
```
src/views/<tên-app>/
  index.vue       # Entry point (Bắt buộc)
  meta.ts         # Metadata: name, description, category (Bắt buộc)
  types.ts        # Định nghĩa kiểu dữ liệu riêng
  engine.ts       # Logic thuần túy (Pure Logic) - Tách biệt hoàn toàn khỏi UI
  components/     # UI components con
  composables/    # Logic hooks (use-*.ts)
```

## 📜 Commit Convention
Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):
- `feat`: Tính năng mới.
- `fix`: Sửa lỗi.
- `refactor`: Tái cấu trúc code (không thay đổi logic).
- `docs`: Cập nhật tài liệu.
- `chore`: Cập nhật dependencies, build script, v.v.

---
📌 **Mọi Pull Request/Commit phải đạt chuẩn `pnpm lint` mới được chấp nhận.**
