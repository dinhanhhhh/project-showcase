interface ExtendedAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

export interface SafeAudioManager {
  ensureContext: () => AudioContext | null
  closeContext: () => void
}

/**
 * Shared Web Audio lifecycle helper that safely instantiates, resumes, and
 * closes AudioContext without throwing when audio hardware or permissions are restricted.
 */
export function createSafeAudioManager(): SafeAudioManager {
  let ctx: AudioContext | null = null

  function ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    try {
      if (!ctx) {
        const AudioCtor =
          window.AudioContext || (window as unknown as ExtendedAudioWindow).webkitAudioContext
        if (!AudioCtor) return null
        ctx = new AudioCtor()
      }
      if (ctx.state === 'suspended') {
        void Promise.resolve(ctx.resume()).catch(() => {})
      }
      return ctx
    } catch {
      ctx = null
      return null
    }
  }

  function closeContext() {
    if (!ctx) return
    const target = ctx
    ctx = null
    try {
      void Promise.resolve(target.close()).catch(() => {})
    } catch {
      // Ignore audio teardown errors on unmount
    }
  }

  return {
    ensureContext,
    closeContext,
  }
}
