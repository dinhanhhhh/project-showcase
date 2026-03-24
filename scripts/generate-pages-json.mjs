import path from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { collectPagesRegistry, writeRegistryFile } from './lib/generate-pages.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const viewsDir = path.join(root, 'src/views')
const outputPath = path.join(root, 'public/data/pages.json')

const pages = await collectPagesRegistry(viewsDir)
await writeRegistryFile(outputPath, pages)

const overviewPath = path.join(root, 'OVERVIEW.md')
await updateOverviewFile(overviewPath, pages)

console.log(`Generated ${pages.length} pages at ${path.relative(root, outputPath)}`)
console.log(`Updated OVERVIEW.md with current app list.`)

async function updateOverviewFile(filePath, pages) {
  try {
    let content = await fs.readFile(filePath, 'utf8')
    const startMarker = '## 📦 Danh sách Mini-Apps (Tự động cập nhật)'
    const endMarker = '---'
    
    let listContent = `${startMarker}\n`
    pages.forEach(p => {
      listContent += `- **${p.name}** (\`${p.slug}\`): ${p.description}\n`
    })

    const regex = new RegExp(`${startMarker}[\\s\\S]*?(?=${endMarker}|$)`)
    if (content.includes(startMarker)) {
      content = content.replace(regex, listContent + '\n')
    } else {
      content += `\n\n${listContent}\n${endMarker}`
    }

    await fs.writeFile(filePath, content, 'utf8')
  } catch (err) {
    console.warn('Could not update OVERVIEW.md:', err.message)
  }
}
