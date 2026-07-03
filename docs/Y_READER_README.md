# Direction Y — Reader Psychology & Engagement

**V3076-V3105 · 30 engines · 78 tests · 100% pass · 98.48% coverage**

读者心理与留存分析 — 从"作者觉得好"转向"读者真的会被留住"。

## 灵感来源

起点留存模型 / 网文"黄金三章"理论 / Webfiction Guide / 起点中文网签约标准 / 番茄小说留存模型 / 知乎"为什么弃文"分析 / Save the Cat 心理学基础

## 30 engines 分组

### 钩子体系 (6)
- **ChapterOpenerHook** — 章节开头钩子
- **ChapterCliffhangerScorer** — 章节悬念评分
- **PageTurnStrength** — 翻页强度
- **HookDensityPerKChar** — 钩子密度
- **InformationGapTracker** — 信息缺口追踪
- **ReaderQuestionTracker** — 读者问题追踪

### 情绪曲线 (4)
- **SentimentArcAnalyzer** — 情绪弧线
- **EmotionalBeatDetector** — 6 情绪节拍
- **TensionCurveViz** — 张力曲线
- **EmpathyTriggerDetector** — 共情触发

### 风险预测 (3)
- **DropOffRiskPredictor** — 弃文风险
- **BoredomRiskDetector** — 无聊检测
- **ConfusionRiskDetector** — 困惑检测

### 记忆与画像 (4)
- **MemoryLoadEstimator** — 记忆负荷
- **POVConfusionAuditor** — 视角混乱
- **TargetReaderPersona** — 读者画像
- **BetaReaderSimulator** — Beta 读者

### 净化与满足 (3)
- **CatharsisPointLocator** — 净化点
- **WishFulfillmentTracker** — 愿望满足
- **GenreExpectationChecker** — 类型期望

### 网文爽点 (5)
- **HuanDianDensity** — 爽点密度
- **FaceSlapDetector** — 装逼打脸
- **PowerUpMoment** — 金手指
- **CoolPointVisualizer** — 爽点可视化
- **RelatabilityScorer** — 共鸣度

### 留存分析 (5)
- **EngagementCurveSimulator** — 参与度曲线
- **RetentionCurvePredictor** — 留存曲线
- **ChapterVitalityHeatmap** — 章节活跃度
- **CliffNotesGenerator** — 读者记忆
- **TropePositiveNegative** — 套路正负面

## 使用方式

```ts
import { ChapterCliffhangerScorer, InformationGapTracker } from './src/ai/reader/HooksEngagement';
import { DropOffRiskPredictor, TargetReaderPersona } from './src/ai/reader/CatharsisWishFulfillment';
import { HuanDianDensity, RetentionCurvePredictor } from './src/ai/reader/WebNovelEngagement';

const cliff = new ChapterCliffhangerScorer();
const isCliff = cliff.isCliffhanger(chapter.content);

const drops = new DropOffRiskPredictor();
const risk = drops.evaluate(firstChapter, 10, 0);

const huan = new HuanDianDensity();
const density = huan.perKChar(text);
const level = huan.classify(density); // 'low' / 'medium' / 'high'
```

## 测试命令

```bash
npx vitest run src/ai/reader/ --coverage --coverage.include='src/ai/reader/**'
```

## 文件位置

- `src/ai/reader/HooksEngagement.ts` — 钩子 + 情绪
- `src/ai/reader/CatharsisWishFulfillment.ts` — 净化 + 风险 + 画像
- `src/ai/reader/WebNovelEngagement.ts` — 网文爽点 + 留存 + 收口
