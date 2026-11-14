import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { DocRow } from '../../db/docs'
import { BROWSE_MAX } from '../../lib/constants'
import { resolveBrowsePath, type BrowseTarget } from '../../lib/browse-paths'
type McpToolContext = { db: D1Database; owner: string }

export type BrowseDirItem = { type: 'dir'; path: string; name: string }

export type BrowseDocItem = {
  type: 'doc'
  id: string
  title: string
  description: string
  kind: string
  tags: string[]
  updated_at: string
}

export type BrowseItem = BrowseDirItem | BrowseDocItem

type DocListRow = Pick<DocRow, 'id' | 'title' | 'description' | 'kind' | 'tags_json' | 'updated_at'>

function docToItem(row: DocListRow): BrowseDocItem {
  return {
    type: 'doc',
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind,
    tags: JSON.parse(row.tags_json) as string[],
    updated_at: row.updated_at,
  }
}

const ROOT_DIRS: BrowseDirItem[] = [
  { type: 'dir', path: '/recent/', name: 'recent' },
  { type: 'dir', path: '/kind/', name: 'kind' },
  { type: 'dir', path: '/tags/', name: 'tags' },
]

export async function listRecent(
  db: D1Database,
  owner: string,
  limit: number,
): Promise<BrowseDocItem[]> {
  const result = await db
    .prepare(
      `SELECT id, title, description, kind, tags_json, updated_at FROM docs
       WHERE owner = ? AND deleted_at IS NULL
       ORDER BY updated_at DESC
       LIMIT ?`,
    )
    .bind(owner, limit)
    .all<DocListRow>()
  return (result.results ?? []).map(docToItem)
}

export async function listByKind(
  db: D1Database,
  owner: string,
  kind: string,
  limit: number,
): Promise<BrowseDocItem[]> {
  const result = await db
    .prepare(
      `SELECT id, title, description, kind, tags_json, updated_at FROM docs
       WHERE owner = ? AND deleted_at IS NULL AND kind = ?
       ORDER BY updated_at DESC
       LIMIT ?`,
    )
    .bind(owner, kind, limit)
    .all<DocListRow>()
  return (result.results ?? []).map(docToItem)
}

export async function listByTag(
  db: D1Database,
  owner: string,
  tag: string,
  limit: number,
): Promise<BrowseDocItem[]> {
  const result = await db
    .prepare(
      `SELECT d.id, d.title, d.description, d.kind, d.tags_json, d.updated_at
       FROM doc_tags t
       JOIN docs d ON d.id = t.doc_id
       WHERE t.owner = ? AND t.tag = ? AND d.deleted_at IS NULL
       ORDER BY d.updated_at DESC
       LIMIT ?`,
    )
    .bind(owner, tag, limit)
    .all<DocListRow>()
  return (result.results ?? []).map(docToItem)
}

async function listKindDirs(
  db: D1Database,
  owner: string,
  limit: number,
): Promise<BrowseDirItem[]> {
  const result = await db
    .prepare(
      `SELECT DISTINCT kind FROM docs
       WHERE owner = ? AND deleted_at IS NULL
       ORDER BY kind
       LIMIT ?`,
    )
    .bind(owner, limit)
    .all<{ kind: string }>()
  return (result.results ?? []).map((r) => ({
    type: 'dir' as const,
    path: `/kind/${encodeURIComponent(r.kind)}/`,
    name: r.kind,
  }))
}

async function listTagDirs(db: D1Database, owner: string, limit: number): Promise<BrowseDirItem[]> {
  const result = await db
    .prepare(
      `SELECT DISTINCT tag FROM doc_tags
       WHERE owner = ?
       ORDER BY tag
       LIMIT ?`,
    )
    .bind(owner, limit)
    .all<{ tag: string }>()
  return (result.results ?? []).map((r) => ({
    type: 'dir' as const,
    path: `/tags/${encodeURIComponent(r.tag)}/`,
    name: r.tag,
  }))
}

export async function listForBrowse(
  db: D1Database,
  owner: string,
  target: BrowseTarget,
  limit: number = BROWSE_MAX,
): Promise<BrowseItem[]> {
  switch (target.kind) {
    case 'root':
      return ROOT_DIRS
    case 'recent':
      return listRecent(db, owner, limit)
    case 'kinds':
      return listKindDirs(db, owner, limit)
    case 'kind':
      return listByKind(db, owner, target.value, limit)
    case 'tags':
      return listTagDirs(db, owner, limit)
    case 'tag':
      return listByTag(db, owner, target.value, limit)
  }
}

function textJson(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  }
}

export function registerBrowseTool(server: McpServer, ctx: McpToolContext): void {
  server.registerTool(
    'browse',
    {
      description: 'Virtual folders under /, /recent/, /kind/, /tags/',
      inputSchema: {
        path: z.string().describe('Virtual browse path, e.g. / or /tags/design/'),
      },
    },
    async ({ path }) => {
      const target = resolveBrowsePath(path)
      const rows = await listForBrowse(ctx.db, ctx.owner, target, BROWSE_MAX)
      return textJson({ path, items: rows })
    },
  )
}