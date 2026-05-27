/**
 * SkillEvolutionEngine Types - V78
 * Bridge between ToolCallAnalyzer and SkillGraph
 * 
 * Integrates tool call patterns → skill quality signals → skill promotion/demotion decisions
 * Creates a continuous evolution feedback loop
 */

import type { SkillLevel } from '../evolution/SelfEvolutionTypes'
import type { ToolChain } from '../analytics/ToolCallAnalyzer'
import type { SkillNode, SkillHealthScore, EvolutionRecommendation } from './SkillGraph'

// ===============================================================================
// Evolution Signal Types
// ===============================================================================

export type EvolutionSignalType = 
  | 'high_frequency_low_quality'    // Tool called often but quality declining
  | 'low_frequency_high_quality'     // Rare tool but always succeeds
  | 'pattern_stabilizing'           // Same pattern observed N+ times with high success
  | 'chain_evolving'                // Tool chain is changing/expanding
  | 'skill_gap_detected'             // Missing skill detected
  | 'overreliance_warning'           // Single tool used too frequently
  | 'cross_session_improvement'      // Same task better in new session

export interface EvolutionSignal {
  id: string
  type: EvolutionSignalType
  source: 'tool_call' | 'skill_graph' | 'pattern_library' | 'user_feedback'
  toolId?: string
  skillId?: string
  pattern?: string
  description: string
  evidence: Record<string, unknown>  // Supporting data
  severity: 'info' | 'warning' | 'action_required'
  createdAt: number
  resolvedAt?: number
}

export interface EvolutionDecision {
  id: string
  signalId: string
  action: 'promote' | 'demote' | 'deprecate' | 'consolidate' | 'split' | 'create' | 'no_action'
  targetSkillId: string
  reason: string
  confidence: number  // 0-1
  expectedImpact: {
    qualityDelta: number      // Expected quality change (+/-)
    vitalityDelta: number     // Expected vitality change (+/-)
    activationDelta: number  // Expected activation change (+/-)
  }
  createdAt: number
  implementedAt?: number
  revertedAt?: number
  revertReason?: string
}

// ===============================================================================
// Evolution Cycle Types
// ===============================================================================

export interface EvolutionCycle {
  id: string
  phase: 'collect' | 'analyze' | 'decide' | 'implement' | 'validate'
  startedAt: number
  completedAt?: number
  signals: EvolutionSignal[]
  decisions: EvolutionDecision[]
  outcomes: EvolutionOutcome[]
}

export interface EvolutionOutcome {
  decisionId: string
  skillId: string
  actualQualityDelta: number
  actualVitalityDelta: number
  actualActivationDelta: number
  validatedAt: number
  success: boolean
  notes?: string
}

// ===============================================================================
// Integration Types (bridging ToolCallAnalyzer ↔ SkillGraph)
// ===============================================================================

export interface ToolSkillMapping {
  toolId: string
  skillId: string
  contribution: number  // 0-1, how much this tool contributes to the skill
  isPrimary: boolean
}

export interface SkillToolContribution {
  skillId: string
  skillName: string
  toolIds: string[]
  totalCalls: number
  avgQuality: number
  qualityTrend: 'improving' | 'stable' | 'declining'
  healthScore: SkillHealthScore
  recommendedAction: 'promote' | 'demote' | 'deprecate' | 'consolidate' | 'split' | 'create' | 'no_action'
}

export interface EvolutionIntegrationReport {
  skillToolContributions: SkillToolContribution[]
  signals: EvolutionSignal[]
  pendingDecisions: EvolutionDecision[]
  recentDecisions: EvolutionDecision[]
  cycleStatus: 'idle' | 'collecting' | 'analyzing' | 'deciding' | 'implementing' | 'validating'
  lastCycleAt?: number
}

// ===============================================================================
// Constants
// ===============================================================================

export const EVOLUTION_CONFIG = {
  // Frequency thresholds
  LOW_FREQUENCY_THRESHOLD: 5,
  HIGH_FREQUENCY_THRESHOLD: 30,
  
  // Quality thresholds
  PROMOTION_QUALITY_THRESHOLD: 0.8,
  DEMOTION_QUALITY_THRESHOLD: 0.4,
  DEPRECATION_QUALITY_THRESHOLD: 0.3,
  
  // Vitality thresholds
  LOW_VITALITY_THRESHOLD: 0.2,
  HIGH_VITALITY_THRESHOLD: 0.7,
  
  // Pattern thresholds
  STABILIZING_PATTERN_MIN_OCCURRENCES: 5,
  STABILIZING_PATTERN_MIN_SUCCESS_RATE: 0.85,
  
  // Cycle intervals
  MIN_CYCLE_INTERVAL_MS: 24 * 60 * 60 * 1000,  // 24 hours
  
  // Validation window
  VALIDATION_WINDOW_MS: 7 * 24 * 60 * 60 * 1000  // 7 days
} as const

