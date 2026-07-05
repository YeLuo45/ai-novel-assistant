// Round 8 Direction CE — Offline-First Storage 2.0 Batch 1/3 test
// V4706-V4715: 10 engines

import { describe, it, expect } from 'vitest';
import {
  LocalStorageAdapter, IndexedDBAdapter, StorageQuotaManager, StorageEstimate,
  OfflineDatabase, SyncQueueManager, ConflictDetector,
  LastWriteWinsResolver, ThreeWayMergeResolver, SyncTokenManager,
  OfflineCoreIndex, OFFLINE_BATCH_1_ENGINES,
} from './OfflineCore';

describe('V4706 LocalStorageAdapter', () => {
  it('set/get/remove', () => {
    const ls = new LocalStorageAdapter(false);
    ls.setItem('k', 'v');
    expect(ls.getItem('k')).toBe('v');
    ls.removeItem('k');
    expect(ls.getItem('k')).toBeNull();
  });

  it('clear empties', () => {
    const ls = new LocalStorageAdapter(false);
    ls.setItem('a', '1');
    ls.setItem('b', '2');
    ls.clear();
    expect(ls.length).toBe(0);
  });

  it('key returns at index', () => {
    const ls = new LocalStorageAdapter(false);
    ls.setItem('a', '1');
    ls.setItem('b', '2');
    expect(['a', 'b']).toContain(ls.key(0));
  });

  it('length counts', () => {
    const ls = new LocalStorageAdapter(false);
    ls.setItem('a', '1');
    expect(ls.length).toBe(1);
  });
});

describe('V4707 IndexedDBAdapter', () => {
  it('createStore and put/get', () => {
    const db = new IndexedDBAdapter();
    db.createStore('users', 'id');
    db.put('users', { id: '1', name: 'Alice' });
    expect(db.get('users', '1')?.name).toBe('Alice');
  });

  it('delete and getAll', () => {
    const db = new IndexedDBAdapter();
    db.createStore('items');
    db.put('items', { id: 'a', value: 1 });
    db.put('items', { id: 'b', value: 2 });
    expect(db.getAll('items').length).toBe(2);
    db.delete('items', 'a');
    expect(db.count('items')).toBe(1);
  });

  it('count and storeNames', () => {
    const db = new IndexedDBAdapter();
    db.createStore('a');
    db.createStore('b');
    expect(db.storeNames().length).toBe(2);
  });

  it('put without keyPath throws', () => {
    const db = new IndexedDBAdapter();
    db.createStore('users', 'id');
    expect(() => db.put('users', { name: 'X' })).toThrow();
  });
});

describe('V4708 StorageQuotaManager', () => {
  it('add within quota', () => {
    const q = new StorageQuotaManager(1000);
    expect(q.add('a', 500)).toBe(true);
    expect(q.used()).toBe(500);
  });

  it('add over quota returns false', () => {
    const q = new StorageQuotaManager(100);
    expect(q.add('a', 200)).toBe(false);
  });

  it('remove and available', () => {
    const q = new StorageQuotaManager(1000);
    q.add('a', 500);
    q.remove('a');
    expect(q.used()).toBe(0);
    expect(q.available()).toBe(1000);
  });

  it('usagePercent', () => {
    const q = new StorageQuotaManager(100);
    q.add('a', 50);
    expect(q.usagePercent()).toBe(0.5);
  });
});

describe('V4709 StorageEstimate', () => {
  it('estimate returns structure', () => {
    const s = new StorageEstimate();
    s.setEstimate(1000, 250);
    const r = s.estimate();
    expect(r.quota).toBe(1000);
    expect(r.usage).toBe(250);
    expect(r.available).toBe(750);
  });

  it('isNearLimit', () => {
    const s = new StorageEstimate();
    s.setEstimate(100, 95);
    expect(s.isNearLimit(0.9)).toBe(true);
  });

  it('formatBytes', () => {
    const s = new StorageEstimate();
    expect(s.formatBytes(500)).toContain('500');
    expect(s.formatBytes(2048)).toContain('KB');
    expect(s.formatBytes(2 * 1024 * 1024)).toContain('MB');
  });
});

describe('V4710 OfflineDatabase', () => {
  it('insert and find', () => {
    const db = new OfflineDatabase();
    db.insert('users', { id: '1', name: 'A' });
    expect(db.find('users', '1')?.name).toBe('A');
  });

  it('update merges fields', () => {
    const db = new OfflineDatabase();
    db.insert('users', { id: '1', name: 'A', age: 30 });
    db.update('users', '1', { age: 31 });
    expect(db.find('users', '1')?.age).toBe(31);
  });

  it('findAll and count', () => {
    const db = new OfflineDatabase();
    db.insert('items', { id: '1' });
    db.insert('items', { id: '2' });
    expect(db.findAll('items').length).toBe(2);
    expect(db.count('items')).toBe(2);
  });

  it('remove and clearAll', () => {
    const db = new OfflineDatabase();
    db.insert('a', { id: '1' });
    db.clearAll();
    expect(db.collections().length).toBe(0);
  });
});

