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

---

## 4. Hàng loạt lỗi bố cục Mobile (`390×844`) & hiển thị bị che khuất phát hiện qua kiểm thử trình duyệt thực tế

- **Ngày ghi nhận:** 2026-11-26
- **Triệu chứng:** Khi mở trực tiếp 7 game trên trình duyệt ở Desktop (`1440×900`) và Mobile (`390×844`):
  1. `neon-typing` & `color-game` (Mobile): Header 3 cột ép khối tiêu đề thành cột dọc ~100px dài hơn 10 dòng; `color-game` bị rớt lẻ 3 thẻ chỉ số (`2 + 1`) và đẩy 4/6 ô màu + nút `50:50` xuống dưới màn hình.
  2. `mini-piano` (Mobile): 7 khối điều khiển xếp trên đẩy bàn phím 13 phím tụt xuống `y = 795px` (chỉ lộ 48px), không thể đánh đàn ngay mà không cuộn.
  3. `co-tuong` (`XiangqiBoard.vue`): Quân hàng 0 và hàng 9 có `translate(-50%, -50%)` trồi lên/xuống che mất số cột `1..9` / `9..1`.
  4. `ngare`: Mobile ẩn toàn bộ `.stat-name` làm 6 icon chỉ số khó hiểu; chức danh bị cắt cụt sớm (`max-width: 140px`); nhật ký tương phản thấp; thẻ chọn nghề dùng `<div>` thay vì `<button>`.
  5. `AppEmbedFrame.vue` (Mobile): 5 nút công cụ ép tiêu đề game nhúng chỉ còn `"🎲 ..."` và `"🌾 ..."`.
  6. `anime-farm` (`public/apps/anime-farm/css/ui.css`): Không có media query thực cho HUD hiện tại khiến trên Mobile `100/100` gãy 3 dòng, mất Vàng/Kho/Loa khỏi mép phải, thanh `Thao tác nhanh` rộng `891px` bị cắt cụt 2 đầu và chém ngang hộp Nhiệm vụ; trên Desktop badge `3` đè lên chữ `T` của `Tự Động Gieo`.
  7. `saigon-tycoon` (`board.css` & `main.css`): Ô bàn cờ dùng `word-break: break-word` + font quá lớn khiến tên đường gãy giữa chữ (`HOÀN G SA`, `PASTEU R`) và cắt giá tiền; trên Mobile `.cockpit-dice-section` cố định `height: 24px` nhưng chứa nút `TUNG XÚC XẮC` cao `32px` nên đè xuống hàng nút hành động bên dưới; nút `disabled` tương phản thấp trên nền nâu đậm.
- **Nguyên nhân gốc rễ:** Chỉ đánh giá giao diện qua đọc code/unit test mà không soi render thực tế trên viewport hẹp `390×844`, kết hợp các quy tắc `height` cố định và thiếu `order` / `flex-basis: 100%` cho header trên Mobile.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Áp dụng đồng nhất pattern `.title-block { order: 3; flex-basis: 100%; }` cho header game trên Mobile, cố định lưới chỉ số cân đối (`repeat(3/4/5, minmax(0, 1fr))`), đưa khu vực chơi chính (bàn phím Piano, lưới ô màu, ô gõ phím) lên trên fold `844px`.
  - Bổ sung `margin: 5.5% 0` trên `.board-canvas` Cờ Tướng để tách số cột khỏi quân cờ; viết lại responsive mobile đầy đủ cho `anime-farm` và sửa chiều cao `height: auto` cho `.cockpit-dice-section` ở `saigon-tycoon`.
  - Quy tắc bắt buộc cho mọi nâng cấp UI lớn: luôn kiểm thử trực tiếp trên trình duyệt ở cả `1440×900` và `390×844`, chụp ảnh đối chiếu trước/sau.

---

## 5. Lỗi runtime `TypeError: this.usedEvents.has is not a function` khi bấm "Tiếp Tục Game Đã Lưu" trong `Ngã Rẽ Cuộc Đời`

