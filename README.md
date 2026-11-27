# 🚀 Vibe Platform (Mini Apps Launcher)

**Vibe Platform** là một nền tảng web (Web Platform) được thiết kế theo kiến trúc "App Shell" để chứa và chạy nhiều mini-app hoàn toàn độc lập trong cùng một dự án duy nhất. 

Mỗi mini-app được tổ chức gọn gàng theo một thư mục (folder) riêng biệt, tự động đăng ký định tuyến (auto-routing) và hiển thị trực quan trên giao diện màn hình chính (Launcher) giống như hệ điều hành thu nhỏ.

---

## ✨ Tính Năng Nổi Bật

- 🧩 **Kiến trúc linh hoạt (Modular):** Mỗi mini-app hoạt động độc lập, có `meta.ts` riêng chứa thông tin hiển thị và được validate mạnh mẽ bằng **Zod**.
## 🧪 6. Unit Testing & Bảo vệ Logic
Logic lõi của nền tảng và các mini-app được bảo vệ nghiêm ngặt bởi hơn **100 Unit Tests** (Vitest + Vue Test Utils) trải rộng trên 15 bộ test (`tests/`), bao gồm:
- `saigon-tycoon-engine.spec.ts`: Kiểm thử 40 ô Bàn Cờ Tỷ Phú Sài Gòn, luật xây nhà đều tay / kho ngân hàng / thế chấp, tính tiền thuê Đất/Bến xe/Tiện ích, Sudden Death và `GameEngine` tung đôi 3 lần vào tù / mua đất / nộp phạt.
- `backup-and-launcher.spec.ts`: Kiểm thử sao lưu/khôi phục JSON chuẩn Zod (`VibeBackupSchema`, lọc khóa whitelist) và thuật toán gợi ý ngẫu nhiên `pickSurprisePage`.
- `co-tuong-engine.spec.ts`: Luật chiếu bí, hết nước đi (stalemate), lặp nước, **6 thế cờ tàn cuộc**, xuất biên bản, Tượng/Pháo/Tốt/Sĩ, ghim Tướng đối mặt, Minimax AI và lưu thống kê Pinia.
- `ngare-engine.spec.ts` & `ngare-store.spec.ts`: Phá sản, kiệt sức, nghỉ hưu, kết thúc tức thời, bảng tổng kết hành trình (Life Recap), chọn nhanh phím `1–4`, shop vật phẩm/kỹ năng có cooldown và khôi phục save cũ từ `localStorage`.
- `oracle-tarot-engine.spec.ts`, `oop-flashcards-engine.spec.ts`, `hom-nay-an-gi-engine.spec.ts`: Bộ 18 lá Oracle + trải bài 3 lá + chép lời giải + lịch sử 10 lần bói; 27 thẻ OOP/SOLID/Design Patterns + Quiz trắc nghiệm + nhóm tiến độ; bộ lọc buổi ăn/giá + thực đơn gợi ý cả ngày (4 bữa) + easing roulette.
- `mini-piano-engine.spec.ts`, `neon-typing-engine.spec.ts`, `color-game-engine.spec.ts`: Đa âm Polyphony + Sustain + lưu 5 bản thu Pinia, 5 bộ từ gõ phím (gồm Tiếng Việt có dấu) + biểu đồ 10 ván WPM, thống kê độ chính xác theo hệ màu RGB/HEX/HSL + phím tắt `1–9`.
- `generate-pages.spec.ts` & `home.spec.ts`: Đối chiếu 100% `public/data/pages.json` với `src/views/*/meta.ts` qua `PageMetaSchema`, Accessibility (`aria-label` trên `AppSidebar`), sao lưu SettingsModal cùng Launcher & 4 chủ đề màu.
- **Yêu cầu**: Trước khi sửa `engine.ts` hoặc dữ liệu trong `data/`, AI hoặc Developer **BẮT BUỘC** phải chạy `pnpm test` để kiểm tra độ tương thích.

