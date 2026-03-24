import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

function titleFromSlug(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const slug = process.argv[2]

if (!slug || !isValidSlug(slug)) {
  console.error('Usage: pnpm create:page <kebab-case-slug>')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const targetDir = path.join(root, 'src/views', slug)

try {
  await fs.access(targetDir)
  console.error(`Page already exists: src/views/${slug}`)
  process.exit(1)
} catch {
  // expected when directory does not exist
}

await fs.mkdir(targetDir, { recursive: true })

const title = titleFromSlug(slug)

const metaContent = `import type { PageMeta } from '@/types/page'\n\nconst meta: PageMeta = {\n  name: '${title}',\n  description: 'Mo ta app',\n  author: 'Vibe Team',\n  category: 'tool',\n}\n\nexport default meta\n`

const pageContent = `<template>\n  <main class="mx-auto max-w-3xl p-6">\n    <h1 class="mb-2 text-2xl font-bold">${title}</h1>\n    <p class="mb-4 text-sm text-gray-600">Mini-app moi duoc scaffold tu create:page.</p>\n    <RouterLink class="text-blue-600" to="/">Ve launcher</RouterLink>\n  </main>\n</template>\n`

await fs.writeFile(path.join(targetDir, 'meta.ts'), metaContent, 'utf8')
await fs.writeFile(path.join(targetDir, 'index.vue'), pageContent, 'utf8')

console.log(`Created page: src/views/${slug}`)
