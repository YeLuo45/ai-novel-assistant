/**
 * protocol/demo/soul-marketplace-demo.test.ts (V2471) — 5 断言
 */

import { describe, it, expect } from 'vitest'
import { runSoulMarketplaceDemo } from './soul-marketplace-demo'

describe('soul-marketplace-demo', () => {
  it('publishes 3 templates', () => {
    const r = runSoulMarketplaceDemo()
    expect(r.marketplaceSize).toBe(3)
  })

  it('installs + activates 1', () => {
    const r = runSoulMarketplaceDemo()
    expect(r.installed).toBe(1)
    expect(r.active).toBe(1)
  })

  it('generates share link', () => {
    const r = runSoulMarketplaceDemo()
    expect(r.sharedLink.startsWith('soul://')).toBe(true)
  })

  it('imports package', () => {
    const r = runSoulMarketplaceDemo()
    expect(r.imported).toBe(true)
  })

  it('end-to-end', () => {
    const r = runSoulMarketplaceDemo()
    expect(r.marketplaceSize).toBeGreaterThan(0)
  })
})
