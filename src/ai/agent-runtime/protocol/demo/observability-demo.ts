/**
 * protocol/demo/observability-demo.ts (V2531)
 */

import {
  MetricsRegistry, ExperimentRunner, zTestProportions, validateExperiment,
  HealthCheckRunner, AlertManager, RecoveryPlan,
  type Experiment, type Variant,
} from '../index'

const CONTROL: Variant = { variantId: 'control', name: 'Control', weight: 50, payload: {} }
const VARIANT: Variant = { variantId: 'a', name: 'A', weight: 50, payload: {} }

export async function runObservabilityDemo(): Promise<{
  metricsKeys: number
  experimentResults: number
  feedbackCount: number
  health: 'healthy' | 'degraded' | 'unhealthy'
  alertTriggered: boolean
  recoverySuccess: boolean
}> {
  // 1. Metrics
  const metrics = new MetricsRegistry()
  metrics.counter('requests').inc(100)
  metrics.counter('errors').inc(5)
  metrics.histogram('latency').observe(50)
  metrics.histogram('latency').observe(100)

  // 2. A/B test
  const exp: Experiment = {
    experimentId: 'e1', name: 'X', description: 'd',
    variants: [CONTROL, VARIANT], startTime: 0, status: 'running', significanceLevel: 0.05, minSampleSize: 50,
  }
  validateExperiment(exp)
  const runner = new ExperimentRunner(exp)
  for (let i = 0; i < 200; i++) {
    const u = `u${i}`
    runner.assign(u)
    runner.recordExposure(u)
    if (i % 2 === 0) runner.recordConversion(u)
  }
  const results = runner.results()
  zTestProportions(100, 50, 100, 50)

  // 3. Health
  const health = new HealthCheckRunner()
  health.register({ name: 'db', check: () => ({ name: 'db', status: 'healthy' as const, durationMs: 5, checkedAt: 0 }) })
  const healthResults = await health.runAll()

  // 4. Alert
  const alerts = new AlertManager()
  alerts.addRule({ ruleId: 'r1', name: 'high-error', condition: (m: unknown) => ((m as { errors: number }).errors) > 100, severity: 'critical', cooldownMs: 0, message: 'too many errors' })
  const triggered = alerts.evaluate({ errors: 5 })

  // 5. Recovery
  const recovery = new RecoveryPlan()
  recovery.addStep({ order: 1, action: 'notify', description: 'a', timeoutMs: 100, execute: () => true })
  const recoveryResult = await recovery.execute()

  return {
    metricsKeys: Object.keys(metrics.snapshot().counters).length + Object.keys(metrics.snapshot().histograms).length,
    experimentResults: results.length,
    feedbackCount: 0, // 不再需要 feedback
    health: health.overall(healthResults),
    alertTriggered: triggered.length > 0,
    recoverySuccess: recoveryResult.success,
  }
}
