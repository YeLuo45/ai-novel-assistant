/**
 * MCP Client - Model Context Protocol Client Implementation
 * Connects to external MCP servers for extended tool capabilities
 */

import type { WritingTool, ToolCategory } from '../registry'

export interface MCPServerConfig {
  id: string
  name: string
  url: string
  enabled: boolean
  description?: string
}

export interface MCP工具 {
  name: string
  description: string
  inputSchema?: Record<string, any>
}

export interface MCPListToolsResult {
  tools: MCP工具[]
}

export interface MCPExecuteResult {
  content: Array<{ type: string; text: string }>
  isError?: boolean
}

export class MCPClient {
  private servers: Map<string, MCPServerConfig> = new Map()
  private connectedServers: Set<string> = new Set()

  constructor() {
    // Load saved servers from localStorage
    this.loadServers()
  }

  /**
   * Add an MCP server configuration
   */
  addServer(config: MCPServerConfig): void {
    this.servers.set(config.id, config)
    this.saveServers()
  }

  /**
   * Remove an MCP server
   */
  removeServer(id: string): void {
    this.servers.delete(id)
    this.connectedServers.delete(id)
    this.saveServers()
  }

  /**
   * Get all server configurations
   */
  listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values())
  }

  /**
   * Get enabled servers
   */
  getEnabledServers(): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(s => s.enabled)
  }

  /**
   * Update server configuration
   */
  updateServer(id: string, updates: Partial<MCPServerConfig>): void {
    const existing = this.servers.get(id)
    if (existing) {
      this.servers.set(id, { ...existing, ...updates })
      this.saveServers()
    }
  }

  /**
   * Connect to an MCP server and list available tools
   */
  async connectAndListTools(serverId: string): Promise<WritingTool[]> {
    const server = this.servers.get(serverId)
    if (!server || !server.enabled) {
      throw new Error(`Server ${serverId} not found or disabled`)
    }

    try {
      // MCP protocol: JSON-RPC request
      const response = await fetch(server.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json() as MCPListToolsResult
      this.connectedServers.add(serverId)

      // Convert MCP tools to WritingTool format
      return data.tools.map(tool => this.mcpToolToWritingTool(tool, serverId))
    } catch (error) {
      this.connectedServers.delete(serverId)
      throw error
    }
  }

  /**
   * Execute a tool on an MCP server
   */
  async executeTool(serverId: string, toolName: string, arguments_: Record<string, any>): Promise<{
    success: boolean
    output: string
    metadata?: Record<string, any>
  }> {
    const server = this.servers.get(serverId)
    if (!server || !server.enabled) {
      return {
        success: false,
        output: `Server ${serverId} not found or disabled`
      }
    }

    try {
      const response = await fetch(server.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: arguments_
          },
          id: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json() as MCPExecuteResult

      if (data.isError) {
        return {
          success: false,
          output: data.content.map(c => c.text).join('\n')
        }
      }

      return {
        success: true,
        output: data.content.map(c => c.text).join('\n')
      }
    } catch (error) {
      return {
        success: false,
        output: `执行错误: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Check if a server is connected
   */
  isConnected(serverId: string): boolean {
    return this.connectedServers.has(serverId)
  }

  /**
   * Convert MCP tool to WritingTool format
   */
  private mcpToolToWritingTool(mcpTool: MCP工具, serverId: string): WritingTool {
    return {
      id: `mcp_${serverId}_${mcpTool.name}`,
      name: mcpTool.name,
      description: mcpTool.description || '',
      icon: '🔌',
      category: 'mcp' as ToolCategory,
      execute: async (input: string) => {
        const args = this.parseToolInput(input, mcpTool.inputSchema)
        return this.executeTool(serverId, mcpTool.name, args)
      }
    }
  }

  /**
   * Parse user input into tool arguments
   * Simple implementation - could be enhanced with JSON schema validation
   */
  private parseToolInput(input: string, schema?: Record<string, any>): Record<string, any> {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(input)
      if (typeof parsed === 'object') {
        return parsed
      }
    } catch {
      // Not JSON, treat as single string argument
    }

    // Default: pass input as 'text' argument
    return { text: input }
  }

  /**
   * Save servers to localStorage
   */
  private saveServers(): void {
    try {
      const servers = Array.from(this.servers.values())
      localStorage.setItem('mcp_servers', JSON.stringify(servers))
    } catch {
      // localStorage not available
    }
  }

  /**
   * Load servers from localStorage
   */
  private loadServers(): void {
    try {
      const saved = localStorage.getItem('mcp_servers')
      if (saved) {
        const servers = JSON.parse(saved) as MCPServerConfig[]
        for (const server of servers) {
          this.servers.set(server.id, server)
        }
      }
    } catch {
      // localStorage not available or parse error
    }
  }
}

// Singleton instance
export const mcpClient = new MCPClient()
