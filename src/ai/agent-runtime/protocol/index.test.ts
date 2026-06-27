/**
 * protocol/index.test.ts — Direction B 公共 API 验证
 */

import { describe, it, expect } from 'vitest'
import * as Protocol from './index'
import { DIRECTION_B_VERSION } from './index'

describe('protocol — public API', () => {
  it('DIRECTION_B_VERSION is 1.x', () => {
    expect(DIRECTION_B_VERSION).toMatch(/^1\./)
  })

  it('exports types', () => {
    expect(Protocol.ALL_MESSAGE_KINDS.length).toBe(9)
    expect(Protocol.PROTOCOL_VERSION).toMatch(/^1\./)
  })

  it('exports AgentMessageBus', () => {
    expect(typeof Protocol.AgentMessageBus).toBe('function')
    expect(typeof Protocol.getGlobalBus).toBe('function')
  })

  it('exports Router + Serializer', () => {
    expect(typeof Protocol.MessageRouter).toBe('function')
    expect(typeof Protocol.serializeMessage).toBe('function')
    expect(typeof Protocol.deserializeMessage).toBe('function')
  })

  it('exports RequestReply utilities', () => {
    expect(typeof Protocol.requestReply).toBe('function')
    expect(typeof Protocol.asyncRequest).toBe('function')
    expect(typeof Protocol.PromiseTracker).toBe('function')
    expect(typeof Protocol.ReplyMatcher).toBe('function')
    expect(typeof Protocol.RequestQueue).toBe('function')
  })

  it('exports Negotiation/Voting/Delegation', () => {
    expect(typeof Protocol.NegotiationRoom).toBe('function')
    expect(typeof Protocol.VoteCollector).toBe('function')
    expect(typeof Protocol.tallyWeighted).toBe('function')
    expect(typeof Protocol.buildConsensus).toBe('function')
    expect(typeof Protocol.DelegationChain).toBe('function')
    expect(typeof Protocol.ArbitrationRoom).toBe('function')
    expect(typeof Protocol.resolveConflict).toBe('function')
    expect(typeof Protocol.isScopeAllowed).toBe('function')
  })
})

describe('protocol — integration smoke', () => {
  it('end-to-end: REQUEST → RESPONSE', () => {
    const bus = new Protocol.AgentMessageBus()
    const req = Protocol.createRequest('a', 'b', { intent: 'compute' })
    bus.send({ kind: 'REQUEST', from: 'a', to: 'b', payload: req.payload, correlationId: req.id })
    expect(bus.mailbox('b').length).toBe(1)
  })

  it('end-to-end: OFFER → ACCEPT', () => {
    const offer = Protocol.createOffer('a', 'b', { proposal: 'do X', terms: {} })
    const acc = Protocol.createAccept('b', 'a', offer)
    expect(acc.correlationId).toBe(offer.id)
  })

  it('end-to-end: vote tally + consensus', () => {
    const collector = new Protocol.VoteCollector()
    collector.record('t1', { voter: 'a', choice: 'yes', weight: 1, votedAt: 0 })
    collector.record('t1', { voter: 'b', choice: 'yes', weight: 2, votedAt: 0 })
    collector.record('t1', { voter: 'c', choice: 'no', weight: 1, votedAt: 0 })
    const tally = Protocol.tallyWeighted(collector.votesFor('t1'))
    expect(tally.winner).toBe('yes')
    const consensus = Protocol.buildConsensus(collector.votesFor('t1'), 'majority')
    expect(consensus.reached).toBe(true)
  })
})
