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

---

## 7. Nhãn tưới nước `🚿`, đồng hồ `.plot-timer-badge` & nhãn `Thu hoạch` bay lệch hoặc bị lá cây hàng trước che trên lưới 12 ô (`anime-farm`)

- **Ngày ghi nhận:** 2026-11-26
- **Triệu chứng:**
  1. Khi đặt badge ở `bottom: 56px` / `right: -30px`, đồng hồ bay lên che các ô hàng sau và nút `🚿` văng ra ngoài ô/hàng rào cỏ; hiển thị lặp 2 biểu tượng nước (`💧` + `🚿`).
  2. Khi hạ badge về sát gốc ô đất nhưng vẫn nằm **bên trong `.farm-plot`**, mỗi `.farm-plot` có stacking context `z-index = (col + row) * 2 + 1` riêng (`1..11`), nên khi trồng đủ 12/12 cây trưởng thành cao `102px`, tán lá rậm của hàng trước đè kín nhãn `Thu hoạch` của các ô hàng sau; ngoài ra nhãn `"🌾 Thu hoạch"` rộng `~90px` lớn hơn bước ngang hình thoi `58px`.
- **Nguyên nhân gốc rễ:** Đặt badge trạng thái bên trong stacking context của từng `.farm-plot` thay vì một lớp phủ chung trên cùng, và kích thước badge lớn hơn bước ngang ô Isometric (`dx=58px`).
- **Giải pháp & Quy tắc phòng ngừa:**
  - Tách toàn bộ `.plot-timer-badge` và `.iso-harvest-badge` ra một lớp phủ riêng `#farm-badge-layer` (`z-index: 40`) nằm trên tất cả 12 ô `.farm-plot` trong `#farm-grid`, neo đúng tọa độ `(x + 58, y + 38)` của từng ô và ánh xạ click/vuốt trực tiếp trong `FarmInteractions.bindEvents()`.
  - Gộp `💧` + `🚿` thành 1 viên thuốc duy nhất (`🚿 <time>` / `⏳ <time>`) và thu gọn nhãn thu hoạch thành `🌾 Gặt` (`<= 50×18px`) để không bao giờ đụng hay che nhau dù kín 12/12 ô.
  - **Quy tắc phòng ngừa:** Mọi nhãn trạng thái trên lưới Isometric có sprite cao vượt khoảng cách hàng bắt buộc render ở lớp overlay riêng bên trên z-order của lưới ô đất và giữ bề rộng nhỏ hơn nửa chiều ngang ô (`< 58px`).

---

## 8. Lỗi tương phản trên theme sáng `Arctic Light` & tràn/đè bố cục Mobile phát hiện khi audit 4 theme và toàn bộ 10 mini-app

- **Ngày ghi nhận:** 2026-11-27
- **Triệu chứng:**
  1. Trên Home Launcher ở theme `Arctic Light`:
     - Nhãn badge và mũi tên dùng trực tiếp màu neon (`#fbbf24`, `#a3e635`, `#6dddff`) nên tương phản thấp trên nền thẻ trắng; nút `.app-card` và `.spotlight-item` chuyển nền chậm `0.3s` khiến thẻ có thoáng xám đục khi vừa chuyển từ theme tối sang sáng.
     - Ở viewport `1440×900`, `.spotlight-grid` dùng `minmax(260px, 1fr)` làm thẻ thứ 4 (`Nông Trại Anime 2.5D`) bị rớt lẻ xuống hàng 2 và cắt tên thành `"Nông Trại Anim..."`.
     - Modal `SettingsModal.vue` dùng `window.confirm()` để xóa dữ liệu, viền swatch màu trắng bị chìm trên nền sáng và nhấn `Escape` không đóng modal.
  2. `oop-flashcards` (Mobile `390×844`): `.top-nav` không `flex-wrap` khiến nút `↺ Reset` đè trực tiếp lên dòng mô tả `"Lý thuyết OOP & SOLID · Thuộc 0/21"`.
  3. `hom-nay-an-gi` (`Arctic Light`): nút yêu thích `.fav-floating` (`☆`) giữ nền xanh đen cố định với chữ `--text-dim` tối màu nên ngôi sao gần như chìm hẳn.
  4. `ngare` (Mobile `390×844`): `.player-career` khóa `max-width: 118px` làm chức danh `"Lập trình viên tập sự"` bị cắt thành `"Lập trình viên tập..."`.
  5. `saigon-tycoon` (Mobile `390×844`): khung vàng `.resume-game-banner` xếp hàng ngang cạnh nút `TIẾP TỤC VÁN TRƯỚC` khiến danh sách người chơi bị ép xuống 7 dòng hẹp dọc.
- **Nguyên nhân gốc rễ:** Một số màu accent sáng không có biến thể đậm cho Light Mode; thiếu quy tắc `flex-wrap` + `order: 3; flex-basis: 100%` ở header Mobile `oop-flashcards`; giữ nền tối cứng trên nút nổi của ảnh `hom-nay-an-gi` và layout ngang cứng cho banner nhỏ ở Mobile.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Bổ sung `accentLight` WCAG-AA và `getThemeAccent()` trong `src/views/home/index.vue`, chỉnh `.spotlight-grid` về `minmax(min(100%, 220px), 1fr)` và loại bỏ transition `background-color` trên card để đổi theme tức thì.
  - Chuyển "Xóa dữ liệu" trong `SettingsModal.vue` sang xác nhận 2 chạm nội tuyến (tự hủy sau 4s, cleanup timer + listener `Escape` trong `onUnmounted`) và dùng `var(--outline)` cho viền swatch.
  - Áp dụng `flex-wrap: wrap` + `.brand-block { order: 3; flex-basis: 100%; }` cho `oop-flashcards` Mobile, dùng token `--bg-card`/`--text` cho `.fav-floating` trong `hom-nay-an-gi`, nới `max-width: 165px` cho `.player-career` ở `ngare`, và xếp dọc `.resume-game-banner` ở `saigon-tycoon` `<= 600px`.
  - Đồng bộ mô tả `src/views/anime-farm/meta.ts` sang `"6 cây trồng vẽ tay màu nước"`.

---

## 9. Lỗi UI/UX, nút cheat dev rò rỉ, hộp thoại `confirm`/`alert` gốc và đè nhãn Mobile trên `saigon-tycoon` & `anime-farm`

