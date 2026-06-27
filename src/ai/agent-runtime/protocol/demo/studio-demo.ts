/**
 * protocol/demo/studio-demo.ts (V2501)
 */

import { StudioStore, INITIAL_STUDIO_STATE, studioReducer, type StudioAgent } from '../StudioState'
import { computeMetrics, exportStudioState, importStudioState, StudioSnapshotManager } from '../StudioAdvanced'
import { createSoul, createUserBinding, createMemoryScope } from '../../index'

export function runStudioDemo(): {
  agentCount: number
  connectionCount: number
  totalChanges: number
  exportValid: boolean
} {
  const store = new StudioStore()
  // 5 agents
  for (let i = 0; i < 5; i++) {
    const a: StudioAgent = {
      id: `a${i}`,
      soul: createSoul({ agentId: `a${i}`, archetype: 'specialist', displayName: `A${i}`, capabilities: ['plot'] }),
      binding: createUserBinding({ agentId: `a${i}` }),
      memoryScope: createMemoryScope({ agentId: `a${i}` }),
      position: { x: i * 100, y: 0 },
      selected: false,
    }
    store.dispatch({ type: 'agent.add', agent: a })
  }
  // 2 connections
  store.dispatch({ type: 'connection.add', connection: { from: 'a0', to: 'a1', type: 'message' } })
  store.dispatch({ type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'delegation' } })
  // Select one
  store.dispatch({ type: 'agent.select', agentId: 'a2' })
  // Export + import
  const json = exportStudioState(store.getState())
  const back = importStudioState(json)
  return {
    agentCount: back.agents.length,
    connectionCount: back.connections.length,
    totalChanges: computeMetrics(back).totalChanges,
    exportValid: back.agents.length === 5,
  }
}
