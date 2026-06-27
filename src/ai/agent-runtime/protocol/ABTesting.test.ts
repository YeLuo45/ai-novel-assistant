/**
 * protocol/ABTesting.test.ts (V2516-V2520) — 20+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  validateExperiment, BucketAssigner, ExperimentRunner, zTestProportions,
  type Experiment, type Variant,
} from './ABTesting'

const CONTROL: Variant = { variantId: 'control', name: 'Control', weight: 50, payload: {} }
const VARIANT_A: Variant = { variantId: 'a', name: 'A', weight: 50, payload: {} }

const makeExp = (overrides: Partial<Experiment> = {}): Experiment => ({
  experimentId: 'e1',
  name: 'Test',
  description: 'test',
  variants: [CONTROL, VARIANT_A],
  startTime: 0,
  status: 'running',
  significanceLevel: 0.05,
  minSampleSize: 100,
  ...overrides,
})

describe('validateExperiment', () => {
  it('valid experiment passes', () => {
    expect(validateExperiment(makeExp()).valid).toBe(true)
  })

  it('needs at least 2 variants', () => {
    expect(validateExperiment(makeExp({ variants: [CONTROL] })).valid).toBe(false)
  })

  it('weight must sum to > 0', () => {
    expect(validateExperiment(makeExp({ variants: [{ ...CONTROL, weight: 0 }, { ...VARIANT_A, weight: 0 }] })).valid).toBe(false)
  })

  it('significanceLevel must be in (0, 1)', () => {
    expect(validateExperiment(makeExp({ significanceLevel: 0 })).valid).toBe(false)
    expect(validateExperiment(makeExp({ significanceLevel: 1 })).valid).toBe(false)
  })
})

describe('BucketAssigner', () => {
  it('assigns consistently', () => {
    const a = new BucketAssigner()
    const v1 = a.assign('user-1', 'exp-1', [CONTROL, VARIANT_A])
    const v2 = a.assign('user-1', 'exp-1', [CONTROL, VARIANT_A])
    expect(v1.variantId).toBe(v2.variantId)
  })

  it('different users may get different variants', () => {
    const a = new BucketAssigner()
    const seen = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const v = a.assign(`user-${i}`, 'exp-1', [CONTROL, VARIANT_A])
      seen.add(v.variantId)
    }
    expect(seen.size).toBe(2)
  })

  it('simulateDistribution counts', () => {
    const a = new BucketAssigner()
    const userIds = Array.from({ length: 100 }, (_, i) => `u${i}`)
    const dist = a.simulateDistribution(userIds, 'exp-1', [CONTROL, VARIANT_A])
    const total = Array.from(dist.values()).reduce((s, n) => s + n, 0)
    expect(total).toBe(100)
  })
})

describe('ExperimentRunner', () => {
  it('assigns + records exposure + conversion', () => {
    const exp = makeExp()
    const r = new ExperimentRunner(exp)
    r.assign('u1')
    r.recordExposure('u1')
    r.recordConversion('u1')
    const results = r.results()
    const control = results.find(r => r.variantId === 'control')!
    expect(control.exposures).toBe(1)
    expect(control.conversions).toBe(1)
    expect(control.conversionRate).toBe(1)
  })

  it('assignment is consistent', () => {
    const r = new ExperimentRunner(makeExp())
    r.assign('u1')
    r.assign('u1')
    expect(r.assignmentCount()).toBe(1)
  })

  it('results aggregate', () => {
    const r = new ExperimentRunner(makeExp())
    for (let i = 0; i < 50; i++) {
      const user = `u${i}`
      r.assign(user)
      r.recordExposure(user)
      if (i < 25) r.recordConversion(user)
    }
    expect(r.results().length).toBe(2)
  })
})

describe('zTestProportions', () => {
  it('identical proportions = not significant', () => {
    const r = zTestProportions(100, 50, 100, 50)
    expect(r.isSignificant).toBe(false)
  })

  it('clear winner is significant', () => {
    // 100/200 (50%) vs 200/200 (100%) — huge difference
    const r = zTestProportions(200, 100, 200, 200, 0.05)
    expect(r.isSignificant).toBe(true)
    expect(r.winner).toBe('variant')
  })

  it('zero exposures returns no result', () => {
    const r = zTestProportions(0, 0, 100, 50)
    expect(r.isSignificant).toBe(false)
  })
})
