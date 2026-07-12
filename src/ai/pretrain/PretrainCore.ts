// V5426-V5435: DD Self-Supervised Pretraining Core Batch 1/3
// MaskedLMHead + ContrastivePairBuilder + TokenShuffler + SimCSEEncoder + MomentumEncoder + MAEMasker + DINOStudent + ReplacedTokenDetector + NextSentencePredictor + PretrainCoreIndex

// ============================================================================
// 1. MaskedLMHead — BERT-style masked language model head
// ============================================================================

export interface MLMToken {
  id: number;
  token: string;
  probability: number;
  masked: boolean;
}

export interface MLMPrediction {
  tokenId: number;
  predictedId: number;
  logit: number;
  probability: number;
}

export class MaskedLMHead {
  private _vocabSize: number;
  private _maskTokenId: number;
  private _maskProb: number;
  private _predictions: MLMPrediction[] = [];

  constructor(vocabSize: number, maskTokenId: number = 103, maskProb: number = 0.15) {
    this._vocabSize = vocabSize;
    this._maskTokenId = maskTokenId;
    this._maskProb = maskProb;
  }

  maskTokens(tokens: MLMToken[]): MLMToken[] {
    return tokens.map(t => {
      const r = Math.random();
      let masked = false;
      if (r < this._maskProb * 0.8) {
        t.masked = true;
        t.id = this._maskTokenId;
        masked = true;
      } else if (r < this._maskProb * 0.9) {
        t.id = Math.floor(Math.random() * this._vocabSize);
        masked = true;
      }
      return t;
    });
  }

  predict(tokenId: number, logits: number[]): MLMPrediction {
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((s, e) => s + e, 0);
    const probs = exps.map(e => e / sumExps);
    const predictedId = probs.indexOf(Math.max(...probs));
    const prediction: MLMPrediction = {
      tokenId,
      predictedId,
      logit: logits[predictedId],
      probability: probs[predictedId]
    };
    this._predictions.push(prediction);
    return prediction;
  }

  getPredictions(): MLMPrediction[] {
    return [...this._predictions];
  }

  getAccuracy(): number {
    if (this._predictions.length === 0) return 0;
    const correct = this._predictions.filter(p => p.tokenId === p.predictedId).length;
    return correct / this._predictions.length;
  }

  get vocabSize(): number { return this._vocabSize; }
  get maskTokenId(): number { return this._maskTokenId; }
  get maskProb(): number { return this._maskProb; }
}

// ============================================================================
// 2. ContrastivePairBuilder — positive/negative pair generation
// ============================================================================

export interface ContrastivePair {
  anchor: number[];
  positive: number[];
  negatives: number[][];
  label: number;
}

export class ContrastivePairBuilder {
  private _pairs: ContrastivePair[] = [];
  private _temperature: number;

  constructor(temperature: number = 0.07) {
    this._temperature = temperature;
  }

  buildPair(anchor: number[], positive: number[], negatives: number[][], label: number = 1): ContrastivePair {
    const pair: ContrastivePair = { anchor, positive, negatives, label };
    this._pairs.push(pair);
    return pair;
  }

  buildAugmentedPair(anchor: number[], noiseScale: number = 0.1): ContrastivePair {
    const positive = anchor.map(v => v + (Math.random() - 0.5) * 2 * noiseScale);
    const negatives: number[][] = [];
    for (let i = 0; i < 3; i++) {
      negatives.push(anchor.map(() => Math.random() * 2 - 1));
    }
    return this.buildPair(anchor, positive, negatives, 1);
  }

  computeSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }

  computeInfoNCELoss(pair: ContrastivePair): number {
    const posSim = this.computeSimilarity(pair.anchor, pair.positive) / this._temperature;
    const negSims = pair.negatives.map(n => this.computeSimilarity(pair.anchor, n) / this._temperature);
    const allSims = [posSim, ...negSims];
    const maxSim = Math.max(...allSims);
    const exps = allSims.map(s => Math.exp(s - maxSim));
    const sumExps = exps.reduce((s, e) => s + e, 0);
    return -Math.log(exps[0] / sumExps);
  }

  getPairs(): ContrastivePair[] {
    return [...this._pairs];
  }

  get temperature(): number { return this._temperature; }
}

// ============================================================================
// 3. TokenShuffler — input permutation augmentation
// ============================================================================

export class TokenShuffler {
  private _seed: number;
  private _shuffleCount: number = 0;

  constructor(seed: number = 42) {
    this._seed = seed;
  }

  shuffle<T>(tokens: T[]): T[] {
    const arr = [...tokens];
    let state = this._seed;
    const rand = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0xffffffff;
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this._shuffleCount++;
    return arr;
  }

