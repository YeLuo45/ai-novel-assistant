# Direction AJ — Author Block Breaker

**V3376-V3405 · 30 engines · 69 tests · 100% pass · ≥98% coverage**

写作者心理分析 + 6 种瓶颈突破 + 自由写作 prompt + 写作者画像。

## 灵感来源

写作者心理 / 创作瓶颈突破 / 自由写作方法论 / 写作教练行业经验

## 30 engines 分组

### 瓶颈检测 (9)
- **BlockTypeDetector** — 瓶颈类型检测（6 type: plot/character/dialogue/description/motivation/general）
- **WriterBlockAnalyzer** — 写作瓶颈分析（avgWords + trend + blockSeverity）
- **ProcrastinationDetector** — 拖延检测（3 signal × score + isProcrastinating 0.5+）
- **BurnoutDetector** — 倦怠检测（10 中英文关键词 + isBurnedOut 0.5+）
- **CreativeBlockBreaker** — 创意瓶颈突破（6 type prompts × suggestPrompts N）
- **PlotBlockBreaker** — 情节瓶颈突破（6 techniques + isStuck）
- **CharacterBlockBreaker** — 角色瓶颈突破（suggestActions + suggestMotivations）
- **DialogueBlockBreaker** — 对话瓶颈突破（5 openers + addConflict）
- **DescriptionBlockBreaker** — 描写瓶颈突破（10 senses × suggestBySense）

### 解决方案 (9)
- **BlockSolutionRecommender** — 解决方案推荐（6 type × N solutions）
- **FreewritePromptGenerator** — 自由写作 prompt（4 + random + batch）
- **WritingWarmupGenerator** — 热身生成（4 exercises + morningRoutine）
- **InspirationScraper** — 灵感抓取（9 sources + unique batch）
- **WritingExerciseLibrary** — 练习库（3+ exercises + findByDuration）
- **BlockJournalTracker** — 瓶颈日志（record + mostEffectiveSolution）
- **MotivationRestorer** — 动力恢复（3 quotes + microGoal + remindWhy）
- **FocusSessionManager** — 专注会话（start + end + suggestDuration low/medium/high）
- **WritingStreakTracker** — 连续追踪（streak + bestStreak + reset）

### 集成 (9)
- **ComprehensiveBlockAnalyzer** — 综合瓶颈分析（primaryType + totalSeverity + durationDays）
- **BlockPreventionPredictor** — 瓶颈预防预测（risk 0-1 + recommendation）
- **BlockRecoveryPlan** — 恢复计划（3 severity tier × steps + duration）
- **WritingHabitTracker** — 习惯追踪（record + getHabit + isConsistent 5+）
- **EnergyMonitor** — 能量监控（log + averageLevel + isLow 0.3-）
- **BlockAlertSystem** — 预警系统（alert + getAlerts + hasHighAlert）
- **WriterProfileTracker** — 写作者画像（name + totalWords + bestStreak + preferredTime）
- **BlockCategoryReport** — 分类报告（per-type count + avg severity）
- **BlockAIDirector** — AI 导演（recommendSolution + hasHistory）

### 收口 (3)
- **BlockDetectionIndex** — 9 engines 收口
- **BlockResolutionIndex** — 9 engines 收口
- **BlockBreakerIndex** — 28 engines 收口

## 使用方式

```ts
import { BlockTypeDetector, WriterBlockAnalyzer } from './src/ai/block/BlockDetection';
import { BlockSolutionRecommender, FreewritePromptGenerator } from './src/ai/block/BlockResolution';
import { ComprehensiveBlockAnalyzer, BlockAIDirector } from './src/ai/block/BlockIntegration';

const detector = new BlockTypeDetector();
console.log(detector.detect('剧情卡住了')); // 'plot'

const analyzer = new WriterBlockAnalyzer();
const history = [
  { date: '1', wordsWritten: 1000 },
  { date: '2', wordsWritten: 500 },
  { date: '3', wordsWritten: 200 },
];
const r = analyzer.analyze(history);
console.log(r.trend); // 'decreasing'

const recommender = new BlockSolutionRecommender();
console.log(recommender.recommend('plot'));
// ['改变一个角色的秘密', '引入新角色', '让旧敌变成新盟友']
```

## 测试命令

```bash
npx vitest run src/ai/block/ --coverage --coverage.include='src/ai/block/**'
```

## 文件位置

- `src/ai/block/BlockDetection.ts` — 瓶颈检测
- `src/ai/block/BlockResolution.ts` — 解决方案
- `src/ai/block/BlockIntegration.ts` — 集成 + 收口
