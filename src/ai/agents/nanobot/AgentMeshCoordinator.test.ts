/**
 * AgentMeshCoordinator Tests - V119
 * Tests for Distributed Multi-Agent Mesh Coordination System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyMeshCoordinationState,
  registerAgent,
  unregisterAgent,
  updateAgentStatus,
  updateAgentWorkload,
  recordTaskResult,
  sendMessage,
  selectAgentByRole,
  selectCoordinator,
  getAgentsByRole,
  getAvailableAgents,
  autoSpecializeAgent,
  detectIdleAgents,
  calculateMeshHealth,
  formatMeshSummary,
  formatAgentDetails,
  formatMessageQueue,
  DEFAULT_MESH_CONFIG,
} from './AgentMeshCoordinator'

// =============================================================================
// Helpers
// =============================================================================

function makeTestAgent(overrides: Partial<{
  id: string
  role: any
  status: any
  workload: number
  successRate: number
  isOnline?: boolean
  totalTasks?: number
  failedTasks?: number
  specializations?: string[]
}> = {}): any {
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
// createEmptyMeshCoordinationState Tests
// =============================================================================

describe('createEmptyMeshCoordinationState', () => {
  it('should create empty state', () => {
    const state = createEmptyMeshCoordinationState()
    expect(state.agents.size).toBe(0)
    expect(state.totalMessages).toBe(0)
    expect(state.meshHealth).toBe(100)
  })

  it('should have zero messages', () => {
    const state = createEmptyMeshCoordinationState()
    expect(state.messages.length).toBe(0)
    expect(state.messageQueue.length).toBe(0)
  })
})

// =============================================================================
// registerAgent Tests
// =============================================================================

describe('registerAgent', () => {
  it('should register an agent', () => {
    const state = createEmptyMeshCoordinationState()
    const agent = makeTestAgent({ id: 'agent1', role: 'writer' })
    const newState = registerAgent(state, agent)
    expect(newState.agents.size).toBe(1)
    expect(newState.agentRegistry.get('writer')?.length).toBe(1)
  })

  it('should register multiple agents with same role', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', role: 'writer' }))
    state = registerAgent(state, makeTestAgent({ id: 'agent2', role: 'writer' }))
    expect(state.agents.size).toBe(2)
    expect(state.agentRegistry.get('writer')?.length).toBe(2)
  })

  it('should not duplicate agent id for same role', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', role: 'writer' }))
    state = registerAgent(state, makeTestAgent({ id: 'agent1', role: 'writer' }))
    expect(state.agents.size).toBe(1)
  })
})

// =============================================================================
// unregisterAgent Tests
// =============================================================================

describe('unregisterAgent', () => {
  it('should remove an agent', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', role: 'writer' }))
    state = unregisterAgent(state, 'agent1')
    expect(state.agents.size).toBe(0)
  })

  it('should remove from role registry', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', role: 'reviewer' }))
    state = unregisterAgent(state, 'agent1')
    expect(state.agentRegistry.get('reviewer')?.length).toBe(0)
  })

  it('should handle non-existent agent', () => {
    const state = createEmptyMeshCoordinationState()
    const result = unregisterAgent(state, 'nonexistent')
    expect(result.agents.size).toBe(0)
  })
})

// =============================================================================
// updateAgentStatus Tests
// =============================================================================

describe('updateAgentStatus', () => {
  it('should update status to active', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', status: 'idle' }))
    state = updateAgentStatus(state, 'agent1', 'active')
    expect(state.agents.get('agent1')?.status).toBe('active')
  })

  it('should set isOnline to false when offline', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', status: 'active' }))
    state = updateAgentStatus(state, 'agent1', 'offline')
    expect(state.agents.get('agent1')?.isOnline).toBe(false)
  })

  it('should update lastActiveTime when going active', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', status: 'idle' }))
    const before = Date.now()
    state = updateAgentStatus(state, 'agent1', 'active')
    expect(state.agents.get('agent1')!.lastActiveTime).toBeGreaterThanOrEqual(before)
  })
})

// =============================================================================
// updateAgentWorkload Tests
// =============================================================================

describe('updateAgentWorkload', () => {
  it('should update workload', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1' }))
    state = updateAgentWorkload(state, 'agent1', 75)
    expect(state.agents.get('agent1')?.workload).toBe(75)
  })

  it('should clamp workload to 0-100', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1' }))
    state = updateAgentWorkload(state, 'agent1', 150)
    expect(state.agents.get('agent1')?.workload).toBe(100)
    state = updateAgentWorkload(state, 'agent1', -20)
    expect(state.agents.get('agent1')?.workload).toBe(0)
  })
})

// =============================================================================
// recordTaskResult Tests
// =============================================================================

describe('recordTaskResult', () => {
  it('should increment totalTasks on success', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', totalTasks: 5 }))
    state = recordTaskResult(state, 'agent1', true)
    expect(state.agents.get('agent1')?.totalTasks).toBe(6)
  })

  it('should increment failedTasks on failure', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', totalTasks: 5 }))
    state = recordTaskResult(state, 'agent1', false)
    expect(state.agents.get('agent1')?.failedTasks).toBe(1)
  })

  it('should update successRate', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', totalTasks: 10, successRate: 0.8 }))
    state = recordTaskResult(state, 'agent1', true)
    // (10 * 0.8 + 1) / 11 = 9/11
    expect(state.agents.get('agent1')?.successRate).toBeGreaterThan(0.8)
  })
})

// =============================================================================
// sendMessage Tests
// =============================================================================

describe('sendMessage', () => {
  it('should add message to queue', () => {
    const state = createEmptyMeshCoordinationState()
    const newState = sendMessage(state, {
      fromAgentId: 'agent1',
      toAgentId: 'agent2',
      content: { type: 'task', data: 'hello' },
      priority: 'normal',
      headers: {},
    })
    expect(newState.messageQueue.length).toBe(1)
    expect(newState.totalMessages).toBe(1)
    expect(newState.pendingMessages).toBe(1)
  })

  it('should generate message id', () => {
    const state = createEmptyMeshCoordinationState()
    const newState = sendMessage(state, {
      fromAgentId: 'agent1',
      toAgentId: 'agent2',
      content: {},
      priority: 'high',
      headers: {},
    })
    expect(newState.messageQueue[0].id).toMatch(/^msg_/)
  })

  it('should support mesh broadcast', () => {
    const state = createEmptyMeshCoordinationState()
    const newState = sendMessage(state, {
      fromAgentId: 'coordinator',
      toAgentId: 'mesh',
      content: { type: 'broadcast' },
      priority: 'normal',
      headers: {},
    })
    expect(newState.messageQueue[0].toAgentId).toBe('mesh')
  })
})

// =============================================================================
// selectAgentByRole Tests
// =============================================================================

describe('selectAgentByRole', () => {
  it('should return agent id with lowest workload', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', role: 'writer', workload: 80 }))
    state = registerAgent(state, makeTestAgent({ id: 'agent2', role: 'writer', workload: 20 }))
    state = registerAgent(state, makeTestAgent({ id: 'agent3', role: 'writer', workload: 50 }))

    const selected = selectAgentByRole(state, 'writer')
    expect(selected).toBe('agent2')
  })

  it('should return null when no agents available', () => {
    const state = createEmptyMeshCoordinationState()
    const selected = selectAgentByRole(state, 'writer')
    expect(selected).toBeNull()
  })

  it('should skip offline agents', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', role: 'writer', isOnline: false }))
    state = registerAgent(state, makeTestAgent({ id: 'agent2', role: 'writer', workload: 90 }))

    const selected = selectAgentByRole(state, 'writer')
    // agent1 is offline, agent2 is available with workload=90
    expect(selected).toBe('agent2')
  })
})

// =============================================================================
// getAgentsByRole Tests
// =============================================================================

describe('getAgentsByRole', () => {
  it('should return all agents for role', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'a1', role: 'editor' }))
    state = registerAgent(state, makeTestAgent({ id: 'a2', role: 'editor' }))

    const editors = getAgentsByRole(state, 'editor')
    expect(editors.length).toBe(2)
  })
})

// =============================================================================
// getAvailableAgents Tests
// =============================================================================

describe('getAvailableAgents', () => {
  it('should return only online agents', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'a1', isOnline: true }))
    state = registerAgent(state, makeTestAgent({ id: 'a2', isOnline: false }))

    const available = getAvailableAgents(state)
    expect(available.length).toBe(1)
  })
})

// =============================================================================
// autoSpecializeAgent Tests
// =============================================================================

describe('autoSpecializeAgent', () => {
  it('should add specialization', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1' }))
    state = autoSpecializeAgent(state, 'agent1', 'dialogue_expert')

    const agent = state.agents.get('agent1')
    expect(agent?.specializations).toContain('dialogue_expert')
  })

  it('should not duplicate specialization', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', specializations: ['dialogue_expert'] }))
    state = autoSpecializeAgent(state, 'agent1', 'dialogue_expert')

    const agent = state.agents.get('agent1')
    expect(agent?.specializations.filter(s => s === 'dialogue_expert').length).toBe(1)
  })
})

// =============================================================================
// calculateMeshHealth Tests
// =============================================================================

describe('calculateMeshHealth', () => {
  it('should return 0 for empty mesh', () => {
    const state = createEmptyMeshCoordinationState()
    expect(calculateMeshHealth(state)).toBe(0)
  })

  it('should return high health for healthy agents', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'a1', successRate: 1.0, workload: 50 }))
    state = registerAgent(state, makeTestAgent({ id: 'a2', successRate: 1.0, workload: 50 }))

    const health = calculateMeshHealth(state)
    expect(health).toBeGreaterThan(80)
  })

  it('should reflect agent quality in health', () => {
    let statePerfect = createEmptyMeshCoordinationState()
    statePerfect = registerAgent(statePerfect, makeTestAgent({ id: 'a1', successRate: 1.0, workload: 50 }))
    const healthPerfect = calculateMeshHealth(statePerfect)

    let stateLow = createEmptyMeshCoordinationState()
    stateLow = registerAgent(stateLow, makeTestAgent({ id: 'a1', successRate: 0.1, workload: 50 }))
    const healthLow = calculateMeshHealth(stateLow)

    expect(healthLow).toBeLessThan(healthPerfect)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatMeshSummary', () => {
  it('should format summary', () => {
    const state = createEmptyMeshCoordinationState()
    const summary = formatMeshSummary(state)
    expect(summary).toContain('Agent Mesh Summary')
  })

  it('should show zero counts for empty mesh', () => {
    const state = createEmptyMeshCoordinationState()
    const summary = formatMeshSummary(state)
    expect(summary).toContain('Total Agents: 0')
  })
})

describe('formatAgentDetails', () => {
  it('should format agent details', () => {
    let state = createEmptyMeshCoordinationState()
    state = registerAgent(state, makeTestAgent({ id: 'agent1', role: 'writer' }))
    const details = formatAgentDetails(state, 'agent1')
    expect(details).toContain('agent1')
    expect(details).toContain('writer')
  })

  it('should show not found for unknown agent', () => {
    const state = createEmptyMeshCoordinationState()
    const details = formatAgentDetails(state, 'unknown')
    expect(details).toContain('not found')
  })
})

describe('formatMessageQueue', () => {
  it('should format queue', () => {
    const state = createEmptyMeshCoordinationState()
    const output = formatMessageQueue(state)
    expect(output).toContain('Message Queue')
  })
})