  partialShuffle<T>(tokens: T[], shuffleRatio: number = 0.3): T[] {
    const n = Math.floor(tokens.length * shuffleRatio);
    const arr = [...tokens];
    const indices = new Set<number>();
    while (indices.size < n) {
      indices.add(Math.floor(Math.random() * arr.length));
    }
    const selected = indicesArray(indices).map(i => ({ idx: i, val: arr[i] }));
    const shuffled = this.shuffle(selected.map(s => s.val));
    let j = 0;
    for (const i of indicesArray(indices)) {
      arr[i] = shuffled[j++];
    }
    return arr;
  }

  getShuffleCount(): number {
    return this._shuffleCount;
  }

  get seed(): number { return this._seed; }
}

function indicesArray(set: Set<number>): number[] {
  return Array.from(set).sort((a, b) => a - b);
}

// ============================================================================
// 4. SimCSEEncoder — sentence embedding via dropout noise
// ============================================================================

export interface SimCSEState {
  weights: number[][];
  bias: number[];
  dropoutRate: number;
}

export class SimCSEEncoder {
  private _dim: number;
  private _state: SimCSEState;
  private _encoded: Map<string, number[]> = new Map();

  constructor(dim: number, dropoutRate: number = 0.1) {
    this._dim = dim;
    this._state = {
      weights: Array.from({ length: dim }, () =>
        Array.from({ length: dim }, () => (Math.random() - 0.5) * 0.1)
      ),
      bias: Array.from({ length: dim }, () => 0),
      dropoutRate
    };
  }

  encode(text: string, dropoutSeed?: number): number[] {
    const seed = dropoutSeed ?? Math.floor(Math.random() * 1e9);
    const state = seed;
    const rand = () => {
      let s = state;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
      };
    };
    const r = rand();
    const input = this.textToVec(text);
    const output: number[] = [];
    for (let i = 0; i < this._dim; i++) {
      let sum = this._state.bias[i];
      for (let j = 0; j < this._dim; j++) {
        sum += input[j] * this._state.weights[i][j];
      }
      if (r() < this._state.dropoutRate) sum = 0;
      output.push(Math.tanh(sum));
    }
    this._encoded.set(`${text}:${seed}`, output);
    return output;
  }

  encodeUnsupervised(text: string): { a: number[], b: number[] } {
    return { a: this.encode(text, 1), b: this.encode(text, 2) };
  }

  textToVec(text: string): number[] {
    const vec = Array(this._dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[text.charCodeAt(i) % this._dim] += 1;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map(v => v / norm);
  }

  getEncoded(): Map<string, number[]> {
    return new Map(this._encoded);
  }

  get dim(): number { return this._dim; }
  get dropoutRate(): number { return this._state.dropoutRate; }
}

// ============================================================================
// 5. MomentumEncoder — MoCo-style momentum update
// ============================================================================

export interface MomentumState {
  weights: number[][];
  momentum: number;
  step: number;
}

export class MomentumEncoder {
  private _dim: number;
  private _query: MomentumState;
  private _key: MomentumState;

  constructor(dim: number, momentum: number = 0.999) {
    this._dim = dim;
    this._query = {
      weights: this._initWeights(),
      momentum,
      step: 0
    };
    this._key = {
      weights: this._initWeights(),
      momentum,
      step: 0
    };
  }

  private _initWeights(): number[][] {
    return Array.from({ length: this._dim }, () =>
      Array.from({ length: this._dim }, () => (Math.random() - 0.5) * 0.1)
    );
  }

  encodeQuery(input: number[]): number[] {
    return this._encode(input, this._query.weights);
  }

  encodeKey(input: number[]): number[] {
    return this._encode(input, this._key.weights);
  }

  private _encode(input: number[], weights: number[][]): number[] {
    const output: number[] = [];
    for (let i = 0; i < this._dim; i++) {
      let sum = 0;
      for (let j = 0; j < this._dim; j++) {
        sum += input[j] * weights[i][j];
      }
      output.push(Math.tanh(sum));
    }
    return output;
  }

  momentumUpdate(): void {
    const m = this._query.momentum;
    for (let i = 0; i < this._dim; i++) {
      for (let j = 0; j < this._dim; j++) {
        this._key.weights[i][j] = m * this._key.weights[i][j] + (1 - m) * this._query.weights[i][j];
      }
    }
    this._key.step++;
    this._query.step++;
  }

  getStep(): number {
    return this._key.step;
  }

  getQueryWeights(): number[][] {
    return this._query.weights.map(r => [...r]);
  }

