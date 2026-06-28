/**
 * devops/__tests__/devops-integration.test.ts (U27)
 */

import { describe, it, expect } from 'vitest'
import {
  BuildPipeline, DeployPipeline, RollbackManager, HealthCheck, CanaryDeploy,
  ErrorTracker, LogAggregator, MetricCollector, AlertManager, IncidentManager,
  EnvManager, SecretsManager, ConfigCenter, FeatureFlags, CICDConfig,
  DeploymentStrategy, TrafficSplitter, VersionManager, ReleaseNotes, ChangelogGenerator,
  SmokeTest, E2ETestRunner, LoadTest, SyntheticMonitor, OnCallScheduler,
} from '../index'

describe('DevOps — end-to-end', () => {
  it('build + deploy + rollback', async () => {
    const build = new BuildPipeline()
    build.addStep('test', 'vitest')
    await build.run(async () => ({ success: true, output: 'ok' }))
    expect(build.status()).toBe('success')

    const deploy = new DeployPipeline()
    deploy.addStage('prod', 'prod')
    await deploy.deploy(async () => ({ success: true }))

    const rollback = new RollbackManager()
    rollback.deploy('v1.0.0', 'prod')
    rollback.deploy('v1.0.1', 'prod')
    rollback.rollback()
    expect(rollback.current('prod')?.version).toBe('v1.0.0')
  })

  it('health + canary', async () => {
    const h = new HealthCheck()
    h.register('api', async () => ({ service: 'api', status: 'healthy', checkedAt: Date.now() }))
    const r = await h.runAll()
    expect(h.aggregate(r)).toBe('healthy')

    const c = new CanaryDeploy()
    await c.promote(async () => 0.005)
    expect(c.currentPercent()).toBeGreaterThan(0)
  })

  it('error + log + metrics + alert', () => {
    const et = new ErrorTracker()
    et.capture(new Error('e1'))
    expect(et.all().length).toBe(1)

    const logs = new LogAggregator()
    logs.add('error', 'msg')
    expect(logs.errors().length).toBe(1)

    const m = new MetricCollector()
    m.increment('counter')
    expect(m.counter('counter')).toBe(1)

    const a = new AlertManager()
    a.fire('x', 'warning', 'msg')
    expect(a.active().length).toBe(1)
  })

  it('incident + env + secrets + config + feature', () => {
    const im = new IncidentManager()
    im.create('x', 'sev2')
    expect(im.open().length).toBe(1)

    const e = new EnvManager()
    e.require('API_KEY')
    expect(e.validate().valid).toBe(false)

    const s = new SecretsManager()
    s.set('key', 'value')
    expect(s.get('key')).toBe('value')

    const c = new ConfigCenter()
    c.set('flag', true)
    expect(c.get('flag')).toBe(true)

    const ff = new FeatureFlags()
    ff.define('x', true, 100)
    expect(ff.isEnabled('x')).toBe(true)
  })

  it('deployment + traffic + version', () => {
    const ds = new DeploymentStrategy('blue-green')
    ds.blueGreenSwitch()
    expect(ds.activeEnv()).toBe('green')

    const ts = new TrafficSplitter()
    ts.setWeight('a', 50)
    ts.setWeight('b', 50)
    expect(ts.weights().size).toBe(2)

    const v = new VersionManager()
    v.bump('major')
    expect(v.current().major).toBe(1)
  })

  it('release + changelog + smoke + e2e + load', async () => {
    const rn = new ReleaseNotes()
    rn.add({ version: '1.0.0', date: Date.now(), type: 'major', features: [], fixes: [], breaking: [] })
    expect(rn.latest()).not.toBeNull()

    const cl = new ChangelogGenerator()
    cl.add('added', 'feature')
    expect(cl.generate('1.0.0')).toContain('feature')

    const smoke = new SmokeTest()
    smoke.add('a', async () => {})
    const sr = await smoke.runAll()
    expect(smoke.passed(sr)).toBe(1)

    const e2e = new E2ETestRunner()
    e2e.add({ stepId: 'a', description: 'a', fn: async () => {} })
    await e2e.run()

    const load = new LoadTest()
    const lr = await load.run(2, 5, async () => {})
    expect(lr.totalRequests).toBe(5)
  })

  it('synthetic + on-call', async () => {
    const m = new SyntheticMonitor()
    m.register({ name: 'api', intervalMs: 1000, fn: async () => true })
    const r = await m.runOnce('api')
    expect(r?.success).toBe(true)

    const onCall = new OnCallScheduler()
    const now = Date.now()
    onCall.add({ userId: 'alice', start: now - 1000, end: now + 1000, level: 'primary' })
    expect(onCall.currentOnCall(now).primary?.userId).toBe('alice')
  })
})