---
- ⚡ **Tự động định tuyến (Auto-routing):** Sử dụng `import.meta.glob` kết hợp công cụ sinh tệp cấu hình tự động. Không cần cấu hình Router thủ công.
- ⚙️ **Settings & Multi-Theme Engine (4 Chủ đề màu):**
  - Chuyển đổi tức thì giữa **Deep Cosmos**, **Emerald Synth**, **Sunset Noir** và **Arctic Light** (giao diện sáng tương phản cao, tự động chuyển đổi bảng màu nhấn `accentLight` đạt chuẩn WCAG cho badge/viền thẻ) ngay từ Hero hoặc Modal cài đặt.
  - Hỗ trợ **Command Palette toàn cục (`Ctrl+K` / `⌘K`)**, **Xuất sao lưu / Khôi phục JSON** dữ liệu cá nhân (lưu trữ an toàn theo whitelist Pinia), đóng Modal bằng phím `Esc`, xác nhận 2 chạm nội tuyến khi xóa dữ liệu cá nhân, hiệu ứng **Constellation Particles** tối ưu, **Route Transition** mượt mà và tôn trọng `prefers-reduced-motion`.
- 🎮 **Launcher Storefront (Digital Curator v3.0):** 
  - 10 banner minh họa **SVG Vector Cover Art** riêng cho từng ứng dụng, hiệu ứng **Cursor Spotlight** theo chuột, nút **🎲 Ngẫu nhiên (Surprise Me)** chọn nhanh app chưa ghé gần đây, chế độ xem **Lưới / Danh sách**, sắp xếp **Nổi bật / A–Z / Gần đây** và thẻ **Tiếp tục trải nghiệm**.
  - Khu vực **Tâm điểm nổi bật (Featured Spotlight)**, thẻ chỉ số nhanh (Telemetry KPI), thanh điều hướng riêng cho Mobile và `AppSidebar` có đầy đủ `aria-label` ngay cả khi thu gọn.
  - Tìm kiếm tức thì (phím tắt `/` hoặc `Ctrl+K`) và dải **Category Filter Pills** trực quan đếm số lượng từng danh mục.
  - Ghim "Yêu thích" (Favorites) và lịch sử "Hoạt động gần đây" được lưu trữ an toàn bằng **Pinia Persistedstate**.
- 🛠️ **Scaffolding Tool:** 1 câu lệnh CLI `pnpm create:page` sinh ra bộ khung tạo sẵn (`index.vue`, `meta.ts`, `README.md` logic).

---

## 🛠️ Công Nghệ Sử Dùng (Tech Stack)

