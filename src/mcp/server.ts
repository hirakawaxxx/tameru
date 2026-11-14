import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTools, type McpToolContext } from './tools/index'

export const MCP_INSTRUCTIONS = `tameru: browse → search → get_doc; 書き込みは upsert_doc。
機微情報・秘密を置かない。個人開発で可用性保証なし。免責は Viewer /disclaimer。`

const servers = new WeakMap<D1Database, Map<string, McpServer>>()

export function getMcpServer(ctx: McpToolContext): McpServer {
  let byOwner = servers.get(ctx.db)
  if (!byOwner) {
    byOwner = new Map()
    servers.set(ctx.db, byOwner)
  }
  let server = byOwner.get(ctx.owner)
  if (!server) {
    server = new McpServer(
      { name: 'tameru', version: '1.0.0' },
      { instructions: MCP_INSTRUCTIONS },
    )
    registerTools(server, ctx)
    byOwner.set(ctx.owner, server)
  }
  return server
}