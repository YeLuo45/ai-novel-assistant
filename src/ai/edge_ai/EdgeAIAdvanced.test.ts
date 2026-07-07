// V5166-V5175: CT Edge AI Inference Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  TFLiteBackend,
  ONNXRuntime,
  CoreMLBackend,
  HardwareSelector,
  ModelPruner,
  KnowledgeDistiller,
  QuantizationAware,
  EdgeMetrics,
  EdgeScheduler,
  EdgeAIAdvancedIndex,
  CT_BATCH_2_ENGINES
} from './EdgeAIAdvanced';

describe('TFLiteBackend + ONNXRuntime + CoreMLBackend', () => {
  it('TFLiteBackend load + predict + isAvailable', () => {
    const t = new TFLiteBackend();
    t.loadModel('/path/model.tflite');
    expect(t.predict([2, 4])).toEqual([1, 2]);
    expect(t.isAvailable()).toBe(true);
  });

  it('ONNXRuntime load + run + isAvailable', () => {
    const o = new ONNXRuntime();
    o.loadModel('/path/model.onnx');
    expect(o.run([1, 2, 3])).toEqual([2, 4, 6]);
    expect(o.isAvailable()).toBe(true);
  });

  it('CoreMLBackend load + predict + isSupported', () => {
    const c = new CoreMLBackend();
    c.loadModel('/path/model.mlmodel');
    expect(c.predict([4, 8])).toEqual([1, 2]);
    expect(c.isSupported()).toBe(true);
  });
});

describe('HardwareSelector + ModelPruner + KnowledgeDistiller + QuantizationAware', () => {
  it('HardwareSelector selectBackend + recommend', () => {
    const h = new HardwareSelector();
    expect(h.selectBackend('ios', 1000)).toBe('coreml');
    expect(h.selectBackend('android', 1000)).toBe('tflite');
    expect(h.selectBackend('web', 1000)).toBe('tflite');
    expect(h.selectBackend('web', 100_000_000)).toBe('onnx');
    expect(h.selectBackend('desktop', 1000)).toBe('onnx');
    const r = h.recommend(500, 50);
    expect(r.backend).toBe('tflite');
    expect(h.recommend(50_000_000, 3).backend).toBe('coreml');
    // Default fallback (large model + high latency)
    expect(h.recommend(50_000_000, 100).backend).toBe('onnx');
  });

  it('ModelPruner structuredPrune + sparsity', () => {
    const p = new ModelPruner();
    const weights = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
    const pruned = p.structuredPrune(weights, 4, 0.5); // prune 1 of 2 groups
    expect(pruned.length).toBe(8);
    expect(p.sparsity(pruned)).toBeGreaterThan(0);
    expect(p.sparsity([0, 0, 1, 1])).toBe(0.5);
    expect(p.sparsity([1, 1])).toBe(0);
  });

  it('KnowledgeDistiller divergence + compress + ratio', () => {
    const k = new KnowledgeDistiller();
    expect(k.divergence([], [])).toBe(0);
    expect(k.divergence([], [1])).toBe(0);
    expect(k.divergence([1], [])).toBe(0);
    // Both positive → log divergence
    expect(k.divergence([0.5, 0.5], [0.5, 0.5])).toBeCloseTo(0);
    expect(k.divergence([0.7, 0.3], [0.5, 0.5])).toBeGreaterThan(0);
    expect(k.compress([1, 2, 3, 4])).toEqual([1, 3]);
    expect(k.compressionRatio([1, 2, 3, 4])).toBe(2);
    expect(k.compressionRatio([])).toBe(0);
  });

  it('QuantizationAware simulateForward + bits + setBits', () => {
    const q = new QuantizationAware(8);
    expect(q.bits()).toBe(8);
    expect(q.simulateForward([0.1, 0.5, 0.9])).toHaveLength(3);
    q.setBits(16);
    expect(q.bits()).toBe(16);
  });
});

describe('EdgeMetrics + EdgeScheduler', () => {
  it('EdgeMetrics record + averageLatency + errorRate + counts + reset', () => {
    const m = new EdgeMetrics();
    m.record(10); m.record(20); m.record(5, true);
    expect(m.averageLatency()).toBeCloseTo(35 / 3);
    expect(m.errorRate()).toBeCloseTo(1 / 3);
    expect(m.requestCount()).toBe(3);
    expect(m.errorCount()).toBe(1);
    m.reset();
    expect(m.averageLatency()).toBe(0);
    expect(m.errorRate()).toBe(0);
  });

  it('EdgeScheduler enqueue + size + runNext', async () => {
    const s = new EdgeScheduler();
    s.enqueue(1, async () => 'low');
    s.enqueue(5, async () => 'high');
    expect(s.size()).toBe(2);
    const r1 = await s.runNext();
    expect(r1?.result).toBe('high'); // priority sorted
    expect(s.size()).toBe(1);
    const r2 = await s.runNext();
    expect(r2?.result).toBe('low');
    expect(await s.runNext()).toBeNull();
  });
});

describe('EdgeAIAdvancedIndex', () => {
  it('list has 10', () => {
    expect(new EdgeAIAdvancedIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new EdgeAIAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('TFLiteBackend')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CT_BATCH_2_ENGINES const has 10', () => {
    expect(CT_BATCH_2_ENGINES).toHaveLength(10);
  });
});