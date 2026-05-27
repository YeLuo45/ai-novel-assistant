/**
 * SkillEvolutionEngine Tests - V78
 * Tests for Tool-to-Skill Evolution Bridge
 */

import { describe, it, expect } from 'vitest'
import {
  type EvolutionSignalType,
  type EvolutionSignal,
  type EvolutionDecision,
  type SkillToolContribution,
  EVOLUTION_CONFIG,
  createSignal,
  createDecision,
  determineAction,
  mapChainsToSignals,
  detectOverreliance,
  detectQualityIssues,
  computeSkillToolContributions,
  generateEvolutionRecommendations,
  formatDecision
} from './SkillEvolutionEngine'

import type { SkillNode } from './SkillGraph'

// ===============================================================================
// Helper
// ===============================================================================

function createMockSkillNode(overrides: Partial<SkillNode> = {}): SkillNode {
  const now = Date.now()
  return {
    id: 'test_node',
    skillId: 'skill_test',
    name: 'Test Skill',
    description: 'A test skill',
    level: 'stable',
    category: 'writing',
    tags: ['genre', 'fantasy'],
    quality: 0.8,
    vitality: 0.7,
    relationships: [],
    activationCount: 50,
    successCount: 45,
    failureCount: 5,
    avgQualityScore: 0.85,
    createdAt: now - 30 * 24 * 60 * 60 * 1000,
    lastActivatedAt: now - 1 * 24 * 60 * 60 * 1000,
    lastUpdatedAt: now,
    metadata: {},
    ...overrides
  }
}

// ===============================================================================
// EVOLUTION_CONFIG Tests
// ===============================================================================

describe('EVOLUTION_CONFIG', () => {
  it('should have all required config values', () => {
    expect(EVOLUTION_CONFIG.LOW_FREQUENCY_THRESHOLD).toBe(5)
    expect(EVOLUTION_CONFIG.HIGH_FREQUENCY_THRESHOLD).toBe(30)
    expect(EVOLUTION_CONFIG.PROMOTION_QUALITY_THRESHOLD).toBe(0.8)
    expect(EVOLUTION_CONFIG.DEMOTION_QUALITY_THRESHOLD).toBe(0.4)
    expect(EVOLUTION_CONFIG.DEPRECATION_QUALITY_THRESHOLD).toBe(0.3)
  })

  it('should have valid threshold relationships', () => {
    expect(EVOLUTION_CONFIG.PROMOTION_QUALITY_THRESHOLD).toBeGreaterThan(EVOLUTION_CONFIG.DEMOTION_QUALITY_THRESHOLD)
    expect(EVOLUTION_CONFIG.DEMOTION_QUALITY_THRESHOLD).toBeGreaterThan(EVOLUTION_CONFIG.DEPRECATION_QUALITY_THRESHOLD)
    expect(EVOLUTION_CONFIG.LOW_VITALITY_THRESHOLD).toBeLessThan(EVOLUTION_CONFIG.HIGH_VITALITY_THRESHOLD)
  })
})

// ===============================================================================
// createSignal Tests
// ===============================================================================

describe('createSignal', () => {
  it('should create signal with all fields', () => {
    const signal = createSignal('pattern_stabilizing', 'tool_call', 'Pattern detected', {}, 'info', 'tool1', 'skill1', 'patternA')
    expect(signal.id).toMatch(/^signal_/)
    expect(signal.type).toBe('pattern_stabilizing')
    expect(signal.source).toBe('tool_call')
    expect(signal.toolId).toBe('tool1')
    expect(signal.skillId).toBe('skill1')
    expect(signal.pattern).toBe('patternA')
    expect(signal.description).toBe('Pattern detected')
    expect(signal.severity).toBe('info')
    expect(signal.resolvedAt).toBeUndefined()
  })

  it('should auto-generate id with timestamp', () => {
    const signal = createSignal('overreliance_warning', 'tool_call', 'Too many calls')
    expect(signal.id).toMatch(/^signal_overreliance_warning_\d+_/)
  })
})

