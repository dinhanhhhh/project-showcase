---
name: vibe-sprint
description: >-
  Chạy vòng lặp cải tiến tự động liên tục (Autonomous Continuous Sprint Loop)
  cho dự án Project Showcase (Vibe Platform) theo SPRINT_BACKLOG.md cho tới mốc
  giờ người dùng chỉ định, kèm đầy đủ cổng kiểm chứng CLI, trình duyệt Chrome và
  tài liệu.
---

# Vibe Sprint — Autonomous Continuous Improvement Loop

Skill này điều phối vòng lặp cải tiến liên tục cho **Vibe Platform / Project Showcase** dựa trên `SPRINT_BACKLOG.md`, giúp bạn chỉ cần gõ 1 dòng lệnh (ví dụ: `/goal chạy vibe-sprint đến 11:00`) thay vì phải copy-paste prompt dài mỗi ngày.

---

## 1. Cách dùng & Xác định mốc dừng (Time-Box Loop)

1. **Kiểm tra đồng hồ ngay khi bắt đầu**:
   Chạy lệnh PowerShell `Get-Date -Format "yyyy-MM-dd HH:mm:ss"` để lấy mốc thời gian thực tế tại máy.
2. **Phân tích mốc dừng từ yêu cầu của người dùng**:
   - Nếu người dùng ghi mốc giờ cụ thể (vd: `đến 11:00`, `đến 05:00`, `tới 23:30`):
     - Nếu `HH:mm` mục tiêu **lớn hơn** `HH:mm` hiện tại → mốc dừng là `HH:mm` **hôm nay**.
     - Nếu `HH:mm` mục tiêu **nhỏ hơn** `HH:mm` hiện tại (chạy qua đêm, vd bắt đầu `22:30` và hẹn `đến 05:00`) → mốc dừng là `HH:mm` **ngày mai** (midnight rollover).
   - Nếu người dùng ghi thời lượng (vd: `trong 3 tiếng`, `trong 90 phút`): cộng chính xác vào thời điểm bắt đầu để ra timestamp dừng.
   - Nếu người dùng **không** ghi mốc thời gian: thực hiện **đúng 1 sprint** ưu tiên cao nhất rồi kết thúc gọn gàng.
3. **Vòng lặp liên tục**:
   - Sau mỗi sprint, **bắt buộc** chạy `Get-Date -Format "yyyy-MM-dd HH:mm:ss"` để đối chiếu với mốc dừng.
   - **Không dừng sớm** khi vẫn còn thời gian trước mốc dừng; tự động chuyển ngay sang sprint `[ ]` tiếp theo.
   - Nếu toàn bộ item `[ ]` trong `SPRINT_BACKLOG.md` đã xong mà vẫn còn thời gian: thực hiện một lượt audit read-only toàn bộ codebase + Chrome để phát hiện các điểm cần nâng cấp/sửa lỗi giá trị cao, bổ sung vào `SPRINT_BACKLOG.md` dưới dạng `[ ]`, rồi tiếp tục thực thi.

---

## 2. Tiêu chuẩn kỹ thuật & Ràng buộc an toàn

Trước khi đụng vào bất kỳ file code nào của sprint, luôn đọc `AGENTS.md` và `SPRINT_BACKLOG.md`.

### Quy chuẩn Codebase (`AGENTS.md` + Chuẩn toàn cục)
- **Vue 3 & TypeScript Strict**: `<script setup lang="ts">`, **ZERO `any`** ở mọi nơi (kể cả trong `tests/`). Dùng `unknown` + Zod validation nếu chưa rõ kiểu dữ liệu ngoài/persisted.
- **Tách UI - Logic (U - L Rule)**: Logic tính toán/game/AI/lọc dữ liệu nằm trong `engine.ts` hoặc `composables/`; file `.vue` chỉ render và gắn handler.
- **Persistence**: Dùng **Pinia + `pinia-plugin-persistedstate`** và Zod fallback an toàn; không dùng `localStorage.getItem/setItem` trực tiếp cho state ứng dụng.
- **Theme & CSS**: Chỉ dùng CSS Variables (`src/assets/styles/variables.css`), tuyệt đối không hardcode mã màu hex; mọi màn hình phải hiển thị rõ ràng, đủ tương phản trên **cả 4 theme**: `Deep Cosmos`, `Emerald Synth`, `Sunset Noir`, `Arctic Light`.
- **Resource Lifecycle**: Mọi `addEventListener`, `setInterval`, `setTimeout`, `requestAnimationFrame`, `AudioContext` đều phải cleanup trong `onUnmounted` và không cấp phát object/mảng thừa trong vòng lặp 60fps.
- **Responsive & Clamping**: Chống tràn ngang (`scrollWidth <= innerWidth`), tương thích Mobile hẹp (`360px`–`390px`) và modal/popup phải kẹp biên viewport.

### Ràng buộc An toàn (Tuyệt đối không vi phạm)
- **KHÔNG** tự ý cài package mới (`pnpm add` / `npm install`).
- **KHÔNG** tự ý sửa file cấu hình/hệ thống (`.env`, `*.config.*`, CI/CD).
- **KHÔNG** tự ý xóa file/thư mục không liên quan.
- **KHÔNG** tự ý `git commit` hoặc `git push`.

