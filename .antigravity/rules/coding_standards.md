# 🚦 GLOBAL CODING STANDARDS (MANDATORY)

## 🛑 1. ZERO ANY POLICY
- **Tình trạng:** CẤM TUYỆT ĐỐI.
- **Yêu cầu:** Không bao giờ được sử dụng kiểu dữ liệu `any` trong bất kỳ file TypeScript (`.ts`) hay Vue (`.vue`) nào.
- **Nếu không biết kiểu:** Sử dụng `unknown` và thực hiện Type Guarding, hoặc định nghĩa Interface mới.
- **Trừng phạt:** Nếu Antigravity sử dụng `any`, công việc đó sẽ bị coi là **Thất bại (Failed)** và phải làm lại từ đầu.

## 🧱 2. ARCHITECTURE
- **Logic:** Tách biệt logic game (Engine) khỏi UI (Vue).
- **State:** Sử dụng Pinia Store (`src/stores/`) cho các trạng thái cần lưu trữ (Persistence).
- **UI:** Luôn sử dụng Tailwind CSS kết hợp CSS thuần biến số (CSS Variables) để dễ dàng tùy chỉnh theme.

## 🧪 3. TESTING
- Luôn cập nhật hoặc viết mới Unit Test (`pnpm test`) cho các logic quan trọng.
- Tuyệt đối không để `pnpm lint` báo lỗi đỏ trước khi kết thúc task.