- **Ngày ghi nhận:** 2026-11-27
- **Triệu chứng:**
  1. **`saigon-tycoon`:**
     - `client/js/main.js` tự động nạp `dev/dev-tools.js` trong chế độ chơi thường khiến nút `⚡ Test Luật` (và bảng cheat phá sản/thắng ngay) lộ ra trên header (hiển thị thành ô cam trống nhãn khi thu hẹp).
     - `DebtResolutionModal.js` và `TradeModal.js` còn dùng `window.confirm()` / `alert()`, dễ bị chặn hoặc gây nhảy hộp thoại trình duyệt khi chạy nhúng trong iframe.
     - Huy hiệu chủ sở hữu `.tile-special .tile-owner-token-badge` đặt ở góc dưới-phải (`bottom: 3px`) đè trực tiếp lên giá thuê `"THUÊ 250k"` của các ô Bến Xe/Tiện ích (`BX M.Tây`, `Ga Sài Gòn`).
     - Các nút cockpit bị vô hiệu hóa (`.btn-dock-action:disabled`, nhất là `.btn-pass`) chữ tối chìm trên nền nâu đậm.
     - Trên Mobile (`390×844`): ô góc `#tile-0` (`KHỞI HÀNH`) bị cắt mất dòng `"2.000k"` do desktop rule `#tile-0 { padding: 4px !important }` đứng sau media query; `.tile-name` dùng `overflow-wrap: break-word` làm gãy chữ giữa từ (`HOÀN / G`); và `.vintage-radio-widget` mở rộng tràn che giữa màn hình bàn cờ.
  2. **`anime-farm` (Mobile `390×844`):**
     - Thanh 5 nút Thao tác nhanh dùng `white-space: nowrap; text-overflow: ellipsis` làm cắt cụt nhãn (`Tự Động Gi...`, `Gieo Ngẫu ...`, `Thu Hoạch ...`).
     - Modal Bách Khoa Toàn Thư (`#guide-modal`) giữ bố cục ngang của Desktop khiến phần mô tả bị ép thành cột ~65px dài 5–6 dòng và icon `💰` rớt xuống dòng riêng.
- **Nguyên nhân gốc rễ:** Nạp công cụ dev không kèm cờ `?dev=1`; thứ tự ưu tiên CSS (`#tile-0 { padding: 4px !important }`) đứng sau `@media (max-width: 600px)`; đặt badge góc dưới trùng vùng giá thuê; và thiếu layout xếp dọc cho `.shop-item-card` / wrap 2 dòng cho thanh nhanh ở viewport `<= 600px`.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Chặn nạp `dev-tools.js` trừ khi có `?dev=1` hoặc `saigon_dev_mode=1`; thay `confirm()` / `alert()` ở `DebtResolutionModal.js` và `TradeModal.js` bằng xác nhận 2 chạm nội tuyến & toast `#game-toast`.
  - Đưa `.tile-special .tile-owner-token-badge` lên `top: 2px; right: 2px;`, sửa tương phản `.btn-dock-action:disabled`, ghim `.vintage-radio-widget` gọn dưới đáy trên Mobile (`max-height: 54dvh`), và đặt `@media (max-width: 600px)` cho `#tile-0`, `.go-corner-layout` ở cuối `board.css`.
  - Cho `.quick-btn-label` ở `anime-farm` xuống tối đa 2 dòng rõ chữ trên Mobile và chuyển `.shop-item-card` sang xếp dọc (`flex-direction: column`) dưới `560px`.

---

## 10. Cảnh báo Vite chunk trùng `home/index.vue`, lỗi Vue `onUnmounted` lồng trong `ngare`, rò rỉ timer/particle & thiếu Accessibility (A11y)

- **Ngày ghi nhận:** 2026-11-27
- **Triệu chứng:**
  1. `pnpm build` phát cảnh báo `[plugin vite:reporter]` rằng `src/views/home/index.vue` vừa được import tĩnh vừa được `import.meta.glob('../views/**/index.vue')` import động trong `src/router/index.ts`.
  2. `src/views/ngare/index.vue`: hàm `initParticles()` được gọi bên trong `onMounted()` nhưng lại gọi `onUnmounted()` lồng bên trong (sai quy tắc lifecycle của Vue 3), thiếu tôn trọng `prefers-reduced-motion`, 4 `setTimeout` rời + hạt DOM `.stat-particle` không được dọn khi unmount, còn dùng `window.confirm()` gốc cho xóa save / chơi lại, và phím `Escape` không đóng các modal.
  3. Accessibility: `CommandPalette.vue` thiếu `aria-label` ở input/nút ESC, thiếu `role="listbox"`/`role="option"`/`aria-selected`, và không trả focus về phần tử trước khi đóng; `AppEmbedFrame.vue` thiếu `aria-label` rõ cho các nút công cụ & phím `Escape` thoát chế độ Rộng khung; `src/App.vue` chưa tắt transition khi bật `prefers-reduced-motion`; ô tìm thẻ `oop-flashcards` chưa có `:focus-within`.
- **Nguyên nhân gốc rễ:** Pattern glob `../views/**/index.vue` quét luôn `home/index.vue`; đăng ký hook `onUnmounted` bên trong callback `onMounted` thay vì cấp top-level của `<script setup>`; và thiếu vòng kiểm tra focus/ARIA/reduced-motion chuẩn hóa.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Chuyển glob router sang `import.meta.glob(['../views/*/index.vue', '!../views/home/index.vue'])` để đạt build sạch 0 cảnh báo.
  - Chuẩn hóa helper `scheduleTimer()`, tập `activeTimers`/`activeParticles`, trả hàm cleanup từ `initParticles()` về `onUnmounted()` cấp cao nhất của `ngare/index.vue`, thay `confirm()` bằng xác nhận 2 chạm nội tuyến và hỗ trợ `Escape` đóng modal.
  - Bổ sung focus restoration + ARIA listbox cho `CommandPalette.vue`, `aria-label` + `Escape` thoát theater mode cho `AppEmbedFrame.vue`, `.card-search:focus-within` cho `oop-flashcards` và `@media (prefers-reduced-motion: reduce)` trong `App.vue`.

---

## 11. Cắt mép phải màn chơi Mobile trên `ngare` & Lời giải phụ ngoài dự kiến ở `Thế 5: Thiết Môn Thoan` (`co-tuong`)

- **Ngày ghi nhận:** 2026-11-27
- **Triệu chứng:**
  1. **`ngare` (Mobile `390×844`):** Sau khi thăng tiến lên `"💻 Lập trình viên chính thức"`, cột chứa `.game-header`, `.stats-panel` và `.event-card` bị kéo rộng tới `388.84px` (`right = 404.84px`), làm nút `☰ Mở menu` và cột chỉ số bên phải bị cắt xén khỏi cạnh phải viewport.
  2. **`co-tuong` (`Thế 5: Thiết Môn Thoan`):** Khi bấm gợi ý AI (`H`), AI trả về `Tốt 6 tấn 1` thay vì nước kinh điển `Xe (1,1) -> (4,1)`.
