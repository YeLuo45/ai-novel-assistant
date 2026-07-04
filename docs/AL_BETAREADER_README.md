# Direction AL — Beta Reader Persona

**V3436-V3465 · 30 engines · 59 tests · 100% pass · ≥98% coverage**

8 种读者画像 + 多读者模拟 + 反馈聚合 + 共识检测 + 章节就绪度。

## 灵感来源

模拟 3 类读者反馈 / 出版前自检 / 编辑工作流 / Amazon 早期读者

## 30 engines 分组

### 读者画像 (9)
- **BetaReaderPersonaBuilder** — 读者画像（8 type + build + buildAll）
- **WebNovelReader** — 网文读者（rate + issues + isSatisfied 4+）
- **LiteraryReader** — 文学读者（depth + tell 检测）
- **GenreSpecificReader** — 类型读者（5 genre keyword 库 + 2-5 sweet spot）
- **YoungAdultReader** — 年轻读者（exciting + 避免 dark）
- **MiddleAgedReader** — 中年读者（depth + 避免 trope）
- **CasualReader** — 休闲读者（短 + 易读 + 避免 literary）
- **AvidReader** — 书虫（unique + length + 避免 cliche）
- **CriticalReader** — 严苛读者（5 issue categories）

### 模拟 (9)
- **MultiReaderFeedback** — 多读者反馈（add + getAll + averageRating）
- **FeedbackAggregator** — 反馈聚合（commonIssues 50%+ + avgRating）
- **CriticalIssuesExtractor** — 关键问题提取（severity + topN）
- **PositiveFeedbackExtractor** — 正面反馈（frequency sort）
- **ConsensusDetector** — 共识检测（70%+ threshold）
- **OutlierFeedbackDetector** — 异常检测（stdev 1.5x 阈值）
- **ReaderPanel** — 读者小组（size + types + isDiverse 3+）
- **FeedbackReportGenerator** — 反馈报告（markdown 格式）
- **ImprovementSuggestions** — 改进建议（10 issue → 建议 + forTopIssues）

### 集成 (9)
- **FullChapterSimulation** — 全文模拟（per-reader rating + issues + positives）
- **ReaderFeedbackLoop** — 反馈循环（addIteration + hasImproved）
- **RevisionTracker** — 修改追踪（record + revisionsForChapter + totalRevisions）
- **ReaderPrioritiesRanker** — 优先级排序（rank by severity + topPriority）
- **ImprovementGoalSetter** — 目标设置（set + isOverdue）
- **ChapterReadinessChecker** — 章节就绪度（check 3 criteria + ready 3.5+）
- **ReaderExpectationMatcher** — 期望匹配（match ratio + isMatched 0.5+）
- **BookReadinessScorer** — 书籍就绪度（score + isReady 3.5+）
- **FinalApprovalSimulator** — 终审模拟（approve based on avg rating）

### 收口 (3)
- **BetaReaderProfilesIndex** — 9 engines 收口
- **BetaReaderSimulationIndex** — 9 engines 收口
- **BetaReaderIndexFinal** — 28 engines 收口

## 使用方式

```ts
import { BetaReaderPersonaBuilder, WebNovelReader, LiteraryReader } from './src/ai/betareader/BetaReaderProfiles';
import { MultiReaderFeedback, FeedbackAggregator, ConsensusDetector } from './src/ai/betareader/BetaReaderSimulation';
import { FullChapterSimulation, FinalApprovalSimulator } from './src/ai/betareader/BetaReaderIntegration';

const builder = new BetaReaderPersonaBuilder();
const readers = builder.buildAll(); // 3 persona
const chapters = [{ content: '战斗爽点...' }];

const sim = new FullChapterSimulation();
const fb = sim.simulate(chapters[0], readers);

const aggregator = new FeedbackAggregator();
const result = aggregator.aggregate(fb);
console.log('common issues:', result.commonIssues);
console.log('avg rating:', result.avgRating);

const consensus = new ConsensusDetector();
const c = consensus.detect(fb);
console.log('consensus issues:', c.consensusIssues);

const approval = new FinalApprovalSimulator();
console.log(approval.approve(fb));
// { approved: true/false, reason, avgRating }
```

## 测试命令

```bash
npx vitest run src/ai/betareader/ --coverage --coverage.include='src/ai/betareader/**'
```

## 文件位置

- `src/ai/betareader/BetaReaderProfiles.ts` — 读者画像
- `src/ai/betareader/BetaReaderSimulation.ts` — 模拟
- `src/ai/betareader/BetaReaderIntegration.ts` — 集成 + 收口