// ===============================================================================
// Helper Functions
// ===============================================================================

/**
 * Create a skill evolution signal
 */
export function createSignal(
  type: EvolutionSignalType,
  source: EvolutionSignal['source'],
  description: string,
  evidence: Record<string, unknown> = {},
  severity: EvolutionSignal['severity'] = 'info',
  toolId?: string,
  skillId?: string,
  pattern?: string
): EvolutionSignal {
  return {
    id: `signal_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    source,
    toolId,
    skillId,
    pattern,
    description,
    evidence,
    severity,
    createdAt: Date.now()
  }
}

/**
 * Create an evolution decision from a signal
 */
export function createDecision(
  signal: EvolutionSignal,
  action: EvolutionDecision['action'],
  targetSkillId: string,
  reason: string,
  confidence: number,
  expectedImpact: EvolutionDecision['expectedImpact']
): EvolutionDecision {
  return {
    id: `decision_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    signalId: signal.id,
    action,
    targetSkillId,
    reason,
    confidence,
    expectedImpact,
    createdAt: Date.now()
  }
}

/**
 * Determine action recommendation based on quality and vitality
 */
export function determineAction(
  quality: number,
  vitality: number,
  healthScore: SkillHealthScore
): EvolutionDecision['action'] {
  if (quality >= EVOLUTION_CONFIG.PROMOTION_QUALITY_THRESHOLD && vitality >= EVOLUTION_CONFIG.HIGH_VITALITY_THRESHOLD) {
    return 'promote'
  }
  if (quality < EVOLUTION_CONFIG.DEPRECATION_QUALITY_THRESHOLD && healthScore.alerts.length >= 2) {
    return 'deprecate'
  }
  if (quality < EVOLUTION_CONFIG.DEMOTION_QUALITY_THRESHOLD || vitality < EVOLUTION_CONFIG.LOW_VITALITY_THRESHOLD) {
    return 'demote'
  }
  return 'no_action'
}

/**
 * Map tool chains to skill evolution signals
 */
export function mapChainsToSignals(chains: ToolChain[]): EvolutionSignal[] {
  const signals: EvolutionSignal[] = []

  for (const chain of chains) {
    if (chain.totalOccurrences >= EVOLUTION_CONFIG.STABILIZING_PATTERN_MIN_OCCURRENCES &&
        chain.avgSuccessRate >= EVOLUTION_CONFIG.STABILIZING_PATTERN_MIN_SUCCESS_RATE) {
      signals.push(createSignal(
        'pattern_stabilizing',
        'tool_call',
        `Pattern '${chain.pattern}' has stabilized (${chain.totalOccurrences}x, ${(chain.avgSuccessRate * 100).toFixed(0)}% success)`,
        {
          chainPattern: chain.pattern,
          occurrences: chain.totalOccurrences,
          successRate: chain.avgSuccessRate,
          avgDurationMs: chain.avgDurationMs
        },
        'info',
        undefined,
        undefined,
        chain.pattern
      ))
    }
  }

  return signals
}

/**
 * Detect overreliance on single tool
 */
export function detectOverreliance(
  toolCallCounts: Map<string, number>,
  totalCalls: number
): EvolutionSignal[] {
  const signals: EvolutionSignal[] = []
  const overrelianceThreshold = 0.4  // 40% of all calls

  for (const [toolId, count] of Array.from(toolCallCounts.entries())) {
    const ratio = count / totalCalls
    if (ratio >= overrelianceThreshold) {
      signals.push(createSignal(
        'overreliance_warning',
        'tool_call',
        `Tool '${toolId}' accounts for ${(ratio * 100).toFixed(0)}% of all calls (${count}/${totalCalls})`,
        { toolId, count, totalCalls, ratio },
        'warning',
        toolId
      ))
    }
  }

  return signals
}

/**
 * Detect high-frequency/low-quality signals from tool call analysis
 */
export function detectQualityIssues(
  toolCallCounts: Map<string, number>,
  toolQualityMap: Map<string, { success: number; total: number }>
): EvolutionSignal[] {
  const signals: EvolutionSignal[] = []

  for (const [toolId, { success, total }] of Array.from(toolQualityMap.entries())) {
    if (total < 5) continue

    const quality = success / total
    const count = toolCallCounts.get(toolId) || 0

    if (count >= EVOLUTION_CONFIG.HIGH_FREQUENCY_THRESHOLD && quality < EVOLUTION_CONFIG.DEMOTION_QUALITY_THRESHOLD) {
      signals.push(createSignal(
        'high_frequency_low_quality',
        'tool_call',
        `Tool '${toolId}' called ${count} times but quality is only ${(quality * 100).toFixed(0)}%`,
        { toolId, count, quality, success, total },
        'action_required',
        toolId
      ))
    }

    if (count <= EVOLUTION_CONFIG.LOW_FREQUENCY_THRESHOLD && quality >= EVOLUTION_CONFIG.PROMOTION_QUALITY_THRESHOLD) {
      signals.push(createSignal(
        'low_frequency_high_quality',
        'tool_call',
        `Tool '${toolId}' rarely used (${count}x) but achieves ${(quality * 100).toFixed(0)}% quality`,
        { toolId, count, quality, success, total },
        'info',
        toolId
      ))
    }
  }

  return signals
}