  getKeyWeights(): number[][] {
    return this._key.weights.map(r => [...r]);
  }

  get momentum(): number { return this._query.momentum; }
  get dim(): number { return this._dim; }
}

// ============================================================================
// 6. MAEMasker — patch masking for vision MAE
// ============================================================================

export interface MAEPatch {
  index: number;
  pixels: number[];
  visible: boolean;
}

export class MAEMasker {
  private _patchSize: number;
  private _maskRatio: number;
  private _maskedCount: number = 0;

  constructor(patchSize: number = 16, maskRatio: number = 0.75) {
    this._patchSize = patchSize;
    this._maskRatio = maskRatio;
  }

  createPatches(image: number[], imgSize: number = 224): MAEPatch[] {
    const patches: MAEPatch[] = [];
    const numPatches = (imgSize / this._patchSize) ** 2;
    const pixelsPerPatch = this._patchSize * this._patchSize * 3;
    for (let i = 0; i < numPatches; i++) {
      patches.push({
        index: i,
        pixels: image.slice(i * pixelsPerPatch, (i + 1) * pixelsPerPatch),
        visible: true
      });
    }
    return patches;
  }

  mask(patches: MAEPatch[]): MAEPatch[] {
    const numMask = Math.floor(patches.length * this._maskRatio);
    const indices = new Set<number>();
    while (indices.size < numMask) {
      indices.add(Math.floor(Math.random() * patches.length));
    }
    this._maskedCount = numMask;
    return patches.map((p, i) => indices.has(i) ? { ...p, visible: false } : p);
  }

  reconstructMasked(patches: MAEPatch[], fillValue: number = 0): MAEPatch[] {
    return patches.map(p => p.visible ? p : { ...p, pixels: p.pixels.map(() => fillValue) });
  }

  getVisibleRatio(): number {
    return 1 - this._maskRatio;
  }

  getMaskedCount(): number {
    return this._maskedCount;
  }

  get patchSize(): number { return this._patchSize; }
  get maskRatio(): number { return this._maskRatio; }
}

// ============================================================================
// 7. DINOStudent — DINO student network
// ============================================================================

export interface DINOState {
  weights: number[][];
  center: number[];
  temperatureStudent: number;
  temperatureTeacher: number;
}

export class DINOStudent {
  private _dim: number;
  private _state: DINOState;

  constructor(dim: number, temperatureStudent: number = 0.1, temperatureTeacher: number = 0.04) {
    this._dim = dim;
    this._state = {
      weights: Array.from({ length: dim }, () =>
        Array.from({ length: dim }, () => (Math.random() - 0.5) * 0.1)
      ),
      center: Array(dim).fill(0),
      temperatureStudent,
      temperatureTeacher
    };
  }

  forwardStudent(input: number[]): number[] {
    return this._forward(input, this._state.temperatureStudent);
  }

  forwardTeacher(input: number[]): number[] {
    return this._forward(input, this._state.temperatureTeacher);
  }

  private _forward(input: number[], temperature: number): number[] {
    const logits: number[] = [];
    for (let i = 0; i < this._dim; i++) {
      let sum = 0;
      for (let j = 0; j < this._dim; j++) {
        sum += input[j] * this._state.weights[i][j];
      }
      logits.push(sum / temperature);
    }
    return this._softmax(logits);
  }

  private _softmax(logits: number[]): number[] {
    const max = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - max));
    const sum = exps.reduce((s, e) => s + e, 0);
    return exps.map(e => e / sum);
  }

  updateCenter(teacherOutputs: number[][]): void {
    const batchMean = Array(this._dim).fill(0);
    for (const out of teacherOutputs) {
      for (let i = 0; i < this._dim; i++) {
        batchMean[i] += out[i];
      }
    }
    for (let i = 0; i < this._dim; i++) {
      batchMean[i] /= teacherOutputs.length;
      this._state.center[i] = 0.9 * this._state.center[i] + 0.1 * batchMean[i];
    }
  }

  computeDINOLoss(studentOut: number[], teacherOut: number[]): number {
    let loss = 0;
    for (let i = 0; i < this._dim; i++) {
      const t = teacherOut[i] - this._state.center[i];
      const safeStudent = Math.max(studentOut[i], 1e-8);
      loss += -t * Math.log(safeStudent);
    }
    return loss;
  }

  get dim(): number { return this._dim; }
  get center(): number[] { return [...this._state.center]; }
}

// ============================================================================
// 8. ReplacedTokenDetector — ELECTRA-style RTD
// ============================================================================

export interface RTDPrediction {
  tokenIndex: number;
  original: number;
  replaced: number;
  isReplaced: boolean;
  predictedReplaced: boolean;
}

