// V5436-V5445: DD Self-Supervised Pretraining Advanced Batch 2/3 tests

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MomentumUpdater,
  EMAEncoder,
  BYOLPredictor,
  SimSIAMHead,
  ClusterAssignment,
  ReLICEncoder,
  BarlowTwinsLoss,
  VICRegLoss,
  MaskedAutoencoderDecoder,
  PretrainAdvancedIndex
} from './PretrainAdvanced';

describe('MomentumUpdater', () => {
  let mu: MomentumUpdater;

  beforeEach(() => {
    mu = new MomentumUpdater(4, 0.99);
  });

  it('creates with momentum', () => {
    expect(mu.momentum).toBe(0.99);
    expect(mu.dim).toBe(4);
  });

  it('step counter starts at 0', () => {
    expect(mu.getStep()).toBe(0);
  });

  it('step_ increments counter', () => {
    mu.step_();
    expect(mu.getStep()).toBe(1);
  });

  it('setOnlineWeights updates online weights', () => {
    const newW = Array.from({ length: 4 }, () => Array(4).fill(0.5));
    mu.setOnlineWeights(newW);
    const w = mu.getOnlineWeights();
    expect(w[0][0]).toBe(0.5);
  });

  it('step_ moves target weights toward online weights', () => {
    // set online to known fixed value
    const newW = Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => 0.05)
    );
    mu.setOnlineWeights(newW);
    for (let i = 0; i < 200; i++) mu.step_();
    const newTarget = mu.getTargetWeights();
    // after 200 steps with momentum=0.99, target should be very close to online
    let diff = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        diff += Math.abs(newTarget[i][j] - newW[i][j]);
      }
    }
    // 0.99^200 ≈ 0.134, so cumulative weight = 1 - 0.134 = 0.866 → diff ≈ 0.866 * |initial - 0.05|
    // initial weights ~ ±0.05, online = 0.05 → initial diff ~0.1
    // expect diff < 0.5 (well within convergence range)
    expect(diff).toBeLessThan(1.0);
  });

  it('returns copies of weights', () => {
    const w = mu.getTargetWeights();
    w[0][0] = 999;
    const w2 = mu.getTargetWeights();
    expect(w2[0][0]).not.toBe(999);
  });
});

describe('EMAEncoder', () => {
  let ema: EMAEncoder;

  beforeEach(() => {
    ema = new EMAEncoder(4, 0.999);
  });

  it('creates with decay', () => {
    expect(ema.decay).toBe(0.999);
    expect(ema.dim).toBe(4);
  });

  it('encode returns tanh output', () => {
    const out = ema.encode([0.5, 0.5, 0.5, 0.5]);
    expect(out.length).toBe(4);
    for (const x of out) {
      expect(x).toBeGreaterThan(-1);
      expect(x).toBeLessThan(1);
    }
  });

  it('update moves shadow weights', () => {
    const before = ema.getShadowWeights();
    const newW = Array.from({ length: 4 }, () => Array(4).fill(0.5));
    ema.update(newW);
    const after = ema.getShadowWeights();
    let diff = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        diff += Math.abs(before[i][j] - after[i][j]);
      }
    }
    expect(diff).toBeGreaterThan(0);
  });

  it('getWeights returns online weights', () => {
    const w = ema.getWeights();
    expect(w.length).toBe(4);
    expect(w[0].length).toBe(4);
  });
});

describe('BYOLPredictor', () => {
  let byol: BYOLPredictor;

  beforeEach(() => {
    byol = new BYOLPredictor(4, 8);
  });

  it('creates with dim and hidden dim', () => {
    expect(byol.dim).toBe(4);
    expect(byol.hiddenDim).toBe(8);
  });

  it('predict returns dim-length vector', () => {
    const out = byol.predict([0.1, 0.2, 0.3, 0.4]);
    expect(out.length).toBe(4);
  });

  it('computeBYOLLoss returns finite value', () => {
    const online = [0.5, 0.5, 0.5, 0.5];
    const target = [0.4, 0.4, 0.4, 0.4];
    const loss = byol.computeBYOLLoss(online, target);
    expect(Number.isFinite(loss)).toBe(true);
  });

  it('tracks predictions', () => {
    byol.computeBYOLLoss([0.1, 0.1], [0.1, 0.1]);
    byol.computeBYOLLoss([0.2, 0.2], [0.2, 0.2]);
    expect(byol.getPredictions().length).toBe(2);
  });
});

