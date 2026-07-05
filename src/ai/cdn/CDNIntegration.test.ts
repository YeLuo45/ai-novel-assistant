// V4906-V4915: CK CDN Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  CDNConfigManager,
  CachePolicyEngine,
  PerformanceMetrics,
  CDNDashboard,
  FailureDetector,
  FailoverHandler,
  ConsistencyChecker,
  AuditTrail,
  CDNIntegrationIndex,
  CDNMasterIndex,
  CK_BATCH_3_ENGINES,
  CK_ALL_ENGINES
} from './CDNIntegration';

describe('CDNConfigManager', () => {
  it('set + get typed accessors', () => {
    const c = new CDNConfigManager();
    c.set('name', 'edge1').set('ttl', 60).set('enabled', true);
    expect(c.getString('name')).toBe('edge1');
    expect(c.getNumber('ttl')).toBe(60);
    expect(c.getBoolean('enabled')).toBe(true);
    expect(c.getNumber('missing', 99)).toBe(99);
    expect(c.getString('missing', 'fallback')).toBe('fallback');
    expect(c.getBoolean('missing', true)).toBe(true);
  });

  it('has + keys + remove + size + toJSON', () => {
    const c = new CDNConfigManager();
    c.set('a', 1).set('b', 'x');
    expect(c.has('a')).toBe(true);
    expect(c.keys()).toEqual(['a', 'b']);
    expect(c.size()).toBe(2);
    expect(c.remove('a')).toBe(true);
    expect(c.size()).toBe(1);
    expect(c.toJSON()).toEqual({ b: 'x' });
  });
});

describe('CachePolicyEngine', () => {
  it('setPolicy + decide by prefix', () => {
    const p = new CachePolicyEngine();
    p.setPolicy('/api/users', 100, 50).setPolicy('/api/posts', 200);
    expect(p.decide('/api/users/1', 1000, 950)).toBe('fresh'); // age 50 < ttl 100
    expect(p.decide('/api/users/1', 1000, 850)).toBe('stale'); // age 150 <= ttl+stale 150
    expect(p.decide('/api/users/1', 1000, 700)).toBe('expired'); // age 300 > 150
  });

  it('decide unknown key returns expired', () => {
    const p = new CachePolicyEngine();
    expect(p.decide('/unknown', 1000, 900)).toBe('expired');
  });

  it('longest prefix match wins', () => {
    const p = new CachePolicyEngine();
    p.setPolicy('/api', 100).setPolicy('/api/special', 500);
    expect(p.getPolicy('/api/special/1')?.ttl).toBe(500);
  });

  it('policyCount', () => {
    const p = new CachePolicyEngine();
    p.setPolicy('/a', 1);
    expect(p.policyCount()).toBe(1);
  });
});

describe('PerformanceMetrics', () => {
  it('record + avg + errorRate', () => {
    const m = new PerformanceMetrics();
    m.record(100);
    m.record(200);
    m.record(50, true);
    expect(m.avgLatency()).toBeCloseTo(116.67, 1);
    expect(m.errorRate()).toBeCloseTo(1 / 3);
    expect(m.requestCount()).toBe(3);
    expect(m.errorCount()).toBe(1);
  });

  it('empty metrics return 0', () => {
    const m = new PerformanceMetrics();
    expect(m.avgLatency()).toBe(0);
    expect(m.errorRate()).toBe(0);
    expect(m.p50()).toBe(0);
    expect(m.p99()).toBe(0);
  });

  it('p50 + p99', () => {
    const m = new PerformanceMetrics();
    for (let i = 1; i <= 100; i++) m.record(i);
    expect(m.p50()).toBe(51);
    expect(m.p99()).toBe(100);
  });

  it('reset', () => {
    const m = new PerformanceMetrics();
    m.record(100);
    m.reset();
    expect(m.requestCount()).toBe(0);
  });
});

