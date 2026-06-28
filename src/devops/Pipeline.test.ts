/**
 * devops/Pipeline.test.ts (U1-U15) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  BuildPipeline, DeployPipeline, RollbackManager, HealthCheck, CanaryDeploy,
  ErrorTracker, LogAggregator, MetricCollector, AlertManager, IncidentManager,
  EnvManager, SecretsManager, ConfigCenter, FeatureFlags, CICDConfig,
} from './Pipeline'

describe('U1: BuildPipeline', () => {
  it('run success', async () => {
    const p = new BuildPipeline()
    p.addStep('lint', 'eslint')
    p.addStep('test', 'vitest')
    const status = await p.run(async (cmd) => ({ success: true, output: `ran ${cmd}` }))
    expect(status).toBe('success')
    expect(p.steps().every(s => s.status === 'success')).toBe(true)
  })

  it('run fail', async () => {
    const p = new BuildPipeline()
    p.addStep('test', 'vitest')
    const status = await p.run(async () => ({ success: false, output: 'fail' }))
    expect(status).toBe('failed')
    expect(p.failedSteps().length).toBe(1)
  })
})

describe('U2: DeployPipeline', () => {
  it('multi-stage deploy', async () => {
    const p = new DeployPipeline()
    p.addStage('staging', 'staging').addStage('prod', 'prod')
    const r = await p.deploy(async () => ({ success: true }))
    expect(r.success).toBe(true)
  })

  it('fail mid-stage', async () => {
    const p = new DeployPipeline()
    p.addStage('staging', 'staging').addStage('prod', 'prod')
    const r = await p.deploy(async (s) => ({ success: s.name === 'staging' }))
    expect(r.failedAt).toBe('prod')
  })
})

describe('U3: RollbackManager', () => {
  it('deploy + rollback', () => {
    const r = new RollbackManager()
    r.deploy('v1.0.0', 'prod')
    r.deploy('v1.0.1', 'prod')
    expect(r.current('prod')?.version).toBe('v1.0.1')
    r.rollback()
    expect(r.current('prod')?.version).toBe('v1.0.0')
  })
})

describe('U4: HealthCheck', () => {
  it('register + run', async () => {
    const h = new HealthCheck()
    h.register('api', async () => ({ service: 'api', status: 'healthy', checkedAt: Date.now() }))
    const r = await h.run('api')
    expect(r?.status).toBe('healthy')
  })

  it('aggregate', () => {
    const h = new HealthCheck()
    expect(h.aggregate([{ service: 'a', status: 'healthy', checkedAt: 0 }])).toBe('healthy')
    expect(h.aggregate([{ service: 'a', status: 'healthy', checkedAt: 0 }, { service: 'b', status: 'degraded', checkedAt: 0 }])).toBe('degraded')
    expect(h.aggregate([{ service: 'a', status: 'unhealthy', checkedAt: 0 }])).toBe('unhealthy')
  })
})

describe('U5: CanaryDeploy', () => {
  it('stages + promote', async () => {
    const c = new CanaryDeploy()
    expect(c.currentPercent()).toBe(0)
    await c.promote(async () => 0.005)
    expect(c.currentPercent()).toBe(1)
  })

  it('blocks on high error rate', async () => {
    const c = new CanaryDeploy()
    const r = await c.promote(async () => 0.05)
    expect(r.promoted).toBe(false)
  })
})

describe('U6: ErrorTracker', () => {
  it('capture + topN', () => {
    const t = new ErrorTracker()
    t.capture(new Error('a'))
    t.capture(new Error('a'))  // same fingerprint
    t.capture(new Error('b'))
    const top = t.topN(1)
    expect(top[0]?.occurrences).toBe(2)
  })
})

describe('U7: LogAggregator', () => {
  it('add + byLevel + errors + search', () => {
    const l = new LogAggregator()
    l.add('info', 'started')
    l.add('error', 'failed', 'api')
    expect(l.byLevel('info').length).toBe(1)
    expect(l.errors().length).toBe(1)
    expect(l.search('start').length).toBe(1)
  })
})

describe('U8: MetricCollector', () => {
  it('counter + gauge + histogram', () => {
    const m = new MetricCollector()
    m.increment('requests', 5)
    m.increment('requests')
    expect(m.counter('requests')).toBe(6)
    m.gauge('cpu', 0.5)
    expect(m.gaugeValue('cpu')).toBe(0.5)
    m.histogram('latency', 100)
    expect(m.byName('latency').length).toBe(1)
  })
})

describe('U9: AlertManager', () => {
  it('fire + resolve + active', () => {
    const a = new AlertManager()
    const alert = a.fire('high-cpu', 'critical', 'cpu > 90%')
    expect(a.active().length).toBe(1)
    a.resolve(alert.alertId)
    expect(a.active().length).toBe(0)
  })
})

describe('U10: IncidentManager', () => {
  it('create + update + addNote', () => {
    const im = new IncidentManager()
    const inc = im.create('login broken', 'sev1')
    im.update(inc.incidentId, 'investigating')
    im.addNote(inc.incidentId, 'investigating root cause')
    expect(im.byStatus('investigating').length).toBe(1)
  })
})

describe('U11: EnvManager', () => {
  it('set + require + validate', () => {
    const e = new EnvManager()
    e.set('NODE_ENV', 'production')
    e.require('NODE_ENV')
    expect(e.validate().valid).toBe(true)
    expect(e.validate().missing).toEqual([])
  })

  it('missing required', () => {
    const e = new EnvManager()
    e.require('API_KEY')
    expect(e.validate().valid).toBe(false)
  })
})

describe('U12: SecretsManager', () => {
  it('set + get + rotate + audit', () => {
    const s = new SecretsManager()
    s.set('api-key', 'secret-1', 'admin')
    s.get('api-key', 'app')
    s.rotate('api-key', 'secret-2', 'admin')
    expect(s.keys()).toContain('api-key')
    expect(s.auditLog().length).toBe(3)
  })
})

describe('U13: ConfigCenter', () => {
  it('set + get + version', () => {
    const c = new ConfigCenter()
    c.set('feature-x', true)
    c.set('feature-x', false)
    expect(c.get('feature-x')).toBe(false)
    expect(c.version('feature-x')).toBe(2)
  })

  it('watch + change', () => {
    const c = new ConfigCenter()
    let called = 0
    c.watch('flag', () => { called += 1 })
    c.set('flag', true)
    c.set('flag', false)
    expect(called).toBe(2)
  })
})

describe('U14: FeatureFlags', () => {
  it('enable/disable', () => {
    const f = new FeatureFlags()
    f.define('new-ui', false)
    expect(f.isEnabled('new-ui')).toBe(false)
    f.enable('new-ui')
    expect(f.isEnabled('new-ui')).toBe(true)
  })

  it('rollout percent', () => {
    const f = new FeatureFlags()
    f.define('beta', true, 50)
    let enabledCount = 0
    for (let i = 0; i < 100; i++) {
      if (f.isEnabled('beta', `user-${i}`)) enabledCount += 1
    }
    expect(enabledCount).toBeGreaterThan(30)
    expect(enabledCount).toBeLessThan(70)
  })

  it('allowList', () => {
    const f = new FeatureFlags()
    f.define('internal', true, 0)  // enabled but 0% rollout
    f.allowUser('internal', 'admin-1')
    expect(f.isEnabled('internal', 'admin-1')).toBe(true)
  })
})

describe('U15: CICDConfig', () => {
  it('add + forBranch', () => {
    const c = new CICDConfig()
    c.add({ name: 'main', trigger: 'push', branches: ['main'], stages: [{ name: 'test', jobs: ['vitest'] }], environment: 'prod', autoDeploy: true })
    expect(c.forBranch('main').length).toBe(1)
    expect(c.forBranch('dev').length).toBe(0)
  })
})