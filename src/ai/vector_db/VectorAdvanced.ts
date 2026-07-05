// Round 8 Direction CF — Vector Database Batch 2/3 + 3/3 combined (20 engines)

import {
  VectorStore, EmbeddingGenerator, CosineSimilarity, EuclideanDistance,
  DotProductSimilarity, KNearestNeighbors, VectorNormalizer,
  DimensionReducer, VectorQuantizer, HNSWIndex,
  Neighbor, VECTOR_BATCH_1_ENGINES,
} from './VectorCore';

// === Batch 2: Advanced (V4746-V4755) ===

// V4746: VectorIndexRegistry — 索引注册中心
export class VectorIndexRegistry {
  private _indexes: Map<string, VectorStore> = new Map();

  register(name: string, store: VectorStore): void { this._indexes.set(name, store); }

  get(name: string): VectorStore | undefined { return this._indexes.get(name); }

  remove(name: string): boolean { return this._indexes.delete(name); }

  names(): string[] { return Array.from(this._indexes.keys()); }

  totalSize(): number {
    let n = 0;
    this._indexes.forEach(idx => { n += idx.size(); });
    return n;
  }
}

// V4747: TextChunker — 文本切块 (按段落/字符)
export interface TextChunk {
  text: string;
  index: number;
  start: number;
  end: number;
}

export class TextChunker {
  chunkByChars(text: string, chunkSize: number, overlap = 0): TextChunk[] {
    const chunks: TextChunk[] = [];
    let i = 0;
    let idx = 0;
    while (i < text.length) {
      const end = Math.min(i + chunkSize, text.length);
      chunks.push({ text: text.slice(i, end), index: idx++, start: i, end });
      if (end === text.length) break;
      i = end - overlap;
    }
    return chunks;
  }

  chunkBySentences(text: string, maxSentences = 3): TextChunk[] {
    const sentences = text.split(/([。！？.!?]+)/).filter(s => s.trim().length > 0);
    const chunks: TextChunk[] = [];
    let i = 0;
    let idx = 0;
    while (i < sentences.length) {
      const group = sentences.slice(i, i + maxSentences).join('');
      chunks.push({ text: group, index: idx++, start: i, end: i + maxSentences });
      i += maxSentences;
    }
    return chunks;
  }

  chunkByParagraphs(text: string): TextChunk[] {
    return text.split(/\n\n+/).filter(p => p.trim().length > 0).map((p, i) => ({ text: p, index: i, start: i, end: i + 1 }));
  }
}

// V4748: EmbeddingCache — embedding 缓存 (text → vector)
export class EmbeddingCache {
  private _cache: Map<string, Vector> = new Map();
  private _generator: EmbeddingGenerator;

  constructor(generator: EmbeddingGenerator) { this._generator = generator; }

  get(text: string): Vector {
    if (this._cache.has(text)) return this._cache.get(text)!;
    const v = this._generator.embed(text);
    this._cache.set(text, v);
    return v;
  }

  size(): number { return this._cache.size; }
  hitRate(): number { return this._cache.size > 0 ? this._hits / (this._hits + this._misses) : 0; }
  clear(): void { this._cache.clear(); this._hits = 0; this._misses = 0; }

  private _hits = 0;
  private _misses = 0;
}

// V4749: SimilarityMatrix — 相似度矩阵 (N×N)
export class SimilarityMatrix {
  compute(vectors: Vector[], metric: 'cosine' | 'dot' = 'cosine'): number[][] {
    const n = vectors.length;
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const cosine = new CosineSimilarity();
    const dot = new DotProductSimilarity();
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const s = metric === 'cosine' ? cosine.compute(vectors[i], vectors[j]) : dot.compute(vectors[i], vectors[j]);
        matrix[i][j] = s;
        matrix[j][i] = s;
      }
    }
    return matrix;
  }

  diagonal(matrix: number[][]): number[] {
    return matrix.map((row, i) => row[i]);
  }
}

// V4750: VectorCluster — K-means 聚类 (简化版)
export class VectorCluster {
  private _centroids: Vector[] = [];

