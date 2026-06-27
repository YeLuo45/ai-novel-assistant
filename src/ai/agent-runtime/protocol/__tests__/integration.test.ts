/**
 * protocol/__tests__/integration.test.ts (V2382)
 *
 * 协议端到端集成测试：message bus + negotiation + delegation
 */

import { describe, it, expect } from 'vitest'
import {
  AgentMessageBus,
  NegotiationRoom,
  VoteCollector,
  buildConsensus,
  resolveConflict,
  DelegationChain,
  ArbitrationRoom,
  RequestQueue,
  PromiseTracker,
  createRequest,
  createResponse,
  createOffer,
  createAccept,
  createDelegate,
  createReturn,
  createEnvelope,
  MessageRouter,
  serializeMessage,
  deserializeMessage,
  isScopeAllowed,
  tallyWeighted,
  isExpired,
} from '../index'

describe('protocol — message bus + negotiation end-to-end', () => {
  it('full REQUEST → RESPONSE flow', () => {
    const bus = new AgentMessageBus()
    const req = createRequest('a', 'b', { intent: 'compute', input: 5 })
    bus.send({ kind: 'REQUEST', from: 'a', to: 'b', payload: req.payload, correlationId: req.id })
    // 模拟 b 立即回复
    const resp = createResponse('b', 'a', req, { result: 42, success: true })
    bus.send({ kind: 'RESPONSE', from: 'b', to: 'a', payload: resp.payload, correlationId: resp.correlationId })
    expect(bus.mailbox('a').length).toBe(1)
    expect(bus.mailbox('a')[0].envelope.kind).toBe('RESPONSE')
  })

  it('OFFER → ACCEPT chain', () => {
    const bus = new AgentMessageBus()
    const room = new NegotiationRoom()
    const p = room.open('a1', 'do X', { price: 100 }, { participants: ['b1'] })
    bus.send({ kind: 'OFFER', from: 'a1', to: 'b1', payload: { proposal: 'do X', terms: { price: 100 } } })
    const acc = createAccept('b1', 'a1', createEnvelope({ kind: 'OFFER', from: 'a1', to: 'b1', payload: { proposal: 'do X', terms: { price: 100 } } }))
    bus.send({ kind: 'ACCEPT', from: 'b1', to: 'a1', payload: acc.payload, correlationId: acc.correlationId })
    room.accept(p.proposalId, 'b1')
    expect(room.get(p.proposalId)?.status).toBe('accepted')
  })

  it('VOTE → CONSENSUS flow', () => {
    const votes = new VoteCollector()
    votes.record('t1', { voter: 'a', choice: 'yes', weight: 1, votedAt: 0 })
    votes.record('t1', { voter: 'b', choice: 'yes', weight: 2, votedAt: 0 })
    votes.record('t1', { voter: 'c', choice: 'no', weight: 1, votedAt: 0 })
    const tally = tallyWeighted(votes.votesFor('t1'))
    expect(tally.winner).toBe('yes')
    const consensus = buildConsensus(votes.votesFor('t1'), 'majority')
    expect(consensus.reached).toBe(true)
  })

  it('DELEGATE → RETURN with chain tracking', () => {
    const chain = new DelegationChain()
    const d1 = createDelegate('a', 'b', { task: 'compute', input: 5 })
    chain.add({ delegateId: d1.id, from: 'a', to: 'b', task: 'compute', input: 5, children: [], status: 'running', createdAt: Date.now() })
    chain.complete(d1.id, 42, 100)
    const d2 = createDelegate('b', 'c', { task: 'sub-task' })
    chain.add({ delegateId: d2.id, from: 'b', to: 'c', task: 'sub-task', parentId: d1.id, children: [], status: 'pending', createdAt: Date.now() })
    expect(chain.children(d1.id).length).toBe(1)
    expect(chain.pathToRoot(d2.id).length).toBe(2)
    const ret = createReturn('b', 'a', d1, { result: 42, success: true, durationMs: 100 })
    expect(ret.correlationId).toBe(d1.id)
  })
})

describe('protocol — arbitration + conflict resolution', () => {
  it('arbitration case open + resolve', () => {
    const room = new ArbitrationRoom()
    const c = room.open(['a', 'b'], 'disagreement on style')
    expect(room.resolve(c.caseId, 'compromise: mix both styles')).toBe(true)
    expect(room.get(c.caseId)?.status).toBe('resolved')
  })

  it('conflict resolution: first-wins', () => {
    const r = resolveConflict(
      [{ source: 'a', value: 1 }, { source: 'b', value: 2 }],
      'first-wins',
    )
    expect(r.resolved).toBe(1)
  })

  it('conflict resolution: arbitration', () => {
    const r = resolveConflict(
      [{ source: 'a', value: 1 }, { source: 'b', value: 2 }],
      'arbitration',
      { arbitrator: () => 2 },
    )
    expect(r.resolved).toBe(2)
  })
})

describe('protocol — queue + tracker', () => {
  it('priority queue: critical first', () => {
    const q = new RequestQueue()
    const req1 = createRequest('a', 'b', { intent: 'low' })
    const req2 = createRequest('a', 'b', { intent: 'crit' })
    q.enqueue(req1, 'low')
    q.enqueue(req2, 'critical')
    expect((q.dequeue()?.envelope.payload as { intent: string }).intent).toBe('crit')
  })

  it('PromiseTracker tracks and resolves', () => {
    const t = new PromiseTracker()
    const req = createRequest('a', 'b', { intent: 'x' })
    t.track(req, 'x', 1000)
    t.resolve(req.id, 42)
    expect(t.get(req.id)?.status).toBe('resolved')
  })
})

describe('protocol — routing + serialization + scope', () => {
  it('router: round-robin', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'x', to: '?', payload: {} })
    const ctx = { candidates: ['a', 'b', 'c'], loadMap: new Map(), rrIndex: 0 }
    expect(r.route(env, 'round-robin', ctx).targets).toEqual(['a'])
  })

  it('serialize → deserialize roundtrip', () => {
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: { x: 1 } })
    const back = deserializeMessage(serializeMessage(env))
    expect(back.id).toBe(env.id)
  })

  it('scope: self read = allowed for self', () => {
    expect(isScopeAllowed({ read: 'self' }, 'read', { agentId: 'self' })).toBe(true)
  })

  it('scope: cross-agent read with self scope = denied', () => {
    expect(isScopeAllowed({ read: 'self' }, 'read', { agentId: 'other', readerAgentId: 'self' })).toBe(false)
  })

  it('isExpired: with TTL', () => {
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {}, ttl: 100 })
    expect(isExpired(env, Date.now() + 200)).toBe(true)
  })
})
