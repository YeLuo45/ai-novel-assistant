/**
 * ToolRegistry V2 — 工具注册表 (Registry Pattern)
 * Supports built-in tools, MCP tools, and custom tools
 */

import type { WritingToolV2, ToolCategoryV2, ToolInput, ToolOutput, CrystallizedSkill, ValidationResult } from './types'

export interface ToolRegistryOptions {
  enableAutoCrystallize?: boolean
  maxCustomTools?: number
}

export class ToolRegistryV2 {
  private tools = new Map<string, WritingToolV2>()
  private options: ToolRegistryOptions

  constructor(options: ToolRegistryOptions = {}) {
    this.options = {
      enableAutoCrystallize: true,
      maxCustomTools: 50,
      ...options
    }
  }

  /**
   * Register a tool
   */
  register(tool: WritingToolV2): boolean {
    if (this.tools.has(tool.id)) {
      console.warn(`Tool ${tool.id} already registered, skipping`)
      return false
    }
    this.tools.set(tool.id, tool)
    return true
  }

  /**
   * Unregister a tool
   */
  unregister(toolId: string): boolean {
    return this.tools.delete(toolId)
  }

  /**
   * Get a tool by ID
   */
  get(toolId: string): WritingToolV2 | undefined {
    return this.tools.get(toolId)
  }

  /**
   * List all tools
   */
  list(): WritingToolV2[] {
    return Array.from(this.tools.values())
  }

  /**
   * List tools by category
   */
  listByCategory(category: ToolCategoryV2): WritingToolV2[] {
    return Array.from(this.tools.values()).filter(t => t.category === category)
  }

  /**
   * List only built-in tools
   */
  listBuiltIn(): WritingToolV2[] {
    return Array.from(this.tools.values()).filter(t => !t.isMcp && !t.isCustom)
  }

  /**
   * List only MCP tools
   */
  listMcp(): WritingToolV2[] {
    return Array.from(this.tools.values()).filter(t => t.isMcp)
  }

  /**
   * List only custom tools
   */
  listCustom(): WritingToolV2[] {
    return Array.from(this.tools.values()).filter(t => t.isCustom)
  }

  /**
   * Search tools by name or description
   */
  search(query: string): WritingToolV2[] {
    const q = query.toLowerCase()
    return Array.from(this.tools.values()).filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    )
  }

  /**
   * Execute a tool by ID
   */
  async execute(
    toolId: string,
    input: ToolInput,
    context: { projectId: number; chapterId: number }
  ): Promise<ToolOutput> {
    const tool = this.tools.get(toolId)
    if (!tool) {
      return {
        success: false,
        output: '',
        error: `Tool ${toolId} not found`
      }
    }

    // Validate input if validator exists
    if (tool.validateInput) {
      const validation = tool.validateInput(input)
      if (!validation.valid) {
        return {
          success: false,
          output: '',
          error: `Validation failed: ${validation.errors?.join(', ')}`
        }
      }
    }

    try {
      const result = await tool.execute(input, context)
      return result
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Crystallize a tool's successful execution into a reusable Skill
   */
  async crystallizeTool(toolId: string): Promise<CrystallizedSkill | null> {
    const tool = this.tools.get(toolId)
    if (!tool?.crystallize) {
      return null
    }

    try {
      return await tool.crystallize()
    } catch {
      return null
    }
  }

  /**
   * Get tool count
   */
  count(): number {
    return this.tools.size
  }

  /**
   * Check if tool exists
   */
  has(toolId: string): boolean {
    return this.tools.has(toolId)
  }

  /**
   * Clear all custom tools
   */
  clearCustomTools(): void {
    for (const tool of this.listCustom()) {
      this.tools.delete(tool.id)
    }
  }

  /**
   * Get categories
   */
  getCategories(): ToolCategoryV2[] {
    const cats = new Set(Array.from(this.tools.values()).map(t => t.category))
    return Array.from(cats)
  }
}

// Singleton instance
export const toolRegistryV2 = new ToolRegistryV2()

export default toolRegistryV2