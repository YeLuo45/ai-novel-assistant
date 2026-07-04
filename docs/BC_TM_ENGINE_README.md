# Direction BC — Translation Memory Engine

**V3946-V3975 · 30 engines · 55 tests · 100% pass · ≥98% coverage**

TM 引擎 + 模糊匹配 + 编辑距离 + TMX 导出 + 集成。

## 灵感来源

基于 AU Translation-Aware Writing + TM 标准 (Trados/MemoQ/OmegaT) / 计算机辅助翻译

## 30 engines 分组

### TM Engine Core (10)
- **TMStore** — 存储（add + find + findFuzzy 0.8+ + size + EditDistance）
- **TMIndexer** — 索引（index + isIndexed）
- **TMQuery** — 查询（query exact=1.0 + isExact）
- **TMSegmenter** — 分段（segment + isValid 50 char/句）
- **TMAlignment** — 对齐（align + isAligned）
- **TMQuality** — 质量（quality 0.7×+0.3×len + isHighQuality 0.7+）
- **TMContext** — 上下文（addContext + hasContext）
- **TMUpdate** — 更新（update + isUpdated）
- **TMExport** — 导出 JSON（exportJSON + isValidJSON）
- **TMImport** — 导入 JSON（importJSON + isValid）

### TM Engine Advanced (9)
- **TMConcordancer** — 检索（search + isRich）
- **TMConvergence** — 收敛（compute + isConverged 3+ domains）
- **TMPretranslation** — 预翻译（pretranslate + isPretranslated）
- **TMLeverage** — 利用率（compute exact/fuzzy/newWords + isHighLeverage 0.7+）
- **TMConsistency** — 一致性（check + isConsistent）
- **TMStatistics** — 统计（compute total/avgQuality/totalWords + isHealthy 100+）
- **TMEditor** — 编辑（edit + isEdited）
- **TMVersioning** — 版本（bump + get）
- **TMBatch** — 批量（add + commit + isCommitted）

### TM Engine Integration (9)
- **TMEngine** — 引擎主类（getStore + importTM + exportTM + lookup + size）
- **TMEngineMetrics** — 指标（recordQuery + exactMatchRate）
- **TMEngineConfig** — 配置（maxEntries 1000 + minQuality 0.5 + isValid）
- **TMEngineSync** — 同步（sync added/updated + local/remote）
- **TMEngineAudit** — 审计（audit lowQuality/duplicates + isHealthy）
- **TMEngineLibrary** — 库（save + get + count）
- **TMEngineADirector** — 决策（seed/expand/maintain by cacheHitRate）
- **TMEngineTools** — 工具（Trados/MemoQ/OmegaT/Smartcat）
- **TMEngineExportFormat** — TMX 导出（exportTMX + isValid）

### 收口
- **TMCoreIndex** / **TMAdvancedIndex** / **TMEngineMasterIndex** (29 engines)

## 使用方式

```ts
import { TMStore, TMQuery } from './src/ai/tm_engine/TMEngineCore';
import { TMEngine } from './src/ai/tm_engine/TMEngineIntegration';

const store = new TMStore();
store.add({ source: 'hello', target: '你好', quality: 1 });
store.add({ source: 'world', target: '世界', quality: 1 });

const query = new TMQuery();
const r = query.query(store, 'hello');
console.log(r.entry?.target); // '你好'

const engine = new TMEngine();
engine.importTM('[{"source":"hi","target":"你好","quality":1}]');
console.log(engine.lookup('hi')); // '你好'
```

## 测试命令

```bash
npx vitest run src/ai/tm_engine/ --coverage --coverage.include='src/ai/tm_engine/**'
```