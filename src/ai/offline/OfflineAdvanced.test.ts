// Round 8 Direction CE — Offline-First Storage 2.0 Batch 2/3 test
// V4716-V4725: 10 engines

import { describe, it, expect } from 'vitest';
import {
  BackgroundSyncRetryManager, RequestCacheManager, OfflineFirstCache,
  DataMigrationManager, SchemaVersionManager, DataEncryptionLayer,
  CompressedStorage, OfflineChangeLog, SyncTimestampTracker, OptimisticUpdateManager,
  OfflineAdvancedIndex, OFFLINE_BATCH_2_ENGINES,
} from './OfflineAdvanced';

describe('V4716 BackgroundSyncRetryManager', () => {
  it('nextDelayMs grows exponentially', () => {
    const r = new BackgroundSyncRetryManager({ baseDelayMs: 100, backoffMultiplier: 2 });
    expect(r.nextDelayMs(1)).toBe(100);
    expect(r.nextDelayMs(2)).toBe(200);
    expect(r.nextDelayMs(3)).toBe(400);
  });

  it('shouldRetry within maxAttempts', () => {
    const r = new BackgroundSyncRetryManager({ maxAttempts: 3 });
    expect(r.shouldRetry(3)).toBe(true);
    expect(r.shouldRetry(4)).toBe(false);
  });

  it('recordAttempt tracks history', () => {
    const r = new BackgroundSyncRetryManager();
    r.recordAttempt('job1', 'fail');
    expect(r.attempts('job1')).toBe(1);
    expect(r.lastError('job1')).toBe('fail');
  });

  it('reset clears', () => {
    const r = new BackgroundSyncRetryManager();
    r.recordAttempt('job1');
    r.reset('job1');
    expect(r.attempts('job1')).toBe(0);
  });
});

describe('V4717 RequestCacheManager', () => {
  it('put and get within TTL', () => {
    const c = new RequestCacheManager();
    c.put({ url: '/a', status: 200, body: 'data', headers: {}, ttlMs: 60000 });
    expect(c.get('/a')?.body).toBe('data');
  });

  it('get after TTL returns undefined', () => {
    const c = new RequestCacheManager();
    c.put({ url: '/a', status: 200, body: 'data', headers: {}, ttlMs: 50 });
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(c.get('/a')).toBeUndefined();
        resolve();
      }, 100);
    });
  });

  it('isFresh and invalidate', () => {
    const c = new RequestCacheManager();
    c.put({ url: '/a', status: 200, body: '', headers: {}, ttlMs: 60000 });
    expect(c.isFresh('/a')).toBe(true);
    c.invalidate('/a');
    expect(c.isFresh('/a')).toBe(false);
  });

  it('invalidateMatching', () => {
    const c = new RequestCacheManager();
    c.put({ url: '/api/a', status: 200, body: '', headers: {}, ttlMs: 60000 });
    c.put({ url: '/api/b', status: 200, body: '', headers: {}, ttlMs: 60000 });
    c.put({ url: '/other', status: 200, body: '', headers: {}, ttlMs: 60000 });
    expect(c.invalidateMatching((u) => u.startsWith('/api'))).toBe(2);
  });
});

describe('V4718 OfflineFirstCache', () => {
  it('set and getFresh', () => {
    const c = new OfflineFirstCache<number>(60000);
    c.set('a', 42);
    expect(c.getFresh('a')).toBe(42);
  });

  it('getStale returns even when stale', () => {
    const c = new OfflineFirstCache<number>(50);
    c.set('a', 42);
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(c.getFresh('a')).toBeUndefined();
        expect(c.getStale('a')).toBe(42);
        resolve();
      }, 100);
    });
  });

  it('isStale tracks freshness', () => {
    const c = new OfflineFirstCache<number>(50);
    c.set('a', 1);
    expect(c.isStale('a')).toBe(false);
  });

  it('age returns elapsed', () => {
    const c = new OfflineFirstCache<number>(60000);
    c.set('a', 1);
    expect(c.age('a')).toBeGreaterThanOrEqual(0);
  });
});

describe('V4719 DataMigrationManager', () => {
  it('add and find migration', () => {
    const m = new DataMigrationManager();
    m.add({ fromVersion: 1, toVersion: 2, migrate: (d) => ({ ...d, v: 2 }) });
    expect(m.find(1, 2)?.description).toBeUndefined();
  });

  it('migrate through versions', () => {
    const m = new DataMigrationManager();
    m.add({ fromVersion: 1, toVersion: 2, migrate: (d) => ({ ...d, v: 2 }) });
    m.add({ fromVersion: 2, toVersion: 3, migrate: (d) => ({ ...d, v: 3 }) });
    const result = m.migrate(1, 3, { v: 1 });
    expect(result.data.v).toBe(3);
    expect(result.applied).toBe(2);
  });

  it('versions returns all unique', () => {
    const m = new DataMigrationManager();
    m.add({ fromVersion: 1, toVersion: 2, migrate: (d) => d });
    m.add({ fromVersion: 2, toVersion: 3, migrate: (d) => d });
    expect(m.versions()).toEqual([1, 2, 3]);
  });
});

