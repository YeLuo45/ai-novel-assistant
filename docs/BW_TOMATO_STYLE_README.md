# Direction BW — Tomato Style Adapter

**V4466-V4495 · 30 engines · 38 tests · 100% pass · ≥98% coverage**

番茄风格适配器 + 章节长度 + 标题党 + 套路应用 + 集成。

## 灵感来源

番茄头部作品分析 / 短章节奏 / 爽文结构

## 30 engines 分组

### Tomato Style Core (10)
- TomatoChapterLengthAdjuster / TomatoTitleStyleMatcher / TomatoOpeningHookGenerator / TomatoConflictPacer / TomatoCliffhangerInserter / TomatoForeshadowDensity / TomatoDialogueRatioBalancer / TomatoPOVOptimizer / TomatoNameFormatValidator / TomatoPunctuationFormatter

### Tomato Style Advanced (10)
- TomatoGenreTropeApplier / TomatoReaderRetentionOptimizer / TomatoRecommendAlgorithmMatcher / TomatoHotWordInserter / TomatoContractComplianceChecker / TomatoReviewRiskPredictor / TomatoMarketingTagGenerator / TomatoSynopsisOptimizer / TomatoAuthorBioGenerator / TomatoStyleBenchmark

### Tomato Style Integration (10)
- TomatoStylePipeline / TomatoStyleDirector / TomatoStyleReport / TomatoStyleLibrary / TomatoStyleValidator / TomatoStyleTools / TomatoStyleQualityGate / TomatoStyleADirector / TomatoStyleEvolution / TomatoStyleMasterIndex

## 使用方式

```ts
import { TomatoChapterLengthAdjuster, TomatoTitleStyleMatcher } from './src/ai/tomato_style/TomatoStyleCore';

const adjuster = new TomatoChapterLengthAdjuster();
const adjusted = adjuster.adjust('very long text...', 2000);

const matcher = new TomatoTitleStyleMatcher();
const style = matcher.style('震惊！主角竟然是...');
console.log(style); // 'clickbait'
```

## 测试

```bash
npx vitest run src/ai/tomato_style/
```