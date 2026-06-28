# DevOps & Observability (V3) — Direction U

**Version**: 1.0.0
**Engines**: V2926-V2955 (30 engines, 6 batches)
**Tests**: 76 tests, 100% pass

## 目标

完整 DevOps + 可观测性：构建流水线、部署、Canary、Rollback、HealthCheck、ErrorTracker、LogAggregator、Metrics、Alert、Incident、Env/Secrets/Config、FeatureFlags、CI/CD、Deployment Strategy、Traffic Split、Versioning、Release Notes、Smoke/E2E/Load Test、Synthetic Monitor、OnCall。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| U1-U15 | `Pipeline.ts` | BuildPipeline + DeployPipeline + RollbackManager + HealthCheck + CanaryDeploy + ErrorTracker (fingerprint) + LogAggregator + MetricCollector (counter/gauge/histogram) + AlertManager + IncidentManager + EnvManager + SecretsManager (audit) + ConfigCenter (versioning + watch) + FeatureFlags (rollout %) + CICDConfig |
| U16-U25 | `DevOpsAdvanced.ts` | DeploymentStrategy (4 strategies) + TrafficSplitter (weighted hash) + VersionManager (semver) + ReleaseNotes (Markdown) + ChangelogGenerator (Keep-a-Changelog) + SmokeTest (timeout) + E2ETestRunner (deps order) + LoadTest (atomic counter) + SyntheticMonitor + OnCallScheduler (gap detection) |
| U26 | `index.ts` + `demo/devops-demo.ts` | 25 端到端断言 |
| U27 | `__tests__/devops-integration.test.ts` | 7 集成测试 |
| U28 | `DEVOPS_README.md` | 本文档 |
| U29 | 主 README 更新 | 验证命令 |
| U30 | 收口 commit + push | |

## 核心 API 示例

### 1. Build + Deploy + Rollback

```ts
import { BuildPipeline, DeployPipeline, RollbackManager } from '@/devops'

const build = new BuildPipeline()
build.addStep('lint', 'eslint')
build.addStep('test', 'vitest')
await build.run(async (cmd) => ({ success: true, output: `ran ${cmd}` }))

const deploy = new DeployPipeline()
deploy.addStage('staging', 'staging').addStage('prod', 'prod')
await deploy.deploy(async (stage) => ({ success: true }))

const rollback = new RollbackManager()
rollback.deploy('v1.0.0', 'prod')
rollback.deploy('v1.0.1', 'prod')
rollback.rollback()  // back to v1.0.0
```

### 2. Health + Canary

```ts
import { HealthCheck, CanaryDeploy } from '@/devops'

const h = new HealthCheck()
h.register('api', async () => ({ service: 'api', status: 'healthy', checkedAt: Date.now() }))
const results = await h.runAll()

const c = new CanaryDeploy()
await c.promote(async () => 0.005)  // 1% → 10% → 50% → 100%
c.currentPercent()  // 1
```

### 3. Observability (Error/Log/Metric/Alert/Incident)

```ts
import { ErrorTracker, LogAggregator, MetricCollector, AlertManager, IncidentManager } from '@/devops'

const et = new ErrorTracker()
et.capture(new Error('oops'))
et.topN(5)  // most frequent errors

const logs = new LogAggregator()
logs.add('error', 'failed', 'api')

const metrics = new MetricCollector()
metrics.increment('requests', 5)
metrics.gauge('cpu', 0.5)

const alerts = new AlertManager()
alerts.fire('high-cpu', 'critical', 'cpu > 90%')

const incidents = new IncidentManager()
incidents.create('login broken', 'sev1')
```

### 4. Config Management

```ts
import { EnvManager, SecretsManager, ConfigCenter, FeatureFlags } from '@/devops'

const env = new EnvManager()
env.set('NODE_ENV', 'production')
env.require('NODE_ENV')
env.validate()

const secrets = new SecretsManager()
secrets.set('api-key', 'secret-1', 'admin')
secrets.rotate('api-key', 'secret-2', 'admin')

const config = new ConfigCenter()
config.set('flag', true)  // version 1
config.set('flag', false)  // version 2
config.watch('flag', (v) => console.log('changed:', v))

const flags = new FeatureFlags()
flags.define('new-ui', true, 100)
flags.define('beta', true, 50)  // 50% rollout
flags.isEnabled('new-ui', 'user-1')
```

### 5. Deployment + Traffic + Version

```ts
import { DeploymentStrategy, TrafficSplitter, VersionManager, ReleaseNotes, ChangelogGenerator } from '@/devops'

const ds = new DeploymentStrategy('blue-green')
ds.blueGreenSwitch()  // 'green'

const ts = new TrafficSplitter()
ts.setWeight('v1', 80)
ts.setWeight('v2', 20)
ts.route('user-1')

const version = new VersionManager()
version.bump('minor')  // 0.2.0

const notes = new ReleaseNotes()
notes.add({ version: '1.1.0', date: Date.now(), type: 'minor', features: ['x'], fixes: [], breaking: [] })

const cl = new ChangelogGenerator()
cl.add('added', 'New API')
cl.generate('1.0.0')  // Keep-a-Changelog Markdown
```

### 6. Testing + Monitoring

```ts
import { SmokeTest, E2ETestRunner, LoadTest, SyntheticMonitor, OnCallScheduler } from '@/devops'

const smoke = new SmokeTest(5000)
smoke.add('health', async () => {})
const results = await smoke.runAll()

const e2e = new E2ETestRunner()
e2e.add({ stepId: 'login', description: 'login', fn: async () => {} })
e2e.add({ stepId: 'browse', description: 'browse', fn: async () => {}, dependencies: ['login'] })

const load = new LoadTest()
const lr = await load.run(10, 1000, async () => { /* request */ })
lr.p95Ms  // 95th percentile

const synth = new SyntheticMonitor()
synth.register({ name: 'api', intervalMs: 60_000, fn: async () => true })
synth.start()

const onCall = new OnCallScheduler()
onCall.add({ userId: 'alice', start: now, end: now + 7*86400000, level: 'primary' })
```

## 验证命令

```bash
npx vitest run src/devops/  # 76 passed
npx vitest run src/devops/demo/devops-demo.test.ts
npx vitest run src/devops/__tests__/devops-integration.test.ts
```

## 灵感

- GitHub Actions / GitLab CI
- Kubernetes deployment strategies (blue/green, canary, rolling)
- Sentry (error tracking)
- Datadog (logs/metrics)
- PagerDuty (incident management)
- LaunchDarkly (feature flags)
- Prometheus + Grafana
- K6 / Locust (load testing)

## 累计

- Direction A-U: **815 engines / ~7,748 tests**
- 22 commits pushed
- 灵感: GitHub Actions + K8s + Sentry + Datadog + LaunchDarkly + Prometheus + K6