/**
 * ToolCallAnalyzer Types - V77
 * Tool Call Sequence Analysis and Optimization Recommendations
 * 
 * Analyzes tool call sequences to detect:
 * - Sequential patterns (A→B→C chains)
 * - Branching patterns (context-dependent branching)
 * - Parallel patterns (A||B||C)
 * - Inefficiency patterns (redundant calls, suboptimal order)
 * - Tool substitution opportunities
 */

import type { ToolCall } from '../agents/ToolExecutor'
import type { ToolExecutionLog } from '../tools/types'

// ===============================================================================
// Sequence Types
// ===============================================================================

export type SequenceType = 'sequential' | 'branching' | 'parallel' | 'loop' | 'conditional' | 'standalone'

export interface ToolChain {
  id: string
  toolIds: string[]
  length: number
  avgDurationMs: number
  totalOccurrences: number
  avgSuccessRate: number
  pattern: string  // e.g., "toolA → toolB → toolC"
  type: SequenceType
}

export interface ToolSequence {
  id: string
  toolIds: string[]
  length: number
  durationMs: number
  success: boolean
  timestamp: number
  sequenceType: SequenceType
  branchingContext?: Record<string, unknown>
}

export interface ToolSubstitution {
  originalToolId: string
  suggestedToolId: string
  reason: string
  avgTimeSavedMs: number
  confidence: number  // 0-1
  alternativeToolIds: string[]
}