- **Nguyên nhân gốc rễ:**
  1. `.game-layout` trong `ngare/index.vue` dùng `grid-template-columns: 1fr` (mặc định `minmax(auto, 1fr)`) và `.header-left` thiếu `flex: 1 1 0; min-width: 0;`, còn `.player-career` lại khóa `max-width: 165px` nên khi nhãn nghề dài ra đã đẩy tổng bề ngang header vượt quá chiều rộng màn hình `390px`.
  2. Trong `Thế 5`, Tướng Đỏ đặt ở `(3,9)` trùng cột 3 với Tốt `(3,1)`, vô tình bảo vệ Tốt ăn Sĩ `(3,0)` bằng luật Mặt Tướng nên tạo thêm một nước chiếu bí 1 nước thứ hai (`Tốt 6 tấn 1`) được bộ lọc ưu tiên ăn quân của Minimax chọn trước.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Ép `.game-layout` về `grid-template-columns: minmax(0, 1fr)` trên `<= 768px`, thêm `min-width: 0; max-width: 100%;` cho `.game-main-split`, `.game-left-column`, `.event-card`, `.player-info`, cho `.header-left { flex: 1 1 0; overflow: hidden; }` và `.player-career { max-width: 100%; }` để không bao giờ đẩy tràn cạnh phải trên màn hình hẹp `360–390px`.
  - Di chuyển Tướng Đỏ của `Thế 5` trong `src/views/co-tuong/constants.ts` sang `(5,9)`, đồng thời sửa lại bố cục thế cờ (`Xe (7,1)`, `Pháo (4,5)`, `Pháo (1,1)` và `Tốt Đen (3,1)` làm ngòi canh `(4,1)`) để `Xe (7,1) -> (4,1)` (`Xe 2 bình 5`) hợp lệ không bị quân mình chắn đường và là lời giải chiếu bí 1 nước duy nhất (kèm test kiểm chứng `getLegalMovesForPiece` + `findBestMove`).

---

## 12. Lỗi `JSON.parse` không an toàn khi đọc `localStorage` trong `useHomeSettings.ts`

- **Ngày ghi nhận:** 2026-11-27
- **Triệu chứng:** `src/composables/useHomeSettings.ts` gọi thẳng `JSON.parse(localStorage.getItem('vibe:sidebar-collapsed') ?? 'false')` không có `try/catch`; nếu khóa này trong `localStorage` bị hỏng chuỗi JSON thì toàn bộ `HomeView` bị văng exception lúc setup và không render được. Ngoài ra phím `/` ở `HomeView` chưa bỏ qua khi `[role="dialog"]` đang mở.
- **Nguyên nhân gốc rễ:** Đọc trực tiếp giá trị trình duyệt lưu bên ngoài mà không qua bộ bọc `try/catch` kiểm kiểu.
- **Giải pháp & Quy tắc phòng ngừa:** Bọc toàn bộ lần đọc JSON từ `localStorage` trong helper `safeReadBoolean()` có `try/catch` + kiểm tra `typeof parsed === 'boolean'`, lưu kèm `viewMode`/`sortMode` an toàn qua helper riêng, và chặn phím tắt `/` khi đang mở hộp thoại.

---

## 13. Cụm nút Sắp xếp ở Home Launcher Mobile bị bẻ 2 dòng hẹp tại `390px`

- **Ngày ghi nhận:** 2026-11-27
- **Triệu chứng:** Trên viewport `390×844`, 3 nút `Nổi bật / A–Z / Gần đây` trong `.controls-toolbar` bị bẻ xuống 2 dòng chật bên trong pill group (`Nổi / bật`, `A– / Z`, `Gần / đây`) vì đứng cùng dòng không cho xuống hàng với cụm Lưới/Danh sách và nút `🎲 Ngẫu nhiên`.
- **Nguyên nhân gốc rễ:** `.view-controls` thiếu `flex-wrap: wrap` và `.segmented-control button` thiếu `white-space: nowrap`.
- **Giải pháp & Quy tắc phòng ngừa:** Thêm `flex-wrap: wrap` cho `.view-controls` và `white-space: nowrap` cho `.segmented-control button` để các nhóm segmented luôn giữ nguyên chữ trên 1 dòng và tự xuống hàng gọn gàng trên màn hình hẹp.

---

## 14. Nút hồ sơ cá nhân trong `AppSidebar.vue` khi thu gọn thiếu `aria-label`

- **Ngày ghi nhận:** 2026-11-27
- **Triệu chứng:** Khi `AppSidebar` ở trạng thái thu gọn (`isSidebarCollapsed = true`), khối `.user-info` bị ẩn qua `v-if` nên `button.user-profile` chỉ còn 2 ký tự avatar viết tắt và thuộc tính `:data-tooltip`, không có nhãn ARIA cho trình đọc màn hình (đã bị unit test `tests/home.spec.ts` phát hiện khi kiểm tra toàn bộ button trong sidebar).
- **Nguyên nhân gốc rễ:** Khi bổ sung `aria-label` cho các nút điều hướng `.palette-trigger`, `.nav-item`, `.collapse-trigger`, nút cuối cùng `.user-profile` ở footer bị sót.
- **Giải pháp & Quy tắc phòng ngừa:** Thêm `:aria-label="\`Hồ sơ cá nhân (${userName}) — mở cài đặt\`"` vào `button.user-profile` và giữ unit test kiểm tra 100% `<button>` trong `AppSidebar` ở trạng thái thu gọn đều có `aria-label` hợp lệ.

---

## 15. Nút `📋 Chép lời giải` ở `oracle-tarot` không đổi trạng thái khi Clipboard API bị treo trong webview

- **Ngày ghi nhận:** 2026-11-27
- **Triệu chứng:** Trên trình duyệt Chrome headless/webview, bấm `📋 Chép lời giải` sau khi lật trải bài 3 lá ở `/oracle-tarot` không chuyển nhãn nút sang `✅ Đã chép lời giải`.
- **Nguyên nhân gốc rễ:**
  1. Hàm `copyReadingText()` `await navigator.clipboard?.writeText(text)` *trước khi* cập nhật `copiedReading.value = true`, nên nếu môi trường chặn hoặc làm treo Promise của Clipboard API thì UI phản hồi không bao giờ chạy.
  2. Điều kiện `every((s) => s.flipped)` cũng chặn thao tác nếu người dùng bấm sao chép khi đang xem lá vừa lật trước khi lật đủ 3 lá.
- **Giải pháp & Quy tắc phòng ngừa:** Chuyển sang gom tất cả các lá đã lật (`filter((s) => s.flipped)`), cập nhật trạng thái `copiedReading.value = true` ngay lập tức (kèm timer `2200ms`), và bọc `navigator.clipboard.writeText` trong `Promise.race` có fallback `<textarea>` + `execCommand('copy')` khi bị từ chối quyền.

---

## 16. Cờ Tướng bị cắt mất nửa dưới bàn cờ trên Laptop & quân cờ cột biên chìa khỏi khung gỗ (`co-tuong`)

- **Ngày ghi nhận:** 2026-11-27
- **Triệu chứng:**
  1. Ở viewport Laptop/Desktop (`1366×720` hoặc cửa sổ trình duyệt cao `~650–740px`), bố cục `co-tuong` xếp chồng quá nhiều thanh phía trên bàn cờ (`chess-header`, `status-banner`, `eval-widget`, `captured-strip`) và cố định `.board-outer { max-width: 548px }` theo chiều rộng thay vì chiều cao `100dvh`, làm cắt mất 40% nửa dưới bàn cờ bên Đỏ cùng khay quân ăn & biên bản.
  2. Trong `XiangqiBoard.vue`, quân cờ cột 1 và 9 chìa vượt khỏi viền gỗ bên ngoài, hàng quân trên/dưới dính vào số tọa độ `1–9`, dãy số `1–9` bị lệch nhẹ khỏi tâm đường dọc và dùng font `vw` thay vì `cqi`.
  3. Nút `📋 Chép biên bản` trong `co-tuong` chưa có fallback clipboard giống `oracle-tarot`.
