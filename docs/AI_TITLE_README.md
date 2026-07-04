# Direction AI — Chapter Title Optimizer

**V3346-V3375 · 30 engines · 70 tests · 100% pass · 98.88% coverage**

章节标题生成 + SEO + A/B 测试 + 标题党评分 + 跨章节一致。

## 灵感来源

起点签约标准 / 网文黄金三章 / A/B 测试 / 微博/小红书标题党方法论

## 30 engines 分组

### 标题生成 (9)
- **TitleGenerator** — 标题生成器（5 template + generateWithTemplate + generateVariants）
- **TitleClickbaitScorer** — 标题党评分（10 关键词 + 3 分类）
- **TitleSEOOptimizer** — SEO 优化（12 trending + suggestKeywords 2+ + seoScore 0-1）
- **TitleLengthValidator** — 标题长度（4-30 valid + 8-16 ideal + recommend）
- **TitleEmotionDetector** — 标题情绪（4 emotion: excitement/mystery/romance/tension）
- **TitleGenreMatcher** — 类型匹配（5 genre: xuanhuan/urban/romance/mystery/scifi）
- **TitleABTester** — A/B 测试（recordImpression/Click + ctr + winner）
- **TitlePatternLearner** — 模式学习（learn + getPatterns + mostCommon）
- **TitleRanker** — 标题排序（rank + topN + isCompetitive 0.5+）

### 优化 (9)
- **ChapterTitleScorer** — 章节标题评分（length/emotion/action + total + isHighQuality 0.7+）
- **TitleSeriesConsistency** — 系列一致性（register + isConsistent + variance）
- **TitleNicheMatcher** — niche 匹配（4 niche: golden_three/sweet_romance/dark_mystery/power_fantasy）
- **TitleHistoryTracker** — 历史追踪（record + getHistory + getCurrent）
- **TitleImprover** — 改进器（improve + suggest 4 variants）
- **TitleBatchOptimizer** — 批量优化（optimize + averageImprovement）
- **TitleEffectivenessPredictor** — 效果预测（ctr/retention/virality + isHighCTR）
- **TitleVariationGenerator** — 变体生成（5 prefix/suffix）
- **TitleCompetitorComparison** — 竞品对比（compare + rank）

### 集成 (9)
- **ChapterTitleGenerator** — 章节标题生成（generateForChapter + generateSeries）
- **TitlePerformancePredictor** — 表现预测（impressions + clicks + rating）
- **TitleABTestDesigner** — A/B 测试设计（expectedCTR + sampleSize + recommendWinner）
- **TitleRotationStrategy** — 轮换策略（daily/weekly + schedule N days）
- **TitleSEOPlanner** — SEO 规划（plan + recommendTitleLength）
- **TitleConsistencyChecker** — 全书一致性（check + styleMatches + issues）
- **TitleLearningLoop** — 学习循环（recordFeedback + bestPerformers + averageCTR）
- **TitleMemoryBank** — 标题库（store + get + useCount + mostUsed）
- **TitleAIDirector** — AI 导演（generateWithContext + recordOutcome + hasEnoughHistory）

### 收口 (3)
- **TitleOptimizerIndex** — 9 engines 收口
- **TitleOptimizationIndex** — 9 engines 收口
- **TitleOptimizerFinal** — 28 engines 收口

## 使用方式

```ts
import { TitleGenerator, TitleClickbaitScorer, TitleSEOOptimizer } from './src/ai/title/TitleGeneration';
import { ChapterTitleScorer, TitleABTester } from './src/ai/title/TitleOptimization';
import { TitleAIDirector, TitleMemoryBank } from './src/ai/title/TitleIntegration';

const gen = new TitleGenerator();
const titles = gen.generateVariants('觉醒', 3);
// ['觉醒', '觉醒（续）', '觉醒（下）']

const seo = new TitleSEOOptimizer();
console.log(seo.recommend('普通标题')); 
// ['穿越', '金手指', '重生', '系统', '无敌']

const tester = new TitleABTester();
tester.recordImpression('A');
tester.recordImpression('A');
tester.recordClick('A');
console.log(tester.ctr('A')); // 0.5
```

## 测试命令

```bash
npx vitest run src/ai/title/ --coverage --coverage.include='src/ai/title/**'
```

## 文件位置

- `src/ai/title/TitleGeneration.ts` — 标题生成
- `src/ai/title/TitleOptimization.ts` — 优化
- `src/ai/title/TitleIntegration.ts` — 集成 + 收口
