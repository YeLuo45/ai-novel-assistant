# Direction AP — Reader Behavior Predictor

**V3556-V3585 · 30 engines · 56 tests · 100% pass · ≥98% coverage**

读者行为预测 + 留存分析 + 读者分层 + 章节优化建议。

## 灵感来源

网文运营 / 用户行为数据 / 起点番茄模型 / 完读率预测

## 30 engines 分组

### Behavior Prediction (9)
- **CompletionRatePredictor** — 完成率预测（predict + isLikelyToComplete 0.5+）
- **AbandonmentPredictor** — 弃文预测（predict + isHighRisk 0.3+）
- **ReReadPredictor** — 重读预测（悬念/震惊 + isReReadable 0.3+）
- **ChapterSkipPredictor** — 跳章预测（length + climax + isSkippable 0.4+）
- **ReadingSpeedEstimator** — 阅读速度（3 readerType + minutes）
- **AttentionCurvePredictor** — 注意力曲线（peak + dropoff + isAttentionLikely）
- **EngagementPredictor** — 参与度预测（?/!/战斗/悬念 + isHigh 0.7+）
- **BingeReadingPredictor** — 暴读预测（recent avg + isBingeReader 0.7+）
- **DropOffChapterPredictor** — 弃读章节预测（length/!/? + topRiskChapters）

### Reader Analytics (9)
- **ReaderRetentionCurve** — 留存曲线（compute per chapter + drop）
- **ReaderCohortAnalyzer** — 同类群分析（heavy/casual/abandoned）
- **ReaderSegmentPredictor** — 用户分层（loyal/engaged/casual）
- **ChapterHeatmap** — 章节热力图（record + hottest top N）
- **CommentSentimentAnalyzer** — 评论情绪（positive/neutral/negative）
- **BookmarkPredictor** — 书签预测（悬念+高潮+关键 + isBookmarked 0.5+）
- **SharePredictor** — 分享预测（?/震惊/金句 + isShareable 0.5+）
- **TipPredictor** — 打赏预测（climax+打脸+感谢 + willTip 0.5+）
- **ReaderJourneyMap** — 读者旅程（5 stages: discovery→loyalty）

### Behavior Integration (9)
- **BehaviorDashboard** — 行为仪表盘（summarize 总览）
- **ReaderEngagementScore** — 参与度评分（0-1, completed*0.6 + time*0.4）
- **ChapterOptimizationPredictor** — 章节优化预测（dropOffRisk + suggestion）
- **ReaderLifetimeValue** — LTV（reads*0.1 + tips*5 × months）
- **ViralPredictor** — 病毒预测（震惊+神作+金句 + isViral 0.7+）
- **SubscriberPredictor** — 订阅预测（3 completed recent = 0.8）
- **RecommendationScore** — 推荐评分（match / total）
- **BehaviorPatternDetector** — 模式检测（binge/engaged/casual）
- **ReaderChurnPredictor** — 流失预测（1 - completed/recent）

### 收口
- **BehaviorPredictionIndex** / **ReaderAnalyticsIndex** / **BehaviorMasterIndex** (28 engines)

## 使用方式

```ts
import { CompletionRatePredictor, DropOffChapterPredictor } from './src/ai/reader_behavior/BehaviorPrediction';
import { ReaderRetentionCurve, TipPredictor } from './src/ai/reader_behavior/ReaderAnalytics';
import { ReaderChurnPredictor, ViralPredictor } from './src/ai/reader_behavior/BehaviorIntegration';

const dropPredictor = new DropOffChapterPredictor();
const chapters: Chapter[] = [{ content: 'a'.repeat(5000) }];
const risks = dropPredictor.topRiskChapters(chapters, 3);
console.log(risks); // [{chapter: 0, risk: 0.5}]

const tipPredictor = new TipPredictor();
console.log(tipPredictor.predict('高潮', true)); // ≥ 0.5
```

## 测试命令

```bash
npx vitest run src/ai/reader_behavior/ --coverage --coverage.include='src/ai/reader_behavior/**'
```