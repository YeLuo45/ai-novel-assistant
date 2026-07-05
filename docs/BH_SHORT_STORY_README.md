# Direction BH — Short Story Adapter

**V4096-V4125 · 30 engines · 56 tests · 100% pass · ≥98% coverage**

短篇改编器 + 浓缩 + 主题提取 + 钩子 + 集成。

## 灵感来源

短篇小说市场 / 起点短篇 / 短篇投稿

## 30 engines

### Short Story Core (9)
- StoryCondenser / ThemeExtracter / PlotCompressor / CharacterReducer / ScenePacker / WordBudgetEnforcer / ImpactMaximizer / ShortStoryHook / ShortStoryPacing

### Short Story Advanced (9)
- ShortStoryStructure / ShortStoryGenreAdapter / ShortStoryLengthChecker / ShortStoryConflictFocuser / ShortStoryTwistBuilder / ShortStoryToneSelector / ShortStoryProtagonistSelector / ShortStoryWordplayInserter / ShortStoryEndingPolisher

### Short Story Integration (9)
- ShortStoryPipeline / ShortStoryDirector / ShortStoryReport / ShortStoryLibrary / ShortStoryValidator / ShortStoryTools / ShortStoryMarketCheck / ShortStoryCompensation / ShortStoryADirector2

### 收口
- ShortStoryCoreIndex / ShortStoryAdvancedIndex / ShortStoryMasterIndex

## 测试

```bash
npx vitest run src/ai/short_story/
```