- **Nguyên nhân gốc rễ:** Thiếu ràng buộc `calc((100dvh - chrome) * ratio)` cho chiều rộng bàn cờ, padding ngang khung gỗ nhỏ hơn bán kính quân cờ (`5.1% * 1.1` khi được chọn), `justify-content: space-between` trên dãy số thay vì định vị tuyệt đối `left: (idx/8)*100%`, và `aspect-ratio` quân cờ dùng `%` chiều cao theo `8:9` thay vì `aspect-ratio: 1`.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Giữ nguyên bố cục gốc (`chess-header`, `status-banner`, `eval-widget`, `captured-strip`), chỉ thu gọn kích thước bàn cờ từ `548px` xuống `max-width: 420px` (cùng `.chess-shell` `max-width: 980px` và padding/gap vừa phải) để vừa vặn khung màn hình mà không làm thay đổi thiết kế quen thuộc.
  - Trong `XiangqiBoard.vue`, dùng `container-type: inline-size`, đệm khung gỗ `8px clamp(18px, 6.5cqi, 30px)`, khóa quân cờ & vòng highlight bằng `aspect-ratio: 1`, căn tâm dãy số `1–9` theo tọa độ `0%..100%` để quân biên luôn nằm gọn trong khung gỗ.

---

## 17. Sửa chuỗi 6 lỗi logic gốc & đồng bộ Pinia trong `Ngã Rẽ Cuộc Đời` (`ngare`)

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:**
  1. Chỉ số tiền (`money`) bị `Math.min(100, ...)` kẹp trần về `100` mỗi khi chọn lựa chọn có `effects.money` hoặc dùng vật phẩm tài chính.
  2. Thành tựu `survivor` mở khóa sai ngay từ đầu game tuổi 22 vì chỉ kiểm tra `health >= 50`; thành tựu `zen_master` kích hoạt ngay năm đầu thay vì đòi hỏi 5 năm `stress <= 10` liên tiếp.
  3. Kỹ năng `skill_shield` gán `duration: 255` và được `_isEventImmune` kiểm tra nhưng không hề trừ đi sau khi chặn sự kiện nguy hiểm (gây bất tử suốt game).
  4. Mua vật phẩm/kỹ năng trong UI gọi thẳng `ngareStore.engine.buyItem/buySkill` mà không đồng bộ lại `ngareStore.gameState`, làm UI/Pinia có thể lệch state hoặc mất khi reload nếu chưa qua lượt mới; `usedEvents` không nằm trong state Pinia nên bị reset về rỗng mỗi khi F5; `ngare_endings` còn ghi trực tiếp vào `localStorage` ngoài Pinia.
  5. Hàm `calculateEnding()` bị viết trùng giữa `engine.ts` và `index.vue`.
- **Nguyên nhân gốc rễ:** Kẹp chung `money` với 5 chỉ số `[0, 100]`, thiếu tracker trạng thái quá khứ (`hadCriticalHealth`, `lowStressStreak`), thiếu helper `_syncFromEngine()` sau mọi action cửa hàng/kỹ năng trên store, và gom toàn bộ UI/logic 3.245 dòng trong một file `index.vue` tự định nghĩa biến màu tối cứng thay vì dùng CSS Variables của nền tảng.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Tách helper `clampStatValue(key, val)`: chỉ kẹp `[0, 100]` với 5 chỉ số tâm sinh lý, giữ `money >= 0` không giới hạn trần.
  - Theo dõi `hadCriticalHealth` & `lowStressStreak` trong `GameState`, tiêu thụ đúng 1 buff `immunity_danger` khi `skill_shield` đỡ biến cố nguy hiểm (`_consumeDangerShield`), lưu `usedEventIds`, `unlockedEndings`, `hallOfFame`, `soundEnabled` qua `useNgareStore` với `_syncFromEngine()`.
  - Tái cấu trúc `ngare` thành 6 component con theo chuẩn `AGENTS.md` và chuyển toàn bộ màu sang CSS Variables (`--bg`, `--bg-card`, `--text`, `--primary`,...) tương thích 100% cả 4 theme.

---

## 18. Thiếu `rewardCoins` khi lên cấp trong `anime-farm` & sót tiền tố backup `FAM_FARM_` / `FAM_ORDERS_`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:**
  1. Trong `public/apps/anime-farm/js/bundle.js`, mỗi lần người chơi lên cấp (`addExp()`), vàng thưởng lên cấp không được cộng vào `this.coins` và modal lên cấp bị rỗng phần thưởng.
  2. Công cụ sao lưu JSON (`src/utils/backup.ts`) khai báo tiền tố `'anime_farm_'` nhưng `anime-farm` thực tế lưu dưới khóa `'FAM_FARM_GAME_SAVE_V6_3PLOTS'` và `'FAM_ORDERS_SAVE_V4'`, làm sao lưu bị bỏ qua dữ liệu nông trại.
- **Nguyên nhân gốc rễ:**
  1. Hàm `getLevelInfo(totalExp)` trả về thiếu trường `rewardCoins: currentLevel.rewardCoins`, khiến `cur.rewardCoins` trong `addExp()` luôn là `undefined`; ngoài ra `addExp()` không cộng dồn phần thưởng nếu người chơi vượt 2 cấp trở lên trong một đơn hàng lớn.
  2. Whitelist `ALLOWED_STORAGE_PREFIXES` trong `src/utils/backup.ts` đặt theo slug thay vì tiền tố khóa `localStorage` thực tế của embed app.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Trả về `rewardCoins` trong `getLevelInfo`, cộng dồn thưởng từ `prev + 1` đến `cur.level` trong `addExp()`, và khóa hành vi bằng `tests/anime-farm-engine.spec.ts`.
  - Bổ sung `'FAM_FARM_'` và `'FAM_ORDERS_'` vào `ALLOWED_STORAGE_PREFIXES` cùng test xác nhận trong `tests/backup-and-launcher.spec.ts`.

---

## 19. Lỗi thẻ `REPAIR_HOUSES` không tính phí bảo trì nhà/khách sạn trong `saigon-tycoon` & sót khóa backup `monopoly_`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:**
  1. Trong `public/apps/saigon-tycoon/shared/engine.js`, khi người chơi rút thẻ Cơ Hội *"Tu Sửa Nhà Cửa"* (`REPAIR_HOUSES`), hệ thống luôn tính `totalCost = 0đ` dù người chơi đang sở hữu nhiều nhà xanh và khách sạn đỏ.
  2. Dữ liệu bàn cờ, thành tựu (`monopoly_saigon_achievements`), và ván chơi (`monopoly_saigon_save`) chưa nằm trong whitelist backup JSON (`src/utils/backup.ts`).
