// Round 8 Direction CF — Vector Database Batch 2/3 + 3/3 combined test (20 engines)

import { describe, it, expect } from 'vitest';
import {
  VectorIndexRegistry, TextChunker, EmbeddingCache, SimilarityMatrix,
  VectorCluster, ANNRetriever, HybridRetriever, Reranker,
  MMRDiversifier, VectorAggregator,
  VectorDBSession, VectorIndexBuilder, SearchQueryParser, ResultFormatter,
  VectorDBSnapshot, VectorPersistence, VectorSharding, VectorMigration,
  VectorMetrics, VectorDBIntegration,
  VectorAdvancedIndex, VectorIntegrationIndex, VectorMasterIndex,
  VECTOR_BATCH_2_ENGINES, VECTOR_BATCH_3_ENGINES,
} from './VectorAdvanced';
import { VECTOR_BATCH_1_ENGINES, VectorStore, EmbeddingGenerator, HNSWIndex } from './VectorCore';

describe('V4746 VectorIndexRegistry', () => {
  it('register and get', () => {
    const r = new VectorIndexRegistry();
    const store = new VectorStore();
    r.register('main', store);
    expect(r.get('main')).toBe(store);
  });
  it('names and totalSize', () => {
    const r = new VectorIndexRegistry();
    r.register('a', new VectorStore());
    expect(r.names().length).toBe(1);
  });
});

describe('V4747 TextChunker', () => {
  it('chunkByChars', () => {
    const c = new TextChunker();
    const chunks = c.chunkByChars('abcdefghij', 4, 1);
    expect(chunks.length).toBeGreaterThan(0);
  });
  it('chunkBySentences', () => {
    const c = new TextChunker();
    const chunks = c.chunkBySentences('First. Second. Third. Fourth.', 2);
    expect(chunks.length).toBeGreaterThan(0);
  });
  it('chunkByParagraphs', () => {
    const c = new TextChunker();
    const chunks = c.chunkByParagraphs('Para 1\n\nPara 2\n\nPara 3');
    expect(chunks.length).toBe(3);
  });
});

describe('V4748 EmbeddingCache', () => {
  it('get caches results', () => {
    const c = new EmbeddingCache(new EmbeddingGenerator(32));
    const v1 = c.get('hello');
    const v2 = c.get('hello');
    expect(v1).toEqual(v2);
    expect(c.size()).toBe(1);
  });
  it('clear empties', () => {
    const c = new EmbeddingCache(new EmbeddingGenerator(32));
    c.get('hello');
    c.clear();
    expect(c.size()).toBe(0);
  });
});

describe('V4749 SimilarityMatrix', () => {
  it('compute returns N×N matrix', () => {
    const m = new SimilarityMatrix();
    const matrix = m.compute([[1, 0], [0, 1], [1, 1]]);
    expect(matrix.length).toBe(3);
    expect(matrix[0].length).toBe(3);
    expect(matrix[0][0]).toBeCloseTo(1);
  });
  it('diagonal returns self-similarities', () => {
    const m = new SimilarityMatrix();
    const matrix = m.compute([[1, 0], [0, 1]]);
    expect(m.diagonal(matrix)).toEqual([1, 1]);
  });
});

describe('V4750 VectorCluster', () => {
  it('cluster returns assignments', () => {
    const c = new VectorCluster();
    const result = c.cluster([[0, 0], [0, 1], [10, 10], [10, 11]], 2);
    expect(result.assignments.length).toBe(4);
    expect(result.centroids.length).toBe(2);
  });
  it('cluster empty input', () => {
    const c = new VectorCluster();
    expect(c.cluster([], 2).assignments.length).toBe(0);
  });
});

describe('V4751 ANNRetriever', () => {
  it('retrieve returns top k', () => {
    const idx = new HNSWIndex();
    idx.add('a', [1, 0]);
    const ann = new ANNRetriever(idx);
    expect(ann.retrieve([1, 0], 1).length).toBe(1);
  });
});

