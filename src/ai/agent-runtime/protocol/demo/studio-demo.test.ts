/**
 * protocol/demo/studio-demo.test.ts (V2501) — 5 断言
 */

import { describe, it, expect } from 'vitest'
import { runStudioDemo } from './studio-demo'

describe('studio-demo', () => {
  it('creates 5 agents + 2 connections', () => {
    const r = runStudioDemo()
    expect(r.agentCount).toBe(5)
    expect(r.connectionCount).toBe(2)
  })

  it('records total changes', () => {
    const r = runStudioDemo()
    expect(r.totalChanges).toBeGreaterThan(0)
  })

  it('export roundtrip is valid', () => {
    const r = runStudioDemo()
    expect(r.exportValid).toBe(true)
  })

  it('end-to-end', () => {
    const r = runStudioDemo()
    expect(r.agentCount + r.connectionCount).toBe(7)
  })
})
