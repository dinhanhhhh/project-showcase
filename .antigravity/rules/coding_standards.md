# 🚦 GLOBAL CODING STANDARDS (MANDATORY)

Mọi AI Agent và Developer tham gia dự án **Vibe Platform** phải tuân thủ nghiêm ngặt các quy định sau:

## 📐 1. STRICT TYPE-SAFETY (ZERO ANY POLICY)
- **CẤM TUYỆT ĐỐI** sử dụng `any` trong toàn bộ dự án.
- **Fixed:** Luôn định nghĩa `interface` hoặc `type`. Nếu dữ liệu không rõ ràng, dùng `unknown` kèm Type Guarding/Zod.
- **Doc Chi Tiết:** [docs/CONTRIBUTING.md](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/docs/CONTRIBUTING.md)

## 🎨 2. CONSISTENT DESIGN SYSTEM
- **Màu sắc:** Tuyệt đối không hard-code mã màu. Dùng biến CSS từ `src/assets/styles/variables.css`.
- **Phong cách:** Glassmorphism, Neon, Dark Mode.
- **Doc Chi Tiết:** [docs/DESIGN_SYSTEM.md](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/docs/DESIGN_SYSTEM.md)

## 🧱 3. ARCHITECTURE & DISCOVERY
- **Modular:** Tách biệt Logic (Engine) và UI (Vue). 
- **State:** Dùng Pinia Store cho Persistence.
- **Automation:** Phải cập nhật `meta.ts` cho mỗi Mini App để hệ thống tự Discovery.
- **Doc Chi Tiết:** [OVERVIEW.md](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/OVERVIEW.md)

## 🧪 4. QUALITY ASSURANCE
- **Linting:** `pnpm lint` phải pass 100% trước khi kết thúc task.
- **Testing:** Cập nhật Unit Test cho logic game quan trọng.

---
🚀 **Antigravity phải đọc kỹ các file Docs trên trước khi thực hiện bất kỳ thay đổi nào.**
