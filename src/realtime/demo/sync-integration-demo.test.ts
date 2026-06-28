/**
 * realtime/demo/sync-integration-demo.test.ts (N26)
 */

import { describe, it, expect } from 'vitest'
import { runSyncDemo } from './sync-integration-demo'

describe('sync-integration-demo', () => {
  it('connected', async () => {
    const r = await runSyncDemo()
    expect(r.connected).toBe(true)
  })

  it('2 presences', async () => {
    const r = await runSyncDemo()
    expect(r.presence).toBe(2)
  })

  it('2 cursors', async () => {
    const r = await runSyncDemo()
    expect(r.cursors).toBe(2)
  })

  it('1 awareness', async () => {
    const r = await runSyncDemo()
    expect(r.awareness).toBe(1)
  })

  it('1 pending op', async () => {
    const r = await runSyncDemo()
    expect(r.ops).toBe(1)
  })

  it('encryption works', async () => {
    const r = await runSyncDemo()
    expect(r.encrypted).toBe(true)
  })

  it('token valid', async () => {
    const r = await runSyncDemo()
    expect(r.tokenValid).toBe(true)
  })

  it('2 room members', async () => {
    const r = await runSyncDemo()
    expect(r.roomMembers).toBe(2)
  })

  it('2 audit events', async () => {
    const r = await runSyncDemo()
    expect(r.audits).toBe(2)
  })

  it('bandwidth recorded', async () => {
    const r = await runSyncDemo()
    expect(r.bandwidth).toBe(8000)
  })

  it('end-to-end summary', async () => {
    const r = await runSyncDemo()
    expect(r.presence + r.cursors + r.roomMembers).toBeGreaterThan(4)
  })
})