// ===============================================================================
// createDecision Tests
// ===============================================================================

describe('createDecision', () => {
  it('should create decision with expected impact', () => {
    const signal = createSignal('high_frequency_low_quality', 'tool_call', 'Test signal', {}, 'action_required', 'tool1')
    const decision = createDecision(signal, 'demote', 'skill1', 'Low quality', 0.8, { qualityDelta: -0.1, vitalityDelta: -0.2, activationDelta: -10 })
    
    expect(decision.signalId).toBe(signal.id)
    expect(decision.action).toBe('demote')
    expect(decision.targetSkillId).toBe('skill1')
    expect(decision.confidence).toBe(0.8)
    expect(decision.expectedImpact.qualityDelta).toBe(-0.1)
    expect(decision.implementedAt).toBeUndefined()
  })
})

// ===============================================================================
// determineAction Tests
// ===============================================================================

describe('determineAction', () => {
  it('should promote high quality + high vitality', () => {
    const action = determineAction(0.9, 0.8, { skillId: 's1', overallScore: 0.9, qualityScore: 0.9, vitalityScore: 0.8, relationshipScore: 0.5, trend: 'improving', alerts: [], recommendations: [] })
    expect(action).toBe('promote')
  })

  it('should deprecate very low quality with many alerts', () => {
    const action = determineAction(0.2, 0.3, { skillId: 's1', overallScore: 0.2, qualityScore: 0.2, vitalityScore: 0.3, relationshipScore: 0.2, trend: 'declining', alerts: ['alert1', 'alert2'], recommendations: [] })
    expect(action).toBe('deprecate')
  })

  it('should demote low quality', () => {
    const action = determineAction(0.3, 0.5, { skillId: 's1', overallScore: 0.3, qualityScore: 0.3, vitalityScore: 0.5, relationshipScore: 0.2, trend: 'declining', alerts: ['alert1'], recommendations: [] })
    expect(action).toBe('demote')
  })

  it('should demote low vitality', () => {
    const action = determineAction(0.7, 0.1, { skillId: 's1', overallScore: 0.4, qualityScore: 0.7, vitalityScore: 0.1, relationshipScore: 0.2, trend: 'stable', alerts: [], recommendations: [] })
    expect(action).toBe('demote')
  })

  it('should return no_action for normal scores', () => {
    const action = determineAction(0.6, 0.5, { skillId: 's1', overallScore: 0.5, qualityScore: 0.6, vitalityScore: 0.5, relationshipScore: 0.3, trend: 'stable', alerts: [], recommendations: [] })
    expect(action).toBe('no_action')
  })
})

// ===============================================================================
// mapChainsToSignals Tests
// ===============================================================================

describe('mapChainsToSignals', () => {
  it('should return empty for no chains', () => {
    expect(mapChainsToSignals([])).toHaveLength(0)
  })

  it('should create signal for stabilizing pattern', () => {
    const chains = [{
      id: 'chain_1',
      toolIds: ['toolA', 'toolB'],
      length: 2,
      avgDurationMs: 100,
      totalOccurrences: 5,
      avgSuccessRate: 0.9,
      pattern: 'toolA → toolB',
      type: 'sequential' as const
    }]
    const signals = mapChainsToSignals(chains)
    expect(signals).toHaveLength(1)
    expect(signals[0].type).toBe('pattern_stabilizing')
    expect(signals[0].pattern).toBe('toolA → toolB')
    expect(signals[0].severity).toBe('info')
  })

  it('should not flag low-occurrence patterns', () => {
    const chains = [{
      id: 'chain_1',
      toolIds: ['toolA', 'toolB'],
      length: 2,
      avgDurationMs: 100,
      totalOccurrences: 3,
      avgSuccessRate: 0.9,
      pattern: 'toolA → toolB',
      type: 'sequential' as const
    }]
    const signals = mapChainsToSignals(chains)
    expect(signals).toHaveLength(0)
  })

  it('should not flag low success rate patterns', () => {
    const chains = [{
      id: 'chain_1',
      toolIds: ['toolA', 'toolB'],
      length: 2,
      avgDurationMs: 100,
      totalOccurrences: 10,
      avgSuccessRate: 0.6,
      pattern: 'toolA → toolB',
      type: 'sequential' as const
    }]
    const signals = mapChainsToSignals(chains)
    expect(signals).toHaveLength(0)
  })
})

