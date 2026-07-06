// V5046-V5055: CP Vector Quantization v2 Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  IVFIndex,
  HNSWIndex,
  AnnoyIndex,
  LSHOperator,
  PQCompression,
  OptimizedPQ,
  ReRankingEngine,
  QuantizationBenchmark,
  VectorCompression,
  VectorQuantAdvancedIndex,
  CP_BATCH_2_ENGINES
} from './VectorQuantAdvanced';

describe('IVFIndex', () => {
  it('train + add + search + size', () => {
    const ivf = new IVFIndex(2);
    ivf.train([[1, 0], [0, 1], [1, 1], [0, 0]]);
    ivf.add('a', [1, 0]).add('b', [0, 1]);
    const r = ivf.search([1, 0], 2);
    expect(r.length).toBeGreaterThan(0);
    expect(ivf.size()).toBe(2);
  });

  it('empty train', () => {
    const ivf = new IVFIndex(2);
    ivf.train([]);
    ivf.add('a', [1, 0]);
    expect(ivf.size()).toBe(1);
  });

  it('IVF search with no centroids', () => {
    const ivf = new IVFIndex(0);
    ivf.train([[1, 0]]);
    const r = ivf.search([1, 0], 1);
    expect(r).toEqual([]);
  });

  it('IVF train with vectors shorter than numClusters', () => {
    const ivf = new IVFIndex(10);
    ivf.train([[1, 0]]);
    ivf.add('a', [1, 0]);
    expect(ivf.size()).toBe(1);
  });
});

describe('HNSWIndex + AnnoyIndex', () => {
  it('HNSWIndex add + search + size + accessors', () => {
    const h = new HNSWIndex(8, 100);
    h.add('a', [1, 0]).add('b', [0, 1]);
    const r = h.search([1, 0], 1);
    expect(r[0].id).toBe('a');
    expect(h.size()).toBe(2);
    expect(h.m()).toBe(8);
    expect(h.efConstruction()).toBe(100);
  });

  it('AnnoyIndex add + build + search + size + numTrees', () => {
    const a = new AnnoyIndex(4);
    a.add('a', [1, 0]).add('b', [0, 1]);
    a.build();
    const r = a.search([1, 0], 1);
    expect(r[0].id).toBe('a');
    expect(a.size()).toBe(2);
    expect(a.numTrees()).toBe(4);
  });
});

describe('LSHOperator + PQCompression + OptimizedPQ', () => {
  it('LSHOperator hash + signature + hammingDistance', () => {
    const l = new LSHOperator(4, 8);
    const sig = l.signature([0.1, 0.2, 0.3]);
    expect(sig).toHaveLength(4);
    const sig2 = l.signature([0.1, 0.2, 0.3]);
    expect(l.hammingDistance(sig, sig2)).toBe(0);
    const sig3 = l.signature([0.9, 0.8, 0.7]);
    expect(l.hammingDistance(sig, sig3)).toBeGreaterThanOrEqual(0);
    expect(l.hammingDistance([1, 2], [1, 2, 3])).toBe(0);
    // Test hamming with diff length and content
    expect(l.hammingDistance([1, 2, 3], [1, 2, 4])).toBe(1);
  });

  it('PQCompression compress + decompress + ratio', () => {
    const p = new PQCompression();
    const codes = p.compress([0.1, 0.5, 0.9]);
    expect(codes).toHaveLength(3);
    const decoded = p.decompress(codes);
    expect(decoded[0]).toBeCloseTo(codes[0] / 256);
    expect(p.compressionRatio(128)).toBe(4);
  });

  it('OptimizedPQ encodeBatch + decodeBatch + estimateMemory', () => {
    const o = new OptimizedPQ();
    const encoded = o.encodeBatch([[0.1, 0.2], [0.3, 0.4]]);
    expect(encoded).toHaveLength(2);
    const decoded = o.decodeBatch(encoded);
    expect(decoded).toHaveLength(2);
    expect(o.estimateMemory([[0, 0, 0, 0]])).toBe(4);
  });
});

describe('ReRankingEngine + QuantizationBenchmark + VectorCompression', () => {
  it('ReRankingEngine rerank', () => {
    const r = new ReRankingEngine();
    const result = r.rerank([1, 0], [{ id: 'a', vector: [1, 0] }, { id: 'b', vector: [0, 1] }], 2);
    expect(result[0].id).toBe('a');
    expect(result[1].id).toBe('b');
  });

  it('QuantizationBenchmark record + get + names + compare', () => {
    const b = new QuantizationBenchmark();
    b.record('PQ', 0.95).record('SQ', 0.85);
    expect(b.get('PQ')).toBe(0.95);
    expect(b.get('missing')).toBe(0);
    expect(b.names().sort()).toEqual(['PQ', 'SQ']);
    expect(b.compare('PQ', 'SQ')).toBe('a');
    expect(b.compare('SQ', 'PQ')).toBe('b');
    expect(b.compare('PQ', 'PQ')).toBe('equal');
    // Test missing fallback
    expect(b.compare('PQ', 'missing')).toBe('a');
    expect(b.compare('missing', 'PQ')).toBe('b');
  });

  it('VectorCompression compress + decompress + ratio', () => {
    const v = new VectorCompression();
    const bytes = v.compress([0.0, 0.5, -0.5]);
    expect(bytes).toHaveLength(3);
    const decoded = v.decompress(bytes);
    expect(decoded[1]).toBeCloseTo(0.5);
    expect(v.ratio([0.1, 0.2])).toBe(4);
  });
});

describe('VectorQuantAdvancedIndex', () => {
  it('list has 10', () => {
    expect(new VectorQuantAdvancedIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new VectorQuantAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('IVFIndex')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CP_BATCH_2_ENGINES const has 10', () => {
    expect(CP_BATCH_2_ENGINES).toHaveLength(10);
  });
});