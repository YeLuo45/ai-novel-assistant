// V5206-V5215: CU Synthetic Data Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  SyntheticDashboard,
  SyntheticReport,
  SyntheticConfig,
  SyntheticAudit,
  SyntheticMigration,
  SynthDataIntegrationIndex,
  SynthDataMasterIndex,
  CU_BATCH_3_ENGINES,
  CU_ALL_ENGINES
} from './SyntheticDataIntegration';

describe('SyntheticDashboard + SyntheticReport + SyntheticConfig', () => {
  it('SyntheticDashboard setPanel + getPanel + names + count', () => {
    const d = new SyntheticDashboard();
    d.setPanel('gen', 'Generated', 1000).setPanel('qual', 'Avg Quality', 0.85);
    expect(d.getPanel('gen')).toEqual({ title: 'Generated', value: 1000 });
    expect(d.getPanel('missing')).toBeNull();
    expect(d.panelNames().sort()).toEqual(['gen', 'qual']);
    expect(d.panelCount()).toBe(2);
  });

  it('SyntheticReport generate + toCSV', () => {
    const r = new SyntheticReport();
    expect(r.generate('Q1 Synth', { generated: 5000, filtered: 4500 })).toContain('# Q1 Synth');
    expect(r.toCSV({ a: 1 })).toContain('metric,value');
  });

  it('SyntheticConfig typed accessors', () => {
    const c = new SyntheticConfig();
    c.set('noise', 0.1).set('method', 'gpt').set('enabled', true);
    expect(c.getNumber('noise')).toBe(0.1);
    expect(c.getString('method')).toBe('gpt');
    expect(c.getBoolean('enabled')).toBe(true);
    expect(c.getNumber('missing', 0.5)).toBe(0.5);
    expect(c.getString('missing', 'fb')).toBe('fb');
    expect(c.getBoolean('missing', false)).toBe(false);
    expect(c.size()).toBe(3);
  });
});

describe('SyntheticAudit + SyntheticMigration', () => {
  it('SyntheticAudit record + records + forUser + totalSamples + count + clear', () => {
    const a = new SyntheticAudit();
    a.record('u1', 'generate', 100).record('u2', 'filter', 50);
    expect(a.count()).toBe(2);
    expect(a.totalSamples()).toBe(150);
    expect(a.forUser('u1')).toHaveLength(1);
    a.clear();
    expect(a.count()).toBe(0);
  });

  it('SyntheticMigration define + run + isApplied + counts', async () => {
    const m = new SyntheticMigration();
    let n = 0;
    m.define('v1', () => { n += 1; });
    m.define('v2', async () => { n += 1; });
    expect(await m.run('v1')).toBe(true);
    expect(await m.run('missing')).toBe(false);
    expect(m.isApplied('v1')).toBe(true);
    expect(m.migrationCount()).toBe(2);
    expect(m.appliedCount()).toBe(1);
  });
});

describe('SynthDataIntegrationIndex', () => {
  it('list has 7', () => {
    expect(new SynthDataIntegrationIndex().list()).toHaveLength(7);
  });

  it('count + engines + has', () => {
    const idx = new SynthDataIntegrationIndex();
    expect(idx.count()).toBe(7);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('SyntheticDashboard')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CU_BATCH_3_ENGINES const has 7', () => {
    expect(CU_BATCH_3_ENGINES).toHaveLength(7);
  });
});

describe('SynthDataMasterIndex', () => {
  it('list contains all 28 engines', () => {
    expect(new SynthDataMasterIndex().list()).toHaveLength(28);
  });

  it('count 28', () => {
    expect(new SynthDataMasterIndex().count()).toBe(28);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new SynthDataMasterIndex();
    expect(idx.has('SyntheticGenerator')).toBe(true);
    expect(idx.has('DistributionAnalyzer')).toBe(true);
    expect(idx.has('SyntheticDashboard')).toBe(true);
  });

  it('CU_ALL_ENGINES const has 28', () => {
    expect(CU_ALL_ENGINES).toHaveLength(28);
  });
});