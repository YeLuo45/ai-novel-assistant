// V5126-V5135: CS Federated Learning Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  FederatedCoordinator,
  LocalTrainer,
  ModelAggregator,
  SecureAggregator,
  DifferentialPrivacy,
  NoiseInjector,
  GradientClipper,
  PrivacyBudget,
  SecureProtocol,
  ClientRegistry,
  FedLearnCoreIndex,
  CS_BATCH_1_ENGINES
} from './FederatedLearningCore';

describe('FederatedCoordinator', () => {
  it('startRound + submitUpdate + beginAggregation + completeRound + currentRound + updates + status', () => {
    const c = new FederatedCoordinator();
    expect(c.currentRound()).toBe(0);
    const r1 = c.startRound();
    expect(r1).toBe(1);
    expect(c.status(r1)).toBe('collecting');
    expect(c.submitUpdate({ clientId: 'c1', weights: [0.1, 0.2], samples: 10, ts: Date.now() })).toBe(true);
    expect(c.updates(r1).length).toBe(1);
    expect(c.beginAggregation()).toBe(true);
    expect(c.submitUpdate({ clientId: 'c2', weights: [0.3], samples: 5, ts: Date.now() })).toBe(false);
    expect(c.completeRound()).toBe(true);
    expect(c.status(r1)).toBe('done');
    expect(c.status(999)).toBeNull();
  });
});

describe('LocalTrainer + ModelAggregator + SecureAggregator', () => {
  it('LocalTrainer trainStep + model + setModel + learningRate', () => {
    const t = new LocalTrainer([1.0, 2.0], 0.1);
    expect(t.learningRate()).toBe(0.1);
    const updated = t.trainStep([0.5, 0.5]);
    expect(updated[0]).toBeCloseTo(0.95);
    expect(updated[1]).toBeCloseTo(1.95);
    expect(t.model()).toEqual([1.0, 2.0]);
    t.setModel([3.0, 4.0]);
    expect(t.model()).toEqual([3.0, 4.0]);
  });

  it('ModelAggregator aggregate + averageWeights', () => {
    const m = new ModelAggregator();
    const updates = [
      { clientId: 'c1', weights: [0.4, 0.6], samples: 60, ts: 1 },
      { clientId: 'c2', weights: [0.6, 0.4], samples: 40, ts: 2 }
    ];
    const agg = m.aggregate(updates);
    expect(agg).toEqual([0.48, 0.52]); // 0.4*0.6 + 0.6*0.4 = 0.48
    expect(m.aggregate([])).toBeNull();
    expect(m.aggregate([{ clientId: 'c1', weights: [0.5], samples: 0, ts: 1 }])).toBeNull();
  });

  it('SecureAggregator mask + unmask + secureAggregate', () => {
    const s = new SecureAggregator();
    const update = { clientId: 'c1', weights: [0.1, 0.2], samples: 10, ts: 1 };
    const masked = s.mask(update, 42);
    expect(masked).not.toEqual(update.weights);
    const unmasked = s.unmask([masked], 42);
    expect(unmasked[0]).toBeCloseTo(0.1, 3);
    expect(s.unmask([], 42)).toEqual([]);
  });
});

describe('DifferentialPrivacy + NoiseInjector + GradientClipper + PrivacyBudget', () => {
  it('DP epsilon/delta + setEpsilon/setDelta + noiseScale', () => {
    const dp = new DifferentialPrivacy(1.0, 1e-5);
    expect(dp.epsilon()).toBe(1.0);
    expect(dp.delta()).toBe(1e-5);
    expect(dp.noiseScale(1)).toBe(1);
    dp.setEpsilon(0.5);
    expect(dp.epsilon()).toBe(0.5);
    expect(dp.noiseScale(1)).toBe(2);
  });

  it('NoiseInjector inject + laplaceNoise', () => {
    const n = new NoiseInjector();
    const noisy = n.inject([1.0, 2.0], 0.1, 42);
    expect(noisy).toHaveLength(2);
    expect(noisy).not.toEqual([1.0, 2.0]);
    expect(n.laplaceNoise([1.0], 0.1)).toHaveLength(1);
  });

  it('GradientClipper clip + globalNorm', () => {
    const g = new GradientClipper();
    expect(g.globalNorm([3, 4])).toBe(5);
    expect(g.clip([3, 4], 5)).toEqual([3, 4]); // already within
    expect(g.clip([3, 4], 2.5)).toEqual([1.5, 2]); // scaled
  });

  it('PrivacyBudget spend + remaining + spent + total', () => {
    const p = new PrivacyBudget(10);
    expect(p.spend(5)).toBe(true);
    expect(p.spend(6)).toBe(false); // over budget
    expect(p.spent()).toBe(5);
    expect(p.remaining()).toBe(5);
    expect(p.total()).toBe(10);
  });
});

describe('SecureProtocol + ClientRegistry + FedLearnCoreIndex', () => {
  it('SecureProtocol generateKey + getKey + rotateKey + hasKey', () => {
    const p = new SecureProtocol();
    expect(p.hasKey('c1')).toBe(false);
    const k = p.generateKey('c1');
    expect(p.getKey('c1')).toBe(k);
    expect(p.hasKey('c1')).toBe(true);
    expect(p.rotateKey('c1')).not.toBe(k);
    expect(p.getKey('missing')).toBeNull();
    expect(p.rotateKey('missing')).toBeNull();
  });

  it('ClientRegistry register + deregister + isActive + samples + activeClients + count', () => {
    const r = new ClientRegistry();
    r.register('c1', 100).register('c2', 200);
    expect(r.isActive('c1')).toBe(true);
    expect(r.samples('c1')).toBe(100);
    expect(r.deregister('c1')).toBe(true);
    expect(r.isActive('c1')).toBe(false);
    expect(r.activeClients()).toEqual(['c2']);
    expect(r.count()).toBe(2);
    expect(r.isActive('missing')).toBe(false);
    expect(r.samples('missing')).toBe(0);
    expect(r.deregister('missing')).toBe(false);
  });

  it('FedLearnCoreIndex', () => {
    expect(new FedLearnCoreIndex().list()).toHaveLength(11);
    const idx = new FedLearnCoreIndex();
    expect(idx.count()).toBe(11);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('FederatedCoordinator')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
    expect(CS_BATCH_1_ENGINES).toHaveLength(11);
  });
});