import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTools, type McpToolContext } from './tools/index'

export const MCP_INSTRUCTIONS = `tameru: browse → search → get_doc; 書き込みは upsert_doc。
機微情報・秘密を置かない。個人開発で可用性保証なし。免責は Viewer /disclaimer。`

/** One McpServer per HTTP request — do not cache across requests or owners. */
export function createMcpServer(ctx: McpToolContext): McpServer {
  const server = new McpServer(
    { name: 'tameru', version: '1.0.0' },
    { instructions: MCP_INSTRUCTIONS },
  )
  registerTools(server, ctx)
  return server
}