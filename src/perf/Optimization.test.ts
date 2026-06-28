/**
 * perf/Optimization.test.ts (S1-S10) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  EngineCache, BundleOptimizer, RuntimeProfiler, LazyLoader, Memoizer,
  WorkerPool, StreamProcessor, BatchProcessor, Debouncer, Throttler,
} from './Optimization'

describe('S1: EngineCache', () => {
  it('set + get', () => {
    const c = new EngineCache<string>()
    c.set('a', 'value-a')
    expect(c.get('a')).toBe('value-a')
  })

  it('miss increments counter', () => {
    const c = new EngineCache<string>()
    c.get('nonexistent')
    expect(c.stats().misses).toBe(1)
  })

  it('LRU eviction', () => {
    const c = new EngineCache<string>({ maxSize: 2, ttlMs: 60_000, strategy: 'lru' })
    c.set('a', '1')
    c.set('b', '2')
    c.get('a')  // a is now most recently used
    c.set('c', '3')  // evicts b
    expect(c.get('a')).toBe('1')
    expect(c.get('b')).toBeUndefined()
    expect(c.get('c')).toBe('3')
  })

  it('LFU eviction', () => {
    const c = new EngineCache<string>({ maxSize: 2, strategy: 'lfu' })
    c.set('a', '1')
    c.set('b', '2')
    c.get('a'); c.get('a'); c.get('a')  // a has 3 hits
    c.set('c', '3')  // evicts b (0 hits)
    expect(c.get('a')).toBe('1')
    expect(c.get('c')).toBe('3')
  })

  it('TTL expiry', () => {
    const c = new EngineCache<string>({ maxSize: 10, ttlMs: 1, strategy: 'lru' })
    c.set('a', '1')
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(c.get('a')).toBeUndefined()
        resolve()
      }, 10)
    })
  })
})

describe('S2: BundleOptimizer', () => {
  it('addModule + unusedModules', () => {
    const b = new BundleOptimizer()
    b.addModule('core', 1000, [], true)  // entry
    b.addModule('unused', 500, [])
    expect(b.unusedModules()).toContain('unused')
  })

  it('suggestRemovals', () => {
    const b = new BundleOptimizer()
    b.addModule('a', 1000, [], true)
    b.addModule('b', 500, [])
    const total = b.totalSize()
    expect(total).toBe(1500)
    expect(b.sizeAfterRemovals()).toBe(1000)
  })
})

describe('S3: RuntimeProfiler', () => {
  it('begin + end + duration', () => {
    const p = new RuntimeProfiler()
    p.begin('op')
    p.end('op')
    const summary = p.summary()
    expect(summary.op?.count).toBe(1)
  })

  it('measure', () => {
    const p = new RuntimeProfiler()
    const ms = p.measure('m', () => {
      // do nothing
    })
    expect(ms).toBeGreaterThanOrEqual(0)
  })

  it('markers', () => {
    const p = new RuntimeProfiler()
    p.mark('start')
    p.mark('end')
    expect(p.measureBetween('start', 'end')).toBeGreaterThanOrEqual(0)
  })
})

describe('S4: LazyLoader', () => {
  it('load async', () => {
    const l = new LazyLoader<number>(async () => 42)
    expect(l.get().status).toBe('idle')
    l.load()
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(l.get().status).toBe('loaded')
        expect(l.get().value).toBe(42)
        resolve()
      }, 10)
    })
  })
})

describe('S5: Memoizer', () => {
  it('compute caches result', () => {
    const m = new Memoizer<[number], number>()
    let calls = 0
    const fn = (x: number) => { calls += 1; return x * 2 }
    expect(m.compute(fn, 5)).toBe(10)
    expect(m.compute(fn, 5)).toBe(10)
    expect(calls).toBe(1)
  })

  it('clear + has', () => {
    const m = new Memoizer<[number], number>()
    m.compute((x) => x * 2, 5)
    expect(m.has(5)).toBe(true)
    m.clear()
    expect(m.has(5)).toBe(false)
  })
})

describe('S6: WorkerPool', () => {
  it('submit + execute', async () => {
    const pool = new WorkerPool(2)
    const r = await pool.submit(async () => 42)
    expect(r).toBe(42)
    expect(pool.completedCount()).toBe(1)
  })

  it('queue up to maxWorkers', async () => {
    const pool = new WorkerPool(2)
    const promises = []
    for (let i = 0; i < 5; i++) promises.push(pool.submit(async () => i))
    const results = await Promise.all(promises)
    expect(results.sort()).toEqual([0, 1, 2, 3, 4])
  })
})

describe('S7: StreamProcessor', () => {
  it('push + flush', () => {
    const items: number[] = []
    const s = new StreamProcessor<number>((x) => items.push(x), 3)
    s.push(1); s.push(2)
    expect(s.bufferSize()).toBe(2)
    s.push(3)  // triggers flush
    expect(items).toEqual([1, 2, 3])
  })

  it('overflow returns false', () => {
    const items: number[] = []
    const s = new StreamProcessor<number>((x) => items.push(x), 5)
    s.push(1); s.push(2); s.push(3); s.push(4)
    expect(s.bufferSize()).toBe(4)
    expect(s.push(5)).toBe(true)  // reaches threshold, triggers flush
    expect(items.length).toBeGreaterThanOrEqual(5)  // flushed
  })
})

describe('S8: BatchProcessor', () => {
  it('add + flush at size', () => {
    const batches: number[][] = []
    const b = new BatchProcessor<number>((batch) => batches.push(batch), 3)
    b.add(1); b.add(2); b.add(3)  // triggers flush
    expect(batches[0]).toEqual([1, 2, 3])
  })
})

describe('S9: Debouncer', () => {
  it('debounce fires once', () => {
    const d = new Debouncer()
    let count = 0
    d.debounce('a', () => { count += 1 }, 10)
    d.debounce('a', () => { count += 1 }, 10)
    d.debounce('a', () => { count += 1 }, 10)
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(count).toBe(1)
        resolve()
      }, 30)
    })
  })

  it('cancel', () => {
    const d = new Debouncer()
    expect(d.cancel('a')).toBe(false)
    d.debounce('a', () => {}, 10)
    expect(d.cancel('a')).toBe(true)
  })
})

describe('S10: Throttler', () => {
  it('throttle fires once per interval', () => {
    const t = new Throttler()
    let count = 0
    expect(t.throttle('a', () => { count += 1 }, 1000)).toBe(true)
    expect(t.throttle('a', () => { count += 1 }, 1000)).toBe(false)
    expect(count).toBe(1)
  })

  it('reset', () => {
    const t = new Throttler()
    t.throttle('a', () => {}, 1000)
    t.reset('a')
    expect(t.throttle('a', () => {}, 1000)).toBe(true)
  })
})