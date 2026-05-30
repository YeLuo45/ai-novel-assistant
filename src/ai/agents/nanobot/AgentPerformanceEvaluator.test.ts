/**
 * AgentPerformanceEvaluator Tests - V135
 * Tests for Hierarchical Agent Lifecycle & Performance Tracking
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyEvaluatorState,
  registerAgent,
  transitionAgentState,
  recordTaskOutcome,
  recordVoteToRetire,
  evolveAgentSpecialization,
  suggestSpecializationFromPerformance,
  evaluateAgentAgainstBenchmark,
  getOverallPerformanceScore,
  checkAndApplyCooldowns,
  recommendBestAgentForTask,
  formatAgentPerformanceReport,
  formatEvaluatorDashboard,
} from './AgentPerformanceEvaluator'

describe('createEmptyEvaluatorState', () => {
  it('should create empty state', () => {
    const state = createEmptyEvaluatorState()
    expect(state.agentRecords.size).toBe(0)
    expect(state.benchmarkThresholds.size).toBe(5)
    expect(state.evaluationCounter).toBe(0)
    expect(state.coolingDownAgents.length).toBe(0)
  })

  it('should have all five benchmark dimensions', () => {
    const state = createEmptyEvaluatorState()
    expect(state.benchmarkThresholds.has('speed')).toBe(true)
    expect(state.benchmarkThresholds.has('quality')).toBe(true)
    expect(state.benchmarkThresholds.has('reliability')).toBe(true)
    expect(state.benchmarkThresholds.has('creativity')).toBe(true)
    expect(state.benchmarkThresholds.has('collaboration')).toBe(true)
  })
})

describe('registerAgent', () => {
  it('should register a new agent', () => {
    let state = createEmptyEvaluatorState()
    const { state: newState } = registerAgent(state, 'writer_01', 'writing')
    expect(newState.agentRecords.has('writer_01')).toBe(true)
  })

  it('should set initial specialization', () => {
    let state = createEmptyEvaluatorState()
    const { state: newState } = registerAgent(state, 'editor_01', 'editing')
    const record = newState.agentRecords.get('editor_01')
    expect(record?.currentSpecialization).toBe('editing')
  })

  it('should set initial performance scores to 50', () => {
    let state = createEmptyEvaluatorState()
    const { state: newState } = registerAgent(state, 'agent_01', 'writing')
    const record = newState.agentRecords.get('agent_01')
    expect(record?.performanceScores.get('speed')).toBe(50)
    expect(record?.performanceScores.get('quality')).toBe(50)
  })

  it('should set lifecycle to active', () => {
    let state = createEmptyEvaluatorState()
    const { state: newState } = registerAgent(state, 'active_agent', 'writing')
    const record = newState.agentRecords.get('active_agent')
    expect(record?.lifecycleState).toBe('active')
  })

  it('should return agentId in result', () => {
    let state = createEmptyEvaluatorState()
    const { agentId } = registerAgent(state, 'test_agent', 'editing')
    expect(agentId).toBe('test_agent')
  })

  it('should default to writing specialization', () => {
    let state = createEmptyEvaluatorState()
    const { state: newState } = registerAgent(state, 'default_agent')
    const record = newState.agentRecords.get('default_agent')
    expect(record?.currentSpecialization).toBe('writing')
  })
})

describe('transitionAgentState', () => {
  it('should transition agent to cooling_down', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = transitionAgentState(state, 'agent_01', 'cooling_down')
    const record = state.agentRecords.get('agent_01')
    expect(record?.lifecycleState).toBe('cooling_down')
    expect(state.coolingDownAgents).toContain('agent_01')
  })

  it('should set cooldownUntil when cooling down', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = transitionAgentState(state, 'agent_01', 'cooling_down')
    const record = state.agentRecords.get('agent_01')
    expect(record?.cooldownUntil).toBeGreaterThan(Date.now())
  })

  it('should transition agent to retired', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = transitionAgentState(state, 'agent_01', 'retired')
    const record = state.agentRecords.get('agent_01')
    expect(record?.lifecycleState).toBe('retired')
    expect(state.coolingDownAgents).not.toContain('agent_01')
  })

  it('should not transition unknown agent', () => {
    const state = createEmptyEvaluatorState()
    const result = transitionAgentState(state, 'unknown', 'active')
    expect(result).toBe(state)
  })
})

describe('recordTaskOutcome', () => {
  it('should increment completed count on success', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = recordTaskOutcome(state, 'agent_01', true, 500, 0.8)
    const record = state.agentRecords.get('agent_01')
    expect(record?.totalTasksCompleted).toBe(1)
    expect(record?.consecutiveFailures).toBe(0)
  })

  it('should increment failed count on failure', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = recordTaskOutcome(state, 'agent_01', false, 500)
    const record = state.agentRecords.get('agent_01')
    expect(record?.totalTasksFailed).toBe(1)
    expect(record?.consecutiveFailures).toBe(1)
  })

  it('should update quality score when provided on success', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = recordTaskOutcome(state, 'agent_01', true, 500, 0.9)
    const record = state.agentRecords.get('agent_01')
    expect(record?.performanceScores.get('quality')).toBeGreaterThan(35)
  })

  it('should update lastActiveAt', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    const before = Date.now()
    state = recordTaskOutcome(state, 'agent_01', true, 500)
    const record = state.agentRecords.get('agent_01')
    expect(record?.lastActiveAt).toBeGreaterThanOrEqual(before)
  })

  it('should not affect unknown agent', () => {
    const state = createEmptyEvaluatorState()
    const result = recordTaskOutcome(state, 'unknown', true, 500)
    expect(result).toBe(state)
  })

  it('should decay quality score on failure', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    const initialQuality = state.agentRecords.get('agent_01')?.performanceScores.get('quality') ?? 50
    state = recordTaskOutcome(state, 'agent_01', false, 500)
    const record = state.agentRecords.get('agent_01')
    expect(record?.performanceScores.get('quality')).toBeLessThan(initialQuality)
  })

  it('should reset consecutive failures on success', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = recordTaskOutcome(state, 'agent_01', false, 500)
    state = recordTaskOutcome(state, 'agent_01', false, 500)
    state = recordTaskOutcome(state, 'agent_01', true, 500)
    const record = state.agentRecords.get('agent_01')
    expect(record?.consecutiveFailures).toBe(0)
  })
})

describe('recordVoteToRetire', () => {
  it('should increment retirement votes', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = recordVoteToRetire(state, 'agent_01', 'voter_a')
    const record = state.agentRecords.get('agent_01')
    expect(record?.retirementVotes).toBe(1)
  })

  it('should retire after 3 votes', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = recordVoteToRetire(state, 'agent_01', 'voter_a')
    state = recordVoteToRetire(state, 'agent_01', 'voter_b')
    state = recordVoteToRetire(state, 'agent_01', 'voter_c')
    const record = state.agentRecords.get('agent_01')
    expect(record?.lifecycleState).toBe('retired')
  })

  it('should not retire before 3 votes', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = recordVoteToRetire(state, 'agent_01', 'voter_a')
    state = recordVoteToRetire(state, 'agent_01', 'voter_b')
    const record = state.agentRecords.get('agent_01')
    expect(record?.lifecycleState).toBe('active')
    expect(record?.retirementVotes).toBe(2)
  })
})

describe('evolveAgentSpecialization', () => {
  it('should change specialization', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = evolveAgentSpecialization(state, 'agent_01', 'editing')
    const record = state.agentRecords.get('agent_01')
    expect(record?.currentSpecialization).toBe('editing')
  })

  it('should increment evolution count', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = evolveAgentSpecialization(state, 'agent_01', 'editing')
    const record = state.agentRecords.get('agent_01')
    expect(record?.specializationEvolutionCount).toBe(1)
  })

  it('should not evolve retired agent', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = transitionAgentState(state, 'agent_01', 'retired')
    state = evolveAgentSpecialization(state, 'agent_01', 'editing')
    const record = state.agentRecords.get('agent_01')
    expect(record?.currentSpecialization).toBe('writing')
    expect(record?.specializationEvolutionCount).toBe(0)
  })
})

describe('suggestSpecializationFromPerformance', () => {
  it('should suggest editing for high quality score', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    const record = state.agentRecords.get('agent_01')!
    record.performanceScores.set('quality', 95)
    record.performanceScores.set('creativity', 30)
    record.performanceScores.set('speed', 30)
    record.performanceScores.set('reliability', 30)
    record.performanceScores.set('collaboration', 30)
    const suggestion = suggestSpecializationFromPerformance(state, 'agent_01')
    expect(suggestion).toBe('editing')
  })

  it('should suggest research for high reliability score', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    const record = state.agentRecords.get('agent_01')!
    record.performanceScores.set('reliability', 95)
    record.performanceScores.set('quality', 30)
    record.performanceScores.set('creativity', 30)
    record.performanceScores.set('speed', 30)
    record.performanceScores.set('collaboration', 30)
    const suggestion = suggestSpecializationFromPerformance(state, 'agent_01')
    expect(suggestion).toBe('research')
  })

  it('should return null for unknown agent', () => {
    const state = createEmptyEvaluatorState()
    const suggestion = suggestSpecializationFromPerformance(state, 'unknown')
    expect(suggestion).toBeNull()
  })
})

describe('evaluateAgentAgainstBenchmark', () => {
  it('should return evaluations for all dimensions', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    const evaluations = evaluateAgentAgainstBenchmark(state, 'agent_01')
    expect(evaluations.length).toBe(5)
  })

  it('should mark excellent scores', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    const record = state.agentRecords.get('agent_01')!
    record.performanceScores.set('speed', 95)
    const evals = evaluateAgentAgainstBenchmark(state, 'agent_01')
    const speedEval = evals.find(e => e.dimension === 'speed')
    expect(speedEval?.status).toBe('excellent')
  })

  it('should mark below_min scores', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    const record = state.agentRecords.get('agent_01')!
    record.performanceScores.set('creativity', 10)
    const evals = evaluateAgentAgainstBenchmark(state, 'agent_01')
    const creativityEval = evals.find(e => e.dimension === 'creativity')
    expect(creativityEval?.status).toBe('below_min')
  })

  it('should return empty for unknown agent', () => {
    const state = createEmptyEvaluatorState()
    const evals = evaluateAgentAgainstBenchmark(state, 'unknown')
    expect(evals).toEqual([])
  })
})

describe('getOverallPerformanceScore', () => {
  it('should return average of all scores', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    const score = getOverallPerformanceScore(state, 'agent_01')
    expect(score).toBe(50)
  })

  it('should return 0 for unknown agent', () => {
    const state = createEmptyEvaluatorState()
    const score = getOverallPerformanceScore(state, 'unknown')
    expect(score).toBe(0)
  })

  it('should reflect updated scores', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = recordTaskOutcome(state, 'agent_01', true, 500, 0.9)
    const score = getOverallPerformanceScore(state, 'agent_01')
    expect(score).toBeGreaterThan(50)
  })
})

describe('checkAndApplyCooldowns', () => {
  it('should remove from cooling list after cooldown expires', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = transitionAgentState(state, 'agent_01', 'cooling_down')
    const record = state.agentRecords.get('agent_01')!
    record.cooldownUntil = Date.now() - 1000
    state = { ...state, agentRecords: new Map([['agent_01', record]]) }
    const newState = checkAndApplyCooldowns(state)
    expect(newState.coolingDownAgents).not.toContain('agent_01')
  })

  it('should retire agent with too many failures after cooldown', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = transitionAgentState(state, 'agent_01', 'cooling_down')
    const record = state.agentRecords.get('agent_01')!
    record.cooldownUntil = Date.now() - 1000
    record.consecutiveFailures = 5
    state = { ...state, agentRecords: new Map([['agent_01', record]]) }
    const newState = checkAndApplyCooldowns(state)
    expect(newState.agentRecords.get('agent_01')?.lifecycleState).toBe('retired')
  })

  it('should activate agent with few failures after cooldown', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'agent_01', 'writing').state
    state = transitionAgentState(state, 'agent_01', 'cooling_down')
    const record = state.agentRecords.get('agent_01')!
    record.cooldownUntil = Date.now() - 1000
    record.consecutiveFailures = 2
    state = { ...state, agentRecords: new Map([['agent_01', record]]) }
    const newState = checkAndApplyCooldowns(state)
    expect(newState.agentRecords.get('agent_01')?.lifecycleState).toBe('active')
  })
})

describe('recommendBestAgentForTask', () => {
  it('should recommend agent with matching specialization', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'writer_01', 'writing').state
    state = registerAgent(state, 'editor_01', 'editing').state
    state = recordTaskOutcome(state, 'writer_01', true, 300, 0.85)
    const best = recommendBestAgentForTask(state, 'writing')
    expect(best).toBe('writer_01')
  })

  it('should exclude agents in excludeIds', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'writer_01', 'writing').state
    state = registerAgent(state, 'writer_02', 'writing').state
    const best = recommendBestAgentForTask(state, 'writing', ['writer_01'])
    expect(best).toBe('writer_02')
  })

  it('should not recommend retired agents', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'writer_01', 'writing').state
    state = transitionAgentState(state, 'writer_01', 'retired')
    state = registerAgent(state, 'writer_02', 'writing').state
    const best = recommendBestAgentForTask(state, 'writing')
    expect(best).toBe('writer_02')
  })

  it('should return null when no agents available', () => {
    const state = createEmptyEvaluatorState()
    const best = recommendBestAgentForTask(state, 'writing')
    expect(best).toBeNull()
  })
})

describe('formatAgentPerformanceReport', () => {
  it('should show not found for unknown agent', () => {
    const state = createEmptyEvaluatorState()
    const report = formatAgentPerformanceReport(state, 'unknown')
    expect(report).toContain('not found')
  })

  it('should include agent id in report', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'writer_01', 'writing').state
    const report = formatAgentPerformanceReport(state, 'writer_01')
    expect(report).toContain('writer_01')
  })

  it('should include lifecycle state', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'writer_01', 'writing').state
    const report = formatAgentPerformanceReport(state, 'writer_01')
    expect(report).toContain('active')
    expect(report).toContain('Lifecycle')
  })
})

describe('formatEvaluatorDashboard', () => {
  it('should show empty state', () => {
    const state = createEmptyEvaluatorState()
    const dashboard = formatEvaluatorDashboard(state)
    expect(dashboard).toContain('Dashboard')
    expect(dashboard).toContain('Total Agents: 0')
  })

  it('should show agent count', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'writer_01', 'writing').state
    state = registerAgent(state, 'editor_01', 'editing').state
    const dashboard = formatEvaluatorDashboard(state)
    expect(dashboard).toContain('Total Agents: 2')
    expect(dashboard).toContain('Active: 2')
  })

  it('should show top agents', () => {
    let state = createEmptyEvaluatorState()
    state = registerAgent(state, 'writer_01', 'writing').state
    state = recordTaskOutcome(state, 'writer_01', true, 300, 0.9)
    const dashboard = formatEvaluatorDashboard(state)
    expect(dashboard).toContain('Top 5 Active Agents')
  })
})
