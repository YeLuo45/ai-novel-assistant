/**
 * collab/v3/demo/studio-integration-demo.test.ts (H26) - 10 e2e 断言
 */

import { describe, it, expect } from 'vitest'
import { runStudioIntegrationDemo } from './studio-integration-demo'

describe('studio-integration-demo', () => {
  it('creates 5 agents', async () => {
    const r = await runStudioIntegrationDemo()
    expect(r.agentCount).toBe(5)
  })

  it('creates 4 connections', async () => {
    const r = await runStudioIntegrationDemo()
    expect(r.connectionCount).toBe(4)
  })

  it('store version > 0', async () => {
    const r = await runStudioIntegrationDemo()
    expect(r.storeVersion).toBeGreaterThan(0)
  })

  it('marketplace has 5 listings', async () => {
    const r = await runStudioIntegrationDemo()
    expect(r.marketplaceListings).toBe(5)
  })

  it('2 installed in marketplace', async () => {
    const r = await runStudioIntegrationDemo()
    expect(r.installedCount).toBe(2)
  })

  it('experiment has 2 variants', async () => {
    const r = await runStudioIntegrationDemo()
    expect(r.experimentVariantCount).toBe(2)
  })

  it('health check registered', async () => {
    const r = await runStudioIntegrationDemo()
    expect(r.healthCheckCount).toBe(1)
  })

  it('1 alert rule', async () => {
    const r = await runStudioIntegrationDemo()
    expect(r.alertRuleCount).toBe(1)
  })

  it('hook event triggered', async () => {
    const r = await runStudioIntegrationDemo()
    expect(r.hookEventCount).toBeGreaterThan(0)
  })

  it('end-to-end summary', async () => {
    const r = await runStudioIntegrationDemo()
    const total = r.agentCount + r.connectionCount + r.marketplaceListings + r.installedCount
    expect(total).toBeGreaterThan(10)
  })
})