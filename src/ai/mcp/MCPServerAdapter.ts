/**
 * MCPServerAdapter - Allows ai-novel-assistant to act as an MCP Server
 * V51: Exposes local tools to external MCP clients via stdio communication
 */

import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import type { LocalToolDefinition, MCPToolResult, MCPProtocolMessage } from './types'

interface PendingRequest {
  resolve: (response: MCPProtocolMessage) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

export class MCPServerAdapter {
  private localTools: Map<string, LocalToolDefinition> = new Map()
  private runningProcesses: Map<string, ChildProcessWithoutNullStreams> = new Map()
  private pendingRequests: Map<number, PendingRequest> = new Map()
  private requestId: number = 1
  private isInitialized: boolean = false

  constructor() {
    this.registerBuiltInTools()
  }

  /**
   * Register a local tool to be exposed via MCP
   */
  registerLocalTool(tool: LocalToolDefinition): void {
    this.localTools.set(tool.id, tool)
  }

  /**
   * Unregister a local tool
   */
  unregisterLocalTool(toolId: string): boolean {
    return this.localTools.delete(toolId)
  }

  /**
   * Get all registered local tools
   */
  getLocalTools(): LocalToolDefinition[] {
    return Array.from(this.localTools.values())
  }

  /**
   * Start the MCP server adapter (stdio mode for child_process integration)
   */
  start(): void {
    if (this.isInitialized) return
    this.isInitialized = true
    this.setupStdioHandler()
  }

  /**
   * Stop the MCP server adapter
   */
  stop(): void {
    this.runningProcesses.forEach((proc, id) => {
      proc.kill()
      this.runningProcesses.delete(id)
    })
    this.isInitialized = false
  }

  /**
   * Handle an MCP request from an external client (stdio mode)
   */
  async handleRequest(request: MCPProtocolMessage): Promise<MCPProtocolMessage> {
    const { method, params, id } = request

    if (!id) {
      // Notification without id - no response needed
      return { jsonrpc: '2.0' }
    }

    switch (method) {
      case 'initialize':
        return this.handleInitialize(id)

      case 'tools/list':
        return this.handleListTools(id)

      case 'tools/call':
        return this.handleCallTool(id, params as { name: string; arguments?: Record<string, unknown> })

      case 'shutdown':
        this.stop()
        return { jsonrpc: '2.0', id, result: {} }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        }
    }
  }

  /**
   * Spawn a child process that runs this adapter as an MCP server
   */
  spawnAsChildProcess(command: string, args: string[] = []): ChildProcessWithoutNullStreams {
    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    this.runningProcesses.set(`child_${proc.pid}`, proc)

    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(line => line.trim())
      for (const line of lines) {
        try {
          const request = JSON.parse(line) as MCPProtocolMessage
          this.handleRequest(request).then(response => {
            proc.stdin?.write(JSON.stringify(response) + '\n')
          }).catch(err => {
            const errorResponse: MCPProtocolMessage = {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32603, message: err.message }
            }
            proc.stdin?.write(JSON.stringify(errorResponse) + '\n')
          })
        } catch {
          // Invalid JSON
        }
      }
    })

    proc.on('close', () => {
      this.runningProcesses.delete(`child_${proc.pid}`)
    })

    return proc
  }

  private handleInitialize(id: number | string): MCPProtocolMessage {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: 'ai-novel-assistant',
          version: '1.0.0'
        }
      }
    }
  }

  private handleListTools(id: number | string): MCPProtocolMessage {
    const tools = Array.from(this.localTools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))

    return {
      jsonrpc: '2.0',
      id,
      result: { tools }
    }
  }

  private async handleCallTool(
    id: number | string,
    params: { name: string; arguments?: Record<string, unknown> }
  ): Promise<MCPProtocolMessage> {
    const tool = Array.from(this.localTools.values()).find(t => t.name === params.name)

    if (!tool) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: `Tool not found: ${params.name}` }
      }
    }

    try {
      const result = await tool.execute(
        params.arguments || {},
        {}
      )

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: result.success ? result.output : `Error: ${result.error}`
            }
          ],
          isError: !result.success
        }
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }

  private setupStdioHandler(): void {
    let buffer = ''

    process.stdin?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue

        try {
          const request = JSON.parse(line) as MCPProtocolMessage
          this.handleRequest(request).then(response => {
            process.stdout?.write(JSON.stringify(response) + '\n')
          }).catch(err => {
            const errorResponse: MCPProtocolMessage = {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32603, message: err.message }
            }
            process.stdout?.write(JSON.stringify(errorResponse) + '\n')
          })
        } catch {
          // Invalid JSON, skip
        }
      }
    })

    // Handle process termination
    process.on('SIGTERM', () => this.stop())
    process.on('SIGINT', () => this.stop())
  }

  /**
   * Register built-in tools that ai-novel-assistant exposes to MCP clients
   */
  private registerBuiltInTools(): void {
    // Material Query Tool
    this.registerLocalTool({
      id: 'queryMaterials',
      name: 'queryMaterials',
      description: 'Query materials from the material library by keyword or category',
      inputSchema: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Search keyword' },
          category: { type: 'string', description: 'Material category filter' },
          limit: { type: 'number', description: 'Maximum results', default: 20 }
        },
        required: ['keyword']
      },
      execute: async (args) => {
        // Simulate material query
        return {
          success: true,
          output: JSON.stringify({
            materials: [
              { id: 1, name: '场景素材A', category: '场景', keyword: args.keyword as string },
              { id: 2, name: '角色素材B', category: '角色', keyword: args.keyword as string }
            ],
            total: 2
          })
        }
      }
    })

    // Character Generation Tool
    this.registerLocalTool({
      id: 'generateCharacter',
      name: 'generateCharacter',
      description: 'Generate a character profile based on parameters',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Character name' },
          role: { type: 'string', description: 'Character role (protagonist/antagonist/supporting)' },
          traits: { type: 'string', description: 'Personality traits' }
        },
        required: ['name', 'role']
      },
      execute: async (args) => {
        return {
          success: true,
          output: JSON.stringify({
            id: Date.now(),
            name: args.name,
            role: args.role,
            traits: args.traits || '待定',
            backstory: `这是角色${args.name}的故事...`,
            createdAt: new Date().toISOString()
          })
        }
      }
    })

    // Plot Suggestion Tool
    this.registerLocalTool({
      id: 'suggestPlot',
      name: 'suggestPlot',
      description: 'Generate plot suggestions based on story context',
      inputSchema: {
        type: 'object',
        properties: {
          genre: { type: 'string', description: 'Story genre' },
          theme: { type: 'string', description: 'Story theme' },
          chapterCount: { type: 'number', description: 'Expected chapter count' }
        },
        required: ['genre']
      },
      execute: async (args) => {
        return {
          success: true,
          output: JSON.stringify({
            suggestions: [
              '引入一个意外事件打破主角的平静生活',
              '增加一个神秘的反派角色',
              '设计一个关键的抉择时刻',
              '安排一个情感转折点'
            ],
            genre: args.genre,
            theme: args.theme || '待定'
          })
        }
      }
    })
  }
}

// Singleton instance
export const mcpServerAdapter = new MCPServerAdapter()

export default mcpServerAdapter