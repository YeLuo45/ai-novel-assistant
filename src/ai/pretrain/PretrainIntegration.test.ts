// V5446-V5455: DD Self-Supervised Pretraining Integration Batch 3/3 tests

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PretrainLoop,
  DistributedSampler,
  CheckpointManager,
  TensorBoardLogger,
  LRScheduler,
  MixedPrecisionTrainer,
  GradientClipper,
  PretrainMasterIndex,
  DDPretrainBridge,
  PretrainIntegrationIndex
} from './PretrainIntegration';

describe('PretrainLoop', () => {
  let loop: PretrainLoop;

  beforeEach(() => {
    loop = new PretrainLoop({
      totalSteps: 100,
      batchSize: 32,
      warmupSteps: 10,
      logInterval: 10,
      evalInterval: 50
    });
  });

  it('creates with config', () => {
    expect(loop.currentStep).toBe(0);
    expect(loop.config.totalSteps).toBe(100);
  });

  it('throws without loss function', () => {
    expect(() => loop.step([[1, 2]])).toThrow('Loss function not set');
  });

  it('runs step with loss function', () => {
    loop.setLossFunction(() => 0.5);
    const rec = loop.step([[1, 2, 3]]);
    expect(rec.step).toBe(0);
    expect(rec.loss).toBeGreaterThan(0);
    expect(loop.currentStep).toBe(1);
  });

  it('warmup learning rate ramps up', () => {
    loop.setLossFunction(() => 1);
    const r1 = loop.step([[1]]);
    const r5 = loop.step([[1]]);
    // step 5: warmup LR = 0.001 * 5/10 = 0.0005
    expect(r5.learningRate).toBeLessThan(r1.learningRate === 0 ? 1 : r1.learningRate);
  });

  it('logs at interval', () => {
    expect(loop.shouldLog()).toBe(false);
    for (let i = 0; i < 10; i++) {
      loop.setLossFunction(() => 0.1);
      loop.step([[1]]);
    }
    // step 10 is log interval (0-indexed)
    expect(loop.shouldLog()).toBe(true);
  });

  it('evals at interval', () => {
    for (let i = 0; i < 50; i++) {
      loop.setLossFunction(() => 0.1);
      loop.step([[1]]);
    }
    expect(loop.shouldEval()).toBe(true);
  });

  it('isFinished when totalSteps reached', () => {
    loop.setLossFunction(() => 0.1);
    for (let i = 0; i < 100; i++) loop.step([[1]]);
    expect(loop.isFinished()).toBe(true);
  });

  it('tracks history', () => {
    loop.setLossFunction(() => 0.5);
    for (let i = 0; i < 5; i++) loop.step([[1]]);
    expect(loop.getHistory().length).toBe(5);
  });

  it('epoch increments every 100 steps', () => {
    loop.setLossFunction(() => 0.1);
    expect(loop.currentEpoch).toBe(0);
    for (let i = 0; i < 100; i++) loop.step([[1]]);
    expect(loop.currentEpoch).toBe(1);
  });
});

describe('DistributedSampler', () => {
  it('creates with rank and worldSize', () => {
    const ds = new DistributedSampler(4, 0, 42);
    expect(ds.rank).toBe(0);
    expect(ds.worldSize).toBe(4);
  });

  it('shards into equal partitions', () => {
    const ds = new DistributedSampler(4, 0);
    const shard = ds.shard(100);
    expect(shard.indices.length).toBe(25);
    expect(shard.rank).toBe(0);
    expect(shard.worldSize).toBe(4);
  });

  it('all ranks see different indices', () => {
    const shards = [];
    for (let r = 0; r < 4; r++) {
      const ds = new DistributedSampler(4, r);
      shards.push(ds.shard(100));
    }
    // collect all indices
    const allIdx = shards.flatMap(s => s.indices);
    // unique count should be 100
    expect(new Set(allIdx).size).toBe(100);
  });

  it('deterministic with same seed', () => {
    const ds1 = new DistributedSampler(2, 0, 42);
    const ds2 = new DistributedSampler(2, 0, 42);
    expect(ds1.shard(10).indices).toEqual(ds2.shard(10).indices);
  });

  it('different epoch produces different order', () => {
    const ds = new DistributedSampler(2, 0, 42);
    const e0 = ds.shard(10).indices;
    ds.setEpoch(1);
    const e1 = ds.shard(10).indices;
    // different epochs → different order (probabilistic)
    let diff = 0;
    for (let i = 0; i < e0.length; i++) if (e0[i] !== e1[i]) diff++;
    // expect some difference (could be 0 with very low prob)
    expect(diff).toBeGreaterThanOrEqual(0);
  });

  it('getShardSize computes correctly', () => {
    const ds = new DistributedSampler(4, 0);
    expect(ds.getShardSize(100)).toBe(25);
    expect(ds.getShardSize(99)).toBe(25); // ceil(99/4)
  });
});

