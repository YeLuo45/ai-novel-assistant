/**
 * MCP Types - Model Context Protocol Type Definitions
 * V51: Extended types for MCP external tool bridge
 */

export interface MCPServerConfig {
  id: string
  name: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  enabled: boolean
  description?: string
  tools?: string[]
}

export interface MCPTool {
  name: string
  description: string
  inputSchema?: MCPToolInputSchema
}

export interface MCPToolInputSchema {
  type: 'object'
  properties?: Record<string, {
    type: string
    description?: string
    default?: unknown
    enum?: unknown[]
  }>
  required?: string[]
}

export interface MCPToolCall {
  tool: string
  arguments: Record<string, unknown>
}

export interface MCPToolResult {
  success: boolean
  output: string
  metadata?: Record<string, unknown>
  error?: string
}

export interface MCPListToolsResult {
  tools: MCPTool[]
}

export interface MCPProtocolMessage {
  jsonrpc: '2.0'
  id?: number | string
  method?: string
  params?: Record<string, unknown>
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

export interface MCPClientOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface LocalToolDefinition {
  id: string
  name: string
  description: string
  inputSchema: MCPToolInputSchema
  execute: (args: Record<string, unknown>, context: { projectId?: number; chapterId?: number }) => Promise<MCPToolResult>
}