  cluster(vectors: Vector[], k: number, iterations = 10): { assignments: number[]; centroids: Vector[] } {
    if (vectors.length === 0 || k <= 0) return { assignments: [], centroids: [] };
    // Initialize centroids from first k vectors
    this._centroids = vectors.slice(0, k).map(v => [...v]);
    const assignments = new Array(vectors.length).fill(0);
    for (let iter = 0; iter < iterations; iter++) {
      // Assign
      for (let i = 0; i < vectors.length; i++) {
        let best = 0;
        let bestDist = Infinity;
        for (let c = 0; c < k; c++) {
          const d = this._distance(vectors[i], this._centroids[c]);
          if (d < bestDist) { bestDist = d; best = c; }
        }
        assignments[i] = best;
      }
      // Update centroids
      for (let c = 0; c < k; c++) {
        const cluster = vectors.filter((_, i) => assignments[i] === c);
        if (cluster.length > 0) {
          const dim = cluster[0].length;
          const newCentroid = new Array(dim).fill(0);
          cluster.forEach(v => v.forEach((x, d) => { newCentroid[d] += x; }));
          this._centroids[c] = newCentroid.map(x => x / cluster.length);
        }
      }
    }
    return { assignments, centroids: this._centroids };
  }

  private _distance(a: Vector, b: Vector): number {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
    return Math.sqrt(s);
  }
}

// V4751: ANNRetriever — 近似最近邻检索（用 HNSW）
export class ANNRetriever {
  private _index: HNSWIndex;

  constructor(index: HNSWIndex) { this._index = index; }

  retrieve(query: Vector, k: number): Neighbor[] {
    return this._index.search(query, k);
  }

  size(): number { return this._index.size(); }
}

// V4752: HybridRetriever — 混合检索 (vector + keyword BM25-lite)
export class HybridRetriever {
  retrieve(query: string, queryVector: Vector, vectors: { id: string; vector: Vector; text: string }[], k: number, alpha = 0.7): Neighbor[] {
    const cosine = new CosineSimilarity();
    const queryTokens = new Set(query.toLowerCase().split(/\s+/));
    const scored: { id: string; score: number }[] = vectors.map(v => {
      const vecScore = cosine.compute(queryVector, v.vector);
      const textTokens = v.text.toLowerCase().split(/\s+/);
      const matchCount = textTokens.filter(t => queryTokens.has(t)).length;
      const textScore = matchCount / Math.max(queryTokens.size, 1);
      return { id: v.id, score: alpha * vecScore + (1 - alpha) * textScore };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, k).map(s => ({ id: s.id, score: s.score }));
  }
}

// V4753: Reranker — 重排序（基于规则）
export class Reranker {
  rerank(results: Neighbor[], boosters: ((id: string) => number)[]): Neighbor[] {
    const boosted = results.map(r => {
      const bonus = boosters.reduce((s, fn) => s + fn(r.id), 0);
      return { id: r.id, score: r.score + bonus };
    });
    return boosted.sort((a, b) => b.score - a.score);
  }

  recencyBoost(timestamps: Map<string, number>, maxAge = 86400000): (id: string) => number {
    return (id: string) => {
      const ts = timestamps.get(id);
      if (!ts) return 0;
      const age = Date.now() - ts;
      return age < maxAge ? 0.2 * (1 - age / maxAge) : 0;
    };
  }
}

// V4754: MMRDiversifier — 最大边际相关性 (MMR) 多样化
export class MMRDiversifier {
  diversify(query: Vector, candidates: { id: string; vector: Vector; score: number }[], k: number, lambda = 0.5): Neighbor[] {
    const selected: Neighbor[] = [];
    const remaining = [...candidates];
    const cosine = new CosineSimilarity();
    while (selected.length < k && remaining.length > 0) {
      let bestIdx = 0;
      let bestMMR = -Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const c = remaining[i];
        let maxSim = 0;
        for (const s of selected) {
          const selCandidate = candidates.find(x => x.id === s.id);
          if (selCandidate) maxSim = Math.max(maxSim, cosine.compute(c.vector, selCandidate.vector));
        }
        const mmr = lambda * c.score - (1 - lambda) * maxSim;
        if (mmr > bestMMR) { bestMMR = mmr; bestIdx = i; }
      }
      const picked = remaining.splice(bestIdx, 1)[0];
      selected.push({ id: picked.id, score: picked.score });
    }
    return selected;
  }
}