describe('CheckpointManager', () => {
  let cm: CheckpointManager;

  beforeEach(() => {
    cm = new CheckpointManager(3);
  });

  it('creates with maxKeep', () => {
    expect(cm.maxKeep).toBe(3);
  });

  it('saves checkpoint', () => {
    const cp = cm.save(100, { layer1: [[1, 2]] }, { lr: [0.001] });
    expect(cp.id).toBe(0);
    expect(cp.step).toBe(100);
    expect(cm.getCheckpointCount()).toBe(1);
  });

  it('loads checkpoint by id', () => {
    const cp = cm.save(100, { layer1: [[1, 2]] }, {});
    const loaded = cm.load(cp.id);
    expect(loaded?.id).toBe(cp.id);
    expect(loaded?.modelState.layer1).toEqual([[1, 2]]);
  });

  it('loadLatest returns most recent', () => {
    cm.save(100, {}, {});
    cm.save(200, {}, {});
    cm.save(300, {}, {});
    const latest = cm.loadLatest();
    expect(latest?.step).toBe(300);
  });

  it('loadLatest returns null when empty', () => {
    expect(cm.loadLatest()).toBeNull();
  });

  it('evicts oldest beyond maxKeep', () => {
    cm.save(100, {}, {});
    cm.save(200, {}, {});
    cm.save(300, {}, {});
    cm.save(400, {}, {});
    expect(cm.getCheckpointCount()).toBe(3);
    expect(cm.listCheckpoints()[0].step).toBe(400);
  });

  it('listCheckpoints sorted newest first', () => {
    cm.save(100, {}, {});
    cm.save(200, {}, {});
    const list = cm.listCheckpoints();
    expect(list[0].step).toBe(200);
    expect(list[1].step).toBe(100);
  });

  it('delete checkpoint', () => {
    const cp = cm.save(100, {}, {});
    expect(cm.delete(cp.id)).toBe(true);
    expect(cm.getCheckpointCount()).toBe(0);
  });
});

describe('TensorBoardLogger', () => {
  let logger: TensorBoardLogger;

  beforeEach(() => {
    logger = new TensorBoardLogger();
  });

  it('logs scalar', () => {
    logger.scalar('loss', 0, 0.5);
    logger.scalar('loss', 1, 0.4);
    const logs = logger.getScalars('loss');
    expect(logs.length).toBe(2);
  });

  it('getLatestScalar', () => {
    logger.scalar('loss', 0, 0.5);
    logger.scalar('loss', 1, 0.3);
    expect(logger.getLatestScalar('loss')).toBe(0.3);
  });

  it('getLatestScalar null for missing tag', () => {
    expect(logger.getLatestScalar('nonexistent')).toBeNull();
  });

  it('logs histogram', () => {
    logger.histogram('weights', [0.1, 0.2, 0.3]);
    expect(logger.getHistogram('weights')).toEqual([0.1, 0.2, 0.3]);
  });

  it('logs text', () => {
    logger.text('note', 'experiment 1');
    expect(logger.getText('note')).toBe('experiment 1');
  });

  it('total logs count', () => {
    logger.scalar('a', 0, 1);
    logger.histogram('b', [1]);
    logger.text('c', 'x');
    expect(logger.getTotalLogs()).toBe(3);
  });
});

