import { z } from 'zod'

export const ALLOWED_STORAGE_PREFIXES = [
  'vibe:',
  'vibe_',
  'ngare_',
  'saigon_tycoon_',
  'anime_farm_',
] as const

export function isAllowedBackupKey(key: string): boolean {
  return ALLOWED_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))
}

export const VibeBackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().min(1),
  entries: z.record(z.string(), z.string()),
})

export type VibeBackupPayload = z.infer<typeof VibeBackupSchema>

export function buildBackupPayload(storage: Storage): VibeBackupPayload {
  const entries: Record<string, string> = {}
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key || !isAllowedBackupKey(key)) continue
    const val = storage.getItem(key)
    if (typeof val === 'string') {
      entries[key] = val
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  }
}

export function parseAndValidateBackup(
  rawJson: string,
): { ok: true; data: VibeBackupPayload } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawJson)
  } catch {
    return { ok: false, error: 'Tệp không phải định dạng JSON hợp lệ.' }
  }

  const check = VibeBackupSchema.safeParse(parsed)
  if (!check.success) {
    return { ok: false, error: 'Cấu trúc sao lưu không khớp chuẩn Vibe Platform v1.' }
  }

  const filteredEntries: Record<string, string> = {}
  for (const [k, v] of Object.entries(check.data.entries)) {
    if (isAllowedBackupKey(k)) {
      filteredEntries[k] = v
    }
  }

  return {
    ok: true,
    data: {
      ...check.data,
      entries: filteredEntries,
    },
  }
}

export function restoreBackupPayload(storage: Storage, payload: VibeBackupPayload): number {
  let restored = 0
  for (const [key, value] of Object.entries(payload.entries)) {
    if (!isAllowedBackupKey(key)) continue
    storage.setItem(key, value)
    restored += 1
  }
  return restored
}