- **Nguyên nhân gốc rễ:**
  1. Hàm `executeCard` (dòng 216) kiểm tra nhầm `if (prop.ownerId === player.id)` trong khi mọi entry của `state.properties` đều lưu khóa chủ sở hữu là `prop.owner`.
  2. Các module của `saigon-tycoon` dùng tiền tố `monopoly_` thay vì `saigon_tycoon_`.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Sửa thành `if (prop.owner === player.id)` và rà soát toàn bộ `public/apps/saigon-tycoon/` để đảm bảo không còn lỗi gõ nhầm `ownerId`.
  - Bổ sung test hồi quy `REPAIR_HOUSES` cùng 6 nhóm kiểm thử (`BotAI`, Đấu giá, Thế chấp/Chuộc, Giao dịch, Phá sản/Tối đa vòng) vào `tests/saigon-tycoon-engine.spec.ts`, và thêm `'monopoly_'` vào `ALLOWED_STORAGE_PREFIXES`.

---

## 20. Rò rỉ `requestAnimationFrame` chưa hủy trong `oop-flashcards` & trùng lặp fallback Clipboard

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:**
  1. Trong `src/views/oop-flashcards/index.vue`, `triggerShake()` gọi `requestAnimationFrame(...)` mà không lưu ID để gọi `cancelAnimationFrame` trong `onUnmounted`, dễ kích hoạt callback đổi reactive ref sau khi rời trang.
  2. Ba view (`oracle-tarot`, `co-tuong`, `oop-flashcards`) tự cài đặt hoặc thiếu `<textarea>` fallback cho `navigator.clipboard.writeText`.
- **Nguyên nhân gốc rễ:** Thiếu biến theo dõi `shakeRafId` và thiếu helper dùng chung trong `src/utils/`.
- **Giải pháp & Quy tắc phòng ngừa:**
  - Lưu `shakeRafId`, hủy ở cả lần gọi kế tiếp và trong `onUnmounted`.
  - Gom logic Clipboard + `Promise.race` + timeout cleanup + `<textarea>` fallback về `src/utils/clipboard.ts` (`copyTextWithFallback`) để tái sử dụng thống nhất.

---

## 21. Rò rỉ `requestAnimationFrame` trong `neon-typing` & chuẩn hóa `copyTargetCode` của `color-game`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Trong `src/views/neon-typing/index.vue`, `triggerInputShake()` gọi `requestAnimationFrame` không hủy trong `onUnmounted`; trong `src/views/color-game/index.vue`, `copyTargetCode()` chưa dùng `copyTextWithFallback`.
- **Nguyên nhân gốc rễ:** Thiếu biến `shakeRafId` và còn giữ lời gọi `navigator.clipboard.writeText` riêng lẻ.
- **Giải pháp & Quy tắc phòng ngừa:** Lưu `shakeRafId` và hủy qua `cancelAnimationFrame` trong `onUnmounted`; chuyển `color-game` sang dùng chung `copyTextWithFallback`.

---

## 22. Thiếu tương phản viền/track trắng trên giao diện sáng `Arctic Light` ở `color-game` & `ChessHistoryPanel`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:**
  1. Trong `src/views/color-game/index.vue`, `.ch-track` (`rgba(255, 255, 255, 0.08)`), `.color-tile` (`rgba(255, 255, 255, 0.14)`), và `.color-tile.winner` (`#ffffff` / halo trắng) bị mờ hoặc chìm hẳn trên nền card trắng của `Arctic Light`.
  2. Trong `ChessHistoryPanel.vue`, `.move-side.red` dùng mã màu cứng `#f87171` kém tương phản trên nền sáng.
- **Nguyên nhân gốc rễ:** Còn sót giá trị `rgba(255, 255, 255, ...)` và hex sáng cố định từ bản Dark theme đầu tiên thay vì map vào CSS Variables nền tảng.
- **Giải pháp & Quy tắc phòng ngừa:** Thay bằng `var(--bg-elevated)`, `var(--outline)`, `var(--primary)`, `var(--success)`, `var(--primary-glow)` và `var(--danger)`; khóa hồi quy chuyển đổi 4 theme trong `tests/resilience-and-a11y.spec.ts`.

---

## 23. Thuộc tính `slot.card.numeral` không tồn tại khi xuất lời giải `oracle-tarot`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Hàm `formatReadingShareText` tại `src/views/oracle-tarot/engine.ts` chèn `${slot.card.numeral}`, khiến chuỗi sao chép in ra `undefined · Tên lá bài` thay vì số La Mã (`0`–`XXI`).
- **Nguyên nhân gốc rễ:** Model `OracleCard` trong `data.ts` định nghĩa trường `roman`, nhưng hàm format trước đây viết nhầm tên trường `numeral` và test chỉ assert `text` chứa `card.name`.
- **Giải pháp & Quy tắc phòng ngừa:** Sửa sang `${slot.card.roman}` và bổ sung assertion kiểm tra `${spread[0].card.roman} · ${spread[0].card.name}` đồng thời cấm chuỗi `undefined ·` trong `tests/oracle-tarot-engine.spec.ts`.

---

## 24. Thiếu chặn số lượng âm/không nguyên ở `buySeeds` / `sellCrop` (`anime-farm`) & thiếu cộng `jackpotPot` khi hết lượt tù (`saigon-tycoon`)

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:**
  1. Trong `public/apps/anime-farm/js/bundle.js`, `buySeeds(cropId, -5)` hoặc `sellCrop(cropId, -5)` vượt qua kiểm tra `available < quantity` và cộng tiền/nông sản âm dấu sai logic.
  2. Trong `public/apps/saigon-tycoon/shared/engine.js`, nhánh `JAIL_FORCED_PAY` trừ tiền phạt tù `500K` của người chơi nhưng quên cộng vào `this.state.jackpotPot` như nhánh `PAY_JAIL_FINE`.
- **Nguyên nhân gốc rễ:** Thiếu guard `!Number.isInteger(quantity) || quantity <= 0` ở API giao dịch nông trại và quên đồng bộ dòng tiền vào hũ phạt chung giữa 2 đường ra tù.
- **Giải pháp & Quy tắc phòng ngừa:** Bổ sung kiểm tra `INVALID_QUANTITY` cho cả `buySeeds`/`sellCrop`, cộng `GAME_CONSTANTS.JAIL_FINE` vào `jackpotPot` tại `JAIL_FORCED_PAY`, và khóa hồi quy trong `tests/anime-farm-engine.spec.ts` + `tests/saigon-tycoon-engine.spec.ts`.

---

## 25. Trùng ID sự kiện `med_promote` giữa ngành `media` và `medical` trong `ngare`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Khi kiểm toán đồ thị toàn bộ sự kiện tại `tests/ngare-engine.spec.ts`, hai sự kiện thuộc 2 ngành khác nhau (`Head of Marketing` ở `media` và `Trưởng khoa` ở `medical`) cùng dùng `id: 'med_promote'`, có thể đè `seenEvents` khi người chơi chuyển ngành sau tuổi 28.
- **Nguyên nhân gốc rễ:** Dùng chung tiền tố viết tắt `med_` cho cả hai mảng `media` và `medical` trong `src/views/ngare/data/events-career.ts`.
- **Giải pháp & Quy tắc phòng ngừa:** Đổi ID của sự kiện ngành `media` sang `'media_promote'` và khóa kiểm tra unique ID toàn đồ thị sự kiện trong `tests/ngare-engine.spec.ts`.

---

