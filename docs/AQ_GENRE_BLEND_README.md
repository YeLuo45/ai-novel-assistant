# Direction AQ — Genre Blending Advisor

**V3586-V3615 · 30 engines · 58 tests · 100% pass · ≥98% coverage**

类型融合顾问 + 兼容性矩阵 + 趋势预测 + 市场测试 + 风险评估。

## 灵感来源

跨类型小说趋势 / 同人创作 / 类型融合畅销案例 / Twilight / Harry Potter

## 30 engines 分组

### Genre Blender (9)
- **GenreElementExtractor** — 类型元素提取（4 genre × 4 elements: setting/characters/conflicts/tropes）
- **CrossGenreCompatibility** — 跨类型兼容性（4×4 matrix + isBlendable 0.5+）
- **BlendRecipeBuilder** — 混合配方（normalize + name + isBalanced 0.7-）
- **GenreConflictDetector** — 类型冲突检测（detect + hasConflict）
- **HybridGenreGenerator** — 混合类型生成（4 known blends + isKnownHybrid）
- **GenreTransitionPlanner** — 类型过渡规划（bridgeChapter + isSmoothTransition）
- **GenreElementReplacer** — 元素替换（mapping + isAdapted）
- **StyleFusionEngine** — 风格融合（fuse + isBlendable）
- **GenreMixingRatio** — 混合比例（calculate + isBalanced 0.3+）

### Blend Recipe (9)
- **HybridGenreRecipeBuilder** — 混合配方（5 fields + isBalanced 0.3-0.7）
- **SuccessfulBlendAnalyzer** — 成功分析（normalize + topBlend）
- **TrendyBlendPredictor** — 趋势预测（3 known combo + isTrendy 0.7+）
- **GenreElementSplicer** — 元素拼接（splice + hasOverlap）
- **BlendTitleGenerator** — 标题生成（3 format + isCatchy 5-40）
- **MarketBlendsAnalyzer** — 市场分析（dominant + diversity）
- **ReaderDemographicBlender** — 读者群混合（blend + isCompatible）
- **GenreEvolutionSimulator** — 进化模拟（4 evolution map）
- **BlendRiskAssessor** — 风险评估（3 factors + isHighRisk 0.5+）

### Blend Integration (9)
- **BlendValidator** — 配方验证（3 rules + issues）
- **HybridGenreMarketTester** — 市场测试（match by ratio ± 0.1 + confidence）
- **GenreMashupGenerator** — 混搭生成（× separator + hasUniqueName）
- **CrossGenrePrompts** — 跨类型 prompt（3 templates + isValidPrompt 20+）
- **GenreSynergyCalculator** — 协同效应（2 bonuses + 1 penalty + isHighSynergy 1.2+）
- **SuccessfulHybridExamples** — 成功案例（3 known + findByGenres）
- **BlendPrototyping** — 原型制作（outline + keyScenes + isReady 3+）
- **GenreBlendingDirector** — AI 总监（4 step state machine）
- **ReaderSegmentOverlap** — 读者重叠（overlap ratio + isSignificant 0.3+）

### 收口
- **GenreBlenderIndex** / **BlendRecipeIndex** / **BlendMasterIndex** (28 engines)

## 使用方式

```ts
import { CrossGenreCompatibility, HybridGenreGenerator } from './src/ai/genre_blend/GenreBlender';
import { BlendRecipeBuilder, TrendyBlendPredictor, BlendRiskAssessor } from './src/ai/genre_blend/BlendRecipe';
import { SuccessfulHybridExamples, GenreBlendingDirector } from './src/ai/genre_blend/BlendIntegration';

const compat = new CrossGenreCompatibility();
console.log(compat.score('romance', 'fantasy')); // 0.7
console.log(compat.isBlendable('romance', 'fantasy')); // true

const gen = new HybridGenreGenerator();
console.log(gen.generate('romance', 'mystery')); // 'Romantic Suspense'

const trendy = new TrendyBlendPredictor();
console.log(trendy.predict(['romance', 'fantasy'])); // ≥ 0.7 (trendy)
```

## 测试命令

```bash
npx vitest run src/ai/genre_blend/ --coverage --coverage.include='src/ai/genre_blend/**'
```