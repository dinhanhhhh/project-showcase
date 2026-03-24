import { describe, expect, it } from 'vitest'
import { buildAppRoutes } from '@/router/routes'

describe('buildAppRoutes', () => {
  it('maps valid view folders into routes and excludes home', () => {
    const routes = buildAppRoutes({
      '../views/home/index.vue': async () => ({}),
      '../views/mini-piano/index.vue': async () => ({}),
      '../views/color-game/index.vue': async () => ({}),
    })

    expect(routes.map((route) => route.path)).toEqual(['/color-game', '/mini-piano'])
  })

  it('skips invalid slugs', () => {
    const routes = buildAppRoutes({
      '../views/Invalid/index.vue': async () => ({}),
      '../views/ok-app/index.vue': async () => ({}),
      '../views/bad_slug/index.vue': async () => ({}),
    })

    expect(routes.map((route) => route.path)).toEqual(['/ok-app'])
  })
})
