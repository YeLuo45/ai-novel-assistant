/**
 * devops/demo/devops-demo.ts (U26)
 */

import {
  BuildPipeline, DeployPipeline, RollbackManager, HealthCheck, CanaryDeploy,
  ErrorTracker, LogAggregator, MetricCollector, AlertManager, IncidentManager,
  EnvManager, SecretsManager, ConfigCenter, FeatureFlags, CICDConfig,
  DeploymentStrategy, TrafficSplitter, VersionManager, ReleaseNotes, ChangelogGenerator,
  SmokeTest, E2ETestRunner, LoadTest, SyntheticMonitor, OnCallScheduler,
} from '../index'

export interface DemoResult {
  buildSuccess: boolean
  deploySuccess: boolean
  rollbackPossible: boolean
  healthAggregate: string
  canaryPercent: number
  errorTracked: number
  logEntries: number
  metricsCount: number
  alertsActive: number
  incidentsOpen: number
  envValid: boolean
  secretsAudited: number
  configVersion: number
  featureFlags: number
  cicdConfigs: number
  deploymentEnv: string
  trafficRoutes: number
  versionBumped: string
  releaseNotesLatest: boolean
  changelogSections: number
  smokePassed: number
  e2eSteps: number
  loadRequests: number
  synthChecks: number
  onCallPrimary: string | null
}

export async function runDevOpsDemo(): Promise<DemoResult> {
  // 1. Build
  const build = new BuildPipeline()
  build.addStep('lint', 'eslint')
  build.addStep('test', 'vitest')
  await build.run(async () => ({ success: true, output: 'ok' }))

  // 2. Deploy
  const deploy = new DeployPipeline()
  deploy.addStage('staging', 'staging').addStage('prod', 'prod')
  const deployResult = await deploy.deploy(async () => ({ success: true }))

  // 3. Rollback
  const rollback = new RollbackManager()
  rollback.deploy('v1.0.0', 'prod')
  rollback.deploy('v1.0.1', 'prod')

  // 4. Health
  const health = new HealthCheck()
  health.register('api', async () => ({ service: 'api', status: 'healthy', checkedAt: Date.now() }))
  const healthResults = await health.runAll()

  // 5. Canary
  const canary = new CanaryDeploy()
  await canary.promote(async () => 0.005)

  // 6. Error tracker
  const errors = new ErrorTracker()
  errors.capture(new Error('x'))
  errors.capture(new Error('x'))

  // 7. Logs
  const logs = new LogAggregator()
  logs.add('info', 'started')
  logs.add('error', 'failed', 'api')

  // 8. Metrics
  const metrics = new MetricCollector()
  metrics.increment('requests', 5)
  metrics.gauge('cpu', 0.5)

  // 9. Alerts
  const alerts = new AlertManager()
  const alert = alerts.fire('high-cpu', 'critical', 'cpu > 90%')

  // 10. Incidents
  const incidents = new IncidentManager()
  const inc = incidents.create('login broken', 'sev1')

  // 11. Env
  const env = new EnvManager()
  env.set('NODE_ENV', 'production')
  env.require('NODE_ENV')

  // 12. Secrets
  const secrets = new SecretsManager()
  secrets.set('api-key', 'secret', 'admin')
  secrets.get('api-key', 'app')

  // 13. Config
  const config = new ConfigCenter()
  config.set('feature', true)
  config.set('feature', false)

  // 14. Feature flags
  const flags = new FeatureFlags()
  flags.define('new-ui', true, 100)
  flags.define('beta', true, 50)

  // 15. CI/CD
  const cicd = new CICDConfig()
  cicd.add({ name: 'main', trigger: 'push', branches: ['main'], stages: [{ name: 'test', jobs: ['vitest'] }], environment: 'prod', autoDeploy: true })

  // 16. Deployment strategy
  const ds = new DeploymentStrategy('blue-green')

  // 17. Traffic splitter
  const ts = new TrafficSplitter()
  ts.setWeight('v1', 80)
  ts.setWeight('v2', 20)

  // 18. Version
  const version = new VersionManager()
  version.bump('minor')

  // 19. Release notes
  const notes = new ReleaseNotes()
  notes.add({ version: '1.1.0', date: Date.now(), type: 'minor', features: ['new feature'], fixes: [], breaking: [] })

  // 20. Changelog
  const changelog = new ChangelogGenerator()
  changelog.add('added', 'New API')
  const changelogMd = changelog.generate('1.0.0')

  // 21. Smoke
  const smoke = new SmokeTest()
  smoke.add('health', async () => {})
  smoke.add('basic', async () => {})
  const smokeResults = await smoke.runAll()

  // 22. E2E
  const e2e = new E2ETestRunner()
  e2e.add({ stepId: 'login', description: 'login', fn: async () => {} })
  e2e.add({ stepId: 'browse', description: 'browse', fn: async () => {} })
  const e2eResults = await e2e.run()

  // 23. Load test
  const load = new LoadTest()
  const loadResult = await load.run(5, 10, async () => { await new Promise(r => setTimeout(r, 1)) })

  // 24. Synthetic monitor
  const synth = new SyntheticMonitor()
  synth.register({ name: 'api', intervalMs: 1000, fn: async () => true })
  await synth.runOnce('api')

  // 25. On-call
  const onCall = new OnCallScheduler()
  const now = Date.now()
  onCall.add({ userId: 'alice', start: now - 1000, end: now + 1000, level: 'primary' })

  return {
    buildSuccess: build.status() === 'success',
    deploySuccess: deployResult.success,
    rollbackPossible: rollback.previous('prod') !== null,
    healthAggregate: health.aggregate(healthResults),
    canaryPercent: canary.currentPercent(),
    errorTracked: errors.all().length,
    logEntries: logs.count(),
    metricsCount: metrics.metrics().length,
    alertsActive: alerts.active().length,
    incidentsOpen: incidents.open().length,
    envValid: env.validate().valid,
    secretsAudited: secrets.auditLog().length,
    configVersion: config.version('feature'),
    featureFlags: flags.list().length,
    cicdConfigs: cicd.list().length,
    deploymentEnv: ds.activeEnv(),
    trafficRoutes: ts.weights().size,
    versionBumped: version.toString(),
    releaseNotesLatest: notes.latest()?.version === '1.1.0',
    changelogSections: (changelogMd.match(/###/g) ?? []).length,
    smokePassed: smoke.passed(smokeResults),
    e2eSteps: e2eResults.length,
    loadRequests: loadResult.totalRequests,
    synthChecks: synth.results('api').length,
    onCallPrimary: onCall.currentOnCall(now).primary?.userId ?? null,
  }
}