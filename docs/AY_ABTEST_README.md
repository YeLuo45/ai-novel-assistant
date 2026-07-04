# Direction AY — Title A/B Testing Simulator

**V3826-V3855 · 30 engines · 52 tests · 100% pass · ≥98% coverage**

标题 A/B 测试模拟 + 统计显著性 + 流量分配 + 集成。

## 灵感来源

基于 AI Chapter Title Optimizer + 起点运营 / A/B Testing 行业标准

## 30 engines 分组

### AB Test Core (9)
- **ABTest** — A/B 测试（recordImpression + recordClick + ctr + winner）
- **VariantGenerator** — 变体生成（generate N + isUnique）
- **SampleSizeCalculator** — 样本量（calculate 16×(1-p)/mde² + isAdequate 100+）
- **StatisticalSignificance** — 统计显著性（test + isSignificant 0.05+）
- **ABTestDesigner** — 设计（design + isValid A≠B）
- **VariantSplitter** — 变体分割（split + isBalanced 10-）
- **TrafficAllocator** — 流量分配（allocate + isAllocated）
- **ABTestAnalyzer** — 分析（analyze + bestVariant）
- **ABTestStopper** — 停止器（shouldStop significant+100+）

### AB Test Advanced (9)
- **TitleCTRDistribution** — CTR 分布（distribution high/medium/low + hasHighCTR）
- **TitleTagExperiment** — 标签实验（record + isValid）
- **TitleRegressionDetector** — 衰退检测（detect + isRegression 0.7×）
- **TitleBenchmarking** — 行业基准（benchmark + isAboveAverage 0.1+）
- **TitleSeasonalEffect** — 季节效应（detect 1.5× holiday + hasSeasonalBoost）
- **TitleMultivariateTest** — 多变量测试（add + best）
- **TitleABResultArchive** — 结果存档（add + count）
- **TitleCooldown** — 冷却（set + isInCooldown）
- **TitleROICalculator** — ROI 计算（calculate + isProfitable 100+）
- **TitleExperimentDesigner** — 实验设计（design + isValid 2+ variants）

### AB Test Integration (9)
- **TitleExperimentRunner** — 实验运行（setVariant + getVariant + rotate A→B）
- **TitlePerformanceTracker** — 表现追踪（record + averageCTR）
- **TitleABDashboard** — 仪表盘（generate + hasDashboard CTR）
- **TitleWinnerPromoter** — 赢家推广（promote + isPromoted）
- **TitleTestScheduler** — 测试调度（schedule + isValidSchedule）
- **TitleABInsightGenerator** — 洞察生成（generate + isInsight 推荐）
- **TitleABBudgetCalculator** — 预算计算（calculate + isWithinBudget）
- **TitleABDirector** — 决策（start/continue/finalize）
- **TitleABMemoryBank** — 记忆库（storeWinner + getWinner + size）

### 收口
- **ABTestCoreIndex** / **TitleAdvancedIndex** / **TitleABMasterIndex** (28 engines)

## 使用方式

```ts
import { ABTest, VariantGenerator } from './src/ai/abtest/ABTestCore';
import { TitleABDashboard, TitleABDirector } from './src/ai/abtest/ABTestIntegration';

const ab = new ABTest();
ab.recordImpression('A');
ab.recordClick('A');
console.log(ab.ctr('A')); // 1.0

const director = new TitleABDirector();
console.log(director.decide({ running: true, result: 'A wins' })); // 'finalize'
```

## 测试命令

```bash
npx vitest run src/ai/abtest/ --coverage --coverage.include='src/ai/abtest/**'
```