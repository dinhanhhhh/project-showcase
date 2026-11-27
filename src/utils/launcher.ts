import type { PageEntry } from '@/types/page'

/**
 * Chọn ngẫu nhiên một mini-app khác với app vừa mở gần nhất (nếu danh sách >= 2 app).
 */
export function pickSurprisePage(
  pages: readonly PageEntry[],
  lastVisitedSlug: string | null,
  rng: () => number = Math.random,
): PageEntry | null {
  if (pages.length === 0) return null
  if (pages.length === 1) return pages[0] ?? null

  const pool =
    lastVisitedSlug && pages.some((p) => p.slug === lastVisitedSlug)
      ? pages.filter((p) => p.slug !== lastVisitedSlug)
      : pages

  const idx = Math.floor(rng() * pool.length)
  return pool[idx] ?? pool[0] ?? null
}
