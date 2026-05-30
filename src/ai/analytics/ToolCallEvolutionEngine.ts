/**
 * ToolCallEvolutionEngine - V110
 * Tool Usage Analytics and Evolution Tracking Engine
 * 
 * Inspired by:
 * - thunderbolt: pipeline architecture + real-time feedback loops
 * - nanobot: distributed mesh agents with tool specialization
 * - generic-agent: autonomous tool orchestration and self-improvement
 * - chatdev: multi-agent tool coordination patterns
 * 
 * Features:
 * - Tracks tool usage patterns over time
 * - Identifies tool efficiency and bottlenecks
 * - Predicts tool needs based on session context
 * - Self-tunes tool selection strategy
 */

import type { WritingSessionState } from '../session/WritingSessionManager'

// =============================================================================
// Types
// =============================================================================

export interface ToolUsageRecord {
  toolId: string
  toolName: string
  sessionId: string
  timestamp: number
  duration: number         // ms
  success: boolean
  outputTokens: number
  inputTokens: number
  contextSnapshot: string  // brief description of context at call time
}

export interface ToolEfficiency {
  toolId: string
  toolName: string
  totalCalls: number
  successRate: number     // 0-1
  averageDuration: number  // ms
  averageTokens: number
  lastUsed: number        // timestamp
  efficiencyScore: number // 0-100
}

export interface ToolUsagePattern {
  patternId: string
  description: string
  toolSequence: string[]  // ordered tool IDs
  frequency: number
  averageQualityDelta: number
  contextType: string
}

export interface ToolPrediction {
  toolId: string
  confidence: number      // 0-1
  reason: string
  estimatedDuration: number
  estimatedTokens: number
}

export interface ToolEvolutionState {
  usageRecords: ToolUsageRecord[]
  efficiencyScores: Map<string, ToolEfficiency>
  usagePatterns: ToolUsagePattern[]
  lastAnalysisTimestamp: number
  totalToolsUsed: number
  mostUsedTool: string | null
}

export interface ToolEvolutionConfig {
  efficiencyWindowDays: number      // days to consider for efficiency (default: 7)
  minCallsForPattern: number        // min calls to identify pattern (default: 5)
  patternConfidenceThreshold: number // confidence for pattern detection (default: 0.7)
  toolStalenessDays: number         // days before unused tool is "stale" (default: 14)
  autoTuneEnabled: boolean          // auto-adjust tool selection (default: false)
  maxPatternsTracked: number        // max patterns to keep (default: 20)
}

