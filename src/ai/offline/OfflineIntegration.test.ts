// Round 8 Direction CE — Offline-First Storage 2.0 Batch 3/3 test
// V4726-V4735: 10 engines + integration demo

import { describe, it, expect } from 'vitest';
import {
  OfflineSession, DatabaseInspector, BackupManager, RestoreManager,
  ReplicationManager, NetworkPartitionDetector, ResyncManager,
  StorageMetrics, OfflineIntegration,
  OfflineIntegrationIndex, OfflineMasterIndex, OFFLINE_BATCH_3_ENGINES,
} from './OfflineIntegration';
import { OfflineDatabase } from './OfflineCore';
import { OFFLINE_BATCH_1_ENGINES } from './OfflineCore';
import { OFFLINE_BATCH_2_ENGINES } from './OfflineAdvanced';

describe('V4726 OfflineSession', () => {
  it('construct with config sets up all engines', () => {
    const s = new OfflineSession('s1', { cacheName: 'v1', quotaBytes: 5000000, encryptionKey: 'key' });
    expect(s.id).toBe('s1');
    expect(s.config.cacheName).toBe('v1');
  });

  it('age returns positive', () => {
    const s = new OfflineSession('s1', { cacheName: 'v1', quotaBytes: 5000000, encryptionKey: 'key' });
    expect(s.age()).toBeGreaterThanOrEqual(0);
  });
});

describe('V4728 DatabaseInspector', () => {
  it('inspect returns collections + totalDocs', () => {
    const db = new OfflineDatabase();
    db.insert('users', { id: '1' });
    db.insert('posts', { id: '1' });
    db.insert('posts', { id: '2' });
    const inspector = new DatabaseInspector();
    const r = inspector.inspect(db);
    expect(r.totalDocs).toBe(3);
    expect(r.collections.length).toBe(2);
  });

  it('estimateSize based on docs', () => {
    const db = new OfflineDatabase();
    db.insert('users', { id: '1' });
    db.insert('users', { id: '2' });
    const inspector = new DatabaseInspector();
    expect(inspector.estimateSize(db, 100)).toBe(200);
  });
});

describe('V4729 BackupManager', () => {
  it('backup captures all collections', () => {
    const db = new OfflineDatabase();
    db.insert('users', { id: '1', name: 'A' });
    const bm = new BackupManager();
    const b = bm.backup(db, 1);
    expect(b.collections.users?.length).toBe(1);
  });

  it('serialize and deserialize roundtrip', () => {
    const bm = new BackupManager();
    const json = bm.serialize({ timestamp: 100, collections: { a: [{ id: '1' }] }, version: 1 });
    const parsed = bm.deserialize(json);
    expect(parsed.collections.a.length).toBe(1);
  });

  it('restore inserts all docs', () => {
    const bm = new BackupManager();
    const target = new OfflineDatabase();
    bm.restore(target, { timestamp: 0, collections: { users: [{ id: '1' }, { id: '2' }] }, version: 1 });
    expect(target.count('users')).toBe(2);
  });
});

describe('V4730 RestoreManager', () => {
  it('restore resolves conflicts', () => {
    const db = new OfflineDatabase();
    db.insert('users', { id: '1', name: 'Local' });
    const rm = new RestoreManager();
    const result = rm.restore(db, { timestamp: 0, collections: { users: [{ id: '1', name: 'Remote' }] }, version: 1 }, (l, r) => ({ ...l, name: r.name }));
    expect(result.conflicts).toBe(1);
    expect(db.find('users', '1')?.name).toBe('Remote');
  });

  it('restore new docs without conflict', () => {
    const db = new OfflineDatabase();
    const rm = new RestoreManager();
    const result = rm.restore(db, { timestamp: 0, collections: { users: [{ id: '1' }] }, version: 1 }, (l, r) => ({ ...l, ...r }));
    expect(result.conflicts).toBe(0);
    expect(result.restored).toBe(1);
  });
});

describe('V4731 ReplicationManager', () => {
  it('registerTarget and bumpVersion', () => {
    const r = new ReplicationManager();
    r.registerTarget('t1');
    r.bumpVersion();
    r.bumpVersion();
    expect(r.currentVersion()).toBe(2);
  });

  it('pendingForTarget computes gap', () => {
    const r = new ReplicationManager();
    r.registerTarget('t1');
    r.bumpVersion();
    r.bumpVersion();
    r.bumpVersion();
    expect(r.pendingForTarget('t1', 1)).toEqual([2, 3]);
  });

  it('markSynced and lagForTarget', () => {
    const r = new ReplicationManager();
    r.registerTarget('t1');
    r.bumpVersion();
    r.bumpVersion();
    r.bumpVersion();
    r.markSynced('t1', 2);
    expect(r.lagForTarget('t1')).toBe(1);
  });

  it('targets returns array', () => {
    const r = new ReplicationManager();
    r.registerTarget('a');
    r.registerTarget('b');
    expect(r.targets().length).toBe(2);
  });
});