## 26. Số tổng thẻ OOP hiển thị cứng `/27` trên `DailyHubCard` sau khi mở rộng bộ thẻ lên 32

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Thẻ tóm tắt *Thẻ OOP thuộc* trong `src/views/home/DailyHubCard.vue` vẫn hiển thị `.../27` thay vì `.../32` sau Sprint 9 mở rộng `OOP_FLASHCARDS`.
- **Nguyên nhân gốc rễ:** Hardcode số lượng `27` trong chuỗi hiển thị thay vì đọc trực tiếp từ `OOP_FLASHCARDS.length`.
- **Giải pháp & Quy tắc phòng ngừa:** Import `OOP_FLASHCARDS` từ `@/views/oop-flashcards/data` để tính động `${OOP_FLASHCARDS.length}` và kiểm tra qua unit test tại `tests/daily-challenge.spec.ts`.

---

## 27. Lỗ hổng biên giá đấu giá khởi điểm (`BID_AUCTION`), giao dịch âm tiền/tự giao dịch (`EXECUTE_TRADE`) & đọc ghi `localStorage` chưa bọc `try/catch` trong `saigon-tycoon`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:**
  1. Trong `public/apps/saigon-tycoon/shared/engine.js` (`BID_AUCTION`), điều kiện kiểm tra giá đấu chỉ bật khi `highestBidder !== null`, khiến lượt đấu giá đầu tiên chấp nhận giá `0`, số âm hoặc thấp hơn `currentBid` (giá khởi điểm).
  2. Nhánh `EXECUTE_TRADE` không chặn `sender.id === receiver.id` và chỉ kiểm tra `sender.money < offerMoney` khi `offerMoney > 0`, cho phép truyền `offerMoney`/`requestMoney` âm hoặc `NaN` để trừ ngược tiền đối phương.
  3. Hai module âm thanh `LoFiSynthesizer.js` và `SoundEffects.js` gọi trực tiếp `localStorage.getItem/setItem` và `parseFloat` chưa có `try/catch`, có thể ném ngoại lệ ở môi trường iframe hạn chế Storage.
- **Nguyên nhân gốc rễ:** Kiểm tra biên đầu vào thiếu đồng nhất giữa nhánh đầu tiên và các nhánh kế tiếp của state machine đấu giá/giao dịch, cùng việc truy cập Storage trần ở tiện ích client.
- **Giải pháp & Quy tắc phòng ngừa:** Chặn `bidAmount <= 0 || !Number.isFinite(bidAmount)` và áp ngưỡng `bidAmount < currentBid` cho lượt đặt đầu trong `BID_AUCTION`; cấm `sender.id === receiver.id` và số tiền âm/`NaN` trong `EXECUTE_TRADE`; bọc `try/catch` đọc/ghi `localStorage` ở `LoFiSynthesizer.js` + `SoundEffects.js`; khóa lưới `.bid-buttons-row` & `.token-choice-grid` với `minmax(0, 1fr)`; bổ sung regression test tại `tests/saigon-tycoon-engine.spec.ts`.

---

## 28. Phím tắt ứng dụng con (`oop-flashcards`, `mini-piano`, `ngare`) rò rỉ xuyên Modal (`role="dialog"`) hoặc kích hoạt khi giữ `Ctrl+1` / focus `<select>` / `contentEditable`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:**
  1. Khi mở Command Palette (`Ctrl+K`) trên `oop-flashcards` hoặc `mini-piano`, nhấn `Space`/`ArrowRight` vẫn lật/chấm thẻ bên dưới và nhấn `A/S/D/F/G/H/J/K` vẫn phát nốt đàn bên dưới do `handleKeydown` không kiểm tra `[role="dialog"]`.
  2. Trong `ngare`, nhấn tổ hợp trình duyệt `Ctrl+1..4` không bị chặn ở `handleKeydown`, vô tình kích hoạt lựa chọn cốt truyện.
  3. Các handler chỉ kiểm tra `HTMLInputElement`/`HTMLTextAreaElement`, bỏ sót `HTMLSelectElement` và vùng `isContentEditable`.
- **Nguyên nhân gốc rễ:** Logic bảo vệ sự kiện phím tắt lặp lại thủ công không đồng đều ở từng view thay vì dùng helper dùng chung.
- **Giải pháp & Quy tắc phòng ngừa:** Tạo helper [keyboard.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/utils/keyboard.ts) (`isEditableEventTarget`, `hasOpenDialog`), áp dụng đồng bộ trên `oop-flashcards`, `mini-piano`, `ngare`, `color-game`, `home` và `neon-typing`, và khóa hồi quy trong `tests/resilience-and-a11y.spec.ts`.

---

## 29. Store Pinia & `backup.ts` dễ ném `TypeError` / `QuotaExceededError` khi nạp save thiếu trường hoặc ghi Storage đầy

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:**
  1. Nếu `localStorage` chứa save cũ/thiếu trường (ví dụ `stats: undefined` trong `coTuong`, `masteredIds`/`reviewIds` null trong `oopFlashcards`, `history`/`favoriteIds`/`customFoods` thiếu trong `homNayAnGi`/`oracleTarot`/`miniPiano`), việc gọi action sẽ ném `TypeError` (`Cannot read properties of undefined` / `is not iterable`).
  2. `restoreBackupPayload` & `buildBackupPayload` trong `src/utils/backup.ts` và `useHomeSettings` gọi thẳng `localStorage.getItem/setItem` chưa bọc `try/catch`, có thể văng lỗi khi quota trình duyệt đầy hoặc Storage bị chặn.
- **Nguyên nhân gốc rễ:** Giả định mọi khóa Pinia/Storage luôn có cấu trúc hoàn hảo và không bao giờ ném `DOMException`.
- **Giải pháp & Quy tắc phòng ngừa:** Chuẩn hóa `Array.isArray(...)` và default object an toàn tại toàn bộ action trong 5 store (`coTuong`, `oopFlashcards`, `homNayAnGi`, `oracleTarot`, `miniPiano`), bọc `try/catch` đọc/ghi Storage trong `backup.ts` & `useHomeSettings.ts`, và bổ sung test hồi quy tại `tests/backup-and-launcher.spec.ts` + `tests/resilience-and-a11y.spec.ts`.

---

## 30. Khởi tạo / đóng `AudioContext` chưa có `try/catch` đồng nhất ở `useColorAudio`, `useTypingAudio`, `useCoTuongAudio` & `mini-piano`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Nhiều composable âm thanh lặp lại đoạn khởi tạo `window.AudioContext || webkitAudioContext` mà không bọc `try/catch` cho `new AudioContext()`, `resume()`, `close()` hay lúc tạo oscillator; nếu trình duyệt chặn autoplay hoặc không hỗ trợ phần cứng âm thanh, hàm phát hiệu ứng có thể ném exception ra UI handler.
- **Nguyên nhân gốc rễ:** Thiếu utility Web Audio dùng chung nên mỗi module tự sao chép logic vòng đời `AudioContext` với mức độ phòng thủ khác nhau.
- **Giải pháp & Quy tắc phòng ngừa:** Trích xuất helper dùng chung [audio.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/utils/audio.ts) (`createSafeAudioManager`), gom trọn 5 module (`useColorAudio`, `useTypingAudio`, `useFoodAudio`, `useNgareAudio`, `useCoTuongAudio`, `mini-piano`) về một đường dẫn chuẩn hóa và kiểm thử trong `tests/resilience-and-a11y.spec.ts`.

