import { describe, it, expect } from 'vitest';
import { createCacheSnapshotState, snapshotCache, restoreCacheSnapshot, currentCacheSnap, deleteCacheSnapshot, cacheSnapChain, cacheSnapshotHealth } from './CacheSnapshot';

describe('V2243 CacheSnapshot', () => {
  it('should create empty state', () => {
    const s = createCacheSnapshotState();
    expect(s.snapshots).toEqual([]);
  });

  it('should snapshot', () => {
    const { state, snap } = snapshotCache(createCacheSnapshotState(), 'v1', 100, 5000);
    expect(state.snapshots).toHaveLength(1);
    expect(snap.entryCount).toBe(100);
  });

  it('should restore snapshot', () => {
    let s = createCacheSnapshotState();
    const a = snapshotCache(s, 'v1', 10, 500);
    s = a.state;
    const b = snapshotCache(s, 'v2', 20, 1000, a.snap.id);
    s = b.state;
    const r = restoreCacheSnapshot(s, a.snap.id);
    expect(r.currentId).toBe(a.snap.id);
  });

  it('should get current snap', () => {
    let s = createCacheSnapshotState();
    s = snapshotCache(s, 'v1', 10, 500).state;
    expect(currentCacheSnap(s)?.label).toBe('v1');
  });

  it('should not delete current', () => {
    let s = createCacheSnapshotState();
    s = snapshotCache(s, 'v1', 10, 500).state;
    const cur = s.currentId!;
    const d = deleteCacheSnapshot(s, cur);
    expect(d.snapshots).toHaveLength(1);
  });

  it('should compute chain', () => {
    let s = createCacheSnapshotState();
    const a = snapshotCache(s, 'v1', 10, 500);
    s = a.state;
    const b = snapshotCache(s, 'v2', 20, 1000, a.snap.id);
    s = b.state;
    expect(cacheSnapChain(s, b.snap.id)).toHaveLength(2);
  });

  it('should compute health', () => {
    let s = createCacheSnapshotState();
    s = snapshotCache(s, 'v1', 10, 500).state;
    const h = cacheSnapshotHealth(s);
    expect(h.current).toBe(true);
  });
});
