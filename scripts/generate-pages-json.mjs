import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectPagesRegistry, writeRegistryFile } from './lib/generate-pages.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const viewsDir = path.join(root, 'src/views')
const outputPath = path.join(root, 'public/data/pages.json')

const pages = await collectPagesRegistry(viewsDir)
await writeRegistryFile(outputPath, pages)

console.log(`Generated ${pages.length} pages at ${path.relative(root, outputPath)}`)