Dự án được xây dựng với những công nghệ FE hiện đại nhất:
- **Core:** [Vue 3](https://vuejs.org/) (Composition API) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/) siêu tốc độ
- **State Management:** [Pinia](https://pinia.vuejs.org/) + [Persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/)
- **Validation:** [Zod](https://zod.dev/) (Schema validation cho Metadata)
- **Mã nguồn tiện ích:** [VueUse](https://vueuse.org/)
- **UI & Styling:** Không sử dụng Component Library bên thứ 3, code thuần CSS tối ưu hoá hoặc kết hợp [Tailwind CSS](https://tailwindcss.com/)
- **Testing:** [Vitest](https://vitest.dev/) + Vue Test Utils

---

## 📂 Các Mini-App Hiện Có 

1. **🏠 Home (Bộ định tuyến chính)**: 
   - Nơi hiển thị tất cả ứng dụng. Giao diện phi hành gia (Digital Curator) hiện đại với lưới thẻ ứng dụng, nút **🎲 Ngẫu nhiên**, lọc theo danh mục (`Trò chơi`, `Sáng tạo`, `Công cụ`, `Học tập`, `Tâm linh`) và sao lưu JSON.
2. **🕹️ Ngã Rẽ Cuộc Đời (`ngare`)**: 
   - Game nhập vai mô phỏng cuộc đời với hệ thống Chỉ số (Stats), Nghề nghiệp (Careers), Sự kiện hiện đại phong phú (AI & Tự động hóa, Remote Work, Marathon, Digital Detox, Góp vốn kinh doanh...), phím chọn nhanh `1–4`, **Bảng tổng kết hành trình (Life Recap)** khi kết thúc, Cửa hàng (Shop), và Kỹ năng (Skills).
3. **♟️ Cờ Tướng Master (`co-tuong`)** *(Native Vue 3)*:
   - Game Cờ Tướng (Xiangqi) chuẩn luật quốc tế với AI Minimax Alpha-Beta 3 cấp độ, **6 Cờ Thế tàn cuộc** (bổ sung *Thiết Môn Thoan* & *Mượn Tướng Sát*), **Đồng hồ bấm giờ** (5/10 phút), **Thanh đánh giá thế trận (Evaluation Bar)**, **chép biên bản ván đấu (`📋`)**, phím tắt `H`/`U`/`F`/`Esc`, nút Đầu hàng, chơi 2 người tại chỗ và lưu ván tự động bằng Pinia.
4. **🎴 OOP Flashcards (`oop-flashcards`)** *(Native Vue 3)*:
   - Ứng dụng ôn tập **27 câu hỏi** phỏng vấn OOP, SOLID & **Design Patterns** (*Factory Method, Strategy, Observer, Decorator, Builder, Liskov Substitution*) với thẻ lật 3D, syntax highlighting an toàn, phím tắt, **chế độ Quiz trắc nghiệm chấm điểm**, bộ lọc **Chưa thuộc (`🎯`)**, bảng tiến độ 3 nhóm kiến thức (`Nền tảng OOP`, `4 Trụ cột OOP`, `SOLID & Patterns`) và lưu tiến trình qua Pinia.
5. **🍜 Hôm Nay Ăn Gì (`hom-nay-an-gi`)** *(Native Vue 3)*:
   - Công cụ quay gợi ý món ăn Việt Nam mượt có giảm tốc theo nhịp kèm **âm thanh Web Audio** (có nút tắt/bật), lọc kết hợp theo **nhóm món · buổi ăn (Sáng/Trưa/Tối/Ăn vặt) · mức giá**, tính năng **📅 Gợi ý cả ngày** (4 bữa không trùng món), lưu món yêu thích, lịch sử gần đây bấm chọn lại và tự thêm thực đơn cá nhân qua Pinia.
6. **🌾 Nông Trại Anime 2.5D (`anime-farm`)** *(Static Embed)*:
   - Game mô phỏng nông trại Isometric 2.5D phong cách **Studio Ghibli & Gỗ cổ tích**: luống đất nổi 2.5D phủ texture đất khô/đất ướt/cỏ hoa dại vẽ tay, trọn bộ 8 sprite PNG tách nền gouache nét mực nâu ấm (`assets/crops/*.png`: `sprout`, `growing`, `eggplant`, `wheat`, `cucumber`, `pepper` là tranh AI vẽ tay tách nền + `carrot`, `corn` phong cách đồng bộ), HUD gỗ & modal giấy da kem, phím tắt `1–4` / `G` / `W` / `H` / `F` / `Esc`, tưới nước 1 chạm & vuốt hàng loạt, **Năng lượng Bón Phân (`⚡Bón`)**, **Thời tiết động**, nhà kho, đơn hàng thị trấn và giao diện **Mobile gọn gàng**.
7. **🎲 Cờ Tỷ Phú Sài Gòn (`saigon-tycoon`)** *(Static Embed)*:
   - Saigon Tycoon 40 ô phố Sài Gòn hoài cổ chuẩn luật quốc tế (đấu giá, thế chấp, giao dịch, xây nhà), Bot AI, Đài Radio Lo-Fi co giãn gọn trên Mobile, phím tắt `Space`/`R` tung xúc xắc, `B` mua, `P` qua lượt, `M` bật/tắt Radio, xác nhận phá sản 2 chạm & cảnh báo giao dịch nội tuyến không dùng native `confirm`/`alert`, tối ưu chữ ô bàn cờ & huy hiệu chủ sở hữu trên Desktop/Mobile.
8. **🔮 Bói Bài Oracle (`oracle-tarot`)**:
   - Trải bài 1 lá hôm nay hoặc 3 lá **Quá khứ · Hiện tại · Tương lai** từ **18 lá Oracle** với hiệu ứng lật 3D mượt (tôn trọng `prefers-reduced-motion`), hỗ trợ đặt câu hỏi tâm niệm, bật/tắt **Lá Ngược**, tổng hợp mạch trải bài 3 lá, nút **📋 Chép lời giải** chia sẻ nhanh và **nhật ký 10 lần bói** xem lại được lưu qua Pinia.
9. **⌨️ Neon Typing (`neon-typing`)**:
   - Thử thách gõ phím tốc độ cao với **5 bộ từ vựng (180+ từ, bao gồm Tiếng Việt có dấu)**, chế độ **Tính giờ (15s/30s/60s)** và **Sudden Death (3 mạng ❤️❤️❤️)**, **âm thanh bàn phím cơ Web Audio**, **biểu đồ cột WPM 10 ván gần nhất**, phím `Esc` đặt lại nhanh, xếp hạng `S+` đến `C` và lưu kỷ lục qua Pinia.
10. **🎹 Mini Piano (`mini-piano`)**: 
    - Đàn Synthesizer Piano 13 phím hỗ trợ **đa âm Polyphony**, nút **Sustain ngân vang (`1.85s`)**, **chuyển 3 quãng tám (`C3`/`C4`/`C5`)**, 4 âm sắc nhạc cụ, chế độ **Thử thách Giai điệu chấm điểm theo từng bài** trên **5 bản nhạc** (có gợi ý phím đen) và **Thư viện lưu tối đa 5 bản thu Pinia**.
11. **🎨 Color Game (`color-game`)**: 
    - Trò chơi phản xạ thị giác nhận diện mã màu **RGB, HEX & HSL** (kèm thanh phân tích H/S/L và **thống kê độ chính xác riêng từng hệ màu**), chế độ **Tự do** và **Time Attack 45s (+2s/-3s, Combo x1–x3)**, phím tắt `1–9` (chọn ô), `H` (50:50), `R` (ván mới), nút **📋 Copy mã màu**, âm thanh cộng hưởng Web Audio và lưu kỷ lục qua Pinia.

*(Các mini-app nằm tại thư mục `src/views/` và các app nhúng tĩnh nằm tại `public/apps/`)*

---

## 🚀 Hướng Dẫn Cài Đặt (Getting Started)

### Yêu cầu hệ thống
- **Node.js**: >= 18.0.0
- **Package Manager**: Khuyến cáo sử dụng [pnpm](https://pnpm.io/) 

### Chạy Dự Án

```bash
# 1. Cài đặt các gói phụ thuộc
pnpm install

# 2. Khởi tạo JSON File cấu hình cho các trang từ Meta.ts
pnpm generate:pages

# 3. Chạy Server Development
pnpm dev
```

### Các Lệnh Có Sẵn (Scripts)
- `pnpm dev`: Khởi chạy môi trường phát triển cục bộ (Local).
- `pnpm build`: Tự động gọi `generate:pages` và biên dịch hệ thống ra file tĩnh (`/dist`).
- `pnpm generate:pages`: Đọc thư mục `src/views/*/meta.ts` và quét thành một file JSON duy nhất để tối ưu load cho màn hình Home Launcher.
- `pnpm create:page <slug>`: Lệnh tắt tạo bộ khung app mới.
- `pnpm typecheck`: Kiểm tra tĩnh TypeScript trên toàn dự án.
- `pnpm lint`: Chạy ESLint rà soát lỗi (Cấm dùng `any`).
- `pnpm test`: Chạy toàn bộ Unit Test (Vitest).

---

## 🧪 Đảm Bảo Chất Lượng (Quality Control)

Dự án áp dụng quy trình kiểm soát chất lượng tự động:
1. **ESLint (Strict Mode):** Cấm sử dụng kiểu dữ liệu `any` để đảm bảo Type-safety tuyệt đối.
2. **Husky & lint-staged:** Tự động chạy `lint` và sửa lỗi mỗi khi thực hiện `git commit`. Nếu có lỗi, commit sẽ bị chặn.
3. **Unit Testing:** Toàn bộ logic lõi của Game Engine được kiểm thử bằng **Vitest** tại thư mục `tests/`.
4. **Build Sạch & Accessibility (A11y):** Bundle sản xuất `vite build` đạt **0 cảnh báo chunk**, hỗ trợ điều hướng bàn phím (`Ctrl+K`, `Tab`, `Enter`, `Escape`), ARIA listbox, khôi phục focus khi đóng modal, `:focus-visible` rõ nét và `prefers-reduced-motion` kèm cleanup đầy đủ listener/timer trong `onUnmounted`.

---

## 🏗️ Hướng Dẫn Kèm App Mới (Add New Mini-app)

Theo chuẩn (Convention), mọi mini-app **BẮT BUỘC** phải có cấu trúc như sau:
```text
src/views/<slug-app-cua-ban>/
├── index.vue
└── meta.ts
```

### Cách 1: Tự động (Khuyên dùng)
Gõ lệnh sau vào Terminal, hệ thống tự sinh mã cho bạn:
```bash
pnpm create:page my-new-app
pnpm generate:pages
```

### Cách 2: Thủ công
1. Phải tạo đúng cấu trúc folder với tên rút gọn của App tại `src/views/ten-app`.
2. Tạo file `index.vue` chứa root code Vue của bạn.
3. Tạo file `meta.ts` như sau:
```ts
import type { PageMeta } from '@/types/page'

const meta: PageMeta = {
  name: 'Tên App Của Bạn',
  description: 'Mô tả ngắn gọn về tính năng',
  author: 'Bạn / Company',
  category: 'tool', // game, creative, app...
}

export default meta
```
4. Trở ra Terminal, chạy lệnh `pnpm generate:pages` để hệ thống Launcher quét thấy app mới.

---

## 🌳 Cấu Trúc Thư Mục Hệ Thống (Directory Layout)
```text
vibe-platform/
├── public/                 # Các tài nguyên static và JSON config chung
│   └── data/ 
│       └── pages.json      # File config do script generate tạo ra
├── scripts/                # Node Scripts (sinh file, tự động cấu hình...)
├── src/
│   ├── router/             # Vue Router Config (Quản lý tự động định tuyến)
│   ├── stores/             # Cấu hình store Pinia chia sẻ toàn mạng (Vd: danh sách Launcher)
│   ├── types/              # Các Shared Interfaces (TypeScript)
│   ├── views/              # Nơi đặt MỌI mini-apps!
│   │   ├── home/           # App hiển thị Launcher
│   │   ├── ngare/          # Mini game Ngã Rẽ Cuộc Đời
│   │   ├── mini-piano/     # Mini app Đàn Piano
│   │   └── color-game/     # Gane đoán màu
│   ├── App.vue             # Shell View rỗng, đóng vai Wrapper
│   └── main.ts             # Entry point
└── package.json
```

---

## 🎯 Lưu ý Phát Triển (Development Notes)
- **Ranh giới dữ liệu (Boundaries):** Không bao giờ `import` chéo logic hoặc UI Component giữa các mini-app với nhau (để đảm bảo tính Modular 100%). Nếu có hàm dùng chung, hãy vứt ra thư mục `src/utils/`.
- **Hệ thống Metadata:** Phải tuân thủ `PageMetaSchema` trong `src/types/page.ts`.
- **Media & Tài nguyên nặng:** Để trong thư mục `public/<slug-app>/...` riêng của từng app.

---

## 🤖 AI Technical Notes (For AI Assistants)
Dự án có tệp [OVERVIEW.md](./OVERVIEW.md) mô tả chuyên sâu về kiến trúc và các "bí kíp" làm việc dành cho AI Agent. Hãy yêu cầu AI đọc tệp này trước khi thực hiện các thay đổi lớn.

*Được thiết kế hướng tới tốc độ, sự linh hoạt và mở rộng tối đa theo kiến trúc MVP (Minimum Viable Product).*
