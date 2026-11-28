/**
 * Tạo khóa ngày chuẩn YYYY-MM-DD theo múi giờ cục bộ để đồng bộ thử thách hằng ngày.
 */
export function getDailyDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Lấy ngày liền trước của một dateKey (YYYY-MM-DD).
 */
export function getPreviousDateKey(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return ''
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const dt = new Date(year, month - 1, day)
  dt.setDate(dt.getDate() - 1)
  return getDailyDateKey(dt)
}

/**
 * Băm chuỗi thành số nguyên 32-bit không dấu (deterministic).
 */
export function hashSeed(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Bộ sinh số giả ngẫu nhiên Mulberry32 cố định theo seed.
 */
export function createDailyRng(seed: string | number): () => number {
  let state = (typeof seed === 'number' ? Math.floor(seed) : hashSeed(seed)) >>> 0
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Chọn k phần tử không trùng lặp từ danh sách dựa trên seed cố định.
 */
export function pickSeededItems<T>(
  items: readonly T[],
  count: number,
  seed: string | number,
): T[] {
  if (count <= 0 || items.length === 0) return []
  const rng = createDailyRng(seed)
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }
  return pool.slice(0, Math.min(count, pool.length))
}

/**
 * Cập nhật kỷ lục theo ngày (chỉ giữ điểm cao hơn) và giới hạn tối đa maxEntries ngày gần nhất.
 */
export function upsertDailyBest(
  currentMap: Record<string, number> | undefined | null,
  dateKey: string,
  score: number,
  maxEntries = 14,
): Record<string, number> {
  const safeMap: Record<string, number> = {}
  if (currentMap && typeof currentMap === 'object' && !Array.isArray(currentMap)) {
    for (const [k, v] of Object.entries(currentMap)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        safeMap[k] = v
      }
    }
  }
  const prev = safeMap[dateKey] ?? 0
  if (Number.isFinite(score) && score >= 0 && score > prev) {
    safeMap[dateKey] = score
  }
  const cap = Math.max(1, Math.floor(maxEntries))
  const dates = Object.keys(safeMap).sort()
  while (dates.length > cap) {
    const oldest = dates.shift()
    if (oldest) delete safeMap[oldest]
  }
  return safeMap
}