### Bất biến giao diện cần bảo vệ
- **Game Cờ Tướng (`src/views/co-tuong/`)**: Không thu nhỏ hay thay đổi kích thước bàn cờ (`~527px` width, hiển thị vừa khít 1 màn hình desktop `1536×729` với zero scrollbar) trừ khi đang sửa một bug đã được xác minh rõ ràng.

### Quy tắc riêng trên Windows / PowerShell
- PowerShell 5.1 **không hỗ trợ `&&`** — luôn nối lệnh bằng `; if ($?) { ... }`.
- Tránh lỗi khóa file Windows (`user-mapped section open`): **không** chạy song song nhiều lệnh `edit_file` hoặc vừa `read_file` vừa `edit_file` trên cùng một file trong cùng một turn.
- **Stop-after-2-failures**: Nếu một hướng sửa đã thất bại 2 lần liên tiếp → dừng vá vặt, phân tích nguyên nhân gốc rễ trước khi đổi hướng.

---

## 3. Quy trình 4 cổng bắt buộc cho mỗi Sprint

Mỗi item `[ ]` lấy từ `SPRINT_BACKLOG.md` phải đi qua đủ 4 cổng sau trước khi được đánh dấu `[x]`:

### Cổng 1: Triển khai & Unit Test
- Thực hiện đúng phạm vi của sprint đang chọn (tránh refactor lan man sang phần không liên quan).
- Bổ sung hoặc mở rộng test case trong `tests/*.spec.ts` (cover happy path, edge cases, và persistence/Zod fallback nếu có state).

### Cổng 2: Cổng CLI (bắt buộc exit code `0`, `0` lỗi, `0` cảnh báo)
Chạy chuỗi lệnh kiểm tra đầy đủ:
```powershell
pnpm generate:pages; if ($?) { pnpm typecheck }; if ($?) { pnpm lint }; if ($?) { pnpm test }; if ($?) { pnpm build }
```

### Cổng 3: Cổng Chrome thực tế (bắt buộc cho mọi sprint có UI/gameplay)
1. Khởi chạy dev server ở chế độ daemon (`pnpm dev --port 5173`, `IsDaemon: true`).
2. Dùng `browser` subagent (`Model: "flash"`) kiểm tra thực tế trên 3 kích thước:
   - Desktop chuẩn người dùng: **`1536×729`**
   - Desktop rộng: **`1440×900`** (test tối thiểu 2 theme **`Deep Cosmos`** và **`Arctic Light`**)
   - Mobile hẹp: **`390×844`**
3. Xác nhận: `0` console error, `0` failed network request, `0px` tràn ngang (`document.documentElement.scrollWidth <= window.innerWidth`), thao tác chơi/tương tác thật hoạt động trơn tru.
4. Dùng `read_file` kiểm tra trực quan các ảnh chụp màn hình do browser subagent trả về.
5. **Kill daemon dev server ngay sau khi verify xong** (hoặc khi chuyển sang kiểm tra lại sau khi sửa).

### Cổng 4: Cổng Tài liệu (Bắt buộc trước khi chuyển sprint)
1. **`SPRINT_BACKLOG.md`**: Chuyển item vừa hoàn thành từ `[ ]` sang `[x]`, ghi kèm ngày hoàn thành và tóm tắt kết quả thực tế (số test pass, thay đổi chính).
2. **`README.md`**: Cập nhật phần Tính năng / Nâng cấp khi thêm tính năng hoặc nâng cấp app.
3. **`POSTMORTEM_AND_LESSONS_LEARNED.md`**: Ghi nhận **mọi** bug đã sửa trong sprint (bao gồm lỗi logic, lỗi hiển thị UI, vỡ khung mobile, tràn/cụt màn hình, xung đột cảm ứng, sai lệch state/timer) theo đủ 3 ý:
   - Triệu chứng lỗi
   - Nguyên nhân gốc rễ
   - Giải pháp & quy tắc phòng ngừa

---

## 4. Kết thúc phiên làm việc

Khi đồng hồ vượt quá mốc dừng (hoặc đã hoàn tất số sprint yêu cầu) và cổng cuối cùng đã xanh:
1. Kiểm tra `manage_task` (`list`) và **kill toàn bộ background task/daemon** còn đang chạy (không để sót Vite dev server).
2. Đảm bảo workspace sạch sẽ (không sót file tạm `test_*`, `temp_*`, `console.log` debug).
3. Báo cáo ngắn gọn bằng **Tiếng Việt** gồm:
   - Danh sách sprint đã hoàn thành kèm link `file://` tới các file đã sửa/tạo.
   - Kết quả thực đo cuối cùng (`typecheck`, `lint`, `test` bao nhiêu file/test pass, `build`, Chrome viewports & themes đã verify).
   - Các item còn lại trong `SPRINT_BACKLOG.md` cho lần chạy tiếp theo.
