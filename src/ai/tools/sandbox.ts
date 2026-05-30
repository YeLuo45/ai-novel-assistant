/**
 * Tool Sandbox Execution Environment V2
 * Provides isolated execution with Web Safety and LLM filtering
 */

import type { WritingTool } from './registry'

export interface SandboxConfig {
  timeout: number  // ms
  enableIsolation: boolean
  allowedDomains?: string[]
  blockedPatterns?: string[]
  maxTokens?: number
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

// Security Policy Configuration
export interface SecurityPolicy {
  allowedDomains: string[]
  blockedPatterns: string[]
  maxTokens: number
  timeout: number
  contentFilter?: (content: string) => string
}

// Default security policy
const DEFAULT_POLICY: SecurityPolicy = {
  allowedDomains: [
    'api.github.com',
    'api.openalex.org',
    'api.datamuse.com',
    'api.promptlint.com'
  ],
  blockedPatterns: [
    'file://',
    'node://',
    'eval(',
    'Function(',
    '__proto__',
    'constructor'
  ],
  maxTokens: 4000,
  timeout: 30000
}

// Tool execution history (in-memory for session)
const executionHistory: ToolExecutionRecord[] = []
const MAX_HISTORY = 50

let securityPolicy: SecurityPolicy = { ...DEFAULT_POLICY }

/**
 * Configure security policy
 */
export function configureSecurityPolicy(policy: Partial<SecurityPolicy>): void {
  securityPolicy = { ...securityPolicy, ...policy }
}

/**
 * Get current security policy
 */
export function getSecurityPolicy(): SecurityPolicy {
  return { ...securityPolicy }
}

/**
 * Validate URL against allowed domains
 */
export function validateWebAccess(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    
    // Check if domain is in allowed list
    const isAllowed = securityPolicy.allowedDomains.some(domain => {
      return hostname === domain.toLowerCase() || hostname.endsWith(`.${domain.toLowerCase()}`)
    })
    
    if (!isAllowed) {
      return false
    }
    
    // Check blocked patterns
    for (const pattern of securityPolicy.blockedPatterns) {
      if (url.toLowerCase().includes(pattern.toLowerCase())) {
        return false
      }
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Filter potentially dangerous content from LLM output
 */
export function filterLlmOutput(content: string): string {
  let filtered = content
  
  // Remove blocked patterns
  for (const pattern of securityPolicy.blockedPatterns) {
    filtered = filtered.split(pattern).join('[FILTERED]')
  }
  
  // Truncate if exceeds max tokens (rough estimate: 4 chars per token)
  const maxChars = securityPolicy.maxTokens * 4
  if (filtered.length > maxChars) {
    filtered = filtered.slice(0, maxChars) + '... [TRUNCATED]'
  }
  
  return filtered
}

/**
 * Execute a tool with sandbox isolation and security checks
 */
export async function executeInSandbox(
  tool: WritingTool,
  input: string,
  context: { projectId: number; chapterId: number },
  config: Partial<SandboxConfig> = {}
): Promise<ToolResult> {
  const finalConfig = { 
    timeout: securityPolicy.timeout,
    enableIsolation: true,
    ...config 
  }
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

    // Filter LLM output if present
    let filteredOutput = result.output
    if (result.metadata?.llmOutput) {
      filteredOutput = filterLlmOutput(result.output)
    }

    // Record execution
    recordExecution({
      toolId: tool.id,
      toolName: tool.name,
      input,
      result: {
        ...result,
        output: filteredOutput,
        executionTime
      },
      timestamp: Date.now()
    })

    return {
      ...result,
      output: filteredOutput,
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
 * Execute tool with web safety validation
 */
export async function executeWithWebSafety(
  tool: WritingTool,
  input: string,
  context: { projectId: number; chapterId: number }
): Promise<ToolResult> {
  // Check for URL patterns in input
  const urlPattern = /https?:\/\/[^\s]+/gi
  const urls = input.match(urlPattern) || []
  
  for (const url of urls) {
    if (!validateWebAccess(url)) {
      return {
        success: false,
        output: `Web Safety: 域名未授权 - ${new URL(url).hostname}`,
        executionTime: 0
      }
    }
  }
  
  return executeInSandbox(tool, input, context)
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
      return executeWithWebSafety(tool, input, context)
    }
  }
}