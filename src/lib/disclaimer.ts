export const DISCLAIMER_ITEMS = [
  '個人開発であり、予告なく終了・データ消去がありうる',
  '目安として GitHub の Star を歓迎（任意）',
  '機密性・完全性・可用性を保証しない。機微情報を置かない',
  'バックアップ・復旧・SLA なし',
  '違法コンテンツ・他者権利侵害の禁止',
] as const

/** Scrollable disclaimer body in gate modal and /disclaimer page (wired in viewer.js). */
export const DISCLAIMER_SCROLL_BODY_ID = 'disclaimer-scroll-body'

export const DISCLAIMER_SCROLL_BODY_CLASS = 'viewer-disclaimer-scroll'

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function renderDisclaimerListHtml(): string {
  return DISCLAIMER_ITEMS.map((t) => `<li>${escapeHtml(t)}</li>`).join('\n    ')
}

export function renderDisclaimerScrollRegion(modifier?: 'gate'): string {
  const modClass = modifier === 'gate' ? ' viewer-disclaimer-scroll--gate' : ''
  return `<div id="${DISCLAIMER_SCROLL_BODY_ID}" class="${DISCLAIMER_SCROLL_BODY_CLASS}${modClass}" tabindex="0">
    <ol class="ui-text-body">
    ${renderDisclaimerListHtml()}
    </ol>
  </div>`
}