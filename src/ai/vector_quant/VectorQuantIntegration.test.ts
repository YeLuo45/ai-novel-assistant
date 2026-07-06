// V5056-V5065: CP Vector Quantization v2 Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  QuantizationDashboard,
  RecallMetrics,
  PrecisionMetrics,
  QuantizationProfiler,
  VectorIndexManager,
  VectorQuantConfig,
  VectorQuantAudit,
  QuantizationReport,
  VectorQuantIntegrationIndex,
  VectorQuantMasterIndex,
  CP_BATCH_3_ENGINES,
  CP_ALL_ENGINES
} from './VectorQuantIntegration';

describe('QuantizationDashboard', () => {
  it('setPanel + getPanel + panelNames + panelCount', () => {
    const d = new QuantizationDashboard();
    d.setPanel('recall', 'Recall@10', 0.92).setPanel('speed', 'QPS', 1500);
    expect(d.getPanel('recall')).toEqual({ title: 'Recall@10', value: 0.92 });
    expect(d.getPanel('missing')).toBeNull();
    expect(d.panelNames().sort()).toEqual(['recall', 'speed']);
    expect(d.panelCount()).toBe(2);
  });
});

describe('RecallMetrics + PrecisionMetrics', () => {
  it('RecallMetrics record + recall + totalQueries + reset', () => {
    const r = new RecallMetrics();
    r.record(['a', 'b', 'c'], ['a', 'b']); // 2 relevant out of 3 retrieved
    r.record(['x', 'y'], ['a', 'x']); // 1 relevant out of 2 retrieved
    expect(r.totalQueries()).toBe(2);
    expect(r.recall()).toBeCloseTo(3 / 5);
    r.reset();
    expect(r.totalQueries()).toBe(0);
    expect(r.recall()).toBe(0);
  });

  it('PrecisionMetrics record + precision + reset', () => {
    const p = new PrecisionMetrics();
    p.record(['a', 'b', 'c'], ['a', 'b']); // 2/3
    expect(p.precision()).toBeCloseTo(2 / 3);
    p.reset();
    expect(p.precision()).toBe(0);
  });
});

describe('QuantizationProfiler', () => {
  it('record + averageFor + totalFor + operations + reset', () => {
    const p = new QuantizationProfiler();
    p.record('encode', 10).record('encode', 20).record('decode', 5);
    expect(p.averageFor('encode')).toBe(15);
    expect(p.totalFor('encode')).toBe(30);
    expect(p.operations().sort()).toEqual(['decode', 'encode']);
    p.reset();
    expect(p.operations()).toEqual([]);
  });
});

describe('VectorIndexManager + VectorQuantConfig', () => {
  it('IndexManager create + remove + has + get + names + count + setSize', () => {
    const m = new VectorIndexManager();
    m.create('vectors', 128);
    expect(m.has('vectors')).toBe(true);
    expect(m.get('vectors')).toEqual({ dim: 128, size: 0 });
    expect(m.names()).toEqual(['vectors']);
    expect(m.count()).toBe(1);
    expect(m.setSize('vectors', 1000)).toBe(true);
    expect(m.setSize('missing', 100)).toBe(false);
    expect(m.get('vectors')?.size).toBe(1000);
    expect(m.remove('vectors')).toBe(true);
    expect(m.count()).toBe(0);
  });

  it('Config typed accessors', () => {
    const c = new VectorQuantConfig();
    c.set('dim', 128).set('method', 'PQ').set('enabled', true);
    expect(c.getNumber('dim')).toBe(128);
    expect(c.getString('method')).toBe('PQ');
    expect(c.getBoolean('enabled')).toBe(true);
    expect(c.getNumber('missing', 64)).toBe(64);
    expect(c.getString('missing', 'fb')).toBe('fb');
    expect(c.getBoolean('missing', false)).toBe(false);
    expect(c.size()).toBe(3);
  });
});

describe('VectorQuantAudit + QuantizationReport', () => {
  it('Audit record + records + forIndex + count + clear', () => {
    const a = new VectorQuantAudit();
    a.record('u1', 'create', 'idx1').record('u1', 'update', 'idx1').record('u2', 'create', 'idx2');
    expect(a.count()).toBe(3);
    expect(a.forIndex('idx1')).toHaveLength(2);
    a.clear();
    expect(a.count()).toBe(0);
  });

  it('QuantizationReport generate + toCSV', () => {
    const r = new QuantizationReport();
    const md = r.generate('Q1 Quantization', { recall: 0.92, speed: 1500 });
    expect(md).toContain('# Q1 Quantization');
    expect(md).toContain('| recall | 0.92 |');
    const csv = r.toCSV({ a: 1, b: 2 });
    expect(csv).toBe('a,1\nb,2');
  });
});

describe('VectorQuantIntegrationIndex', () => {
  it('list has 10', () => {
    expect(new VectorQuantIntegrationIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new VectorQuantIntegrationIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('QuantizationDashboard')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CP_BATCH_3_ENGINES const has 10', () => {
    expect(CP_BATCH_3_ENGINES).toHaveLength(10);
  });
});

describe('VectorQuantMasterIndex', () => {
  it('list contains all 30 engines', () => {
    expect(new VectorQuantMasterIndex().list()).toHaveLength(30);
  });

  it('count 30', () => {
    expect(new VectorQuantMasterIndex().count()).toBe(30);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new VectorQuantMasterIndex();
    expect(idx.has('VectorQuantizer')).toBe(true);
    expect(idx.has('IVFIndex')).toBe(true);
    expect(idx.has('QuantizationDashboard')).toBe(true);
  });

  it('CP_ALL_ENGINES const has 30', () => {
    expect(CP_ALL_ENGINES).toHaveLength(30);
  });
});