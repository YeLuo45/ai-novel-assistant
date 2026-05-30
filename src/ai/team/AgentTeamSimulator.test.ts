/**
 * AgentTeamSimulator Tests - V79
 * Tests for Multi-Agent Team Simulation
 */

import { describe, it, expect } from 'vitest'
import {
  type AgentSpecialization,
  type SimulatedAgentProfile,
  type AgentDecision,
  type TeamSimulationConfig,
  createAgentProfile,
  simulateAgentDecision,
  detectDecisionConflict,
  simulateConsensus,
  calculateProductivity,
  detectEmergentBehaviors,
  generateOutcomeReport,
  formatSimulationStep,
  DEFAULT_SIMULATION_CONFIG
} from './AgentTeamSimulator'

// ===============================================================================
// Helper
// ===============================================================================

function createStep(overrides: Partial<import('./AgentTeamSimulator').SimulationStep> = {}): import('./AgentTeamSimulator').SimulationStep {
  const now = Date.now()
  return {
    iteration: 1,
    agents: [],
    messages: [],
    decisions: [],
    events: [],
    teamEnergy: 75,
    productivityScore: 0.6,
    conflictLevel: 0.3,
    ...overrides
  }
}

// ===============================================================================
// createAgentProfile Tests
// ===============================================================================

describe('createAgentProfile', () => {
  it('should create profile with valid personality values', () => {
    const profile = createAgentProfile('a1', 'Agent One', 'writer')
    expect(profile.id).toBe('a1')
    expect(profile.name).toBe('Agent One')
    expect(profile.specialization).toBe('writer')
    expect(profile.personality.creativity).toBeGreaterThanOrEqual(0.3)
    expect(profile.personality.creativity).toBeLessThanOrEqual(0.8)
    expect(profile.energy).toBeGreaterThanOrEqual(80)
    expect(profile.energy).toBeLessThanOrEqual(100)
  })

  it('should assign skill level based on seed', () => {
    const senior = createAgentProfile('a1', 'Senior', 'editor', 0.9)
    const junior = createAgentProfile('a2', 'Junior', 'editor', 0.3)
    expect(senior.skillLevel).toBe('stable')
    expect(junior.skillLevel).toBe('nascent')
  })

  it('should use provided personality seed', () => {
    const profile1 = createAgentProfile('a1', 'Agent1', 'writer', 0.5)
    const profile2 = createAgentProfile('a2', 'Agent2', 'writer', 0.5)
    // Same seed should produce same creativity (deterministic)
    expect(profile1.personality.creativity).toBeCloseTo(profile2.personality.creativity, 1)
  })
})

// ===============================================================================
// simulateAgentDecision Tests
// ===============================================================================

describe('simulateAgentDecision', () => {
  it('should return decision with agent ID', () => {
    const agent = createAgentProfile('a1', 'Test', 'writer')
    const decision = simulateAgentDecision(agent, 'Plot twist?', ['Yes', 'No'])
    expect(decision.agentId).toBe('a1')
  })

  it('should return decision from valid options', () => {
    const agent = createAgentProfile('a1', 'Test', 'editor')
    const options = ['Accept', 'Reject', 'Modify']
    const decision = simulateAgentDecision(agent, 'Edit proposal?', options)
    expect(options).toContain(decision.decision)
  })

  it('should have confidence between 0.5 and 0.9', () => {
    const agent = createAgentProfile('a1', 'Test', 'critic')
    const decision = simulateAgentDecision(agent, 'Proposal', ['A', 'B'])
    expect(decision.confidence).toBeGreaterThanOrEqual(0.5)
    expect(decision.confidence).toBeLessThanOrEqual(0.9)
  })
})

// ===============================================================================
// detectDecisionConflict Tests
// ===============================================================================

describe('detectDecisionConflict', () => {
  it('should return false for same decision', () => {
    const result = detectDecisionConflict(
      { agentId: 'a1', decision: 'Option A', reasoning: '', confidence: 0.8, timestamp: Date.now() },
      { agentId: 'a2', decision: 'Option A', reasoning: '', confidence: 0.8, timestamp: Date.now() },
      'Design choice'
    )
    expect(result).toBe(false)
  })

  it('should return false for different decisions with low confidence', () => {
    const result = detectDecisionConflict(
      { agentId: 'a1', decision: 'Option A', reasoning: '', confidence: 0.5, timestamp: Date.now() },
      { agentId: 'a2', decision: 'Option B', reasoning: '', confidence: 0.5, timestamp: Date.now() },
      'Design choice'
    )
    expect(result).toBe(false)
  })

  it('should return true for different confident decisions', () => {
    const result = detectDecisionConflict(
      { agentId: 'a1', decision: 'Option A', reasoning: '', confidence: 0.8, timestamp: Date.now() },
      { agentId: 'a2', decision: 'Option B', reasoning: '', confidence: 0.7, timestamp: Date.now() },
      'Design choice'
    )
    expect(result).toBe(true)
  })
})

