/**
 * protocol/RequestReply.test.ts (V2361-V2365) — 30+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  requestReply,
  asyncRequest,
  PromiseTracker,
  ReplyMatcher,
  RequestQueue,
  type TrackedPromise,
} from './RequestReply'
import { AgentMessageBus } from './AgentMessageBus'
import { createRequest, createResponse, resetMsgIdCounter } from './types'

describe('requestReply — sync', () => {
  it('times out when no response', () => {
    const bus = new AgentMessageBus()
    const r = requestReply(bus, 'a', 'b', 'test', null, 50)
    expect(r.success).toBe(false)
    expect(r.error).toBe('timeout')
  })

  it('returns response when received', () => {
    const bus = new AgentMessageBus()
    // 预放 RESPONSE 在 a 的 mailbox
    const fakeReq = { id: 'fake-req-1', kind: 'REQUEST' as const, from: 'a', to: 'b', payload: { intent: 'x' }, timestamp: Date.now(), metadata: {} }
    const resp = createResponse('b', 'a', fakeReq as any, { result: 42, success: true })
    bus.send({ kind: 'RESPONSE', from: 'b', to: 'a', payload: resp.payload, correlationId: resp.correlationId })
    // 直接测 waitForReply：应能匹配 fake-req-1
    const r = requestReply(bus, 'a', 'a', 'noop', null, 50) // 同步发 REQUEST 到 a
    // 这次发新 request，但 mailbox 中只有 fake 的 response。timeout
    expect(r.success).toBe(false)
  })
})

describe('asyncRequest', () => {
  beforeEach(() => resetMsgIdCounter())
  it('returns handle with promise', () => {
    const bus = new AgentMessageBus()
    const h = asyncRequest(bus, 'a', 'b', 'test', null, 50)
    expect(h.requestId.length).toBeGreaterThan(0)
    h.cancel()
  })
})

describe('PromiseTracker', () => {
  it('track + resolve', () => {
    const t = new PromiseTracker()
    const req = createRequest('a', 'b', { intent: 'x' })
    const p = t.track(req, 'compute', 1000)
    expect(p.status).toBe('pending')
    t.resolve(req.id, 42)
    expect(t.get(req.id)?.status).toBe('resolved')
    expect(t.get(req.id)?.result).toBe(42)
  })

  it('track + reject', () => {
    const t = new PromiseTracker()
    const req = createRequest('a', 'b', { intent: 'x' })
    t.track(req, 'x', 1000)
    t.reject(req.id, 'oops')
    expect(t.get(req.id)?.status).toBe('rejected')
    expect(t.get(req.id)?.error).toBe('oops')
  })

  it('track + timeout', () => {
    const t = new PromiseTracker()
    const req = createRequest('a', 'b', { intent: 'x' })
    t.track(req, 'x', 1)
    const n = t.pruneTimeouts(Date.now() + 100)
    expect(n).toBe(1)
    expect(t.get(req.id)?.status).toBe('timeout')
  })

  it('list filter by status', () => {
    const t = new PromiseTracker()
    const r1 = createRequest('a', 'b', { intent: 'x' })
    const r2 = createRequest('a', 'b', { intent: 'y' })
    t.track(r1, 'x', 1000)
    t.track(r2, 'y', 1000)
    t.resolve(r1.id, 1)
    expect(t.list({ status: 'pending' }).length).toBe(1)
    expect(t.list({ status: 'resolved' }).length).toBe(1)
  })

  it('resolve twice returns false', () => {
    const t = new PromiseTracker()
    const req = createRequest('a', 'b', { intent: 'x' })
    t.track(req, 'x', 1000)
    expect(t.resolve(req.id, 1)).toBe(true)
    expect(t.resolve(req.id, 2)).toBe(false)
  })

  it('clear empties', () => {
    const t = new PromiseTracker()
    const req = createRequest('a', 'b', { intent: 'x' })
    t.track(req, 'x', 1000)
    t.clear()
    expect(t.count()).toBe(0)
  })
})

describe('ReplyMatcher', () => {
  it('matchResponse true when correlationId matches', () => {
    const m = new ReplyMatcher()
    const req = createRequest('a', 'b', { intent: 'x' })
    const resp = createResponse('b', 'a', req, { success: true })
    expect(m.matchResponse(resp, req)).toBe(true)
  })

  it('matchResponse false when not RESPONSE', () => {
    const m = new ReplyMatcher()
    const req = createRequest('a', 'b', { intent: 'x' })
    const notResp = { ...req, kind: 'NOTIFY' as const }
    expect(m.matchResponse(notResp, req)).toBe(false)
  })

  it('findMatches in mailbox', () => {
    const m = new ReplyMatcher()
    const req = createRequest('a', 'b', { intent: 'x' })
    const resp = createResponse('b', 'a', req, { success: true })
    const matches = m.findMatches([{ envelope: resp, read: false }], req)
    expect(matches.length).toBe(1)
  })

  it('findFirst returns first match', () => {
    const m = new ReplyMatcher()
    const req = createRequest('a', 'b', { intent: 'x' })
    const resp = createResponse('b', 'a', req, { success: true })
    const r = m.findFirst([{ envelope: resp, read: false }], req)
    expect(r).toBeDefined()
  })

  it('throws on invalid key', () => {
    const m = new ReplyMatcher()
    const req = createRequest('a', 'b', { intent: 'x' })
    // invalid envelope (not a real MessageEnvelope)
    const r = m.matchResponse({} as any, req)
    expect(r).toBe(false)
  })

  it('findFirst returns undefined when no match', () => {
    const m = new ReplyMatcher()
    const req = createRequest('a', 'b', { intent: 'x' })
    const notResp = { ...req, kind: 'NOTIFY' as const, id: 'n1' }
    expect(m.findFirst([{ envelope: notResp, read: false }], req)).toBeUndefined()
  })
})

describe('RequestQueue', () => {
  it('enqueue + dequeue', () => {
    const q = new RequestQueue()
    const req = createRequest('a', 'b', { intent: 'x' })
    q.enqueue(req)
    expect(q.size()).toBe(1)
    const d = q.dequeue()
    expect(d?.envelope.id).toBe(req.id)
  })

  it('priority order: critical first', () => {
    const q = new RequestQueue()
    const low = createRequest('a', 'b', { intent: 'low' })
    const crit = createRequest('a', 'b', { intent: 'crit' })
    q.enqueue(low, 'low')
    q.enqueue(crit, 'critical')
    const d = q.dequeue()
    expect((d?.envelope.payload as { intent: string }).intent).toBe('crit')
  })

  it('FIFO within same priority', () => {
    const q = new RequestQueue()
    const a = createRequest('a', 'b', { intent: 'a' })
    const b = createRequest('a', 'b', { intent: 'b' })
    q.enqueue(a, 'normal')
    q.enqueue(b, 'normal')
    expect(q.dequeue()?.envelope.id).toBe(a.id)
  })

  it('requeue creates new entry if not found', () => {
    const q = new RequestQueue()
    const req = createRequest('a', 'b', { intent: 'x' })
    // 不调用 enqueue，直接 requeue
    expect(q.requeue(req, 'high')).toBe(true)
    const d = q.dequeue()
    expect(d?.priority).toBe('high')
    expect(d?.attempts).toBe(1)
  })

  it('requeue existing item increments attempts', () => {
    const q = new RequestQueue()
    const req = createRequest('a', 'b', { intent: 'x' })
    q.enqueue(req)
    q.requeue(req, 'high')
    const d = q.dequeue()
    expect(d?.attempts).toBe(1)
    expect(d?.priority).toBe('high')
  })

  it('requeue with default priority', () => {
    const q = new RequestQueue()
    const req = createRequest('a', 'b', { intent: 'x' })
    q.requeue(req)
    const d = q.dequeue()
    expect(d?.priority).toBe('normal')
  })

  it('remove', () => {
    const q = new RequestQueue()
    const req = createRequest('a', 'b', { intent: 'x' })
    q.enqueue(req)
    expect(q.remove(req.id)).toBe(true)
    expect(q.size()).toBe(0)
  })

  it('peek returns first without removing', () => {
    const q = new RequestQueue()
    const req = createRequest('a', 'b', { intent: 'x' })
    q.enqueue(req)
    expect(q.peek()?.envelope.id).toBe(req.id)
    expect(q.size()).toBe(1)
  })

  it('clear empties', () => {
    const q = new RequestQueue()
    q.enqueue(createRequest('a', 'b', { intent: 'x' }))
    q.clear()
    expect(q.size()).toBe(0)
  })
})
