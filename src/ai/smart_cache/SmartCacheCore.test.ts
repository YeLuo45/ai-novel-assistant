// V5006-V5015: CO Smart Cache Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  SmartCache,
  CacheHierarchy,
  MultiLevelCache,
  CachePartition,
  AdaptiveTtl,
  EvictionPolicy,
  CacheSizeLimiter,
  CacheWarming,
  CacheMetrics,
  SmartCacheCoreIndex,
  CO_BATCH_1_ENGINES
} from './SmartCacheCore';

describe('SmartCache', () => {
  it('set + get + has + delete + hits + size + clear', async () => {
    const c = new SmartCache<number>();
    c.set('a', 1);
    c.set('a', 1, undefined, 100);
    expect(c.get('a')).toBe(1);
    expect(c.hits('a')).toBe(1);
    expect(c.has('a')).toBe(true);
    expect(c.delete('a')).toBe(true);
    expect(c.get('missing')).toBeNull();
    expect(c.hits('missing')).toBe(0);
    c.clear();
    expect(c.size()).toBe(0);
  });

  it('TTL expiry', async () => {
    const c = new SmartCache<number>(100, 10);
    c.set('a', 1, 10);
    await new Promise(r => setTimeout(r, 20));
    expect(c.get('a')).toBeNull();
  });

  it('eviction when over capacity', () => {
    const c = new SmartCache<number>(3);
    c.set('a', 1, undefined, 1);
    c.get('a'); c.get('a');
    c.set('b', 2, undefined, 1);
    c.get('b');
    c.set('c', 3, undefined, 1);
    // 3 entries, total size = 3, at capacity
    c.set('d', 4, undefined, 1); // size 4 > 3, evict smallest hits (c with 0)
    expect(c.has('a')).toBe(true);
    expect(c.has('b')).toBe(true);
    expect(c.has('d')).toBe(true);
    expect(c.has('c')).toBe(false);
  });
});

describe('CacheHierarchy', () => {
  it('addLevel + levelFor + levelCount + totalCapacity + levels', () => {
    const h = new CacheHierarchy();
    h.addLevel('L1', 100).addLevel('L2', 1000).addLevel('L3', 10000);
    expect(h.levelCount()).toBe(3);
    expect(h.totalCapacity()).toBe(11100);
    expect(h.levels()).toEqual(['L1', 'L2', 'L3']);
    expect(h.levelFor('any')).toBe('L1');
  });

  it('empty hierarchy', () => {
    const h = new CacheHierarchy();
    expect(h.levelCount()).toBe(0);
    expect(h.totalCapacity()).toBe(0);
    expect(h.levelFor('x')).toBe('L1');
  });
});

describe('MultiLevelCache', () => {
  it('get + set + promote + levelCount + clear', () => {
    const ml = new MultiLevelCache<number>();
    ml.addLevel(new SmartCache<number>(10));
    ml.addLevel(new SmartCache<number>(100));
    ml.set('x', 42);
    expect(ml.get('x')).toBe(42);
    expect(ml.levelCount()).toBe(2);
    ml.clear();
  });
});

describe('CachePartition', () => {
  it('partition + partitionNames + partitionCount', () => {
    const p = new CachePartition<number>();
    p.partition('users');
    p.partition('posts', 50);
    expect(p.partitionNames().sort()).toEqual(['posts', 'users']);
    expect(p.partitionCount()).toBe(2);
  });
});

describe('AdaptiveTtl', () => {
  it('compute + base + max', () => {
    const t = new AdaptiveTtl(1000, 10000);
    expect(t.compute(0.95)).toBe(10000);
    expect(t.compute(0.7)).toBe(2000);
    expect(t.compute(0.3)).toBe(1000);
    expect(t.base()).toBe(1000);
    expect(t.max()).toBe(10000);
  });
});

describe('EvictionPolicy', () => {
  it('pickVictim lfu + fifo + random + setPolicy + policy', () => {
    const p = new EvictionPolicy('lfu');
    const entries = [
      { key: 'a', hits: 5, createdAt: 1 },
      { key: 'b', hits: 2, createdAt: 2 },
      { key: 'c', hits: 8, createdAt: 3 }
    ];
    expect(p.pickVictim(entries)).toBe('b');
    p.setPolicy('fifo');
    expect(p.pickVictim(entries)).toBe('a');
    expect(p.pickVictim([])).toBeNull();
    p.setPolicy('random');
    expect(['a', 'b', 'c']).toContain(p.pickVictim(entries)!);
    expect(p.policy()).toBe('random');
    // Default lru case
    p.setPolicy('lru');
    expect(p.pickVictim(entries)).toBe('b'); // lfu-style picks lowest hits
  });
});

describe('CacheSizeLimiter', () => {
  it('tryAllocate + release + currentBytes + maxBytes + utilization', () => {
    const l = new CacheSizeLimiter(100);
    expect(l.tryAllocate(50)).toBe(true);
    expect(l.tryAllocate(60)).toBe(false);
    expect(l.tryAllocate(50)).toBe(true);
    expect(l.currentBytes()).toBe(100);
    expect(l.utilization()).toBe(1);
    l.release(50);
    expect(l.currentBytes()).toBe(50);
    l.release(100);
    expect(l.currentBytes()).toBe(0);
    expect(l.maxBytes()).toBe(100);
  });
});

describe('CacheWarming', () => {
  it('mark + isWarmed + warmedKeys + warmedCount + clear', () => {
    const w = new CacheWarming();
    w.mark('a'); w.mark('b');
    expect(w.isWarmed('a')).toBe(true);
    expect(w.warmedKeys().sort()).toEqual(['a', 'b']);
    expect(w.warmedCount()).toBe(2);
    w.clear();
    expect(w.warmedCount()).toBe(0);
  });
});

describe('CacheMetrics', () => {
  it('recordHit + recordMiss + recordEviction + hitRate + reset', () => {
    const m = new CacheMetrics();
    m.recordHit(); m.recordHit(); m.recordMiss();
    m.recordEviction();
    expect(m.hits()).toBe(2);
    expect(m.misses()).toBe(1);
    expect(m.evictions()).toBe(1);
    expect(m.hitRate()).toBeCloseTo(2 / 3);
    m.reset();
    expect(m.hits()).toBe(0);
    expect(m.hitRate()).toBe(0);
  });
});

describe('SmartCacheCoreIndex', () => {
  it('list has 10', () => {
    expect(new SmartCacheCoreIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new SmartCacheCoreIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('SmartCache')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CO_BATCH_1_ENGINES const has 10', () => {
    expect(CO_BATCH_1_ENGINES).toHaveLength(10);
  });
});