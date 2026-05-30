/**
 * ToolExecutor - 工具执行器
 * V39 Generic Agent 架构核心组件
 */

/**
 * 工具调用记录
 */
export interface ToolCall {
  id: string
  tool: string
  args: Record<string, unknown>
  startTime: number
  endTime?: number
  result?: unknown
  error?: string
  success?: boolean
}

/**
 * 工具定义
 */
export interface Tool {
  id: string
  name: string
  description: string
  execute: (args: Record<string, unknown>) => Promise<ToolResult>
  validate?: (args: Record<string, unknown>) => boolean
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  success: boolean
  output?: string
  error?: string
  metadata?: Record<string, unknown>
}

/**
 * 工具类别
 */
export type ToolCategory = 'text' | 'search' | 'calc' | 'media' | 'mcp' | 'custom'

/**
 * 工具元信息
 */
export interface ToolInfo {
  id: string
  name: string
  category: ToolCategory
  usageCount: number
  lastUsed?: number
  avgDuration?: number
}

/**
 * ToolExecutor 工具执行器类
 */
export class ToolExecutor {
  private tools: Map<string, Tool> = new Map()
  private callHistory: ToolCall[] = []
  private maxHistorySize: number
  private toolStats: Map<string, ToolInfo> = new Map()

  constructor(maxHistorySize = 200) {
    this.maxHistorySize = maxHistorySize
  }

  /**
   * 注册工具
   */
  register(tool: Tool): void {
    this.tools.set(tool.id, tool)
    this.toolStats.set(tool.id, {
      id: tool.id,
      name: tool.name,
      category: this.inferCategory(tool.name),
      usageCount: 0
    })
  }

  /**
   * 批量注册工具
   */
  registerMany(tools: Tool[]): void {
    for (const tool of tools) {
      this.register(tool)
    }
  }

  /**
   * 执行工具调用
   */
  async execute(call: ToolCall): Promise<ToolCall> {
    const startTime = Date.now()
    const tool = this.tools.get(call.tool)

    if (!tool) {
      return {
        ...call,
        endTime: startTime,
        error: `Tool not found: ${call.tool}`,
        success: false
      }
    }

    // 验证参数
    if (tool.validate && !tool.validate(call.args)) {
      return {
        ...call,
        endTime: startTime,
        error: 'Invalid arguments',
        success: false
      }
    }

    try {
      const result = await tool.execute(call.args)
      const endTime = Date.now()

      const completedCall: ToolCall = {
        ...call,
        startTime,
        endTime,
        result: result.output ?? result,
        success: result.success,
        error: result.error
      }

      this.recordCall(completedCall)
      return completedCall
    } catch (error) {
      const endTime = Date.now()
      const errorMessage = error instanceof Error ? error.message : String(error)

      const failedCall: ToolCall = {
        ...call,
        startTime,
        endTime,
        error: errorMessage,
        success: false
      }

      this.recordCall(failedCall)
      return failedCall
    }
  }

  /**
   * 验证工具调用
   */
  validate(call: ToolCall): boolean {
    const tool = this.tools.get(call.tool)
    
    if (!tool) {
      return false
    }

    if (tool.validate) {
      return tool.validate(call.args)
    }

    return true
  }

  /**
   * 获取可用工具列表
   */
  getAvailableTools(): ToolInfo[] {
    return Array.from(this.toolStats.values())
  }

  /**
   * 获取工具
   */
  getTool(id: string): Tool | undefined {
    return this.tools.get(id)
  }

  /**
   * 获取调用历史
   */
  getCallHistory(): ToolCall[] {
    return [...this.callHistory]
  }

  /**
   * 获取最近调用
   */
  getRecentCalls(count: number): ToolCall[] {
    return this.callHistory.slice(-count)
  }

  /**
   * 按工具获取调用统计
   */
  getToolStats(toolId: string): ToolInfo | undefined {
    return this.toolStats.get(toolId)
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.callHistory = []
  }

  /**
   * 生成工具调用ID
   */
  static generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * 推断工具类别
   */
  private inferCategory(name: string): ToolCategory {
    const lowerName = name.toLowerCase()
    
    if (lowerName.includes('search')) return 'search'
    if (lowerName.includes('calc') || lowerName.includes('count')) return 'calc'
    if (lowerName.includes('media') || lowerName.includes('image')) return 'media'
    if (lowerName.includes('mcp')) return 'mcp'
    if (lowerName.includes('text') || lowerName.includes('write')) return 'text'
    
    return 'custom'
  }

  /**
   * 记录调用
   */
  private recordCall(call: ToolCall): void {
    this.callHistory.push(call)

    if (this.callHistory.length > this.maxHistorySize) {
      this.callHistory.shift()
    }

    // 更新工具统计
    const stats = this.toolStats.get(call.tool)
    if (stats) {
      stats.usageCount++
      stats.lastUsed = Date.now()

      if (call.endTime && call.startTime) {
        const duration = call.endTime - call.startTime
        if (stats.avgDuration !== undefined) {
          stats.avgDuration = (stats.avgDuration * (stats.usageCount - 1) + duration) / stats.usageCount
        } else {
          stats.avgDuration = duration
        }
      }
    }
  }

  /**
   * 检查工具是否存在
   */
  hasTool(toolId: string): boolean {
    return this.tools.has(toolId)
  }

  /**
   * 移除工具
   */
  removeTool(toolId: string): boolean {
    return this.tools.delete(toolId)
  }

  /**
   * 获取工具执行成功率
   */
  getToolSuccessRate(toolId: string): number {
    const calls = this.callHistory.filter(c => c.tool === toolId)
    if (calls.length === 0) return 0

    const successfulCalls = calls.filter(c => c.success)
    return successfulCalls.length / calls.length
  }
}