export const DEFAULT_TOOL_EVOLUTION_CONFIG: ToolEvolutionConfig = {
  efficiencyWindowDays: 7,
  minCallsForPattern: 5,
  patternConfidenceThreshold: 0.7,
  toolStalenessDays: 14,
  autoTuneEnabled: false,
  maxPatternsTracked: 20,
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyToolEvolutionState(): ToolEvolutionState {
  return {
    usageRecords: [],
    efficiencyScores: new Map(),
    usagePatterns: [],
    lastAnalysisTimestamp: Date.now(),
    totalToolsUsed: 0,
    mostUsedTool: null,
  }
}

export function recordToolCall(
  state: ToolEvolutionState,
  toolId: string,
  toolName: string,
  sessionId: string,
  duration: number,
  success: boolean,
  outputTokens: number,
  inputTokens: number,
  contextSnapshot: string = ''
): ToolEvolutionState {
  const record: ToolUsageRecord = {
    toolId,
    toolName,
    sessionId,
    timestamp: Date.now(),
    duration,
    success,
    outputTokens,
    inputTokens,
    contextSnapshot,
  }

  // Update efficiency score for this tool
  const newEfficiencyScores = new Map(state.efficiencyScores)
  const existing = newEfficiencyScores.get(toolId)

  if (existing) {
    const totalCalls = existing.totalCalls + 1
    const newSuccessRate = (existing.successRate * existing.totalCalls + (success ? 1 : 0)) / totalCalls
    const newAvgDuration = (existing.averageDuration * existing.totalCalls + duration) / totalCalls
    const newAvgTokens = (existing.averageTokens * existing.totalCalls + outputTokens + inputTokens) / totalCalls

    newEfficiencyScores.set(toolId, {
      ...existing,
      totalCalls,
      successRate: newSuccessRate,
      averageDuration: newAvgDuration,
      averageTokens: newAvgTokens,
      lastUsed: Date.now(),
      efficiencyScore: calculateEfficiencyScore(newSuccessRate, newAvgDuration, newAvgTokens),
    })
  } else {
    newEfficiencyScores.set(toolId, {
      toolId,
      toolName,
      totalCalls: 1,
      successRate: success ? 1 : 0,
      averageDuration: duration,
      averageTokens: outputTokens + inputTokens,
      lastUsed: Date.now(),
      efficiencyScore: calculateEfficiencyScore(success ? 1 : 0, duration, outputTokens + inputTokens),
    })
  }

  // Update most used tool
  let mostUsedTool = state.mostUsedTool
  if (!mostUsedTool || existing) {
    let maxCalls = 0
    for (const [tid, eff] of Array.from(newEfficiencyScores.entries())) {
      if (eff.totalCalls > maxCalls) {
        maxCalls = eff.totalCalls
        mostUsedTool = tid
      }
    }
  }

  return {
    ...state,
    usageRecords: [...state.usageRecords, record],
    efficiencyScores: newEfficiencyScores,
    lastAnalysisTimestamp: Date.now(),
    totalToolsUsed: newEfficiencyScores.size,
    mostUsedTool,
  }
}

export function calculateEfficiencyScore(
  successRate: number,
  avgDuration: number,
  avgTokens: number
): number {
  // Higher is better: high success, low duration, low tokens
  const successWeight = 0.4
  const durationWeight = 0.3
  const tokenWeight = 0.3

  // Normalize duration (lower is better, <500ms = 100, >3000ms = 0)
  const durationScore = Math.max(0, 100 - (avgDuration / 30))
  // Normalize tokens (lower is better, <100 = 100, >1000 = 0)
  const tokenScore = Math.max(0, 100 - (avgTokens / 10))

  return Math.round(
    successRate * 100 * successWeight +
    durationScore * durationWeight +
    tokenScore * tokenWeight
  )
}

// =============================================================================
// Pattern Detection
// =============================================================================

export function detectToolSequencePatterns(
  state: ToolEvolutionState,
  config: ToolEvolutionConfig = DEFAULT_TOOL_EVOLUTION_CONFIG
): ToolUsagePattern[] {
  if (state.usageRecords.length < config.minCallsForPattern) {
    return []
  }

  const patterns: ToolUsagePattern[] = []
  const sessionGroups = new Map<string, ToolUsageRecord[]>()

  // Group records by session
  for (const record of state.usageRecords) {
    const existing = sessionGroups.get(record.sessionId) ?? []
    existing.push(record)
    sessionGroups.set(record.sessionId, existing)
  }

  // Look for 2-3 tool sequences
  for (const [sessionId, records] of Array.from(sessionGroups.entries())) {
    if (records.length < 2) continue

    // Sort by timestamp
    const sorted = records.sort((a, b) => a.timestamp - b.timestamp)

    // Check 2-tool patterns
    for (let i = 0; i < sorted.length - 1; i++) {
      const seq = [sorted[i].toolId, sorted[i + 1].toolId]
      const patternId = seq.join('→')

      const existingPattern = patterns.find(p => p.patternId === patternId)
      if (existingPattern) {
        existingPattern.frequency++
      } else {
        patterns.push({
          patternId,
          description: `Tool sequence: ${sorted[i].toolName} → ${sorted[i + 1].toolName}`,
          toolSequence: seq,
          frequency: 1,
          averageQualityDelta: 0,
          contextType: 'general',
        })
      }
    }
  }

  // Sort by frequency and trim
  patterns.sort((a, b) => b.frequency - a.frequency)
  return patterns.slice(0, config.maxPatternsTracked)
}

// =============================================================================
// Tool Prediction
// =============================================================================

export function predictNextTool(
  state: ToolEvolutionState,
  currentContext: string,
  recentToolIds: string[]
): ToolPrediction[] {
  const predictions: ToolPrediction[] = []

  // Based on recent tool sequence
  if (recentToolIds.length >= 1) {
    const lastTool = recentToolIds[recentToolIds.length - 1]

    // Find patterns where this tool appears
    for (const pattern of state.usagePatterns) {
      const idx = pattern.toolSequence.indexOf(lastTool)
      if (idx >= 0 && idx < pattern.toolSequence.length - 1) {
        const nextToolId = pattern.toolSequence[idx + 1]
        const efficiency = state.efficiencyScores.get(nextToolId)

        if (efficiency) {
          predictions.push({
            toolId: nextToolId,
            confidence: pattern.frequency / 10, // simplified confidence
            reason: `Often follows ${lastTool} in pattern ${pattern.patternId}`,
            estimatedDuration: efficiency.averageDuration,
            estimatedTokens: efficiency.averageTokens,
          })
        }
      }
    }
  }

  // Sort by confidence
  predictions.sort((a, b) => b.confidence - a.confidence)
  return predictions.slice(0, 3)
}

// =============================================================================
// Efficiency Analysis
// =============================================================================

export function getToolEfficiencyReport(state: ToolEvolutionState): {
  totalCalls: number
  uniqueTools: number
  overallSuccessRate: number
  averageDuration: number
  topTools: ToolEfficiency[]
  staleTools: string[]
  recommendations: string[]
} {
  const recommendations: string[] = []

  const topTools = Array.from(state.efficiencyScores.values())
    .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
    .slice(0, 5)

  const staleTools = Array.from(state.efficiencyScores.entries())
    .filter(([_, eff]) => Date.now() - eff.lastUsed > 14 * 24 * 60 * 60 * 1000)
    .map(([id]) => id)

  if (staleTools.length > 0) {
    recommendations.push(`${staleTools.length} tools have not been used in 14+ days`)
  }

  const overallSuccessRate = state.usageRecords.length > 0
    ? state.usageRecords.filter(r => r.success).length / state.usageRecords.length
    : 0

  const averageDuration = state.usageRecords.length > 0
    ? state.usageRecords.reduce((s, r) => s + r.duration, 0) / state.usageRecords.length
    : 0

  return {
    totalCalls: state.usageRecords.length,
    uniqueTools: state.totalToolsUsed,
    overallSuccessRate,
    averageDuration,
    topTools,
    staleTools,
    recommendations,
  }
}

// =============================================================================
// Evolution Analysis
// =============================================================================

export function analyzeToolEvolution(
  state: ToolEvolutionState,
  config: ToolEvolutionConfig = DEFAULT_TOOL_EVOLUTION_CONFIG
): {
  improvingTools: string[]
  degradingTools: string[]
  newTools: string[]
  abandonedTools: string[]
} {
  const cutoff = Date.now() - config.efficiencyWindowDays * 24 * 60 * 60 * 1000
  const recentRecords = state.usageRecords.filter(r => r.timestamp >= cutoff)

  // Track per-tool success rates
  const recentByTool = new Map<string, { success: number; total: number }>()
  for (const record of recentRecords) {
    const existing = recentByTool.get(record.toolId) ?? { success: 0, total: 0 }
    existing.total++
    if (record.success) existing.success++
    recentByTool.set(record.toolId, existing)
  }

  const improvingTools: string[] = []
  const degradingTools: string[] = []

  for (const [toolId, stats] of Array.from(recentByTool.entries())) {
    const efficiency = state.efficiencyScores.get(toolId)
    if (!efficiency) continue

    const recentSuccessRate = stats.total > 0 ? stats.success / stats.total : 0
    if (recentSuccessRate > efficiency.successRate + 0.1) {
      improvingTools.push(toolId)
    } else if (recentSuccessRate < efficiency.successRate - 0.1) {
      degradingTools.push(toolId)
    }
  }

  // New tools: used in recent but not in overall efficiency map initially
  const allTimeTools = new Set(state.efficiencyScores.keys())
  const recentTools = new Set(recentByTool.keys())
  const newTools = Array.from(recentTools).filter(t => !allTimeTools.has(t))

  const abandonedTools = Array.from(allTimeTools).filter(t => !recentTools.has(t))

  return { improvingTools, degradingTools, newTools, abandonedTools }
}

// =============================================================================
// Session Tool Analysis
// =============================================================================

export function analyzeSessionToolUsage(
  state: ToolEvolutionState,
  session: WritingSessionState
): {
  toolCount: number
  uniqueTools: number
  successRate: number
  averageDuration: number
  mostUsedTool: string | null
  recommendedTool: string | null
} {
  const sessionRecords = state.usageRecords.filter(r => r.sessionId === session.id)

  if (sessionRecords.length === 0) {
    // Return recommendations based on context
    const predictions = predictNextTool(state, 'session', [])
    return {
      toolCount: 0,
      uniqueTools: 0,
      successRate: 0,
      averageDuration: 0,
      mostUsedTool: null,
      recommendedTool: predictions[0]?.toolId ?? null,
    }
  }

  const toolCounts = new Map<string, number>()
  for (const record of sessionRecords) {
    toolCounts.set(record.toolId, (toolCounts.get(record.toolId) ?? 0) + 1)
  }

  let mostUsedTool: string | null = null
  let maxCount = 0
  for (const [toolId, count] of Array.from(toolCounts.entries())) {
    if (count > maxCount) {
      maxCount = count
      mostUsedTool = toolId
    }
  }

  const successRate = sessionRecords.filter(r => r.success).length / sessionRecords.length
  const averageDuration = sessionRecords.reduce((s, r) => s + r.duration, 0) / sessionRecords.length

  return {
    toolCount: sessionRecords.length,
    uniqueTools: toolCounts.size,
    successRate,
    averageDuration,
    mostUsedTool,
    recommendedTool: null,
  }
}

// =============================================================================
// Formatting
// =============================================================================

export function formatToolEvolutionSummary(state: ToolEvolutionState): string {
  const report = getToolEfficiencyReport(state)

  const lines = [
    '=== Tool Evolution Summary ===',
    `Total Tool Calls: ${report.totalCalls}`,
    `Unique Tools Used: ${report.uniqueTools}`,
    `Overall Success Rate: ${(report.overallSuccessRate * 100).toFixed(1)}%`,
    `Average Duration: ${report.averageDuration.toFixed(0)}ms`,
    '',
    '--- Top Tools ---',
  ]

  for (const tool of report.topTools) {
    lines.push(`${tool.toolName}: ${tool.efficiencyScore}/100 (${tool.totalCalls} calls, ${(tool.successRate * 100).toFixed(0)}% success)`)
  }

  if (report.staleTools.length > 0) {
    lines.push('')
    lines.push(`--- Stale Tools (${report.staleTools.length}) ---`)
    lines.push(report.staleTools.join(', '))
  }

  return lines.join('\n')
}