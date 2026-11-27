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
