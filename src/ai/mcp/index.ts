/**
 * MCP Module Exports
 * V51: External Tool Bridge for Model Context Protocol
 */

export * from './types'
export { MCPClient, mcpClient } from './MCPClient'
export { MCPServerAdapter, mcpServerAdapter } from './MCPServerAdapter'
export {
  localTools,
  getAllLocalTools,
  getLocalTool,
  registerLocalToolsToAdapter
} from './localTools'

// Re-export types for convenience
export type {
  MCPServerConfig,
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  MCPListToolsResult,
  MCPProtocolMessage,
  MCPClientOptions,
  LocalToolDefinition
} from './types'