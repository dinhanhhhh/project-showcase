# Postmortem & Lessons Learned — Project Showcase (Vibe Platform)

Tài liệu ghi nhận các lỗi đã phát hiện, nguyên nhân gốc rễ và quy tắc phòng ngừa để không tái phạm.

---

## 1. Script `generate-pages.mjs` bỏ sót `meta.ts` có ký tự xuống dòng Windows (`CRLF`)

- **Ngày ghi nhận:** 2026-11-26
- **Triệu chứng:** Khi chạy `pnpm generate:pages` trên Windows, 3 mini-app có sẵn (`monopoly`, `neon-typing`, `oracle-tarot`) bị rơi khỏi `public/data/pages.json` (chỉ sinh ra 8/11 trang).
- **Nguyên nhân gốc rễ:** Regex trong `parseMetaFromTs()` tại `scripts/lib/generate-pages.mjs` dùng lookahead `(?=;|\n|export)` mà không chuẩn hóa xuống dòng `\r\n` sang `\n`. Với các file `meta.ts` lưu bằng định dạng CRLF trên Windows, ký tự đứng ngay sau `}` là `\r` chứ không phải `\n`, khiến regex không khớp và trả về `null`.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Chuẩn hóa `source.replace(/\r\n?/g, '\n')` trước khi parse và mở rộng lookahead `(?=;|\s|\n|export|$)`.
  - Bổ sung test case kiểm chứng parse `meta.ts` có xuống dòng CRLF trong `tests/generate-pages.spec.ts`.
  - Luôn kiểm tra số lượng trang được xuất trong `public/data/pages.json` sau khi chạy `pnpm generate:pages`.

---

## 2. Lỗi thuật toán AI & ký hiệu nước đi khi port `Cờ Tướng Master` từ mã nguồn gốc

- **Ngày ghi nhận:** 2026-11-26
- **Triệu chứng:** Trong mã nguồn gốc `cotuong-master` (React):
  1. Hàm `isRepetition` dùng kiểu `any[]` vi phạm Zero-Any Policy.
  2. Điểm vị trí quân Tốt (`PAWN_PST`) bị đảo chiều cho quân Đỏ và có trọng số (+50) lớn hơn giá trị Xe (+9), khiến Bot đánh giá sai nghiêm trọng.
  3. Điểm chiếu bí (`checkmate`) trong `minimax` luôn trả về `-100000` cho cả 2 nhánh maximizing/minimizing, khiến Bot không phân biệt được mình thắng hay thua.
  4. Hàm `formatNotation` bị ngược điều kiện `rankDiff * sideDir < 0`, khiến nước tiến bị ghi thành `thoái` và ngược lại.
- **Nguyên nhân gốc rễ:** Quy ước trục `rank` (Đỏ ở hàng 9 đi về hàng 0, Đen ở hàng 0 đi về hàng 9) không nhất quán giữa bảng PST, hàm `formatNotation` và `minimax`.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Chuẩn hóa trọng số `PIECE_VALUES` (100–10000) đồng bộ với bảng `SOLDIER_ADVANCE_BONUS` (0–66), đảo đúng trục `9 - rank` cho quân Đỏ, sửa dấu điểm `checkmate` theo `isMaximizing`, sửa điều kiện `rankDiff * forwardDir > 0`, và thay `any[]` bằng `readonly MoveRecord[]`.
  - Bảo vệ toàn bộ luật chơi và AI bằng bộ Unit Test tại `tests/co-tuong-engine.spec.ts`.

---

## 3. Lỗi mất style `.glass-card`/`.warning` và rò rỉ Event Listener / Timer ở các view đời đầu

- **Ngày ghi nhận:** 2026-11-26
- **Triệu chứng:**
  1. `src/views/neon-typing/index.vue` và `src/views/oracle-tarot/index.vue` gắn class `.glass-card` và `.glow-box` nhưng không định nghĩa ở đâu, khiến khung giao diện trống trơn không nền không viền; selector `.stat-item.warning .value` trong `neon-typing` không khớp DOM nên cảnh báo hết giờ màu đỏ không hoạt động.
  2. `src/composables/useParticlesBackground.ts` đăng ký `window.addEventListener('resize', resize)` nhưng không gỡ trong `onUnmounted`.
  3. `src/views/oracle-tarot/index.vue` dùng `setTimeout` lồng nhau nhưng không hủy khi unmount.
  4. `tests/home.spec.ts` và `tests/store.spec.ts` bị lỗi lệch so với Pinia Persistedstate (`vibe:pages-store`) và gây cảnh báo `HTMLCanvasElement.prototype.getContext` trên JSDOM.
- **Nguyên nhân gốc rễ:** Thiếu utility class chung ở `src/assets/main.css`, chưa áp dụng kỷ luật cleanup tài nguyên nhất quán, và bộ test cũ chưa được cập nhật sau khi chuyển `usePagesStore` sang `pinia-plugin-persistedstate`.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Tập trung `.glass-card`, `.glow-box`, `:focus-visible`, và `@media (prefers-reduced-motion: reduce)` vào `src/assets/main.css`.
  - Luôn lưu tham chiếu handler/timer và hủy sạch trong `onUnmounted` (áp dụng cho `useParticlesBackground`, `oracle-tarot`, `neon-typing`, `BackToTop`, `CommandPalette`).
  - Mock `HTMLCanvasElement.prototype.getContext` trong `tests/setup.ts` và đăng ký `piniaPluginPersistedstate` trong test để toàn bộ `pnpm test` đạt 100% Pass không nhiễu log.