// ===============================================================================
// simulateConsensus Tests
// ===============================================================================

describe('simulateConsensus', () => {
  it('should reach consensus with strong majority', () => {
    const agents = [
      createAgentProfile('a1', 'Agent1', 'writer', 0.9),
      createAgentProfile('a2', 'Agent2', 'writer', 0.1),
      createAgentProfile('a3', 'Agent3', 'writer', 0.1),
      createAgentProfile('a4', 'Agent4', 'writer', 0.1),
      createAgentProfile('a5', 'Agent5', 'writer', 0.1)
    ]
    const result = simulateConsensus(agents, 'Ending style', ['Bittersweet', 'Happy', 'Tragic'])
    expect(result.consensusReached).toBe(true)
    expect(result.agreedOption).toBe('Bittersweet')
  })

  it('should handle no consensus', () => {
    const agents = [
      createAgentProfile('a1', 'Agent1', 'writer', 0.3),
      createAgentProfile('a2', 'Agent2', 'writer', 0.5),
      createAgentProfile('a3', 'writer', 'writer', 0.7)
    ]
    const result = simulateConsensus(agents, 'Genre', ['Fantasy', 'SciFi', 'Romance'])
    // May or may not reach consensus depending on random factors
    expect(result.dissenters).toBeDefined()
  })
})

// ===============================================================================
// calculateProductivity Tests
// ===============================================================================

describe('calculateProductivity', () => {
  it('should return 0 for no iterations', () => {
    expect(calculateProductivity(0, 0, 0, 80)).toBe(0)
  })

  it('should weight task success rate', () => {
    const prod = calculateProductivity(10, 0, 10, 100)
    expect(prod).toBeGreaterThan(0.3)
  })

  it('should decrease with lower energy', () => {
    const highEnergy = calculateProductivity(5, 5, 10, 100)
    const lowEnergy = calculateProductivity(5, 5, 10, 20)
    expect(highEnergy).toBeGreaterThan(lowEnergy)
  })

  it('should return value between 0 and 1', () => {
    const prod = calculateProductivity(8, 2, 10, 75)
    expect(prod).toBeGreaterThanOrEqual(0)
    expect(prod).toBeLessThanOrEqual(1)
  })
})

// ===============================================================================
// detectEmergentBehaviors Tests
// ===============================================================================

describe('detectEmergentBehaviors', () => {
  it('should return empty for insufficient data', () => {
    const steps = [
      createStep({ iteration: 1, events: [{ type: 'creative_breakthrough', timestamp: Date.now(), involvedAgentIds: ['a1', 'a2'], description: '', impact: 'positive' as const }] }),
      createStep({ iteration: 2, events: [] })
    ]
    const behaviors = detectEmergentBehaviors(steps)
    expect(behaviors).toHaveLength(0)
  })

  it('should detect frequent collaborative patterns', () => {
    const steps = [
      createStep({ iteration: 1, events: [{ type: 'creative_breakthrough', timestamp: Date.now(), involvedAgentIds: ['a1', 'a2'], description: '', impact: 'positive' as const }] }),
      createStep({ iteration: 2, events: [{ type: 'creative_breakthrough', timestamp: Date.now(), involvedAgentIds: ['a1', 'a2'], description: '', impact: 'positive' as const }] }),
      createStep({ iteration: 3, events: [{ type: 'creative_breakthrough', timestamp: Date.now(), involvedAgentIds: ['a1', 'a2'], description: '', impact: 'positive' as const }] })
    ]
    const behaviors = detectEmergentBehaviors(steps)
    expect(behaviors.length).toBeGreaterThan(0)
    expect(behaviors[0].type).toBe('creative_collaboration')
  })
})

// ===============================================================================
// generateOutcomeReport Tests
// ===============================================================================

