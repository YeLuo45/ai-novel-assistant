// V5146-V5155: CS Federated Learning Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  FLDashboard,
  FLReport,
  FLConfig,
  FLAudit,
  FLProfile,
  FLRun,
  FedLearnIntegrationIndex,
  FedLearnMasterIndex,
  CS_BATCH_3_ENGINES,
  CS_ALL_ENGINES
} from './FederatedLearningIntegration';

describe('FLDashboard + FLReport + FLConfig', () => {
  it('FLDashboard setPanel + getPanel + panelNames + panelCount', () => {
    const d = new FLDashboard();
    d.setPanel('clients', 'Active Clients', 50).setPanel('rounds', 'Rounds Done', 100);
    expect(d.getPanel('clients')).toEqual({ title: 'Active Clients', value: 50 });
    expect(d.getPanel('missing')).toBeNull();
    expect(d.panelNames().sort()).toEqual(['clients', 'rounds']);
    expect(d.panelCount()).toBe(2);
  });

  it('FLReport generate + toCSV', () => {
    const r = new FLReport();
    expect(r.generate('Q1 FL', { rounds: 100, accuracy: 0.92 })).toContain('# Q1 FL');
    expect(r.toCSV({ a: 1 })).toContain('metric,value');
  });

  it('FLConfig typed accessors', () => {
    const c = new FLConfig();
    c.set('rounds', 100).set('strategy', 'fedavg').set('dp', true);
    expect(c.getNumber('rounds')).toBe(100);
    expect(c.getString('strategy')).toBe('fedavg');
    expect(c.getBoolean('dp')).toBe(true);
    expect(c.getNumber('missing', 50)).toBe(50);
    expect(c.getString('missing', 'fb')).toBe('fb');
    expect(c.getBoolean('missing', false)).toBe(false);
    expect(c.size()).toBe(3);
  });
});

describe('FLAudit + FLProfile + FLRun', () => {
  it('FLAudit record + records + forRound + count + clear', () => {
    const a = new FLAudit();
    a.record('u1', 'train', 1).record('u1', 'submit', 1).record('u2', 'train', 2);
    expect(a.count()).toBe(3);
    expect(a.forRound(1)).toHaveLength(2);
    a.clear();
    expect(a.count()).toBe(0);
  });

  it('FLProfile record + runs + averageLoss', () => {
    const p = new FLProfile();
    p.record('sysA', 1000, 0.5).record('sysA', 2000, 0.3);
    expect(p.runs('sysA')).toHaveLength(2);
    expect(p.averageLoss('sysA')).toBeCloseTo(0.4);
    expect(p.averageLoss('missing')).toBe(0);
  });

  it('FLRun start + complete + result + age + count', async () => {
    const r = new FLRun();
    const id = r.start();
    expect(r.result(id)).toBeNull();
    expect(r.complete(id, { accuracy: 0.9 })).toBe(true);
    expect(r.complete('missing', {})).toBe(false);
    expect(r.result(id)).toEqual({ accuracy: 0.9 });
    await new Promise(rs => setTimeout(rs, 5));
    expect(r.age(id)).toBeGreaterThan(0);
    expect(r.age('missing')).toBe(-1);
    expect(r.count()).toBe(1);
  });
});

describe('FedLearnIntegrationIndex', () => {
  it('list has 8', () => {
    expect(new FedLearnIntegrationIndex().list()).toHaveLength(8);
  });

  it('count + engines + has', () => {
    const idx = new FedLearnIntegrationIndex();
    expect(idx.count()).toBe(8);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('FLDashboard')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CS_BATCH_3_ENGINES const has 8', () => {
    expect(CS_BATCH_3_ENGINES).toHaveLength(8);
  });
});

describe('FedLearnMasterIndex', () => {
  it('list contains all 29 engines', () => {
    expect(new FedLearnMasterIndex().list()).toHaveLength(29);
  });

  it('count 29', () => {
    expect(new FedLearnMasterIndex().count()).toBe(29);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new FedLearnMasterIndex();
    expect(idx.has('FederatedCoordinator')).toBe(true);
    expect(idx.has('RoundManager')).toBe(true);
    expect(idx.has('FLDashboard')).toBe(true);
  });

  it('CS_ALL_ENGINES const has 29', () => {
    expect(CS_ALL_ENGINES).toHaveLength(29);
  });
});