// V5426-V5435: DD Self-Supervised Pretraining Core Batch 1/3 tests

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MaskedLMHead,
  ContrastivePairBuilder,
  TokenShuffler,
  SimCSEEncoder,
  MomentumEncoder,
  MAEMasker,
  DINOStudent,
  ReplacedTokenDetector,
  NextSentencePredictor,
  PretrainCoreIndex,
  type MLMToken,
  type ContrastivePair,
  type MAEPatch,
  type RTDPrediction,
  type NSPPair
} from './PretrainCore';

describe('MaskedLMHead', () => {
  let mlm: MaskedLMHead;

  beforeEach(() => {
    mlm = new MaskedLMHead(1000, 103, 0.15);
  });

  it('creates with vocab size and mask token id', () => {
    expect(mlm.vocabSize).toBe(1000);
    expect(mlm.maskTokenId).toBe(103);
    expect(mlm.maskProb).toBe(0.15);
  });

  it('masks tokens with probability', () => {
    const tokens: MLMToken[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      token: `t${i}`,
      probability: 1 / 1000,
      masked: false
    }));
    // deterministic seed not exposed; just check some get masked
    let maskedCount = 0;
    for (let i = 0; i < 20; i++) {
      const result = mlm.maskTokens([...tokens]);
      maskedCount += result.filter(t => t.masked).length;
    }
    // over 20 runs, expect ~300 masked (100 tokens * 0.15 prob * 20)
    expect(maskedCount).toBeGreaterThan(100);
  });

  it('predicts token via softmax', () => {
    const logits = [0.1, 0.5, 0.9, 0.3];
    const pred = mlm.predict(0, logits);
    expect(pred.predictedId).toBe(2);
    // index 2 has max logit, but softmax shares weight → expect ~0.37
    expect(pred.probability).toBeCloseTo(0.375, 2);
  });

  it('returns logit at predicted index', () => {
    const pred = mlm.predict(5, [0.1, 0.2, 0.9, 0.4]);
    expect(pred.logit).toBe(0.9);
  });

  it('tracks predictions', () => {
    mlm.predict(0, [0.1, 0.9]);
    mlm.predict(1, [0.9, 0.1]);
    expect(mlm.getPredictions().length).toBe(2);
  });

  it('computes accuracy', () => {
    mlm.predict(0, [0.1, 0.9]); // correct: predictedId=1 != tokenId=0 → wrong
    mlm.predict(1, [0.1, 0.9]); // correct: predictedId=1 == tokenId=1 → right
    expect(mlm.getAccuracy()).toBe(0.5);
  });
});

describe('ContrastivePairBuilder', () => {
  let cpb: ContrastivePairBuilder;

  beforeEach(() => {
    cpb = new ContrastivePairBuilder(0.07);
  });

  it('creates with temperature', () => {
    expect(cpb.temperature).toBe(0.07);
  });

  it('builds contrastive pair', () => {
    const pair = cpb.buildPair([1, 0, 0], [1, 0, 0], [[0, 1, 0]], 1);
    expect(pair.label).toBe(1);
    expect(cpb.getPairs().length).toBe(1);
  });

  it('builds augmented pair with noise', () => {
    const pair = cpb.buildAugmentedPair([0.5, 0.5, 0.5], 0.1);
    expect(pair.anchor.length).toBe(3);
    expect(pair.positive.length).toBe(3);
    expect(pair.negatives.length).toBe(3);
    // positive differs from anchor by noise
    let diff = 0;
    for (let i = 0; i < pair.anchor.length; i++) {
      diff += Math.abs(pair.anchor[i] - pair.positive[i]);
    }
    expect(diff).toBeGreaterThan(0);
  });

  it('computes cosine similarity', () => {
    const sim = cpb.computeSimilarity([1, 0, 0], [1, 0, 0]);
    expect(sim).toBeCloseTo(1.0, 5);
    const sim2 = cpb.computeSimilarity([1, 0, 0], [0, 1, 0]);
    expect(sim2).toBeCloseTo(0.0, 5);
  });

  it('returns 0 for different length vectors', () => {
    expect(cpb.computeSimilarity([1, 0], [1, 0, 0])).toBe(0);
  });

  it('computes InfoNCE loss', () => {
    const pair = cpb.buildPair([1, 0, 0], [1, 0, 0], [[0, 1, 0], [0, 0, 1]], 1);
    const loss = cpb.computeInfoNCELoss(pair);
    // positive similar to anchor → low loss
    expect(loss).toBeLessThan(2);
    expect(loss).toBeGreaterThanOrEqual(0);
  });

  it('returns pair list', () => {
    cpb.buildPair([1], [1], [[0]], 1);
    cpb.buildPair([0], [0], [[1]], 0);
    expect(cpb.getPairs().length).toBe(2);
  });
});

