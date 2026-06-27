/**
 * collab/v3/StudioPanels.smoke.test.ts (H6-H10) - 5 engines store-level 测试
 */

import { describe, it, expect } from 'vitest'
import { StudioStore, INITIAL_STUDIO_STATE, type StudioAgent, preparePanelData } from '../../ai/agent-runtime/protocol/StudioState'
import { computeMetrics } from '../../ai/agent-runtime/protocol/StudioAdvanced'
import { MemoryAccessLog } from '../../ai/agent-runtime/protocol/MemoryGuard'
import { AgentHookEmitter } from '../../ai/agent-runtime/AgentHookEmitter'
import { createSoul, createUserBinding, createMemoryScope } from '../../ai/agent-runtime'

const makeAgent = (id: string): StudioAgent => ({
  id,
  soul: createSoul({ agentId: id, archetype: 'critic', displayName: id, capabilities: ['plot'] }),
  binding: createUserBinding({ agentId: id }),
  memoryScope: createMemoryScope({ agentId: id }),
  position: { x: 100, y: 100 },
  selected: false,
})

describe('H6: PropertyPanel logic (state.agents lookup)', () => {
  it('returns selected agent', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    store.dispatch({ type: 'agent.select', agentId: 'a1' })
    const state = store.getState()
    const agent = state.agents.find(a => a.id === state.selectedAgentId)
    expect(agent?.id).toBe('a1')
    expect(agent?.soul.persona.displayName).toBe('a1')
  })

  it('null when no selection', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    const agent = store.getState().agents.find(a => a.id === store.getState().selectedAgentId)
    expect(agent).toBeUndefined()
  })
})

describe('H7: MetricsPanel logic (computeMetrics)', () => {
  it('computes agentCount + connectionCount + totalChanges', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    store.dispatch({ type: 'agent.add', agent: makeAgent('a2') })
    store.dispatch({ type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'message' } })
    const m = computeMetrics(store.getState())
    expect(m.agentCount).toBe(2)
    expect(m.connectionCount).toBe(1)
    expect(m.totalChanges).toBe(3)
  })

  it('prepares panel data for metrics type', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    const panel = { id: 'p1', type: 'metrics' as const, title: 'M', position: 'right' as const, visible: true }
    const data = preparePanelData(panel, store.getState())
    expect(data.type).toBe('metrics')
    expect((data.data as { version: number }).version).toBeGreaterThan(0)
  })
})

describe('H8: MemoryPanel logic (MemoryAccessLog)', () => {
  it('records and queries access log', () => {
    const log = new MemoryAccessLog()
    log.record({ agentId: 'a1', operation: 'read', level: 'L1' })
    log.record({ agentId: 'a1', operation: 'write', level: 'L2' })
    log.record({ agentId: 'a2', operation: 'read', level: 'L1' })
    const a1Log = log.query({ agentId: 'a1' })
    expect(a1Log.length).toBe(2)
  })

  it('query returns all if no filter', () => {
    const log = new MemoryAccessLog()
    log.record({ agentId: 'a1', operation: 'read', level: 'L1' })
    expect(log.query().length).toBe(1)
  })
})

describe('H9: HookLogPanel logic (AgentHookEmitter)', () => {
  it('emits + subscribe', async () => {
    const emitter = new AgentHookEmitter()
    let called = 0
    emitter.subscribe('agent.spawn.after' as any, () => { called += 1 })
    await emitter.emit('agent.spawn.after' as any, {
      agentId: 'a1',
      archetype: 'critic',
      displayName: 'A',
      timestamp: Date.now(),
    })
    expect(called).toBe(1)
  })

  it('emitSync does not block', () => {
    const emitter = new AgentHookEmitter()
    let called = 0
    emitter.subscribe('agent.spawn.after' as any, () => { called += 1 })
    emitter.emitSync('agent.spawn.after' as any, {
      agentId: 'a1',
      archetype: 'critic',
      displayName: 'A',
      timestamp: Date.now(),
    })
    expect(called).toBe(1)
  })
})

describe('H10: MessageLogPanel logic (state.connections reduce)', () => {
  it('counts connections by type', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    store.dispatch({ type: 'agent.add', agent: makeAgent('a2') })
    store.dispatch({ type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'message' } })
    store.dispatch({ type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'memory' } })
    const counts = store.getState().connections.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    expect(counts.message).toBe(1)
    expect(counts.memory).toBe(1)
  })

  it('empty connections', () => {
    expect(INITIAL_STUDIO_STATE.connections.length).toBe(0)
  })
})