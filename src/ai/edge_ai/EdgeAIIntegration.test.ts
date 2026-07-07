// V5176-V5185: CT Edge AI Inference Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  EdgeDashboard,
  EdgeConfig,
  EdgeAudit,
  EdgeProfile,
  EdgeMigration,
  EdgeReport,
  EdgeAIIntegrationIndex,
  EdgeAIMasterIndex,
  CT_BATCH_3_ENGINES,
  CT_ALL_ENGINES
} from './EdgeAIIntegration';

describe('EdgeDashboard + EdgeConfig + EdgeAudit', () => {
  it('EdgeDashboard setPanel + getPanel + panelNames + panelCount', () => {
    const d = new EdgeDashboard();
    d.setPanel('qps', 'QPS', 100).setPanel('lat', 'Latency', 5);
    expect(d.getPanel('qps')).toEqual({ title: 'QPS', value: 100 });
    expect(d.getPanel('missing')).toBeNull();
    expect(d.panelNames().sort()).toEqual(['lat', 'qps']);
    expect(d.panelCount()).toBe(2);
  });

  it('EdgeConfig typed accessors', () => {
    const c = new EdgeConfig();
    c.set('threads', 4).set('backend', 'tflite').set('quantize', true);
    expect(c.getNumber('threads')).toBe(4);
    expect(c.getString('backend')).toBe('tflite');
    expect(c.getBoolean('quantize')).toBe(true);
    expect(c.getNumber('missing', 8)).toBe(8);
    expect(c.getString('missing', 'fb')).toBe('fb');
    expect(c.getBoolean('missing', false)).toBe(false);
    expect(c.size()).toBe(3);
  });

  it('EdgeAudit record + records + forDevice + count + clear', () => {
    const a = new EdgeAudit();
    a.record('u1', 'infer', 'pixel').record('u2', 'load', 'iphone');
    expect(a.count()).toBe(2);
    expect(a.forDevice('pixel')).toHaveLength(1);
    a.clear();
    expect(a.count()).toBe(0);
  });
});

describe('EdgeProfile + EdgeMigration + EdgeReport', () => {
  it('EdgeProfile record + runs + averages', () => {
    const p = new EdgeProfile();
    p.record('pixel', 5, 100).record('pixel', 15, 200);
    expect(p.runs('pixel')).toHaveLength(2);
    expect(p.averageLatency('pixel')).toBe(10);
    expect(p.averageThroughput('pixel')).toBe(150);
    expect(p.averageLatency('missing')).toBe(0);
    expect(p.averageThroughput('missing')).toBe(0);
  });

  it('EdgeMigration define + run + isApplied + counts', async () => {
    const m = new EdgeMigration();
    let n = 0;
    m.define('v1', () => { n += 1; });
    m.define('v2', async () => { n += 1; });
    expect(await m.run('v1')).toBe(true);
    expect(await m.run('missing')).toBe(false);
    expect(m.isApplied('v1')).toBe(true);
    expect(m.migrationCount()).toBe(2);
    expect(m.appliedCount()).toBe(1);
  });

  it('EdgeReport generate + toCSV', () => {
    const r = new EdgeReport();
    expect(r.generate('Q1 Edge', { qps: 100, latency: 5 })).toContain('# Q1 Edge');
    expect(r.toCSV({ a: 1 })).toContain('metric,value');
  });
});

describe('EdgeAIIntegrationIndex', () => {
  it('list has 8', () => {
    expect(new EdgeAIIntegrationIndex().list()).toHaveLength(8);
  });

  it('count + engines + has', () => {
    const idx = new EdgeAIIntegrationIndex();
    expect(idx.count()).toBe(8);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('EdgeDashboard')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CT_BATCH_3_ENGINES const has 8', () => {
    expect(CT_BATCH_3_ENGINES).toHaveLength(8);
  });
});

describe('EdgeAIMasterIndex', () => {
  it('list contains all 29 engines', () => {
    expect(new EdgeAIMasterIndex().list()).toHaveLength(29);
  });

  it('count 29', () => {
    expect(new EdgeAIMasterIndex().count()).toBe(29);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new EdgeAIMasterIndex();
    expect(idx.has('ModelQuantizer')).toBe(true);
    expect(idx.has('TFLiteBackend')).toBe(true);
    expect(idx.has('EdgeDashboard')).toBe(true);
  });

  it('CT_ALL_ENGINES const has 29', () => {
    expect(CT_ALL_ENGINES).toHaveLength(29);
  });
});