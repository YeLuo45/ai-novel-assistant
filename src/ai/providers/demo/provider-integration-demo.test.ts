/**
 * ai/providers/demo/provider-integration-demo.test.ts (I26)
 */

import { describe, it, expect } from 'vitest'
import { runProviderIntegrationDemo } from './provider-integration-demo'

describe('provider-integration-demo', () => {
  it('configures 2 providers', async () => {
    const r = await runProviderIntegrationDemo()
    expect(r.providersConfigured).toBe(2)
  })

  it('registers 3 models', async () => {
    const r = await runProviderIntegrationDemo()
    expect(r.modelsAvailable).toBe(3)
  })

  it('reserves tokens', async () => {
    const r = await runProviderIntegrationDemo()
    expect(r.tokensReserved).toBe(5000)
  })

  it('tracks cost', async () => {
    const r = await runProviderIntegrationDemo()
    expect(r.costTracked).toBeCloseTo(0.045)
  })

  it('cache hit rate > 0', async () => {
    const r = await runProviderIntegrationDemo()
    expect(r.cacheHitRate).toBeGreaterThan(0)
  })

  it('creates 1 conversation', async () => {
    const r = await runProviderIntegrationDemo()
    expect(r.conversationsCount).toBe(1)
  })

  it('1 adapter registered', async () => {
    const r = await runProviderIntegrationDemo()
    expect(r.adapterCount).toBe(1)
  })

  it('2 health checks', async () => {
    const r = await runProviderIntegrationDemo()
    expect(r.healthChecked).toBe(2)
  })

  it('end-to-end summary', async () => {
    const r = await runProviderIntegrationDemo()
    expect(r.providersConfigured + r.modelsAvailable + r.adapterCount).toBeGreaterThan(4)
  })
})