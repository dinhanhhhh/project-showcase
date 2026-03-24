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

const metaContent = `import type { PageMeta } from '@/types/page'\n\nconst meta: PageMeta = {\n  name: '${title}',\n  description: 'Mô tả ngắn gọn về app',\n  author: 'Vibe Team',\n  category: 'tool',\n}\n\nexport default meta\n`

const pageContent = `<template>\n  <main class="vibe-container">\n    <h1>${title}</h1>\n    <p>Mini-app mới được khởi tạo tự động.</p>\n    <RouterLink to="/">Về Launcher</RouterLink>\n  </main>\n</template>\n`

const readmeContent = `# 🚀 ${title} Mini-App\n\n## 🎯 Mục tiêu & Nhiệm vụ\n- [ ] Ghi lại mục tiêu chính của app này.\n- [ ] Liệt kê các tính năng cần phát triển.\n\n## 💡 Ghi chú Logic\n- AI hãy đọc file này trước khi bắt đầu code tính năng cho ${slug}.\n`

await fs.writeFile(path.join(targetDir, 'meta.ts'), metaContent, 'utf8')
await fs.writeFile(path.join(targetDir, 'index.vue'), pageContent, 'utf8')
await fs.writeFile(path.join(targetDir, 'README.md'), readmeContent, 'utf8')

console.log(`✅ Đã tạo Mini-App: src/views/${slug}`)
console.log(`📝 Đừng quên cập nhật mục tiêu trong: src/views/${slug}/README.md`)