describe('V4720 SchemaVersionManager', () => {
  it('setVersion and current', () => {
    const s = new SchemaVersionManager();
    s.setVersion(2, ['added field']);
    expect(s.current()).toBe(2);
  });

  it('history tracks changes', () => {
    const s = new SchemaVersionManager();
    s.setVersion(1, ['init']);
    s.setVersion(2, ['add field']);
    expect(s.history().length).toBe(2);
  });

  it('needsUpgrade and needsDowngrade', () => {
    const s = new SchemaVersionManager();
    s.setVersion(3);
    expect(s.needsUpgrade(2)).toBe(true);
    expect(s.needsDowngrade(5)).toBe(true);
  });
});

describe('V4721 DataEncryptionLayer', () => {
  it('encrypt and decrypt roundtrip', () => {
    const e = new DataEncryptionLayer('secret-key');
    const encrypted = e.encrypt('hello world');
    expect(encrypted).not.toBe('hello world');
    expect(e.decrypt(encrypted)).toBe('hello world');
  });

  it('rotateKey changes ciphertext', () => {
    const e = new DataEncryptionLayer('key1');
    const ct1 = e.encrypt('hello');
    e.rotateKey('key2');
    const ct2 = e.encrypt('hello');
    expect(ct1).not.toBe(ct2);
    expect(e.decrypt(ct2)).toBe('hello');
  });

  it('hash returns consistent hex', () => {
    const e = new DataEncryptionLayer('k');
    expect(e.hash('abc')).toBe(e.hash('abc'));
    expect(e.hash('abc')).not.toBe(e.hash('abd'));
  });

  it('different keys produce different ciphertexts', () => {
    const e1 = new DataEncryptionLayer('k1');
    const e2 = new DataEncryptionLayer('k2');
    expect(e1.encrypt('hello')).not.toBe(e2.encrypt('hello'));
  });
});

describe('V4722 CompressedStorage', () => {
  it('compress RLE', () => {
    const c = new CompressedStorage();
    expect(c.compress('aaaaaaaaaa').length).toBeLessThan(10);
  });

  it('decompress restores', () => {
    const c = new CompressedStorage();
    const original = 'aaaaaaaaaabbbbbbbbbbcc';
    const compressed = c.compress(original);
    expect(c.decompress(compressed)).toBe(original);
  });

  it('store and load', () => {
    const c = new CompressedStorage();
    c.store('a', 'aaaaaaaaaa');
    expect(c.load('a')).toBe('aaaaaaaaaa');
  });

  it('ratio returns compressed/original', () => {
    const c = new CompressedStorage();
    expect(c.ratio(100, 50)).toBe(0.5);
  });
});

describe('V4723 OfflineChangeLog', () => {
  it('record and size', () => {
    const l = new OfflineChangeLog();
    l.record('create', 'users', '1', { name: 'A' });
    expect(l.size()).toBe(1);
  });

  it('markSynced moves to synced', () => {
    const l = new OfflineChangeLog();
    const e = l.record('update', 'a', '1');
    l.markSynced(e.id);
    expect(l.synced().length).toBe(1);
    expect(l.unsynced().length).toBe(0);
  });

  it('byCollection filters', () => {
    const l = new OfflineChangeLog();
    l.record('create', 'users', '1');
    l.record('create', 'posts', '1');
    expect(l.byCollection('users').length).toBe(1);
  });

  it('clear empties', () => {
    const l = new OfflineChangeLog();
    l.record('create', 'a', '1');
    l.clear();
    expect(l.size()).toBe(0);
  });
});

describe('V4724 SyncTimestampTracker', () => {
  it('recordSync and lastSync', () => {
    const t = new SyncTimestampTracker();
    t.recordSync('users', 1000);
    expect(t.lastSync('users')).toBe(1000);
  });

  it('msSinceSync returns elapsed', () => {
    const t = new SyncTimestampTracker();
    t.recordSync('a');
    expect(t.msSinceSync('a')).toBeGreaterThanOrEqual(0);
  });

  it('needsSync true for old', () => {
    const t = new SyncTimestampTracker();
    expect(t.needsSync('new-scope')).toBe(true);
  });

  it('scopes returns all', () => {
    const t = new SyncTimestampTracker();
    t.recordSync('a');
    t.recordSync('b');
    expect(t.scopes().length).toBe(2);
  });
});

describe('V4725 OptimisticUpdateManager', () => {
  it('apply creates update', () => {
    const m = new OptimisticUpdateManager();
    const u = m.apply('users', '1', { name: 'A' });
    expect(u.confirmed).toBe(false);
  });

  it('confirm marks update', () => {
    const m = new OptimisticUpdateManager();
    const u = m.apply('a', '1', {});
    expect(m.confirm(u.id)).toBe(true);
    expect(m.confirmed().length).toBe(1);
  });

  it('rollback marks update', () => {
    const m = new OptimisticUpdateManager();
    const u = m.apply('a', '1', {});
    expect(m.rollback(u.id)).toBe(true);
    expect(m.rolledBack().length).toBe(1);
  });

  it('pending excludes confirmed and rolledBack', () => {
    const m = new OptimisticUpdateManager();
    m.apply('a', '1', {});
    const u2 = m.apply('a', '2', {});
    m.confirm(u2.id);
    expect(m.pending().length).toBe(1);
  });
});

describe('OfflineAdvancedIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new OfflineAdvancedIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new OfflineAdvancedIndex();
    expect(idx.has('BackgroundSyncRetryManager')).toBe(true);
    expect(idx.has('OfflineAdvancedIndex')).toBe(true);
  });

  it('OFFLINE_BATCH_2_ENGINES has 10 entries', () => {
    expect(OFFLINE_BATCH_2_ENGINES.length).toBe(10);
  });
});