describe('CDNDashboard', () => {
  it('addPanel + getPanel + names', () => {
    const d = new CDNDashboard();
    d.addPanel('cache', 'Cache Stats', { hits: 100 });
    expect(d.getPanel('cache')?.title).toBe('Cache Stats');
    expect(d.panelNames()).toEqual(['cache']);
    expect(d.panelCount()).toBe(1);
    expect(d.removePanel('cache')).toBe(true);
    expect(d.panelCount()).toBe(0);
    expect(d.getPanel('missing')).toBeNull();
  });
});

describe('FailureDetector + FailoverHandler + ConsistencyChecker + AuditTrail', () => {
  it('FailureDetector tracks healthy/unhealthy', () => {
    const fd = new FailureDetector();
    fd.report('edge1', true);
    fd.report('edge2', false);
    expect(fd.isHealthy('edge1')).toBe(true);
    expect(fd.unhealthyEndpoints()).toEqual(['edge2']);
    expect(fd.allHealthy()).toBe(false);
    expect(fd.trackedCount()).toBe(2);
    expect(fd.isHealthy('missing')).toBe(false);
  });

  it('FailureDetector empty allHealthy true', () => {
    expect(new FailureDetector().allHealthy()).toBe(true);
  });

  it('FailoverHandler primary/secondary', () => {
    const fh = new FailoverHandler();
    fh.setEndpoints('primary', 'secondary');
    expect(fh.active()).toBe('primary');
    expect(fh.failover()).toBe(true);
    expect(fh.active()).toBe('secondary');
    expect(fh.isFailover()).toBe(true);
    expect(fh.failover()).toBe(false); // already secondary
    expect(fh.recover()).toBe(true);
    expect(fh.active()).toBe('primary');
  });

  it('ConsistencyChecker', () => {
    const cc = new ConsistencyChecker();
    expect(cc.check('a', 'a')).toBe('match');
    expect(cc.check('a', 'b')).toBe('mismatch');
    expect(cc.check('', 'a')).toBe('unknown');
    const r = cc.checkBatch([{ origin: 'a', edge: 'a' }, { origin: 'a', edge: 'b' }, { origin: '', edge: '' }]);
    expect(r).toEqual({ match: 1, mismatch: 1, unknown: 1 });
    expect(cc.consistencyRate([{ origin: 'a', edge: 'a' }, { origin: 'a', edge: 'b' }])).toBe(0.5);
    expect(cc.consistencyRate([])).toBe(1);
  });

  it('AuditTrail logs + filters', () => {
    const a = new AuditTrail();
    a.log('purge', 'admin');
    a.log('invalidate', 'user1');
    expect(a.count()).toBe(2);
    expect(a.byActor('admin')).toHaveLength(1);
    a.clear();
    expect(a.count()).toBe(0);
  });
});

describe('CDNIntegrationIndex', () => {
  it('list has 9+1 = 10 engines (incl Index self)', () => {
    expect(new CDNIntegrationIndex().list()).toHaveLength(10);
  });

  it('count 10 (incl Index self)', () => {
    expect(new CDNIntegrationIndex().count()).toBe(10);
  });

  it('engines same as list', () => {
    const idx = new CDNIntegrationIndex();
    expect(idx.engines()).toEqual(idx.list());
  });

  it('has returns true for batch 3 engines + self', () => {
    const idx = new CDNIntegrationIndex();
    expect(idx.has('CDNConfigManager')).toBe(true);
    expect(idx.has('AuditTrail')).toBe(true);
    expect(idx.has('CDNIntegrationIndex')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CK_BATCH_3_ENGINES const has 9', () => {
    expect(CK_BATCH_3_ENGINES).toHaveLength(9);
  });
});

describe('CDNMasterIndex', () => {
  it('list contains all 30 engines', () => {
    expect(new CDNMasterIndex().list()).toHaveLength(30);
  });

  it('count 30', () => {
    expect(new CDNMasterIndex().count()).toBe(30);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new CDNMasterIndex();
    expect(idx.has('CDNEdgeCache')).toBe(true);
    expect(idx.has('TLSOptimizer')).toBe(true);
    expect(idx.has('CDNConfigManager')).toBe(true);
  });

  it('CK_ALL_ENGINES const has 30', () => {
    expect(CK_ALL_ENGINES).toHaveLength(30);
  });
});