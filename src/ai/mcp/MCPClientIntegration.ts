/**
 * MCPClientIntegration - V69
 * MCP Client integration with internal ToolRegistryV3
 * Enables consuming external MCP tools as native tools
 * 
 * Key features:
 * - Tool schema conversion (MCP → internal format)
 * - Tool registry integration (register MCP tools)
 * - Self-evolution tracking (track MCP tool usage)
 * - Error handling and retry logic
 * 
 * Inspired by: thunderbolt-design MCP Client
 */

import { mcpClient } from './MCPClient'
import type { MCPTool, MCPToolInputSchema, MCPToolCall } from './types'

// ===============================================================================
// Types
// ===============================================================================

export interface MCPIntegrationConfig {
  autoRegister: boolean       // Auto-register discovered tools
  trackUsage: boolean         // Track tool usage for self-evolution
  retryOnFailure: boolean    // Retry failed tool calls
  maxRetries: number
  retryDelayMs: number
}

export interface ToolRegistration {
  toolId: string
  sourceServer: string
  originalSchema: MCPTool
  registeredAt: number
  lastUsed: number
  usageCount: number
  successCount: number
  failureCount: number
}

export interface MCPToolAdapter {
  adaptToolSchema(tool: MCPTool): AdaptedToolSchema
  adaptToolResult(result: unknown): ToolCallResult
  adaptError(error: unknown): string
}

export interface AdaptedToolSchema {
id: string
      name: string
      description: string
      category: string
      inputSchema: Record<string, unknown>
      metadata: {
    source: 'mcp'
    serverId: string
    originalName: string
    capabilities: string[]
  }
}

export interface ToolCallResult {
  success: boolean
  data?: unknown
  error?: string
  durationMs: number
  metadata?: Record<string, unknown>
}

// ===============================================================================
// Constants
// ===============================================================================

const DEFAULT_CONFIG: MCPIntegrationConfig = {
  autoRegister: true,
  trackUsage: true,
  retryOnFailure: true,
  maxRetries: 3,
  retryDelayMs: 1000
}

const MCP_TOOL_CATEGORIES: Record<string, string> = {
  'image': '视觉生成',
  'code': '代码生成',
  'search': '信息检索',
  'database': '数据存储',
  'http': '网络请求',
  'file': '文件操作',
  'default': '通用工具'
}

// ===============================================================================
// MCPToolAdapter
// ===============================================================================

export class MCPToolAdapter {
  /**
   * Adapt MCP tool schema to internal format
   */
  adaptToolSchema(tool: MCPTool): AdaptedToolSchema {
    const category = this.inferCategory(tool.name, tool.description)
    
    return {
      id: `mcp-${tool.name}`,
      name: tool.name,
      description: tool.description || `MCP tool: ${tool.name}`,
      category,
      inputSchema: this.adaptInputSchema(tool.inputSchema),
      metadata: {
        source: 'mcp',
        serverId: '', // Will be set during registration
        originalName: tool.name,
        capabilities: this.inferCapabilities(tool)
      }
    }
  }

  /**
   * Infer tool category from name and description
   */
  private inferCategory(name: string, description: string): string {
    const text = `${name} ${description}`.toLowerCase()
    
    if (text.includes('image') || text.includes('生成图') || text.includes('draw')) {
      return MCP_TOOL_CATEGORIES['image']
    }
    if (text.includes('code') || text.includes('代码') || text.includes('program')) {
      return MCP_TOOL_CATEGORIES['code']
    }
    if (text.includes('database') || text.includes('db') || text.includes('数据存储')) {
      return MCP_TOOL_CATEGORIES['database']
    }
    if (text.includes('search') || text.includes('检索')) {
      return MCP_TOOL_CATEGORIES['search']
    }
    if (text.includes('http') || text.includes('fetch') || text.includes('请求')) {
      return MCP_TOOL_CATEGORIES['http']
    }
    if (text.includes('file') || text.includes('文件')) {
      return MCP_TOOL_CATEGORIES['file']
    }
    
    return MCP_TOOL_CATEGORIES['default']
  }

  /**
   * Infer capabilities from tool schema
   */
  private inferCapabilities(tool: MCPTool): string[] {
    const capabilities: string[] = []
    
    // Check for input parameters
    if (tool.inputSchema && Object.keys(tool.inputSchema).length > 0) {
      capabilities.push('structured_input')
    }
    
    // Check for description
    if (tool.description) {
      capabilities.push('documented')
    }
    
    return capabilities
  }

  /**
   * Adapt input schema to JSON Schema format
   */
  private adaptInputSchema(schema: MCPToolInputSchema | undefined): Record<string, unknown> {
    if (!schema) {
      return {
        type: 'object',
        properties: {},
        required: []
      }
    }

    // Already in JSON Schema format
    return {
      type: 'object',
      properties: schema.properties || {},
      required: schema.required || []
    }
  }

  /**
   * Adapt output schema (MCP tools don't have explicit output schema)
   */
  private adaptOutputSchema(_schema: unknown): Record<string, unknown> {
    return {
      type: 'object',
      properties: {}
    }
  }

