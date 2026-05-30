/**
 * WritingSessionManager Types - V81
 * Intelligent Writing Session Orchestration
 * 
 * Manages complete writing sessions with:
 * - Phase-based session structure (planning → drafting → revision → polish)
 * - Real-time quality monitoring using NarrativeCoherenceChecker
 * - Energy/tempo management to prevent burnout
 * - Multi-turn context preservation with Dream Memory integration
 * - Adaptive phase transitions based on quality metrics
 */

import type { CoherenceScore } from '../narrative/NarrativeCoherenceChecker'
import type { ToolCall } from '../agents/ToolExecutor'
import type { SkillLevel } from '../evolution/SelfEvolutionTypes'

// ===============================================================================
// Session Phase Types
// ===============================================================================

export type SessionPhase = 
  | 'planning'      // Outlining, world-building setup, character planning
  | 'drafting'      // Initial content generation
  | 'revision'      // Plot consistency, character consistency review
  | 'polishing'     // Style, grammar, rhythm refinement
  | 'completed'     // Session wrapped up

export type PhaseTransitionTrigger =
  | 'quality_threshold'     // Quality score crossed threshold
  | 'time_budget_exceeded' // Time limit reached
  | 'energy_depleted'       // Writer energy too low
  | 'manual_override'       // User explicitly transitions
  | 'goal_achieved'        // Planned content completed
  | 'stagnation_detected'  // No progress for N iterations

export interface PhaseMetrics {
  phase: SessionPhase
  startTime: number
  durationMs: number
  qualityScore: number        // 0-1 from coherence checker
  productivityScore: number   // 0-1, words/output per minute
  toolCalls: number
  energyConsumed: number       // 0-100 scale
  transitions: number         // Number of sub-phase transitions
  qualityHistory: number[]    // Rolling quality scores
}

export interface WritingSessionConfig {
  sessionName: string
  initialPhase: SessionPhase
  qualityThresholds: {
    planning: number          // Minimum quality to proceed from planning
    drafting: number         // Minimum quality during drafting
    revision: number         // Minimum quality to pass revision
    polish: number           // Minimum quality to complete
  }
  timeBudgetMs: number        // Max session duration
  energyBudget: number        // Max energy consumption (0-100)
  autoSaveIntervalMs: number  // Auto-save frequency
  stagnationThreshold: number // Iterations with <1% improvement to trigger transition
  enableRealTimeMonitoring: boolean
  enableDreamMemoryIntegration: boolean
}

// ===============================================================================
// Writing Session State
// ===============================================================================

export interface WritingSessionState {
  id: string
  sessionName: string
  currentPhase: SessionPhase
  phaseHistory: PhaseMetrics[]
  currentQualityScore: number
  rollingQualityScores: number[]
  startTime: number
  lastUpdateTime: number
  totalToolCalls: number
  totalWordsGenerated: number
  energyLevel: number          // 0-100
  activeContext: SessionContext
  pendingReviews: ReviewTask[]
  completedGoals: string[]
  stagnationCount: number
  pauseReason?: string
  // Dashboard integration
  currentMomentum?: number    // 0-100
  toolCallCount?: number
  lastToolCallTime?: number
  qualityHistory?: number[]
  totalWordsWritten?: number
  sessionStartTime?: number
}

export interface SessionContext {
  currentChapter: number
  currentScene?: string
  activeCharacters: string[]
  recentToolCalls: ToolCall[]  // ToolCall uses startTime, not timestamp
  lastCoherenceScore?: CoherenceScore
  qualityTrend: 'improving' | 'stable' | 'declining'
  lastSignificantChange?: {
    type: 'character_added' | 'plot_twist' | 'world_expanded' | 'dialogue_added'
    timestamp: number
    description: string
  }
}

export interface ReviewTask {
  id: string
  type: 'character' | 'plot' | 'world' | 'style' | 'timeline'
  priority: 'low' | 'normal' | 'high' | 'critical'
  description: string
  assignedPhase?: SessionPhase
  completed: boolean
  createdAt: number
}

// ===============================================================================
// Energy & Tempo Management
// ===============================================================================

export type EnergyLevel = 'fresh' | 'focused' | 'tired' | 'exhausted'

export interface TempoProfile {
  energyLevel: EnergyLevel
  recommendedPhase: SessionPhase | null
  optimalSessionLength: number  // minutes
  breakRecommendation: 'none' | 'short' | 'long'
  toolCallThrottle: number      // Max tool calls per 5 min to prevent over-working
}

export interface SessionEnergySnapshot {
  timestamp: number
  energyLevel: number
  phase: SessionPhase
  qualityScore: number
  toolsCalledLast5Min: number
}

