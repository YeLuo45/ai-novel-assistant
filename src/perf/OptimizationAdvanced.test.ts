/**
 * perf/OptimizationAdvanced.test.ts (S11-S25) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  MemoryPool, ObjectReuse, GCHint, HeapAnalyzer, AllocationProfiler,
  RenderCache, ComputedSelector, CacheEviction, CacheStrategyExecutor, CacheWarmer,
  BundleSplitter, CodeSplitter, LazyImporter, TreeShakingHint, ModuleGraph,
} from './OptimizationAdvanced'

describe('S11: MemoryPool', () => {
  it('acquire + release', () => {
    const pool = new MemoryPool<{ id: number }>(() => ({ id: 0 }))
    const obj = pool.acquire()
    expect(obj.object).toBeDefined()
    pool.release(obj)
    expect(pool.size()).toBe(1)
  })
})

describe('S12: ObjectReuse', () => {
  it('getOrCreate returns same', () => {
    const r = new ObjectReuse()
    const a = r.getOrCreate('x', () => ({ id: 1 }))
    const b = r.getOrCreate('x', () => ({ id: 2 }))
    expect(a).toBe(b)
  })
})

describe('S13: GCHint', () => {
  it('hintGC increments', () => {
    const g = new GCHint()
    g.hintGC()
    expect(g.gcRequested()).toBe(1)
  })

  it('estimateMemoryPressure', () => {
    const g = new GCHint()
    expect(g.estimateMemoryPressure(50, 100)).toBe('medium')
    expect(g.estimateMemoryPressure(95, 100)).toBe('critical')
  })
})

describe('S14: HeapAnalyzer', () => {
  it('snapshot + diff', () => {
    const h = new HeapAnalyzer()
    const s1 = h.takeSnapshot([{ type: 'A', size: 100 }, { type: 'B', size: 200 }])
    const s2 = h.takeSnapshot([{ type: 'A', size: 150 }, { type: 'B', size: 200 }])
    const diff = h.diff(s1, s2)
    expect(diff.sizeDelta).toBe(50)
  })
})

describe('S15: AllocationProfiler', () => {
  it('hotTypes', () => {
    const p = new AllocationProfiler()
    p.record('A', 5)
    p.record('A', 3)
    p.record('B', 10)
    expect(p.hotTypes()[0]?.type).toBe('B')
  })
})

describe('S16: RenderCache', () => {
  it('get caches value', () => {
    let calls = 0
    const c = new RenderCache<string>(() => { calls += 1; return 'rendered' })
    expect(c.get('a')).toBe('rendered')
    expect(c.get('a')).toBe('rendered')
    expect(calls).toBe(1)
  })
})

describe('S17: ComputedSelector', () => {
  it('compute caches result', () => {
    let calls = 0
    const sel = new ComputedSelector<{ x: number }, number>((s) => { calls += 1; return s.x * 2 })
    sel.compute({ x: 5 })
    sel.compute({ x: 5 })  // same state → cached
    expect(calls).toBe(1)
  })

  it('invalidate', () => {
    let calls = 0
    const sel = new ComputedSelector<{ x: number }, number>((s) => { calls += 1; return s.x })
    sel.compute({ x: 1 })
    sel.invalidate()
    sel.compute({ x: 1 })
    expect(calls).toBe(2)
  })
})

describe('S18: CacheEviction', () => {
  it('LRU victim', () => {
    const victims = [
      { key: 'a', hits: 5, lastUsed: 100, expiresAt: 0 },
      { key: 'b', hits: 5, lastUsed: 50, expiresAt: 0 },
    ]
    expect(CacheEviction.selectVictim(victims, 'lru')).toBe('b')
  })

  it('LFU victim', () => {
    const victims = [
      { key: 'a', hits: 10, lastUsed: 0, expiresAt: 0 },
      { key: 'b', hits: 1, lastUsed: 0, expiresAt: 0 },
    ]
    expect(CacheEviction.selectVictim(victims, 'lfu')).toBe('b')
  })
})

describe('S19: CacheStrategy', () => {
  it('cache-aside hit/miss', () => {
    const cs = new CacheStrategyExecutor('cache-aside', (k) => `loaded-${k}`)
    expect(cs.get('x')).toBe('loaded-x')
  })

  it('read-through caches value', () => {
    let calls = 0
    const cs = new CacheStrategyExecutor('read-through', (k) => { calls += 1; return `loaded-${k}` })
    cs.get('x')
    cs.get('x')
    expect(calls).toBe(1)  // cached after first
  })
})

describe('S20: CacheWarmer', () => {
  it('warm + isWarmed', () => {
    const w = new CacheWarmer()
    w.warm(['a', 'b'], (k) => `val-${k}`)
    expect(w.isWarmed('a')).toBe(true)
    expect(w.warmedCount()).toBe(2)
  })
})

describe('S21: BundleSplitter', () => {
  it('createChunk + totalSize', () => {
    const b = new BundleSplitter()
    b.createChunk('vendor', ['react', 'lodash'], 0)
    b.createChunk('app', ['./App', './main'], 1)
    expect(b.totalSize()).toBe(400)
  })

  it('chunkForModule', () => {
    const b = new BundleSplitter()
    b.createChunk('vendor', ['react'])
    expect(b.chunkForModule('react')).toBe('vendor')
  })

  it('chunksByPriority', () => {
    const b = new BundleSplitter()
    b.createChunk('lazy', ['./lazy'], 10)
    b.createChunk('vendor', ['react'], 0)
    const sorted = b.chunksByPriority()
    expect(sorted[0]?.chunkId).toBe('vendor')
  })
})

describe('S22: CodeSplitter', () => {
  it('setRoute + suggestSplit', () => {
    const c = new CodeSplitter()
    c.setRoute('/home', ['./Header', './Footer', './Sidebar', './Content'])
    const split = c.suggestSplit('/home')
    expect(split.beforeImports.length).toBe(2)
    expect(split.afterImports.length).toBe(2)
  })
})

describe('S23: LazyImporter', () => {
  it('get loads async', async () => {
    const li = new LazyImporter<number>(async () => 42)
    const v = await li.get()
    expect(v).toBe(42)
    expect(li.isLoaded()).toBe(true)
  })
})

describe('S24: TreeShakingHint', () => {
  it('shake removes unused', () => {
    const t = new TreeShakingHint()
    t.registerExports('utils', [{ name: 'used', size: 100 }, { name: 'unused', size: 200 }])
    t.markUsed('utils.used')
    const r = t.shake()
    expect(r.kept).toContain('utils.used')
    expect(r.shaken).toContain('utils.unused')
    expect(r.savedBytes).toBe(200)
  })
})

describe('S25: ModuleGraph', () => {
  it('findCycles', () => {
    const g = new ModuleGraph()
    g.addModule({ moduleId: 'a', size: 100, imports: ['b'] })
    g.addModule({ moduleId: 'b', size: 100, imports: ['a'] })
    expect(g.findCycles().length).toBeGreaterThan(0)
  })

  it('topologicalOrder', () => {
    const g = new ModuleGraph()
    g.addModule({ moduleId: 'a', size: 100, imports: [] })
    g.addModule({ moduleId: 'b', size: 100, imports: ['a'] })
    const order = g.topologicalOrder()
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'))
  })
})