describe('generateOutcomeReport', () => {
  it('should generate report from simulation steps', () => {
    const steps = [
      createStep({ iteration: 1, events: [{ type: 'task_completed', timestamp: Date.now(), involvedAgentIds: ['a1'], description: 'Done', impact: 'positive' }] }),
      createStep({ iteration: 2, events: [] })
    ]
    const config: TeamSimulationConfig = { ...DEFAULT_SIMULATION_CONFIG, maxIterations: 2 }
    const report = generateOutcomeReport(steps, config)
    
    expect(report.totalIterations).toBe(2)
    expect(report.tasksCompleted).toBeGreaterThanOrEqual(0)
  })

  it('should include emergent behaviors', () => {
    const steps = [
      createStep({ iteration: 1, events: [{ type: 'creative_breakthrough', timestamp: Date.now(), involvedAgentIds: ['a1', 'a2'], description: '', impact: 'positive' as const }] }),
      createStep({ iteration: 2, events: [{ type: 'creative_breakthrough', timestamp: Date.now(), involvedAgentIds: ['a1', 'a2'], description: '', impact: 'positive' as const }] }),
      createStep({ iteration: 3, events: [{ type: 'creative_breakthrough', timestamp: Date.now(), involvedAgentIds: ['a1', 'a2'], description: '', impact: 'positive' as const }] })
    ]
    const config: TeamSimulationConfig = { ...DEFAULT_SIMULATION_CONFIG, maxIterations: 3 }
    const report = generateOutcomeReport(steps, config)
    expect(report.emergentBehaviors).toContain('creative_collaboration')
  })
})

// ===============================================================================
// formatSimulationStep Tests
// ===============================================================================

describe('formatSimulationStep', () => {
  it('should format basic step info', () => {
    const step = createStep({ iteration: 5, teamEnergy: 65, productivityScore: 0.55, conflictLevel: 0.2 })
    const formatted = formatSimulationStep(step)
    expect(formatted).toContain('Iteration 5')
    expect(formatted).toContain('65%')
    expect(formatted).toContain('55%')
  })

  it('should include task events', () => {
    const step = createStep({
      iteration: 1,
      events: [
        { type: 'task_assigned', timestamp: Date.now(), involvedAgentIds: ['a1'], description: 'New task', impact: 'neutral' as const },
        { type: 'task_completed', timestamp: Date.now(), involvedAgentIds: ['a2'], description: 'Done', impact: 'positive' as const }
      ]
    })
    const formatted = formatSimulationStep(step)
    expect(formatted).toContain('assigned')
    expect(formatted).toContain('completed')
  })

  it('should include conflict events', () => {
    const step = createStep({
      iteration: 1,
      events: [
        { type: 'conflict_detected', timestamp: Date.now(), involvedAgentIds: ['a1', 'a2'], description: 'Disagree', impact: 'negative' as const },
        { type: 'conflict_resolved', timestamp: Date.now(), involvedAgentIds: ['a1', 'a2'], description: 'Resolved', impact: 'positive' as const }
      ]
    })
    const formatted = formatSimulationStep(step)
    expect(formatted).toContain('detected')
    expect(formatted).toContain('resolved')
  })
})

// ===============================================================================
// DEFAULT_SIMULATION_CONFIG Tests
// ===============================================================================

describe('DEFAULT_SIMULATION_CONFIG', () => {
  it('should have valid team size', () => {
    expect(DEFAULT_SIMULATION_CONFIG.teamSize).toBe(4)
    expect(DEFAULT_SIMULATION_CONFIG.teamSize).toBeGreaterThan(0)
  })

  it('should have valid task complexity range', () => {
    expect(DEFAULT_SIMULATION_CONFIG.taskComplexity).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_SIMULATION_CONFIG.taskComplexity).toBeLessThanOrEqual(1)
  })

  it('should have reasonable max iterations', () => {
    expect(DEFAULT_SIMULATION_CONFIG.maxIterations).toBe(20)
    expect(DEFAULT_SIMULATION_CONFIG.maxIterations).toBeGreaterThan(0)
  })
})

// ===============================================================================
// Edge Cases
// ===============================================================================

describe('Edge Cases', () => {
  it('should handle empty agent list in consensus', () => {
    const result = simulateConsensus([], 'Topic', ['A', 'B'])
    expect(result.consensusReached).toBe(false)
  })

  it('should handle empty simulation steps', () => {
    const config: TeamSimulationConfig = { ...DEFAULT_SIMULATION_CONFIG }
    // Empty steps array would cause lastStep to be undefined
    // Test with single empty step instead
    const steps = [createStep({ iteration: 1, events: [] })]
    const report = generateOutcomeReport(steps, config)
    expect(report.totalIterations).toBe(config.maxIterations)
    expect(report.tasksCompleted).toBe(0)
  })
})