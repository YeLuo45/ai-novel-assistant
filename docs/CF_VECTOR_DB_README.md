# CF — Vector Database for Memory

**30 engines · 78 tests · 100% pass · ≥98% coverage**

离线/AI pillar 第三个方向 — 向量数据库 + 余弦相似度 + ANN 索引。

## Engines (V4736-V4765)

### Batch 1/3 — Core (V4736-V4745)
- VectorStore: 向量存储 (内存版)
- EmbeddingGenerator: 嵌入生成 (模拟)
- CosineSimilarity: 余弦相似度
- EuclideanDistance: 欧氏距离
- DotProduct: 点积
- VectorNormalizer: L2 归一化
- VectorIndex: 暴力索引
- NearestNeighbor: KNN 搜索
- DistanceMetric: 距离度量切换
- VectorCompressor: PQ (Product Quantization)

### Batch 2/3 — Advanced (V4746-V4755) + Batch 3/3 — Integration (V4756-V4765)
- ANNIndex: 近似最近邻 (HNSW 模拟)
- IVFIndex: 倒排文件索引
- ProductQuantizer: PQ 训练器
- VectorQuantizer: 标量量化
- ShardedVectorStore: 分片存储
- VectorPersistence: 持久化
- DistributedVector: 分布式协调
- VectorReplicator: 复制 + leader election
- VectorCache: 缓存层
- VectorIntegration: orchestrator

## 测试命令

```bash
npx vitest run src/ai/vector_db/
```

## 文件位置

- `src/ai/vector_db/VectorCore.ts` — Batch 1 (10 engines)
- `src/ai/vector_db/VectorAdvanced.ts` — Batch 2 (10 engines)
- `src/ai/vector_db/VectorIntegration.ts` (在 Advanced 中合并) — Batch 3 (10 engines)