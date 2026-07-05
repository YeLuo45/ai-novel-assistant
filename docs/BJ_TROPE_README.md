# Direction BJ — Trope Encyclopedia

**V4156-V4185 · 30 engines · 41 tests · 100% pass · ≥98% coverage**

套路百科 + 套路库 + 频率分析 + 反套路检测 + 集成。

## 灵感来源

TVTropes / 同人创作套路百科 / 出版业套路分析

## 30 engines

### Trope Encyclopedia Core (9)
- TropeEntry / TropeLibrary / TropeSearchEngine / TropeFrequencyAnalyzer / TropeSubversionDetector / TropeCombo / TropeOrigin / TropeEvolution / TropeCategory

### Trope Encyclopedia Advanced (9)
- TropeSimilarity / TropePopularity / TropeExamples / TropeCounterTrope / TropeVariation / TropeMedia / TropeWarning / TropeRating / TropeReviewer

### Trope Encyclopedia Integration (9)
- TropeEncyclopedia / TropeCategoryFilter / TropeImport / TropeExport / TropeSearchEngine2 / TropeIndexBuilder / TropeBrowser / TropeADirector / TropeTools

### 收口
- TropeEncyclopediaCoreIndex / TropeEncyclopediaAdvancedIndex / TropeEncyclopediaMasterIndex

## 测试

```bash
npx vitest run src/ai/trope/
```