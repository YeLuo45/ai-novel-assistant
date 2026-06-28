/**
 * perf/demo/optimization-demo.test.ts (S26)
 */

import { describe, it, expect } from 'vitest'
import { runOptimizationDemo } from './optimization-demo'

describe('optimization-demo', () => {
  it('cache has 3 hits', () => expect(runOptimizationDemo().then(r => r.cacheHits)).resolves.toBe(3))
  it('cache size 2', () => expect(runOptimizationDemo().then(r => r.cacheSize)).resolves.toBe(2))
  it('bundle savings 800', () => expect(runOptimizationDemo().then(r => r.bundleSavings)).resolves.toBe(800))
  it('profile 2 ops', () => expect(runOptimizationDemo().then(r => r.profileOps)).resolves.toBe(2))
  it('lazy loaded', () => expect(runOptimizationDemo().then(r => r.lazyLoaded)).resolves.toBe(true))
  it('memoized 5 entries', () => expect(runOptimizationDemo().then(r => r.memoized)).resolves.toBe(5))
  it('3 workers completed', () => expect(runOptimizationDemo().then(r => r.workersCompleted)).resolves.toBe(3))
  it('stream processed 5', () => expect(runOptimizationDemo().then(r => r.streamProcessed)).resolves.toBe(5))
  it('batch size 3', () => expect(runOptimizationDemo().then(r => r.batchSize)).resolves.toBe(3))
  it('debounce fired once', () => expect(runOptimizationDemo().then(r => r.debouncePending)).resolves.toBe(1))
  it('throttle fired once', () => expect(runOptimizationDemo().then(r => r.throttleFired)).resolves.toBe(1))
  it('pool size 2', () => expect(runOptimizationDemo().then(r => r.poolSize)).resolves.toBe(2))
  it('object reuse size 2', () => expect(runOptimizationDemo().then(r => r.objectReuseSize)).resolves.toBe(2))
  it('gc 1 request', () => expect(runOptimizationDemo().then(r => r.gcRequests)).resolves.toBe(1))
  it('heap total 300', () => expect(runOptimizationDemo().then(r => r.heapTotalSize)).resolves.toBe(300))
  it('2 hot types', () => expect(runOptimizationDemo().then(r => r.hotTypes)).resolves.toBe(2))
  it('render cache 1', () => expect(runOptimizationDemo().then(r => r.renderCacheSize)).resolves.toBe(0))
  it('computed 1 call', () => expect(runOptimizationDemo().then(r => r.computedCalls)).resolves.toBe(1))
  it('eviction victim b (LRU oldest)', () => expect(runOptimizationDemo().then(r => r.evictionVictim)).resolves.toBe('b'))
  it('read-through strategy', () => expect(runOptimizationDemo().then(r => r.strategyName)).resolves.toBe('read-through'))
  it('3 warmed', () => expect(runOptimizationDemo().then(r => r.warmedCount)).resolves.toBe(3))
  it('2 chunks', () => expect(runOptimizationDemo().then(r => r.totalChunks)).resolves.toBe(2))
  it('1 route', () => expect(runOptimizationDemo().then(r => r.routesCount)).resolves.toBe(1))
  it('lazy import loaded', () => expect(runOptimizationDemo().then(r => r.lazyImportsLoaded)).resolves.toBe(1))
  it('1 shaken', () => expect(runOptimizationDemo().then(r => r.shakenCount)).resolves.toBe(1))
  it('2 topo order', () => expect(runOptimizationDemo().then(r => r.topoOrder)).resolves.toBe(2))
  it('end-to-end summary', () => expect(runOptimizationDemo().then(r => r.cacheHits + r.workersCompleted + r.lazyImportsLoaded)).resolves.toBeGreaterThan(3))
})