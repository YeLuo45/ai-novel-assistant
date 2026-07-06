// V5016-V5025: CO Smart Cache Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  PredictivePrefetch,
  CacheStampede,
  LockManager,
  RefreshAhead,
  WriteBehind,
  CacheCoherence,
  DistributedCache,
  CacheReplication,
  CacheInvalidator,
  SmartCacheAdvancedIndex,
  CO_BATCH_2_ENGINES
} from './SmartCacheAdvanced';

describe('PredictivePrefetch', () => {
  it('recordAccess + recordSequence + predictNext + topKeys + sequenceCount + clear', () => {
    const p = new PredictivePrefetch();
    p.recordAccess('a'); p.recordAccess('a'); p.recordAccess('b');
    p.recordSequence(['a', 'b', 'c']);
    p.recordSequence(['a', 'x', 'y']);
    expect(p.predictNext('a')).toBe('b'); // first match wins
    expect(p.predictNext('b')).toBe('c');
    expect(p.predictNext('missing')).toBeNull();
    expect(p.topKeys(1)).toEqual(['a']);
    expect(p.sequenceCount()).toBe(2);
    p.clear();
    expect(p.sequenceCount()).toBe(0);
  });
});

describe('CacheStampede + LockManager', () => {
  it('CacheStampede tryAcquire + release + isLocked + waitingCount', () => {
    const s = new CacheStampede();
    expect(s.tryAcquire('k1')).toBe(true);
    expect(s.tryAcquire('k1')).toBe(false);
    expect(s.isLocked('k1')).toBe(true);
    expect(s.isLocked('missing')).toBe(false);
    expect(s.waitingCount('missing')).toBe(0);
    s.release('k1');
    expect(s.isLocked('k1')).toBe(false);
  });

  it('CacheStampede waitFor', async () => {
    const s = new CacheStampede();
    expect(await s.waitFor('k1', 100)).toBe(true);
    expect(s.isLocked('k1')).toBe(true);
    s.release('k1');
  });

  it('CacheStampede release hands off lock to waiter', async () => {
    const s = new CacheStampede();
    expect(s.tryAcquire('k1')).toBe(true);
    const waitPromise = s.waitFor('k1', 5000);
    // Wait a tick to ensure waiter is registered
    await new Promise(r => setTimeout(r, 10));
    expect(s.waitingCount('k1')).toBe(1);
    s.release('k1'); // should hand off to waiter
    expect(await waitPromise).toBe(true);
    expect(s.isLocked('k1')).toBe(true);
  });

  it('CacheStampede waitFor timeout', async () => {
    const s = new CacheStampede();
    s.tryAcquire('k1');
    expect(await s.waitFor('k1', 30)).toBe(false);
  });

  it('LockManager basic', () => {
    const l = new LockManager();
    expect(l.acquire('k')).toBe(true);
    expect(l.acquire('k')).toBe(false);
    expect(l.isLocked('k')).toBe(true);
    expect(l.lockCount()).toBe(1);
    expect(l.release('k')).toBe(true);
    l.clear();
  });
});

describe('RefreshAhead', () => {
  it('register + needsRefresh + refresh + age + count', async () => {
    const r = new RefreshAhead();
    expect(r.count()).toBe(0);
    r.register('k1', async () => {});
    expect(r.needsRefresh('k1', 100)).toBe(true);
    expect(await r.refresh('k1')).toBe(true);
    expect(r.needsRefresh('k1', 100)).toBe(false);
    expect(r.age('k1')).toBeGreaterThanOrEqual(0);
    expect(await r.refresh('missing')).toBe(false);
  });
});

describe('WriteBehind', () => {
  it('enqueue + flush + size + pendingKeys + clear', async () => {
    const w = new WriteBehind();
    w.enqueue('a', 1).enqueue('b', 2);
    expect(w.size()).toBe(2);
    expect(w.pendingKeys().sort()).toEqual(['a', 'b']);
    const flushed: Array<[string, unknown]> = [];
    const n = await w.flush(async (k, v) => { flushed.push([k, v]); });
    expect(n).toBe(2);
    expect(w.size()).toBe(0);
    w.enqueue('c', 3);
    w.clear();
    expect(w.size()).toBe(0);
  });
});

describe('CacheCoherence', () => {
  it('write + version + isStale + reset + trackedKeys', () => {
    const c = new CacheCoherence();
    expect(c.version('k')).toBe(0);
    expect(c.write('k')).toBe(1);
    expect(c.write('k')).toBe(2);
    expect(c.isStale('k', 1)).toBe(true);
    expect(c.isStale('k', 3)).toBe(false);
    c.reset('k');
    expect(c.version('k')).toBe(0);
    expect(c.trackedKeys()).toEqual([]);
  });
});

describe('DistributedCache + CacheReplication + CacheInvalidator', () => {
  it('DistributedCache addNode + put + get + nodes + size + totalEntries', () => {
    const d = new DistributedCache();
    d.addNode('n1').addNode('n2');
    d.put('n1', 'k', 1);
    expect(d.get('n1', 'k')).toBe(1);
    expect(d.get('missing', 'k')).toBeUndefined();
    expect(d.put('missing', 'k', 1)).toBe(false);
    expect(d.nodes().sort()).toEqual(['n1', 'n2']);
    expect(d.size('n1')).toBe(1);
    expect(d.totalEntries()).toBe(1);
  });

  it('CacheReplication put + get + replica', () => {
    const r = new CacheReplication(2);
    r.put('k', 1);
    r.addReplica('r1');
    r.addReplica('r2');
    expect(r.get('k')).toBe(1);
    expect(r.replicaCount()).toBe(2);
    expect(r.replicationFactor()).toBe(2);
    expect(r.size()).toBe(1);
    // Read from replicas (not in primary)
    const r2 = new CacheReplication(1);
    r2.addReplica('r1');
    (r2 as unknown as { _replicas: Map<string, Map<string, unknown>> })._replicas.get('r1')!.set('onlyInReplica', 'value');
    expect(r2.get('onlyInReplica')).toBe('value');
    // Missing everywhere
    expect(r2.get('missing')).toBeUndefined();
  });

  it('CacheInvalidator set + get + invalidate + invalidateByPrefix', () => {
    const i = new CacheInvalidator();
    i.set('user:1', 'a').set('user:2', 'b').set('post:1', 'c');
    expect(i.get('user:1')).toBe('a');
    expect(i.invalidate('user:1')).toBe(true);
    expect(i.invalidate('missing')).toBe(false);
    expect(i.invalidateByPrefix('user:')).toBe(1);
    expect(i.size()).toBe(1);
    i.clear();
    expect(i.size()).toBe(0);
  });
});

describe('SmartCacheAdvancedIndex', () => {
  it('list has 10', () => {
    expect(new SmartCacheAdvancedIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new SmartCacheAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('PredictivePrefetch')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CO_BATCH_2_ENGINES const has 10', () => {
    expect(CO_BATCH_2_ENGINES).toHaveLength(10);
  });
});