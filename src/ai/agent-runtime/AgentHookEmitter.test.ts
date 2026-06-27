/**
 * AgentHookEmitter.test.ts (V2347) — 30+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AgentHookEmitter,
  getGlobalEmitter,
  resetGlobalEmitter,
  type HookHandler,
} from './AgentHookEmitter'
import { makePayload, type AgentHookEvent } from './AgentHookEvents'

describe('AgentHookEmitter — basic', () => {
  let e: AgentHookEmitter
  beforeEach(() => {
    e = new AgentHookEmitter()
  })

  it('starts empty', () => {
    expect(e.size()).toBe(0)
  })

  it('subscribe adds handler', () => {
    const id = e.subscribe('agent.spawn.before', () => {})
    expect(e.size()).toBe(1)
    expect(typeof id).toBe('string')
  })

  it('unsubscribe removes', () => {
    const id = e.subscribe('agent.spawn.before', () => {})
    expect(e.unsubscribe(id)).toBe(true)
    expect(e.size()).toBe(0)
  })

  it('unsubscribe returns false for unknown', () => {
    expect(e.unsubscribe('unknown')).toBe(false)
  })

  it('clear removes all', () => {
    e.subscribe('agent.spawn.before', () => {})
    e.subscribe('agent.execute.after', () => {})
    expect(e.clear()).toBe(2)
    expect(e.size()).toBe(0)
  })

  it('list returns subscriptions', () => {
    e.subscribe('agent.spawn.before', () => {})
    e.subscribe('agent.execute.after', () => {})
    const list = e.list()
    expect(list.length).toBe(2)
  })
})

describe('AgentHookEmitter — emit', () => {
  let e: AgentHookEmitter
  beforeEach(() => {
    e = new AgentHookEmitter()
  })

  it('emit calls matching handler', async () => {
    let called = 0
    e.subscribe('agent.spawn.before', () => { called += 1 })
    const r = await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    expect(called).toBe(1)
    expect(r.executed).toBe(1)
    expect(r.errors).toEqual([])
  })

  it('emit does not call non-matching event', async () => {
    let called = 0
    e.subscribe('agent.spawn.before', () => { called += 1 })
    await e.emit('agent.execute.after', makePayload('agent.execute.after', 'a1'))
    expect(called).toBe(0)
  })

  it('emit calls async handler', async () => {
    let called = 0
    e.subscribe('agent.execute.before', async () => {
      await new Promise(r => setTimeout(r, 5))
      called += 1
    })
    await e.emit('agent.execute.before', makePayload('agent.execute.before', 'a1'))
    expect(called).toBe(1)
  })

  it('emit aggregates errors', async () => {
    e.subscribe('agent.execute.before', () => { throw new Error('boom1') })
    e.subscribe('agent.execute.before', () => {})
    e.subscribe('agent.execute.before', () => { throw new Error('boom2') })
    const r = await e.emit('agent.execute.before', makePayload('agent.execute.before', 'a1'))
    expect(r.totalHandlers).toBe(3)
    expect(r.executed).toBe(1)
    expect(r.errors.length).toBe(2)
  })

  it('emit returns duration', async () => {
    e.subscribe('agent.execute.before', () => {})
    const r = await e.emit('agent.execute.before', makePayload('agent.execute.before', 'a1'))
    expect(r.durationMs).toBeGreaterThanOrEqual(0)
  })
})

describe('AgentHookEmitter — filter', () => {
  let e: AgentHookEmitter
  beforeEach(() => {
    e = new AgentHookEmitter()
  })

  it('filter by agentId', async () => {
    let calledA1 = 0, calledA2 = 0
    e.subscribe('agent.spawn.before', () => { calledA1 += 1 }, { agentId: 'a1' })
    e.subscribe('agent.spawn.before', () => { calledA2 += 1 }, { agentId: 'a2' })
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    expect(calledA1).toBe(1)
    expect(calledA2).toBe(0)
  })

  it('filter by eventPrefix', async () => {
    let called = 0
    e.subscribe('agent.execute.after', () => { called += 1 }, { eventPrefix: 'agent.execute' })
    await e.emit('agent.execute.after', makePayload('agent.execute.after', 'a1'))
    expect(called).toBe(1)
  })

  it('filter by predicate', async () => {
    let called = 0
    e.subscribe('agent.spawn.before', () => { called += 1 }, {
      predicate: p => (p as { displayName?: string }).displayName === 'special',
    })
    await e.emit('agent.spawn.before', { ...makePayload('agent.spawn.before', 'a1'), displayName: 'special' })
    expect(called).toBe(1)
  })

  it('combined filter: agentId AND predicate', async () => {
    let called = 0
    e.subscribe('agent.spawn.before', () => { called += 1 }, {
      agentId: 'a1',
      predicate: p => (p as { displayName?: string }).displayName === 'special',
    })
    await e.emit('agent.spawn.before', { ...makePayload('agent.spawn.before', 'a1'), displayName: 'special' })
    expect(called).toBe(1)
    await e.emit('agent.spawn.before', { ...makePayload('agent.spawn.before', 'a2'), displayName: 'special' })
    expect(called).toBe(1) // a2 不匹配
  })
})

describe('AgentHookEmitter — emitSync', () => {
  it('emitSync executes synchronously', () => {
    const e = new AgentHookEmitter()
    let called = 0
    e.subscribe('agent.execute.after', () => { called += 1 })
    const r = e.emitSync('agent.execute.after', makePayload('agent.execute.after', 'a1'))
    expect(called).toBe(1)
    expect(r.executed).toBe(1)
  })
})

describe('AgentHookEmitter — global', () => {
  beforeEach(() => resetGlobalEmitter())

  it('getGlobalEmitter returns singleton', () => {
    const a = getGlobalEmitter()
    const b = getGlobalEmitter()
    expect(a).toBe(b)
  })

  it('resetGlobalEmitter clears', () => {
    const a = getGlobalEmitter()
    resetGlobalEmitter()
    const b = getGlobalEmitter()
    expect(a).not.toBe(b)
  })
})
