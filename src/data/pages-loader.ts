import { z } from 'zod'
import { PageMetaSchema } from '@/types/page'
import type { PageEntry } from '@/types/page'

// Schema đầy đủ cho một PageEntry (bao gồm cả slug và path)
const PageEntrySchema = PageMetaSchema.extend({
  slug: z.string().min(1),
  path: z.string().min(1),
})

const PageRegistrySchema = z.array(PageEntrySchema)

export async function loadPagesRegistry(): Promise<PageEntry[]> {
  const response = await fetch('/data/pages.json')

  if (!response.ok) {
    throw new Error(`Không thể tải danh sách ứng dụng: HTTP ${response.status}`)
  }

  const payload: unknown = await response.json()

  // Zod parse để validate runtime, không phải ép kiểu mù
  const result = PageRegistrySchema.safeParse(payload)

  if (!result.success) {
    console.error('[pages-loader] Invalid data:', result.error.flatten())
    throw new Error('Dữ liệu pages.json không hợp lệ. Hãy chạy lại pnpm generate:pages.')
  }

  return result.data
}
