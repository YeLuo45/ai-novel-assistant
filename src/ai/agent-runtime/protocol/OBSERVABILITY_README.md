# Observability (V3) — Direction G

**Version**: 1.0.0
**Engines**: V2506-V2535 (30 engines, 6 batches)
**Tests**: 75+ tests, 100% pass

## 目标

Soul 从 static 配置变成有"学习曲线"。基于 metrics + feedback + A/B testing + exploration/exploitation 持续进化，并通过 health check + alert + recovery 保证系统稳定。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| V2506-V2510 | `Observability.ts` | Counter + Gauge + Histogram + Timer + MetricsRegistry |
| V2511-V2515 | `Observability.ts` | SoulEvolutionEngine + EvolutionRule + EvolutionLog + UserFeedbackStore + FeedbackAggregator |
| V2516-V2520 | `ABTesting.ts` | Experiment + Variant + BucketAssigner (FNV hash) + ExperimentRunner + zTestProportions |
| V2521-V2525 | `AdaptationAndHealth.ts` | LearningRate + AdaptationPolicy + ExplorationExploitation + Curriculum + TransferLearning |
| V2526-V2530 | `AdaptationAndHealth.ts` | HealthCheck + AlertManager + AlertRule + IncidentLog + RecoveryPlan |
| V2531 | `demo/observability-demo.ts` | 6 个端到端断言 |
| V2532 | `__tests__/observability-integration.test.ts` | 8 个 e2e |
| V2533 | `OBSERVABILITY_README.md` | 本文档 |
| V2534 | 主 README.md 更新 | 验证命令 |
| V2535 | 收口 commit | |

## 核心 API 示例

### 1. Metrics

```ts
import { MetricsRegistry } from '@/ai/agent-runtime/protocol'

const reg = new MetricsRegistry()
reg.counter('requests').inc()  // 计数器
reg.gauge('queue-size').set(42)  // 仪表
reg.histogram('latency-ms').observe(120)  // 直方图
reg.timer('operation').start('op'); reg.timer('operation').stop('op')  // 计时

const snap = reg.snapshot()  // { counters, gauges, histograms }
```

### 2. Soul Evolution

```ts
import { SoulEvolutionEngine, DEFAULT_EVOLUTION_RULES } from '@/ai/agent-runtime/protocol'

const engine = new SoulEvolutionEngine()
const result = engine.evolve(soul, metrics, DEFAULT_EVOLUTION_RULES)
// result?.appliedRule.ruleId, result?.soulAfter
```

### 3. A/B Testing

```ts
import { ExperimentRunner, zTestProportions, type Experiment } from '@/ai/agent-runtime/protocol'

const exp: Experiment = { /* ... */ }
const runner = new ExperimentRunner(exp)
runner.assign('user-1')
runner.recordExposure('user-1')
runner.recordConversion('user-1')
const results = runner.results()
const z = zTestProportions(controlExp, controlConv, variantExp, variantConv)
if (z.isSignificant) { /* 接受变体 */ }
```

### 4. User Feedback

```ts
import { UserFeedbackStore, FeedbackAggregator } from '@/ai/agent-runtime/protocol'

const fb = new UserFeedbackStore()
fb.record({ userId: 'u1', target: 'soul', targetId: 's1', type: 'positive', score: 0.9 })

const agg = new FeedbackAggregator()
agg.averageScore(fb, 'soul', 's1')  // 0.9
agg.mostCriticized(fb)  // { targetId: 'soul:s1', avgScore: 0.9 }
```

### 5. Alert + Recovery

```ts
import { AlertManager, IncidentLog, RecoveryPlan } from '@/ai/agent-runtime/protocol'

const alerts = new AlertManager()
alerts.addRule({ ruleId: 'r1', condition: (m) => m.errors > 100, severity: 'critical', cooldownMs: 60000, message: 'too many errors' })
alerts.evaluate({ errors: 200 })  // 触发

const incidents = new IncidentLog()
const inc = incidents.record({ severity: 'critical', message: 'high error rate' })

const recovery = new RecoveryPlan()
recovery.addStep({ order: 1, action: 'notify', description: 'a', timeoutMs: 100, execute: () => true })
await recovery.execute()  // { success: true, results: [...] }
```

### 6. Exploration-Exploitation

```ts
import { ExplorationExploitation } from '@/ai/agent-runtime/protocol'

const ee = new ExplorationExploitation('epsilon-greedy', { epsilon: 0.1 })
ee.update('arm-a', 1.0)
ee.update('arm-b', 0.5)
const choice = ee.selectArm(['arm-a', 'arm-b'])  // 倾向 a（exploit 90% / explore 10%）
```

## 验证命令

```bash
# 跑全部 protocol 测试（应 563+ passed）
npx vitest run src/ai/agent-runtime/protocol/

# 跑 observability demo
npx vitest run src/ai/agent-runtime/protocol/demo/observability-demo.test.ts

# 跑 observability 端到端
npx vitest run src/ai/agent-runtime/protocol/__tests__/observability-integration.test.ts
```

## 灵感来源

- Prometheus — Counter/Gauge/Histogram/Timer
- GrowthBook / LaunchDarkly — A/B Testing + 桶分配
- OpenTelemetry — 分布式追踪
- AutoML / RL — Learning Rate + Evolution
- PagerDuty / OpsGenie — Alert + Incident + Recovery

## 🎉 Direction G 完成 = 7 个方向全部完成 (210/210 engines, 1024+ tests)

总累计：
- **A**: 30 engines (三件套 + Runtime)
- **B**: 30 engines (协议)
- **C**: 30 engines (Memory 隔离)
- **D**: 30 engines (User 投影)
- **E**: 30 engines (Soul 市场)
- **F**: 30 engines (UI Studio)
- **G**: 30 engines (可观测性 + 自我进化)
