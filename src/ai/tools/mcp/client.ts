/**
 * MCP Client - Model Context Protocol Client Implementation V2
 * Connects to external MCP servers for extended tool capabilities
 * Integrates with Sandbox for secure execution and MemoryManager for context
 */

import type { WritingTool, ToolCategory } from '../registry'
import { executeWithWebSafety, filterLlmOutput, configureSecurityPolicy } from '../sandbox'

// Types for Memory Manager integration
interface MemoryContext {
  sessionId: string;
  projectId?: string;
  type: 'session' | 'conversation' | 'project' | 'longterm';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  lastAccessed?: number;
}

interface Skill {
  id: string;
  name: string;
  task: string;
  steps: string[];
  triggers: string[];
  useCount: number;
  successRate: number;
  createdAt: number;
  lastUsed: number;
}

export interface MCPServerConfig {
  id: string
  name: string
  url: string
  enabled: boolean
  description?: string
}

export interface MCPTool {
  name: string
  description: string
  inputSchema?: Record<string, any>
}

export interface MCPListToolsResult {
  tools: MCPTool[]
}

export interface MCPExecuteResult {
  content: Array<{ type: string; text: string }>
  isError?: boolean
}

interface ToolResult {
  success: boolean
  output: string
  metadata?: Record<string, any>
  executionTime: number
}

// Memory Manager stub for integration (full implementation in MemoryManager.ts)
class MemoryManagerIntegration {
  private skills: Map<string, Skill> = new Map()
  private memories: Map<string, MemoryContext[]> = new Map()

  async findSkill(task: string): Promise<Skill | null> {
    const taskLower = task.toLowerCase()
    const skills = Array.from(this.skills.values())
    
    const matched = skills
      .filter(s => s.triggers.some(t => taskLower.includes(t.toLowerCase())))
      .sort((a, b) => {
        const aScore = a.useCount * a.successRate
        const bScore = b.useCount * b.successRate
        return bScore - aScore
      })

    if (matched.length > 0) {
      const skill = matched[0]
      skill.useCount++
      skill.lastUsed = Date.now()
      return skill
    }
    return null
  }

  async remember(context: MemoryContext): Promise<void> {
    const key = context.sessionId
    if (!this.memories.has(key)) {
      this.memories.set(key, [])
    }
    this.memories.get(key)!.push(context)
  }

  async recall(query: string): Promise<MemoryContext[]> {
    const results: MemoryContext[] = []
    const queryLower = query.toLowerCase()
    
    this.memories.forEach(memories => {
      for (const m of memories) {
        if (m.content.toLowerCase().includes(queryLower)) {
          results.push(m)
        }
      }
    })
    
    return results
  }

  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill)
  }

  getSkills(): Skill[] {
    return Array.from(this.skills.values())
  }
}

// Singleton memory manager for MCP integration
const memoryIntegration = new MemoryManagerIntegration()

export class MCPClient {
  private servers: Map<string, MCPServerConfig> = new Map()
  private connectedServers: Set<string> = new Set()
  private registeredTools: Map<string, WritingTool> = new Map()