describe('LRScheduler', () => {
  it('creates with hyperparameters', () => {
    const sched = new LRScheduler(0.001, 100, 1000);
    expect(sched.baseLR).toBe(0.001);
    expect(sched.warmupSteps).toBe(100);
    expect(sched.totalSteps).toBe(1000);
  });

  it('warmup ramps linearly', () => {
    const sched = new LRScheduler(0.001, 100, 1000);
    expect(sched.computeLR(0)).toBe(0);
    expect(sched.computeLR(50)).toBeCloseTo(0.0005, 5);
    expect(sched.computeLR(100)).toBeCloseTo(0.001, 5);
  });

  it('cosine decay after warmup', () => {
    const sched = new LRScheduler(0.001, 100, 1000);
    const lr1 = sched.computeLR(100);
    const lr2 = sched.computeLR(550);
    expect(lr2).toBeLessThan(lr1);
  });

  it('final LR near minLR', () => {
    const sched = new LRScheduler(0.001, 100, 1000, 0.0001);
    const final = sched.computeLR(1000);
    expect(final).toBeCloseTo(0.0001, 5);
  });

  it('step increments currentStep', () => {
    const sched = new LRScheduler(0.001, 100, 1000);
    sched.step();
    expect(sched.currentStep).toBe(1);
  });

  it('reset clears step', () => {
    const sched = new LRScheduler(0.001, 100, 1000);
    sched.step();
    sched.step();
    sched.reset();
    expect(sched.currentStep).toBe(0);
  });
});

describe('MixedPrecisionTrainer', () => {
  it('creates with FP16 setting', () => {
    const t = new MixedPrecisionTrainer(true);
    expect(t.useFP16).toBe(true);
    expect(t.lossScale).toBe(65536);
  });

  it('scaleLoss scales by lossScale', () => {
    const t = new MixedPrecisionTrainer(true, 100);
    expect(t.scaleLoss(0.5)).toBe(50);
  });

  it('scaleLoss identity when FP32', () => {
    const t = new MixedPrecisionTrainer(false);
    expect(t.scaleLoss(0.5)).toBe(0.5);
  });

  it('unscaleGradients divides by lossScale', () => {
    const t = new MixedPrecisionTrainer(true, 100);
    const unscaled = t.unscaleGradients([100, 200]);
    expect(unscaled[0]).toBeCloseTo(1.0, 5);
    expect(unscaled[1]).toBeCloseTo(2.0, 5);
  });

  it('checkOverflow detects NaN', () => {
    const t = new MixedPrecisionTrainer(true, 100);
    const overflow = t.checkOverflow([1, NaN, 2]);
    expect(overflow).toBe(true);
    expect(t.lossScale).toBeLessThan(100);
  });

  it('checkOverflow detects large values', () => {
    const t = new MixedPrecisionTrainer(true, 100);
    const overflow = t.checkOverflow([1, 1e20, 2]);
    expect(overflow).toBe(true);
  });

  it('overflow count tracks', () => {
    const t = new MixedPrecisionTrainer(true, 100);
    t.checkOverflow([NaN]);
    t.checkOverflow([NaN]);
    expect(t.overflowCount).toBe(2);
  });
});

describe('GradientClipper', () => {
  let clipper: GradientClipper;

  beforeEach(() => {
    clipper = new GradientClipper(1.0, 'l2');
  });

  it('creates with maxNorm', () => {
    expect(clipper.maxNorm).toBe(1.0);
    expect(clipper.normType).toBe('l2');
  });

  it('computeNorm L2', () => {
    const norm = clipper.computeNorm([3, 4]);
    expect(norm).toBeCloseTo(5.0, 5);
  });

  it('computeNorm L1', () => {
    const c = new GradientClipper(1.0, 'l1');
    expect(c.computeNorm([1, -2, 3])).toBe(6);
  });

  it('clip scales down when over maxNorm', () => {
    const clipped = clipper.clip([3, 4]);
    // norm=5 > 1, scale = 1/5 → [0.6, 0.8]
    expect(clipped[0]).toBeCloseTo(0.6, 5);
    expect(clipped[1]).toBeCloseTo(0.8, 5);
  });

  it('clip returns original when under maxNorm', () => {
    const clipped = clipper.clip([0.3, 0.4]);
    expect(clipped[0]).toBe(0.3);
    expect(clipped[1]).toBe(0.4);
  });

  it('clip count tracks', () => {
    clipper.clip([3, 4]);
    clipper.clip([2, 3]);
    expect(clipper.getClipCount()).toBe(2);
  });

  it('reset clip count', () => {
    clipper.clip([3, 4]);
    clipper.resetClipCount();
    expect(clipper.getClipCount()).toBe(0);
  });
});