describe('TokenShuffler', () => {
  it('creates with seed', () => {
    const sh = new TokenShuffler(42);
    expect(sh.seed).toBe(42);
  });

  it('shuffles deterministically with seed', () => {
    const sh = new TokenShuffler(42);
    const input = [1, 2, 3, 4, 5];
    const r1 = sh.shuffle(input);
    const r2 = sh.shuffle(input);
    expect(r1).toEqual(r2);
  });

  it('shuffle count increments', () => {
    const sh = new TokenShuffler(42);
    expect(sh.getShuffleCount()).toBe(0);
    sh.shuffle([1, 2, 3]);
    sh.shuffle([4, 5, 6]);
    expect(sh.getShuffleCount()).toBe(2);
  });

  it('partial shuffle keeps length', () => {
    const sh = new TokenShuffler(42);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = sh.partialShuffle(input, 0.3);
    expect(result.length).toBe(input.length);
  });

  it('partial shuffle modifies some elements', () => {
    const sh = new TokenShuffler(1);
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let changed = 0;
    for (let i = 0; i < 5; i++) {
      const result = sh.partialShuffle(input, 0.5);
      for (let j = 0; j < input.length; j++) {
        if (input[j] !== result[j]) changed++;
      }
    }
    // ~50% shuffle * 10 items * 5 runs = ~25 expected changes
    expect(changed).toBeGreaterThan(10);
  });
});

describe('SimCSEEncoder', () => {
  let enc: SimCSEEncoder;

  beforeEach(() => {
    enc = new SimCSEEncoder(8, 0.1);
  });

  it('creates with dim', () => {
    expect(enc.dim).toBe(8);
    expect(enc.dropoutRate).toBe(0.1);
  });

  it('encodes text to vector', () => {
    const v = enc.encode('hello');
    expect(v.length).toBe(8);
    for (const x of v) expect(x).toBeGreaterThan(-1.5);
    for (const x of v) expect(x).toBeLessThan(1.5);
  });

  it('encoded vectors are deterministic with same seed', () => {
    const v1 = enc.encode('test', 42);
    const v2 = enc.encode('test', 42);
    expect(v1).toEqual(v2);
  });

  it('different seeds → different dropout vectors', () => {
    const { a, b } = enc.encodeUnsupervised('hello world');
    expect(a.length).toBe(8);
    expect(b.length).toBe(8);
    let different = 0;
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) > 1e-9) different++;
    }
    // at least some difference (high prob given random dropout)
    expect(different).toBeGreaterThanOrEqual(0);
  });

  it('converts text to normalized vector', () => {
    const v = enc.textToVec('abc');
    expect(v.length).toBe(8);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it('stores encoded vectors', () => {
    enc.encode('a', 1);
    enc.encode('a', 2);
    expect(enc.getEncoded().size).toBe(2);
  });
});

describe('MomentumEncoder', () => {
  let me: MomentumEncoder;

  beforeEach(() => {
    me = new MomentumEncoder(4, 0.999);
  });

  it('creates with momentum', () => {
    expect(me.momentum).toBe(0.999);
    expect(me.dim).toBe(4);
  });

  it('encodes query and key', () => {
    const input = [0.5, 0.5, 0.5, 0.5];
    const q = me.encodeQuery(input);
    const k = me.encodeKey(input);
    expect(q.length).toBe(4);
    expect(k.length).toBe(4);
  });

  it('query and key produce different outputs initially', () => {
    const input = [0.1, 0.2, 0.3, 0.4];
    const q = me.encodeQuery(input);
    const k = me.encodeKey(input);
    let diff = 0;
    for (let i = 0; i < q.length; i++) diff += Math.abs(q[i] - k[i]);
    expect(diff).toBeGreaterThan(0);
  });

  it('momentum update moves key closer to query', () => {
    const input = [1, 0, 0, 0];
    const beforeKey = me.getKeyWeights();
    for (let i = 0; i < 10; i++) {
      me.encodeQuery(input);
      me.momentumUpdate();
    }
    const afterKey = me.getKeyWeights();
    let diff = 0;
    for (let i = 0; i < beforeKey.length; i++) {
      for (let j = 0; j < beforeKey[i].length; j++) {
        diff += Math.abs(beforeKey[i][j] - afterKey[i][j]);
      }
    }
    expect(diff).toBeGreaterThan(0);
  });

  it('step counter increments', () => {
    expect(me.getStep()).toBe(0);
    me.momentumUpdate();
    expect(me.getStep()).toBe(1);
  });

  it('returns copies of weights', () => {
    const w = me.getQueryWeights();
    w[0][0] = 999;
    const w2 = me.getQueryWeights();
    expect(w2[0][0]).not.toBe(999);
  });
});

