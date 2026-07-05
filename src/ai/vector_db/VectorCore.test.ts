// Round 8 Direction CF — Vector Database Batch 1/3 test
// V4736-V4745: 10 engines

import { describe, it, expect } from 'vitest';
import {
  VectorStore, EmbeddingGenerator, CosineSimilarity, EuclideanDistance,
  DotProductSimilarity, KNearestNeighbors, VectorNormalizer,
  DimensionReducer, VectorQuantizer, HNSWIndex,
  VectorCoreIndex, VECTOR_BATCH_1_ENGINES,
} from './VectorCore';

describe('V4736 VectorStore', () => {
  it('add and get', () => {
    const s = new VectorStore();
    s.add({ id: 'a', vector: [1, 2, 3] });
    expect(s.get('a')?.vector).toEqual([1, 2, 3]);
  });

  it('remove', () => {
    const s = new VectorStore();
    s.add({ id: 'a', vector: [] });
    expect(s.remove('a')).toBe(true);
    expect(s.size()).toBe(0);
  });

  it('setMetadata and filterByMetadata', () => {
    const s = new VectorStore();
    s.add({ id: 'a', vector: [] });
    s.setMetadata('a', 'lang', 'en');
    expect(s.filterByMetadata('lang', 'en').length).toBe(1);
  });

  it('all returns array', () => {
    const s = new VectorStore();
    s.add({ id: 'a', vector: [1] });
    s.add({ id: 'b', vector: [2] });
    expect(s.all().length).toBe(2);
  });
});

describe('V4737 EmbeddingGenerator', () => {
  it('embed returns vector of right dimension', () => {
    const e = new EmbeddingGenerator(64);
    const v = e.embed('hello world');
    expect(v.length).toBe(64);
  });

  it('embed similar texts have high cosine', () => {
    const e = new EmbeddingGenerator(64);
    const v1 = e.embed('hello world');
    const v2 = e.embed('hello there');
    const cosine = new CosineSimilarity();
    expect(cosine.compute(v1, v2)).toBeGreaterThan(0);
  });

  it('embedBatch returns array', () => {
    const e = new EmbeddingGenerator(32);
    const vecs = e.embedBatch(['a', 'b', 'c']);
    expect(vecs.length).toBe(3);
  });

  it('dimension getter', () => {
    const e = new EmbeddingGenerator(128);
    expect(e.dimension()).toBe(128);
  });
});

