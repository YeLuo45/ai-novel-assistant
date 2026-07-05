// Round 8 Direction CF — Vector Database for Memory Batch 1/3
// V4736-V4745: VectorStore + Embedding + Cosine + Euclidean + DotProduct + KNN + Normalize + Reduce + Quantize + HNSW

export type Vector = number[];

// V4736: VectorStore — 基础向量存储（带 metadata）
export interface VectorRecord {
  id: string;
  vector: Vector;
  metadata?: Record<string, string>;
}

export class VectorStore {
  private _records: Map<string, VectorRecord> = new Map();

  add(record: VectorRecord): void { this._records.set(record.id, record); }

  get(id: string): VectorRecord | undefined { return this._records.get(id); }

  remove(id: string): boolean { return this._records.delete(id); }

  all(): VectorRecord[] { return Array.from(this._records.values()); }

  size(): number { return this._records.size; }

  setMetadata(id: string, key: string, value: string): boolean {
    const r = this._records.get(id);
    if (!r) return false;
    if (!r.metadata) r.metadata = {};
    r.metadata[key] = value;
    return true;
  }

  filterByMetadata(key: string, value: string): VectorRecord[] {
    return this.all().filter(r => r.metadata?.[key] === value);
  }
}

// V4737: EmbeddingGenerator — embedding 生成 (bag-of-words + FNV-1a hashing)
export class EmbeddingGenerator {
  private _dimension: number;

  constructor(dimension = 64) { this._dimension = dimension; }

  embed(text: string): Vector {
    const vec = new Array(this._dimension).fill(0);
    // Split by word + Chinese chars
    const tokens = text.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g) || [];
    tokens.forEach(token => {
      const idx = this._hash(token) % this._dimension;
      vec[idx] += 1;
    });
    // Normalize
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
    if (norm > 0) return vec.map(x => x / norm);
    return vec;
  }

  embedBatch(texts: string[]): Vector[] {
    return texts.map(t => this.embed(t));
  }

  dimension(): number { return this._dimension; }

  private _hash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }
}

// V4738: CosineSimilarity — 余弦相似度
export class CosineSimilarity {
  compute(a: Vector, b: Vector): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  computeBatch(query: Vector, vectors: Vector[]): number[] {
    return vectors.map(v => this.compute(query, v));
  }
}

// V4739: EuclideanDistance — 欧氏距离
export class EuclideanDistance {
  compute(a: Vector, b: Vector): number {
    if (a.length !== b.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  }

  computeBatch(query: Vector, vectors: Vector[]): number[] {
    return vectors.map(v => this.compute(query, v));
  }
}

// V4740: DotProductSimilarity — 点积相似度
export class DotProductSimilarity {
  compute(a: Vector, b: Vector): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot;
  }

  computeBatch(query: Vector, vectors: Vector[]): number[] {
    return vectors.map(v => this.compute(query, v));
  }
}

// V4741: KNearestNeighbors — KNN 检索
export type DistanceMetric = 'cosine' | 'euclidean' | 'dot-product';

export interface Neighbor {
  id: string;
  score: number;
}

export class KNearestNeighbors {
  private _metric: DistanceMetric;
  private _cosine = new CosineSimilarity();
  private _euclidean = new EuclideanDistance();
  private _dot = new DotProductSimilarity();

  constructor(metric: DistanceMetric = 'cosine') { this._metric = metric; }

