# Direction AV — Plot Hole Auto-Fixer

**V3736-V3765 · 30 engines · 54 tests · 100% pass · ≥98% coverage**

漏洞检测自动化 + 修复策略 + 集成。

## 灵感来源

基于 AF Plot Hole Detector + 推理小说自动修补 / 网文 AI 辅助 / DeepL 风格

## 30 engines 分组

### Hole Detection (9)
- **HoleAutoDetector** — 自动漏洞检测（5 type × 10 patterns + count）
- **HoleCategorizer** — 漏洞分类（categorize + dominant）
- **HolePriorityRanker** — 优先级排序（rank + topN by severity）
- **AutoFixSuggester** — 自动修复建议（5 type × 中文建议）
- **FixConfidenceScorer** — 修复置信度（score + isHighConfidence 0.6+）
- **ManualReviewQueue** — 人工审核队列（enqueue 0.6+ + drain + size）
- **FixAttemptTracker** — 修复尝试追踪（record + successRate）
- **DiffVisualizer** — 差异可视化（generate + hasChanges）
- **HoleLinkageDetector** — 漏洞关联检测（然而/但是 + count）

### Fix Strategies (9)
- **MotivationInserter** — 动机插入（insert + hasMotivation）
- **LogicalChainBuilder** — 逻辑链构建（build + isComplete 因为所以）
- **ContinuityRestorer** — 连续性恢复（restore + hasRestoration [参考]）
- **SettingEnforcer** — 设定执行（enforce + isCompliant）
- **UnexplainedResolver** — 未解释解析（resolve + isResolved）
- **BulkFixApplier** — 批量修复（apply + count）
- **FixSafetyChecker** — 修复安全（check + isSafe）
- **RevisionRecorder** — 修订记录（record + count）
- **FixIterationCounter** — 修复迭代（increment + count + isComplete 5+）

### Fix Integration (9)
- **FixPipeline** — 修复流程（5 steps + isComplete + next）
- **FixWorkflow** — 工作流（5 states + transition + isComplete）
- **AutoFixDirector** — 决策（done/fix_critical/fix_normal）
- **FixReportGenerator** — 报告生成
- **FixVerification** — 修复验证（verify + isImproved）
- **FixMemoryBank** — 修复记忆（store + retrieve + size）
- **FixStats** — 修复统计（recordApplied + verificationRate）
- **FixADirector** — AI 总监（finalize/review_more/apply_more）
- **FixTools** — 修复工具（AutoFix/ManualEdit/Hybrid）

### 收口
- **HoleDetectionIndex** / **FixStrategiesIndex** / **FixMasterIndex** (28 engines)

## 使用方式

```ts
import { HoleAutoDetector, AutoFixSuggester } from './src/ai/holefix/HoleDetection';
import { MotivationInserter, FixSafetyChecker } from './src/ai/holefix/FixStrategies';

const detector = new HoleAutoDetector();
const holes = detector.detect('为什么没有');
console.log(holes.length); // > 0

const suggester = new AutoFixSuggester();
const fix = suggester.suggest({ type: 'motivation', location: 'a', description: 'b', severity: 0.5 });
console.log(fix); // '添加角色内心独白解释动机'
```

## 测试命令

```bash
npx vitest run src/ai/holefix/ --coverage --coverage.include='src/ai/holefix/**'
```