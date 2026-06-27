/**
 * protocol/NegotiationAndDelegation.test.ts (V2366-V2375) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  NegotiationRoom,
  VoteCollector,
  tallyWeighted,
  buildConsensus,
  NegotiationLog,
  DelegationChain,
  isScopeAllowed,
  ArbitrationRoom,
  resolveConflict,
  DelegationLog,
  type VoteRecord,
} from './NegotiationAndDelegation'

describe('NegotiationRoom', () => {
  it('open creates proposal', () => {
    const r = new NegotiationRoom()
    const p = r.open('a1', 'proposal-1', { price: 100 })
    expect(p.status).toBe('open')
    expect(p.initiator).toBe('a1')
  })

  it('accept transitions to accepted when all respond', () => {
    const r = new NegotiationRoom()
    const p = r.open('a1', 'p', {}, { participants: ['b1', 'b2'] })
    r.accept(p.proposalId, 'b1')
    r.accept(p.proposalId, 'b2')
    expect(r.get(p.proposalId)?.status).toBe('accepted')
  })

  it('reject transitions to rejected', () => {
    const r = new NegotiationRoom()
    const p = r.open('a1', 'p', {}, { participants: ['b1', 'b2'] })
    r.reject(p.proposalId, 'b1', 'no')
    expect(r.get(p.proposalId)?.status).toBe('rejected')
  })

  it('accept on unknown returns error', () => {
    const r = new NegotiationRoom()
    expect(r.accept('unknown', 'a').ok).toBe(false)
  })

  it('list filter by initiator', () => {
    const r = new NegotiationRoom()
    r.open('a1', 'p1', {})
    r.open('a2', 'p2', {})
    expect(r.list({ initiator: 'a1' }).length).toBe(1)
  })

  it('accept on closed proposal returns error', () => {
    const r = new NegotiationRoom()
    const p = r.open('a1', 'p', {}, { participants: ['b1'] })
    r.accept(p.proposalId, 'b1')  // 1 of 1 → accepted
    const result = r.accept(p.proposalId, 'b2')
    expect(result.ok).toBe(false)
  })

  it('reject on unknown proposal', () => {
    const r = new NegotiationRoom()
    expect(r.reject('unknown', 'a').ok).toBe(false)
  })
})

describe('VoteCollector + tallyWeighted', () => {
  it('tallyWeighted: majority wins', () => {
    const votes: VoteRecord[] = [
      { voter: 'a', choice: 'yes', weight: 1, votedAt: 0 },
      { voter: 'b', choice: 'yes', weight: 2, votedAt: 0 },
      { voter: 'c', choice: 'no', weight: 1, votedAt: 0 },
    ]
    const r = tallyWeighted(votes)
    expect(r.winner).toBe('yes')
    expect(r.totalWeight).toBe(4)
    expect(r.tied).toBe(false)
  })

  it('tallyWeighted: tied', () => {
    const votes: VoteRecord[] = [
      { voter: 'a', choice: 'x', weight: 1, votedAt: 0 },
      { voter: 'b', choice: 'y', weight: 1, votedAt: 0 },
    ]
    expect(tallyWeighted(votes).tied).toBe(true)
  })

  it('VoteCollector records and queries', () => {
    const c = new VoteCollector()
    c.record('topic-1', { voter: 'a', choice: 'yes', weight: 1, votedAt: 0 })
    c.record('topic-1', { voter: 'b', choice: 'no', weight: 1, votedAt: 0 })
    expect(c.voterCount('topic-1')).toBe(2)
    expect(c.topics()).toEqual(['topic-1'])
  })

  it('VoteCollector clear', () => {
    const c = new VoteCollector()
    c.record('t', { voter: 'a', choice: 'x', weight: 1, votedAt: 0 })
    expect(c.clear('t')).toBe(true)
    expect(c.voterCount('t')).toBe(0)
  })
})

describe('buildConsensus', () => {
  it('unanimous: all same', () => {
    const r = buildConsensus(
      [{ voter: 'a', choice: 'x', weight: 1, votedAt: 0 }, { voter: 'b', choice: 'x', weight: 1, votedAt: 0 }],
      'unanimous',
    )
    expect(r.reached).toBe(true)
    expect(r.choice).toBe('x')
  })

  it('unanimous: different', () => {
    const r = buildConsensus(
      [{ voter: 'a', choice: 'x', weight: 1, votedAt: 0 }, { voter: 'b', choice: 'y', weight: 1, votedAt: 0 }],
      'unanimous',
    )
    expect(r.reached).toBe(false)
  })

  it('majority: 2/3', () => {
    const r = buildConsensus(
      [
        { voter: 'a', choice: 'x', weight: 1, votedAt: 0 },
        { voter: 'b', choice: 'x', weight: 1, votedAt: 0 },
        { voter: 'c', choice: 'y', weight: 1, votedAt: 0 },
      ],
      'majority',
    )
    expect(r.reached).toBe(true)
  })

  it('majority: not reached', () => {
    const r = buildConsensus(
      [
        { voter: 'a', choice: 'x', weight: 1, votedAt: 0 },
        { voter: 'b', choice: 'y', weight: 1, votedAt: 0 },
      ],
      'majority',
    )
    expect(r.reached).toBe(false)
  })

  it('any: always reached', () => {
    const r = buildConsensus(
      [{ voter: 'a', choice: 'x', weight: 1, votedAt: 0 }],
      'any',
    )
    expect(r.reached).toBe(true)
  })

  it('empty votes: not reached', () => {
    expect(buildConsensus([], 'majority').reached).toBe(false)
  })

  it('weighted: highest weight wins', () => {
    const r = buildConsensus(
      [
        { voter: 'a', choice: 'x', weight: 1, votedAt: 0 },
        { voter: 'b', choice: 'y', weight: 3, votedAt: 0 },
        { voter: 'c', choice: 'x', weight: 1, votedAt: 0 },
      ],
      'weighted',
    )
    expect(r.reached).toBe(true)
    expect(r.choice).toBe('y')
  })

  it('weighted tied: not reached', () => {
    const r = buildConsensus(
      [
        { voter: 'a', choice: 'x', weight: 1, votedAt: 0 },
        { voter: 'b', choice: 'y', weight: 1, votedAt: 0 },
      ],
      'weighted',
    )
    expect(r.reached).toBe(false)
  })
})

describe('NegotiationLog', () => {
  it('record + query', () => {
    const l = new NegotiationLog()
    l.record({ proposalId: 'p1', actor: 'a', action: 'open' })
    l.record({ proposalId: 'p1', actor: 'b', action: 'accept' })
    expect(l.count()).toBe(2)
    expect(l.entries({ proposalId: 'p1' }).length).toBe(2)
  })

  it('clear empties', () => {
    const l = new NegotiationLog()
    l.record({ proposalId: 'p1', actor: 'a', action: 'open' })
    l.clear()
    expect(l.count()).toBe(0)
  })
})

describe('DelegationChain', () => {
  it('add + complete', () => {
    const c = new DelegationChain()
    c.add({ delegateId: 'd1', from: 'a', to: 'b', task: 't', children: [], status: 'running', createdAt: 0 })
    c.complete('d1', 'ok', 100)
    expect(c.get('d1')?.status).toBe('completed')
  })

  it('add + fail', () => {
    const c = new DelegationChain()
    c.add({ delegateId: 'd1', from: 'a', to: 'b', task: 't', children: [], status: 'running', createdAt: 0 })
    c.fail('d1', 'oops')
    expect(c.get('d1')?.status).toBe('failed')
  })

  it('parent-child relationship', () => {
    const c = new DelegationChain()
    c.add({ delegateId: 'd1', from: 'a', to: 'b', task: 't', children: [], status: 'pending', createdAt: 0 })
    c.add({ delegateId: 'd2', from: 'b', to: 'c', task: 't2', parentId: 'd1', children: [], status: 'pending', createdAt: 0 })
    expect(c.get('d1')?.children).toContain('d2')
    expect(c.children('d1').map(n => n.delegateId)).toEqual(['d2'])
  })

  it('pathToRoot', () => {
    const c = new DelegationChain()
    c.add({ delegateId: 'd1', from: 'a', to: 'b', task: 't', children: [], status: 'pending', createdAt: 0 })
    c.add({ delegateId: 'd2', from: 'b', to: 'c', task: 't2', parentId: 'd1', children: [], status: 'pending', createdAt: 0 })
    const path = c.pathToRoot('d2')
    expect(path.length).toBe(2)
    expect(path[0].delegateId).toBe('d1')
  })
})

describe('isScopeAllowed', () => {
  it('no scope = always allowed', () => {
    expect(isScopeAllowed(undefined, 'read', { agentId: 'a' })).toBe(true)
  })

  it('self scope + read other agent = denied', () => {
    expect(isScopeAllowed({ read: 'self' }, 'read', { agentId: 'other' })).toBe(false)
  })

  it('self scope + read self = allowed', () => {
    expect(isScopeAllowed({ read: 'self' }, 'read', { agentId: 'self' })).toBe(true)
  })

  it('tool not in whitelist = denied', () => {
    expect(isScopeAllowed({ tools: ['a', 'b'] }, 'tool', { tool: 'c' })).toBe(false)
  })

  it('max depth exceeded', () => {
    expect(isScopeAllowed({ maxDepth: 2 }, 'read', {}, 3)).toBe(false)
  })
})

describe('ArbitrationRoom', () => {
  it('open + resolve', () => {
    const r = new ArbitrationRoom()
    const c = r.open(['a', 'b'], 'conflict')
    expect(r.resolve(c.caseId, 'compromise')).toBe(true)
    expect(r.get(c.caseId)?.status).toBe('resolved')
  })

  it('reject', () => {
    const r = new ArbitrationRoom()
    const c = r.open(['a'], 'x')
    expect(r.reject(c.caseId, 'no basis')).toBe(true)
  })

  it('resolve closed case fails', () => {
    const r = new ArbitrationRoom()
    const c = r.open(['a'], 'x')
    r.resolve(c.caseId, 'ok')
    expect(r.resolve(c.caseId, 'try again')).toBe(false)
  })

  it('openCases lists', () => {
    const r = new ArbitrationRoom()
    r.open(['a'], 'x1')
    r.open(['b'], 'x2')
    expect(r.openCases().length).toBe(2)
  })
})

describe('resolveConflict', () => {
  it('first-wins', () => {
    const r = resolveConflict(
      [{ source: 'a', value: 1 }, { source: 'b', value: 2 }],
      'first-wins',
    )
    expect(r.resolved).toBe(1)
  })

  it('last-wins', () => {
    const r = resolveConflict(
      [{ source: 'a', value: 1 }, { source: 'b', value: 2 }],
      'last-wins',
    )
    expect(r.resolved).toBe(2)
  })

  it('majority', () => {
    const r = resolveConflict(
      [
        { source: 'a', value: 1 },
        { source: 'b', value: 1 },
        { source: 'c', value: 2 },
      ],
      'majority',
    )
    expect(r.resolved).toBe(1)
  })

  it('arbitration', () => {
    const r = resolveConflict(
      [{ source: 'a', value: 1 }, { source: 'b', value: 2 }],
      'arbitration',
      { arbitrator: () => 1 },
    )
    expect(r.resolved).toBe(1)
  })

  it('empty items throws', () => {
    expect(() => resolveConflict([], 'first-wins')).toThrow()
  })

  it('arbitration without arbitrator throws', () => {
    expect(() => resolveConflict(
      [{ source: 'a', value: 1 }, { source: 'b', value: 2 }],
      'arbitration',
    )).toThrow()
  })
})

describe('DelegationLog', () => {
  it('record + query', () => {
    const l = new DelegationLog()
    l.record({ delegateId: 'd1', from: 'a', to: 'b', task: 't', status: 'start' })
    l.record({ delegateId: 'd1', from: 'a', to: 'b', task: 't', status: 'complete' })
    expect(l.count()).toBe(2)
    expect(l.entries({ delegateId: 'd1' }).length).toBe(2)
  })
})
