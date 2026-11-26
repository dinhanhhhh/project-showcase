# 🍜 Hôm Nay Ăn Gì (`hom-nay-an-gi`)

Ứng dụng gợi ý món ăn Việt Nam được port sang **Vue 3 + TypeScript + Pinia** từ dự án `Hoc Nextjs/hom-nay-an-gi`.

## Tính năng
- 20 món ăn Việt Nam phân nhóm (`Món nước`, `Món khô`, `Ăn vặt`), có ảnh + emoji fallback khi lỗi tải ảnh.
- Hiệu ứng quay món ngẫu nhiên tránh trùng liên tiếp, lưu lịch sử 10 lần quay gần nhất.
- Thêm món ăn cá nhân, đánh dấu yêu thích, tự động lưu bằng Pinia Persistedstate (`vibe_hom_nay_an_gi`).
