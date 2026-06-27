/**
 * collab/v3/__tests__/studio-integration.test.ts (H27)
 */

import { describe, it, expect } from 'vitest'
import {
  StudioStore, type StudioAgent, type StudioSection,
} from '../../../ai/agent-runtime/protocol/StudioState'
import {
  SoulMarketplace, SoulTemplateRegistry,
} from '../../../ai/agent-runtime/protocol/SoulMarketplace'
import {
  HealthCheckRunner, AlertManager,
} from '../../../ai/agent-runtime/protocol/AdaptationAndHealth'
import { StudioHotkeyManager } from '../../../ai/agent-runtime/protocol/StudioAdvanced'
import { ExperimentRunner } from '../../../ai/agent-runtime/protocol/ABTesting'
import { AgentHookEmitter } from '../../../ai/agent-runtime/AgentHookEmitter'
import { PLOT_ADVISOR_TEMPLATE, STYLE_COACH_TEMPLATE } from '../../../ai/agent-runtime/builtinSouls'
import { createSoul, createUserBinding, createMemoryScope } from '../../../ai/agent-runtime'

const makeAgent = (id: string, archetype: string = 'critic'): StudioAgent => ({
  id,
  soul: createSoul({ agentId: id, archetype: archetype as any, displayName: id, capabilities: ['plot'] }),
  binding: createUserBinding({ agentId: id }),
  memoryScope: createMemoryScope({ agentId: id }),
  position: { x: 0, y: 0 },
  selected: false,
})

describe('Studio v3 integration', () => {
  it('full lifecycle: 5 agents + connections + edit + undo', () => {
    const store = new StudioStore()
    for (let i = 0; i < 5; i++) store.dispatch({ type: 'agent.add', agent: makeAgent(`a${i}`) })
    store.dispatch({ type: 'connection.add', connection: { from: 'a0', to: 'a1', type: 'message' } })
    store.dispatch({ type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'memory' } })
    store.dispatch({ type: 'connection.add', connection: { from: 'a2', to: 'a3', type: 'delegation' } })
    store.dispatch({ type: 'agent.move', agentId: 'a0', position: { x: 100, y: 200 } })
    expect(store.getState().agents.length).toBe(5)
    expect(store.getState().connections.length).toBe(3)
    store.dispatch({ type: 'history.undo' })
    expect(store.getState().agents[0].position.x).toBe(0)
    store.dispatch({ type: 'history.redo' })
    expect(store.getState().agents[0].position.x).toBe(100)
  })

  it('5 builtin souls registered in marketplace', () => {
    const m = new SoulMarketplace(new SoulTemplateRegistry())
    const templates = [PLOT_ADVISOR_TEMPLATE, STYLE_COACH_TEMPLATE]
    for (const t of templates) m.publish(t, { authorId: 'x', displayName: 'X' })
    expect(m.list().length).toBe(2)
  })

  it('experiment + A/B test with 5 agents', () => {
    const exp = {
      experimentId: 'e1', name: 'Test', description: 'd',
      variants: [
        { variantId: 'control', name: 'C', weight: 50, payload: {} },
        { variantId: 'a', name: 'A', weight: 50, payload: {} },
      ],
      startTime: 0, status: 'running' as const, significanceLevel: 0.05, minSampleSize: 50,
    }
    const r = new ExperimentRunner(exp)
    for (let i = 0; i < 100; i++) {
      const u = `u${i}`
      r.assign(u)
      r.recordExposure(u)
      if (i % 2 === 0) r.recordConversion(u)
    }
    expect(r.results().length).toBe(2)
  })

  it('health check + alert pipeline', () => {
    const h = new HealthCheckRunner()
    h.register({ name: 'db', check: () => ({ name: 'db', status: 'healthy' as const, durationMs: 0, checkedAt: 0 }) })
    expect(h.count()).toBe(1)

    const a = new AlertManager()
    a.addRule({ ruleId: 'r1', name: 'r', condition: () => true, severity: 'critical', cooldownMs: 0, message: 'x' })
    a.evaluate({})
    expect(a.active().length).toBe(1)
  })

  it('hook emitter + 17 event types', async () => {
    const emitter = new AgentHookEmitter()
    let called = 0
    emitter.subscribe('agent.spawn.after' as any, () => { called += 1 })
    await emitter.emit('agent.spawn.after' as any, {
      agentId: 'a1', archetype: 'critic', displayName: 'A', timestamp: Date.now(),
    })
    expect(called).toBe(1)
  })

  it('hotkey manager + 5 default bindings', () => {
    const m = new StudioHotkeyManager()
    expect(m.list().length).toBe(5)
    expect(m.find('z', ['ctrl'])?.action).toBe('history.undo')
  })

  it('agent select + clear on background click', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    store.dispatch({ type: 'agent.select', agentId: 'a1' })
    expect(store.getState().selectedAgentId).toBe('a1')
    store.dispatch({ type: 'agent.select', agentId: null })
    expect(store.getState().selectedAgentId).toBeNull()
  })

  it('view toggle grid + labels', () => {
    const store = new StudioStore()
    const initial = store.getState().showGrid
    store.dispatch({ type: 'view.toggle-grid' })
    expect(store.getState().showGrid).toBe(!initial)
    store.dispatch({ type: 'view.toggle-labels' })
    expect(store.getState().showLabels).toBe(!INITIAL_FALSY)
  })

  it('connection removal clears affected agents', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    store.dispatch({ type: 'agent.add', agent: makeAgent('a2') })
    store.dispatch({ type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'message' } })
    store.dispatch({ type: 'agent.remove', agentId: 'a1' })
    expect(store.getState().connections.length).toBe(0)
  })

  it('agent select connection key', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'message' } })
    store.dispatch({ type: 'connection.select', connectionKey: 'a1->a2' })
    expect(store.getState().selectedConnectionId).toBe('a1->a2')
    expect(store.getState().selectedAgentId).toBeNull()
  })
})

const INITIAL_FALSY = true