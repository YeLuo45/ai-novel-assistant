/**
 * protocol/demo/observability-demo.test.ts (V2531) — 6 断言
 */

import { describe, it, expect } from 'vitest'
import { runObservabilityDemo } from './observability-demo'

describe('observability-demo', () => {
  it('metrics has keys', async () => {
    const r = await runObservabilityDemo()
    expect(r.metricsKeys).toBeGreaterThan(0)
  })

  it('experiment has 2 results', async () => {
    const r = await runObservabilityDemo()
    expect(r.experimentResults).toBe(2)
  })

  it('metrics has counters', async () => {
    const r = await runObservabilityDemo()
    expect(r.metricsKeys).toBeGreaterThan(0)
  })

  it('health is healthy', async () => {
    const r = await runObservabilityDemo()
    expect(r.health).toBe('healthy')
  })

  it('alert not triggered (errors < 100)', async () => {
    const r = await runObservabilityDemo()
    expect(r.alertTriggered).toBe(false)
  })

  it('recovery succeeds', async () => {
    const r = await runObservabilityDemo()
    expect(r.recoverySuccess).toBe(true)
  })
})
