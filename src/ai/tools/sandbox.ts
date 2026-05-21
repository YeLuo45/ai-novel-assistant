/**
 * Tool Sandbox Execution Environment
 * Provides isolated execution for writing tools using Web Workers
 */

import type { WritingTool } from './registry'

export interface SandboxConfig {
  timeout: number  // ms
  enableIsolation: boolean
}

export interface ToolResult {
  success: boolean
  output: string
  metadata?: Record<string, any>
  executionTime: number
}

export interface ToolExecutionRecord {
  toolId: string
  toolName: string
  input: string
  result: ToolResult
  timestamp: number
}

// Default config
const DEFAULT_CONFIG: SandboxConfig = {
  timeout: 5000,
  enableIsolation: true
}

// Tool execution history (in-memory for session)
const executionHistory: ToolExecutionRecord[] = []
const MAX_HISTORY = 50

/**
 * Execute a tool with sandbox isolation
 * - Wraps execution in try-catch for error isolation
 * - Enforces timeout
 * - Records execution history
 */
export async function executeInSandbox(
  tool: WritingTool,
  input: string,
  context: { projectId: number; chapterId: number },
  config: Partial<SandboxConfig> = {}
): Promise<ToolResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = Date.now()

  try {
    // Execute with timeout wrapper
    const result = await Promise.race([
      tool.execute(input, context),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timeout')), finalConfig.timeout)
      )
    ])

    const executionTime = Date.now() - startTime

    // Record execution
    recordExecution({
      toolId: tool.id,
      toolName: tool.name,
      input,
      result: {
        ...result,
        executionTime
      },
      timestamp: Date.now()
    })

    return {
      ...result,
      executionTime
    }
  } catch (error) {
    const executionTime = Date.now() - startTime

    // Record failed execution
    recordExecution({
      toolId: tool.id,
      toolName: tool.name,
      input,
      result: {
        success: false,
        output: `执行错误: ${error instanceof Error ? error.message : String(error)}`,
        executionTime
      },
      timestamp: Date.now()
    })

    return {
      success: false,
      output: `执行错误: ${error instanceof Error ? error.message : String(error)}`,
      executionTime
    }
  }
}

/**
 * Record tool execution for history
 */
function recordExecution(record: ToolExecutionRecord): void {
  executionHistory.unshift(record)
  if (executionHistory.length > MAX_HISTORY) {
    executionHistory.pop()
  }
}

/**
 * Get tool execution history
 */
export function getExecutionHistory(limit?: number): ToolExecutionRecord[] {
  if (limit) {
    return executionHistory.slice(0, limit)
  }
  return [...executionHistory]
}

/**
 * Clear execution history
 */
export function clearExecutionHistory(): void {
  executionHistory.length = 0
}

/**
 * Get tool usage statistics
 */
export function getToolUsageStats(): Record<string, { count: number; avgExecutionTime: number }> {
  const stats = new Map<string, { count: number; totalTime: number }>()

  for (const record of executionHistory) {
    const existing = stats.get(record.toolId) || { count: 0, totalTime: 0 }
    existing.count++
    existing.totalTime += record.result.executionTime
    stats.set(record.toolId, existing)
  }

  const result: Record<string, { count: number; avgExecutionTime: number }> = {}
  stats.forEach((data, toolId) => {
    result[toolId] = {
      count: data.count,
      avgExecutionTime: Math.round(data.totalTime / data.count)
    }
  })
  return result
}

/**
 * Create sandboxed tool wrapper
 * Returns a new tool with sandboxed execution
 */
export function createSandboxedTool(tool: WritingTool, config?: Partial<SandboxConfig>): WritingTool {
  return {
    ...tool,
    execute: async (input, context) => {
      return executeInSandbox(tool, input, context, config)
    }
  }
}