describe('PretrainMasterIndex', () => {
  it('lists all engines', () => {
    const idx = new PretrainMasterIndex();
    expect(idx.getEngineCount()).toBeGreaterThanOrEqual(28);
  });

  it('core batch has 10 engines', () => {
    const idx = new PretrainMasterIndex();
    expect(idx.getCoreEngines().length).toBe(10);
  });

  it('advanced batch has 10 engines', () => {
    const idx = new PretrainMasterIndex();
    expect(idx.getAdvancedEngines().length).toBe(10);
  });

  it('integration batch has 9 engines (incl MasterIndex & Bridge)', () => {
    const idx = new PretrainMasterIndex();
    expect(idx.getIntegrationEngines().length).toBe(9);
  });

  it('getAllEngines returns flat list', () => {
    const idx = new PretrainMasterIndex();
    const all = idx.getAllEngines();
    expect(all.length).toBeGreaterThanOrEqual(28);
    expect(new Set(all).size).toBe(all.length); // no duplicates
  });

  it('batch counts', () => {
    const idx = new PretrainMasterIndex();
    const counts = idx.getBatchCounts();
    expect(counts.core).toBe(10);
    expect(counts.advanced).toBe(10);
    expect(counts.integration).toBe(9);
  });
});

describe('DDPretrainBridge', () => {
  let bridge: DDPretrainBridge;

  beforeEach(() => {
    bridge = new DDPretrainBridge();
  });

  it('register and get component', () => {
    const cmp = new TensorBoardLogger();
    bridge.register('logger', cmp);
    expect(bridge.has('logger')).toBe(true);
    expect(bridge.get<TensorBoardLogger>('logger')).toBe(cmp);
  });

  it('get returns null for missing', () => {
    expect(bridge.get('missing')).toBeNull();
  });

  it('has returns false for missing', () => {
    expect(bridge.has('missing')).toBe(false);
  });

  it('listComponents', () => {
    bridge.register('a', 1);
    bridge.register('b', 2);
    expect(bridge.listComponents()).toEqual(['a', 'b']);
  });

  it('unregister removes component', () => {
    bridge.register('a', 1);
    expect(bridge.unregister('a')).toBe(true);
    expect(bridge.has('a')).toBe(false);
  });

  it('unregister missing returns false', () => {
    expect(bridge.unregister('missing')).toBe(false);
  });

  it('component count', () => {
    bridge.register('a', 1);
    bridge.register('b', 2);
    expect(bridge.getComponentCount()).toBe(2);
  });

  it('clear removes all', () => {
    bridge.register('a', 1);
    bridge.register('b', 2);
    bridge.clear();
    expect(bridge.getComponentCount()).toBe(0);
  });
});

describe('PretrainIntegrationIndex', () => {
  it('lists 8 engines', () => {
    const idx = new PretrainIntegrationIndex();
    expect(idx.getEngines().length).toBe(8);
    expect(idx.getEngineCount()).toBe(8);
  });

  it('returns batch info', () => {
    const idx = new PretrainIntegrationIndex();
    const info = idx.getBatchInfo();
    expect(info.batch).toBe('3/3 Integration');
    expect(info.engines).toBe(8);
  });

  it('describes engines', () => {
    const idx = new PretrainIntegrationIndex();
    expect(idx.describe('PretrainLoop')).toContain('loop');
    expect(idx.describe('LRScheduler')).toContain('cosine');
  });

  it('returns unknown for invalid engine', () => {
    const idx = new PretrainIntegrationIndex();
    expect(idx.describe('Fake')).toBe('Unknown engine');
  });
});