  search(query: Vector, vectors: { id: string; vector: Vector }[], k: number): Neighbor[] {
    const scored: Neighbor[] = vectors.map(v => ({ id: v.id, score: this._score(query, v.vector) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  searchThreshold(query: Vector, vectors: { id: string; vector: Vector }[], threshold: number): Neighbor[] {
    return vectors
      .map(v => ({ id: v.id, score: this._score(query, v.vector) }))
      .filter(n => n.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }

  private _score(a: Vector, b: Vector): number {
    if (this._metric === 'cosine') return this._cosine.compute(a, b);
    if (this._metric === 'euclidean') return -this._euclidean.compute(a, b); // negative for sorting
    return this._dot.compute(a, b);
  }
}

// V4742: VectorNormalizer — 向量归一化 (L1/L2/max)
export type NormType = 'l1' | 'l2' | 'max';

export class VectorNormalizer {
  normalize(v: Vector, type: NormType = 'l2'): Vector {
    if (type === 'l1') {
      const sum = v.reduce((s, x) => s + Math.abs(x), 0);
      return sum === 0 ? v : v.map(x => x / sum);
    }
    if (type === 'l2') {
      const sum = v.reduce((s, x) => s + x * x, 0);
      const norm = Math.sqrt(sum);
      return norm === 0 ? v : v.map(x => x / norm);
    }
    // max
    const max = Math.max(...v.map(Math.abs));
    return max === 0 ? v : v.map(x => x / max);
  }

  normalizeBatch(vectors: Vector[], type: NormType = 'l2'): Vector[] {
    return vectors.map(v => this.normalize(v, type));
  }
}

// V4743: DimensionReducer — 维度归约 (PCA-lite: 取 top-k variance 维度)
export class DimensionReducer {
  reduce(vectors: Vector[], targetDim: number): Vector[] {
    if (vectors.length === 0 || targetDim <= 0) return [];
    const originalDim = vectors[0].length;
    if (targetDim >= originalDim) return vectors;
    // Simple: select top targetDim dimensions by variance
    const variances: number[] = [];
    for (let d = 0; d < originalDim; d++) {
      const values = vectors.map(v => v[d]);
      const mean = values.reduce((s, x) => s + x, 0) / values.length;
      const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
      variances.push(variance);
    }
    // Sort dims by variance desc, pick top targetDim
    const sortedDims = variances
      .map((v, i) => ({ v, i }))
      .sort((a, b) => b.v - a.v)
      .slice(0, targetDim)
      .map(x => x.i);
    return vectors.map(v => sortedDims.map(d => v[d]));
  }
}

// V4744: VectorQuantizer — 向量量化 (scalar quantization 简化版)
export class VectorQuantizer {
  quantize(v: Vector, bits = 8): Vector {
    const levels = (1 << bits) - 1;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const range = max - min || 1;
    return v.map(x => Math.round(((x - min) / range) * levels));
  }

  dequantize(q: Vector, min: number, max: number, bits = 8): Vector {
    const levels = (1 << bits) - 1;
    const range = max - min;
    return q.map(x => min + (x / levels) * range);
  }

  quantizeBatch(vectors: Vector[], bits = 8): Vector[] {
    return vectors.map(v => this.quantize(v, bits));
  }
}

// V4745: HNSWIndex — 简化 HNSW (Hierarchical Navigable Small World)
export interface HNSWNode {
  id: string;
  vector: Vector;
  neighbors: Map<number, Set<string>>; // level → neighbor IDs
}

export class HNSWIndex {
  private _nodes: Map<string, HNSWNode> = new Map();
  private _entryPoint: string | null = null;
  private _maxLevel = 3;
  private _m = 4; // max connections per node per level

  add(id: string, vector: Vector): void {
    if (this._nodes.has(id)) return;
    const level = Math.floor(Math.random() * (this._maxLevel + 1));
    const node: HNSWNode = { id, vector, neighbors: new Map() };
    for (let l = 0; l <= level; l++) {
      node.neighbors.set(l, new Set());
    }
    this._nodes.set(id, node);
    if (!this._entryPoint) {
      this._entryPoint = id;
    }
  }

  search(query: Vector, k: number): Neighbor[] {
    if (!this._entryPoint || this._nodes.size === 0) return [];
    const cosine = new CosineSimilarity();
    const results: Neighbor[] = [];
    this._nodes.forEach(node => {
      results.push({ id: node.id, score: cosine.compute(query, node.vector) });
    });
    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  size(): number { return this._nodes.size; }
  entryPoint(): string | null { return this._entryPoint; }
}

export const VECTOR_BATCH_1_ENGINES: readonly string[] = [
  'VectorStore', 'EmbeddingGenerator', 'CosineSimilarity', 'EuclideanDistance',
  'DotProductSimilarity', 'KNearestNeighbors', 'VectorNormalizer',
  'DimensionReducer', 'VectorQuantizer', 'HNSWIndex',
];

export class VectorCoreIndex {
  list(): string[] { return [...VECTOR_BATCH_1_ENGINES, 'VectorCoreIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}