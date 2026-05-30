/**
 * MCP Client - Model Context Protocol Client Implementation V3
 * V51: Enhanced with child_process stdio communication for zero-dependency MCP server connection
 */

import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import type {
  MCPServerConfig,
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  MCPListToolsResult,
  MCPProtocolMessage,
  MCPClientOptions
} from './types'

export { type MCPServerConfig, type MCPTool, type MCPToolCall, type MCPToolResult } from './types'

interface ConnectedServer {
  config: MCPServerConfig
  process: ChildProcessWithoutNullStreams | null
  tools: MCPTool[]
  requestId: number
}

const DEFAULT_OPTIONS: MCPClientOptions = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
}

export class MCPClient {
  private servers: Map<string, MCPServerConfig> = new Map()
  private connectedServers: Map<string, ConnectedServer> = new Map()
  private options: MCPClientOptions

  constructor(options: MCPClientOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.loadServers()
  }

  /**
   * Connect to an MCP server using stdio communication
   */
  async connect(serverId: string): Promise<void> {
    const config = this.servers.get(serverId)
    if (!config) {
      throw new Error(`Server ${serverId} not found`)
    }

    if (this.connectedServers.has(serverId)) {
      return // Already connected
    }

    if (!config.command) {
      throw new Error(`Server ${serverId} has no command configured for stdio connection`)
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(config.command!, config.args || [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...config.env }
      })

      let stdout = ''
      let stderr = ''

      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      proc.on('error', (err) => {
        this.connectedServers.delete(serverId)
        reject(err)
      })

      proc.on('close', (code) => {
        this.connectedServers.delete(serverId)
        if (code !== 0 && code !== null) {
          reject(new Error(`Server exited with code ${code}: ${stderr}`))
        }
      })

      // Initialize with initialize request
      this.sendRequest(proc, {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          clientInfo: { name: 'ai-novel-assistant', version: '1.0.0' }
        },
        id: Date.now()
      }).then(() => {
        this.connectedServers.set(serverId, {
          config,
          process: proc,
          tools: [],
          requestId: Date.now() + 1
        })
        resolve()
      }).catch(reject)

      // Set a timeout
      setTimeout(() => {
        if (!this.connectedServers.has(serverId)) {
          proc.kill()
          reject(new Error('Connection timeout'))
        }
      }, this.options.timeout)
    })
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverId: string): Promise<void> {
    const connected = this.connectedServers.get(serverId)
    if (!connected) {
      return
    }

    if (connected.process) {
      // Send shutdown notification
      try {
        this.sendNotification(connected.process, 'shutdown', {})
      } catch {
        // Ignore errors during shutdown
      }
      connected.process.kill()
    }

    this.connectedServers.delete(serverId)
  }

  /**
   * List available tools from a connected server
   */
  async listTools(serverId: string): Promise<MCPTool[]> {
    const connected = this.connectedServers.get(serverId)
    if (!connected || !connected.process) {
      throw new Error(`Server ${serverId} not connected`)
    }

    const response = await this.sendRequest(connected.process, {
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
      id: connected.requestId++
    })

    const result = response.result as MCPListToolsResult
    connected.tools = result.tools || []
    return connected.tools
  }

  /**
   * Call a tool on a connected server
   */
  async callTool(serverId: string, toolName: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const connected = this.connectedServers.get(serverId)
    if (!connected || !connected.process) {
      return {
        success: false,
        output: '',
        error: `Server ${serverId} not connected`
      }
    }

    try {
      const response = await this.sendRequest(connected.process, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        },
        id: connected.requestId++
      })

      const result = response.result as { content: Array<{ type: string; text: string }> }
      const output = result.content?.map(c => c.text).join('\n') || ''

      return {
        success: true,
        output,
        metadata: { serverId, toolName }
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Execute a tool call with retry logic
   */
  async executeWithRetry(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>,
    retries?: number
  ): Promise<MCPToolResult> {
    const maxRetries = retries ?? this.options.retries ?? 3
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = await this.callTool(serverId, toolName, args)
      if (result.success) {
        return result
      }

      lastError = new Error(result.error || 'Tool call failed')

      // Don't retry on certain errors
      if (result.error?.includes('not found') || result.error?.includes('invalid')) {
        return result
      }

      if (attempt < maxRetries - 1) {
        await this.delay(this.options.retryDelay || 1000)
      }
    }

    return {
      success: false,
      output: '',
      error: lastError?.message || 'Max retries exceeded'
    }
  }

  /**
   * Register a local tool that can be called by external MCP clients
   */
  registerLocalTool(tool: {
    id: string
    name: string
    description: string
    inputSchema: Record<string, unknown>
    execute: (args: Record<string, unknown>, context: { projectId?: number; chapterId?: number }) => Promise<MCPToolResult>
  }): void {
    // Store in local registry for later use by MCPServerAdapter
    this.localTools.set(tool.id, tool)
  }

  private localTools: Map<string, {
    id: string
    name: string
    description: string
    inputSchema: Record<string, unknown>
    execute: (args: Record<string, unknown>, context: { projectId?: number; chapterId?: number }) => Promise<MCPToolResult>
  }> = new Map()

  getLocalTools() {
    return Array.from(this.localTools.values())
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
    this.disconnect(id).catch(() => {})
    this.servers.delete(id)
    this.saveServers()
  }

  /**
   * Get all server configurations
   */
  listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values())
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
   * Check if a server is connected
   */
  isConnected(serverId: string): boolean {
    return this.connectedServers.has(serverId)
  }

  /**
   * Get connected server info
   */
  getConnectedServer(serverId: string): { config: MCPServerConfig; tools: MCPTool[] } | null {
    const connected = this.connectedServers.get(serverId)
    if (!connected) return null
    return { config: connected.config, tools: connected.tools }
  }

  // Helper methods

  private sendRequest(proc: ChildProcessWithoutNullStreams, message: MCPProtocolMessage): Promise<MCPProtocolMessage> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'))
      }, this.options.timeout)

      const handler = (data: Buffer) => {
        const response = data.toString()
        try {
          const parsed = JSON.parse(response) as MCPProtocolMessage
          if (parsed.id === message.id) {
            clearTimeout(timeout)
            proc.stdout?.off('data', handler)
            if (parsed.error) {
              reject(new Error(`${parsed.error.message}`))
            } else {
              resolve(parsed)
            }
          }
        } catch {
          // Not a valid JSON, continue waiting
        }
      }

      proc.stdout?.on('data', handler)

      proc.stdin?.write(JSON.stringify(message) + '\n')

      // Handle error response through stderr as well
      const errorHandler = (data: Buffer) => {
        try {
          const parsed = JSON.parse(data.toString()) as MCPProtocolMessage
          if (parsed.id === message.id && parsed.error) {
            clearTimeout(timeout)
            proc.stderr?.off('data', errorHandler)
            reject(new Error(`${parsed.error.message}`))
          }
        } catch {
          // Not a valid JSON
        }
      }
      proc.stderr?.on('data', errorHandler)
    })
  }

  private sendNotification(proc: ChildProcessWithoutNullStreams, method: string, params: Record<string, unknown>): void {
    proc.stdin?.write(JSON.stringify({
      jsonrpc: '2.0',
      method,
      params
    }) + '\n')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private saveServers(): void {
    try {
      const servers = Array.from(this.servers.values())
      localStorage.setItem('mcp_servers_v51', JSON.stringify(servers))
    } catch {
      // localStorage not available
    }
  }

  private loadServers(): void {
    try {
      const saved = localStorage.getItem('mcp_servers_v51')
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

export default mcpClient