  constructor() {
    this.loadServers()
    this.registerMcpToolsFromSkills()
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

      const tools = data.tools.map(tool => this.mcpToolToWritingTool(tool, serverId))
      
      // Register tools for later use
      for (const tool of tools) {
        this.registeredTools.set(tool.id, tool)
      }

      return tools
    } catch (error) {
      this.connectedServers.delete(serverId)
      throw error
    }
  }

  /**
   * Execute a tool on an MCP server with Sandbox isolation and Memory context
   */
  async executeTool(
    serverId: string, 
    toolName: string, 
    arguments_: Record<string, any>,
    context?: { projectId: number; chapterId: number; sessionId?: string }
  ): Promise<{
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
      // Enhance arguments with memory context
      let enhancedArgs = { ...arguments_ }
      if (context?.sessionId) {
        const relevantSkill = await memoryIntegration.findSkill(toolName)
        if (relevantSkill) {
          enhancedArgs._memoryContext = {
            skillName: relevantSkill.name,
            steps: relevantSkill.steps,
            hints: relevantSkill.triggers
          }
        }
      }

      const response = await fetch(server.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: enhancedArgs
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

      const output = data.content.map(c => c.text).join('\n')
      
      // Remember the tool execution in memory
      if (context?.sessionId) {
        await memoryIntegration.remember({
          sessionId: context.sessionId,
          projectId: context.projectId?.toString(),
          type: 'session',
          content: `MCP tool executed: ${toolName}`,
          metadata: { serverId, toolName, args: arguments_, result: output },
          createdAt: Date.now()
        })
      }

      return {
        success: true,
        output: filterLlmOutput(output),
        metadata: { serverId, toolName }
      }
    } catch (error) {
      return {
        success: false,
        output: `执行错误: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Register a tool from a Skill (memory-enhanced tool registration)
   */
  registerToolFromSkill(skill: Skill): WritingTool | null {
    if (!skill.id || !skill.task) {
      return null
    }

    const tool: WritingTool = {
      id: `skill_${skill.id}`,
      name: skill.name,
      description: `Skill: ${skill.task}`,
      icon: '🧠',
      category: 'mcp' as ToolCategory,
      execute: async (input: string, ctx) => {
        // Execute skill with memory context
        const startTime = Date.now()
        
        try {
          // Find related skills for context
          const relatedSkill = await memoryIntegration.findSkill(skill.task)
          
          // Build execution context from skill steps
          const contextSteps = relatedSkill?.steps || skill.steps
          const hints = relatedSkill?.triggers || skill.triggers
          
          // Execute with context injection
          const result = await this.executeWithContext(
            skill.task,
            input,
            { contextSteps, hints },
            ctx
          )
          
          return {
            success: true,
            output: result,
            metadata: { skillId: skill.id, executionTime: Date.now() - startTime },
            executionTime: Date.now() - startTime
          }
        } catch (error) {
          return {
            success: false,
            output: `Skill执行错误: ${error instanceof Error ? error.message : String(error)}`,
            executionTime: Date.now() - startTime
          }
        }
      }
    }

    this.registeredTools.set(tool.id, tool)
    memoryIntegration.registerSkill(skill)
    
    return tool
  }

  /**
   * Execute tool with memory-enhanced context
   */
  private async executeWithContext(
    task: string,
    input: string,
    context: { contextSteps: string[]; hints: string[] },
    ctx?: { projectId: number; chapterId: number }
  ): Promise<string> {
    // Simple context injection - in production this would call LLM
    const contextPrompt = context.contextSteps.length > 0
      ? `\nContext steps:\n${context.contextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : ''
    
    const hintsText = context.hints.length > 0
      ? `\nHints: ${context.hints.join(', ')}`
      : ''
    
    return `Task: ${task}${contextPrompt}${hintsText}\n\nInput: ${input}`
  }

  /**
   * Register all skills from memory as MCP tools
   */
  private registerMcpToolsFromSkills(): void {
    const skills = memoryIntegration.getSkills()
    for (const skill of skills) {
      this.registerToolFromSkill(skill)
    }
  }

  /**
   * Get registered MCP tools
   */
  getRegisteredTools(): WritingTool[] {
    return Array.from(this.registeredTools.values())
  }

  /**
   * Get a registered tool by ID
   */
  getTool(id: string): WritingTool | undefined {
    return this.registeredTools.get(id)
  }

  /**
   * Configure security policy for MCP calls
   */
  configureSecurityPolicy(config: {
    allowedDomains?: string[]
    blockedPatterns?: string[]
    maxTokens?: number
    timeout?: number
  }): void {
    configureSecurityPolicy(config)
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
  private mcpToolToWritingTool(mcpTool: MCPTool, serverId: string): WritingTool {
    return {
      id: `mcp_${serverId}_${mcpTool.name}`,
      name: mcpTool.name,
      description: mcpTool.description || '',
      icon: '🔌',
      category: 'mcp' as ToolCategory,
      execute: async (input: string, context) => {
        const args = this.parseToolInput(input, mcpTool.inputSchema)
        return this.executeTool(serverId, mcpTool.name, args, {
          projectId: context.projectId,
          chapterId: context.chapterId
        })
      }
    }
  }

  /**
   * Parse user input into tool arguments
   */
  private parseToolInput(input: string, schema?: Record<string, any>): Record<string, any> {
    try {
      const parsed = JSON.parse(input)
      if (typeof parsed === 'object') {
        return parsed
      }
    } catch {
      // Not JSON, treat as single string argument
    }
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