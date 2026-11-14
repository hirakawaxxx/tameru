export type ScrollMetrics = {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

export function isScrolledToBottom(el: ScrollMetrics, threshold = 2): boolean {
  return el.scrollHeight - el.clientHeight - el.scrollTop <= threshold
}

/** Enable accept when content fits or user scrolled to the end. */
export function canEnableDisclaimerAccept(el: ScrollMetrics, threshold = 2): boolean {
  if (el.scrollHeight <= el.clientHeight + threshold) return true
  return isScrolledToBottom(el, threshold)
}