// V4896-V4905: CK CDN Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  TLSOptimizer,
  HTTP3QUICManager,
  CompressionEngine,
  ImageOptimizer,
  VideoStreamingOptimizer,
  RangeRequestHandler,
  PrefetchPredictor,
  BandwidthMonitor,
  EdgeWorker,
  CDNAdvancedIndex,
  CK_BATCH_2_ENGINES
} from './CDNAdvanced';

describe('TLSOptimizer', () => {
  it('default + allow + isAllowed', () => {
    const t = new TLSOptimizer();
    expect(t.isAllowed('TLSv1.3')).toBe(true);
    expect(t.isAllowed('TLSv1.0')).toBe(false);
    t.allowProtocol('TLSv1.0');
    expect(t.isAllowed('TLSv1.0')).toBe(true);
  });

  it('pickBest respects priority', () => {
    const t = new TLSOptimizer();
    expect(t.pickBest(['TLSv1.1', 'TLSv1.2'])).toBe('TLSv1.2');
    expect(t.pickBest(['TLSv1.3', 'TLSv1.2'])).toBe('TLSv1.3');
    expect(t.pickBest([])).toBe('TLSv1.2');
  });

  it('enabledProtocols + disableAll', () => {
    const t = new TLSOptimizer();
    expect(t.enabledProtocols()).toContain('TLSv1.3');
    t.disableAll();
    expect(t.enabledProtocols()).toEqual([]);
  });
});

describe('HTTP3QUICManager', () => {
  it('openStream + send + receive + close', () => {
    const q = new HTTP3QUICManager();
    const id = q.openStream('init');
    expect(q.send(id, ' more')).toBe(true);
    expect(q.receive(id, 4)).toBe('init');
    q.closeStream(id);
    expect(q.activeStreams()).toBe(0);
  });

  it('send on closed stream returns false', () => {
    const q = new HTTP3QUICManager();
    expect(q.send(999, 'x')).toBe(false);
    expect(q.receive(999, 10)).toBe('');
  });
});

describe('CompressionEngine', () => {
  it('RLE compress + decompress', () => {
    const c = new CompressionEngine();
    const orig = 'aaabbc';
    const comp = c.compress(orig);
    expect(c.decompress(comp)).toBe(orig);
  });

  it('ratio + empty', () => {
    const c = new CompressionEngine();
    expect(c.ratio('hello', 'h1')).toBeCloseTo(0.4);
    expect(c.ratio('', '')).toBe(0);
    expect(c.compress('')).toBe('');
    expect(c.decompress('')).toBe('');
  });

  it('gzip + brotli labels', () => {
    const c = new CompressionEngine();
    expect(c.gzip('x')).toMatch(/^gz:/);
    expect(c.brotli('x')).toMatch(/^br:/);
  });
});

describe('ImageOptimizer', () => {
  it('resize preserves aspect', () => {
    const img = new ImageOptimizer();
    const r = img.resize(200, 100, 100, 100);
    expect(r.w).toBe(100);
    expect(r.h).toBe(50);
  });

  it('toWebP + toAvif + lazy + srcset', () => {
    const img = new ImageOptimizer();
    expect(img.toWebP(50)).toEqual({ format: 'webp', quality: 50 });
    expect(img.toAvif(150)).toEqual({ format: 'avif', quality: 100 });
    expect(img.lazy(false)).toEqual({ loading: 'lazy' });
    expect(img.srcset('/x.jpg', [100, 200])).toBe('/x.jpg 100w, /x.jpg 200w');
  });
});

describe('VideoStreamingOptimizer', () => {
  it('addBitrate + pickBitrate + ladder', () => {
    const v = new VideoStreamingOptimizer();
    v.addBitrate(500).addBitrate(1000).addBitrate(2000);
    expect(v.pickBitrate(800)).toBe(500);
    expect(v.pickBitrate(1500)).toBe(1000);
    expect(v.ladder()).toEqual([500, 1000, 2000]);
  });

  it('segment returns timestamps', () => {
    const v = new VideoStreamingOptimizer();
    expect(v.segment(1000)).toHaveLength(10);
    expect(v.segment(1000)[0]).toBe(0);
    expect(v.segment(1000)[3]).toBe(3000);
  });
});

describe('RangeRequestHandler', () => {
  it('parse + slice + buildHeader', () => {
    const r = new RangeRequestHandler();
    const range = r.parse('bytes=0-99');
    expect(range).toEqual({ start: 0, end: 99 });
    expect(r.slice('Hello, World!', { start: 7, end: 11 })).toBe('World');
    expect(r.buildHeader({ start: 0, end: 99 }, 1000)).toBe('bytes 0-99/1000');
  });

  it('parse null + isPartial', () => {
    const r = new RangeRequestHandler();
    expect(r.parse('invalid')).toBeNull();
    expect(r.isPartial({ start: 0, end: 0 })).toBe(false);
    expect(r.isPartial({ start: 1, end: 0 })).toBe(true);
  });
});

describe('PrefetchPredictor', () => {
  it('record + predict + rank', () => {
    const p = new PrefetchPredictor();
    p.record('/a');
    p.record('/b');
    p.record('/a');
    p.record('/a');
    expect(p.predict('/x')).toBe('/a');
    expect(p.rank()[0]).toEqual({ url: '/a', count: 3 });
  });

  it('empty predict returns null', () => {
    const p = new PrefetchPredictor();
    expect(p.predict('/x')).toBeNull();
    p.clear();
    expect(p.rank()).toEqual([]);
  });
});

describe('BandwidthMonitor', () => {
  it('record + average + peak + p95 + sampleCount + reset', () => {
    const b = new BandwidthMonitor();
    b.record(100); b.record(200); b.record(300);
    expect(b.average()).toBe(200);
    expect(b.peak()).toBe(300);
    expect(b.sampleCount()).toBe(3);
    b.reset();
    expect(b.sampleCount()).toBe(0);
    expect(b.average()).toBe(0);
    expect(b.peak()).toBe(0);
    expect(b.p95()).toBe(0);
  });

  it('p95 with more samples', () => {
    const b = new BandwidthMonitor();
    for (let i = 1; i <= 100; i++) b.record(i);
    expect(b.p95()).toBeGreaterThanOrEqual(94);
    expect(b.p95()).toBeLessThanOrEqual(96);
  });
});

describe('EdgeWorker', () => {
  it('register + fetch + paths + hasPath + clear', () => {
    const w = new EdgeWorker();
    w.register('/api', () => ({ status: 200, body: 'ok' }));
    expect(w.fetch({ url: '/api', method: 'GET' })).toEqual({ status: 200, body: 'ok' });
    expect(w.fetch({ url: '/missing', method: 'GET' })).toEqual({ status: 404, body: 'Not Found' });
    expect(w.paths()).toEqual(['/api']);
    expect(w.hasPath('/api')).toBe(true);
    w.clear();
    expect(w.paths()).toEqual([]);
  });
});

describe('CDNAdvancedIndex', () => {
  it('list has 10', () => {
    expect(new CDNAdvancedIndex().list()).toHaveLength(10);
  });

  it('count 10 + engines + has', () => {
    const idx = new CDNAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('TLSOptimizer')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CK_BATCH_2_ENGINES const has 10', () => {
    expect(CK_BATCH_2_ENGINES).toHaveLength(10);
  });
});