/**
 * Compute skill-tool contributions from tool chains and skill nodes
 */
export function computeSkillToolContributions(
  chains: ToolChain[],
  skillNodes: SkillNode[]
): SkillToolContribution[] {
  const contributions: SkillToolContribution[] = []
  const nodeMap = new Map(skillNodes.map(n => [n.skillId, n]))

  for (const node of skillNodes) {
    // Find chains where tools from this skill were used
    const relevantToolIds = new Set<string>()
    // In real integration, tools would be mapped to skills
    // For now, we'll use the skill's tags as a proxy

    contributions.push({
      skillId: node.skillId,
      skillName: node.name,
      toolIds: Array.from(relevantToolIds),
      totalCalls: node.activationCount,
      avgQuality: node.quality,
      qualityTrend: node.vitality > 0.7 ? 'improving' : node.vitality > 0.3 ? 'stable' : 'declining',
      healthScore: { 
        skillId: node.skillId,
        overallScore: node.quality * 0.4 + node.vitality * 0.3 + Math.min(0.9, 0.5 + node.relationships.length * 0.1) * 0.3,
        qualityScore: node.quality,
        vitalityScore: node.vitality,
        relationshipScore: node.relationships.length > 0 ? Math.min(0.9, 0.5 + node.relationships.length * 0.1) : 0.2,
        trend: node.vitality > 0.7 ? 'improving' : node.vitality > 0.3 ? 'stable' : 'declining',
        alerts: [],
        recommendations: []
      },
      recommendedAction: determineAction(node.quality, node.vitality, { 
        skillId: node.skillId, 
        overallScore: node.quality * 0.4 + node.vitality * 0.3 + 0.2,
        qualityScore: node.quality,
        vitalityScore: node.vitality,
        relationshipScore: 0.2,
        trend: 'stable',
        alerts: [],
        recommendations: []
      })
    })
  }

  return contributions
}

/**
 * Generate evolution recommendations from signals and skill contributions
 */
export function generateEvolutionRecommendations(
  signals: EvolutionSignal[],
  contributions: SkillToolContribution[]
): EvolutionDecision[] {
  const decisions: EvolutionDecision[] = []

  for (const signal of signals) {
    if (signal.severity !== 'action_required') continue

    if (signal.type === 'high_frequency_low_quality' && signal.toolId) {
      // Find associated skill
      const contribution = contributions.find(c => c.toolIds.includes(signal.toolId!))
      if (contribution) {
        decisions.push(createDecision(
          signal,
          contribution.healthScore.overallScore < 0.4 ? 'deprecate' : 'demote',
          contribution.skillId,
          `High-frequency tool '${signal.toolId}' with quality ${contribution.avgQuality}`,
          0.8,
          { qualityDelta: -0.1, vitalityDelta: -0.2, activationDelta: -10 }
        ))
      }
    }
  }

  // Add recommendations from skill graph
  for (const contrib of contributions) {
    if (contrib.recommendedAction !== 'no_action') {
      decisions.push(createDecision(
        createSignal(
          contrib.recommendedAction === 'promote' ? 'low_frequency_high_quality' : 'high_frequency_low_quality',
          'skill_graph',
          `Skill '${contrib.skillName}' recommends ${contrib.recommendedAction}`,
          { quality: contrib.avgQuality, vitality: contrib.healthScore.vitalityScore },
          'info',
          undefined,
          contrib.skillId
        ),
        contrib.recommendedAction,
        contrib.skillId,
        `Based on quality=${(contrib.avgQuality * 100).toFixed(0)}%, vitality=${(contrib.healthScore.vitalityScore * 100).toFixed(0)}%`,
        0.75,
        {
          qualityDelta: contrib.recommendedAction === 'promote' ? 0.05 : -0.05,
          vitalityDelta: contrib.recommendedAction === 'promote' ? 0.1 : -0.1,
          activationDelta: contrib.recommendedAction === 'promote' ? 5 : -5
        }
      ))
    }
  }

  return decisions
}

/**
 * Format decision for display
 */
export function formatDecision(decision: EvolutionDecision): string {
  return `${decision.action.toUpperCase()} skill '${decision.targetSkillId}': ${decision.reason} (confidence: ${(decision.confidence * 100).toFixed(0)}%)`
}