// ===============================================================================
// Quality Trend Analysis
// ===============================================================================

export type QualityTrend = 'improving' | 'stable' | 'declining' | 'volatile'

export interface QualityAnalysis {
  trend: QualityTrend
  volatility: number          // 0-1, how much quality fluctuates
  averageScore: number        // Rolling average
  bestScore: number
  worstScore: number
  trendReason: string
  projectedCompletionQuality: number
}

// ===============================================================================
// Session Events
// ===============================================================================

export type SessionEventType =
  | 'phase_started'
  | 'phase_completed'
  | 'quality_improved'
  | 'quality_declined'
  | 'stagnation_detected'
  | 'energy_low'
  | 'review_task_created'
  | 'review_task_completed'
  | 'tool_overuse_detected'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed'
  | 'milestone_reached'

export interface SessionEvent {
  id: string
  type: SessionEventType
  timestamp: number
  phase?: SessionPhase
  details: string
  metricsSnapshot?: Partial<PhaseMetrics>
}

// ===============================================================================
// Adaptive Recommendations
// ===============================================================================

export interface PhaseRecommendation {
  recommendedPhase: SessionPhase
  confidence: number          // 0-1
  reasoning: string
  expectedQualityImpact: number  // -1 to +1
  estimatedDurationMs: number
}

export interface SessionRecommendation {
  type: 'phase_transition' | 'break' | 'tool_switch' | 'context_refresh' | 'energy_recovery'
  priority: 'low' | 'normal' | 'high'
  title: string
  reasoning: string
  expectedOutcome: string
  actionData?: Record<string, unknown>
}

// ===============================================================================
// Helper Functions
// ===============================================================================

/**
 * Calculate current energy level based on session history
 */
export function calculateCurrentEnergy(
  startTime: number,
  toolCalls: number,
  currentPhase: SessionPhase,
  lastEnergySnapshot?: SessionEnergySnapshot
): number {
  const elapsedMinutes = (Date.now() - startTime) / 60000
  
  // Base energy decay per minute by phase
  const decayRates: Record<SessionPhase, number> = {
    planning: 0.4,
    drafting: 0.8,
    revision: 0.5,
    polishing: 0.6,
    completed: 0
  }

  const elapsedDecay = elapsedMinutes * decayRates[currentPhase]
  const toolDecay = toolCalls * 0.05  // Each tool call costs energy
  
  // If we have a snapshot, use it
  const lastEnergy = lastEnergySnapshot?.energyLevel ?? 100
  
  return Math.max(0, Math.min(100, lastEnergy - elapsedDecay - toolDecay))
}

/**
 * Determine energy level category
 */
export function getEnergyLevel(energy: number): EnergyLevel {
  if (energy > 80) return 'fresh'
  if (energy > 50) return 'focused'
  if (energy > 20) return 'tired'
  return 'exhausted'
}

/**
 * Get tempo profile for current energy state
 */
export function getTempoProfile(energy: number, currentPhase: SessionPhase): TempoProfile {
  const level = getEnergyLevel(energy)
  
  const profiles: Record<EnergyLevel, TempoProfile> = {
    fresh: {
      energyLevel: 'fresh',
      recommendedPhase: null,  // Keep current
      optimalSessionLength: 45,
      breakRecommendation: 'none',
      toolCallThrottle: 100
    },
    focused: {
      energyLevel: 'focused',
      recommendedPhase: currentPhase === 'polishing' ? 'revision' : currentPhase,
      optimalSessionLength: 30,
      breakRecommendation: 'short',
      toolCallThrottle: 60
    },
    tired: {
      energyLevel: 'tired',
      recommendedPhase: currentPhase === 'drafting' ? 'revision' : 'polishing',
      optimalSessionLength: 15,
      breakRecommendation: 'long',
      toolCallThrottle: 30
    },
    exhausted: {
      energyLevel: 'exhausted',
      recommendedPhase: 'completed',
      optimalSessionLength: 0,
      breakRecommendation: 'long',
      toolCallThrottle: 0
    }
  }

  return profiles[level]
}

/**
 * Analyze quality trend from rolling scores
 */
