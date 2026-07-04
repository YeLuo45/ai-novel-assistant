# Direction BA — Co-Author Style Memory

**V3886-V3915 · 30 engines · 46 tests · 100% pass · ≥98% coverage**

风格记忆 + 检索 + 一致性 + 集成。

## 灵感来源

基于 AR AI Co-Author Assistant + AI 长期记忆 / 风格学习 / few-shot

## 30 engines 分组

### Style Memory Core (10)
- **StyleMemory** — 风格记忆（add + getAll + size + recent）
- **StyleProfileExtractor** — 画像提取（avgLen + vocabSize + formality）
- **StyleMemoryRetriever** — 检索（retrieve + hasMatches by context）
- **StyleMemoryConsolidator** — 整合（dedupe + reduced）
- **StyleMemoryPersistence** — 持久化（save + load + count）
- **StyleMemorySimilarity** — 相似度（similarity + isSimilar 0.7+）
- **StyleMemoryRecencyScorer** — 新鲜度（score + isRecent 0.5+）
- **StyleMemoryFrequencyTracker** — 频次（record + top）
- **StyleMemoryEvolution** — 进化（save version + getVersion + versions）
- **StyleMemoryExporter** — 导出（export + isValid）

### Style Memory Advanced (9)
- **StyleMemorySize** — 大小（size + isLarge 100+）
- **StyleMemoryCompression** — 压缩（compress 50%）
- **StyleMemoryQuality** — 质量（score + isQuality 0.5+）
- **StyleMemoryConflictResolver** — 冲突解决（resolve + hasConflict）
- **StyleMemoryVersioning** — 版本（bump + get）
- **StyleMemoryPrivacy** — 隐私（anonymize + isAnonymized ***）
- **StyleMemoryTag** — 标签（hasTag）
- **StyleMemoryClusterer** — 聚类（cluster + clusterCount）
- **StyleMemoryBackup** — 备份（backup + restore + count）

### Style Memory Integration (9)
- **StyleMemoryADirector** — 决策（collect_samples/refresh/use）
- **StyleMemoryConsistency** — 一致性（check + isConsistent 0.5- 偏差）
- **StyleMemoryDriftDetector** — 漂移（detect + isSignificantDrift 0.3+）
- **StyleMemoryInsights** — 洞察（generate + hasInsights 样本）
- **StyleMemoryAlert** — 预警（send + hasAlert）
- **StyleMemoryCoherence** — 一致（check + isCoherent 0.05+）
- **StyleMemoryReviewer** — 评审（review + needsReview）
- **StyleMemoryTools** — 工具（Collect/Consolidate/Compress/Export）
- **StyleMemoryLibrary** — 库（save + get + count）

### 收口
- **StyleMemoryCoreIndex** / **StyleMemoryAdvancedIndex** / **StyleMemoryMasterIndex** (28 engines)

## 使用方式

```ts
import { StyleMemory, StyleProfileExtractor } from './src/ai/style_memory/StyleMemoryCore';
import { StyleMemoryConsolidator } from './src/ai/style_memory/StyleMemoryAdvanced';

const memory = new StyleMemory();
memory.add('sample 1', 'chapter1');
memory.add('sample 2', 'chapter2');

const extractor = new StyleProfileExtractor();
const profile = extractor.extract(memory.getAll());
console.log(profile.avgLen); // > 0

const consolidator = new StyleMemoryConsolidator();
const deduped = consolidator.consolidate(memory);
console.log(deduped.size()); // <= memory.size()
```

## 测试命令

```bash
npx vitest run src/ai/style_memory/ --coverage --coverage.include='src/ai/style_memory/**'
```