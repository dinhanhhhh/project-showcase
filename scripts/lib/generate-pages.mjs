import { promises as fs } from 'node:fs'
import path from 'node:path'

export function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function validateMeta(meta) {
  if (!meta || typeof meta !== 'object') return false

  const required = ['name', 'description', 'category']
  for (const key of required) {
    if (typeof meta[key] !== 'string' || meta[key].trim().length === 0) {
      return false
    }
  }

  if ('author' in meta && typeof meta.author !== 'string') {
    return false
  }

  return true
}

function parseMetaFromTs(source) {
  // Loại bỏ các dòng import/export type để tránh làm rối Regex
  const stripped = source
    .replace(/^import.*$/gm, '')
    .trim()

  // Tìm biến meta theo cấu trúc: const meta: PageMeta = { ... }
  const metaMatch = stripped.match(/const\s+meta\s*(?::\s*[\w\s<>|]+)?\s*=\s*({[\s\S]*?})(?=;|\n|export)/)
  if (metaMatch) {
    try {
      // Dùng hàm Function để eval an toàn chuỗi JSON-like object
      return new Function(`return ${metaMatch[1]}`)()
    } catch (e) {
      console.error('Lỗi khi parse meta object:', e)
    }
  }

  // Dự phòng cho trường hợp export default trực tiếp
  const defaultExportMatch = stripped.match(/export\s+default\s+({[\s\S]*?})(?=;|\n|$)/)
  if (defaultExportMatch) {
    try {
      return new Function(`return ${defaultExportMatch[1]}`)()
    } catch (e) {
       console.error('Lỗi khi parse default export:', e)
    }
  }

  return null
}

async function loadMeta(metaPath) {
  const source = await fs.readFile(metaPath, 'utf8')
  return parseMetaFromTs(source)
}

export async function collectPagesRegistry(viewsDir) {
  const entries = await fs.readdir(viewsDir, { withFileTypes: true })
  const pages = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const slug = entry.name
    if (slug === 'home' || !isValidSlug(slug)) continue

    const basePath = path.join(viewsDir, slug)
    const metaPath = path.join(basePath, 'meta.ts')
    const indexPath = path.join(basePath, 'index.vue')

    try {
      await fs.access(metaPath)
      await fs.access(indexPath)
    } catch {
      continue
    }

    try {
      const meta = await loadMeta(metaPath)
      if (!validateMeta(meta)) continue

      pages.push({
        slug,
        path: `/${slug}`,
        name: meta.name.trim(),
        description: meta.description.trim(),
        category: meta.category.trim(),
        ...(typeof meta.author === 'string' && meta.author.trim().length > 0
          ? { author: meta.author.trim() }
          : {}),
      })
    } catch {
      continue
    }
  }

  pages.sort((a, b) => a.name.localeCompare(b.name))
  return pages
}

export async function writeRegistryFile(outputPath, pages) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, `${JSON.stringify(pages, null, 2)}\n`, 'utf8')
}
