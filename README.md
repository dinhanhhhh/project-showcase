# 🚀 Vibe Platform (Mini Apps Launcher)

**Vibe Platform** là một nền tảng web (Web Platform) được thiết kế theo kiến trúc "App Shell" để chứa và chạy nhiều mini-app hoàn toàn độc lập trong cùng một dự án duy nhất. 

Mỗi mini-app được tổ chức gọn gàng theo một thư mục (folder) riêng biệt, tự động đăng ký định tuyến (auto-routing) và hiển thị trực quan trên giao diện màn hình chính (Launcher) giống như hệ điều hành thu nhỏ.

---

## ✨ Tính Năng Nổi Bật

- 🧩 **Kiến trúc linh hoạt (Modular):** Mỗi mini-app hoạt động độc lập, có `meta.ts` riêng chứa thông tin hiển thị và được validate mạnh mẽ bằng **Zod**.
## 🧪 6. Unit Testing & Bảo vệ Logic
Logic lõi của Game Engine được bảo vệ nghiêm ngặt bởi bộ Unit Test tại `tests/ngare-engine.spec.ts`.
- **Mục tiêu**: Đảm bảo các tính năng (Thăng tiến, Phá sản, Hiệu ứng vật phẩm, Lưu game) hoạt động chính xác sau mỗi lần refactor.
- **Yêu cầu**: Trước khi sửa `engine.ts` hoặc dữ liệu trong `data/`, AI hoặc Developer **BẮT BUỘC** phải chạy `pnpm test` để kiểm tra độ tương thích.

---
*Trước khi sửa `engine.ts` hoặc `game-data.ts`, AI phải đối chiếu với các nguyên tắc này và đảm bảo 6/6 test cases đều Pass.*
- ⚡ **Tự động định tuyến (Auto-routing):** Sử dụng `import.meta.glob` kết hợp công cụ sinh tệp cấu hình tự động. Không cần cấu hình Router thủ công.
- ⚙️ **Settings & Customization:** Tích hợp Modal cài đặt để tùy chỉnh Tên người dùng, Vai trò và cấu hình hiệu năng hệ thống (Particles Background).
- 🎮 **Launcher tiện lợi:** 
  - Giao diện Dashboard đẹp mắt (Digital Curator style) quản lý toàn bộ hệ sinh thái.
  - Tìm kiếm và Lọc (Filter) ứng dụng theo danh mục (Category).
  - Ghim "Yêu thích" (Favorites) và lịch sử "Hoạt động gần đây" được lưu trữ an toàn bằng **Pinia Persistedstate**.
- 🛠️ **Scaffolding Tool:** 1 câu lệnh CLI `pnpm create:page` sinh ra bộ khung tạo sẵn (`index.vue`, `meta.ts`, `README.md` logic).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

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
   - Nơi hiển thị tất cả ứng dụng. Giao diện phi hành gia (Digital Curator) hiện đại với lưới thẻ ứng dụng.
2. **🕹️ Ngã Rẽ Cuộc Đời (`ngare`)**: 
   - Một game nhập vai mô phỏng giả lập cuộc đời với hệ thống Chỉ số (Stats), Nghề nghiệp (Careers), Sự kiện (Events random), Cửa hàng (Shop), và Hệ thống kỹ năng (Skills).
3. **🎹 Mini Piano (`mini-piano`)**: 
   - Đàn Piano ảo hoạt động trực tiếp trên trình duyệt web.
4. **🎨 Color Game (`color-game`)**: 
   - Trò chơi rèn luyện phản xạ màu sắc.

*(Các mini-app nằm tại thư mục `src/views/`)*

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