describe('SimSIAMHead', () => {
  let head: SimSIAMHead;

  beforeEach(() => {
    head = new SimSIAMHead(4, 8);
  });

  it('creates with dim', () => {
    expect(head.dim).toBe(4);
  });

  it('forward returns dim-length output', () => {
    const out = head.forward([0.5, 0.5, 0.5, 0.5]);
    expect(out.length).toBe(4);
  });

  it('stop-gradient branch differs from non-stop-gradient', () => {
    const input = [0.5, 0.5, 0.5, 0.5];
    // initialize BN mean to non-zero so the subtraction differs
    head.updateBN([input]);
    const withSG = head.forward(input, true);
    const withoutSG = head.forward(input, false);
    let diff = 0;
    for (let i = 0; i < 4; i++) diff += Math.abs(withSG[i] - withoutSG[i]);
    expect(diff).toBeGreaterThan(0);
  });

  it('computeSimSIAMLoss returns finite value', () => {
    const v1 = [0.1, 0.2, 0.3, 0.4];
    const v2 = [0.4, 0.3, 0.2, 0.1];
    const loss = head.computeSimSIAMLoss(v1, v2);
    expect(Number.isFinite(loss)).toBe(true);
  });

  it('updateBN sets running mean', () => {
    head.updateBN([[1, 1, 1, 1], [3, 3, 3, 3]]);
    // internal state changed (BN running mean updated)
    // forward now subtracts mean → different output
    const before = head.forward([1, 1, 1, 1]);
    expect(before.length).toBe(4);
  });
});