// ===============================================================================
// detectOverreliance Tests
// ===============================================================================

describe('detectOverreliance', () => {
  it('should detect tool using >40% of calls', () => {
    const toolCallCounts = new Map([['toolA', 50], ['toolB', 50]])
    const signals = detectOverreliance(toolCallCounts, 100)
    expect(signals).toHaveLength(2)  // Both tools at 50%
    expect(signals.some(s => s.type === 'overreliance_warning')).toBe(true)
  })

  it('should not flag distributed usage', () => {
    const toolCallCounts = new Map([['toolA', 10], ['toolB', 10], ['toolC', 10], ['toolD', 10]])
    const signals = detectOverreliance(toolCallCounts, 40)
    expect(signals.some(s => s.type === 'overreliance_warning')).toBe(false)
  })

  it('should return empty for empty map', () => {
    const toolCallCounts = new Map()
    const signals = detectOverreliance(toolCallCounts, 0)
    expect(signals).toHaveLength(0)
  })
})

// ===============================================================================
// detectQualityIssues Tests
// ===============================================================================

describe('detectQualityIssues', () => {
  it('should flag high-frequency low-quality tool', () => {
    const toolCallCounts = new Map([['toolA', 35]])
    const toolQualityMap = new Map([['toolA', { success: 10, total: 35 }]])
    const signals = detectQualityIssues(toolCallCounts, toolQualityMap)
    expect(signals.some(s => s.type === 'high_frequency_low_quality')).toBe(true)
  })

it('should flag low-frequency high-quality tool', () => {
    const toolCallCounts = new Map([['toolA', 3]])
    const toolQualityMap = new Map([['toolA', { success: 5, total: 5 }]])  // total >= 5 to pass min threshold
    const signals = detectQualityIssues(toolCallCounts, toolQualityMap)
    // count=3 <= LOW_FREQUENCY_THRESHOLD=5, quality=1.0 >= PROMOTION_QUALITY_THRESHOLD=0.8 → fires
    expect(signals.some(s => s.type === 'low_frequency_high_quality')).toBe(true)
  })

  it('should skip tools below minimum call threshold', () => {
    const toolCallCounts = new Map([['toolA', 2]])
    const toolQualityMap = new Map([['toolA', { success: 2, total: 2 }]])
    const signals = detectQualityIssues(toolCallCounts, toolQualityMap)
    expect(signals).toHaveLength(0)
  })
})

// ===============================================================================
// computeSkillToolContributions Tests
// ===============================================================================

describe('computeSkillToolContributions', () => {
  it('should return contributions for all skill nodes', () => {
    const chains: import('../analytics/ToolCallAnalyzer').ToolChain[] = []
    const skillNodes = [
      createMockSkillNode({ skillId: 's1', name: 'Skill 1', quality: 0.8, vitality: 0.7 }),
      createMockSkillNode({ skillId: 's2', name: 'Skill 2', quality: 0.5, vitality: 0.3 })
    ]
    const contributions = computeSkillToolContributions(chains, skillNodes)
    expect(contributions).toHaveLength(2)
  })

  it('should compute correct quality trend', () => {
    const chains: import('../analytics/ToolCallAnalyzer').ToolChain[] = []
    const skillNodes = [
      createMockSkillNode({ skillId: 's1', quality: 0.9, vitality: 0.8 })
    ]
    const contributions = computeSkillToolContributions(chains, skillNodes)
    expect(contributions[0].qualityTrend).toBe('improving')
  })

  it('should recommend promote for high quality + high vitality', () => {
    const chains: import('../analytics/ToolCallAnalyzer').ToolChain[] = []
    const skillNodes = [
      createMockSkillNode({ skillId: 's1', quality: 0.9, vitality: 0.8 })
    ]
    const contributions = computeSkillToolContributions(chains, skillNodes)
    expect(contributions[0].recommendedAction).toBe('promote')
  })
})