describe('V4752 HybridRetriever', () => {
  it('retrieve combines vector + text', () => {
    const h = new HybridRetriever();
    const r = h.retrieve('hello world', [1, 0], [
      { id: 'a', vector: [1, 0], text: 'hello world' },
      { id: 'b', vector: [0, 1], text: 'goodbye' },
    ], 2);
    expect(r[0].id).toBe('a');
  });
});

describe('V4753 Reranker', () => {
  it('rerank adds bonus', () => {
    const r = new Reranker();
    const out = r.rerank([{ id: 'a', score: 0.5 }], [() => 0.3]);
    expect(out[0].score).toBeCloseTo(0.8);
  });
  it('recencyBoost for fresh items', () => {
    const r = new Reranker();
    const ts = new Map([['a', Date.now()]]);
    const boost = r.recencyBoost(ts, 1000);
    expect(boost('a')).toBeGreaterThan(0);
    expect(boost('unknown')).toBe(0);
  });
});

describe('V4754 MMRDiversifier', () => {
  it('diversify returns diverse subset', () => {
    const m = new MMRDiversifier();
    const r = m.diversify([1, 0], [
      { id: 'a', vector: [1, 0], score: 0.9 },
      { id: 'b', vector: [1, 0.1], score: 0.85 },
      { id: 'c', vector: [0, 1], score: 0.5 },
    ], 2);
    expect(r.length).toBe(2);
  });
});

describe('V4755 VectorAggregator', () => {
  it('avg mode', () => {
    const a = new VectorAggregator();
    const r = a.aggregate([[1, 2], [3, 4]], 'avg');
    expect(r[0]).toBe(2);
    expect(r[1]).toBe(3);
  });
  it('max mode', () => {
    const a = new VectorAggregator();
    const r = a.aggregate([[1, 5], [3, 2]], 'max');
    expect(r[0]).toBe(3);
    expect(r[1]).toBe(5);
  });
  it('concat mode', () => {
    const a = new VectorAggregator();
    const r = a.aggregate([[1, 2], [3, 4]], 'concat');
    expect(r).toEqual([1, 2, 3, 4]);
  });
});

describe('V4756 VectorDBSession', () => {
  it('construct sets up all engines', () => {
    const s = new VectorDBSession('s1', { name: 'main', dimension: 64 });
    expect(s.id).toBe('s1');
    expect(s.config.dimension).toBe(64);
  });
});

describe('V4757 VectorIndexBuilder', () => {
  it('build indexes chunks', () => {
    const b = new VectorIndexBuilder();
    const store = new VectorStore();
    const count = b.build(['long text ' + 'x'.repeat(300)], new EmbeddingGenerator(32), new TextChunker(), store);
    expect(count).toBeGreaterThan(0);
    expect(store.size()).toBe(count);
  });
});

describe('V4758 SearchQueryParser', () => {
  it('parse extracts tokens and filters', () => {
    const p = new SearchQueryParser();
    const r = p.parse('hello world lang:en type:novel');
    expect(r.tokens).toContain('hello');
    expect(r.filters['lang']).toBe('en');
    expect(r.filters['type']).toBe('novel');
  });
});

describe('V4759 ResultFormatter', () => {
  it('text mode', () => {
    const f = new ResultFormatter();
    const out = f.format([{ id: 'a', score: 0.5 }], 'text');
    expect(out).toContain('a');
  });
  it('json mode', () => {
    const f = new ResultFormatter();
    const out = f.format([{ id: 'a', score: 0.5 }], 'json');
    expect(out).toContain('"id"');
  });
  it('markdown mode', () => {
    const f = new ResultFormatter();
    const out = f.format([{ id: 'a', score: 0.5 }], 'markdown');
    expect(out).toContain('**a**');
  });
});

describe('V4760 VectorDBSnapshot', () => {
  it('capture and restore', () => {
    const sm = new VectorDBSnapshot();
    const store = new VectorStore();
    store.add({ id: 'a', vector: [1] });
    const snap = sm.capture(store, 's1');
    store.remove('a');
    expect(store.size()).toBe(0);
    sm.restore(snap, store);
    expect(store.size()).toBe(1);
  });
  it('list and delete', () => {
    const sm = new VectorDBSnapshot();
    sm.capture(new VectorStore(), 's1');
    expect(sm.list().length).toBe(1);
    sm.delete('s1');
    expect(sm.list().length).toBe(0);
  });
});

