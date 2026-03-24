import type { PageEntry } from '@/types/page'

export async function loadPagesRegistry(): Promise<PageEntry[]> {
  const response = await fetch('/data/pages.json')

  if (!response.ok) {
    throw new Error(`Không thể tải danh sách ứng dụng: HTTP ${response.status}`)
  }

  const payload = await response.json()

  if (!Array.isArray(payload)) {
    throw new Error('Định dạng dữ liệu không hợp lệ: mong đợi một mảng')
  }

  return payload as PageEntry[]
}
