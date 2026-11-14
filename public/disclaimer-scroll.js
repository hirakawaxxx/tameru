/** Keep in sync with src/lib/disclaimer-scroll.ts */

/** @param {{ scrollTop: number, scrollHeight: number, clientHeight: number }} el */
export function isScrolledToBottom(el, threshold = 2) {
  return el.scrollHeight - el.clientHeight - el.scrollTop <= threshold
}

/** @param {{ scrollTop: number, scrollHeight: number, clientHeight: number }} el */
export function canEnableDisclaimerAccept(el, threshold = 2) {
  if (el.scrollHeight <= el.clientHeight + threshold) return true
  return isScrolledToBottom(el, threshold)
}