# Direction BE — Idea Clustering

**V4006-V4035 · 30 engines · 53 tests · 100% pass · ≥98% coverage**

想法聚类分析 (K-Means / Hierarchical / DBSCAN) + 余弦相似度 + 关键词提取 + 集成。

## 灵感来源

信息检索 / 数据挖掘 / 自然语言处理 / 小说主题管理

## 30 engines 分组

### Clustering Core (9)
- KMeansClusterer / HierarchicalClusterer / DBSCANClusterer / SimilarityCalculator / DistanceMetric / ClusterEvaluator / ClusterSizeBalancer / ClusterLabeler / ClusterVisualizer

### Clustering Advanced (9)
- ClusterKeywordExtractor / ClusterSummary / ClusterMerger / ClusterSplitter / ClusterCentroid / ClusterQuality / ClusterSearch / ClusterExport / ClusterImport

### Clustering Integration (9)
- ClusteringPipeline / ClusteringDirector / ClusteringReport / ClusteringADirector2 / ClusteringLibrary / ClusteringValidator / ClusteringMetrics / ClusteringTools / ClusteringConfig

### 收口
- ClusteringCoreIndex / ClusteringAdvancedIndex / ClusteringMasterIndex

## 使用方式

```ts
import { KMeansClusterer, SimilarityCalculator } from './src/ai/clustering/IdeaClusteringCore';

const kmeans = new KMeansClusterer();
const clusters = kmeans.cluster([[1], [2], [3], [4]], 2);
console.log(clusters); // 2 clusters
```

## 测试

```bash
npx vitest run src/ai/clustering/
```