/**
 * protocol/demo/negotiation-demo.test.ts (V2381) — 6 断言
 */

import { describe, it, expect } from 'vitest'
import {
  startNegotiationDemo,
  simulateProposal,
  runNegotiationDemo,
} from './negotiation-demo'

describe('negotiation-demo', () => {
  it('startNegotiationDemo spawns 5 agents', () => {
    const { runtime, team } = startNegotiationDemo()
    expect(team.length).toBe(5)
    expect(runtime.count()).toBe(5)
  })

  it('simulateProposal records votes', () => {
    const { runtime, bus, room, votes, team } = startNegotiationDemo()
    const r = simulateProposal(runtime, bus, room, votes, 'test proposal', team)
    expect(r.votes).toBe(5)
  })

  it('simulateProposal returns consensus result', () => {
    const { runtime, bus, room, votes, team } = startNegotiationDemo()
    const r = simulateProposal(runtime, bus, room, votes, 'tighten pacing', team)
    expect(r.consensus).toBeDefined()
  })

  it('runNegotiationDemo end-to-end', () => {
    const r = runNegotiationDemo()
    expect(r.teamSize).toBe(5)
    expect(r.votes).toBe(5)
  })

  it('consensus has reason', () => {
    const { runtime, bus, room, votes, team } = startNegotiationDemo()
    const r = simulateProposal(runtime, bus, room, votes, 'test', team)
    expect(r.consensus.reason.length).toBeGreaterThan(0)
  })

  it('multiple proposals in sequence', () => {
    const { runtime, bus, room, votes, team } = startNegotiationDemo()
    const r1 = simulateProposal(runtime, bus, room, votes, 'p1', team)
    const r2 = simulateProposal(runtime, bus, room, votes, 'p2', team)
    expect(r1.proposalId).not.toBe(r2.proposalId)
  })
})