  /**
   * Adapt tool call result
   */
  adaptToolResult(result: unknown): ToolCallResult {
    if (result === null || result === undefined) {
      return { success: true, data: null, durationMs: 0 }
    }
    
    // Check if result has error field
    if (typeof result === 'object' && result !== null) {
      const resultObj = result as Record<string, unknown>
      if (resultObj.isError === true) {
        return {
          success: false,
          error: String(resultObj.error || resultObj.message || 'Unknown error'),
          durationMs: Number(resultObj.durationMs || 0)
        }
      }
    }
    
    return {
      success: true,
      data: result,
      durationMs: 0
    }
  }

  /**
   * Adapt error to string
   */
  adaptError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }
}

// ===============================================================================
// MCPClientIntegration
// ===============================================================================

export class MCPClientIntegration {
  private config: MCPIntegrationConfig
  private adapter: MCPToolAdapter
  private registrations: Map<string, ToolRegistration> = new Map()

  constructor(config: Partial<MCPIntegrationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.adapter = new MCPToolAdapter()
  }

  /**
   * Register all tools from an MCP server to internal tool registry
   */
  async registerServerTools(serverId: string): Promise<ToolRegistration[]> {
    try {
      // Get tools from MCP server
      const tools = await mcpClient.listTools(serverId)
      
      const registrations: ToolRegistration[] = []
      
      for (const tool of tools) {
        const registration = await this.registerTool(serverId, tool)
        registrations.push(registration)
      }
      
      return registrations
    } catch (error) {
      console.error(`Failed to register tools from ${serverId}:`, error)
      return []
    }
  }

  /**
   * Register a single MCP tool
   */
  async registerTool(serverId: string, tool: MCPTool): Promise<ToolRegistration> {
    const adaptedSchema = this.adapter.adaptToolSchema(tool)
    adaptedSchema.metadata.serverId = serverId
    
    const registration: ToolRegistration = {
      toolId: adaptedSchema.id,
      sourceServer: serverId,
      originalSchema: tool,
      registeredAt: Date.now(),
      lastUsed: 0,
      usageCount: 0,
      successCount: 0,
      failureCount: 0
    }
    
    this.registrations.set(adaptedSchema.id, registration)
    
    // TODO: Register with ToolRegistryV3
    // await toolRegistry.register(adaptedSchema)
    
    return registration
  }

  /**
   * Call an MCP tool with retry logic
   */
  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> {
    const startTime = Date.now()
    const toolId = `mcp-${toolName}`
    
    // Find registration
    const registration = this.registrations.get(toolId)
    
    let lastError: unknown = null
    const maxAttempts = this.config.retryOnFailure ? this.config.maxRetries : 1
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await mcpClient.callTool(serverId, toolName, args)
        
        // Update usage stats
        if (registration) {
          registration.usageCount++
          registration.lastUsed = Date.now()
          registration.successCount++
        }
        
        return {
          success: true,
          data: result,
          durationMs: Date.now() - startTime,
          metadata: {
            serverId,
            toolName,
            attempt
          }
        }
      } catch (error) {
        lastError = error
        
        if (attempt < maxAttempts) {
          // Wait before retry
          await this.delay(this.config.retryDelayMs)
        }
      }
    }
    
    // All retries failed
    if (registration) {
      registration.usageCount++
      registration.lastUsed = Date.now()
      registration.failureCount++
    }
    
    return {
      success: false,
      error: this.adapter.adaptError(lastError),
      durationMs: Date.now() - startTime,
      metadata: {
        serverId,
        toolName,
        attempts: maxAttempts
      }
    }
  }

  /**
   * Get all registered MCP tools
   */
  getRegisteredTools(): ToolRegistration[] {
    return Array.from(this.registrations.values())
  }

  /**
   * Get tools from specific server
   */
  getToolsByServer(serverId: string): ToolRegistration[] {
    return Array.from(this.registrations.values())
      .filter(r => r.sourceServer === serverId)
  }

  /**
   * Get tool usage statistics
   */
  getUsageStats(toolId: string): { total: number; success: number; failure: number; rate: number } | null {
    const registration = this.registrations.get(toolId)
    if (!registration) return null
    
    return {
      total: registration.usageCount,
      success: registration.successCount,
      failure: registration.failureCount,
      rate: registration.usageCount > 0 
        ? registration.successCount / registration.usageCount 
        : 0
    }
  }

  /**
   * Unregister all tools from a server
   */
  unregisterServer(serverId: string): number {
    const toRemove: string[] = []
    
    this.registrations.forEach((reg, toolId) => {
      if (reg.sourceServer === serverId) {
        toRemove.push(toolId)
      }
    })
    
    toRemove.forEach(toolId => {
      this.registrations.delete(toolId)
      // TODO: Unregister from ToolRegistryV3
      // toolRegistry.unregister(toolId)
    })
    
    return toRemove.length
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton
export const mcpIntegration = new MCPClientIntegration()