- **Ngày ghi nhận:** 2026-11-26
- **Triệu chứng:** Khi tạo nhân vật, tải lại trang `/ngare` và bấm `📂 Tiếp Tục Game Đã Lưu`, ứng dụng văng lỗi `TypeError: this.usedEvents.has is not a function` tại `src/views/ngare/engine.ts` và không vào được màn hình chơi.
- **Nguyên nhân gốc rễ:** Store `src/stores/ngare.ts` lưu cả `gameState` lẫn class instance `engine: new GameEngine()` trong `state()` nhưng khai báo `persist: { key: 'ngare_game_state', storage: localStorage }` mà **không có `pick: ['gameState']`**. Khi Pinia lưu xuống `localStorage`, `JSON.stringify` serialize cả `engine` và biến `usedEvents: Set<string>` thành plain object `{}`; khi hydrate lại, `store.engine` bị ghi đè khiến `this.usedEvents.has` không tồn tại.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Thêm `pick: ['gameState']` vào cấu hình `persist` của `useNgareStore` để tuyệt đối không bao giờ serialize class instance hay `Set`/`Map`.
  - Bổ sung kiểm tra phòng thủ `!(this.engine instanceof GameEngine)` và `!(this.engine.usedEvents instanceof Set)` trong `loadFromStorage()` để tự phục hồi ngay cả với dữ liệu `localStorage` cũ đã bị hỏng từ trước.
  - Bổ sung test hồi quy mô phỏng tải lại Pinia store & save cũ trong `tests/ngare-store.spec.ts`.

---

## 6. Lỗi gameplay, hitbox hình thoi bị che khuất, đếm ngược sai tốc độ & thống kê lỗi ở `Nông Trại Anime 2.5D` (`anime-farm`)

- **Ngày ghi nhận:** 2026-11-26
- **Triệu chứng:**
  1. 3/6 loại cây (`wheat`, `carrot`, `corn`) rơi vào nhánh `default` của `getPlantSvg()` nên khi chín đều hiện thành cây ớt đỏ.
  2. Thanh năng lượng `100/100` + nút `+` chỉ là HTML tĩnh không có chức năng; đồng hồ đếm ngược trên cây chưa tưới tính sai 2× (không chia cho tốc độ `0.5x`) và hàm `load()` bỏ qua tiến trình lớn offline của cây chưa tưới.
  3. Vùng bấm `.farm-plot` là hình chữ nhật `116×58px` có `pointer-events: auto` nên các góc trong suốt của ô hàng trước (`z-index` cao hơn) đè kín tâm ô hàng sau (gây `ELEMENT_OCCLUDED` khi bấm Ô #1); đồng thời `.iso-water-alert` kế thừa `pointer-events: none` nên bấm icon `🚿` bị xuyên sang ô khác.
  4. `handleHarvestAll` truy vấn sai selector `[data-id]` thay vì `[data-plot-id]` nên mất chữ bay thu hoạch; các nút thao tác hàng loạt thiếu khóa chống bấm đúp (`isBatchBusy`); modal Hồ sơ đọc sai trường `stats.totalHarvested` (thực tế là `totalHarvests`), không tăng `ordersCompleted` và `load()` không khôi phục `stats`; thiếu CSS cho `.floating-text`, `.dirt-particle`, `.water-splash-particle`, `.toast-item.fade-out`; nút `Chơi lại` dùng `window.confirm()` dễ bị chặn trong iframe; trên Desktop avatar Trợ lý bị nút `Đào Cây` che một phần và toast xếp chồng che nhãn `Thu hoạch!`.
- **Nguyên nhân gốc rễ:** Dùng khung hình chữ nhật mặc định làm hitbox cho lưới Isometric 2.5D thay vì đa giác hình thoi SVG; thiếu hàm tính thời gian còn lại dùng chung cho tốc độ `0.5x`/`1.0x`; thêm hiệu ứng DOM trong JS nhưng chưa bổ sung CSS keyframes tương ứng; dùng native `confirm()` trong mini-app chạy bên trong iframe.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Đặt `pointer-events: none` trên `.farm-plot` và gán `pointer-events: auto` riêng cho hình thoi `<polygon class="plot-ridge/.plot-trough">` cùng `.iso-water-alert`, `.iso-harvest-badge`, `.plot-lock-sign`; dùng khoảng cách hình thoi chuẩn (`|dx|/halfW + |dy|/halfH`) trong `getClosestPlot()`.
  - Vẽ đủ 6 SVG cây trồng riêng, chuẩn hóa hàm `getRemainingRealSeconds(plot)` và mô phỏng offline cho cả cây khô & ẩm; kích hoạt hệ thống Năng lượng Bón phân thực (`energy` tự hồi & lưu `localStorage`), Thời tiết động, Thu Hoạch Vàng x2, Combo gặt, tưới 1 chạm và đổi `Chơi lại` sang xác nhận 2 chạm nội tuyến.
  - Bố trí `.hud-bottom-right-cluster` thành 1 hàng ngang gọn trên cả Desktop/Mobile và giới hạn tối đa 2 toast không trùng lặp.
  - **Quy tắc phòng ngừa:** Mọi lưới Isometric bắt buộc khóa hitbox vào hình thoi SVG thay vì bounding box hình chữ nhật; mọi nút xác nhận trong mini-app nhúng iframe phải dùng UI xác nhận nội tuyến thay cho `window.confirm()`.