---

## 31. `upsertDailyBest` thiếu chặn `Infinity` / `score < 0` và `maxEntries <= 0` trong `daily-seed.ts`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Khi kiểm toán `upsertDailyBest` tại [daily-seed.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/utils/daily-seed.ts), giá trị `Infinity` vượt qua điều kiện `score > prev`, và `maxEntries <= 0` khiến vòng `while` xóa sạch toàn bộ lịch sử kỷ lục.
- **Nguyên nhân gốc rễ:** Thiếu kiểm tra `Number.isFinite(score) && score >= 0` và giới hạn dưới cho `maxEntries`.
- **Giải pháp & Quy tắc phòng ngừa:** Chuẩn hóa điều kiện `Number.isFinite(score) && score >= 0 && score > prev` cùng `Math.max(1, Math.floor(maxEntries))` và khóa hồi quy tại `tests/daily-challenge.spec.ts`.

---

## 32. `oracle-tarot` bật cờ "Đã chép lời giải" trước khi kiểm tra kết quả `copyTextWithFallback`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Hàm `copyReadingText` trong [oracle-tarot/index.vue](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/views/oracle-tarot/index.vue) gán `copiedReading.value = true` và đặt timer reset trước khi gọi `await copyTextWithFallback(text)`, khiến UI vẫn báo đã sao chép thành công ngay cả khi trình duyệt từ chối quyền clipboard (`false`).
- **Nguyên nhân gốc rễ:** Đặt hiệu ứng phản hồi UI theo kiểu lạc quan trước lệnh bất đồng bộ mà không kiểm tra cờ trả về boolean.
- **Giải pháp & Quy tắc phòng ngừa:** Đổi sang `const ok = await copyTextWithFallback(text); if (!ok) return` trước khi bật `copiedReading`, đồng nhất với `neon-typing` và `mini-piano`, kèm kiểm thử luồng tại `tests/native-views-flow.spec.ts`.

---

## 33. Engine `ngare` (`buyItem` & `buySkill`) thiếu kiểm tra `unlockAge` khớp với UI `ShopSkillModal`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Giao diện `ShopSkillModal.vue` khóa nút mua khi `age < unlockAge`, nhưng phương thức `buyItem` và `buySkill` trong [ngare/engine.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/views/ngare/engine.ts) không kiểm tra ngưỡng tuổi mở khóa (chỉ có `buyAsset` kiểm tra `this.state.age < def.unlockAge`).
- **Nguyên nhân gốc rễ:** Đặt validation điều kiện mở khóa ở lớp UI thay vì chốt invariant ở Pure Engine.
- **Giải pháp & Quy tắc phòng ngừa:** Bổ sung guard `this.state.age < item.unlockAge` & `this.state.age < skill.unlockAge` trong `ngare/engine.ts`, cập nhật các unit test mua item/skill theo đúng tuổi mở khóa và bổ sung test từ chối dưới tuổi trong `tests/ngare-engine.spec.ts`.

---

## 34. Buff `double_positive` (`✨ Khoảnh khắc vàng`) nhân đôi nhầm cả `stress > 0` gây phạt ngược trong `ngare`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Khi kích hoạt kỹ năng `skill_double_power` ("DOUBLE toàn bộ hiệu ứng tích cực") rồi chọn phương án có `{ skill: 6, stress: 5 }`, `engine.ts` nhân đôi cả `stress` lên `+10` thay vì giữ `+5`.
- **Nguyên nhân gốc rễ:** Điều kiện `val > 0 && doubleBuff` tại [ngare/engine.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/views/ngare/engine.ts) đồng nhất `val > 0` là tích cực, bỏ qua việc `stress` là chỉ số nghịch đảo (tích cực khi `val < 0`).
- **Giải pháp & Quy tắc phòng ngừa:** Định nghĩa rõ `const isBeneficial = key === 'stress' ? val < 0 : val > 0` trước khi áp hệ số `doubleBuff`, đồng thời khóa kiểm thử tại `tests/ngare-engine.spec.ts`.

---

## 35. `createSwatch` & `rgbToHsl` trong `color-game/engine.ts` không kẹp biên kênh RGB `[0..255]` nhất quán với `toHexChannel`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Hàm `createSwatch(-5, 300, 128)` tạo mã `hex: "#00FF80"` nhưng vẫn giữ `rgb: "rgb(-5, 300, 128)"` và tính `rgbToHsl` từ giá trị ngoài miền `[0..255]` / `NaN`.
- **Nguyên nhân gốc rễ:** Chỉ áp logic kẹp `[0, 255]` bên trong `toHexChannel` thay vì tách hàm `clampChannel` áp dụng ngay ở đầu chuỗi biến đổi màu.
- **Giải pháp & Quy tắc phòng ngừa:** Tách helper `clampChannel(n)` (`!Number.isFinite(n)` trả `0`, kẹp `[0, 255]`) dùng thống nhất cho `toHexChannel`, `rgbToHsl` và `createSwatch`; bổ sung unit test biên tại `tests/color-game-engine.spec.ts`.

---

## 36. Sự kiện sa thải (`danger_job_loss`) trong `ngare` không xóa chức danh cũ và vẫn cộng lương hàng năm

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Khi người chơi gặp biến cố *"Công ty sa thải hàng loạt"* (`danger_job_loss`) và chọn *"Chấp nhận gói thôi việc"* hoặc *"Hoảng loạn, không làm gì"*, nhân vật vẫn giữ nguyên chức danh cũ (ví dụ `Giám đốc công nghệ (CTO)`) và tiếp tục nhận đủ lương hàng năm thay vì rơi vào trạng thái thất nghiệp.
- **Nguyên nhân gốc rễ:** Lựa chọn thua/mất việc trong [events-dangerous.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/views/ngare/data/events-dangerous.ts) chỉ trừ/cộng chỉ số một lần mà không gắn cờ trạng thái `'unemployed'`, còn `applyChoice` tại [ngare/engine.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/views/ngare/engine.ts) luôn tính lại `currentLevel` & `salary` từ `skill` mỗi lượt bất kể hoàn cảnh việc làm.
- **Giải pháp & Quy tắc phòng ngừa:** Gắn `setFlags: ['unemployed']` + hẹn sự kiện tái tuyển dụng `arc_job_recovery` (trong [events-arcs.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/views/ngare/data/events-arcs.ts)), kiểm tra cờ `'unemployed'` trong `engine.ts` để đặt `currentLevel = 'Đang thất nghiệp'` và `salary = 0`, cho phép ứng tuyển lại trong `ShopSkillModal.vue`, hiển thị badge cảnh báo trong `StatsDashboard.vue`, và khóa regression test tại `tests/ngare-engine.spec.ts`.

---

