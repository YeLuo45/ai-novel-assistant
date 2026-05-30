/**
 * ToolRegistry - V128
 * Unified Agent Tool Integration System
 * 
 * Inspired by:
 * - claude-code: tool registry with capability discovery and automatic tool chains
 * - nanobot: distributed tool specialization and mesh tool sharing
 * - chatdev: multi-agent tool sharing and phase-gated tool execution
 * 
 * Provides:
 * - Centralized tool registry with capability metadata
 * - Automatic tool chain detection and execution
 * - Tool capability matching for agent roles
 * - Tool usage tracking and analytics
 * - Dynamic tool discovery and registration
 */

import type { AgentCoordinationSuiteState } from './AgentCoordinationSuite'
import type { SelfRegulationState } from './AgentSelfRegulationSystem'

// =============================================================================
// Types
// =============================================================================

export type ToolCategory = 'writing' | 'editing' | 'research' | 'planning' | 'analysis' | 'coordination' | 'feedback' | 'utility'
export type ToolStatus = 'available' | 'busy' | 'deprecated' | 'disabled'
export type ToolCapabilityMatch = 'exact' | 'partial' | 'none'

export interface ToolCapability {
  name: string
  description: string
  inputSchema: Record<string, any>
  outputSchema: Record<string, any>
  category: ToolCategory[]
  keywords: string[]
  estimatedTokens: number
  executionTimeMs: number
  successRate: number
  requiresApproval: boolean
  parallelizable: boolean
}

export interface ToolInstance {
  id: string
  name: string
  version: string
  status: ToolStatus
  capabilities: ToolCapability[]
  registeredAt: number
  lastUsed: number | null
  totalExecutions: number
  failedExecutions: number
  averageLatencyMs: number
  agentOwner: string | null   // null = shared
  tags: string[]
  dependencies: string[]      // tool IDs this tool depends on
  compatibleRoles: string[]   // agent roles that can use this tool
}

export interface ToolChainStep {
  toolId: string
  dependsOn: string[]         // tool IDs that must complete before this step
  parallelGroup: number | null // null = sequential, number = run in parallel with others
  optional: boolean
  fallbackToolId: string | null
}

export interface ToolChain {
  id: string
  name: string
  description: string
  steps: ToolChainStep[]
  estimatedTotalTokens: number
  estimatedTotalTimeMs: number
  createdAt: number
  usageCount: number
  successRate: number
}

export interface ToolExecution {
  id: string
  toolId: string
  agentId: string
  startedAt: number
  completedAt: number | null
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input: Record<string, any>
  output: Record<string, any> | null
  error: string | null
  approvalRequired: boolean
  approvedBy: string | null
  latencyMs: number | null
}

export interface ToolRegistryState {
  tools: Map<string, ToolInstance>
  chains: Map<string, ToolChain>
  executions: Map<string, ToolExecution>
  executionHistory: string[]   // execution IDs, most recent first
  toolCategories: Map<ToolCategory, string[]> // category -> tool IDs
  roleCapabilities: Map<string, string[]> // role -> tool IDs
  analytics: ToolAnalytics
}

export interface ToolAnalytics {
  totalTools: number
  totalExecutions: number
  averageLatencyMs: number
  mostUsedTool: string | null
  mostFailedTool: string | null
  toolUsageByCategory: Record<ToolCategory, number>
  chainSuccessRates: Map<string, number>
}

// =============================================================================
// Default Analytics
// =============================================================================