describe('V4732 NetworkPartitionDetector', () => {
  it('isOnline initially', () => {
    const d = new NetworkPartitionDetector();
    expect(d.isOnline()).toBe(true);
  });

  it('setOnline to false triggers partition', () => {
    const d = new NetworkPartitionDetector();
    d.setOnline(false);
    expect(d.isPartitioned()).toBe(true);
  });

  it('partitionDurationMs counts elapsed', () => {
    const d = new NetworkPartitionDetector();
    d.setOnline(false);
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(d.partitionDurationMs()).toBeGreaterThan(0);
        resolve();
      }, 50);
    });
  });

  it('subscribe and unsubscribe', () => {
    const d = new NetworkPartitionDetector();
    let calls = 0;
    const unsub = d.subscribe((p) => { calls += p ? 1 : 0; });
    d.setOnline(false);
    expect(calls).toBe(1);
    unsub();
    d.setOnline(true);
    expect(calls).toBe(1);
  });
});

describe('V4733 ResyncManager', () => {
  it('resync tracks history', () => {
    const r = new ResyncManager();
    r.resync('full', 100);
    expect(r.lastFullSync()).toBeGreaterThan(0);
  });

  it('partial resync updates partial sync', () => {
    const r = new ResyncManager();
    r.resync('partial', 50);
    expect(r.lastPartialSync()).toBeGreaterThan(0);
    expect(r.lastFullSync()).toBe(0);
  });

  it('history tracks all resyncs', () => {
    const r = new ResyncManager();
    r.resync('full', 100);
    r.resync('partial', 50);
    expect(r.history().length).toBe(2);
  });

  it('needsFullSync true initially', () => {
    const r = new ResyncManager();
    expect(r.needsFullSync()).toBe(true);
  });
});

describe('V4734 StorageMetrics', () => {
  it('increment and counter', () => {
    const m = new StorageMetrics();
    m.increment('writes');
    m.increment('writes', 5);
    expect(m.counter('writes')).toBe(6);
  });

  it('report returns all', () => {
    const m = new StorageMetrics();
    m.increment('a', 1);
    m.increment('b', 2);
    expect(Object.keys(m.report()).length).toBe(2);
  });

  it('reset clears', () => {
    const m = new StorageMetrics();
    m.increment('a');
    m.reset();
    expect(m.counter('a')).toBe(0);
  });
});

describe('V4735 OfflineIntegration end-to-end demo', () => {
  it('runDemo completes workflow', () => {
    const o = new OfflineIntegration({ cacheName: 'v1', quotaBytes: 5000000, encryptionKey: 'key' });
    const result = o.runDemo();
    expect(result.backupSize).toBeGreaterThan(0);
    expect(result.inspectorReport.totalDocs).toBe(2);
    expect(result.replicationTargets).toBe(1);
    expect(result.metricsReport.demo_runs).toBe(1);
  });

  it('exposes all sub-engines', () => {
    const o = new OfflineIntegration({ cacheName: 'v1', quotaBytes: 5000000, encryptionKey: 'key' });
    expect(o.session()).toBeDefined();
    expect(o.inspector()).toBeDefined();
    expect(o.backup()).toBeDefined();
    expect(o.restore()).toBeDefined();
    expect(o.replication()).toBeDefined();
    expect(o.partition()).toBeDefined();
    expect(o.resync()).toBeDefined();
    expect(o.metrics()).toBeDefined();
  });
});

describe('OfflineIntegrationIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new OfflineIntegrationIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new OfflineIntegrationIndex();
    expect(idx.has('OfflineSession')).toBe(true);
    expect(idx.has('OfflineIntegrationIndex')).toBe(true);
  });

  it('OFFLINE_BATCH_3_ENGINES has 10 entries', () => {
    expect(OFFLINE_BATCH_3_ENGINES.length).toBe(10);
  });
});

describe('OfflineMasterIndex', () => {
  it('list includes 31 entries', () => {
    const idx = new OfflineMasterIndex();
    expect(idx.list().length).toBe(31);
    expect(idx.count()).toBe(31);
  });

  it('has() checks all batches', () => {
    const idx = new OfflineMasterIndex();
    expect(idx.has('LocalStorageAdapter')).toBe(true);
    expect(idx.has('BackgroundSyncRetryManager')).toBe(true);
    expect(idx.has('OfflineSession')).toBe(true);
    expect(idx.has('OfflineMasterIndex')).toBe(true);
  });

  it('all 3 batches have 10', () => {
    expect(OFFLINE_BATCH_1_ENGINES.length).toBe(10);
    expect(OFFLINE_BATCH_2_ENGINES.length).toBe(10);
    expect(OFFLINE_BATCH_3_ENGINES.length).toBe(10);
  });
});