/**
 * AgentMessageBus.test.ts (V2357) — 30+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AgentMessageBus,
  getGlobalBus,
  resetGlobalBus,
} from './AgentMessageBus'
import { createEnvelope, resetMsgIdCounter } from './types'

describe('AgentMessageBus — basic send/receive', () => {
  let bus: AgentMessageBus
  beforeEach(() => {
    bus = new AgentMessageBus()
    resetMsgIdCounter()
  })

  it('send adds to target mailbox', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: { topic: 't', data: 1 } })
    expect(bus.mailbox('b').length).toBe(1)
    expect(bus.mailbox('a').length).toBe(0)
  })

  it('send returns envelope', () => {
    const env = bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(env.kind).toBe('NOTIFY')
    expect(env.id.length).toBeGreaterThan(0)
  })

  it('send to multiple agents', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'c', payload: {} })
    expect(bus.mailbox('b').length).toBe(1)
    expect(bus.mailbox('c').length).toBe(1)
  })

  it('broadcast to *', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'c', payload: {} })
    bus.send({ kind: 'NOTIFY', from: 'a', to: '*', payload: {} })
    expect(bus.mailbox('b').length).toBe(2)
    expect(bus.mailbox('c').length).toBe(2)
  })

  it('broadcast does not deliver to sender', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.send({ kind: 'NOTIFY', from: 'a', to: '*', payload: {} })
    expect(bus.mailbox('a').length).toBe(0) // sender doesn't get its own broadcast
  })

  it('expired message is not delivered', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {}, ttl: 1 })
    const later = Date.now() + 100
    bus.pruneExpired(later)
    expect(bus.mailbox('b').length).toBe(0)
  })
})

describe('AgentMessageBus — subscribe', () => {
  let bus: AgentMessageBus
  beforeEach(() => {
    bus = new AgentMessageBus()
    resetMsgIdCounter()
  })

  it('subscribe calls handler on matching message', () => {
    let called = 0
    bus.subscribe('b', () => { called += 1 })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(called).toBe(1)
  })

  it('subscribe with kind filter', () => {
    let called = 0
    bus.subscribe('b', () => { called += 1 }, ['REQUEST'])
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.send({ kind: 'REQUEST', from: 'a', to: 'b', payload: { intent: 'x' } })
    expect(called).toBe(1)
  })

  it('subscribe only for target agent', () => {
    let calledB = 0
    let calledC = 0
    bus.subscribe('b', () => { calledB += 1 })
    bus.subscribe('c', () => { calledC += 1 })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(calledB).toBe(1)
    expect(calledC).toBe(0)
  })

  it('unsubscribe removes', () => {
    let called = 0
    const id = bus.subscribe('b', () => { called += 1 })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.unsubscribe(id)
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(called).toBe(1)
  })

  it('unsubscribe returns false for unknown', () => {
    expect(bus.unsubscribe('unknown')).toBe(false)
  })

  it('async handler works', async () => {
    let called = 0
    bus.subscribe('b', async () => {
      await new Promise(r => setTimeout(r, 5))
      called += 1
    })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    await new Promise(r => setTimeout(r, 20))
    expect(called).toBe(1)
  })
})

describe('AgentMessageBus — mailbox ops', () => {
  let bus: AgentMessageBus
  beforeEach(() => {
    bus = new AgentMessageBus()
    resetMsgIdCounter()
  })

  it('unread filters by read flag', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(bus.unread('b').length).toBe(2)
    const first = bus.mailbox('b')[0]
    bus.markRead('b', first.envelope.id)
    expect(bus.unread('b').length).toBe(1)
  })

  it('markRead for unknown returns false', () => {
    expect(bus.markRead('b', 'x')).toBe(false)
    expect(bus.markRead('unknown', 'x')).toBe(false)
  })

  it('clearMailbox removes all', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(bus.clearMailbox('b')).toBe(2)
    expect(bus.mailbox('b').length).toBe(0)
  })

  it('clearMailbox for unknown returns 0', () => {
    expect(bus.clearMailbox('unknown')).toBe(0)
  })

  it('knownAgents lists all mailboxes', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'c', payload: {} })
    expect(bus.knownAgents().sort()).toEqual(['b', 'c'])
  })
})

describe('AgentMessageBus — sent log', () => {
  let bus: AgentMessageBus
  beforeEach(() => {
    bus = new AgentMessageBus()
    resetMsgIdCounter()
  })

  it('sentLog records all sends', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.send({ kind: 'REQUEST', from: 'a', to: 'b', payload: { intent: 'x' } })
    expect(bus.sentLog().length).toBe(2)
  })

  it('sentLogByKind filters', () => {
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.send({ kind: 'REQUEST', from: 'a', to: 'b', payload: { intent: 'x' } })
    expect(bus.sentLogByKind('REQUEST').length).toBe(1)
  })

  it('sentLog trims to maxSentLog', () => {
    const b = new AgentMessageBus()
    for (let i = 0; i < 1500; i++) {
      b.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: { i } })
    }
    expect(b.sentLog().length).toBe(1000) // trimmed
  })
})

describe('AgentMessageBus — prune & clear', () => {
  it('pruneExpired removes old entries', () => {
    const bus = new AgentMessageBus()
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {}, ttl: 100 })
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} }) // no ttl
    const removed = bus.pruneExpired(Date.now() + 1000)
    expect(removed).toBe(1)
    expect(bus.mailbox('b').length).toBe(1) // the one without TTL
  })

  it('clear empties everything', () => {
    const bus = new AgentMessageBus()
    bus.send({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    bus.subscribe('b', () => {})
    bus.clear()
    expect(bus.knownAgents().length).toBe(0)
    expect(bus.subscriptionCount()).toBe(0)
  })
})

describe('AgentMessageBus — global', () => {
  beforeEach(() => resetGlobalBus())

  it('getGlobalBus returns singleton', () => {
    const a = getGlobalBus()
    const b = getGlobalBus()
    expect(a).toBe(b)
  })
})