export function analyzeQualityTrend(scores: number[]): QualityAnalysis {
  if (scores.length < 2) {
    return {
      trend: 'stable',
      volatility: 0,
      averageScore: scores[0] ?? 0,
      bestScore: scores[0] ?? 0,
      worstScore: scores[0] ?? 0,
      trendReason: 'Insufficient data for trend analysis',
      projectedCompletionQuality: scores[0] ?? 0.5
    }
  }

  // Calculate trend using simple linear regression slope
  const n = scores.length
  const sumX = (n * (n - 1)) / 2
  const sumY = scores.reduce((a, b) => a + b, 0)
  const sumXY = scores.reduce((sum, y, x) => sum + x * y, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  
  // Calculate volatility (standard deviation of differences)
  const diffs = scores.slice(1).map((s, i) => Math.abs(s - scores[i]))
  const volatility = diffs.reduce((a, b) => a + b, 0) / diffs.length
  
  const trend: QualityTrend = slope > 0.01 ? 'improving' : slope < -0.01 ? 'declining' : 'volatile'
  
  const trendReason = 
    trend === 'improving' ? `Quality increasing at ${(slope * 100).toFixed(1)}% per step` :
    trend === 'declining' ? `Quality decreasing at ${(Math.abs(slope) * 100).toFixed(1)}% per step` :
    volatility > 0.15 ? 'Quality fluctuating significantly' :
    'Quality stable with minor variations'

  // Project final quality based on trend
  const projectedCompletionQuality = Math.min(1, Math.max(0, 
    scores[scores.length - 1] + slope * (10 - scores.length)
  ))

  return {
    trend,
    volatility,
    averageScore: sumY / n,
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores),
    trendReason,
    projectedCompletionQuality
  }
}

/**
 * Determine if phase transition should occur
 */
export function shouldTransitionPhase(
  currentPhase: SessionPhase,
  metrics: PhaseMetrics,
  config: WritingSessionConfig,
  qualityAnalysis: QualityAnalysis
): { should: boolean; trigger: PhaseTransitionTrigger | null; reason: string } {
  const { qualityThresholds, timeBudgetMs, stagnationThreshold } = config
  const elapsedMs = Date.now() - metrics.startTime

  // Time budget check
  if (elapsedMs > timeBudgetMs) {
    return { should: true, trigger: 'time_budget_exceeded', reason: `Time budget exceeded (${Math.round(elapsedMs / 60000)}min vs ${Math.round(timeBudgetMs / 60000)}min limit)` }
  }

  // Quality threshold checks
  const thresholds: Record<SessionPhase, number> = {
    planning: qualityThresholds.planning,
    drafting: qualityThresholds.drafting,
    revision: qualityThresholds.revision,
    polishing: qualityThresholds.polish,
    completed: 1.0
  }

  if (metrics.qualityScore >= thresholds[currentPhase]) {
    return { should: true, trigger: 'quality_threshold', reason: `Quality ${(metrics.qualityScore * 100).toFixed(0)}% meets threshold ${(thresholds[currentPhase] * 100).toFixed(0)}% for ${currentPhase}` }
  }

  // Stagnation check
  if (metrics.qualityHistory.length >= stagnationThreshold) {
    const recent = metrics.qualityHistory.slice(-stagnationThreshold)
    const first = recent[0]
    const last = recent[recent.length - 1]
    if (Math.abs(last - first) < 0.01) {
      return { should: true, trigger: 'stagnation_detected', reason: `No significant quality improvement in ${stagnationThreshold} iterations` }
    }
  }

  return { should: false, trigger: null, reason: 'No transition needed' }
}

/**
 * Generate phase transition recommendation
 */
export function recommendNextPhase(
  currentPhase: SessionPhase,
  qualityAnalysis: QualityAnalysis,
  energy: number,
  completedGoals: string[]
): PhaseRecommendation {
  const phaseOrder: SessionPhase[] = ['planning', 'drafting', 'revision', 'polishing', 'completed']
  const currentIndex = phaseOrder.indexOf(currentPhase)
  
  // Default: move to next phase
  let recommendedPhase = phaseOrder[Math.min(currentIndex + 1, phaseOrder.length - 1)]
  let confidence = 0.7
  let reasoning = `Default progression from ${currentPhase}`
  let expectedImpact = 0.1

  if (qualityAnalysis.trend === 'declining' && currentPhase !== 'revision') {
    recommendedPhase = 'revision'
    reasoning = 'Quality declining - switch to revision to address issues before continuing'
    expectedImpact = 0.15
    confidence = 0.8
  } else if (qualityAnalysis.trend === 'improving' && currentPhase === 'drafting') {
    // Great momentum - extend drafting slightly (already in drafting)
    reasoning = 'Quality improving - maintain drafting momentum'
    confidence = 0.85
    expectedImpact = 0.05
  } else if (energy < 30 && currentPhase !== 'polishing') {
    recommendedPhase = 'polishing'
    reasoning = 'Low energy - switch to less demanding polishing phase'
    expectedImpact = -0.05
    confidence = 0.75
  } else if (completedGoals.length > 3 && currentPhase === 'drafting') {
    recommendedPhase = 'revision'
    reasoning = 'Multiple goals completed - good checkpoint to review before continuing'
    expectedImpact = 0.1
    confidence = 0.8
  }

  return {
    recommendedPhase,
    confidence,
    reasoning,
    expectedQualityImpact: expectedImpact,
    estimatedDurationMs: recommendedPhase === 'completed' ? 0 : (recommendedPhase === 'polishing' ? 300000 : 600000)
  }
}