// V4755: VectorAggregator — 多向量聚合 (avg / max / concat)
export class VectorAggregator {
  aggregate(vectors: Vector[], mode: 'avg' | 'max' | 'concat' = 'avg'): Vector {
    if (vectors.length === 0) return [];
    if (mode === 'concat') return vectors.flat();
    const dim = vectors[0].length;
    if (mode === 'max') {
      const result = new Array(dim).fill(-Infinity);
      vectors.forEach(v => v.forEach((x, i) => { if (x > result[i]) result[i] = x; }));
      return result.map(x => x === -Infinity ? 0 : x);
    }
    // avg
    const result = new Array(dim).fill(0);
    vectors.forEach(v => v.forEach((x, i) => { result[i] += x; }));
    return result.map(x => x / vectors.length);
  }
}

// === Batch 3: Integration (V4756-V4765) ===

// V4756: VectorDBSession — session 顶层
export interface VectorDBSessionConfig {
  name: string;
  dimension: number;
}

export class VectorDBSession {
  readonly id: string;
  readonly config: VectorDBSessionConfig;
  readonly store: VectorStore;
  readonly embedder: EmbeddingGenerator;
  readonly cosine: CosineSimilarity;
  readonly euclidean: EuclideanDistance;
  readonly dotProduct: DotProductSimilarity;
  readonly knn: KNearestNeighbors;
  readonly normalizer: VectorNormalizer;
  readonly reducer: DimensionReducer;
  readonly quantizer: VectorQuantizer;
  readonly hnsw: HNSWIndex;
  readonly registry: VectorIndexRegistry;
  readonly chunker: TextChunker;
  readonly embedCache: EmbeddingCache;
  readonly simMatrix: SimilarityMatrix;
  readonly cluster: VectorCluster;
  readonly ann: ANNRetriever;
  readonly hybrid: HybridRetriever;
  readonly reranker: Reranker;
  readonly mmr: MMRDiversifier;
  readonly aggregator: VectorAggregator;
  readonly createdAt: number;

  constructor(id: string, config: VectorDBSessionConfig) {
    this.id = id;
    this.config = config;
    this.createdAt = Date.now();
    this.store = new VectorStore();
    this.embedder = new EmbeddingGenerator(config.dimension);
    this.cosine = new CosineSimilarity();
    this.euclidean = new EuclideanDistance();
    this.dotProduct = new DotProductSimilarity();
    this.knn = new KNearestNeighbors('cosine');
    this.normalizer = new VectorNormalizer();
    this.reducer = new DimensionReducer();
    this.quantizer = new VectorQuantizer();
    this.hnsw = new HNSWIndex();
    this.registry = new VectorIndexRegistry();
    this.chunker = new TextChunker();
    this.embedCache = new EmbeddingCache(this.embedder);
    this.simMatrix = new SimilarityMatrix();
    this.cluster = new VectorCluster();
    this.ann = new ANNRetriever(this.hnsw);
    this.hybrid = new HybridRetriever();
    this.reranker = new Reranker();
    this.mmr = new MMRDiversifier();
    this.aggregator = new VectorAggregator();
  }

  age(): number { return Date.now() - this.createdAt; }
}

// V4757: VectorIndexBuilder — 索引构建器（批量）
export class VectorIndexBuilder {
  build(texts: string[], embedder: EmbeddingGenerator, chunker: TextChunker, store: VectorStore): number {
    let count = 0;
    texts.forEach((text, i) => {
      const chunks = chunker.chunkByChars(text, 200, 50);
      chunks.forEach(chunk => {
        const vector = embedder.embed(chunk.text);
        store.add({ id: `${i}-${chunk.index}`, vector, metadata: { source: text.slice(0, 50) } });
        count++;
      });
    });
    return count;
  }
}

