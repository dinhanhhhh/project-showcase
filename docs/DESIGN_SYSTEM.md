# Design System - Digital Curator Style

Vibe Platform được thiết kế theo phong cách hiện đại với: **Dark Mode, Glassmorphism, Neon Blue/Purple**. 🔮✨

## 🎨 Bảng màu (Colors)
Tất cả màu sắc được khai báo tập trung tại `src/assets/styles/variables.css`.

| Token | Giá trị | Cách dùng |
| :---| :---| :---|
| `--bg` | `#060e20` | Full page background |
| `--bg-sidebar` | `#091328` | Thanh bên (Sidebar) |
| `--bg-card` | `#141f38` | Dashboard cards, popups |
| `--primary` | `#6dddff` | Màu nhấn lạnh (Xanh neon) |
| `--accent` | `#d277ff` | Màu nhấn nóng (Tím neon) |
| `--text` | `#dee5ff` | Nội dung chính (Chữ sáng) |
| `--text-dim` | `#a3aac4` | Nội dung phụ, metadata |

## 📐 Quy tắc thiết kế (The Design Rules)
1. **Glassmorphism**:
   - Sử dụng `backdrop-filter: blur(12px)`.
   - Kết hợp `background: rgba(var(--bg-card), 0.7)`.
   - Border cực mỏng (`1px solid var(--outline)`).
2. **Typography**:
   - **Body**: [Inter](https://fonts.google.com/specimen/Inter) (Sạch sẽ, dễ đọc).
   - **Heading**: [Manrope](https://fonts.google.com/specimen/Manrope) (Bold, cá tính, mạnh mẽ).
3. **Animations**:
   - **Hover**: Biến đổi nhẹ nhàng (`transform: translateY(-4px)`).
   - **Transitions**: Dùng Cubic-bezier (`cubic-bezier(0.4, 0, 0.2, 1)`) cho mượt mà (smooth action).
4. **Icons**:
   - Ưu tiên dùng Emoji (nhẹ nhàng, vui vẻ) hoặc SVG Icons đơn giản.

---
🚀 **Thiết kế phải mang lại cảm giác "Wow" ngay từ giây đầu tiên.**
