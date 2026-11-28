# 🧠 Game Logic: Ngã Rẽ Cuộc Đời (`ngare`)

Tệp này mô tả các nguyên tắc cốt lõi của Game Engine sau đợt nâng cấp toàn diện để AI và Developer duy trì độ cân bằng và tương thích ngược.

## 📊 1. Hệ thống Chỉ số (Stats) & Xuất thân
- 5 chỉ số tâm sinh lý (`skill`, `happiness`, `stress`, `health`, `relationships`) kẹp trong `[0, 100]`.
- `money` (tiền mặt) **không giới hạn trần** (`>= 0`); nếu `money <= 0` sau thu/chi cuối năm → **Phá sản**.
- **5 Xuất thân / Tính cách khởi đầu:** `balanced`, `self_made`, `privileged`, `extrovert`, `workaholic`.

## ⚙️ 2. Luồng vận hành hàng năm (Yearly Loop)
1. **Khởi đầu:** Tuổi `22` → **Nghỉ hưu:** Tuổi `60`.
2. **Hành động chủ động (tối đa 1 lần/năm):** Học chuyên sâu, Du lịch, Giao lưu, Khám thể lực, Làm thêm tự do.
3. **Thứ tự ưu tiên lấy Event:** `previewedEvent` (`Thần Nhãn`) → `pendingEvents` (từ chuỗi cốt truyện đến tuổi) → `milestoneEvents` → `Danger` (`25%`, bị tiêu thụ đúng 1 lớp `🛡️ Khiên bảo vệ` nếu có buff) → `commonEvents` / `arcEvents` / `careerEvents`.
4. **Hệ quả cuối năm:** Tính lương (`salary + trait.salaryBonus`) + dòng tiền thụ động từ Tài sản đầu tư (`assets`) - chi phí sinh hoạt (từ tuổi 26 trở lên hoặc có gia đình/vay nhà) + hiệu ứng vật phẩm thụ động + cập nhật `statSnapshots` và chu kỳ thị trường (`bull` / `neutral` / `bear`).

## 🚀 3. Chuỗi cốt truyện, Đầu tư & Chuyển nghề
- **4 Chuỗi Cốt Truyện (`events-arcs.ts`):** Khởi nghiệp (đến IPO), Tình yêu & Gia đình, An cư & Bất động sản, Trung niên & Di sản (tổng **81 sự kiện**).
- **Tài sản đầu tư (`assets.ts`):** Quỹ tiết kiệm, Cổ phiếu VN30, Bất động sản cho thuê; tổng tài sản ròng `netWorth = money + giá trị tài sản theo thị trường`.
- **Chuyển ngành (`switchCareer`):** Mở từ tuổi `28`, phí `15` Tiền, bảo lưu `70%` kỹ năng hiện tại.

## 🏆 4. Thành tựu (12) & Kết cục (15)
- **Thành tựu (`achievements.ts`):** Sửa chuẩn điều kiện `survivor` (phải từng `health <= 25` mới tính hồi phục) và `zen_master` (`lowStressStreak >= 5` năm liên tiếp).
- **Kết cục (`endings.ts`):** 10 kết cục kinh điển + 5 kết cục đặc biệt (`Kỳ Lân Khởi Nghiệp`, `Tỷ Phú Tự Thân`, `Ẩn Sĩ Bình Yên`, `Lão Làng Đa Tài`, `Đại Gia Cô Độc`), lưu qua Pinia (`unlockedEndings` + top 10 `hallOfFame`).

## 🧪 5. Unit Testing
Mọi thay đổi ở `engine.ts`, `data/` hoặc `stores/ngare.ts` bắt buộc phải pass 100% `tests/ngare-engine.spec.ts` và `tests/ngare-store.spec.ts`.
