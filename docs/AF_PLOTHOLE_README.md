# Direction AF — Plot Hole Detector

**V3256-V3285 · 30 engines · 74 tests · 100% pass · 98.62% coverage**

跨章/跨卷逻辑漏洞自动检测 + 因果链验证 + 推理逻辑审计。

## 灵感来源

推理小说核心需求 / MCU 编剧室 continuity bible / 起点编辑"穿帮检查" / Airtable 角色追踪模板 / 各种 fanfic wiki

## 30 engines 分组

### 逻辑链 (5)
- **CausalChainBuilder** — 因果链构建（cause/effect/strength + isComplete 5+）
- **CausalChainValidator** — 因果链验证（weakLinks + hasUnbrokenChain）
- **EventPreconditionChecker** — 事件前置条件（addEvent + checkPrecondition met/missing）
- **MotivationAuditor** — 动机审计（因为/为了 + 决定/选择 + motivationStrength 0-1）
- **LogicChainIndex** — 9 engines 收口

### 漏洞检测 (5)
- **PlotHoleDetector** — 情节漏洞检测（5 type: motivation/logic/continuity/setting/unexplained）
- **HoleSeverityRanker** — 漏洞严重度排序（critical→major→minor + topN + isAcceptable）
- **HoleTypeDistribution** — 漏洞类型分布（5 type + dominantType）
- **HoleChainBuilder** — 漏洞链构建（buildChain + groupByType）
- **HoleFixSuggester** — 漏洞修复建议（5 type × 中文建议 + suggestAll）

### 伏笔 + 角色弧 (5)
- **ForeshadowPayoffVerifier** — 伏笔回收验证（plant/payOff/getOrphans/fulfillmentRate）
- **CharacterArcConsistency** — 角色弧一致性（trackChange + isConsistent 0.8 阈值）
- **PlotThreadTracker** — 情节线追踪（add/advance/resolve/getAbandoned 50+）
- **SetupPayoffRatio** — 铺垫-回收比（compute + recommend add_payoff/add_setup/balanced）
- **PlantStrengthCalculator** — 铺垫强度（10 关键词 + isStrongPlant/isSubtlePlant）

### 跨章分析 (5)
- **MultiChapterHoleAggregator** — 跨章漏洞聚合（byChapter + chaptersWithMultipleHoles + holeDensity）
- **SetupPayoffChainVisualizer** — 铺垫回收链可视化（isSetup/isPayoff + chainRatio）
- **MysteryLogicAuditor** — 推理逻辑审计（clue + motive + opportunity + completenessScore 0-1）
- **CharacterKnowledgeCheck** — 角色知识检查（knows + hasKnowledgeGap）
- **ObjectContinuityAuditor** — 物品连续性（introduce/moveTo/changeOwner + hasInconsistency）

### 集成 (5)
- **FactionGoalAuditor** — 阵营目标审计（addFaction + isGoalAligned + unalignedActions）
- **GeographicLogicAuditor** — 地理逻辑（addLocation + distance + isReasonableTravel 30km/h）
- **TemporalLogicAuditor** — 时间逻辑（addEvent + hasOverlappingEvents + hasCausalityViolation）
- **PlotComplexityScorer** — 情节复杂度（threads + totalLength + complexity 0-1）
- **PlotHoleIndex** — 28 engines 收口

## 使用方式

```ts
import { CausalChainBuilder, PlotHoleDetector, ForeshadowPayoffVerifier } from './src/ai/plothole/LogicChain';
import { HoleSeverityRanker, HoleFixSuggester } from './src/ai/plothole/HoleDetection';
import { MysteryLogicAuditor, SetupPayoffChainVisualizer } from './src/ai/plothole/PlotStructureAnalysis';

const detector = new PlotHoleDetector();
const holes = detector.detect(chapters);
const ranker = new HoleSeverityRanker();
const topHole = ranker.topN(holes, 3);

const fix = new HoleFixSuggester();
const suggestion = fix.suggest(topHole[0].type);

const foreshadow = new ForeshadowPayoffVerifier();
const f = foreshadow.plant('神秘信件', 1);
foreshadow.payOff(f.id, 10);
console.log(foreshadow.fulfillmentRate()); // 1.0
```

## 测试命令

```bash
npx vitest run src/ai/plothole/ --coverage --coverage.include='src/ai/plothole/**'
```

## 文件位置

- `src/ai/plothole/LogicChain.ts` — 逻辑链 + 漏洞检测基础
- `src/ai/plothole/HoleDetection.ts` — 漏洞严重度 + 修复建议
- `src/ai/plothole/PlotStructureAnalysis.ts` — 跨章分析 + 集成
