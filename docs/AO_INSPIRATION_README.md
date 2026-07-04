# Direction AO — Inspiration Network

**V3526-V3555 · 30 engines · 47 tests · 100% pass · 99.33% coverage**

灵感捕捉 + 跨作者影响分析 + 风格谱系 + 灵感网络可视化。

## 灵感来源

Steven Johnson《Where Good Ideas Come From》/ 创造力研究 / 写作灵感库

## 30 engines 分组

### Inspiration Capture (9)
- **InspirationCapture** — 灵感捕捉（capture + get + getAll）
- **SourceTagger** — 来源标签（tag + getTags + isTagged）
- **InspirationCategorizer** — 分类（8 category + categorize）
- **MoodTracker** — 情绪追踪（log + averageMood）
- **TriggerLogger** — 触发器日志（log + getTriggersByType）
- **InspirationRanker** — 排序（rank by length + topN）
- **IdeaConnector** — 想法连接（connect + findRelated）
- **SparkFile** — 火花文件（add + getRandom + getAll）
- **VoiceMemoCapture** — 语音备忘（record + getRecent）

### Inspiration Network (9)
- **InfluenceMap** — 影响图（addInfluence + getInfluencesOf + topInfluencers）
- **CrossAuthorAnalyzer** — 跨作者分析（similarity + isSimilar 0.3+）
- **StyleGenealogy** — 风格谱系（addRelation + ancestorsOf）
- **InspirationWeb** — 灵感网络（connect + shortestPath BFS）
- **BorrowingTracker** — 借鉴追踪（record + countBySource + isOverused 5+）
- **OriginalityMeter** — 原创度计（measure + isOriginal 0.7+）
- **ThemeClusterer** — 主题聚类（addTheme + cluster majority）
- **MotifTracker** — 母题追踪（track + topMotifs）
- **IdeaEvolutionMapper** — 想法进化（record + getEvolution）

### Inspiration Integration (9)
- **InspirationAI** — AI 灵感助手（4 prompt + suggest）
- **CrossInspirationLinker** — 跨灵感连接（link shared tag）
- **InspirationNetworkVisualizer** — 网络可视化（render -- graph）
- **InspirationQualityScorer** — 质量评分（content + detail + originality + total）
- **InspirationReuser** — 灵感复用（reuse + getReuses）
- **InspirationCollaborator** — 协作器（addMember + count + canCollaborate 2+）
- **InspirationEvolutionTracker** — 进化追踪（track + getCurrentState）
- **InspirationPredictor** — 灵感预测（avg × futureDays）
- **InspirationLibraryBuilder** — 库构建（addToLibrary + getByCategory + totalCount）

### 收口
- **InspirationCaptureIndex** / **InspirationNetworkIndex** / **InspirationMasterIndex** (28 engines)

## 使用方式

```ts
import { InspirationCapture, SourceTagger, InspirationCategorizer } from './src/ai/inspiration/InspirationCapture';
import { InfluenceMap, OriginalityMeter, IdeaConnector } from './src/ai/inspiration/InspirationNetwork';
import { InspirationQualityScorer, InspirationLibraryBuilder } from './src/ai/inspiration/InspirationIntegration';

const capture = new InspirationCapture();
const idea = capture.capture('战斗灵感', '小说《三国》', 'plot');

const scorer = new InspirationQualityScorer();
console.log(scorer.score(idea).total); // 0.7+

const originality = new OriginalityMeter();
console.log(originality.measure('独特文本', ['常见'])); // 1.0
```

## 测试命令

```bash
npx vitest run src/ai/inspiration/ --coverage --coverage.include='src/ai/inspiration/**'
```