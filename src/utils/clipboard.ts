function fallbackCopyWithTextarea(text: string): boolean {
  if (typeof document === 'undefined') return false
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/**
 * Sao chép chuỗi văn bản với Clipboard API, tự động chuyển về fallback textarea
 * nếu môi trường webview/headless chặn hoặc treo Promise quá timeoutMs.
 */
export async function copyTextWithFallback(
  text: string,
  timeoutMs = 350,
): Promise<boolean> {
  if (!text) return false

  let timerId: ReturnType<typeof setTimeout> | null = null
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      let didComplete = false
      const copied = await Promise.race([
        navigator.clipboard.writeText(text).then(() => {
          didComplete = true
          return true
        }),
        new Promise<boolean>((resolve) => {
          timerId = setTimeout(() => resolve(false), timeoutMs)
        }),
      ])
      if (copied && didComplete) return true
      return fallbackCopyWithTextarea(text)
    }
    return fallbackCopyWithTextarea(text)
  } catch {
    return fallbackCopyWithTextarea(text)
  } finally {
    if (timerId !== null) {
      clearTimeout(timerId)
    }
  }
}