// ===============================================================================
// generateEvolutionRecommendations Tests
// ===============================================================================

describe('generateEvolutionRecommendations', () => {
  it('should return empty array for no signals', () => {
    const signals: EvolutionSignal[] = []
    const contributions: SkillToolContribution[] = []
    const decisions = generateEvolutionRecommendations(signals, contributions)
    expect(decisions).toHaveLength(0)
  })

  it('should generate decision from high-frequency low-quality signal', () => {
    const signals: EvolutionSignal[] = [
      createSignal('high_frequency_low_quality', 'tool_call', 'Test', {}, 'action_required', 'tool1', 'skill1')
    ]
    const contributions: SkillToolContribution[] = [
      {
        skillId: 'skill1',
        skillName: 'Skill 1',
        toolIds: ['tool1'],
        totalCalls: 30,
        avgQuality: 0.3,
        qualityTrend: 'declining',
        healthScore: { skillId: 'skill1', overallScore: 0.3, qualityScore: 0.3, vitalityScore: 0.5, relationshipScore: 0.2, trend: 'declining', alerts: [], recommendations: [] },
        recommendedAction: 'deprecate'
      }
    ]
    const decisions = generateEvolutionRecommendations(signals, contributions)
    expect(decisions.length).toBeGreaterThan(0)
  })

  it('should generate promote decision for high quality skill', () => {
    const signals: EvolutionSignal[] = []
    const contributions: SkillToolContribution[] = [
      {
        skillId: 'skill1',
        skillName: 'Skill 1',
        toolIds: ['tool1'],
        totalCalls: 30,
        avgQuality: 0.9,
        qualityTrend: 'improving',
        healthScore: { skillId: 'skill1', overallScore: 0.8, qualityScore: 0.9, vitalityScore: 0.8, relationshipScore: 0.5, trend: 'improving', alerts: [], recommendations: [] },
        recommendedAction: 'promote'
      }
    ]
    const decisions = generateEvolutionRecommendations(signals, contributions)
    const promoteDec = decisions.find(d => d.action === 'promote')
    expect(promoteDec).toBeDefined()
  })
})

// ===============================================================================
// formatDecision Tests
// ===============================================================================

describe('formatDecision', () => {
  it('should format decision string', () => {
    const decision: EvolutionDecision = {
      id: 'd1',
      signalId: 's1',
      action: 'promote',
      targetSkillId: 'skill1',
      reason: 'High quality',
      confidence: 0.85,
      expectedImpact: { qualityDelta: 0.05, vitalityDelta: 0.1, activationDelta: 5 },
      createdAt: Date.now()
    }
    const formatted = formatDecision(decision)
    expect(formatted).toContain('PROMOTE')
    expect(formatted).toContain('skill1')
    expect(formatted).toContain('85%')
  })
})

// ===============================================================================
// Edge Cases
// ===============================================================================

describe('Edge Cases', () => {
  it('should handle empty toolQualityMap', () => {
    const toolCallCounts = new Map([['toolA', 10]])
    const toolQualityMap = new Map()
    const signals = detectQualityIssues(toolCallCounts, toolQualityMap)
    expect(signals).toHaveLength(0)
  })

  it('should handle empty skill nodes', () => {
    const chains: import('../analytics/ToolCallAnalyzer').ToolChain[] = []
    const contributions = computeSkillToolContributions(chains, [])
    expect(contributions).toHaveLength(0)
  })
})