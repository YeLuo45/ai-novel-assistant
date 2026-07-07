// V5156-V5165: CT Edge AI Inference Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  ModelQuantizer,
  EdgeRuntime,
  ModelCompiler,
  NeuralEngineBackend,
  GPURuntime,
  CPURuntime,
  MemoryPool,
  InferenceCache,
  ModelLoader,
  EdgeOptimizer,
  EdgeAICoreIndex,
  CT_BATCH_1_ENGINES
} from './EdgeAICore';

describe('ModelQuantizer + EdgeRuntime', () => {
  it('ModelQuantizer quantize + dequantize + ratio', () => {
    const q = new ModelQuantizer();
    expect(q.quantize([0.123, 0.456])).toHaveLength(2);
    expect(q.dequantize([0.5])).toEqual([Math.round(0.5 * 255) / 255]);
    expect(q.compressionRatio([1, 2, 3], [0.5])).toBe(3);
    expect(q.compressionRatio([], [])).toBe(0);
  });

  it('EdgeRuntime load + unload + infer + isLoaded + size + loadedModels', async () => {
    const r = new EdgeRuntime();
    r.load('m1').load('m2');
    expect(r.isLoaded('m1')).toBe(true);
    expect(r.size()).toBe(2);
    expect(r.loadedModels().sort()).toEqual(['m1', 'm2']);
    expect(r.unload('m1')).toBe(true);
    expect(await r.infer('m2', [1, 2, 3])).toEqual([0.5, 1, 1.5]);
    expect(await r.infer('missing', [1])).toBeNull();
    expect(r.isLoaded('missing')).toBe(false);
  });
});

describe('ModelCompiler + NeuralEngineBackend + GPURuntime + CPURuntime', () => {
  it('ModelCompiler compile + info + sizeOf + format + count', () => {
    const c = new ModelCompiler();
    c.compile('m1', 'tflite', 1024 * 1024);
    expect(c.info('m1')?.format).toBe('tflite');
    expect(c.sizeOf('m1')).toBe(1024 * 1024);
    expect(c.format('m1')).toBe('tflite');
    expect(c.format('missing')).toBeNull();
    expect(c.sizeOf('missing')).toBe(0);
    expect(c.info('missing')).toBeNull();
    expect(c.count()).toBe(1);
  });

  it('NeuralEngineBackend available + capabilities', () => {
    const ne = new NeuralEngineBackend();
    expect(ne.isAvailable()).toBe(true);
    const caps = ne.capabilities();
    expect(caps.ops).toContain('matmul');
    expect(caps.memory).toBeGreaterThan(0);
  });

  it('GPURuntime allocate + free + memoryUsed + utilization', () => {
    const g = new GPURuntime(1000);
    expect(g.allocate(500)).toBe(true);
    expect(g.allocate(600)).toBe(false);
    expect(g.memoryUsed()).toBe(500);
    expect(g.utilization()).toBeCloseTo(0.5);
    g.free(200);
    expect(g.memoryUsed()).toBe(300);
    expect(g.maxMemory()).toBe(1000);
  });

  it('CPURuntime threads + compute', async () => {
    const c = new CPURuntime(8);
    expect(c.threads()).toBe(8);
    c.setThreads(16);
    expect(c.threads()).toBe(16);
    const result = await c.compute(async () => 42);
    expect(result).toBe(42);
  });
});

describe('MemoryPool + InferenceCache + ModelLoader + EdgeOptimizer', () => {
  it('MemoryPool allocate + release + sizeOf + totalUsed + maxSize', () => {
    const p = new MemoryPool(1000);
    expect(p.allocate('a', 400)).toBe(true);
    expect(p.allocate('b', 500)).toBe(true);
    expect(p.allocate('c', 200)).toBe(false);
    expect(p.totalUsed()).toBe(900);
    expect(p.sizeOf('a')).toBe(400);
    expect(p.sizeOf('missing')).toBe(0);
    expect(p.release('a')).toBe(true);
    expect(p.totalUsed()).toBe(500);
    expect(p.maxSize()).toBe(1000);
  });

  it('InferenceCache get + set + has + invalidate + size', () => {
    const c = new InferenceCache();
    c.set('k1', [1, 2, 3]);
    expect(c.get('k1')).toEqual([1, 2, 3]);
    expect(c.has('k1')).toBe(true);
    expect(c.invalidate('k1')).toBe(true);
    expect(c.get('missing')).toBeNull();
    expect(c.size()).toBe(0);
  });

  it('ModelLoader load + unload + totalBytes + age + loadedCount', async () => {
    const l = new ModelLoader();
    l.load('m1', 1024).load('m2', 2048);
    expect(l.totalBytes()).toBe(3072);
    expect(l.loadedCount()).toBe(2);
    expect(l.isLoaded('m1')).toBe(true);
    await new Promise(r => setTimeout(r, 5));
    expect(l.age('m1')).toBeGreaterThan(0);
    expect(l.age('missing')).toBe(-1);
    expect(l.unload('m1')).toBe(true);
    expect(l.totalBytes()).toBe(2048);
  });

  it('EdgeOptimizer prune + fuse + benchmark', () => {
    const o = new EdgeOptimizer();
    expect(o.prune([0.001, 0.5, 0.001, 0.3])).toEqual([0.5, 0.3]);
    expect(o.fuse([{ op: 'a' }, { op: 'a' }])).toHaveLength(2);
    const bench = o.benchmark([0.001, 0.5, 0.001, 0.3]);
    expect(bench.optimized).toBe(2);
    expect(bench.ratio).toBe(0.5);
  });
});

describe('EdgeAICoreIndex', () => {
  it('list has 11', () => {
    expect(new EdgeAICoreIndex().list()).toHaveLength(11);
  });

  it('count + engines + has', () => {
    const idx = new EdgeAICoreIndex();
    expect(idx.count()).toBe(11);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('ModelQuantizer')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CT_BATCH_1_ENGINES const has 11', () => {
    expect(CT_BATCH_1_ENGINES).toHaveLength(11);
  });
});