describe('V4738 CosineSimilarity', () => {
  it('identical vectors have score 1', () => {
    const c = new CosineSimilarity();
    expect(c.compute([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('orthogonal vectors have score 0', () => {
    const c = new CosineSimilarity();
    expect(c.compute([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('opposite vectors have score -1', () => {
    const c = new CosineSimilarity();
    expect(c.compute([1, 2], [-1, -2])).toBeCloseTo(-1);
  });

  it('computeBatch', () => {
    const c = new CosineSimilarity();
    const r = c.computeBatch([1, 0], [[1, 0], [0, 1], [-1, 0]]);
    expect(r[0]).toBeCloseTo(1);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(-1);
  });
});

describe('V4739 EuclideanDistance', () => {
  it('identical = 0', () => {
    const e = new EuclideanDistance();
    expect(e.compute([1, 2, 3], [1, 2, 3])).toBeCloseTo(0);
  });

  it('simple distance', () => {
    const e = new EuclideanDistance();
    expect(e.compute([0, 0], [3, 4])).toBeCloseTo(5);
  });

  it('computeBatch', () => {
    const e = new EuclideanDistance();
    const r = e.computeBatch([0, 0], [[1, 0], [0, 1]]);
    expect(r[0]).toBeCloseTo(1);
    expect(r[1]).toBeCloseTo(1);
  });
});

describe('V4740 DotProductSimilarity', () => {
  it('basic dot', () => {
    const d = new DotProductSimilarity();
    expect(d.compute([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('orthogonal = 0', () => {
    const d = new DotProductSimilarity();
    expect(d.compute([1, 0], [0, 1])).toBe(0);
  });

  it('computeBatch', () => {
    const d = new DotProductSimilarity();
    const r = d.computeBatch([1, 2], [[1, 2], [2, 4]]);
    expect(r[0]).toBe(5);
    expect(r[1]).toBe(10);
  });
});

describe('V4741 KNearestNeighbors', () => {
  it('search returns top k', () => {
    const knn = new KNearestNeighbors('cosine');
    const vectors = [
      { id: 'a', vector: [1, 0, 0] },
      { id: 'b', vector: [0.9, 0.1, 0] },
      { id: 'c', vector: [0, 1, 0] },
    ];
    const r = knn.search([1, 0, 0], vectors, 2);
    expect(r.length).toBe(2);
    expect(r[0].id).toBe('a');
  });

  it('search with euclidean metric', () => {
    const knn = new KNearestNeighbors('euclidean');
    const r = knn.search([0, 0], [{ id: 'a', vector: [1, 0] }, { id: 'b', vector: [0, 1] }], 1);
    expect(r[0].id).toBe('a');
  });

  it('searchThreshold filters', () => {
    const knn = new KNearestNeighbors('cosine');
    const r = knn.searchThreshold([1, 0], [{ id: 'a', vector: [1, 0] }, { id: 'b', vector: [-1, 0] }], 0.5);
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('a');
  });
});

describe('V4742 VectorNormalizer', () => {
  it('L2 normalize', () => {
    const n = new VectorNormalizer();
    const v = n.normalize([3, 4], 'l2');
    expect(v[0]).toBeCloseTo(0.6);
    expect(v[1]).toBeCloseTo(0.8);
  });

  it('L1 normalize', () => {
    const n = new VectorNormalizer();
    const v = n.normalize([1, 2, 3], 'l1');
    expect(v.reduce((s, x) => s + x, 0)).toBeCloseTo(1);
  });

  it('max normalize', () => {
    const n = new VectorNormalizer();
    const v = n.normalize([1, 2, 4], 'max');
    expect(Math.max(...v.map(Math.abs))).toBeCloseTo(1);
  });

  it('normalizeBatch', () => {
    const n = new VectorNormalizer();
    const r = n.normalizeBatch([[1, 2], [3, 4]]);
    expect(r.length).toBe(2);
  });
});

describe('V4743 DimensionReducer', () => {
  it('reduces dimension', () => {
    const r = new DimensionReducer();
    const vectors = [[1, 2, 3, 4, 5], [2, 3, 4, 5, 6]];
    const reduced = r.reduce(vectors, 2);
    expect(reduced[0].length).toBe(2);
  });

  it('empty input returns empty', () => {
    const r = new DimensionReducer();
    expect(r.reduce([], 2).length).toBe(0);
  });

  it('target dim >= original returns original', () => {
    const r = new DimensionReducer();
    expect(r.reduce([[1, 2, 3]], 5)[0].length).toBe(3);
  });
});

describe('V4744 VectorQuantizer', () => {
  it('quantize to 8-bit', () => {
    const q = new VectorQuantizer();
    const v = q.quantize([0, 0.5, 1.0], 8);
    expect(v[0]).toBeCloseTo(0);
    expect(v[2]).toBeCloseTo(255);
  });

  it('dequantize roundtrip approximates', () => {
    const q = new VectorQuantizer();
    const original = [0.1, 0.5, 0.9];
    const quant = q.quantize(original, 8);
    const dequant = q.dequantize(quant, 0, 1, 8);
    expect(Math.abs(dequant[1] - 0.5)).toBeLessThan(0.05);
  });

  it('quantizeBatch', () => {
    const q = new VectorQuantizer();
    const r = q.quantizeBatch([[0, 1], [0.5, 0.5]], 8);
    expect(r.length).toBe(2);
  });
});

describe('V4745 HNSWIndex', () => {
  it('add and size', () => {
    const h = new HNSWIndex();
    h.add('a', [1, 0]);
    h.add('b', [0, 1]);
    expect(h.size()).toBe(2);
  });

  it('search returns top k', () => {
    const h = new HNSWIndex();
    h.add('a', [1, 0]);
    h.add('b', [0.9, 0.1]);
    h.add('c', [0, 1]);
    const r = h.search([1, 0], 2);
    expect(r.length).toBe(2);
  });

  it('entryPoint set on first add', () => {
    const h = new HNSWIndex();
    h.add('a', [1, 0]);
    expect(h.entryPoint()).toBe('a');
  });

  it('search on empty returns empty', () => {
    const h = new HNSWIndex();
    expect(h.search([1, 0], 5).length).toBe(0);
  });
});

describe('VectorCoreIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new VectorCoreIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new VectorCoreIndex();
    expect(idx.has('VectorStore')).toBe(true);
    expect(idx.has('VectorCoreIndex')).toBe(true);
  });

  it('VECTOR_BATCH_1_ENGINES has 10', () => {
    expect(VECTOR_BATCH_1_ENGINES.length).toBe(10);
  });
});