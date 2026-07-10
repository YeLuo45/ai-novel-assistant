// V5296-V5305: CX Real-time Collaboration 2.0 Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  CollabDashboard,
  CollabProfile,
  CollabAudit,
  CollabConfig,
  CollabMigration,
  CollabReport,
  CollabBenchmark,
  CollabV2IntegrationIndex,
  CollabV2MasterIndex,
  CX_BATCH_3_ENGINES,
  CX_ALL_ENGINES
} from './CollabV2Integration';

describe('CollabDashboard + CollabProfile', () => {
  it('CollabDashboard setPanel + getPanel + names + count', () => {
    const d = new CollabDashboard();
    d.setPanel('peers', 'Active Peers', 5).setPanel('ops', 'Ops/s', 100);
    expect(d.getPanel('peers')).toEqual({ title: 'Active Peers', value: 5 });
    expect(d.getPanel('missing')).toBeNull();
    expect(d.panelNames().sort()).toEqual(['ops', 'peers']);
    expect(d.panelCount()).toBe(2);
  });

  it('CollabProfile record + runs + averages + totalOps', () => {
    const p = new CollabProfile();
    p.record('s1', 100, 50).record('s1', 200, 100);
    expect(p.runs('s1')).toHaveLength(2);
    expect(p.averageOps('s1')).toBe(150);
    expect(p.averageDuration('s1')).toBe(75);
    expect(p.totalOps('s1')).toBe(300);
    expect(p.averageOps('missing')).toBe(0);
  });
});

describe('CollabAudit + CollabConfig + CollabMigration + CollabReport + CollabBenchmark', () => {
  it('CollabAudit record + records + forUser + count + clear', () => {
    const a = new CollabAudit();
    a.record('u1', 'edit', 'd1').record('u2', 'view', 'd1');
    expect(a.count()).toBe(2);
    expect(a.forUser('u1')).toHaveLength(1);
    a.clear();
    expect(a.count()).toBe(0);
  });

  it('CollabConfig typed accessors', () => {
    const c = new CollabConfig();
    c.set('timeout', 5000).set('mode', 'yjs').set('enabled', true);
    expect(c.getNumber('timeout')).toBe(5000);
    expect(c.getString('mode')).toBe('yjs');
    expect(c.getBoolean('enabled')).toBe(true);
    expect(c.getNumber('missing', 1000)).toBe(1000);
    expect(c.getString('missing', 'fb')).toBe('fb');
    expect(c.getBoolean('missing', false)).toBe(false);
    expect(c.size()).toBe(3);
  });

  it('CollabMigration define + run + isApplied + counts', async () => {
    const m = new CollabMigration();
    let n = 0;
    m.define('v1', () => { n += 1; });
    expect(await m.run('v1')).toBe(true);
    expect(await m.run('missing')).toBe(false);
    expect(m.isApplied('v1')).toBe(true);
    expect(m.migrationCount()).toBe(1);
    expect(m.appliedCount()).toBe(1);
  });

  it('CollabReport generate + toCSV', () => {
    const r = new CollabReport();
    expect(r.generate('Q1 Collab', { peers: 50, ops: 1000 })).toContain('# Q1 Collab');
    expect(r.toCSV({ a: 1 })).toContain('metric,value');
  });

  it('CollabBenchmark record + get + best + results', () => {
    const b = new CollabBenchmark();
    b.record('yjs', 0.95).record('automerge', 0.9);
    expect(b.get('yjs')).toBe(0.95);
    expect(b.get('missing')).toBe(0);
    expect(b.best()?.name).toBe('yjs');
    expect(b.results()).toEqual({ yjs: 0.95, automerge: 0.9 });
    expect(new CollabBenchmark().best()).toBeNull();
  });
});

describe('CollabV2IntegrationIndex', () => {
  it('list has 9', () => {
    expect(new CollabV2IntegrationIndex().list()).toHaveLength(9);
  });

  it('count + engines + has', () => {
    const idx = new CollabV2IntegrationIndex();
    expect(idx.count()).toBe(9);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('CollabDashboard')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CX_BATCH_3_ENGINES const has 9', () => {
    expect(CX_BATCH_3_ENGINES).toHaveLength(9);
  });
});

describe('CollabV2MasterIndex', () => {
  it('list contains all 29 engines', () => {
    expect(new CollabV2MasterIndex().list()).toHaveLength(29);
  });

  it('count 29', () => {
    expect(new CollabV2MasterIndex().count()).toBe(29);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new CollabV2MasterIndex();
    expect(idx.has('OperationalTransform2')).toBe(true);
    expect(idx.has('AwarenessProtocol2')).toBe(true);
    expect(idx.has('CollabDashboard')).toBe(true);
  });

  it('CX_ALL_ENGINES const has 29', () => {
    expect(CX_ALL_ENGINES).toHaveLength(29);
  });
});