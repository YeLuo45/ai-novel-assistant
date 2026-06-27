/**
 * ai/collab/demo/multi-user-integration-demo.test.ts
 */

import { describe, it, expect } from 'vitest'
import { runMultiUserDemo } from './multi-user-integration-demo'

describe('multi-user-integration-demo', () => {
  it('creates 3 sessions', () => {
    expect(runMultiUserDemo().sessions).toBe(3)
  })

  it('2 online users', () => {
    expect(runMultiUserDemo().onlineUsers).toBe(2)
  })

  it('1 workspace', () => {
    expect(runMultiUserDemo().workspaces).toBe(1)
  })

  it('3 workspace members', () => {
    expect(runMultiUserDemo().members).toBe(3)
  })

  it('2 comments (parent + reply)', () => {
    expect(runMultiUserDemo().comments).toBe(2)
  })

  it('2 pending reviews', () => {
    expect(runMultiUserDemo().reviews).toBe(2)
  })

  it('1 pending approval', () => {
    expect(runMultiUserDemo().approvals).toBe(1)
  })

  it('2 notifications', () => {
    expect(runMultiUserDemo().notifications).toBe(2)
  })

  it('2 activity entries', () => {
    expect(runMultiUserDemo().activities).toBe(2)
  })

  it('2 audit entries', () => {
    expect(runMultiUserDemo().auditEntries).toBe(2)
  })

  it('1 pending invitation', () => {
    expect(runMultiUserDemo().invitations).toBe(1)
  })

  it('1 team', () => {
    expect(runMultiUserDemo().teams).toBe(1)
  })

  it('end-to-end summary', () => {
    const r = runMultiUserDemo()
    expect(r.sessions + r.members + r.comments + r.teams).toBeGreaterThan(8)
  })
})