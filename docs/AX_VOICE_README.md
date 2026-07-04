# Direction AX — Voice Consistency Enforcer

**V3796-V3825 · 30 engines · 57 tests · 100% pass · ≥98% coverage**

声音一致性执行 + 检测器 + 漂移 + 集成。

## 灵感来源

基于 AH Character Voice Differentiator + 长篇多 POV / 出版业声音标准

## 30 engines 分组

### Voice Consistency (10)
- **VoiceProfileManager** — 声音画像管理（set + get + count）
- **ConsistencyChecker** — 一致性检查（check + isConsistent 0.5- 偏差）
- **VoiceEnforcer** — 声音执行（enforce + isEnforced）
- **VoiceWarningGenerator** — 警告生成（generate + hasWarning 声音偏离）
- **VoiceCorrectionEngine** — 修正引擎（correct ！！→！ + changes）
- **VoiceDriftDetector** — 漂移检测（detect + hasSignificantDrift 0.3+）
- **VoiceBaselineCapture** — 基线捕获（capture + isValid）
- **VoiceTargetEnforcer** — 目标执行（getTarget + hasTarget）
- **VoiceConsistencyReport** — 报告（generate + isPositive 通过）
- **VoiceBatchProcessor** — 批量处理（processBatch + consistent/total）

### Voice Advanced (9)
- **VoicePersistence** — 持久化（record + count）
- **VoiceConsistencyScorer** — 评分（score + isHigh 0.8+）
- **VoiceAnomalyDetector** — 异常检测（detect + isAnomaly 0.5+）
- **VoiceRefiner** — 精炼（refine 他很/她很 → 他/她 + isRefined）
- **VoiceQualityScorer** — 质量评分（score + isQuality 0.7+）
- **VoiceMemoryBank** — 记忆库（add + get + size）
- **VoiceEnforcementLoop** — 执行循环（record + isStable 3+）
- **VoiceWarningLevel** — 警告级别（classify low/medium/high）
- **VoiceBatchEnforcer** — 批量执行（enforceBatch + count）
- **VoiceReviewer** — 评审（review + needsReview）

### Voice Integration (9)
- **VoiceConsistencyPipeline** — 流程（5 steps + isComplete + next）
- **VoiceConsistencyDirector** — 总监（done/enforce_strong/enforce_normal）
- **VoiceConsistencyStats** — 统计（recordCheck + violationRate）
- **VoiceConsistencyReportGenerator** — 报告生成
- **VoiceEnforcementADirector** — AI 总监（finalize/continue/manual_review）
- **VoiceConsistencyLibrary** — 库（save + load + count）
- **VoiceConsistencyValidator** — 验证（validate + isValid）
- **VoiceConsistencyTools** — 工具（AutoEnforce/WarnOnly/Suggest）
- **VoiceConsistencyADirector2** — 决策（low/medium/high）

### 收口
- **VoiceConsistencyIndex** / **VoiceAdvancedIndex** / **VoiceConsistencyMasterIndex** (29 engines)

## 使用方式

```ts
import { VoiceProfileManager, ConsistencyChecker } from './src/ai/voice_consistency/VoiceConsistency';
import { VoiceDriftDetector, VoiceRefiner } from './src/ai/voice_consistency/VoiceAdvanced';

const manager = new VoiceProfileManager();
const profile = { id: 'A', avgLen: 17, vocabRichness: 0.5, formality: 0.5 };
manager.set(profile);

const checker = new ConsistencyChecker();
const r = checker.check('a sentence here。', profile);
console.log(r.consistent); // true

const drift = new VoiceDriftDetector();
console.log(drift.detect('a sentence here。another sentence。', 17)); // 0
```

## 测试命令

```bash
npx vitest run src/ai/voice_consistency/ --coverage --coverage.include='src/ai/voice_consistency/**'
```