# 🧠 Game Logic: Ngã Rẽ Cuộc Đời (ngare)

Tệp này mô tả các nguyên tắc cốt lõi của Game Engine để AI không làm hỏng tính cân bằng và luồng logic khi chỉnh sửa code.

## 📊 1. Hệ thống Chỉ số (Stats)
Tất cả chỉ số nằm trong khoảng `[0 - 100]`, ngoại trừ `money` (không giới hạn trên).
- **money**: Tiền bạc. Hết tiền (`<=0`) -> **Game Over (Phá sản)**.
- **skill**: Kỹ năng chuyên môn. Dùng để thăng tiến nghề nghiệp.
- **happiness**: Hạnh phúc. Ảnh hưởng đến điểm số cuối cùng.
- **stress**: Áp lực. Đạt `100` -> **Game Over (Đột quỵ)**.
- **health**: Sức khỏe. Hết sức khỏe (`<=0`) -> **Game Over (Bệnh tật)**.
- **relationships**: Quan hệ xã hội.

## ⚙️ 2. Luồng vận hành (Engine Flow)
Mỗi lượt chơi tương ứng với **1 năm** cuộc đời.
1. **Khởi đầu**: Tuổi 22 (Tốt nghiệp đại học). Kết thúc: Tuổi 60 (Nghỉ hưu).
2. **Lấy Event**: Cấp độ ưu tiên: `Milestone` (Cố định tuổi) > `Danger` (Xác suất 25%) > `Common/Career` (Random theo trọng số `weight`).
3. **Lựa chọn (Choice)**: Mỗi lựa chọn cộng/trừ stats. 
   - Hiệu ứng có thể là số cố định hoặc khoảng ngẫu nhiên `[min, max]`.
4. **Hệ quả hàng năm**: Ngay sau lựa chọn:
   - Tuổi và Năm tăng +1.
   - Tính lương (`salary`) dựa trên `currentLevel` và cộng vào `money`.
   - Kiểm tra thăng tiến: Nếu `skill` đủ mốc `minSkill` của level tiếp theo.
   - Kiểm tra Thành tựu (Achievements).
   - Kiểm tra Game Over.

## 🛡️ 3. Hệ thống Vật phẩm & Kỹ năng
- **Passive Items**: Tăng stats tự động mỗi năm hoặc cung cấp khả năng miễn nhiễm (`immunity`) với các Event nguy hiểm cụ thể.
- **Active Skills**: Kỹ năng chủ động có hồi chiêu (`cooldown`).
  - *Lưu ý*: Một số kỹ năng như `undo_last_choice` yêu cầu phải có `previousSnapshot`.

## ⚖️ 4. Nguyên tắc Cân bằng (AI Guidelines)
Khi thêm hoặc sửa Event/Items:
- **Không lạm phát**: Một lựa chọn thông thường không nên cộng quá `+20` hoặc trừ quá `-20` một chỉ số (trừ trường hợp đặc biệt).
- **Rủi ro song hành**: Các lựa chọn tăng nhiều `money` hoặc `skill` thường phải đi kèm tăng `stress` hoặc giảm `happiness`.
- **Game Over**: Tránh tạo ra các Event "bỗng dưng chết" mà không có dấu hiệu báo trước hoặc không cho người dùng lựa chọn né tránh (trừ khi họ đã để stats quá thấp).

## 🏁 5. Cách tính điểm cuối đời (Scoring)
`Score = Money + Skill + Happiness + Health + Relationships - Stress`.
- **>350**: Viên mãn.
- **200 - 350**: Thành công / Bình dị.
- **<200**: Gập ghềnh / Thử thách.

---
*Trước khi sửa `engine.ts` hoặc `game-data.ts`, AI phải đối chiếu với các nguyên tắc này.*
