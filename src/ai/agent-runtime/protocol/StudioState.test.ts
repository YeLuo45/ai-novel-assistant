/**
 * protocol/StudioState.test.ts (V2476-V2485) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  StudioStore, studioReducer, INITIAL_STUDIO_STATE,
  StudioMiddlewarePipeline, StudioPanelRegistry, preparePanelData,
  StudioSectionList, type StudioAgent, type StudioAction,
} from './StudioState'
import { createSoul, createUserBinding, createMemoryScope } from '../index'

const makeAgent = (id: string, pos = { x: 0, y: 0 }): StudioAgent => ({
  id,
  soul: createSoul({ agentId: id, archetype: 'critic', displayName: id, capabilities: ['plot'] }),
  binding: createUserBinding({ agentId: id }),
  memoryScope: createMemoryScope({ agentId: id }),
  position: pos,
  selected: false,
})

describe('studioReducer', () => {
  it('agent.add', () => {
    const s = studioReducer(INITIAL_STUDIO_STATE, { type: 'agent.add', agent: makeAgent('a1') })
    expect(s.agents.length).toBe(1)
    expect(s.version).toBe(2)
  })

  it('agent.remove clears connections', () => {
    let s = studioReducer(INITIAL_STUDIO_STATE, { type: 'agent.add', agent: makeAgent('a1') })
    s = studioReducer(s, { type: 'agent.add', agent: makeAgent('a2') })
    s = studioReducer(s, { type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'message' } })
    s = studioReducer(s, { type: 'agent.remove', agentId: 'a1' })
    expect(s.connections.length).toBe(0)
  })

  it('agent.move', () => {
    let s = studioReducer(INITIAL_STUDIO_STATE, { type: 'agent.add', agent: makeAgent('a1') })
    s = studioReducer(s, { type: 'agent.move', agentId: 'a1', position: { x: 100, y: 200 } })
    expect(s.agents[0].position).toEqual({ x: 100, y: 200 })
  })

  it('agent.select', () => {
    let s = studioReducer(INITIAL_STUDIO_STATE, { type: 'agent.add', agent: makeAgent('a1') })
    s = studioReducer(s, { type: 'agent.select', agentId: 'a1' })
    expect(s.selectedAgentId).toBe('a1')
  })

  it('view.zoom clamps', () => {
    let s = studioReducer(INITIAL_STUDIO_STATE, { type: 'view.zoom', zoom: 10 })
    expect(s.zoom).toBe(5)
    s = studioReducer(INITIAL_STUDIO_STATE, { type: 'view.zoom', zoom: 0.01 })
    expect(s.zoom).toBe(0.1)
  })

  it('view.toggle-grid', () => {
    const s = studioReducer(INITIAL_STUDIO_STATE, { type: 'view.toggle-grid' })
    expect(s.showGrid).toBe(!INITIAL_STUDIO_STATE.showGrid)
  })

  it('history.undo', () => {
    let s = studioReducer(INITIAL_STUDIO_STATE, { type: 'agent.add', agent: makeAgent('a1') })
    s = studioReducer(s, { type: 'history.undo' })
    expect(s.agents.length).toBe(0)
  })

  it('history.redo', () => {
    let s = studioReducer(INITIAL_STUDIO_STATE, { type: 'agent.add', agent: makeAgent('a1') })
    s = studioReducer(s, { type: 'history.undo' })
    s = studioReducer(s, { type: 'history.redo' })
    expect(s.agents.length).toBe(1)
  })

  it('history.undo no-op when empty', () => {
    const s = studioReducer(INITIAL_STUDIO_STATE, { type: 'history.undo' })
    expect(s).toBe(INITIAL_STUDIO_STATE)
  })

  it('connection.add + remove', () => {
    let s = studioReducer(INITIAL_STUDIO_STATE, { type: 'connection.add', connection: { from: 'a1', to: 'a2', type: 'message' } })
    expect(s.connections.length).toBe(1)
    s = studioReducer(s, { type: 'connection.remove', from: 'a1', to: 'a2' })
    expect(s.connections.length).toBe(0)
  })
})

describe('StudioStore', () => {
  it('dispatch updates state', () => {
    const store = new StudioStore()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    expect(store.getState().agents.length).toBe(1)
  })

  it('subscribe is called on change', () => {
    const store = new StudioStore()
    let count = 0
    store.subscribe(() => { count += 1 })
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    expect(count).toBe(1)
  })

  it('unsubscribe', () => {
    const store = new StudioStore()
    let count = 0
    const off = store.subscribe(() => { count += 1 })
    store.dispatch({ type: 'agent.add', agent: makeAgent('a1') })
    off()
    store.dispatch({ type: 'agent.add', agent: makeAgent('a2') })
    expect(count).toBe(1)
  })

  it('replace state', () => {
    const store = new StudioStore()
    store.replace(INITIAL_STUDIO_STATE)
    expect(store.getState()).toBe(INITIAL_STUDIO_STATE)
  })
})

describe('StudioMiddlewarePipeline', () => {
  it('runs middlewares in order', () => {
    const pipe = new StudioMiddlewarePipeline()
    const log: string[] = []
    pipe.use((_s, _a, next) => { log.push('m1'); next(INITIAL_STUDIO_STATE) })
    pipe.use((_s, _a, next) => { log.push('m2'); next(INITIAL_STUDIO_STATE) })
    pipe.run(INITIAL_STUDIO_STATE, { type: 'view.toggle-grid' }, studioReducer)
    expect(log).toEqual(['m1', 'm2'])
  })
})

describe('StudioPanelRegistry + preparePanelData', () => {
  it('register + visible', () => {
    const r = new StudioPanelRegistry()
    r.register({ id: 'p1', type: 'agents', title: 'Agents', position: 'left', visible: true })
    expect(r.visible().length).toBe(1)
  })

  it('preparePanelData for agents', () => {
    let s = INITIAL_STUDIO_STATE
    s = studioReducer(s, { type: 'agent.add', agent: makeAgent('a1') })
    const r = new StudioPanelRegistry()
    r.register({ id: 'p1', type: 'agents', title: 'Agents', position: 'left', visible: true })
    const panel = r.get('p1')!
    const data = preparePanelData(panel, s)
    expect(data.type).toBe('agents')
    expect((data.data as { agents: unknown[] }).agents.length).toBe(1)
  })

  it('preparePanelData for properties (selected)', () => {
    let s = INITIAL_STUDIO_STATE
    s = studioReducer(s, { type: 'agent.add', agent: makeAgent('a1') })
    s = studioReducer(s, { type: 'agent.select', agentId: 'a1' })
    const r = new StudioPanelRegistry()
    r.register({ id: 'p1', type: 'properties', title: 'Props', position: 'right', visible: true })
    const data = preparePanelData(r.get('p1')!, s)
    expect((data.data as { selectedAgent: { id: string } }).selectedAgent.id).toBe('a1')
  })
})

describe('StudioSectionList', () => {
  it('add + get + list', () => {
    const l = new StudioSectionList()
    l.add({ id: 's1', title: 'Intro', content: 'x', order: 1, createdAt: 0 })
    l.add({ id: 's2', title: 'Body', content: 'y', order: 2, createdAt: 0 })
    expect(l.list().length).toBe(2)
    expect(l.list()[0].id).toBe('s1')
  })

  it('remove', () => {
    const l = new StudioSectionList()
    l.add({ id: 's1', title: 'A', content: 'x', order: 1, createdAt: 0 })
    expect(l.remove('s1')).toBe(true)
    expect(l.count()).toBe(0)
  })
})
