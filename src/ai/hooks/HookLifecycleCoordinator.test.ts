/**
 * HookLifecycleCoordinator Tests - V115
 * Tests for Hook Lifecycle Coordination Pipeline
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyLifecycleCoordinatorState,
  registerLifecycleHook,
  unregisterLifecycleHook,
  enableHook,
  disableHook,
  executeLifecyclePhase,
  getHooksByPhase,
  getHooksByPriority,
  getHookStats,
  getRecentExecutions,
  getFailedExecutions,
  formatLifecycleSummary,
  DEFAULT_LIFECYCLE_CONFIG,
} from './HookLifecycleCoordinator'

// =============================================================================
// Helper
// =============================================================================

function simpleHandler(context: any) {
  context.executed = true
}

// =============================================================================
// createEmptyLifecycleCoordinatorState Tests
// =============================================================================

describe('createEmptyLifecycleCoordinatorState', () => {
  it('should create empty state', () => {
    const state = createEmptyLifecycleCoordinatorState()
    expect(state.hooks.size).toBe(0)
    expect(state.stats.totalHooksRegistered).toBe(0)
    expect(state.stats.totalExecutions).toBe(0)
    expect(state.isProcessing).toBe(false)
  })

  it('should set max history size', () => {
    const state = createEmptyLifecycleCoordinatorState({ maxHistorySize: 500 })
    expect(state.maxHistorySize).toBe(500)
  })
})

// =============================================================================
// registerLifecycleHook Tests
// =============================================================================

describe('registerLifecycleHook', () => {
  it('should register a hook', () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, {
      phase: 'session_start',
      priority: 'high',
      handler: simpleHandler,
    })
    expect(state.hooks.size).toBe(1)
    expect(state.stats.totalHooksRegistered).toBe(1)
    expect(state.stats.hooksByPhase.session_start).toBe(1)
    expect(state.stats.hooksByPriority.high).toBe(1)
  })

  it('should register with custom id', () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, {
      id: 'custom_hook_1',
      phase: 'session_end',
      priority: 'medium',
      handler: simpleHandler,
    })
    expect(state.hooks.has('custom_hook_1')).toBe(true)
  })

  it('should increment phase counter', () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, { phase: 'quality_analyzed', priority: 'high', handler: simpleHandler })
    state = registerLifecycleHook(state, { phase: 'quality_analyzed', priority: 'medium', handler: simpleHandler })
    expect(state.stats.hooksByPhase.quality_analyzed).toBe(2)
  })
})

// =============================================================================
// unregisterLifecycleHook Tests
// =============================================================================

describe('unregisterLifecycleHook', () => {
  it('should remove a hook', () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, { phase: 'session_start', priority: 'high', handler: simpleHandler })
    const hookId = state.hooks.keys().next().value
    state = unregisterLifecycleHook(state, hookId)
    expect(state.hooks.size).toBe(0)
  })

  it('should decrement stats', () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, { phase: 'session_end', priority: 'low', handler: simpleHandler })
    const hookId = state.hooks.keys().next().value
    state = unregisterLifecycleHook(state, hookId)
    expect(state.stats.hooksByPhase.session_end).toBe(0)
    expect(state.stats.hooksByPriority.low).toBe(0)
  })
})

// =============================================================================
// enableHook / disableHook Tests
// =============================================================================

describe('enableHook / disableHook', () => {
  it('should disable and re-enable hook', () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, { phase: 'session_start', priority: 'high', handler: simpleHandler })
    const hookId = state.hooks.keys().next().value

    state = disableHook(state, hookId)
    expect(state.hooks.get(hookId)!.enabled).toBe(false)

    state = enableHook(state, hookId)
    expect(state.hooks.get(hookId)!.enabled).toBe(true)
  })
})

// =============================================================================
// executeLifecyclePhase Tests
// =============================================================================

describe('executeLifecyclePhase', () => {
  it('should execute registered hooks', async () => {
    let state = createEmptyLifecycleCoordinatorState()
    let executed = false
    state = registerLifecycleHook(state, {
      phase: 'session_start',
      priority: 'high',
      handler: () => { executed = true },
    })

    const context = { phase: 'session_start' as const, timestamp: Date.now(), metadata: {} }
    state = await executeLifecyclePhase(state, 'session_start', context)
    expect(executed).toBe(true)
  })

  it('should track execution stats', async () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, {
      phase: 'session_end',
      priority: 'medium',
      handler: () => {},
    })

    const context = { phase: 'session_end' as const, timestamp: Date.now(), metadata: {} }
    state = await executeLifecyclePhase(state, 'session_end', context)
    expect(state.stats.totalExecutions).toBe(1)
  })

  it('should execute in priority order', async () => {
    let state = createEmptyLifecycleCoordinatorState()
    const order: string[] = []

    state = registerLifecycleHook(state, {
      phase: 'quality_analyzed',
      priority: 'low',
      handler: () => order.push('low'),
    })
    state = registerLifecycleHook(state, {
      phase: 'quality_analyzed',
      priority: 'critical',
      handler: () => order.push('critical'),
    })
    state = registerLifecycleHook(state, {
      phase: 'quality_analyzed',
      priority: 'high',
      handler: () => order.push('high'),
    })

    const context = { phase: 'quality_analyzed' as const, timestamp: Date.now(), metadata: {} }
    state = await executeLifecyclePhase(state, 'quality_analyzed', context)
    expect(order[0]).toBe('critical')
    expect(order[1]).toBe('high')
    expect(order[2]).toBe('low')
  })

  it('should skip disabled hooks', async () => {
    let state = createEmptyLifecycleCoordinatorState()
    let executed = false

    state = registerLifecycleHook(state, {
      id: 'disabled_hook',
      phase: 'session_start',
      priority: 'high',
      handler: () => { executed = true },
    })

    state = disableHook(state, 'disabled_hook')
    const context = { phase: 'session_start' as const, timestamp: Date.now(), metadata: {} }
    state = await executeLifecyclePhase(state, 'session_start', context)
    expect(executed).toBe(false)
  })
})

// =============================================================================
// getHooksByPhase Tests
// =============================================================================

describe('getHooksByPhase', () => {
  it('should return hooks for phase', () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, { phase: 'session_start', priority: 'high', handler: simpleHandler })
    state = registerLifecycleHook(state, { phase: 'session_end', priority: 'medium', handler: simpleHandler })

    const startHooks = getHooksByPhase(state, 'session_start')
    expect(startHooks.length).toBe(1)
  })
})

// =============================================================================
// getHooksByPriority Tests
// =============================================================================

describe('getHooksByPriority', () => {
  it('should return hooks for priority', () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, { phase: 'session_start', priority: 'high', handler: simpleHandler })
    state = registerLifecycleHook(state, { phase: 'session_end', priority: 'low', handler: simpleHandler })

    const highHooks = getHooksByPriority(state, 'high')
    expect(highHooks.length).toBe(1)
  })
})

// =============================================================================
// getHookStats Tests
// =============================================================================

describe('getHookStats', () => {
  it('should return hook stats', () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, {
      id: 'test_hook',
      phase: 'session_start',
      priority: 'high',
      handler: simpleHandler,
    })

    const stats = getHookStats(state, 'test_hook')
    expect(stats).not.toBeNull()
    expect(stats!.executionCount).toBe(0)
  })

  it('should return null for unknown hook', () => {
    const state = createEmptyLifecycleCoordinatorState()
    const stats = getHookStats(state, 'unknown')
    expect(stats).toBeNull()
  })
})

// =============================================================================
// getRecentExecutions Tests
// =============================================================================

describe('getRecentExecutions', () => {
  it('should return recent executions', async () => {
    let state = createEmptyLifecycleCoordinatorState()
    state = registerLifecycleHook(state, { phase: 'session_start', priority: 'high', handler: simpleHandler })

    const context = { phase: 'session_start' as const, timestamp: Date.now(), metadata: {} }
    state = await executeLifecyclePhase(state, 'session_start', context)

    const recent = getRecentExecutions(state, 5)
    expect(recent.length).toBeGreaterThan(0)
  })
})

// =============================================================================
// getFailedExecutions Tests
// =============================================================================

describe('getFailedExecutions', () => {
  it('should return empty for no failures', () => {
    const state = createEmptyLifecycleCoordinatorState()
    const failures = getFailedExecutions(state)
    expect(failures.length).toBe(0)
  })
})

// =============================================================================
// formatLifecycleSummary Tests
// =============================================================================

describe('formatLifecycleSummary', () => {
  it('should format summary', () => {
    const state = createEmptyLifecycleCoordinatorState()
    const summary = formatLifecycleSummary(state)
    expect(summary).toContain('Lifecycle Coordinator Summary')
    expect(summary).toContain('Total Hooks Registered: 0')
  })
})