// V4966-V4975: CM Offline Edit Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  OfflineBootstrap,
  OfflineRecovery,
  OfflineMetrics,
  OfflineAudit,
  OfflinePermissions,
  OfflineMigration,
  OfflineConfigManager,
  OfflineSyncDashboard,
  OfflineEditIntegrationIndex,
  OfflineEditMasterIndex,
  CM_BATCH_3_ENGINES,
  CM_ALL_ENGINES
} from './OfflineEditIntegration';

describe('OfflineBootstrap', () => {
  it('addStep + markDone + progress + isComplete + reset', () => {
    const b = new OfflineBootstrap();
    expect(b.isComplete()).toBe(false); // no steps
    expect(b.progress().ratio).toBe(0);
    b.addStep('db').addStep('sync');
    expect(b.markDone('db')).toBe(true);
    expect(b.markDone('missing')).toBe(false);
    expect(b.progress()).toEqual({ done: 1, total: 2, ratio: 0.5 });
    expect(b.isComplete()).toBe(false);
    b.markDone('sync');
    expect(b.isComplete()).toBe(true);
    expect(b.pendingSteps()).toEqual([]);
    b.reset();
    expect(b.progress().done).toBe(0);
  });
});

describe('OfflineRecovery', () => {
  it('checkpoint + restore + latest + stale + clear + count', async () => {
    const r = new OfflineRecovery();
    expect(r.latest()).toBeNull();
    r.checkpoint('a', { step: 1 });
    await new Promise(rs => setTimeout(rs, 5));
    r.checkpoint('b', { step: 2 });
    expect(r.restore('a')).toEqual({ step: 1 });
    expect(r.latest()).toBe('b');
    expect(r.stale(2)).toContain('a');
    expect(r.clear('a')).toBe(true);
    expect(r.count()).toBe(1);
  });
});

describe('OfflineMetrics', () => {
  it('recordOperation + recordSync + rates + counts + reset', () => {
    const m = new OfflineMetrics();
    m.recordOperation();
    m.recordOperation();
    m.recordSync(true, 100);
    m.recordSync(false, 200);
    m.recordSync(true, 300);
    expect(m.operationCount()).toBe(2);
    expect(m.syncSuccessCount()).toBe(2);
    expect(m.syncFailureCount()).toBe(1);
    expect(m.bytesSynced()).toBe(600);
    expect(m.syncSuccessRate()).toBeCloseTo(2 / 3);
    m.reset();
    expect(m.operationCount()).toBe(0);
    expect(m.syncSuccessRate()).toBe(0);
  });
});

describe('OfflineAudit', () => {
  it('record + records + forUser + count + clear', () => {
    const a = new OfflineAudit();
    a.record('u1', 'create', 'doc1');
    a.record('u1', 'edit', 'doc1');
    a.record('u2', 'delete', 'doc2');
    expect(a.count()).toBe(3);
    expect(a.forUser('u1')).toHaveLength(2);
    expect(a.records()[0].action).toBe('create');
    a.clear();
    expect(a.count()).toBe(0);
  });
});

describe('OfflinePermissions', () => {
  it('grant + can + revoke + actionsFor + userCount + clear', () => {
    const p = new OfflinePermissions();
    p.grant('u1', 'read').grant('u1', 'write');
    expect(p.can('u1', 'read')).toBe(true);
    expect(p.can('u2', 'read')).toBe(false);
    expect(p.actionsFor('u1').sort()).toEqual(['read', 'write']);
    expect(p.userCount()).toBe(1);
    expect(p.revoke('u1', 'read')).toBe(true);
    expect(p.can('u1', 'read')).toBe(false);
    expect(p.clear('u1')).toBe(true);
    expect(p.userCount()).toBe(0);
  });
});

describe('OfflineMigration', () => {
  it('define + run + isApplied + counts + versions', async () => {
    const m = new OfflineMigration();
    let ran = 0;
    m.define('v1', 0, 1, () => { ran += 1; });
    m.define('v2', 1, 2, async () => { ran += 1; });
    expect(await m.run('v1')).toBe(true);
    expect(await m.run('v2')).toBe(true);
    expect(await m.run('missing')).toBe(false);
    expect(ran).toBe(2);
    expect(m.isApplied('v1')).toBe(true);
    expect(m.appliedCount()).toBe(2);
    expect(m.migrationCount()).toBe(2);
    expect(m.versions()).toEqual(['v1', 'v2']);
  });
});

describe('OfflineConfigManager + OfflineSyncDashboard', () => {
  it('OfflineConfigManager typed accessors', () => {
    const c = new OfflineConfigManager();
    c.set('name', 'edge1');
    c.set('ttl', 60);
    c.set('enabled', true);
    expect(c.getString('name')).toBe('edge1');
    expect(c.getNumber('ttl')).toBe(60);
    expect(c.getBoolean('enabled')).toBe(true);
    expect(c.getNumber('missing', 99)).toBe(99);
    expect(c.getString('missing', 'fallback')).toBe('fallback');
    expect(c.getBoolean('missing', true)).toBe(true);
    expect(c.has('name')).toBe(true);
    expect(c.keys().sort()).toEqual(['enabled', 'name', 'ttl']);
    expect(c.size()).toBe(3);
  });

  it('OfflineSyncDashboard record + get + metrics + reset + total', () => {
    const d = new OfflineSyncDashboard();
    d.record('hits', 10);
    d.record('hits', 5);
    d.record('errors', 2);
    expect(d.get('hits')).toBe(15);
    expect(d.get('errors')).toBe(2);
    expect(d.get('missing')).toBe(0);
    expect(d.metrics().sort()).toEqual(['errors', 'hits']);
    expect(d.total()).toBe(17);
    d.reset();
    expect(d.total()).toBe(0);
    expect(d.metrics()).toEqual([]);
  });
});

describe('OfflineEditIntegrationIndex', () => {
  it('list has 10 engines', () => {
    expect(new OfflineEditIntegrationIndex().list()).toHaveLength(10);
  });

  it('count 10', () => {
    expect(new OfflineEditIntegrationIndex().count()).toBe(10);
  });

  it('engines same as list', () => {
    const idx = new OfflineEditIntegrationIndex();
    expect(idx.engines()).toEqual(idx.list());
  });

  it('has returns true for batch 3 engines + self', () => {
    const idx = new OfflineEditIntegrationIndex();
    expect(idx.has('OfflineBootstrap')).toBe(true);
    expect(idx.has('OfflineMigration')).toBe(true);
    expect(idx.has('OfflineEditIntegrationIndex')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CM_BATCH_3_ENGINES const has 10', () => {
    expect(CM_BATCH_3_ENGINES).toHaveLength(10);
  });
});

describe('OfflineEditMasterIndex', () => {
  it('list contains all 30 engines', () => {
    expect(new OfflineEditMasterIndex().list()).toHaveLength(30);
  });

  it('count 30', () => {
    expect(new OfflineEditMasterIndex().count()).toBe(30);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new OfflineEditMasterIndex();
    expect(idx.has('OfflineDocument')).toBe(true);
    expect(idx.has('CRDTDocument')).toBe(true);
    expect(idx.has('OfflineBootstrap')).toBe(true);
  });

  it('CM_ALL_ENGINES const has 30', () => {
    expect(CM_ALL_ENGINES).toHaveLength(30);
  });
});