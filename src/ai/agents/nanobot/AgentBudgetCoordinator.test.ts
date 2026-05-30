/**
 * AgentBudgetCoordinator Tests - V123
 * Tests for Token Budget Management with Self-Regulation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyBudgetCoordinatorState,
  initializeAgentBudget,
  removeAgentBudget,
  consumeTokens,
  reserveTokens,
  releaseReservedTokens,
  getAvailableTokens,
  getUsageRatio,
  isWithinBudget,
  predictTokenNeed,
  shouldThrottle,
  enqueueForThrottle,
  dequeueFromThrottle,
  syncFromMeshState,
  formatBudgetSummary,
  formatAgentBudget,
  formatRecentAlerts,
  DEFAULT_BUDGET_POLICY,
} from './AgentBudgetCoordinator'

import { createEmptyMeshCoordinationState, registerAgent } from './AgentMeshCoordinator'

// =============================================================================
// Helpers
// =============================================================================

function makeMeshAgent(overrides: any = {}): any {
  return {
    id: 'test_agent',
    role: 'writer',
    status: 'idle',
    capabilities: [],
    specializations: [],
    workload: 0,
    successRate: 1.0,
    totalTasks: 0,
    failedTasks: 0,
    lastActiveTime: Date.now(),
    isOnline: true,
    ...overrides,
  }
}

// =============================================================================
// createEmptyBudgetCoordinatorState Tests
// =============================================================================

describe('createEmptyBudgetCoordinatorState', () => {
  it('should create empty state', () => {
    const state = createEmptyBudgetCoordinatorState()
    expect(state.budgets.size).toBe(0)
    expect(state.globalUsedTokens).toBe(0)
    expect(state.isThrottled).toBe(false)
  })

  it('should use default policy', () => {
    const state = createEmptyBudgetCoordinatorState()
    expect(state.policy.globalTokenLimit).toBe(1000000)
    expect(state.policy.perAgentLimit).toBe(100000)
  })
})

// =============================================================================
// initializeAgentBudget Tests
// =============================================================================

describe('initializeAgentBudget', () => {
  it('should create budget for agent', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')

    const budget = state.budgets.get('agent1')
    expect(budget).toBeDefined()
    expect(budget?.totalBudget).toBe(100000) // default perAgentLimit
  })

  it('should allow custom budget', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1', 50000)

    const budget = state.budgets.get('agent1')
    expect(budget?.totalBudget).toBe(50000)
  })

  it('should initialize counters to zero', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')

    const budget = state.budgets.get('agent1')
    expect(budget?.usedTokens).toBe(0)
    expect(budget?.reservedTokens).toBe(0)
    expect(budget?.requestCount).toBe(0)
    expect(budget?.alertLevel).toBe('none')
  })
})

describe('removeAgentBudget', () => {
  it('should remove budget', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = removeAgentBudget(state, 'agent1')

    expect(state.budgets.has('agent1')).toBe(false)
  })
})

// =============================================================================
// consumeTokens Tests
// =============================================================================

describe('consumeTokens', () => {
  it('should increment used tokens', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 1000)

    expect(state.budgets.get('agent1')?.usedTokens).toBe(1000)
  })

  it('should calculate average tokens per request', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 1000)
    state = consumeTokens(state, 'agent1', 2000)

    const budget = state.budgets.get('agent1')
    expect(budget?.avgTokensPerRequest).toBe(1500)
  })

  it('should increment request counter', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 1000)

    expect(state.budgets.get('agent1')?.requestCount).toBe(1)
  })

  it('should track global tokens', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = initializeAgentBudget(state, 'agent2')
    state = consumeTokens(state, 'agent1', 1000)
    state = consumeTokens(state, 'agent2', 2000)

    expect(state.globalUsedTokens).toBe(3000)
    expect(state.totalTokensSpent).toBe(3000)
    expect(state.totalRequestsProcessed).toBe(2)
  })

  it('should trigger warning alert at threshold', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    // Default warning threshold is 0.7 of 100000 = 70000
    // Consume 71% = 71000 tokens
    state = consumeTokens(state, 'agent1', 71000)

    const budget = state.budgets.get('agent1')
    expect(budget?.alertLevel).toBe('warning')
  })

  it('should add alert to budgetAlerts', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 71000)

    expect(state.budgetAlerts.length).toBeGreaterThan(0)
    expect(state.budgetAlerts[state.budgetAlerts.length - 1].agentId).toBe('agent1')
  })
})

// =============================================================================
// Reserve/Release Tokens Tests
// =============================================================================

describe('reserveTokens', () => {
  it('should reserve tokens', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = reserveTokens(state, 'agent1', 5000)

    expect(state.budgets.get('agent1')?.reservedTokens).toBe(5000)
  })

  it('should cap reservation at available', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1', 10000)
    state = reserveTokens(state, 'agent1', 15000)

    expect(state.budgets.get('agent1')?.reservedTokens).toBe(10000)
  })
})

describe('releaseReservedTokens', () => {
  it('should release reserved tokens', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = reserveTokens(state, 'agent1', 5000)
    state = releaseReservedTokens(state, 'agent1', 3000)

    expect(state.budgets.get('agent1')?.reservedTokens).toBe(2000)
  })

  it('should not go negative', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = reserveTokens(state, 'agent1', 1000)
    state = releaseReservedTokens(state, 'agent1', 5000)

    expect(state.budgets.get('agent1')?.reservedTokens).toBe(0)
  })
})

// =============================================================================
// Budget Queries Tests
// =============================================================================

describe('getAvailableTokens', () => {
  it('should return available tokens', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1', 100000)
    state = consumeTokens(state, 'agent1', 30000)
    state = reserveTokens(state, 'agent1', 10000)

    expect(getAvailableTokens(state, 'agent1')).toBe(60000)
  })

  it('should return 0 for unknown agent', () => {
    const state = createEmptyBudgetCoordinatorState()
    expect(getAvailableTokens(state, 'unknown')).toBe(0)
  })
})

describe('getUsageRatio', () => {
  it('should return usage ratio', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1', 100000)
    state = consumeTokens(state, 'agent1', 50000)

    const ratio = getUsageRatio(state, 'agent1')
    expect(ratio).toBe(0.5)
  })
})

describe('isWithinBudget', () => {
  it('should return true when enough tokens available', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1', 100000)
    state = consumeTokens(state, 'agent1', 30000)

    expect(isWithinBudget(state, 'agent1', 10000)).toBe(true)
  })

  it('should return false when not enough tokens', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1', 100000)
    state = consumeTokens(state, 'agent1', 95000)

    expect(isWithinBudget(state, 'agent1', 10000)).toBe(false)
  })
})

describe('predictTokenNeed', () => {
  it('should return null when disabled', () => {
    let state = createEmptyBudgetCoordinatorState({ enablePrediction: false })
    state = initializeAgentBudget(state, 'agent1')

    expect(predictTokenNeed(state, 'agent1')).toBeNull()
  })

  it('should predict based on average', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 1000)
    state = consumeTokens(state, 'agent1', 2000)

    const predicted = predictTokenNeed(state, 'agent1')
    // predictionWindow=10, avg=1500
    expect(predicted).toBe(15000) // 1500 * 10
  })
})

// =============================================================================
// Throttling Tests
// =============================================================================

describe('shouldThrottle', () => {
  it('should return false when under critical threshold', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 50000) // 50% of 100K

    expect(shouldThrottle(state, 'agent1')).toBe(false)
  })

  it('should return true at critical threshold', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 92000) // 92% > 90% critical

    expect(shouldThrottle(state, 'agent1')).toBe(true)
  })

  it('should return false when autoThrottle disabled', () => {
    let state = createEmptyBudgetCoordinatorState({ autoThrottle: false })
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 100000) // 100%

    expect(shouldThrottle(state, 'agent1')).toBe(false)
  })
})

describe('enqueueForThrottle', () => {
  it('should add agent to throttle queue', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = enqueueForThrottle(state, 'agent1')

    expect(state.throttleQueue).toContain('agent1')
    expect(state.isThrottled).toBe(true)
  })

  it('should not duplicate', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = enqueueForThrottle(state, 'agent1')
    state = enqueueForThrottle(state, 'agent1')

    expect(state.throttleQueue.length).toBe(1)
  })
})

describe('dequeueFromThrottle', () => {
  it('should remove agent from queue', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = enqueueForThrottle(state, 'agent1')
    state = dequeueFromThrottle(state, 'agent1')

    expect(state.throttleQueue).not.toContain('agent1')
  })

  it('should clear isThrottled when queue empty', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = enqueueForThrottle(state, 'agent1')
    state = dequeueFromThrottle(state, 'agent1')

    expect(state.isThrottled).toBe(false)
  })
})

// =============================================================================
// Sync From Mesh Tests
// =============================================================================

describe('syncFromMeshState', () => {
  it('should add budgets for new agents', () => {
    let meshState = createEmptyMeshCoordinationState()
    meshState = registerAgent(meshState, makeMeshAgent({ id: 'mesh_agent' }))
    meshState = registerAgent(meshState, makeMeshAgent({ id: 'mesh_agent2' }))

    let budgetState = createEmptyBudgetCoordinatorState()
    budgetState = syncFromMeshState(budgetState, meshState)

    expect(budgetState.budgets.has('mesh_agent')).toBe(true)
    expect(budgetState.budgets.has('mesh_agent2')).toBe(true)
  })

  it('should remove budgets for departed agents', () => {
    let meshState = createEmptyMeshCoordinationState()
    meshState = registerAgent(meshState, makeMeshAgent({ id: 'mesh_agent' }))

    let budgetState = createEmptyBudgetCoordinatorState()
    budgetState = initializeAgentBudget(budgetState, 'mesh_agent')
    budgetState = initializeAgentBudget(budgetState, 'orphan_agent')

    budgetState = syncFromMeshState(budgetState, meshState)

    expect(budgetState.budgets.has('mesh_agent')).toBe(true)
    expect(budgetState.budgets.has('orphan_agent')).toBe(false)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatBudgetSummary', () => {
  it('should format summary', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 1000)

    const summary = formatBudgetSummary(state)
    expect(summary).toContain('Budget Coordinator Summary')
  })
})

describe('formatAgentBudget', () => {
  it('should format agent budget', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 50000)

    const details = formatAgentBudget(state, 'agent1')
    expect(details).toContain('agent1')
    expect(details).toContain('50')
  })

  it('should show not found for unknown', () => {
    const state = createEmptyBudgetCoordinatorState()
    const details = formatAgentBudget(state, 'unknown')
    expect(details).toContain('No budget found')
  })
})

describe('formatRecentAlerts', () => {
  it('should show no alerts', () => {
    const state = createEmptyBudgetCoordinatorState()
    const output = formatRecentAlerts(state)
    expect(output).toContain('No recent')
  })

  it('should show recent alerts', () => {
    let state = createEmptyBudgetCoordinatorState()
    state = initializeAgentBudget(state, 'agent1')
    state = consumeTokens(state, 'agent1', 95000)

    const output = formatRecentAlerts(state)
    expect(output).toContain('agent1')
  })
})