/**
 * protocol/types.test.ts (V2356) — 30+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ALL_MESSAGE_KINDS,
  REQUEST_RESPONSE_KINDS,
  NEGOTIATION_KINDS,
  VOTING_KINDS,
  DELEGATION_KINDS,
  ASYNC_KINDS,
  createEnvelope,
  createRequest,
  createResponse,
  createNotify,
  createOffer,
  createAccept,
  createReject,
  createVote,
  createDelegate,
  createReturn,
  isExpired,
  isBroadcast,
  matchesTarget,
  isRequest,
  isResponse,
  isNotify,
  isOffer,
  isAccept,
  isReject,
  isVote,
  isDelegate,
  isReturn,
  PROTOCOL_VERSION,
  resetMsgIdCounter,
  type MessageEnvelope,
} from './types'

describe('protocol/types — constants', () => {
  it('ALL_MESSAGE_KINDS has 9 kinds', () => {
    expect(ALL_MESSAGE_KINDS.length).toBe(9)
  })

  it('REQUEST_RESPONSE_KINDS = REQUEST + RESPONSE', () => {
    expect(REQUEST_RESPONSE_KINDS).toEqual(['REQUEST', 'RESPONSE'])
  })

  it('NEGOTIATION_KINDS = OFFER + ACCEPT + REJECT', () => {
    expect(NEGOTIATION_KINDS).toEqual(['OFFER', 'ACCEPT', 'REJECT'])
  })

  it('VOTING_KINDS = VOTE', () => {
    expect(VOTING_KINDS).toEqual(['VOTE'])
  })

  it('DELEGATION_KINDS = DELEGATE + RETURN', () => {
    expect(DELEGATION_KINDS).toEqual(['DELEGATE', 'RETURN'])
  })

  it('PROTOCOL_VERSION is 1.x', () => {
    expect(PROTOCOL_VERSION).toMatch(/^1\./)
  })
})

describe('protocol/types — createEnvelope', () => {
  beforeEach(() => resetMsgIdCounter())

  it('returns frozen envelope', () => {
    const e = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(Object.isFrozen(e)).toBe(true)
  })

  it('generates unique IDs', () => {
    const e1 = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    const e2 = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(e1.id).not.toBe(e2.id)
  })

  it('attaches timestamp', () => {
    const e = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(e.timestamp).toBeGreaterThan(0)
  })

  it('preserves metadata', () => {
    const e = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {}, metadata: { trace: 'x' } })
    expect(e.metadata.trace).toBe('x')
  })
})

describe('protocol/types — REQUEST/RESPONSE', () => {
  beforeEach(() => resetMsgIdCounter())

  it('createRequest', () => {
    const r = createRequest('a1', 'a2', { intent: 'compute', input: 5 })
    expect(r.kind).toBe('REQUEST')
    expect(r.from).toBe('a1')
    expect((r.payload as { intent: string }).intent).toBe('compute')
  })

  it('createResponse auto-sets correlationId', () => {
    const req = createRequest('a1', 'a2', { intent: 'compute' })
    const resp = createResponse('a2', 'a1', req, { result: 42, success: true })
    expect(resp.kind).toBe('RESPONSE')
    expect(resp.correlationId).toBe(req.id)
    expect((resp.payload as { requestId: string }).requestId).toBe(req.id)
  })

  it('createResponse throws on non-REQUEST', () => {
    const notReq = createNotify('a1', 'a2', { topic: 't', data: 1 })
    expect(() => createResponse('a2', 'a1', notReq, { success: true })).toThrow()
  })
})

describe('protocol/types — OFFER/ACCEPT/REJECT', () => {
  beforeEach(() => resetMsgIdCounter())

  it('createOffer', () => {
    const o = createOffer('a1', 'a2', { proposal: 'do X', terms: { price: 100 } })
    expect(o.kind).toBe('OFFER')
  })

  it('createAccept auto-sets correlationId to offer.id', () => {
    const o = createOffer('a1', 'a2', { proposal: 'do X', terms: {} })
    const acc = createAccept('a2', 'a1', o, 'good idea')
    expect(acc.kind).toBe('ACCEPT')
    expect(acc.correlationId).toBe(o.id)
    expect((acc.payload as { reason: string }).reason).toBe('good idea')
  })

  it('createReject requires reason', () => {
    const o = createOffer('a1', 'a2', { proposal: 'do X', terms: {} })
    const rej = createReject('a2', 'a1', o, 'no thanks')
    expect((rej.payload as { reason: string }).reason).toBe('no thanks')
  })
})

describe('protocol/types — VOTE/DELEGATE/RETURN', () => {
  beforeEach(() => resetMsgIdCounter())

  it('createVote', () => {
    const v = createVote('a1', '*', { topic: 'proposal-1', choice: 'yes', weight: 1 })
    expect(v.kind).toBe('VOTE')
  })

  it('createDelegate with scope', () => {
    const d = createDelegate('a1', 'a2', { task: 'compute', scope: { read: 'team' } })
    expect((d.payload as { scope: { read: string } }).scope.read).toBe('team')
  })

  it('createReturn auto-sets correlationId', () => {
    const d = createDelegate('a1', 'a2', { task: 'compute' })
    const r = createReturn('a2', 'a1', d, { result: 'ok', success: true, durationMs: 100 })
    expect(r.correlationId).toBe(d.id)
    expect((r.payload as { durationMs: number }).durationMs).toBe(100)
  })
})

describe('protocol/types — utilities', () => {
  it('isExpired: no TTL = not expired', () => {
    const e: MessageEnvelope = {
      id: 'x', kind: 'NOTIFY', from: 'a', to: 'b', payload: {}, timestamp: 0, metadata: {},
    }
    expect(isExpired(e)).toBe(false)
  })

  it('isExpired: with TTL', () => {
    const now = Date.now()
    const e: MessageEnvelope = {
      id: 'x', kind: 'NOTIFY', from: 'a', to: 'b', payload: {}, timestamp: now - 1000, ttl: 500, metadata: {},
    }
    expect(isExpired(e, now)).toBe(true)
  })

  it('isBroadcast detects *', () => {
    const e = createEnvelope({ kind: 'NOTIFY', from: 'a', to: '*', payload: {} })
    expect(isBroadcast(e)).toBe(true)
  })

  it('matchesTarget matches direct', () => {
    const e = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    expect(matchesTarget(e, 'b')).toBe(true)
  })

  it('matchesTarget matches broadcast', () => {
    const e = createEnvelope({ kind: 'NOTIFY', from: 'a', to: '*', payload: {} })
    expect(matchesTarget(e, 'anyone')).toBe(true)
  })
})

describe('protocol/types — type guards', () => {
  beforeEach(() => resetMsgIdCounter())

  it('isRequest', () => {
    const r = createRequest('a', 'b', { intent: 'x' })
    expect(isRequest(r)).toBe(true)
    expect(isNotify(r)).toBe(false)
  })

  it('isResponse', () => {
    const req = createRequest('a', 'b', { intent: 'x' })
    const resp = createResponse('b', 'a', req, { success: true })
    expect(isResponse(resp)).toBe(true)
  })

  it('isNotify', () => {
    const n = createNotify('a', 'b', { topic: 't', data: 1 })
    expect(isNotify(n)).toBe(true)
  })

  it('isOffer/isAccept/isReject', () => {
    const o = createOffer('a', 'b', { proposal: 'p', terms: {} })
    expect(isOffer(o)).toBe(true)
    const acc = createAccept('b', 'a', o)
    expect(isAccept(acc)).toBe(true)
    const rej = createReject('b', 'a', o, 'no')
    expect(isReject(rej)).toBe(true)
  })

  it('isVote/isDelegate/isReturn', () => {
    const v = createVote('a', 'b', { topic: 't', choice: 'y' })
    expect(isVote(v)).toBe(true)
    const d = createDelegate('a', 'b', { task: 't' })
    expect(isDelegate(d)).toBe(true)
    const r = createReturn('b', 'a', d, { success: true, durationMs: 1 })
    expect(isReturn(r)).toBe(true)
  })
})