describe('V4711 SyncQueueManager', () => {
  it('enqueue and pending', () => {
    const q = new SyncQueueManager();
    q.enqueue({ operation: 'create', collection: 'a', docId: '1' });
    expect(q.pendingCount()).toBe(1);
  });

  it('markSynced moves to synced list', () => {
    const q = new SyncQueueManager();
    const item = q.enqueue({ operation: 'update', collection: 'a', docId: '1' });
    q.markSynced(item.id);
    expect(q.pendingCount()).toBe(0);
    expect(q.syncedCount()).toBe(1);
  });

  it('clearPending empties queue', () => {
    const q = new SyncQueueManager();
    q.enqueue({ operation: 'delete', collection: 'a', docId: '1' });
    q.clearPending();
    expect(q.pendingCount()).toBe(0);
  });

  it('synced returns array', () => {
    const q = new SyncQueueManager();
    const i = q.enqueue({ operation: 'create', collection: 'a', docId: '1' });
    q.markSynced(i.id);
    expect(q.synced().length).toBe(1);
  });
});

describe('V4712 ConflictDetector', () => {
  it('detect true for same id different data and version', () => {
    const d = new ConflictDetector();
    const local = { id: '1', version: 1, data: { x: 1 }, updatedAt: 1 };
    const remote = { id: '1', version: 1, data: { x: 2 }, updatedAt: 2 };
    expect(d.detect(local, remote)).toBe(true);
  });

  it('detect false for same data', () => {
    const d = new ConflictDetector();
    const a = { id: '1', version: 1, data: { x: 1 }, updatedAt: 1 };
    expect(d.detect(a, a)).toBe(false);
  });

  it('detectBatch filters', () => {
    const d = new ConflictDetector();
    const a = { id: '1', version: 1, data: { x: 1 }, updatedAt: 1 };
    const b = { id: '1', version: 1, data: { x: 2 }, updatedAt: 2 };
    const c = { id: '1', version: 1, data: { x: 1 }, updatedAt: 1 };
    expect(d.detectBatch([[a, b], [a, c]])).toEqual([true, false]);
  });
});

describe('V4713 LastWriteWinsResolver', () => {
  it('resolve picks latest updatedAt', () => {
    const r = new LastWriteWinsResolver();
    const local = { id: '1', version: 1, data: {}, updatedAt: 100 };
    const remote = { id: '1', version: 1, data: {}, updatedAt: 200 };
    expect(r.resolve(local, remote).updatedAt).toBe(200);
  });

  it('resolve picks local when equal', () => {
    const r = new LastWriteWinsResolver();
    const a = { id: '1', version: 1, data: {}, updatedAt: 100 };
    expect(r.resolve(a, a).updatedAt).toBe(100);
  });

  it('resolveBatch', () => {
    const r = new LastWriteWinsResolver();
    const a = { id: '1', version: 1, data: {}, updatedAt: 100 };
    const b = { id: '1', version: 1, data: {}, updatedAt: 200 };
    expect(r.resolveBatch([[a, b]]).length).toBe(1);
  });
});

describe('V4714 ThreeWayMergeResolver', () => {
  it('auto merge when only one side changed', () => {
    const r = new ThreeWayMergeResolver();
    const base = { a: 1, b: 2 };
    const local = { a: 1, b: 3 };
    const remote = { a: 1, b: 2 };
    const result = r.merge(base, local, remote);
    expect(result.result.b).toBe(3);
    expect(result.conflicts.length).toBe(0);
  });

  it('conflict when both sides changed differently', () => {
    const r = new ThreeWayMergeResolver();
    const base = { x: 'base' };
    const local = { x: 'local' };
    const remote = { x: 'remote' };
    const result = r.merge(base, local, remote);
    expect(result.conflicts).toContain('x');
    expect(result.strategy).toBe('manual');
  });

  it('same change on both sides no conflict', () => {
    const r = new ThreeWayMergeResolver();
    const base = { x: 0 };
    const local = { x: 5 };
    const remote = { x: 5 };
    const result = r.merge(base, local, remote);
    expect(result.result.x).toBe(5);
    expect(result.conflicts.length).toBe(0);
  });
});

describe('V4715 SyncTokenManager', () => {
  it('set and get', () => {
    const m = new SyncTokenManager();
    m.set('user1', 'token', Date.now() + 60000);
    expect(m.get('user1')?.token).toBe('token');
  });

  it('isExpired true when expired', () => {
    const m = new SyncTokenManager();
    m.set('user1', 't', Date.now() - 1000);
    expect(m.isExpired('user1')).toBe(true);
  });

  it('refresh updates token', () => {
    const m = new SyncTokenManager();
    m.set('user1', 'old', Date.now() + 1000, 'refresh-tok');
    const updated = m.refresh('user1', 'new', Date.now() + 60000);
    expect(updated?.token).toBe('new');
  });

  it('refresh without refreshToken returns undefined', () => {
    const m = new SyncTokenManager();
    m.set('user1', 't', Date.now() + 1000);
    expect(m.refresh('user1', 'new', Date.now() + 60000)).toBeUndefined();
  });

  it('remove and all', () => {
    const m = new SyncTokenManager();
    m.set('a', 't1', Date.now() + 1000);
    expect(Object.keys(m.all()).length).toBe(1);
    m.remove('a');
    expect(Object.keys(m.all()).length).toBe(0);
  });
});

describe('OfflineCoreIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new OfflineCoreIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new OfflineCoreIndex();
    expect(idx.has('LocalStorageAdapter')).toBe(true);
    expect(idx.has('OfflineCoreIndex')).toBe(true);
  });

  it('OFFLINE_BATCH_1_ENGINES has 10 entries', () => {
    expect(OFFLINE_BATCH_1_ENGINES.length).toBe(10);
  });
});