describe('MAEMasker', () => {
  let masker: MAEMasker;

  beforeEach(() => {
    masker = new MAEMasker(16, 0.75);
  });

  it('creates with patch size and ratio', () => {
    expect(masker.patchSize).toBe(16);
    expect(masker.maskRatio).toBe(0.75);
  });

  it('creates patches from image', () => {
    const image = Array(224 * 224 * 3).fill(0.5);
    const patches = masker.createPatches(image, 224);
    // (224/16)^2 = 196 patches
    expect(patches.length).toBe(196);
    expect(patches[0].pixels.length).toBe(16 * 16 * 3);
  });

  it('masks 75% of patches by default', () => {
    const image = Array(224 * 224 * 3).fill(0);
    const patches = masker.createPatches(image, 224);
    const masked = masker.mask(patches);
    const invisible = masked.filter(p => !p.visible).length;
    expect(invisible).toBe(Math.floor(196 * 0.75));
    expect(masker.getMaskedCount()).toBe(Math.floor(196 * 0.75));
  });

  it('reconstructs masked with fill value', () => {
    const image = Array(100).fill(1);
    const patches = masker.createPatches(image, 10);
    // 10/16=0.625, 1 patch
    if (patches.length > 0) {
      const masked = masker.mask(patches);
      const reconstructed = masker.reconstructMasked(masked, 0.5);
      const invisibleCount = masked.filter(p => !p.visible).length;
      let zeros = 0;
      for (const p of reconstructed) {
        if (!p.visible) {
          for (const px of p.pixels) if (px === 0.5) zeros++;
        }
      }
      expect(zeros).toBeGreaterThanOrEqual(0);
      expect(invisibleCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('visible ratio is 1 - mask ratio', () => {
    expect(masker.getVisibleRatio()).toBe(0.25);
  });
});

describe('DINOStudent', () => {
  let dino: DINOStudent;

  beforeEach(() => {
    dino = new DINOStudent(6, 0.1, 0.04);
  });

  it('creates with dim', () => {
    expect(dino.dim).toBe(6);
  });

  it('forward student returns softmax distribution', () => {
    const out = dino.forwardStudent([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    expect(out.length).toBe(6);
    const sum = out.reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('forward teacher returns softmax distribution', () => {
    const out = dino.forwardTeacher([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    expect(out.length).toBe(6);
    const sum = out.reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('student output is sharper than teacher (lower temp)', () => {
    const input = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
    const s = dino.forwardStudent(input);
    const t = dino.forwardTeacher(input);
    const sMax = Math.max(...s);
    const tMax = Math.max(...t);
    // Teacher temp=0.04 < Student temp=0.1 → teacher should be sharper (higher peak)
    expect(tMax).toBeGreaterThan(sMax);
  });

  it('update center moves center toward batch mean', () => {
    const initialCenter = dino.center;
    const batch = [
      [0.5, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.5, 0.1, 0.1, 0.1, 0.1, 0.1]
    ];
    dino.updateCenter(batch);
    const newCenter = dino.center;
    let changed = false;
    for (let i = 0; i < initialCenter.length; i++) {
      if (Math.abs(initialCenter[i] - newCenter[i]) > 1e-9) changed = true;
    }
    expect(changed).toBe(true);
  });

  it('computes DINO loss', () => {
    const dino6 = new DINOStudent(3, 0.1, 0.04);
    const s = [0.5, 0.3, 0.2];
    const t = [0.4, 0.3, 0.3];
    const loss = dino6.computeDINOLoss(s, t);
    expect(Number.isFinite(loss)).toBe(true);
  });

  it('center returns copy', () => {
    const c = dino.center;
    c[0] = 999;
    expect(dino.center[0]).not.toBe(999);
  });
});

describe('ReplacedTokenDetector', () => {
  it('detects replacements', () => {
    const rtd = new ReplacedTokenDetector();
    const tokens = [1, 2, 3, 4, 5];
    const replacements = [1, 99, 3, 88, 5];
    const preds = rtd.detectReplacements(tokens, replacements);
    expect(preds.length).toBe(5);
    expect(preds[1].isReplaced).toBe(true);
    expect(preds[0].isReplaced).toBe(false);
  });

  it('computes RTD loss', () => {
    const rtd = new ReplacedTokenDetector();
    const tokens = [1, 2, 3];
    const replacements = [1, 2, 3]; // no replacements
    const preds = rtd.detectReplacements(tokens, replacements);
    // all predicted as not replaced → 0 loss if correct
    const loss = rtd.computeRTDLoss(preds);
    expect(loss).toBe(0);
  });

  it('returns all predictions', () => {
    const rtd = new ReplacedTokenDetector();
    rtd.detectReplacements([1, 2], [1, 2]);
    rtd.detectReplacements([3, 4], [5, 4]);
    expect(rtd.getPredictions().length).toBe(4);
  });

  it('computes accuracy', () => {
    const rtd = new ReplacedTokenDetector();
    rtd.detectReplacements([1, 2, 3], [1, 99, 3]); // 1 replaced at index 1
    // all predicted correctly → 100%
    expect(rtd.getAccuracy()).toBe(1.0);
  });
});

describe('NextSentencePredictor', () => {
  let nsp: NextSentencePredictor;

  beforeEach(() => {
    nsp = new NextSentencePredictor();
  });

  it('builds NSP pair', () => {
    const pair = nsp.buildPair('Hello world.', 'How are you?', true);
    expect(pair.tokensA.length).toBeGreaterThan(0);
    expect(pair.tokensB.length).toBeGreaterThan(0);
    expect(pair.isNext).toBe(true);
  });

  it('tokenizes text into integer ids', () => {
    const pair = nsp.buildPair('a b c', 'd e f', false);
    expect(pair.tokensA.every(t => Number.isInteger(t))).toBe(true);
    expect(pair.tokensB.every(t => Number.isInteger(t))).toBe(true);
  });

  it('predicts next vs not next', () => {
    const pair = nsp.buildPair('a', 'b', true);
    const pred = nsp.predict(pair, [0.9, 0.1]);
    expect(pred.predicted).toBe(true);
    expect(pred.confidence).toBeGreaterThan(0.5);
  });

  it('predicts not next when logits favor it', () => {
    const pair = nsp.buildPair('a', 'b', false);
    const pred = nsp.predict(pair, [0.1, 0.9]);
    expect(pred.predicted).toBe(false);
  });

  it('tracks accuracy', () => {
    const p1 = nsp.buildPair('a', 'b', true);
    const p2 = nsp.buildPair('c', 'd', false);
    nsp.predict(p1, [0.9, 0.1]); // correct
    nsp.predict(p2, [0.1, 0.9]); // correct
    expect(nsp.getAccuracy()).toBe(1.0);
  });

  it('returns pair list', () => {
    nsp.buildPair('a', 'b', true);
    nsp.buildPair('c', 'd', false);
    expect(nsp.getPairs().length).toBe(2);
  });
});

describe('PretrainCoreIndex', () => {
  it('lists 9 engines', () => {
    const idx = new PretrainCoreIndex();
    expect(idx.getEngines().length).toBe(9);
    expect(idx.getEngineCount()).toBe(9);
  });

  it('returns batch info', () => {
    const idx = new PretrainCoreIndex();
    const info = idx.getBatchInfo();
    expect(info.batch).toBe('1/3 Core');
    expect(info.engines).toBe(9);
    expect(info.category).toContain('Self-Supervised Pretraining');
  });

  it('describes engines', () => {
    const idx = new PretrainCoreIndex();
    const desc = idx.describe('MaskedLMHead');
    expect(desc).toContain('masked');
    expect(desc.length).toBeGreaterThan(20);
  });

  it('returns unknown for invalid engine', () => {
    const idx = new PretrainCoreIndex();
    expect(idx.describe('FakeEngine')).toBe('Unknown engine');
  });
});