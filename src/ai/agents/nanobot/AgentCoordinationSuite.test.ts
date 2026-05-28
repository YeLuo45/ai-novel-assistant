/**
 * AgentCoordinationSuite Tests - V125
 * Tests for Unified Multi-Agent Coordination Hub
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyCoordinationSuiteState,
  registerAgentToSuite,
  unregisterAgentFromSuite,
  submitTaskToSuite,
  routeTaskToAgent,
  completeSuiteTask,
  enforceBudgetLimits,
  calculateSuiteHealth,
  formatSuiteSummary,
  formatAgentStatus,
  DEFAULT_COORDINATION_CONFIG,
} from './AgentCoordinationSuite'

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

function makeTask(overrides: any = {}): any {
  return {
    dependencies: [],
    priority: 'normal',
    title: 'Test Task',
    description: 'Test task description',
    targetRole: 'writer',
    phase: 'drafting' as any,
    estimatedDurationMs: 5000,
    tags: [],
    inputContext: {},
    maxRetries: 2,
    ...overrides,
  }
}

// =============================================================================
// createEmptyCoordinationSuiteState Tests
// =============================================================================

describe('createEmptyCoordinationSuiteState', () => {
  it('should create empty suite state', () => {
    const state = createEmptyCoordinationSuiteState()
    expect(state.mesh.agents.size).toBe(0)
    expect(state.router.tasks.size).toBe(0)
    expect(state.budget.budgets.size).toBe(0)
  })

  it('should use default config', () => {
    const state = createEmptyCoordinationSuiteState()
    expect(state.config.mode).toBe('distributed')
    expect(state.config.maxAgents).toBe(20)
    expect(state.config.enableBudgetEnforcement).toBe(true)
  })

  it('should allow custom config', () => {
    const state = createEmptyCoordinationSuiteState({ mode: 'hierarchical', maxAgents: 10 })
    expect(state.config.mode).toBe('hierarchical')
    expect(state.config.maxAgents).toBe(10)
  })

  it('should initialize health to 100', () => {
    const state = createEmptyCoordinationSuiteState()
    expect(state.coordinationHealth).toBe(100)
  })
})

// =============================================================================
// registerAgentToSuite Tests
// =============================================================================

describe('registerAgentToSuite', () => {
  it('should add agent to mesh and budget', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))

    expect(state.mesh.agents.has('agent1')).toBe(true)
    expect(state.budget.budgets.has('agent1')).toBe(true)
    expect(state.activeAgents).toContain('agent1')
  })

  it('should add agent to role registry', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'writer1', role: 'writer' }))

    const writers = state.mesh.agentRegistry.get('writer')
    expect(writers).toContain('writer1')
  })

  it('should not duplicate on re-register', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1', role: 'editor' }))

    const editors = state.mesh.agentRegistry.get('editor')
    expect(editors).toContain('agent1')
    expect(state.activeAgents.filter(id => id === 'agent1').length).toBe(1)
  })
})

describe('unregisterAgentFromSuite', () => {
  it('should remove agent from mesh and budget', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))
    state = unregisterAgentFromSuite(state, 'agent1')

    expect(state.mesh.agents.has('agent1')).toBe(false)
    expect(state.budget.budgets.has('agent1')).toBe(false)
    expect(state.activeAgents).not.toContain('agent1')
  })

  it('should handle unknown agent', () => {
    const state = createEmptyCoordinationSuiteState()
    const result = unregisterAgentFromSuite(state, 'unknown')
    expect(result).toBe(state)
  })
})

// =============================================================================
// Task Submission Tests
// =============================================================================

describe('submitTaskToSuite', () => {
  it('should add task to router', () => {
    let state = createEmptyCoordinationSuiteState()
    const { state: newState, taskId } = submitTaskToSuite(state, makeTask())

    expect(newState.router.tasks.has(taskId)).toBe(true)
    expect(newState.pendingTasks).toBe(1)
  })

  it('should add task to queue', () => {
    let state = createEmptyCoordinationSuiteState()
    const { state: newState, taskId } = submitTaskToSuite(state, makeTask())

    expect(newState.router.taskQueue.length).toBeGreaterThan(0)
  })

  it('should set correct initial status', () => {
    let state = createEmptyCoordinationSuiteState()
    const { state: newState, taskId } = submitTaskToSuite(state, makeTask())

    expect(newState.router.tasks.get(taskId)?.status).toBe('pending')
  })
})

describe('routeTaskToAgent', () => {
  it('should assign agent to task', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))
    const { state: s1, taskId } = submitTaskToSuite(state, makeTask())
    state = routeTaskToAgent(s1, taskId, 'agent1')

    expect(state.router.tasks.get(taskId)?.assignedAgentId).toBe('agent1')
    expect(state.router.tasks.get(taskId)?.status).toBe('routed')
  })

  it('should reserve budget tokens', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))
    const { state: s1, taskId } = submitTaskToSuite(state, makeTask({ estimatedDurationMs: 10000 }))
    state = routeTaskToAgent(s1, taskId, 'agent1')

    const budget = state.budget.budgets.get('agent1')
    expect(budget?.reservedTokens).toBeGreaterThan(0)
  })

  it('should remove from task queue', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))
    const { state: s1, taskId } = submitTaskToSuite(state, makeTask())
    state = routeTaskToAgent(s1, taskId, 'agent1')

    expect(state.router.taskQueue.some(t => t.id === taskId)).toBe(false)
  })
})

describe('completeSuiteTask', () => {
  it('should mark task as completed', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))
    const { state: s1, taskId } = submitTaskToSuite(state, makeTask())
    state = routeTaskToAgent(s1, taskId, 'agent1')

    // Start the task first
    const task = state.router.tasks.get(taskId)
    const startedTask = { ...task!, startedAt: Date.now() - 5000 }
    const updatedTasks = new Map(state.router.tasks)
    updatedTasks.set(taskId, startedTask)
    state = { ...state, router: { ...state.router, tasks: updatedTasks } }

    state = completeSuiteTask(state, taskId, { output: 'result' })

    expect(state.router.tasks.get(taskId)?.status).toBe('completed')
  })

  it('should increment completed counter', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))
    const { state: s1, taskId } = submitTaskToSuite(state, makeTask())
    state = routeTaskToAgent(s1, taskId, 'agent1')
    const task = state.router.tasks.get(taskId)
    const startedTask = { ...task!, startedAt: Date.now() - 5000 }
    const updatedTasks = new Map(state.router.tasks)
    updatedTasks.set(taskId, startedTask)
    state = { ...state, router: { ...state.router, tasks: updatedTasks } }
    state = completeSuiteTask(state, taskId, { output: 'result' })

    expect(state.completedTasks).toBe(1)
    expect(state.pendingTasks).toBe(0)
  })

  it('should record feedback score', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))
    const { state: s1, taskId } = submitTaskToSuite(state, makeTask())
    state = routeTaskToAgent(s1, taskId, 'agent1')
    const task = state.router.tasks.get(taskId)
    const startedTask = { ...task!, startedAt: Date.now() - 5000 }
    const updatedTasks = new Map(state.router.tasks)
    updatedTasks.set(taskId, startedTask)
    state = { ...state, router: { ...state.router, tasks: updatedTasks } }
    state = completeSuiteTask(state, taskId, { output: 'result' }, 85)

    expect(state.router.tasks.get(taskId)?.feedbackScore).toBe(85)
    expect(state.router.feedbackScores).toContain(85)
  })
})

// =============================================================================
// Budget Enforcement Tests
// =============================================================================

describe('enforceBudgetLimits', () => {
  it('should do nothing when disabled', () => {
    let state = createEmptyCoordinationSuiteState({ enableBudgetEnforcement: false })
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))
    const result = enforceBudgetLimits(state)
    expect(result).toBe(state)
  })

  it('should mark agent busy when at critical threshold', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))

    // Consume to critical threshold
    const budget = state.budget.budgets.get('agent1')!
    const criticalTokens = Math.floor(budget.totalBudget * 0.95)
    const updatedBudgets = new Map(state.budget.budgets)
    updatedBudgets.set('agent1', { ...budget, usedTokens: criticalTokens })
    state = { ...state, budget: { ...state.budget, budgets: updatedBudgets } }

    state = enforceBudgetLimits(state)

    const meshAgent = state.mesh.agents.get('agent1')
    expect(meshAgent?.status).toBe('busy')
  })

  it('should not affect agent under threshold', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1', status: 'idle' }))

    state = enforceBudgetLimits(state)

    expect(state.mesh.agents.get('agent1')?.status).toBe('idle')
  })
})

// =============================================================================
// Health Calculation Tests
// =============================================================================

describe('calculateSuiteHealth', () => {
  it('should return 100 for empty suite', () => {
    const state = createEmptyCoordinationSuiteState()
    expect(calculateSuiteHealth(state)).toBe(100)
  })

  it('should return health for populated suite', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))

    const health = calculateSuiteHealth(state)
    expect(health).toBeGreaterThan(0)
    expect(health).toBeLessThanOrEqual(100)
  })

  it('should reflect mesh health', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))

    const health1 = calculateSuiteHealth(state)

    // Change mesh health
    state = { ...state, mesh: { ...state.mesh, meshHealth: 50 } }
    const health2 = calculateSuiteHealth(state)

    expect(health2).toBeLessThan(health1)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatSuiteSummary', () => {
  it('should format summary', () => {
    const state = createEmptyCoordinationSuiteState()
    const summary = formatSuiteSummary(state)
    expect(summary).toContain('Agent Coordination Suite')
    expect(summary).toContain('Health')
  })

  it('should include active agent count', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1' }))

    const summary = formatSuiteSummary(state)
    expect(summary).toContain('1 active')
  })
})

describe('formatAgentStatus', () => {
  it('should format known agent', () => {
    let state = createEmptyCoordinationSuiteState()
    state = registerAgentToSuite(state, makeMeshAgent({ id: 'agent1', role: 'writer', status: 'idle' }))

    const status = formatAgentStatus(state, 'agent1')
    expect(status).toContain('agent1')
    expect(status).toContain('writer')
    expect(status).toContain('idle')
  })

  it('should show not found for unknown', () => {
    const state = createEmptyCoordinationSuiteState()
    const status = formatAgentStatus(state, 'unknown')
    expect(status).toContain('not found')
  })
})

// =============================================================================
// Config Tests
// =============================================================================

describe('DEFAULT_COORDINATION_CONFIG', () => {
  it('should have all required fields', () => {
    expect(DEFAULT_COORDINATION_CONFIG.mode).toBeDefined()
    expect(DEFAULT_COORDINATION_CONFIG.maxAgents).toBeDefined()
    expect(DEFAULT_COORDINATION_CONFIG.enableBudgetEnforcement).toBe(true)
    expect(DEFAULT_COORDINATION_CONFIG.enableTaskRouting).toBe(true)
    expect(DEFAULT_COORDINATION_CONFIG.enableMeshNetworking).toBe(true)
  })

  it('should have valid threshold', () => {
    expect(DEFAULT_COORDINATION_CONFIG.scaleThreshold).toBeLessThan(100)
    expect(DEFAULT_COORDINATION_CONFIG.scaleThreshold).toBeGreaterThan(0)
  })
})