import { beforeEach, vi } from 'vitest'

if (typeof HTMLCanvasElement !== 'undefined') {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
}

beforeEach(() => {
  localStorage.clear()
})