// V4758: SearchQueryParser — 查询解析器
export interface ParsedQuery {
  raw: string;
  tokens: string[];
  filters: Record<string, string>;
}

export class SearchQueryParser {
  parse(query: string): ParsedQuery {
    const tokens: string[] = [];
    const filters: Record<string, string> = {};
    query.split(/\s+/).forEach(part => {
      const filterMatch = part.match(/^(\w+):(.+)$/);
      if (filterMatch) {
        filters[filterMatch[1]] = filterMatch[2];
      } else if (part.trim().length > 0) {
        tokens.push(part.toLowerCase());
      }
    });
    return { raw: query, tokens, filters };
  }
}

// V4759: ResultFormatter — 结果格式化 (text / JSON / markdown)
export class ResultFormatter {
  format(results: Neighbor[], mode: 'text' | 'json' | 'markdown' = 'text'): string {
    if (mode === 'json') return JSON.stringify(results, null, 2);
    if (mode === 'markdown') {
      return results.map((r, i) => `${i + 1}. **${r.id}** (score: ${r.score.toFixed(4)})`).join('\n');
    }
    return results.map((r, i) => `${i + 1}. ${r.id}: ${r.score.toFixed(4)}`).join('\n');
  }
}

// V4760: VectorDBSnapshot — 快照管理
export interface Snapshot {
  id: string;
  timestamp: number;
  data: { id: string; vector: Vector; metadata?: Record<string, string> }[];
}

export class VectorDBSnapshot {
  private _snapshots: Map<string, Snapshot> = new Map();

  capture(store: VectorStore, id: string): Snapshot {
    const snap: Snapshot = { id, timestamp: Date.now(), data: store.all() };
    this._snapshots.set(id, snap);
    return snap;
  }

  restore(snap: Snapshot, store: VectorStore): void {
    store.all().forEach(r => store.remove(r.id));
    snap.data.forEach(r => store.add(r));
  }

  list(): Snapshot[] { return Array.from(this._snapshots.values()); }

  delete(id: string): boolean { return this._snapshots.delete(id); }
}

// V4761: VectorPersistence — 持久化 (JSON 序列化)
export class VectorPersistence {
  serialize(records: { id: string; vector: Vector; metadata?: Record<string, string> }[]): string {
    return JSON.stringify(records);
  }

  deserialize(json: string): { id: string; vector: Vector; metadata?: Record<string, string> }[] {
    return JSON.parse(json);
  }
}

// V4762: VectorSharding — 分片管理
export class VectorSharding {
  private _shards: Map<string, VectorStore> = new Map();

  addShard(name: string): void {
    if (!this._shards.has(name)) this._shards.set(name, new VectorStore());
  }

  getShard(name: string): VectorStore | undefined { return this._shards.get(name); }

  shardFor(key: string): string {
    const hash = key.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const names = Array.from(this._shards.keys());
    return names[hash % names.length] || names[0];
  }

  allShards(): VectorStore[] { return Array.from(this._shards.values()); }

  totalSize(): number {
    let n = 0;
    this._shards.forEach(s => { n += s.size(); });
    return n;
  }
}

// V4763: VectorMigration — 迁移工具
export class VectorMigration {
  migrate(source: VectorStore, target: VectorStore, transform?: (v: Vector) => Vector): number {
    let migrated = 0;
    source.all().forEach(r => {
      const newVector = transform ? transform(r.vector) : r.vector;
      target.add({ id: r.id, vector: newVector, metadata: r.metadata });
      migrated++;
    });
    return migrated;
  }
}

// V4764: VectorMetrics — 向量指标
export class VectorMetrics {
  private _counters: Map<string, number> = new Map();

  increment(name: string, by = 1): void {
    this._counters.set(name, (this._counters.get(name) || 0) + by);
  }

  counter(name: string): number { return this._counters.get(name) || 0; }

  report(): Record<string, number> {
    const out: Record<string, number> = {};
    this._counters.forEach((v, k) => { out[k] = v; });
    return out;
  }

  reset(): void { this._counters.clear(); }
}

