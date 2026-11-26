import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { collectPagesRegistry, writeRegistryFile } from '../scripts/lib/generate-pages.mjs'

describe('generate pages registry', () => {
  it('collects valid apps, ignores invalid ones, and writes sorted json', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'vibe-registry-'))
    const viewsDir = path.join(root, 'src/views')
    await mkdir(path.join(viewsDir, 'alpha-tool'), { recursive: true })
    await mkdir(path.join(viewsDir, 'broken-app'), { recursive: true })
    await mkdir(path.join(viewsDir, 'zeta-game'), { recursive: true })

    await writeFile(
      path.join(viewsDir, 'alpha-tool', 'meta.ts'),
      "export default { name: 'Alpha Tool', description: 'A', category: 'tool' }\n",
      'utf8',
    )
    await writeFile(path.join(viewsDir, 'alpha-tool', 'index.vue'), '<template />\n', 'utf8')

    await writeFile(
      path.join(viewsDir, 'broken-app', 'meta.ts'),
      "export default { name: '', description: 'B', category: 'tool' }\n",
      'utf8',
    )
    await writeFile(path.join(viewsDir, 'broken-app', 'index.vue'), '<template />\n', 'utf8')

    await writeFile(
      path.join(viewsDir, 'zeta-game', 'meta.ts'),
      "export default { name: 'Zeta Game', description: 'Z', category: 'game' }\n",
      'utf8',
    )
    await writeFile(path.join(viewsDir, 'zeta-game', 'index.vue'), '<template />\n', 'utf8')

    const pages = await collectPagesRegistry(viewsDir)
    expect(pages.map((entry) => entry.slug)).toEqual(['alpha-tool', 'zeta-game'])

    const outputPath = path.join(root, 'public/data/pages.json')
    await writeRegistryFile(outputPath, pages)

    const written = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(written).toEqual(pages)
  })

  it('parses meta.ts files saved with Windows CRLF line endings', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'vibe-registry-crlf-'))
    const viewsDir = path.join(root, 'src/views')
    await mkdir(path.join(viewsDir, 'crlf-game'), { recursive: true })

    const crlfMeta = [
      "import type { PageMeta } from '@/types/page'",
      '',
      'const meta: PageMeta = {',
      "  name: 'CRLF Game',",
      "  description: 'Game saved with Windows CRLF',",
      "  category: 'game',",
      '}',
      '',
      'export default meta',
    ].join('\r\n')

    await writeFile(path.join(viewsDir, 'crlf-game', 'meta.ts'), crlfMeta, 'utf8')
    await writeFile(path.join(viewsDir, 'crlf-game', 'index.vue'), '<template />\n', 'utf8')

    const pages = await collectPagesRegistry(viewsDir)
    expect(pages).toHaveLength(1)
    expect(pages[0].slug).toBe('crlf-game')
    expect(pages[0].name).toBe('CRLF Game')
  })
})
