/**
 * devops/DevOpsAdvanced.test.ts (U16-U25) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  DeploymentStrategy, TrafficSplitter, VersionManager, ReleaseNotes, ChangelogGenerator,
  SmokeTest, E2ETestRunner, LoadTest, SyntheticMonitor, OnCallScheduler,
} from './DevOpsAdvanced'

describe('U16: DeploymentStrategy', () => {
  it('blue-green switch', () => {
    const s = new DeploymentStrategy('blue-green')
    expect(s.activeEnv()).toBe('blue')
    expect(s.blueGreenSwitch()).toBe('green')
    expect(s.blueGreenSwitch()).toBe('blue')
  })

  it('rolling update', () => {
    const s = new DeploymentStrategy('rolling')
    const r = s.rollingUpdate(3, 10)
    expect(r.batch).toBe(3)
    expect(r.remaining).toBe(7)
  })

  it('canary rollout', () => {
    const s = new DeploymentStrategy('canary')
    const r = s.canaryRollout(10, 50)
    expect(r.delta).toBe(40)
  })
})

describe('U17: TrafficSplitter', () => {
  it('set + route', () => {
    const t = new TrafficSplitter()
    t.setWeight('v1', 80)
    t.setWeight('v2', 20)
    expect(t.route('user-1')).toMatch(/v[12]/)
  })

  it('normalize', () => {
    const t = new TrafficSplitter()
    t.setWeight('a', 2)
    t.setWeight('b', 2)
    t.normalize()
    const w = t.weights()
    expect(w.get('a')).toBe(50)
    expect(w.get('b')).toBe(50)
  })
})

describe('U18: VersionManager', () => {
  it('bump', () => {
    const v = new VersionManager()
    v.bump('minor')
    expect(v.current().minor).toBe(2)
  })

  it('compare', () => {
    expect(VersionManager.compare({ major: 1, minor: 0, patch: 0 }, { major: 0, minor: 9, patch: 9 })).toBe(1)
    expect(VersionManager.compare({ major: 1, minor: 2, patch: 0 }, { major: 1, minor: 2, patch: 0 })).toBe(0)
  })

  it('toString', () => {
    expect(new VersionManager().toString({ major: 1, minor: 2, patch: 3, preRelease: 'beta' })).toBe('1.2.3-beta')
  })
})

describe('U19: ReleaseNotes', () => {
  it('add + latest', () => {
    const r = new ReleaseNotes()
    r.add({ version: '1.0.0', date: Date.now(), type: 'major', features: ['x'], fixes: [], breaking: [] })
    expect(r.latest()?.version).toBe('1.0.0')
  })

  it('toMarkdown', () => {
    const r = new ReleaseNotes()
    const md = r.toMarkdown({ version: '1.0.0', date: 0, type: 'major', features: ['A'], fixes: ['B'], breaking: ['C'] })
    expect(md).toContain('Features')
    expect(md).toContain('Bug Fixes')
    expect(md).toContain('Breaking')
  })
})

describe('U20: ChangelogGenerator', () => {
  it('generate', () => {
    const c = new ChangelogGenerator()
    c.add('added', 'New API', 'api')
    c.add('fixed', 'Bug X', 'core')
    const md = c.generate('1.0.0')
    expect(md).toContain('New API')
    expect(md).toContain('Bug X')
    expect(md).toContain('Added')
    expect(md).toContain('Fixed')
  })
})

describe('U21: SmokeTest', () => {
  it('run + passed/failed', async () => {
    const s = new SmokeTest(1000)
    s.add('a', async () => {})
    s.add('b', async () => { throw new Error('fail') })
    const r = await s.runAll()
    expect(s.passed(r)).toBe(1)
    expect(s.failed(r).length).toBe(1)
  })

  it('timeout', async () => {
    const s = new SmokeTest(10)
    s.add('slow', async () => { await new Promise(r => setTimeout(r, 50)) })
    const r = await s.runAll()
    expect(r[0]?.passed).toBe(false)
  })
})

describe('U22: E2ETestRunner', () => {
  it('run independent steps', async () => {
    const r = new E2ETestRunner()
    r.add({ stepId: 'a', description: 'a', fn: async () => {} })
    r.add({ stepId: 'b', description: 'b', fn: async () => {} })
    const results = await r.run()
    expect(results.every(r => r.passed)).toBe(true)
  })

  it('dependency order', async () => {
    const r = new E2ETestRunner()
    const order: string[] = []
    r.add({ stepId: 'a', description: 'a', fn: () => { order.push('a') }, dependencies: ['b'] })
    r.add({ stepId: 'b', description: 'b', fn: () => { order.push('b') } })
    await r.run()
    expect(order).toEqual(['b', 'a'])
  })
})

describe('U23: LoadTest', () => {
  it('basic load test', async () => {
    const lt = new LoadTest()
    const r = await lt.run(5, 20, async () => { await new Promise(res => setTimeout(res, 1)) })
    expect(r.totalRequests).toBe(20)
    expect(r.successCount).toBe(20)
  })
})

describe('U24: SyntheticMonitor', () => {
  it('runOnce', async () => {
    const m = new SyntheticMonitor()
    m.register({ name: 'api', intervalMs: 1000, fn: async () => true })
    const r = await m.runOnce('api')
    expect(r?.success).toBe(true)
  })

  it('failureRate', async () => {
    const m = new SyntheticMonitor()
    let count = 0
    m.register({ name: 'api', intervalMs: 1000, fn: async () => { count += 1; return count % 2 === 0 } })
    for (let i = 0; i < 4; i++) await m.runOnce('api')
    expect(m.failureRate('api')).toBe(0.5)
  })
})

describe('U25: OnCallScheduler', () => {
  it('currentOnCall', () => {
    const s = new OnCallScheduler()
    const now = Date.now()
    s.add({ userId: 'alice', start: now - 1000, end: now + 1000, level: 'primary' })
    s.add({ userId: 'bob', start: now - 1000, end: now + 1000, level: 'secondary' })
    const r = s.currentOnCall(now)
    expect(r.primary?.userId).toBe('alice')
    expect(r.secondary?.userId).toBe('bob')
  })

  it('gap detection', () => {
    const s = new OnCallScheduler()
    const now = Date.now()
    s.add({ userId: 'alice', start: now + 1000, end: now + 2000, level: 'primary' })
    const r = s.hasGapCoverage(now, now + 3000, 1000)
    expect(r.gaps.length).toBeGreaterThan(0)
  })
})