/**
 * Create session event
 */
export function createSessionEvent(
  type: SessionEventType,
  details: string,
  phase?: SessionPhase,
  metricsSnapshot?: Partial<PhaseMetrics>
): SessionEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    timestamp: Date.now(),
    phase,
    details,
    metricsSnapshot
  }
}

/**
 * Check if tool usage is excessive (over-use detection)
 */
export function detectToolOveruse(
  recentToolCalls: ToolCall[],
  windowMs: number = 300000  // 5 minutes
): { isOveruse: boolean; overuseRatio: number; recommendedThrottle: number } {
  const now = Date.now()
  const recentCalls = recentToolCalls.filter(tc => now - tc.startTime < windowMs)
  
  const callsPerMinute = (recentCalls.length / windowMs) * 60000
  
  // Throttle limits by phase (approximate)
  const throttleLimit = 12  // calls per minute
  
  if (callsPerMinute > throttleLimit) {
    return {
      isOveruse: true,
      overuseRatio: callsPerMinute / throttleLimit,
      recommendedThrottle: Math.round(throttleLimit * 0.8)
    }
  }
  
  return {
    isOveruse: false,
    overuseRatio: callsPerMinute / throttleLimit,
    recommendedThrottle: throttleLimit
  }
}

/**
 * Format session summary for human-readable output
 */
export function formatSessionSummary(state: WritingSessionState): string {
  const currentPhaseMetrics = state.phaseHistory[state.phaseHistory.length - 1]
  const elapsedMs = Date.now() - state.startTime
  const elapsedMin = Math.round(elapsedMs / 60000)
  
  const lines = [
    `=== Writing Session: ${state.sessionName} ===`,
    `ID: ${state.id}`,
    `Phase: ${state.currentPhase}`,
    `Quality: ${(state.currentQualityScore * 100).toFixed(0)}% (trend: ${state.activeContext.qualityTrend})`,
    `Energy: ${state.energyLevel.toFixed(0)}%`,
    `Elapsed: ${elapsedMin}min`,
    `Tool Calls: ${state.totalToolCalls}`,
    `Words: ${state.totalWordsGenerated}`,
    `Goals Completed: ${state.completedGoals.length}`,
    `Pending Reviews: ${state.pendingReviews.filter(r => !r.completed).length}`,
    `Stagnation Count: ${state.stagnationCount}`
  ]
  
  if (currentPhaseMetrics) {
    lines.push(`Phase Duration: ${Math.round(currentPhaseMetrics.durationMs / 60000)}min`)
  }
  
  return lines.join('\n')
}

/**
 * Get default session configuration
 */
export const DEFAULT_SESSION_CONFIG: WritingSessionConfig = {
  sessionName: 'Default Writing Session',
  initialPhase: 'planning',
  qualityThresholds: {
    planning: 0.6,
    drafting: 0.5,
    revision: 0.7,
    polish: 0.75
  },
  timeBudgetMs: 3600000,       // 60 minutes
  energyBudget: 80,
  autoSaveIntervalMs: 120000,   // 2 minutes
  stagnationThreshold: 5,
  enableRealTimeMonitoring: true,
  enableDreamMemoryIntegration: true
}

/**
 * Create initial session state
 */
export function createInitialSessionState(
  id: string,
  sessionName: string,
  config: WritingSessionConfig = DEFAULT_SESSION_CONFIG
): WritingSessionState {
  return {
    id,
    sessionName,
    currentPhase: config.initialPhase,
    phaseHistory: [{
      phase: config.initialPhase,
      startTime: Date.now(),
      durationMs: 0,
      qualityScore: 0.5,
      productivityScore: 0,
      toolCalls: 0,
      energyConsumed: 0,
      transitions: 0,
      qualityHistory: []
    }],
    currentQualityScore: 0.5,
    rollingQualityScores: [0.5],
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    totalToolCalls: 0,
    totalWordsGenerated: 0,
    energyLevel: 100,
    activeContext: {
      currentChapter: 1,
      activeCharacters: [],
      recentToolCalls: [],
      qualityTrend: 'stable',
    },
    pendingReviews: [],
    completedGoals: [],
    stagnationCount: 0
  }
}