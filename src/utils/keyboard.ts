/**
 * Returns true when a keyboard event originates inside an editable field
 * so single-key app shortcuts do not hijack typing or form controls.
 */
export function isEditableEventTarget(target: EventTarget | null): boolean {
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true
  }
  if (!(target instanceof HTMLElement)) return false
  const ceAttr = target.getAttribute('contenteditable')
  return target.isContentEditable || ceAttr === 'true' || ceAttr === ''
}

/**
 * Returns true if any accessible dialog overlay is currently mounted.
 */
export function hasOpenDialog(): boolean {
  return typeof document !== 'undefined' && document.querySelector('[role="dialog"]') !== null
}
