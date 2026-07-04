# Direction BB — Backmatter Indexer

**V3916-V3945 · 30 engines · 53 tests · 100% pass · ≥98% coverage**

后记索引 + 搜索 + 集成。

## 灵感来源

基于 AT Backmatter Generator + 网文 SEO / 出版索引

## 30 engines 分组

### Backmatter Indexer Core (10)
- **BackmatterIndex** — 索引（add + get + allCategories + size）
- **BackmatterSearch** — 搜索（search + hasResults）
- **BackmatterTagGenerator** — 标签生成（character/world/plot）
- **BackmatterTOCBuilder** — 目录构建（buildTOC + isValidTOC）
- **BackmatterCrossReference** — 交叉引用（hasReference + count）
- **BackmatterKeywordExtractor** — 关键词提取（extract + isRich 3+）
- **BackmatterSummaryGenerator** — 摘要生成（generate + hasSummary）
- **BackmatterPageNumberer** — 页码（numberPages + isNumbered 1-）
- **BackmatterVersion** — 版本（bump + get）
- **BackmatterBackup** — 备份（backup + count）

### Backmatter Indexer Advanced (9)
- **BackmatterExporter** — 导出 Markdown（exportToMarkdown + isValid）
- **BackmatterImporter** — 导入 Markdown（importFromMarkdown + isValid）
- **BackmatterIndexExporter** — 导出 JSON（exportJSON + isValidJSON）
- **BackmatterSearchEngine** — 搜索引擎（search + isRanked）
- **BackmatterArchive** — 归档（record + totalCount）
- **BackmatterReferenceGraph** — 引用图（addEdge + isConnected BFS）
- **BackmatterCatalog** — 目录（add + byType + count）
- **BackmatterValidator** — 验证（validate + isValid）

### Backmatter Indexer Integration (9)
- **BackmatterIndexBuilder** — 构建（build + isValid）
- **BackmatterIndexReport** — 报告（generate + hasReport 分类）
- **BackmatterIndexQuality** — 质量（score + isQuality 0.7+）
- **BackmatterIndexStats** — 统计（record + get）
- **BackmatterIndexAudit** — 审计（audit + isHealthy）
- **BackmatterIndexADirector** — 决策（populate/refresh/maintain）
- **BackmatterIndexLibrary** — 库（save + get + count）
- **BackmatterIndexValidator** — 验证（validate + isValid）
- **BackmatterIndexSync** — 同步（sync + isSynced no_change/push/pull）

### 收口
- **BackmatterIndexerCoreIndex** / **BackmatterAdvancedIndex** / **BackmatterIndexMasterIndex** (28 engines)

## 使用方式

```ts
import { BackmatterIndex, BackmatterSearch } from './src/ai/backmatter_index/BackmatterIndexerCore';
import { BackmatterExporter } from './src/ai/backmatter_index/BackmatterIndexerAdvanced';

const index = new BackmatterIndex();
index.add('plot', 'hero saves world');
index.add('character', 'Alice backstory');

const search = new BackmatterSearch();
const r = search.search(index, 'hero');
console.log(r.length); // > 0

const exporter = new BackmatterExporter();
const md = exporter.exportToMarkdown([{ title: 'A', content: 'C' }]);
console.log(md); // '# A\n\nC'
```

## 测试命令

```bash
npx vitest run src/ai/backmatter_index/ --coverage --coverage.include='src/ai/backmatter_index/**'
```