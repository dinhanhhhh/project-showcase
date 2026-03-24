import type { RouteRecordRaw } from 'vue-router'

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function buildAppRoutes(
  modules: Record<string, () => Promise<unknown>>,
): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  for (const [filePath, loader] of Object.entries(modules)) {
    const match = filePath.match(/\.\.\/views\/([^/]+)\/index\.vue$/)
    if (!match) continue

    const slug = match[1]
    if (slug === 'home' || !isValidSlug(slug)) continue

    routes.push({
      path: `/${slug}`,
      name: slug,
      component: loader as RouteRecordRaw['component'],
      meta: { slug },
    })
  }

  routes.sort((a, b) => String(a.path).localeCompare(String(b.path)))
  return routes
}