// V4765: VectorDBIntegration — 集成 + demo
export class VectorDBIntegration {
  private _session: VectorDBSession;
  private _builder: VectorIndexBuilder;
  private _queryParser: SearchQueryParser;
  private _formatter: ResultFormatter;
  private _snapshot: VectorDBSnapshot;
  private _persistence: VectorPersistence;
  private _sharding: VectorSharding;
  private _migration: VectorMigration;
  private _metrics: VectorMetrics;

  constructor(config: VectorDBSessionConfig) {
    this._session = new VectorDBSession(`vdb-${Date.now()}`, config);
    this._builder = new VectorIndexBuilder();
    this._queryParser = new SearchQueryParser();
    this._formatter = new ResultFormatter();
    this._snapshot = new VectorDBSnapshot();
    this._persistence = new VectorPersistence();
    this._sharding = new VectorSharding();
    this._migration = new VectorMigration();
    this._metrics = new VectorMetrics();
  }

  runDemo(): {
    indexedCount: number;
    searchResults: string;
    shards: number;
    snapshotCount: number;
    metricsReport: Record<string, number>;
  } {
    // Index some texts
    const texts = [
      'The quick brown fox jumps over the lazy dog',
      'A journey of a thousand miles begins with a single step',
      'To be or not to be that is the question',
    ];
    const indexedCount = this._builder.build(texts, this._session.embedder, this._session.chunker, this._session.store);

    // Add to HNSW
    this._session.store.all().forEach(r => this._session.hnsw.add(r.id, r.vector));

    // Search
    const queryVec = this._session.embedder.embed('quick fox');
    const results = this._session.knn.search(queryVec, this._session.store.all(), 3);
    const searchResults = this._formatter.format(results, 'markdown');

    // Sharding
    this._sharding.addShard('shard1');
    this._sharding.addShard('shard2');

    // Snapshot
    this._snapshot.capture(this._session.store, 'snap1');

    // Metrics
    this._metrics.increment('demo_runs');
    this._metrics.increment('indexed_docs', indexedCount);
    this._metrics.increment('queries_run');

    return {
      indexedCount,
      searchResults,
      shards: this._sharding.allShards().length,
      snapshotCount: this._snapshot.list().length,
      metricsReport: this._metrics.report(),
    };
  }

  session(): VectorDBSession { return this._session; }
  builder(): VectorIndexBuilder { return this._builder; }
  queryParser(): SearchQueryParser { return this._queryParser; }
  formatter(): ResultFormatter { return this._formatter; }
  snapshot(): VectorDBSnapshot { return this._snapshot; }
  persistence(): VectorPersistence { return this._persistence; }
  sharding(): VectorSharding { return this._sharding; }
  migration(): VectorMigration { return this._migration; }
  metrics(): VectorMetrics { return this._metrics; }
}

export const VECTOR_BATCH_2_ENGINES: readonly string[] = [
  'VectorIndexRegistry', 'TextChunker', 'EmbeddingCache', 'SimilarityMatrix',
  'VectorCluster', 'ANNRetriever', 'HybridRetriever', 'Reranker',
  'MMRDiversifier', 'VectorAggregator',
];

export class VectorAdvancedIndex {
  list(): string[] { return [...VECTOR_BATCH_2_ENGINES, 'VectorAdvancedIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}

export const VECTOR_BATCH_3_ENGINES: readonly string[] = [
  'VectorDBSession', 'VectorIndexBuilder', 'SearchQueryParser', 'ResultFormatter',
  'VectorDBSnapshot', 'VectorPersistence', 'VectorSharding', 'VectorMigration',
  'VectorMetrics', 'VectorDBIntegration',
];

export class VectorIntegrationIndex {
  list(): string[] { return [...VECTOR_BATCH_3_ENGINES, 'VectorIntegrationIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}

export class VectorMasterIndex {
  list(): string[] {
    return [...VECTOR_BATCH_1_ENGINES, ...VECTOR_BATCH_2_ENGINES, ...VECTOR_BATCH_3_ENGINES, 'VectorMasterIndex'];
  }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}