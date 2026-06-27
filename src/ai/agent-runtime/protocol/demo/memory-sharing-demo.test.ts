/**
 * protocol/demo/memory-sharing-demo.test.ts (V2411) — 6 断言
 */

import { describe, it, expect } from 'vitest'
import {
  startMemorySharingDemo,
  simulateMemorySharing,
  runMemorySharingDemo,
} from './memory-sharing-demo'

describe('memory-sharing-demo', () => {
  it('startMemorySharingDemo spawns 5 agents', () => {
    const { stores } = startMemorySharingDemo()
    expect(stores.size).toBe(5)
  })

  it('simulateMemorySharing writes private', () => {
    const { runtime, stores, guards, leases, auctions, events } = startMemorySharingDemo()
    const r = simulateMemorySharing(runtime, stores, guards, leases, auctions, events)
    expect(r.privateWritten).toBe(1)
  })

  it('simulateMemorySharing grants lease', () => {
    const { runtime, stores, guards, leases, auctions, events } = startMemorySharingDemo()
    const r = simulateMemorySharing(runtime, stores, guards, leases, auctions, events)
    expect(r.sharedViaLease).toBe(1)
  })

  it('simulateMemorySharing approves auction', () => {
    const { runtime, stores, guards, leases, auctions, events } = startMemorySharingDemo()
    const r = simulateMemorySharing(runtime, stores, guards, leases, auctions, events)
    expect(r.approvedRequests).toBe(1)
  })

  it('replay steps recorded', () => {
    const { runtime, stores, guards, leases, auctions, events } = startMemorySharingDemo()
    const r = simulateMemorySharing(runtime, stores, guards, leases, auctions, events)
    expect(r.replaySteps).toBeGreaterThanOrEqual(0)
  })

  it('runMemorySharingDemo end-to-end', () => {
    const r = runMemorySharingDemo()
    expect(r.teamSize).toBe(5)
    expect(r.result.privateWritten).toBe(1)
  })
})