function createEmptyAnalytics(): ToolAnalytics {
  return {
    totalTools: 0,
    totalExecutions: 0,
    averageLatencyMs: 0,
    mostUsedTool: null,
    mostFailedTool: null,
    toolUsageByCategory: {
      writing: 0, editing: 0, research: 0, planning: 0,
      analysis: 0, coordination: 0, feedback: 0, utility: 0,
    },
    chainSuccessRates: new Map(),
  }
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyToolRegistryState(): ToolRegistryState {
  return {
    tools: new Map(),
    chains: new Map(),
    executions: new Map(),
    executionHistory: [],
    toolCategories: new Map([
      ['writing', []], ['editing', []], ['research', []], ['planning', []],
      ['analysis', []], ['coordination', []], ['feedback', []], ['utility', []],
    ]),
    roleCapabilities: new Map(),
    analytics: createEmptyAnalytics(),
  }
}

// =============================================================================
// Tool Registration
// =============================================================================

export function registerTool(
  state: ToolRegistryState,
  name: string,
  version: string,
  capabilities: ToolCapability[],
  options?: {
    agentOwner?: string
    tags?: string[]
    dependencies?: string[]
    compatibleRoles?: string[]
  }
): { state: ToolRegistryState; toolId: string } {
  const id = `tool_${name}_${version}`.replace(/[^a-zA-Z0-9_]/g, '_')

  const toolInstance: ToolInstance = {
    id,
    name,
    version,
    status: 'available',
    capabilities,
    registeredAt: Date.now(),
    lastUsed: null,
    totalExecutions: 0,
    failedExecutions: 0,
    averageLatencyMs: 0,
    agentOwner: options?.agentOwner ?? null,
    tags: options?.tags ?? [],
    dependencies: options?.dependencies ?? [],
    compatibleRoles: options?.compatibleRoles ?? [],
  }

  const newTools = new Map(state.tools)
  newTools.set(id, toolInstance)

  // Update category indices
  const newCategories = new Map(state.toolCategories)
  for (const cap of capabilities) {
    for (const cat of cap.category) {
      const existing = newCategories.get(cat) ?? []
      if (!existing.includes(id)) {
        newCategories.set(cat, [...existing, id])
      }
    }
  }

  // Update role capabilities
  const newRoles = new Map(state.roleCapabilities)
  for (const role of toolInstance.compatibleRoles) {
    const existing = newRoles.get(role) ?? []
    if (!existing.includes(id)) {
      newRoles.set(role, [...existing, id])
    }
  }

  return {
    state: {
      ...state,
      tools: newTools,
      toolCategories: newCategories,
      roleCapabilities: newRoles,
      analytics: {
        ...state.analytics,
        totalTools: state.analytics.totalTools + 1,
      },
    },
    toolId: id,
  }
}

export function deprecateTool(state: ToolRegistryState, toolId: string): ToolRegistryState {
  const tool = state.tools.get(toolId)
  if (!tool) return state

  const newTools = new Map(state.tools)
  newTools.set(toolId, { ...tool, status: 'deprecated' })

  return { ...state, tools: newTools }
}

export function enableTool(state: ToolRegistryState, toolId: string): ToolRegistryState {
  const tool = state.tools.get(toolId)
  if (!tool) return state

  const newTools = new Map(state.tools)
  newTools.set(toolId, { ...tool, status: 'available' })

  return { ...state, tools: newTools }
}

export function disableTool(state: ToolRegistryState, toolId: string): ToolRegistryState {
  const tool = state.tools.get(toolId)
  if (!tool) return state

  const newTools = new Map(state.tools)
  newTools.set(toolId, { ...tool, status: 'disabled' })

  return { ...state, tools: newTools }
}

// =============================================================================
// Tool Discovery
// =============================================================================

export function findToolsByCategory(state: ToolRegistryState, category: ToolCategory): string[] {
  return state.toolCategories.get(category) ?? []
}

export function findToolsByCapability(
  state: ToolRegistryState,
  capabilityName: string,
  minMatchQuality?: ToolCapabilityMatch
): string[] {
  const matches: { toolId: string; quality: ToolCapabilityMatch }[] = []

  for (const [toolId, tool] of Array.from(state.tools.entries())) {
    if (tool.status !== 'available') continue

    for (const cap of tool.capabilities) {
      if (cap.name === capabilityName) {
        matches.push({ toolId, quality: 'exact' })
        break
      } else if (cap.keywords.some(k => k.toLowerCase().includes(capabilityName.toLowerCase()))) {
        if (!matches.find(m => m.toolId === toolId)) {
          matches.push({ toolId, quality: 'partial' })
        }
      }
    }
  }

  if (minMatchQuality) {
    const qualityOrder: ToolCapabilityMatch[] = ['none', 'partial', 'exact']
    const minIdx = qualityOrder.indexOf(minMatchQuality)
    return matches
      .filter(m => qualityOrder.indexOf(m.quality) >= minIdx)
      .map(m => m.toolId)
  }

  return matches.map(m => m.toolId)
}

export function findToolsForRole(state: ToolRegistryState, role: string): string[] {
  return state.roleCapabilities.get(role) ?? []
}

export function findToolsByKeyword(state: ToolRegistryState, keyword: string): string[] {
  const lower = keyword.toLowerCase()
  const results: string[] = []

  for (const [toolId, tool] of Array.from(state.tools.entries())) {
    if (tool.status !== 'available') continue
    if (tool.name.toLowerCase().includes(lower)) {
      results.push(toolId)
      continue
    }
    if (tool.tags.some(t => t.toLowerCase().includes(lower))) {
      if (!results.includes(toolId)) results.push(toolId)
      continue
    }
    if (tool.capabilities.some(c =>
      c.name.toLowerCase().includes(lower) ||
      c.keywords.some(k => k.toLowerCase().includes(lower))
    )) {
      if (!results.includes(toolId)) results.push(toolId)
    }
  }

  return results
}

// =============================================================================
// Tool Chain Management
// =============================================================================

export function createToolChain(
  state: ToolRegistryState,
  name: string,
  description: string,
  steps: Omit<ToolChainStep, 'toolId'>[],
  toolIdMap: Record<string, string> // logical tool name -> actual tool ID
): { state: ToolRegistryState; chainId: string } {
  const id = `chain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const resolvedSteps: ToolChainStep[] = steps.map((step, idx) => {
    const logicalToolName = Object.keys(toolIdMap)[idx]
    return {
      ...step,
      toolId: toolIdMap[logicalToolName] ?? logicalToolName,
    }
  })

  let totalTokens = 0
  let totalTime = 0

  for (const step of resolvedSteps) {
    const tool = state.tools.get(step.toolId)
    if (tool) {
      for (const cap of tool.capabilities) {
        totalTokens += cap.estimatedTokens
        totalTime += cap.executionTimeMs
      }
    }
  }

  const chain: ToolChain = {
    id,
    name,
    description,
    steps: resolvedSteps,
    estimatedTotalTokens: totalTokens,
    estimatedTotalTimeMs: totalTime,
    createdAt: Date.now(),
    usageCount: 0,
    successRate: 1.0,
  }

  const newChains = new Map(state.chains)
  newChains.set(id, chain)

  return {
    state: { ...state, chains: newChains },
    chainId: id,
  }
}

export function getToolChainSteps(state: ToolRegistryState, chainId: string): ToolChainStep[] {
  return state.chains.get(chainId)?.steps ?? []
}

// =============================================================================
// Tool Execution
// =============================================================================

export function startToolExecution(
  state: ToolRegistryState,
  toolId: string,
  agentId: string,
  input: Record<string, any>,
  requiresApproval?: boolean
): { state: ToolRegistryState; executionId: string } {
  const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const execution: ToolExecution = {
    id,
    toolId,
    agentId,
    startedAt: Date.now(),
    completedAt: null,
    status: 'pending',
    input,
    output: null,
    error: null,
    approvalRequired: requiresApproval ?? false,
    approvedBy: null,
    latencyMs: null,
  }

  const newExecutions = new Map(state.executions)
  newExecutions.set(id, execution)

  const newHistory = [id, ...state.executionHistory].slice(0, 500)

  return {
    state: {
      ...state,
      executions: newExecutions,
      executionHistory: newHistory,
    },
    executionId: id,
  }
}

export function approveExecution(state: ToolRegistryState, executionId: string, approver: string): ToolRegistryState {
  const exec = state.executions.get(executionId)
  if (!exec) return state

  const newExecutions = new Map(state.executions)
  newExecutions.set(executionId, { ...exec, approvedBy: approver })

  return { ...state, executions: newExecutions }
}

export function completeToolExecution(
  state: ToolRegistryState,
  executionId: string,
  output: Record<string, any>,
  success: boolean
): ToolRegistryState {
  const exec = state.executions.get(executionId)
  if (!exec) return state

  const completedAt = Date.now()
  const latencyMs = completedAt - exec.startedAt

  const newExecutions = new Map(state.executions)
  newExecutions.set(executionId, {
    ...exec,
    status: success ? 'completed' : 'failed',
    completedAt,
    output,
    latencyMs,
  })

  // Update tool stats
  const tool = state.tools.get(exec.toolId)
  if (tool) {
    const newTools = new Map(state.tools)
    const updatedTool = {
      ...tool,
      lastUsed: completedAt,
      totalExecutions: tool.totalExecutions + 1,
      failedExecutions: success ? tool.failedExecutions : tool.failedExecutions + 1,
      averageLatencyMs: (tool.averageLatencyMs * tool.totalExecutions + latencyMs) / (tool.totalExecutions + 1),
    }
    newTools.set(exec.toolId, updatedTool)

    return {
      ...state,
      executions: newExecutions,
      tools: newTools,
      analytics: {
        ...state.analytics,
        totalExecutions: state.analytics.totalExecutions + 1,
      },
    }
  }

  return { ...state, executions: newExecutions }
}

export function cancelToolExecution(state: ToolRegistryState, executionId: string): ToolRegistryState {
  const exec = state.executions.get(executionId)
  if (!exec) return state

  const newExecutions = new Map(state.executions)
  newExecutions.set(executionId, {
    ...exec,
    status: 'cancelled',
    completedAt: Date.now(),
  })

  return { ...state, executions: newExecutions }
}

// =============================================================================
// Analytics
// =============================================================================

export function getToolUsageStats(state: ToolRegistryState, toolId: string): {
  totalExecutions: number
  successRate: number
  averageLatencyMs: number
  lastUsed: number | null
} | null {
  const tool = state.tools.get(toolId)
  if (!tool) return null

  return {
    totalExecutions: tool.totalExecutions,
    successRate: tool.totalExecutions > 0
      ? (tool.totalExecutions - tool.failedExecutions) / tool.totalExecutions
      : 1.0,
    averageLatencyMs: tool.averageLatencyMs,
    lastUsed: tool.lastUsed,
  }
}

export function getMostUsedTools(state: ToolRegistryState, limit: number = 5): Array<{ toolId: string; count: number }> {
  const sorted = Array.from(state.tools.values())
    .sort((a, b) => b.totalExecutions - a.totalExecutions)
    .slice(0, limit)

  return sorted.map(t => ({ toolId: t.id, count: t.totalExecutions }))
}

export function getChainSuccessRate(state: ToolRegistryState, chainId: string): number {
  return state.chains.get(chainId)?.successRate ?? 0
}

// =============================================================================
// Formatters
// =============================================================================

export function formatToolSummary(state: ToolRegistryState, toolId: string): string {
  const tool = state.tools.get(toolId)
  if (!tool) return `Tool ${toolId} not found`

  const lines = [
    `=== Tool: ${tool.name} v${tool.version} ===`,
    `Status: ${tool.status} | Category: ${tool.capabilities.map(c => c.category.join(', ')).join(', ')}`,
    `Executions: ${tool.totalExecutions} | Failed: ${tool.failedExecutions}`,
    `Avg Latency: ${Math.round(tool.averageLatencyMs)}ms | Last Used: ${tool.lastUsed ? new Date(tool.lastUsed).toLocaleString() : 'Never'}`,
    `Tags: ${tool.tags.join(', ') || 'none'}`,
    `Capabilities: ${tool.capabilities.map(c => c.name).join(', ')}`,
  ]

  return lines.join('\n')
}

export function formatToolRegistryDashboard(state: ToolRegistryState): string {
  const available = Array.from(state.tools.values()).filter(t => t.status === 'available')
  const total = state.tools.size

  const lines = [
    '=== Tool Registry Dashboard ===',
    `Total Tools: ${total} | Available: ${available.length}`,
    `Total Executions: ${state.analytics.totalExecutions}`,
    `Chains Registered: ${state.chains.size}`,
    '',
    '--- Tools by Category ---',
  ]

  for (const [cat, toolIds] of Array.from(state.toolCategories.entries())) {
    if (toolIds.length > 0) {
      lines.push(`  ${cat}: ${toolIds.length} tools`)
    }
  }

  const mostUsed = getMostUsedTools(state, 3)
  if (mostUsed.length > 0) {
    lines.push('')
    lines.push('--- Most Used Tools ---')
    for (const { toolId, count } of mostUsed) {
      const tool = state.tools.get(toolId)
      if (tool) {
        lines.push(`  ${tool.name}: ${count} executions`)
      }
    }
  }

  return lines.join('\n')
}

export function formatExecutionStatus(state: ToolRegistryState, executionId: string): string {
  const exec = state.executions.get(executionId)
  if (!exec) return `Execution ${executionId} not found`

  const tool = state.tools.get(exec.toolId)
  const lines = [
    `=== Execution: ${executionId} ===`,
    `Tool: ${tool?.name ?? exec.toolId} | Agent: ${exec.agentId}`,
    `Status: ${exec.status} | Started: ${new Date(exec.startedAt).toLocaleString()}`,
    `Approval: ${exec.approvalRequired ? 'Required' : 'Not Required'} ${exec.approvedBy ? `by ${exec.approvedBy}` : ''}`,
    exec.latencyMs !== null ? `Latency: ${exec.latencyMs}ms` : '',
    exec.error ? `Error: ${exec.error}` : '',
  ]

  return lines.filter(Boolean).join('\n')
}