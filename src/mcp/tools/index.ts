import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  getDocForOwner,
  searchDocs,
  softDeleteDoc,
  upsertDoc,
  type DocRow,
} from '../../db/docs'
import { BROWSE_MAX } from '../../lib/constants'

export const MCP_TOOL_NAMES = [
  'upsert_doc',
  'browse',
  'search',
  'get_doc',
  'delete_doc',
] as const

export type McpToolContext = { db: D1Database; owner: string }

function textJson(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  }
}

function docSummary(row: DocRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind,
    tags: JSON.parse(row.tags_json) as string[],
    updated_at: row.updated_at,
  }
}

async function listBacklinks(db: D1Database, owner: string, id: string) {
  const pattern = `%"${id}"%`
  const result = await db
    .prepare(
      `SELECT id, title FROM docs
       WHERE owner = ? AND deleted_at IS NULL AND links_json LIKE ?
       LIMIT ?`,
    )
    .bind(owner, pattern, BROWSE_MAX)
    .all<{ id: string; title: string }>()
  return result.results ?? []
}

export function registerTools(server: McpServer, ctx: McpToolContext): void {
  server.registerTool(
    'upsert_doc',
    {
      description: 'Create or update a Markdown document (optional id).',
      inputSchema: {
        id: z.string().optional().describe('Existing document id to update'),
        markdown: z.string().describe('Full Markdown with optional front matter'),
      },
    },
    async ({ id, markdown }) => {
      const result = await upsertDoc(ctx.db, ctx.owner, { id, markdown })
      if (result.status === 'too_large') {
        return textJson({ error: 'too_large', status: 413 })
      }
      if (result.status === 'not_found') {
        return textJson({ error: 'not_found', status: 404 })
      }
      return textJson(result)
    },
  )

  server.registerTool(
    'browse',
    {
      description: 'Virtual folders under /, /recent/, /kind/, /tags/ (Task 11).',
      inputSchema: {
        path: z.string().describe('Virtual browse path, e.g. / or /tags/design/'),
      },
    },
    async ({ path }) => {
      return textJson({
        error: 'browse_not_implemented',
        path,
        hint: 'Virtual browse paths ship in a follow-up task.',
      })
    },
  )

  server.registerTool(
    'search',
    {
      description: 'Full-text search; optional tag or kind filter.',
      inputSchema: {
        q: z.string().describe('Search query'),
        tag: z.string().optional(),
        kind: z.string().optional(),
      },
    },
    async ({ q, tag, kind }) => {
      let rows = await searchDocs(ctx.db, ctx.owner, q, BROWSE_MAX)
      if (tag) {
        const t = tag.toLowerCase()
        rows = rows.filter((r) =>
          (JSON.parse(r.tags_json) as string[]).some((x) => x.toLowerCase() === t),
        )
      }
      if (kind) {
        rows = rows.filter((r) => r.kind === kind)
      }
      return textJson({ items: rows.map(docSummary) })
    },
  )

  server.registerTool(
    'get_doc',
    {
      description: 'Document body, metadata, links, and backlinks.',
      inputSchema: {
        id: z.string(),
        offset: z.number().int().min(0).optional(),
        max_chars: z.number().int().min(1).optional(),
      },
    },
    async ({ id, offset = 0, max_chars }) => {
      const row = await getDocForOwner(ctx.db, ctx.owner, id)
      if (!row) return textJson({ error: 'not_found', status: 404 })
      const body =
        max_chars != null ? row.body_md.slice(offset, offset + max_chars) : row.body_md.slice(offset)
      const links = JSON.parse(row.links_json) as string[]
      const backlinks = await listBacklinks(ctx.db, ctx.owner, id)
      return textJson({
        id: row.id,
        title: row.title,
        description: row.description,
        kind: row.kind,
        tags: JSON.parse(row.tags_json),
        created_at: row.created_at,
        updated_at: row.updated_at,
        body,
        offset,
        truncated: max_chars != null && offset + max_chars < row.body_md.length,
        links,
        backlinks,
      })
    },
  )

  server.registerTool(
    'delete_doc',
    {
      description: 'Soft-delete a document (destructive).',
      annotations: { destructiveHint: true },
      inputSchema: {
        id: z.string(),
      },
    },
    async ({ id }) => {
      const ok = await softDeleteDoc(ctx.db, ctx.owner, id)
      if (!ok) return textJson({ error: 'not_found', status: 404 })
      return textJson({ ok: true, id })
    },
  )
}