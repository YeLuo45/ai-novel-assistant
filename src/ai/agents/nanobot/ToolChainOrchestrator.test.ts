/**
 * ToolChainOrchestrator Tests - V131
 * Tests for Automatic Tool Chain Execution Engine
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyOrchestratorState,
  startChainExecution,
  beginChainExecution,
  recordStepStart,
  recordStepCompletion,
  recordStepFailure,
  completeChainExecution,
  cancelChainExecution,
  resolveStepDependencies,
  getNextExecutableSteps,
  groupStepsByParallelism,
  getExecutionProgress,
  getActiveExecutionCount,
  isChainExecuting,
  formatExecutionProgress,
  formatOrchestratorDashboard,
} from './ToolChainOrchestrator'

// =============================================================================
// Helpers
// =============================================================================

function makeToolRegistryState(chains: any = {}): any {
  return {
    tools: new Map(),
    chains: new Map(Object.entries(chains)),
    executions: new Map(),
    executionHistory: [],
    toolCategories: new Map(),
    roleCapabilities: new Map(),
    analytics: {
      totalTools: 0,
      totalExecutions: 0,
      averageLatencyMs: 0,
      mostUsedTool: null,
      mostFailedTool: null,
      toolUsageByCategory: {},
      chainSuccessRates: new Map(),
    },
  }
}

// =============================================================================
// createEmptyOrchestratorState Tests
// =============================================================================

describe('createEmptyOrchestratorState', () => {
  it('should create empty state', () => {
    const state = createEmptyOrchestratorState()
    expect(state.activeExecutions.size).toBe(0)
    expect(state.executionHistory.length).toBe(0)
  })

  it('should have default config', () => {
    const state = createEmptyOrchestratorState()
    expect(state.maxConcurrentExecutions).toBe(5)
    expect(state.defaultTimeoutMs).toBe(300000)
    expect(state.enableFallbacks).toBe(true)
    expect(state.maxRetriesPerStep).toBe(2)
  })
})

// =============================================================================
// Chain Execution Lifecycle Tests
// =============================================================================

describe('startChainExecution', () => {
  it('should create execution with id', () => {
    let state = createEmptyOrchestratorState()
    const { state: newState, executionId } = startChainExecution(state, 'chain_1')

    expect(executionId).toContain('chain_exec_')
    expect(newState.activeExecutions.has(executionId)).toBe(true)
  })

  it('should set initial status to pending', () => {
    let state = createEmptyOrchestratorState()
    const { state: newState } = startChainExecution(state, 'chain_1')

    const exec = Array.from(newState.activeExecutions.values())[0]
    expect(exec.status).toBe('pending')
  })

  it('should allow optional agentId', () => {
    let state = createEmptyOrchestratorState()
    const { state: newState } = startChainExecution(state, 'chain_1', 'agent_writer')

    const exec = Array.from(newState.activeExecutions.values())[0]
    expect(exec.agentId).toBe('agent_writer')
  })
})

describe('beginChainExecution', () => {
  it('should transition to running', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)

    expect(state.activeExecutions.get(executionId)?.status).toBe('running')
  })

  it('should set startedAt', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)

    expect(state.activeExecutions.get(executionId)?.startedAt).not.toBeNull()
  })

  it('should handle unknown execution', () => {
    const state = createEmptyOrchestratorState()
    const result = beginChainExecution(state, 'unknown')
    expect(result).toBe(state)
  })
})

describe('recordStepStart', () => {
  it('should record step as running', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 0, 'tool_step_1')

    const exec = state.activeExecutions.get(executionId)
    expect(exec?.stepResults.has(0)).toBe(true)
    expect(exec?.stepResults.get(0)?.status).toBe('running')
  })

  it('should set currentStepIndex', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 2, 'tool_step_3')

    expect(state.activeExecutions.get(executionId)?.currentStepIndex).toBe(2)
  })
})

describe('recordStepCompletion', () => {
  it('should mark step as completed', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 0, 'tool_a')
    state = recordStepCompletion(state, executionId, 0, { result: 'done' }, 500)

    expect(state.activeExecutions.get(executionId)?.stepResults.get(0)?.status).toBe('completed')
  })

  it('should track tokens spent', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 0, 'tool_a')
    state = recordStepCompletion(state, executionId, 0, { output: true }, 1000)

    expect(state.activeExecutions.get(executionId)?.totalTokensSpent).toBe(1000)
  })

  it('should store output', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 0, 'tool_a')
    state = recordStepCompletion(state, executionId, 0, { chapters: 3 }, 200)

    expect(state.activeExecutions.get(executionId)?.stepResults.get(0)?.output).toEqual({ chapters: 3 })
  })
})

describe('recordStepFailure', () => {
  it('should mark step as failed', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 0, 'tool_failing')
    state = recordStepFailure(state, executionId, 0, 'Tool execution failed')

    expect(state.activeExecutions.get(executionId)?.stepResults.get(0)?.status).toBe('failed')
  })

  it('should record error message', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 0, 'tool_err')
    state = recordStepFailure(state, executionId, 0, 'Timeout reached')

    expect(state.activeExecutions.get(executionId)?.stepResults.get(0)?.error).toBe('Timeout reached')
  })

  it('should track fallback usage', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 0, 'tool_primary')
    state = recordStepFailure(state, executionId, 0, 'Failed', 'tool_fallback')

    const step = state.activeExecutions.get(executionId)?.stepResults.get(0)
    expect(step?.fallbackUsed).toBe(true)
    expect(step?.fallbackToolId).toBe('tool_fallback')
    expect(state.activeExecutions.get(executionId)?.fallbackCount).toBe(1)
  })
})

describe('completeChainExecution', () => {
  it('should mark as completed on success', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 0, 'tool_a')
    state = recordStepCompletion(state, executionId, 0, {}, 100)
    state = completeChainExecution(state, executionId, true)

    // Execution is removed from active after completion - check it moved to history
    expect(state.activeExecutions.has(executionId)).toBe(false)
    expect(state.executionHistory).toContain(executionId)
  })

  it('should mark as failed on failure', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = completeChainExecution(state, executionId, false, 'Chain failed')

    expect(state.activeExecutions.has(executionId)).toBe(false)
    expect(state.executionHistory).toContain(executionId)
  })

  it('should remove from active executions', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = completeChainExecution(state, executionId, true)

    expect(state.activeExecutions.has(executionId)).toBe(false)
  })

  it('should add to execution history', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = completeChainExecution(state, executionId, true)

    expect(state.executionHistory).toContain(executionId)
  })
})

describe('cancelChainExecution', () => {
  it('should remove from active executions', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = cancelChainExecution(state, executionId)

    expect(state.activeExecutions.has(executionId)).toBe(false)
  })

  it('should add to history', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = cancelChainExecution(s1, executionId)

    expect(state.executionHistory).toContain(executionId)
  })
})

// =============================================================================
// Dependency Resolution Tests
// =============================================================================

describe('resolveStepDependencies', () => {
  it('should return empty for unknown chain', () => {
    const reg = makeToolRegistryState()
    const result = resolveStepDependencies(reg, 'unknown', new Set())
    expect(result).toEqual([])
  })

  it('should mark all steps executable when no completed steps', () => {
    const chain = {
      id: 'chain_1',
      name: 'Test',
      description: '',
      steps: [
        { toolId: 'tool_a', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
        { toolId: 'tool_b', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
      ],
      estimatedTotalTokens: 1000,
      estimatedTotalTimeMs: 100,
      createdAt: Date.now(),
      usageCount: 0,
      successRate: 1.0,
    }
    const reg = makeToolRegistryState({ 'chain_1': chain })
    const result = resolveStepDependencies(reg, 'chain_1', new Set())

    expect(result.length).toBe(2)
    expect(result[0].canExecute).toBe(true)
    expect(result[1].canExecute).toBe(true)
  })

  it('should block step with unmet dependency', () => {
    const chain = {
      id: 'chain_dep',
      name: 'Dep Test',
      description: '',
      steps: [
        { toolId: 'tool_first', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
        { toolId: 'tool_second', dependsOn: ['tool_first'], parallelGroup: null, optional: false, fallbackToolId: null },
      ],
      estimatedTotalTokens: 1000,
      estimatedTotalTimeMs: 100,
      createdAt: Date.now(),
      usageCount: 0,
      successRate: 1.0,
    }
    const reg = makeToolRegistryState({ 'chain_dep': chain })
    const result = resolveStepDependencies(reg, 'chain_dep', new Set())

    expect(result[0].canExecute).toBe(true)
    expect(result[1].canExecute).toBe(false)
    expect(result[1].blockedBy).toContain(0)
  })

  it('should allow step when dependency is completed', () => {
    const chain = {
      id: 'chain_done',
      name: 'Done Test',
      description: '',
      steps: [
        { toolId: 'tool_first', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
        { toolId: 'tool_second', dependsOn: ['tool_first'], parallelGroup: null, optional: false, fallbackToolId: null },
      ],
      estimatedTotalTokens: 1000,
      estimatedTotalTimeMs: 100,
      createdAt: Date.now(),
      usageCount: 0,
      successRate: 1.0,
    }
    const reg = makeToolRegistryState({ 'chain_done': chain })
    const result = resolveStepDependencies(reg, 'chain_done', new Set([0]))

    expect(result[1].canExecute).toBe(true)
    expect(result[1].blockedBy).toEqual([])
  })
})

describe('getNextExecutableSteps', () => {
  it('should return indices of executable steps', () => {
    const chain = {
      id: 'chain_next',
      name: 'Next Test',
      description: '',
      steps: [
        { toolId: 'tool_a', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
        { toolId: 'tool_b', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
        { toolId: 'tool_c', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
      ],
      estimatedTotalTokens: 1000,
      estimatedTotalTimeMs: 100,
      createdAt: Date.now(),
      usageCount: 0,
      successRate: 1.0,
    }
    const reg = makeToolRegistryState({ 'chain_next': chain })
    const result = getNextExecutableSteps(reg, 'chain_next', new Set())

    expect(result).toEqual([0, 1, 2])
  })

  it('should exclude completed steps', () => {
    const chain = {
      id: 'chain_excl',
      name: 'Exclude Test',
      description: '',
      steps: [
        { toolId: 'tool_a', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
        { toolId: 'tool_b', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
      ],
      estimatedTotalTokens: 1000,
      estimatedTotalTimeMs: 100,
      createdAt: Date.now(),
      usageCount: 0,
      successRate: 1.0,
    }
    const reg = makeToolRegistryState({ 'chain_excl': chain })
    const result = getNextExecutableSteps(reg, 'chain_excl', new Set([0]))

    expect(result).toEqual([1])
  })
})

// =============================================================================
// Parallel Group Execution Tests
// =============================================================================

describe('groupStepsByParallelism', () => {
  it('should group sequential steps (null parallelGroup)', () => {
    const chain = {
      id: 'chain_seq',
      name: 'Sequential',
      description: '',
      steps: [
        { toolId: 'tool_1', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
        { toolId: 'tool_2', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
        { toolId: 'tool_3', dependsOn: [], parallelGroup: null, optional: false, fallbackToolId: null },
      ],
      estimatedTotalTokens: 1000,
      estimatedTotalTimeMs: 100,
      createdAt: Date.now(),
      usageCount: 0,
      successRate: 1.0,
    }
    const reg = makeToolRegistryState({ 'chain_seq': chain })
    const result = groupStepsByParallelism(reg, 'chain_seq', [0, 1, 2])

    expect(result.length).toBe(3)  // Each step in its own group
  })

  it('should group parallel steps (same parallelGroup)', () => {
    const chain = {
      id: 'chain_par',
      name: 'Parallel',
      description: '',
      steps: [
        { toolId: 'tool_a', dependsOn: [], parallelGroup: 1, optional: false, fallbackToolId: null },
        { toolId: 'tool_b', dependsOn: [], parallelGroup: 1, optional: false, fallbackToolId: null },
        { toolId: 'tool_c', dependsOn: [], parallelGroup: 2, optional: false, fallbackToolId: null },
      ],
      estimatedTotalTokens: 1000,
      estimatedTotalTimeMs: 100,
      createdAt: Date.now(),
      usageCount: 0,
      successRate: 1.0,
    }
    const reg = makeToolRegistryState({ 'chain_par': chain })
    const result = groupStepsByParallelism(reg, 'chain_par', [0, 1, 2])

    const group1 = result.find(g => g.groupNumber === 1)
    expect(group1?.stepIndices).toEqual([0, 1])
  })

  it('should return empty for unknown chain', () => {
    const reg = makeToolRegistryState()
    const result = groupStepsByParallelism(reg, 'unknown', [0, 1])
    expect(result).toEqual([])
  })
})

// =============================================================================
// Execution State Queries Tests
// =============================================================================

describe('getExecutionProgress', () => {
  it('should return null for unknown execution', () => {
    const state = createEmptyOrchestratorState()
    expect(getExecutionProgress(state, 'unknown')).toBeNull()
  })

  it('should calculate percentage', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'chain_1')
    state = beginChainExecution(s1, executionId)
    state = recordStepStart(state, executionId, 0, 'tool_a')
    state = recordStepCompletion(state, executionId, 0, {}, 100)
    state = recordStepStart(state, executionId, 1, 'tool_b')

    const progress = getExecutionProgress(state, executionId)
    expect(progress?.current).toBe(1)
  })
})

describe('getActiveExecutionCount', () => {
  it('should return 0 for empty state', () => {
    const state = createEmptyOrchestratorState()
    expect(getActiveExecutionCount(state)).toBe(0)
  })

  it('should count active executions', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1 } = startChainExecution(state, 'chain_1')
    const { state: s2 } = startChainExecution(s1, 'chain_2')

    expect(getActiveExecutionCount(s2)).toBe(2)
  })
})

describe('isChainExecuting', () => {
  it('should return false when no active executions', () => {
    const state = createEmptyOrchestratorState()
    expect(isChainExecuting(state, 'chain_1')).toBe(false)
  })

  it('should return true when chain is executing', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1 } = startChainExecution(state, 'chain_target')
    state = beginChainExecution(s1, Array.from(s1.activeExecutions.keys())[0])

    expect(isChainExecuting(s1, 'chain_target')).toBe(true)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatExecutionProgress', () => {
  it('should show not found for unknown', () => {
    const state = createEmptyOrchestratorState()
    expect(formatExecutionProgress(state, 'unknown')).toContain('not found')
  })

  it('should format active execution', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1, executionId } = startChainExecution(state, 'my_chain')
    state = beginChainExecution(s1, executionId)

    const formatted = formatExecutionProgress(state, executionId)
    expect(formatted).toContain('my_chain')
    expect(formatted).toContain('running')
  })
})

describe('formatOrchestratorDashboard', () => {
  it('should show empty state', () => {
    const state = createEmptyOrchestratorState()
    const dashboard = formatOrchestratorDashboard(state)
    expect(dashboard).toContain('Tool Chain Orchestrator Dashboard')
    expect(dashboard).toContain('Active Executions: 0')
  })

  it('should show active executions', () => {
    let state = createEmptyOrchestratorState()
    const { state: s1 } = startChainExecution(state, 'active_chain')

    const dashboard = formatOrchestratorDashboard(s1)
    expect(dashboard).toContain('Active Executions: 1')
  })
})