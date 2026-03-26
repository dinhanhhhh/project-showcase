import { z } from 'zod'
import { PageMetaSchema } from '@/types/page'
import type { PageEntry } from '@/types/page'

// Schema đầy đủ cho một PageEntry (bao gồm cả slug và path)
const PageEntrySchema = PageMetaSchema.extend({
  slug: z.string().min(1),
  path: z.string().min(1),
})

// 🧬 DYNAMIC DISCOVERY: Vite sẽ tự động tìm tất cả meta.ts trong các folder con của views.
// Khi bạn thêm thư mục mới, Vite sẽ kích hoạt Hot-Reload ngay lập tức.
const modules = import.meta.glob('../views/*/meta.ts', {
  eager: true,
  import: 'default',
})

export async function loadPagesRegistry(): Promise<PageEntry[]> {
  const pages: PageEntry[] = []

  for (const [path, meta] of Object.entries(modules)) {
    // Trích xuất slug từ đường dẫn (ví dụ: ../views/ngare/meta.ts -> ngare)
    const match = path.match(/\.\.\/views\/([^/]+)\/meta\.ts$/)
    if (!match) continue

    const slug = match[1]
    
    // Bỏ qua trang home nếu có meta riêng
    if (slug === 'home') continue

    try {
      const validMeta = PageMetaSchema.parse(meta)
      const pageEntry = PageEntrySchema.parse({
        ...validMeta,
        slug,
        path: `/${slug}`,
      })

      pages.push(pageEntry)
    } catch (err) {
      console.error(`[pages-loader] Lỗi metadata tại ${path}:`, err)
    }
  }

  // Sắp xếp theo tên hoặc theo logic của bạn
  pages.sort((a, b) => a.name.localeCompare(b.name))

  return pages
}

/**
 * LƯU Ý: Vẫn nên giữ lệnh `pnpm generate:pages` để:
 * 1. Cập nhật danh sách Mini-Apps trong OVERVIEW.md
 * 2. Chuẩn bị file tĩnh pages.json cho Production (Tối ưu hóa SEO/Speed)
 */