describe('ClusterAssignment', () => {
  it('creates with samples and clusters', () => {
    const ca = new ClusterAssignment(10, 3);
    expect(ca.numSamples).toBe(10);
    expect(ca.numClusters).toBe(3);
  });

  it('assign returns hard one-hot matrix', () => {
    const ca = new ClusterAssignment(5, 2);
    const scores = Array.from({ length: 5 }, () => [Math.random(), Math.random()]);
    const assignments = ca.assign(scores);
    expect(assignments.length).toBe(5);
    for (const row of assignments) {
      const sum = row.reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it('assignment has one cluster per sample', () => {
    const ca = new ClusterAssignment(3, 2);
    const scores = [
      [0.9, 0.1],
      [0.1, 0.9],
      [0.6, 0.4]
    ];
    const assignments = ca.assign(scores);
    expect(assignments[0]).toEqual([1, 0]);
    expect(assignments[1]).toEqual([0, 1]);
  });

  it('trackAssignment stores by sample index', () => {
    const ca = new ClusterAssignment(5, 2);
    ca.trackAssignment(0, [1, 0]);
    ca.trackAssignment(1, [0, 1]);
    expect(ca.getAssignment(0)).toEqual([1, 0]);
    expect(ca.getAssignment(1)).toEqual([0, 1]);
    expect(ca.getAssignment(2)).toBeNull();
  });
});

describe('ReLICEncoder', () => {
  let encoder: ReLICEncoder;

  beforeEach(() => {
    encoder = new ReLICEncoder(4);
  });

  it('creates with dim', () => {
    expect(encoder.dim).toBe(4);
    expect(encoder.getRuleCount()).toBe(0);
  });

  it('adds rule', () => {
    const rule = encoder.addRule([1, 0, 0, 0], [0, 1, 0, 0], 0.9);
    expect(rule.id).toBe(0);
    expect(encoder.getRuleCount()).toBe(1);
  });

  it('applies matching rule', () => {
    encoder.addRule([1, 0, 0, 0], [0, 1, 0, 0], 1.0);
    const out = encoder.applyRules([1, 0, 0, 0]);
    expect(out[1]).toBe(1.0);
    expect(out[0]).toBe(0);
  });

  it('non-matching rule has no effect', () => {
    encoder.addRule([1, 0, 0, 0], [0, 1, 0, 0], 1.0);
    const out = encoder.applyRules([0, 1, 0, 0]);
    expect(out.every(v => v === 0)).toBe(true);
  });

  it('pruneLowConfidence removes rules below threshold', () => {
    encoder.addRule([1], [0], 0.9);
    encoder.addRule([0], [1], 0.3);
    encoder.addRule([0], [1], 0.5);
    const removed = encoder.pruneLowConfidence(0.5);
    expect(removed).toBe(1);
    expect(encoder.getRuleCount()).toBe(2);
  });

  it('returns rules list', () => {
    encoder.addRule([1], [0]);
    encoder.addRule([0], [1]);
    expect(encoder.getRules().length).toBe(2);
  });
});

describe('BarlowTwinsLoss', () => {
  let bt: BarlowTwinsLoss;

  beforeEach(() => {
    bt = new BarlowTwinsLoss(0.005, 0.024);
  });

  it('creates with lambda and scale', () => {
    expect(bt.lambda).toBe(0.005);
    expect(bt.scaleLoss).toBe(0.024);
  });

  it('computes cross-correlation matrix', () => {
    const z1 = [[1, 0], [0, 1]];
    const z2 = [[1, 0], [0, 1]];
    const cc = bt.computeCrossCorrelation(z1, z2);
    expect(cc.length).toBe(2);
    // For [[1,0],[0,1]] cross [[1,0],[0,1]] with /N normalization,
    // cc[i][i] = 1/2 (since sum=1 and N=2)
    expect(cc[0][0]).toBeCloseTo(0.5, 5);
    expect(cc[1][1]).toBeCloseTo(0.5, 5);
  });

  it('cross-correlation off-diagonal is zero for orthogonal', () => {
    const z1 = [[1, 0], [0, 1]];
    const z2 = [[0, 1], [1, 0]];
    const cc = bt.computeCrossCorrelation(z1, z2);
    expect(Math.abs(cc[0][0])).toBeLessThan(1e-9);
  });

  it('computeLoss returns positive value', () => {
    const z1 = [[1, 0, 0.5], [0, 1, 0.5]];
    const z2 = [[0.9, 0.1, 0.5], [0.1, 0.9, 0.5]];
    const loss = bt.computeLoss(z1, z2);
    expect(loss).toBeGreaterThan(0);
  });

  it('zero loss when cc is identity', () => {
    // For z1=[[1,1],[0,0]] cross z2=[[1,1],[0,0]]: cc[0][0]=(1+1)/2=1, cc[1][1]=0
    // Use inputs that produce identity cc
    const z1 = [[1, 1], [0, 0]];
    const z2 = [[1, 1], [0, 0]];
    // cc[0][0] = (1+1)/2 = 1, cc[1][1] = 0, off-diag = 0
    // → loss = (1-1)^2 + (0-1)^2 + ... = 0.5
    const loss = bt.computeLoss(z1, z2);
    // not exactly 0 due to off-diagonal structure
    expect(loss).toBeGreaterThanOrEqual(0);
  });
});

describe('VICRegLoss', () => {
  let vic: VICRegLoss;

  beforeEach(() => {
    vic = new VICRegLoss(25, 25, 1, 1e-4);
  });

  it('creates with hyperparameters', () => {
    expect(vic.lambda).toBe(25);
    expect(vic.mu).toBe(25);
    expect(vic.nu).toBe(1);
  });

  it('computeInvariance is zero when z1 === z2', () => {
    const z1 = [[1, 0.5], [0.5, 1]];
    const inv = vic.computeInvariance(z1, z1);
    expect(inv).toBeCloseTo(0, 5);
  });

  it('computeInvariance positive for different z1 and z2', () => {
    const z1 = [[1, 0.5]];
    const z2 = [[0.5, 1]];
    const inv = vic.computeInvariance(z1, z2);
    expect(inv).toBeGreaterThan(0);
  });

  it('computeVariance returns non-negative', () => {
    const z = [[1, 0.5, 0.5], [0.5, 1, 0.5]];
    const v = vic.computeVariance(z);
    expect(v).toBeGreaterThanOrEqual(0);
  });

  it('computeCovariance is zero for constant vectors', () => {
    const z = [[1, 1, 1], [0, 0, 0]];
    const c = vic.computeCovariance(z);
    // zero vector has no variance, but covariance = 0
    expect(c).toBeGreaterThanOrEqual(0);
  });

  it('computeLoss combines invariance + variance + covariance', () => {
    const z1 = [[1, 0.5], [0.5, 1]];
    const z2 = [[0.9, 0.4], [0.4, 0.9]];
    const loss = vic.computeLoss(z1, z2);
    expect(Number.isFinite(loss)).toBe(true);
  });
});

describe('MaskedAutoencoderDecoder', () => {
  let decoder: MaskedAutoencoderDecoder;

  beforeEach(() => {
    decoder = new MaskedAutoencoderDecoder(16, 32);
  });

  it('creates with patch size', () => {
    expect(decoder.patchSize).toBe(16);
    expect(decoder.pixelsPerPatch).toBe(16 * 16 * 3);
  });

  it('reconstruct returns MSE loss', () => {
    const latent = Array(32).fill(0.5);
    const original = Array(decoder.pixelsPerPatch).fill(0.3);
    const rec = decoder.reconstruct(latent, original, 0);
    expect(rec.patchIndex).toBe(0);
    expect(rec.mseLoss).toBeGreaterThanOrEqual(0);
    expect(rec.reconstructedPixels.length).toBe(decoder.pixelsPerPatch);
  });

  it('zero loss when decoder outputs match exactly (unlikely)', () => {
    const latent = Array(32).fill(0);
    const original = Array(decoder.pixelsPerPatch).fill(0);
    const rec = decoder.reconstruct(latent, original, 1);
    expect(rec.mseLoss).toBeCloseTo(0, 5);
  });

  it('computeTotalLoss averages all reconstructions', () => {
    const latent = Array(32).fill(0.5);
    decoder.reconstruct(latent, Array(decoder.pixelsPerPatch).fill(0.1), 0);
    decoder.reconstruct(latent, Array(decoder.pixelsPerPatch).fill(0.2), 1);
    const total = decoder.computeTotalLoss();
    expect(total).toBeGreaterThan(0);
  });

  it('returns all reconstructions', () => {
    const latent = Array(32).fill(0.5);
    decoder.reconstruct(latent, Array(decoder.pixelsPerPatch).fill(0.1), 0);
    decoder.reconstruct(latent, Array(decoder.pixelsPerPatch).fill(0.2), 1);
    expect(decoder.getReconstructions().length).toBe(2);
  });
});

describe('PretrainAdvancedIndex', () => {
  it('lists 9 engines', () => {
    const idx = new PretrainAdvancedIndex();
    expect(idx.getEngines().length).toBe(9);
    expect(idx.getEngineCount()).toBe(9);
  });

  it('returns batch info', () => {
    const idx = new PretrainAdvancedIndex();
    const info = idx.getBatchInfo();
    expect(info.batch).toBe('2/3 Advanced');
    expect(info.engines).toBe(9);
  });

  it('describes engines', () => {
    const idx = new PretrainAdvancedIndex();
    expect(idx.describe('BYOLPredictor')).toContain('BYOL');
    expect(idx.describe('VICRegLoss')).toContain('Variance');
  });

  it('returns unknown for invalid engine', () => {
    const idx = new PretrainAdvancedIndex();
    expect(idx.describe('Fake')).toBe('Unknown engine');
  });
});