describe('V4761 VectorPersistence', () => {
  it('serialize and deserialize', () => {
    const p = new VectorPersistence();
    const json = p.serialize([{ id: 'a', vector: [1, 2] }]);
    const restored = p.deserialize(json);
    expect(restored[0].vector).toEqual([1, 2]);
  });
});

describe('V4762 VectorSharding', () => {
  it('addShard and getShard', () => {
    const s = new VectorSharding();
    s.addShard('a');
    s.addShard('b');
    expect(s.allShards().length).toBe(2);
    expect(s.totalSize()).toBe(0);
  });
  it('shardFor routes deterministically', () => {
    const s = new VectorSharding();
    s.addShard('a'); s.addShard('b');
    const r1 = s.shardFor('key1');
    const r2 = s.shardFor('key1');
    expect(r1).toBe(r2);
  });
});

describe('V4763 VectorMigration', () => {
  it('migrate copies records', () => {
    const m = new VectorMigration();
    const src = new VectorStore();
    const tgt = new VectorStore();
    src.add({ id: 'a', vector: [1, 2] });
    expect(m.migrate(src, tgt)).toBe(1);
    expect(tgt.size()).toBe(1);
  });
  it('migrate with transform', () => {
    const m = new VectorMigration();
    const src = new VectorStore();
    const tgt = new VectorStore();
    src.add({ id: 'a', vector: [1, 2] });
    m.migrate(src, tgt, (v) => v.map(x => x * 2));
    expect(tgt.get('a')?.vector).toEqual([2, 4]);
  });
});

describe('V4764 VectorMetrics', () => {
  it('increment and counter', () => {
    const m = new VectorMetrics();
    m.increment('queries');
    expect(m.counter('queries')).toBe(1);
  });
  it('report and reset', () => {
    const m = new VectorMetrics();
    m.increment('a');
    expect(Object.keys(m.report()).length).toBe(1);
    m.reset();
    expect(Object.keys(m.report()).length).toBe(0);
  });
});

describe('V4765 VectorDBIntegration end-to-end demo', () => {
  it('runDemo completes workflow', () => {
    const v = new VectorDBIntegration({ name: 'demo', dimension: 32 });
    const result = v.runDemo();
    expect(result.indexedCount).toBeGreaterThan(0);
    expect(result.searchResults).toContain('**');
    expect(result.shards).toBe(2);
    expect(result.metricsReport.demo_runs).toBe(1);
  });
  it('exposes all sub-engines', () => {
    const v = new VectorDBIntegration({ name: 'd', dimension: 32 });
    expect(v.session()).toBeDefined();
    expect(v.builder()).toBeDefined();
    expect(v.queryParser()).toBeDefined();
    expect(v.formatter()).toBeDefined();
    expect(v.snapshot()).toBeDefined();
    expect(v.persistence()).toBeDefined();
    expect(v.sharding()).toBeDefined();
    expect(v.migration()).toBeDefined();
    expect(v.metrics()).toBeDefined();
  });
});

describe('VectorAdvancedIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new VectorAdvancedIndex();
    expect(idx.list().length).toBe(11);
  });
});

describe('VectorIntegrationIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new VectorIntegrationIndex();
    expect(idx.list().length).toBe(11);
  });
});

describe('VectorMasterIndex', () => {
  it('list includes 31 entries', () => {
    const idx = new VectorMasterIndex();
    expect(idx.list().length).toBe(31);
  });
  it('has all batch engines', () => {
    const idx = new VectorMasterIndex();
    expect(idx.has('VectorStore')).toBe(true);
    expect(idx.has('VectorIndexRegistry')).toBe(true);
    expect(idx.has('VectorDBSession')).toBe(true);
    expect(VECTOR_BATCH_1_ENGINES.length).toBe(10);
    expect(VECTOR_BATCH_2_ENGINES.length).toBe(10);
    expect(VECTOR_BATCH_3_ENGINES.length).toBe(10);
  });
});