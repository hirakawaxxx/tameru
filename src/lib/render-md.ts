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
    link({ href, text }) {
      const safeHref =
        href?.startsWith('/d/') || href?.startsWith('/disclaimer') ? href : '#'
      return `<a href="${safeHref}">${text}</a>`
    },
  },
})

export function renderMarkdownToHtml(md: string): string {
  return marked.parse(md, { async: false, gfm: true }) as string
}