import { marked } from 'marked'

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

marked.use({
  renderer: {
    html({ text }) {
      return escapeHtml(text)
    },
    link({ href, text, title }) {
      const safeHref =
        href?.startsWith('/d/') || href?.startsWith('/disclaimer') ? href : '#'
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
      return `<a href="${safeHref}"${titleAttr}>${escapeHtml(text ?? '')}</a>`
    },
  },
})

export function renderMarkdownToHtml(md: string): string {
  return marked.parse(md, { async: false, gfm: true }) as string
}