/**
 * AgentHookBuiltins.test.ts (V2348-V2350) — 30+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AGENT_LIFECYCLE_EVENTS,
  AGENT_EXECUTE_EVENTS,
  AGENT_MEMORY_EVENTS,
  SANDBOX_EVENTS,
  RUNTIME_EVENTS,
  subscribeMany,
  MetricsHook,
  AuditLogHook,
} from './AgentHookBuiltins'
import { AgentHookEmitter } from './AgentHookEmitter'
import { makePayload, type AgentHookEvent } from './AgentHookEvents'

describe('AgentHookBuiltins — event constants', () => {
  it('AGENT_LIFECYCLE_EVENTS has 5 events', () => {
    expect(AGENT_LIFECYCLE_EVENTS.length).toBe(5)
  })

  it('AGENT_EXECUTE_EVENTS has 3 events', () => {
    expect(AGENT_EXECUTE_EVENTS.length).toBe(3)
  })

  it('AGENT_MEMORY_EVENTS has 3 events', () => {
    expect(AGENT_MEMORY_EVENTS.length).toBe(3)
  })

  it('SANDBOX_EVENTS has 2 events', () => {
    expect(SANDBOX_EVENTS.length).toBe(2)
  })

  it('RUNTIME_EVENTS has 2 events', () => {
    expect(RUNTIME_EVENTS.length).toBe(2)
  })

  it('total events = 15', () => {
    const total = AGENT_LIFECYCLE_EVENTS.length +
      AGENT_EXECUTE_EVENTS.length +
      AGENT_MEMORY_EVENTS.length +
      SANDBOX_EVENTS.length +
      RUNTIME_EVENTS.length
    expect(total).toBe(15)
  })
})

describe('subscribeMany', () => {
  it('subscribes to multiple events', () => {
    const e = new AgentHookEmitter()
    const ids = subscribeMany(e, ['agent.spawn.before', 'agent.execute.after'], () => {})
    expect(ids.length).toBe(2)
    expect(e.size()).toBe(2)
  })
})

describe('MetricsHook', () => {
  let e: AgentHookEmitter
  let m: MetricsHook
  beforeEach(() => {
    e = new AgentHookEmitter()
    m = new MetricsHook()
  })

  it('starts empty', () => {
    m.attach(e)
    const s = m.snapshot()
    expect(s.totalEvents).toBe(0)
  })

  it('records events', async () => {
    m.attach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    await e.emit('agent.spawn.after', makePayload('agent.spawn.after', 'a1'))
    const s = m.snapshot()
    expect(s.totalEvents).toBe(2)
    expect(s.byEvent['agent.spawn.before']).toBe(1)
  })

  it('records by agentId', async () => {
    m.attach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a2'))
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    const s = m.snapshot()
    expect(s.byAgent['a1']).toBe(2)
    expect(s.byAgent['a2']).toBe(1)
  })

  it('counts denied', async () => {
    m.attach(e)
    await e.emit('sandbox.denied', makePayload('sandbox.denied', 'a1'))
    await e.emit('sandbox.allowed', makePayload('sandbox.allowed', 'a1'))
    await e.emit('sandbox.denied', makePayload('sandbox.denied', 'a1'))
    expect(m.snapshot().deniedCount).toBe(2)
  })

  it('counts errors', async () => {
    m.attach(e)
    await e.emit('agent.execute.error', makePayload('agent.execute.error', 'a1'))
    expect(m.snapshot().errorCount).toBe(1)
  })

  it('reset clears all', async () => {
    m.attach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    m.reset()
    expect(m.snapshot().totalEvents).toBe(0)
  })

  it('detach unsubscribes', async () => {
    m.attach(e)
    m.detach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    expect(m.snapshot().totalEvents).toBe(0)
  })
})

describe('AuditLogHook', () => {
  let e: AgentHookEmitter
  let a: AuditLogHook
  beforeEach(() => {
    e = new AgentHookEmitter()
    a = new AuditLogHook()
  })

  it('starts empty', () => {
    a.attach(e)
    expect(a.count()).toBe(0)
  })

  it('records entries', async () => {
    a.attach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    await e.emit('agent.execute.after', makePayload('agent.execute.after', 'a1'))
    expect(a.count()).toBe(2)
  })

  it('entries returns reverse chronological', async () => {
    a.attach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    await new Promise(r => setTimeout(r, 2))
    await e.emit('agent.execute.after', makePayload('agent.execute.after', 'a1'))
    const es = a.entries()
    expect(es[0].event).toBe('agent.execute.after') // newer
    expect(es[1].event).toBe('agent.spawn.before')
  })

  it('entriesFor filters by agentId', async () => {
    a.attach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a2'))
    const a1 = a.entriesFor('a1')
    expect(a1.length).toBe(1)
    expect(a1[0].agentId).toBe('a1')
  })

  it('entriesByEvent filters by event', async () => {
    a.attach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    await e.emit('agent.execute.after', makePayload('agent.execute.after', 'a1'))
    const spawns = a.entriesByEvent('agent.spawn.before' as AgentHookEvent)
    expect(spawns.length).toBe(1)
  })

  it('trims to maxEntries', async () => {
    const a2 = new AuditLogHook(3)
    a2.attach(e)
    for (let i = 0; i < 5; i++) {
      await e.emit('agent.spawn.before', makePayload('agent.spawn.before', `a${i}`))
    }
    expect(a2.count()).toBe(3)
  })

  it('clear empties', async () => {
    a.attach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    a.clear()
    expect(a.count()).toBe(0)
  })

  it('detach unsubscribes', async () => {
    a.attach(e)
    a.detach(e)
    await e.emit('agent.spawn.before', makePayload('agent.spawn.before', 'a1'))
    expect(a.count()).toBe(0)
  })
})