## 37. Cột trái gameplay `ngare` bị tràn mép dưới màn hình laptop (~720px) khi sự kiện có 3 lựa chọn

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Khi gặp sự kiện có 3 lựa chọn (như cột mốc tuổi 50), nút lựa chọn thứ 3 bị đẩy lố xuống dưới mép dưới khung nhìn laptop dù cột Nhật ký bên phải vẫn gọn.
- **Nguyên nhân gốc rễ:** Header, `StatsDashboard.vue`, `YearlyActionsBar.vue` và `.event-card` trong [ngare/index.vue](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/views/ngare/index.vue) cộng dồn khoảng cách dọc (~390px phần trên) kết hợp danh sách `.event-choices` xếp dọc 1 cột với `padding` lớn.
- **Giải pháp & Quy tắc phòng ngừa:** Nén padding/gap hợp lý ở các khối trên, đồng thời chuyển `.event-choices.is-multi` sang lưới đều 3 cột (`.is-three`) cho 3 lựa chọn hoặc 2 cột cho `>= 4` lựa chọn (mobile tự xếp 1 cột) và kiểm thử class `.is-multi` / `.is-three` tại `tests/ngare-store.spec.ts`.

---

## 38. Nút lựa chọn số 1 bị lệch viền trái 4px và mất cân đối hàng 2+1 trong `ngare`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Khi sự kiện có 3 lựa chọn, nút số 1 nhô viền cam sang trái ~4px so với nút số 3 bên dưới, còn nút số 3 kéo dài toàn chiều ngang 100% gây lệch bố cục so với hàng 2 nút phía trên.
- **Nguyên nhân gốc rễ:** `v-for` dùng `:key="idx"` khiến Vue tái sử dụng nguyên DOM `<button>` đầu tiên qua các lượt và giữ lại `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }` toàn cục từ [App.vue](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/App.vue), đồng thời rule `grid-column: 1 / -1` ép nút thứ 3 thành hàng dài đơn độc.
- **Giải pháp & Quy tắc phòng ngừa:** Dùng `:key="`${currentEvent.id}-${idx}`"` để ngắt rò rỉ focus qua lượt mới, đặt `.choice-btn:focus-visible { outline-offset: -2px; }` để viền focus nằm gọn trong khung, và chuyển bố cục 3 lựa chọn sang 3 cột bằng nhau (`repeat(3, minmax(0, 1fr))` trên desktop `> 960px`).

---

## 39. Màn kết thúc `LifeRecapScreen.vue` bị tràn dọc laptop vì chỉ vá từng màn rời rạc mà thiếu kiểm toán `100dvh` toàn bộ 4 màn

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Sau khi sửa tràn dọc ở màn gameplay `ngare`, sang màn kết thúc `LifeRecapScreen.vue` hàng chỉ số thứ 2 và cụm nút *Chơi Lại / Chép hồ sơ / Về Trang Chủ* vẫn bị tràn ra ngoài mép dưới màn hình laptop (`~720px`).
- **Nguyên nhân gốc rễ:** (1) Vá UI theo triệu chứng ở màn đang thấy mà không rà đồng bộ tất cả state screen (`intro`, `create`, `game`, `end`) theo ngân sách chiều cao `<= 680px`; (2) `.screen-center` (`padding-bottom: 3rem`) chồng thêm padding với `.end-container` (`padding: 1.5rem 1rem 3rem`) mất ~140px khoảng trống chết; (3) Toàn bộ `end-header`, chips, biểu đồ và 6 thẻ chỉ số xếp dọc 1 cột hẹp `max-width: 780px` (~915px).
- **Giải pháp & Quy tắc phòng ngừa:** Tối ưu `.screen-center` còn `padding: 0.85rem 1rem`, thu gọn banner đầu, ghép `.chart-card` + `.end-stats` thành lưới 2 cột `.end-body-grid` (`max-width: 1080px`) giảm tổng chiều cao xuống ~520px; từ nay mọi sửa đổi layout màn hình phải kiểm toán toàn bộ các screen của app theo chuẩn `<= 680px` desktop và không chồng padding giữa container cha/con.

---

## 40. Sprite `cucumber.png` có khung giàn gỗ lệch bộ & hiệu ứng mưa dùng kẻ sọc tĩnh trong `anime-farm`

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Cây dưa leo chín trong `anime-farm` hiển thị khung giàn gỗ cồng kềnh khác hẳn dạng bụi tự đứng của cà tím/ớt/cà rốt/ngô, đồng thời thời tiết Mưa Rào chỉ phủ lớp sọc `repeating-linear-gradient` đứng yên nhìn giả tạo.
- **Nguyên nhân gốc rễ:** Prompt vẽ sprite `cucumber.png` trước đây mô tả dạng giàn leo gỗ thay vì dạng bụi cây độc lập đồng bộ với bộ 8 sprite còn lại; còn hiệu ứng mưa chỉ dùng CSS gradient tĩnh mà chưa có chuyển động hạt mưa + độ sâu + gợn nước mặt đất.
- **Giải pháp & Quy tắc phòng ngừa:** Vẽ lại sprite bụi dưa leo tự đứng không giàn theo phong cách gouache nét mực nâu ấm, tách nền sạch bằng flood-fill BFS từ biên (`280x340` ARGB); thay `repeating-linear-gradient` bằng `RainWeatherRenderer` trên `<canvas id="weather-rain-canvas">` (`z-index: 28`, 3 tầng độ sâu, góc gió nhẹ biến thiên, vòng gợn elip khi rơi xuống đất, zero-allocation trong vòng lặp `requestAnimationFrame` và tự tắt/cleanup khi đổi thời tiết hoặc `beforeunload`).

---

## 41. Sự kiện đi làm thuê (`danger_job_loss`, sếp ép tăng ca, đề bạt cấp trung) vẫn xuất hiện khi nhân vật là Tech Founder / CEO (`ngare`)

- **Ngày ghi nhận:** 2026-11-28
- **Triệu chứng:** Nhân vật đã đạt chức danh **Nhà Sáng Lập Công Nghệ (Tech Founder)** (`salary: 135`) ở tuổi 37 nhưng vẫn gặp sự kiện *"Công ty sa thải hàng loạt"* kêu *"Đề xuất phương án phục hồi với sếp"*.
- **Nguyên nhân gốc rễ:** `_isEventValid` trong [ngare/engine.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/views/ngare/engine.ts) chỉ lọc theo độ tuổi, cờ Story Arc và ngưỡng `stats`, không phân biệt nhân vật đang làm nhân viên, đã lên cấp Chủ / Lãnh đạo (`isExecutive`), hay đang thất nghiệp.
- **Giải pháp & Quy tắc phòng ngừa:** Gắn `isExecutive: true` cho các cấp đỉnh ở [careers.ts](file:///c:/Users/Admin/Documents/CV_Truong%20Dinh%20Anh/CV/project-showcase/src/views/ngare/data/careers.ts), bổ sung cờ `excludeExecutive` / `onlyExecutive` / `excludeUnemployed` trên `GameEvent`, lọc ngay trong `_isEventValid`, chặn 9 sự kiện nhân viên (`danger_job_loss`, `prog_deadline`, `prog_startup_offer`, 6 event `*_promote`, `edu_student`), đồng thời bổ sung biến cố `danger_executive_crisis` dành riêng cho lãnh đạo cấp cao và khóa unit test tại `tests/ngare-engine.spec.ts`.
