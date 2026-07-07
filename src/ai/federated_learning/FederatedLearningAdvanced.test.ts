// V5136-V5145: CS Federated Learning Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  RoundManager,
  ClientSelection,
  ModelVersioning,
  FLStrategy,
  AggregationRule,
  FedAvg,
  FedProx,
  FLAnalytics,
  PrivacyAccountant,
  FedLearnAdvancedIndex,
  CS_BATCH_2_ENGINES
} from './FederatedLearningAdvanced';

describe('RoundManager + ClientSelection', () => {
  it('RoundManager start + complete + isComplete + durationMs + participants + currentRound', async () => {
    const r = new RoundManager();
    const id = r.start(['c1', 'c2']);
    expect(id).toBe(1);
    expect(r.isComplete(id)).toBe(false);
    expect(r.participants(id)).toEqual(['c1', 'c2']);
    await new Promise(rs => setTimeout(rs, 5));
    expect(r.complete(id)).toBe(true);
    expect(r.isComplete(id)).toBe(true);
    expect(r.durationMs(id)).toBeGreaterThanOrEqual(0);
    expect(r.complete(id)).toBe(false);
    expect(r.durationMs(999)).toBe(0);
    expect(r.participants(999)).toEqual([]);
    expect(r.currentRound()).toBe(1);
  });

  it('ClientSelection select random + round-robin + top-samples', () => {
    const s = new ClientSelection();
    const all = ['c1', 'c2', 'c3', 'c4', 'c5'];
    expect(s.select(all, 2, 'round-robin')).toEqual(['c1', 'c2']);
    const top = s.select(all, 2, 'top-samples', new Map([['c1', 5], ['c2', 100], ['c3', 50], ['c4', 10], ['c5', 1]]));
    expect(top[0]).toBe('c2');
    expect(s.select(all, 100, 'round-robin').length).toBe(5);
    // random branch
    const r = s.select(all, 3, 'random');
    expect(r.length).toBe(3);
    // top-samples without samples arg → fallback to slice(0, k)
    expect(s.select(all, 2, 'top-samples').length).toBe(2);
  });
});

describe('ModelVersioning + FLStrategy + AggregationRule + FedAvg + FedProx', () => {
  it('ModelVersioning record + versionsOf + latest + rollback + count', () => {
    const v = new ModelVersioning();
    expect(v.record('m1')).toBe(1);
    expect(v.record('m1')).toBe(2);
    expect(v.record('m2')).toBe(1);
    expect(v.versionsOf('m1')).toEqual([1, 2]);
    expect(v.versionsOf('missing')).toEqual([]);
    expect(v.latest('m1')).toBe(2);
    expect(v.rollback('m1', 1)).toBe(true);
    expect(v.rollback('m1', 99)).toBe(false);
    expect(v.rollback('missing', 1)).toBe(false);
    expect(v.latest('missing')).toBe(0);
    expect(v.count()).toBe(2);
  });

  it('FLStrategy setStrategy + strategy + isProximal', () => {
    const s = new FLStrategy();
    expect(s.strategy()).toBe('fedavg');
    expect(s.isProximal()).toBe(false);
    s.setStrategy('fedprox');
    expect(s.isProximal()).toBe(true);
    s.setStrategy('scaffold');
    expect(s.isProximal()).toBe(true);
  });

  it('AggregationRule aggregate', () => {
    const r = new AggregationRule();
    const updates = [
      { weights: [0.4, 0.6], samples: 60, trust: 1.0 },
      { weights: [0.6, 0.4], samples: 40, trust: 1.0 }
    ];
    expect(r.aggregate(updates)).toEqual([0.48, 0.52]);
    expect(r.aggregate([])).toBeNull();
    expect(r.aggregate([{ weights: [0.5], samples: 0, trust: 0 }])).toBeNull();
  });

  it('FedAvg + FedProx', () => {
    const f = new FedAvg();
    expect(f.aggregate([{ weights: [0.4, 0.6], samples: 60 }, { weights: [0.6, 0.4], samples: 40 }])).toEqual([0.48, 0.52]);
    expect(f.aggregate([])).toBeNull();
    expect(f.aggregate([{ weights: [0.5], samples: 0 }])).toBeNull();
    const fp = new FedProx(0.5);
    expect(fp.mu()).toBe(0.5);
    expect(fp.applyProximal([1.0, 2.0], [0.0, 0.0])).toEqual([0.5, 1.0]); // w - mu*(w-0)
    expect(fp.applyProximal([1.0], [0.5])).toEqual([0.75]); // 1 - 0.5*(1-0.5)
    fp.setMu(0.1);
    expect(fp.mu()).toBe(0.1);
  });
});

describe('FLAnalytics + PrivacyAccountant + FedLearnAdvancedIndex', () => {
  it('FLAnalytics record + get + all + reset', () => {
    const a = new FLAnalytics();
    a.record('loss', 0.5).record('accuracy', 0.9).record('loss', 0.3);
    expect(a.get('loss')).toBe(0.8);
    expect(a.get('accuracy')).toBe(0.9);
    expect(a.get('missing')).toBe(0);
    expect(a.all()).toEqual({ loss: 0.8, accuracy: 0.9 });
    a.reset();
    expect(a.get('loss')).toBe(0);
  });

  it('PrivacyAccountant record + totalEpsilon + totalDelta + historyCount + history', () => {
    const p = new PrivacyAccountant();
    p.record(1.0, 1e-5);
    p.record(0.5, 2e-5);
    expect(p.totalEpsilon()).toBe(1.5);
    expect(p.totalDelta()).toBeCloseTo(3e-5);
    expect(p.historyCount()).toBe(2);
    expect(p.history()).toHaveLength(2);
  });

  it('FedLearnAdvancedIndex', () => {
    expect(new FedLearnAdvancedIndex().list()).toHaveLength(10);
    const idx = new FedLearnAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('RoundManager')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
    expect(CS_BATCH_2_ENGINES).toHaveLength(10);
  });
});