/**
 * protocol/__tests__/studio-integration.test.ts (V2502)
 */

import { describe, it, expect } from 'vitest'
import {
  StudioStore, studioReducer, INITIAL_STUDIO_STATE, type StudioAgent,
} from '../StudioState'
import {
  computeMetrics, exportStudioState, importStudioState, validateStudioState,
  DEFAULT_STUDIO_SCHEMA, StudioSnapshotManager, StudioSelection,
} from '../StudioAdvanced'
import { createSoul, createUserBinding, createMemoryScope } from '../../index'

const makeAgent = (id: string): StudioAgent => ({
  id,
  soul: createSoul({ agentId: id, archetype: 'critic', displayName: id, capabilities: ['plot'] }),
  binding: createUserBinding({ agentId: id }),
  memoryScope: createMemoryScope({ agentId: id }),
  position: { x: 0, y: 0 },
  selected: false,
})

describe('Studio — end-to-end', () => {
  it('full lifecycle: spawn 5 agents + 3 connections + edit', () => {
    const store = new StudioStore()
    for (let i = 0; i < 5; i++) store.dispatch({ type: 'agent.add', agent: makeAgent(`a${i}`) })
    store.dispatch({ type: 'connection.add', connection: { from: 'a0', to: 'a1', type: 'message' } })
    store.dispatch({ type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'memory' } })
    store.dispatch({ type: 'connection.add', connection: { from: 'a2', to: 'a3', type: 'delegation' } })
    store.dispatch({ type: 'agent.move', agentId: 'a0', position: { x: 100, y: 200 } })
    const s = store.getState()
    expect(s.agents.length).toBe(5)
    expect(s.connections.length).toBe(3)
    expect(s.agents[0].position.x).toBe(100)
  })

  it('undo/redo full flow', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    store.dispatch({ type: 'agent.add', agent: makeAgent('a2') })
    expect(store.getState().agents.length).toBe(2)
    store.dispatch({ type: 'history.undo' })
    expect(store.getState().agents.length).toBe(1)
    store.dispatch({ type: 'history.redo' })
    expect(store.getState().agents.length).toBe(2)
  })

  it('metrics update on changes', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    const m = computeMetrics(store.getState())
    expect(m.agentCount).toBe(1)
    expect(m.totalChanges).toBe(1)
  })

  it('validation passes for valid state', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    const r = validateStudioState(store.getState(), DEFAULT_STUDIO_SCHEMA)
    expect(r.valid).toBe(true)
  })

  it('export + import roundtrip', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    const json = exportStudioState(store.getState())
    const back = importStudioState(json)
    expect(back.agents.length).toBe(1)
  })

  it('snapshot + restore', () => {
    const store = new StudioStore()
    const sm = new StudioSnapshotManager()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    const snap = sm.take(store.getState(), 'before-edit')
    store.dispatch({ type: 'agent.add', agent: makeAgent('a2') })
    expect(store.getState().agents.length).toBe(2)
    const restored = sm.restore(snap.timestamp)
    if (restored) store.replace(restored)
    expect(store.getState().agents.length).toBe(1)
  })

  it('selection management', () => {
    const sel = new StudioSelection()
    sel.selectAgent('a1')
    sel.selectAgent('a2')
    sel.selectConnection('a1', 'a2')
    // selectConnection clears agents
    expect(sel.selectedAgents().length).toBe(0)
    expect(sel.selectedConnections().length).toBe(1)
  })
})