export interface InefficiencyReport {
  id: string
  type: 'redundant_call' | 'suboptimal_order' | 'missing_cache' | 'parallel_candidates' | 'deprecated_tool' | 'overly_generic'
  toolIds: string[]
  description: string
  estimatedTimeLostMs: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

export interface ToolCallPattern {
  id: string
  toolIds: string[]
  sequenceType: SequenceType
  frequency: number  // How often this exact sequence occurs
  successRate: number
  avgDurationMs: number
  firstObserved: number
  lastObserved: number
}

export interface ToolCallContext {
  genre?: string
  writingStage?: string
  complexity?: number
  agentType?: string
  [key: string]: unknown
}

// ===============================================================================
// Analysis Result Types
// ===============================================================================

export interface SequenceAnalysisResult {
  totalCalls: number
  totalSequences: number
  uniqueSequences: number
  avgSequenceLength: number
  mostCommonSequence: ToolChain | null
  chains: ToolChain[]
  patterns: ToolCallPattern[]
}

export interface EfficiencyAnalysisResult {
  inefficiencies: InefficiencyReport[]
  totalTimeLostMs: number
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

export interface SubstitutionAnalysisResult {
  substitutions: ToolSubstitution[]
  potentialTimeSavedMs: number
}

export interface ToolCallAnalysis {
  sequence: SequenceAnalysisResult
  efficiency: EfficiencyAnalysisResult
  substitutions: SubstitutionAnalysisResult
  recommendations: string[]
}

// ===============================================================================
// Helper Functions
// ===============================================================================

/**
 * Convert list of tool calls to sequences (grouped by session/task)
 */
export function callsToSequences(calls: ToolCall[], gapThresholdMs = 5000): ToolSequence[] {
  const sequences: ToolSequence[] = []
  if (calls.length === 0) return sequences

  let currentSequence: ToolCall[] = [calls[0]]
  let lastEndTime = calls[0].endTime || calls[0].startTime

  for (let i = 1; i < calls.length; i++) {
    const call = calls[i]
    const gap = call.startTime - lastEndTime

    if (gap <= gapThresholdMs) {
      currentSequence.push(call)
    } else {
      // Finalize current sequence
      if (currentSequence.length > 0) {
        sequences.push(createSequenceFromCalls(currentSequence))
      }
      currentSequence = [call]
    }
    lastEndTime = call.endTime || call.startTime
  }

  // Don't forget the last sequence
  if (currentSequence.length > 0) {
    sequences.push(createSequenceFromCalls(currentSequence))
  }

  return sequences
}

function createSequenceFromCalls(calls: ToolCall[]): ToolSequence {
  const toolIds = calls.map(c => c.tool)
  const durationMs = calls.reduce((sum, c) => sum + (c.endTime ? c.endTime - c.startTime : 0), 0)
  const success = calls.every(c => c.success)

  return {
    id: `seq_${calls[0].id}_${calls.length}`,
    toolIds,
    length: toolIds.length,
    durationMs,
    success,
    timestamp: calls[0].startTime,
    sequenceType: inferSequenceType(toolIds, calls)
  }
}

/**
 * Infer sequence type from tool IDs and call records
 */
export function inferSequenceType(toolIds: string[], _calls: ToolCall[]): SequenceType {
  // Remove consecutive duplicates
  const uniqueIds = toolIds.filter((id, i) => i === 0 || id !== toolIds[i - 1])
  
  if (uniqueIds.length === 1) return 'standalone'
  if (uniqueIds.length === 2) return 'sequential'
  
  // Check for alternating pattern (parallel-ish)
  const alternating = uniqueIds.every((id, i) => i < 2 || id !== uniqueIds[i - 1] && id !== uniqueIds[i - 2])
  if (alternating && uniqueIds.length > 2) return 'parallel'
  
  return 'sequential'
}

/**
 * Extract tool chains from sequences
 */
export function extractChains(sequences: ToolSequence[], minLength = 2): ToolChain[] {
  const chainMap = new Map<string, ToolChain>()
  const now = Date.now()

  for (const seq of sequences) {
    if (seq.length < minLength) continue

    const pattern = seq.toolIds.join(' → ')
    const existing = chainMap.get(pattern)

    if (existing) {
      existing.totalOccurrences++
      existing.avgDurationMs = (existing.avgDurationMs * (existing.totalOccurrences - 1) + seq.durationMs) / existing.totalOccurrences
    } else {
      chainMap.set(pattern, {
        id: `chain_${pattern.replace(/\s+/g, '_').replace(/→/g, '_')}`,
        toolIds: seq.toolIds,
        length: seq.length,
        avgDurationMs: seq.durationMs,
        totalOccurrences: 1,
        avgSuccessRate: seq.success ? 1 : 0,
        pattern,
        type: seq.sequenceType
      })
    }
  }

  return Array.from(chainMap.values()).sort((a, b) => b.totalOccurrences - a.totalOccurrences)
}

/**
 * Detect common patterns from chains
 */
export function detectPatterns(chains: ToolChain[]): ToolCallPattern[] {
  return chains.map(chain => ({
    id: `pattern_${chain.id}`,
    toolIds: chain.toolIds,
    sequenceType: chain.type,
    frequency: chain.totalOccurrences,
    successRate: chain.avgSuccessRate,
    avgDurationMs: chain.avgDurationMs,
    firstObserved: Date.now() - 30 * 24 * 60 * 60 * 1000,  // Approximate
    lastObserved: Date.now()
  }))
}

/**
 * Analyze sequences for common patterns
 */
export function analyzeSequences(calls: ToolCall[]): SequenceAnalysisResult {
  const sequences = callsToSequences(calls)
  const chains = extractChains(sequences)
  const patterns = detectPatterns(chains)

  return {
    totalCalls: calls.length,
    totalSequences: sequences.length,
    uniqueSequences: chains.length,
    avgSequenceLength: sequences.length > 0 
      ? sequences.reduce((s, seq) => s + seq.length, 0) / sequences.length 
      : 0,
    mostCommonSequence: chains[0] || null,
    chains,
    patterns
  }
}

/**
 * Find inefficient patterns in tool calls
 */
export function findInefficiencies(calls: ToolCall[]): InefficiencyReport[] {
  const reports: InefficiencyReport[] = []
  const toolCallMap = new Map<string, number>()
  const toolDurationMap = new Map<string, { total: number; count: number }>()

  // Count tool usage and track durations
  for (const call of calls) {
    toolCallMap.set(call.tool, (toolCallMap.get(call.tool) || 0) + 1)
    if (call.endTime) {
      const dur = call.endTime - call.startTime
      const existing = toolDurationMap.get(call.tool) || { total: 0, count: 0 }
      toolDurationMap.set(call.tool, { total: existing.total + dur, count: existing.count + 1 })
    }
  }

  // Find redundant calls (same tool called 3+ times in quick succession)
  for (let i = 2; i < calls.length; i++) {
    const prev2 = calls[i - 2]
    const prev1 = calls[i - 1]
    const curr = calls[i]

    if (prev2.tool === prev1.tool && prev1.tool === curr.tool) {
      reports.push({
        id: `ineff_redund_${curr.tool}_${i}`,
        type: 'redundant_call',
        toolIds: [curr.tool],
        description: `Tool '${curr.tool}' called 3+ times consecutively`,
        estimatedTimeLostMs: (call => call.endTime ? call.endTime - call.startTime : 0)(curr) * 0.5,
        severity: 'medium',
        recommendation: `Consider caching the result of '${curr.tool}' or using a batch variant`
      })
    }
  }

  // Find parallel candidates (A then B where A and B are independent)
  for (let i = 1; i < calls.length; i++) {
    const prev = calls[i - 1]
    const curr = calls[i]
    const gap = curr.startTime - (prev.endTime || prev.startTime)

    if (gap > 2000 && prev.success && curr.success) {
      reports.push({
        id: `ineff_parallel_${prev.tool}_${curr.tool}_${i}`,
        type: 'parallel_candidates',
        toolIds: [prev.tool, curr.tool],
        description: `'${prev.tool}' then '${curr.tool}' with ${gap}ms gap — could run in parallel`,
        estimatedTimeLostMs: gap * 0.8,
        severity: 'low',
        recommendation: `Consider restructuring to call '${prev.tool}' and '${curr.tool}' in parallel`
      })
    }
  }

  // Find high-frequency low-value tools (potential optimization targets)
  for (const [toolId, count] of Array.from(toolCallMap.entries())) {
    if (count > 20) {
      const avgDur = toolDurationMap.get(toolId)
      if (avgDur && avgDur.total / avgDur.count > 500) {
        reports.push({
          id: `ineff_freq_${toolId}`,
          type: 'overly_generic',
          toolIds: [toolId],
          description: `Tool '${toolId}' called ${count} times with avg ${(avgDur.total / avgDur.count).toFixed(0)}ms`,
          estimatedTimeLostMs: Math.floor(count * 0.1 * (avgDur.total / avgDur.count)),
          severity: 'high',
          recommendation: `Consider creating a specialized variant of '${toolId}' for common use cases`
        })
      }
    }
  }

  return reports
}

/**
 * Analyze tool substitution opportunities
 */
export function findSubstitutions(
  calls: ToolCall[],
  toolRegistry?: Map<string, { name: string; category: string; avgDuration?: number }>
): ToolSubstitution[] {
  const substitutions: ToolSubstitution[] = []
  const toolFreqMap = new Map<string, number>()

  for (const call of calls) {
    toolFreqMap.set(call.tool, (toolFreqMap.get(call.tool) || 0) + 1)
  }

  // Find high-frequency tools that could be replaced with faster alternatives
  for (const [toolId, freq] of Array.from(toolFreqMap.entries())) {
    if (freq < 10) continue  // Only suggest for frequently used tools

    const tool = toolRegistry?.get(toolId)
    if (tool && tool.avgDuration && tool.avgDuration > 1000) {
      // Suggest looking for faster alternatives
      substitutions.push({
        originalToolId: toolId,
        suggestedToolId: `${toolId}_optimized`,
        reason: `High usage (${freq}x) with long avg duration (${tool.avgDuration}ms)`,
        avgTimeSavedMs: Math.floor(tool.avgDuration * 0.3),
        confidence: 0.7,
        alternativeToolIds: [`${toolId}_v2`, `${toolId}_batch`]
      })
    }
  }

  return substitutions
}

/**
 * Main analysis function
 */
export function analyzeToolCalls(
  calls: ToolCall[],
  toolRegistry?: Map<string, { name: string; category: string; avgDuration?: number }>
): ToolCallAnalysis {
  const sequence = analyzeSequences(calls)
  const inefficiencies = findInefficiencies(calls)
  const substitutions = findSubstitutions(calls, toolRegistry)

  const totalTimeLostMs = inefficiencies.reduce((sum, ineff) => sum + ineff.estimatedTimeLostMs, 0)
  const maxSeverity = inefficiencies.reduce((max, ineff) => {
    const severityOrder = ['none', 'low', 'medium', 'high', 'critical']
    return severityOrder.indexOf(ineff.severity) > severityOrder.indexOf(max) ? ineff.severity : max
  }, 'none' as InefficiencyReport['severity'])

  const efficiency: EfficiencyAnalysisResult = {
    inefficiencies,
    totalTimeLostMs,
    severity: maxSeverity
  }

  const recommendations: string[] = []
  if (inefficiencies.some(i => i.type === 'redundant_call')) {
    recommendations.push('Consider implementing result caching for frequently repeated tool calls')
  }
  if (inefficiencies.some(i => i.type === 'parallel_candidates')) {
    recommendations.push('Identify parallelizable tool pairs and restructure for concurrent execution')
  }
  if (substitutions.length > 0) {
    recommendations.push(`Found ${substitutions.length} tool substitution opportunities — potential ${substitutions.reduce((s, sub) => s + sub.avgTimeSavedMs, 0)}ms time savings`)
  }

  return {
    sequence,
    efficiency,
    substitutions: { substitutions, potentialTimeSavedMs: substitutions.reduce((s, sub) => s + sub.avgTimeSavedMs, 0) },
    recommendations
  }
}

/**
 * Predict next tool based on context and history
 */
export function predictNextTool(
  currentToolId: string,
  context: ToolCallContext,
  chains: ToolChain[]
): string[] {
  const nextTools: Map<string, number> = new Map()

  for (const chain of chains) {
    const idx = chain.toolIds.indexOf(currentToolId)
    if (idx !== -1 && idx < chain.toolIds.length - 1) {
      const nextTool = chain.toolIds[idx + 1]
      const weight = chain.totalOccurrences * chain.avgSuccessRate
      nextTools.set(nextTool, (nextTools.get(nextTool) || 0) + weight)
    }
  }

  return Array.from(nextTools.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([toolId]) => toolId)
}

/**
 * Format chain for display
 */
export function formatChain(chain: ToolChain): string {
  return `${chain.pattern} [${chain.totalOccurrences}x, ${chain.avgSuccessRate}% success]`
}