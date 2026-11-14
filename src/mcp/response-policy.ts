/** MCP Streamable HTTP returns tool zod failures as SSE 200 + isError; map to HTTP 400. */
export function mcpSseShowsToolValidationFailure(sseBody: string): boolean {
  return (
    sseBody.includes('Input validation error') ||
    sseBody.includes('Invalid arguments for tool') ||
    sseBody.includes('MCP error -32602')
  )
}