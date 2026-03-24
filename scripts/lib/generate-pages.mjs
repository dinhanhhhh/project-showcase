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
  const stripped = source
    .replace(/^\s*import\s+type\s+.*$/gm, '')
    .replace(/^\s*import\s+.*$/gm, '')
    .trim()

  const inlineDefaultMatch = stripped.match(/export\s+default\s+({[\s\S]*?})\s*;?\s*$/)
  if (inlineDefaultMatch) {
    try {
      return Function(`"use strict"; return (${inlineDefaultMatch[1]});`)()
    } catch {
      return null
    }
  }

  const namedMetaMatch = stripped.match(/const\s+meta(?:\s*:\s*[^=]+)?\s*=\s*({[\s\S]*?})\s*;?/)
  const hasExportMeta = /export\s+default\s+meta\s*;?/.test(stripped)

  if (!namedMetaMatch || !hasExportMeta) {
    return null
  }

  try {
    return Function(`"use strict"; return (${namedMetaMatch[1]});`)()
  } catch {
    return null
  }
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
