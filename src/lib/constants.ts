export const BODY_MAX_BYTES = 200 * 1024
export const MAX_TAGS = 32
export const MAX_LINKS = 128
export const GRAPH_MAX_NODES = 2000
export const SEARCH_MAX_TERMS = 8
export const BROWSE_MAX = 100

const LINK_RE = /\]\(\/d\/([0-9A-HJKMNP-TV-Z]{26})\)/gi

export function extractInternalLinks(markdown: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(LINK_RE)
  while ((m = re.exec(markdown)) !== null) {
    const id = m[1].toUpperCase()
    if (!seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
    if (out.length >= MAX_LINKS) break
  }
  return out
}