export class ReplacedTokenDetector {
  private _predictions: RTDPrediction[] = [];

  detectReplacements(tokens: number[], replacements: number[]): RTDPrediction[] {
    const predictions: RTDPrediction[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const isReplaced = tokens[i] !== replacements[i];
      const prediction: RTDPrediction = {
        tokenIndex: i,
        original: tokens[i],
        replaced: replacements[i],
        isReplaced,
        predictedReplaced: isReplaced
      };
      this._predictions.push(prediction);
      predictions.push(prediction);
    }
    return predictions;
  }

  computeRTDLoss(predictions: RTDPrediction[]): number {
    let correct = 0;
    for (const p of predictions) {
      if (p.isReplaced === p.predictedReplaced) correct++;
    }
    return 1 - correct / Math.max(predictions.length, 1);
  }

  getPredictions(): RTDPrediction[] {
    return [...this._predictions];
  }

  getAccuracy(): number {
    if (this._predictions.length === 0) return 0;
    const correct = this._predictions.filter(p => p.isReplaced === p.predictedReplaced).length;
    return correct / this._predictions.length;
  }
}

// ============================================================================
// 9. NextSentencePredictor — NSP head (sentence order prediction)
// ============================================================================

export interface NSPPair {
  sentenceA: string;
  sentenceB: string;
  isNext: boolean;
  tokensA: number[];
  tokensB: number[];
}

export class NextSentencePredictor {
  private _pairs: NSPPair[] = [];
  private _correctPredictions: number = 0;
  private _totalPredictions: number = 0;

  buildPair(sentenceA: string, sentenceB: string, isNext: boolean): NSPPair {
    const pair: NSPPair = {
      sentenceA,
      sentenceB,
      isNext,
      tokensA: this._tokenize(sentenceA),
      tokensB: this._tokenize(sentenceB)
    };
    this._pairs.push(pair);
    return pair;
  }

  private _tokenize(text: string): number[] {
    return text.split(/\s+/).map(w => w.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 30000);
  }

  predict(pair: NSPPair, logits: [number, number]): { predicted: boolean; confidence: number } {
    const [logitNext, logitNotNext] = logits;
    const maxL = Math.max(logitNext, logitNotNext);
    const expNext = Math.exp(logitNext - maxL);
    const expNotNext = Math.exp(logitNotNext - maxL);
    const sumExp = expNext + expNotNext;
    const probNext = expNext / sumExp;
    const predicted = probNext > 0.5;
    const confidence = Math.max(probNext, 1 - probNext);
    if (predicted === pair.isNext) this._correctPredictions++;
    this._totalPredictions++;
    return { predicted, confidence };
  }

  getAccuracy(): number {
    return this._totalPredictions === 0 ? 0 : this._correctPredictions / this._totalPredictions;
  }

  getPairs(): NSPPair[] {
    return [...this._pairs];
  }
}

// ============================================================================
// 10. PretrainCoreIndex — Batch 1/3 summary
// ============================================================================

export class PretrainCoreIndex {
  private _engines: string[] = [
    'MaskedLMHead',
    'ContrastivePairBuilder',
    'TokenShuffler',
    'SimCSEEncoder',
    'MomentumEncoder',
    'MAEMasker',
    'DINOStudent',
    'ReplacedTokenDetector',
    'NextSentencePredictor'
  ];

  getEngines(): string[] {
    return [...this._engines];
  }

  getEngineCount(): number {
    return this._engines.length;
  }

  getBatchInfo(): { batch: string; engines: number; category: string } {
    return {
      batch: '1/3 Core',
      engines: this._engines.length,
      category: 'Self-Supervised Pretraining — Core'
    };
  }

  describe(engine: string): string {
    const descriptions: Record<string, string> = {
      'MaskedLMHead': 'BERT-style masked language model head (80/10/10 mask strategy)',
      'ContrastivePairBuilder': 'Positive/negative pair generation + InfoNCE loss',
      'TokenShuffler': 'Input permutation augmentation (full + partial shuffle)',
      'SimCSEEncoder': 'Sentence embedding via dropout noise (unsupervised SimCSE)',
      'MomentumEncoder': 'MoCo-style momentum encoder with EMA key update',
      'MAEMasker': 'Patch masking for vision MAE (75% default ratio)',
      'DINOStudent': 'DINO student network with centering + temperature',
      'ReplacedTokenDetector': 'ELECTRA-style replaced token detection (binary)',
      'NextSentencePredictor': 'NSP head + tokenization + accuracy tracking'
    };
    return descriptions[engine] ?? 'Unknown engine';
  }
}