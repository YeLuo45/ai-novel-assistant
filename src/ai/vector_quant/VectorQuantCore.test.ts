// V5036-V5045: CP Vector Quantization v2 Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  VectorQuantizer,
  ProductQuantizer,
  ScalarQuantizer,
  ResidualQuantizer,
  QuantizationCodebook,
  QuantizationEncoder,
  QuantizationDecoder,
  DistanceMetric,
  SimilaritySearch,
  VectorQuantCoreIndex,
  CP_BATCH_1_ENGINES
} from './VectorQuantCore';

describe('VectorQuantizer', () => {
  it('quantize + dequantize + quantizeVector + bitsPerValue', () => {
    const q = new VectorQuantizer();
    expect(q.quantize(0.5)).toBeCloseTo(0.5, 2);
    expect(q.dequantize(0.5)).toBe(0.5);
    expect(q.quantizeVector([0.1, 0.5, 0.9])).toHaveLength(3);
    expect(q.dequantizeVector([0.1, 0.5, 0.9])).toHaveLength(3);
    expect(q.bitsPerValue(256)).toBe(8);
    expect(q.bitsPerValue(1024)).toBe(10);
  });
});

describe('ProductQuantizer', () => {
  it('split + assignCentroid + encode + accessors', () => {
    const pq = new ProductQuantizer(2, 16);
    const v = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
    const subspaces = pq.split(v);
    expect(subspaces).toHaveLength(3);
    expect(subspaces[0]).toEqual([0.1, 0.2]);
    const codes = pq.encode(v);
    expect(codes).toHaveLength(3);
    expect(pq.subspaceDim()).toBe(2);
    expect(pq.numCentroids()).toBe(16);
  });
});

describe('ScalarQuantizer', () => {
  it('calibrate + quantize + dequantize + min/max/levels', () => {
    const sq = new ScalarQuantizer(256);
    sq.calibrate([[0.0, 1.0], [0.5, 0.5]]);
    expect(sq.min()).toBe(0);
    expect(sq.max()).toBe(1);
    expect(sq.quantize(0)).toBe(0);
    expect(sq.quantize(1)).toBe(255);
    expect(sq.dequantize(0)).toBe(0);
    expect(sq.dequantize(255)).toBeCloseTo(1, 1);
    expect(sq.levels()).toBe(256);
  });
});

describe('ResidualQuantizer', () => {
  it('encode + stages', () => {
    const rq = new ResidualQuantizer(2);
    const codes = rq.encode([0.1, 0.2, 0.3]);
    expect(codes).toHaveLength(6); // 2 stages * 3 dims
    expect(rq.stages()).toBe(2);
  });
});

describe('QuantizationCodebook', () => {
  it('add + get + has + delete + size + keys', () => {
    const cb = new QuantizationCodebook();
    cb.add('c1', [1, 2, 3]);
    expect(cb.get('c1')).toEqual([1, 2, 3]);
    expect(cb.has('c1')).toBe(true);
    expect(cb.size()).toBe(1);
    expect(cb.keys()).toEqual(['c1']);
    expect(cb.delete('c1')).toBe(true);
    expect(cb.get('missing')).toBeNull();
  });
});

describe('QuantizationEncoder + QuantizationDecoder', () => {
  it('encode + decode round-trip', () => {
    const enc = new QuantizationEncoder();
    const v = [0.123, 0.456, 0.789];
    const encoded = enc.encode(v, 2);
    expect(enc.decode(encoded)).toEqual([0.12, 0.46, 0.79]);
    expect(enc.decode('')).toEqual([]);
    expect(enc.encodedSize(v, 2)).toBe(encoded.length);
  });

  it('encodeBytes + decodeBytes round-trip', () => {
    const dec = new QuantizationDecoder();
    const v = [0.0, 0.5, -0.5];
    const bytes = dec.encodeBytes(v);
    expect(dec.decodeBytes(bytes, 3)).toHaveLength(3);
  });
});

describe('DistanceMetric + SimilaritySearch', () => {
  it('DistanceMetric euclidean + cosine + manhattan + dot', () => {
    const m = new DistanceMetric();
    expect(m.euclidean([1, 0], [0, 0])).toBe(1);
    expect(m.euclidean([0, 0], [0, 0])).toBe(0);
    expect(m.cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(m.cosine([1, 0], [0, 1])).toBeCloseTo(0);
    expect(m.manhattan([1, 2], [4, 6])).toBe(7);
    expect(m.dot([1, 2], [3, 4])).toBe(11);
  });

  it('SimilaritySearch add + search + size + remove', () => {
    const s = new SimilaritySearch();
    s.add('a', [1, 0, 0]).add('b', [0, 1, 0]).add('c', [0, 0, 1]);
    const r1 = s.search([1, 0, 0], 2, 'cosine');
    expect(r1[0].id).toBe('a');
    expect(r1.length).toBe(2);
    expect(s.size()).toBe(3);
    expect(s.remove('a')).toBe(true);
    expect(s.size()).toBe(2);
  });

  it('SimilaritySearch with euclidean + manhattan + dot metrics', () => {
    const s = new SimilaritySearch();
    s.add('a', [1, 0]).add('b', [0, 1]);
    const rEuc = s.search([1, 0], 1, 'euclidean');
    expect(rEuc[0].id).toBe('a');
    const rMan = s.search([1, 0], 1, 'manhattan');
    expect(rMan[0].id).toBe('a');
    const rDot = s.search([1, 0], 1, 'dot');
    expect(rDot[0].id).toBe('a');
  });
});

describe('VectorQuantCoreIndex', () => {
  it('list has 10', () => {
    expect(new VectorQuantCoreIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new VectorQuantCoreIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('VectorQuantizer')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CP_BATCH_1_ENGINES const has 10', () => {
    expect(CP_BATCH_1_ENGINES).toHaveLength(10);
  });
});