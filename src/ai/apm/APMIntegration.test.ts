// V5326-V5335: CY Performance Profiling 2.0 Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  APMDashboard,
  APMReport,
  APMConfig,
  APMAudit,
  APMMigration,
  APMBenchmark,
  APMIntegrationIndex,
  APMMasterIndex,
  CY_BATCH_3_ENGINES,
  CY_ALL_ENGINES
} from './APMIntegration';

describe('APMDashboard + APMReport + APMConfig', () => {
  it('APMDashboard setPanel + getPanel + names + count', () => {
    const d = new APMDashboard();
    d.setPanel('p95', 'P95 Latency', 250).setPanel('qps', 'QPS', 1000);
    expect(d.getPanel('p95')).toEqual({ title: 'P95 Latency', value: 250 });
    expect(d.getPanel('missing')).toBeNull();
    expect(d.panelNames().sort()).toEqual(['p95', 'qps']);
    expect(d.panelCount()).toBe(2);
  });

  it('APMReport generate + toCSV', () => {
    const r = new APMReport();
    expect(r.generate('Q1 APM', { p95: 200, errorRate: 0.01 })).toContain('# Q1 APM');
    expect(r.toCSV({ a: 1 })).toContain('metric,value');
  });

  it('APMConfig typed accessors', () => {
    const c = new APMConfig();
    c.set('sampleRate', 0.1).set('endpoint', 'https://apm').set('enabled', true);
    expect(c.getNumber('sampleRate')).toBe(0.1);
    expect(c.getString('endpoint')).toBe('https://apm');
    expect(c.getBoolean('enabled')).toBe(true);
    expect(c.getNumber('missing', 1.0)).toBe(1.0);
    expect(c.getString('missing', 'fb')).toBe('fb');
    expect(c.getBoolean('missing', false)).toBe(false);
    expect(c.size()).toBe(3);
  });
});

describe('APMAudit + APMMigration + APMBenchmark', () => {
  it('APMAudit record + records + forComponent + count + clear', () => {
    const a = new APMAudit();
    a.record('u1', 'config', 'apm').record('u2', 'view', 'tracer');
    expect(a.count()).toBe(2);
    expect(a.forComponent('apm')).toHaveLength(1);
    a.clear();
    expect(a.count()).toBe(0);
  });

  it('APMMigration define + run + isApplied + counts', async () => {
    const m = new APMMigration();
    let n = 0;
    m.define('v1', () => { n += 1; });
    expect(await m.run('v1')).toBe(true);
    expect(await m.run('missing')).toBe(false);
    expect(m.isApplied('v1')).toBe(true);
    expect(m.migrationCount()).toBe(1);
    expect(m.appliedCount()).toBe(1);
  });

  it('APMBenchmark record + get + best + results', () => {
    const b = new APMBenchmark();
    b.record('ddog', 0.9).record('prometheus', 0.85);
    expect(b.get('ddog')).toBe(0.9);
    expect(b.get('missing')).toBe(0);
    expect(b.best()?.name).toBe('ddog');
    expect(b.results()).toEqual({ ddog: 0.9, prometheus: 0.85 });
    expect(new APMBenchmark().best()).toBeNull();
  });
});

describe('APMIntegrationIndex', () => {
  it('list has 8', () => {
    expect(new APMIntegrationIndex().list()).toHaveLength(8);
  });

  it('count + engines + has', () => {
    const idx = new APMIntegrationIndex();
    expect(idx.count()).toBe(8);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('APMDashboard')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CY_BATCH_3_ENGINES const has 8', () => {
    expect(CY_BATCH_3_ENGINES).toHaveLength(8);
  });
});

describe('APMMasterIndex', () => {
  it('list contains all 28 engines', () => {
    expect(new APMMasterIndex().list()).toHaveLength(28);
  });

  it('count 28', () => {
    expect(new APMMasterIndex().count()).toBe(28);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new APMMasterIndex();
    expect(idx.has('DistributedTracer')).toBe(true);
    expect(idx.has('LatencyAnalyzer')).toBe(true);
    expect(idx.has('APMDashboard')).toBe(true);
  });

  it('CY_ALL_ENGINES const has 28', () => {
    expect(CY_ALL_ENGINES).toHaveLength(28);
  });
});