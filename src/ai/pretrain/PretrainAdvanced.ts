// V5436-V5445: DD Self-Supervised Pretraining Advanced Batch 2/3
// MomentumUpdater + EMAEncoder + BYOLPredictor + SimSIAMHead + ClusterAssignment + ReLICEncoder + BarlowTwinsLoss + VICRegLoss + MaskedAutoencoderDecoder + PretrainAdvancedIndex

// ============================================================================
// 1. MomentumUpdater — explicit EMA momentum weight updater
// ============================================================================

export interface MomentumState_ {
  targetWeights: number[][];
  onlineWeights: number[][];
  momentum: number;
  step: number;
}

export class MomentumUpdater {
  private _dim: number;
  private _state: MomentumState_;

  constructor(dim: number, momentum: number = 0.99) {
    this._dim = dim;
    this._state = {
      targetWeights: this._initRandom(),
      onlineWeights: this._initRandom(),
      momentum,
      step: 0
    };
  }

  private _initRandom(): number[][] {
    return Array.from({ length: this._dim }, () =>
      Array.from({ length: this._dim }, () => (Math.random() - 0.5) * 0.1)
    );
  }

  setOnlineWeights(weights: number[][]): void {
    this._state.onlineWeights = weights.map(r => [...r]);
  }

  step_(): void {
    const m = this._state.momentum;
    for (let i = 0; i < this._dim; i++) {
      for (let j = 0; j < this._dim; j++) {
        this._state.targetWeights[i][j] = m * this._state.targetWeights[i][j] +
          (1 - m) * this._state.onlineWeights[i][j];
      }
    }
    this._state.step++;
  }

  getTargetWeights(): number[][] {
    return this._state.targetWeights.map(r => [...r]);
  }

  getOnlineWeights(): number[][] {
    return this._state.onlineWeights.map(r => [...r]);
  }

  getStep(): number {
    return this._state.step;
  }

  get momentum(): number { return this._state.momentum; }
  get dim(): number { return this._dim; }
}

// ============================================================================
// 2. EMAEncoder — exponential moving average encoder
// ============================================================================

export class EMAEncoder {
  private _dim: number;
  private _weights: number[][];
  private _shadowWeights: number[][];
  private _decay: number;

  constructor(dim: number, decay: number = 0.999) {
    this._dim = dim;
    this._decay = decay;
    this._weights = this._init();
    this._shadowWeights = this._init();
  }

  private _init(): number[][] {
    return Array.from({ length: this._dim }, () =>
      Array.from({ length: this._dim }, () => Math.random() * 0.1)
    );
  }

  update(newWeights: number[][]): void {
    const d = this._decay;
    for (let i = 0; i < this._dim; i++) {
      for (let j = 0; j < this._dim; j++) {
        this._shadowWeights[i][j] = d * this._shadowWeights[i][j] + (1 - d) * newWeights[i][j];
        this._weights[i][j] = newWeights[i][j];
      }
    }
  }

  encode(input: number[]): number[] {
    const output: number[] = [];
    for (let i = 0; i < this._dim; i++) {
      let sum = 0;
      for (let j = 0; j < this._dim; j++) {
        sum += input[j] * this._shadowWeights[i][j];
      }
      output.push(Math.tanh(sum));
    }
    return output;
  }

  getShadowWeights(): number[][] {
    return this._shadowWeights.map(r => [...r]);
  }

  getWeights(): number[][] {
    return this._weights.map(r => [...r]);
  }

  get decay(): number { return this._decay; }
  get dim(): number { return this._dim; }
}

// ============================================================================
// 3. BYOLPredictor — target network predictor (no negatives needed)
// ============================================================================

export interface BYOLPrediction {
  online: number[];
  target: number[];
  prediction: number[];
}

export class BYOLPredictor {
  private _dim: number;
  private _hiddenDim: number;
  private _predictorWeights1: number[][];
  private _predictorWeights2: number[][];
  private _predictions: BYOLPrediction[] = [];

  constructor(dim: number, hiddenDim: number = 256) {
    this._dim = dim;
    this._hiddenDim = hiddenDim;
    this._predictorWeights1 = this._initMatrix(dim, hiddenDim);
    this._predictorWeights2 = this._initMatrix(hiddenDim, dim);
  }

  private _initMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (Math.random() - 0.5) * 0.1)
    );
  }

  private _relu(x: number): number {
    return Math.max(0, x);
  }

  predict(input: number[]): number[] {
    const hidden: number[] = [];
    for (let i = 0; i < this._hiddenDim; i++) {
      let sum = 0;
      for (let j = 0; j < this._dim; j++) {
        sum += input[j] * this._predictorWeights1[j][i];
      }
      hidden.push(this._relu(sum));
    }
    const output: number[] = [];
    for (let i = 0; i < this._dim; i++) {
      let sum = 0;
      for (let j = 0; j < this._hiddenDim; j++) {
        sum += hidden[j] * this._predictorWeights2[j][i];
      }
      output.push(sum);
    }
    return output;
  }

  computeBYOLLoss(online: number[], target: number[]): number {
    const pred = this.predict(target);
    const normalizedPred = this._normalize(pred);
    const normalizedOnline = this._normalize(online);
    let loss = 0;
    for (let i = 0; i < this._dim; i++) {
      loss += Math.pow(normalizedPred[i] - normalizedOnline[i], 2);
    }
    this._predictions.push({ online, target, prediction: pred });
    return 2 - 2 * (1 - loss / this._dim); // MSE-based
  }

  private _normalize(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map(v => v / norm);
  }

  getPredictions(): BYOLPrediction[] {
    return [...this._predictions];
  }

  get dim(): number { return this._dim; }
  get hiddenDim(): number { return this._hiddenDim; }
}

// ============================================================================
// 4. SimSIAMHead — stop-gradient predictor head
// ============================================================================

export class SimSIAMHead {
  private _dim: number;
  private _hiddenDim: number;
  private _w1: number[][];
  private _w2: number[][];
  private _bnRunningMean: number[];

  constructor(dim: number, hiddenDim: number = 64) {
    this._dim = dim;
    this._hiddenDim = hiddenDim;
    this._w1 = this._initMatrix(dim, hiddenDim);
    this._w2 = this._initMatrix(hiddenDim, dim);
    this._bnRunningMean = Array(dim).fill(0);
  }

  private _initMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (Math.random() - 0.5) * 0.1)
    );
  }

  forward(input: number[], stopGradient: boolean = false): number[] {
    const hidden: number[] = [];
    for (let i = 0; i < this._hiddenDim; i++) {
      let sum = 0;
      for (let j = 0; j < this._dim; j++) {
        sum += input[j] * this._w1[j][i];
      }
      hidden.push(sum);
    }
    const output: number[] = [];
    for (let i = 0; i < this._dim; i++) {
      let sum = 0;
      for (let j = 0; j < this._hiddenDim; j++) {
        sum += hidden[j] * this._w2[j][i];
      }
      output.push(stopGradient ? sum : sum - this._bnRunningMean[i]);
    }
    return output;
  }

  computeSimSIAMLoss(view1: number[], view2: number[]): number {
    const p1 = this.forward(view1, false);
    const p2 = this.forward(view2, true); // stop-gradient
    const z1 = this.forward(view1, true);
    const z2 = this.forward(view2, true);

    const cosSim = (a: number[], b: number[]) => {
      const dot = a.reduce((s, v, i) => s + v * b[i], 0);
      const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0)) || 1;
      const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0)) || 1;
      return dot / (normA * normB);
    };

    return -(cosSim(p1, z2) + cosSim(p2, z1)) / 2;
  }

  updateBN(batch: number[][]): void {
    const newMean = Array(this._dim).fill(0);
    for (const sample of batch) {
      for (let i = 0; i < this._dim; i++) {
        newMean[i] += sample[i];
      }
    }
    for (let i = 0; i < this._dim; i++) {
      this._bnRunningMean[i] = newMean[i] / batch.length;
    }
  }

  get dim(): number { return this._dim; }
}

// ============================================================================
// 5. ClusterAssignment — sinkhorn-Knopp clustering
// ============================================================================

export class ClusterAssignment {
  private _numSamples: number;
  private _numClusters: number;
  private _iterations: number;
  private _epsilon: number;
  private _assignments: Map<number, number[]> = new Map();

  constructor(numSamples: number, numClusters: number, iterations: number = 3, epsilon: number = 0.05) {
    this._numSamples = numSamples;
    this._numClusters = numClusters;
    this._iterations = iterations;
    this._epsilon = epsilon;
  }

  assign(scores: number[][]): number[][] {
    const Q = scores.map(row => this._softmax(row));
    const K = this._numClusters;
    const B = this._numSamples;
    const M = Q.length;

    let K_dist = Q;
    for (let it = 0; it < this._iterations; it++) {
      // row normalization: divide by sum per row
      const rowSums = K_dist.map(row => row.reduce((s, v) => s + v, 0) || 1);
      const normalized = K_dist.map((row, i) => row.map(v => v / rowSums[i]));

      // column normalization: divide by sum per column * K / B
      const colSums = Array(K).fill(0);
      for (let i = 0; i < M; i++) {
        for (let j = 0; j < K; j++) {
          colSums[j] += normalized[i][j];
        }
      }
      K_dist = normalized.map((row, i) =>
        row.map((v, j) => v / (colSums[j] + this._epsilon) * (K / B))
      );
    }

    // hard assignment
    const result = K_dist.map(row => {
      const maxIdx = row.indexOf(Math.max(...row));
      const hard = Array(K).fill(0);
      hard[maxIdx] = 1;
      return hard;
    });
    return result;
  }

  private _softmax(logits: number[]): number[] {
    const max = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - max));
    const sum = exps.reduce((s, e) => s + e, 0);
    return exps.map(e => e / sum);
  }

  trackAssignment(sampleIdx: number, assignment: number[]): void {
    this._assignments.set(sampleIdx, assignment);
  }

  getAssignment(sampleIdx: number): number[] | null {
    return this._assignments.get(sampleIdx) ?? null;
  }

  get numSamples(): number { return this._numSamples; }
  get numClusters(): number { return this._numClusters; }
}

// ============================================================================
// 6. ReLICEncoder — relational logic inductive clustering
// ============================================================================

export interface ReLICRule {
  id: number;
  antecedent: number[];
  consequent: number[];
  confidence: number;
}

export class ReLICEncoder {
  private _dim: number;
  private _rules: ReLICRule[] = [];
  private _ruleIdCounter: number = 0;

  constructor(dim: number) {
    this._dim = dim;
  }

  addRule(antecedent: number[], consequent: number[], confidence: number = 1.0): ReLICRule {
    const rule: ReLICRule = {
      id: this._ruleIdCounter++,
      antecedent,
      consequent,
      confidence
    };
    this._rules.push(rule);
    return rule;
  }

  applyRules(input: number[]): number[] {
    const output = Array(this._dim).fill(0);
    for (const rule of this._rules) {
      const matches = rule.antecedent.every((a, i) => a === input[i]);
      if (matches) {
        for (let i = 0; i < rule.consequent.length && i < this._dim; i++) {
          output[i] += rule.consequent[i] * rule.confidence;
        }
      }
    }
    return output;
  }

  pruneLowConfidence(threshold: number): number {
    const before = this._rules.length;
    this._rules = this._rules.filter(r => r.confidence >= threshold);
    return before - this._rules.length;
  }

  getRules(): ReLICRule[] {
    return [...this._rules];
  }

  getRuleCount(): number {
    return this._rules.length;
  }

  get dim(): number { return this._dim; }
}

// ============================================================================
// 7. BarlowTwinsLoss — cross-correlation matrix diagonal loss
// ============================================================================

export class BarlowTwinsLoss {
  private _lambda: number;
  private _scaleLoss: number;

  constructor(lambda: number = 0.005, scaleLoss: number = 0.024) {
    this._lambda = lambda;
    this._scaleLoss = scaleLoss;
  }

  computeCrossCorrelation(z1: number[][], z2: number[][]): number[][] {
    const N = z1[0].length;
    const D = z1.length;
    const cc: number[][] = Array.from({ length: D }, () => Array(D).fill(0));

    for (let i = 0; i < D; i++) {
      for (let j = 0; j < D; j++) {
        let sum = 0;
        for (let n = 0; n < N; n++) {
          sum += z1[i][n] * z2[j][n];
        }
        cc[i][j] = sum / N;
      }
    }
    return cc;
  }

  computeLoss(z1: number[][], z2: number[][]): number {
    const D = z1.length;
    const cc = this.computeCrossCorrelation(z1, z2);
    let loss = 0;
    for (let i = 0; i < D; i++) {
      for (let j = 0; j < D; j++) {
        const target = i === j ? 1 : 0;
        loss += Math.pow(cc[i][j] - target, 2);
      }
    }
    return this._scaleLoss * (loss + this._lambda * this._offDiagonalSum(cc, D));
  }

  private _offDiagonalSum(cc: number[][], D: number): number {
    let sum = 0;
    for (let i = 0; i < D; i++) {
      for (let j = 0; j < D; j++) {
        if (i !== j) sum += cc[i][j] * cc[i][j];
      }
    }
    return sum;
  }

  get lambda(): number { return this._lambda; }
  get scaleLoss(): number { return this._scaleLoss; }
}

// ============================================================================
// 8. VICRegLoss — variance-invariance-covariance regularization
// ============================================================================

export class VICRegLoss {
  private _lambda: number;
  private _mu: number;
  private _nu: number;
  private _eps: number;

  constructor(lambda: number = 25, mu: number = 25, nu: number = 1, eps: number = 1e-4) {
    this._lambda = lambda;
    this._mu = mu;
    this._nu = nu;
    this._eps = eps;
  }

  computeInvariance(z1: number[][], z2: number[][]): number {
    let sum = 0;
    const D = z1.length;
    const N = z1[0].length;
    for (let i = 0; i < D; i++) {
      for (let n = 0; n < N; n++) {
        sum += Math.pow(z1[i][n] - z2[i][n], 2);
      }
    }
    return sum / N;
  }

  computeVariance(z: number[][]): number {
    const D = z.length;
    const N = z[0].length;
    let sum = 0;
    for (let i = 0; i < D; i++) {
      const mean = z[i].reduce((s, v) => s + v, 0) / N;
      const std = Math.sqrt(
        z[i].reduce((s, v) => s + Math.pow(v - mean, 2), 0) / N + this._eps
      );
      sum += Math.max(0, 1 - std);
    }
    return sum;
  }

  computeCovariance(z: number[][]): number {
    const D = z.length;
    const N = z[0].length;
    const means = Array(D).fill(0);
    for (let i = 0; i < D; i++) {
      means[i] = z[i].reduce((s, v) => s + v, 0) / N;
    }
    let sum = 0;
    for (let i = 0; i < D; i++) {
      for (let j = 0; j < D; j++) {
        if (i === j) continue;
        let cov = 0;
        for (let n = 0; n < N; n++) {
          cov += (z[i][n] - means[i]) * (z[j][n] - means[j]);
        }
        cov /= N - 1;
        sum += cov * cov;
      }
    }
    return sum / D;
  }

  computeLoss(z1: number[][], z2: number[][]): number {
    const s = this.computeInvariance(z1, z2);
    const v1 = this.computeVariance(z1);
    const v2 = this.computeVariance(z2);
    const c1 = this.computeCovariance(z1);
    const c2 = this.computeCovariance(z2);
    return this._lambda * s + this._mu * (v1 + v2) + this._nu * (c1 + c2);
  }

  get lambda(): number { return this._lambda; }
  get mu(): number { return this._mu; }
  get nu(): number { return this._nu; }
}

// ============================================================================
// 9. MaskedAutoencoderDecoder — MAE decoder reconstruction
// ============================================================================

export interface MAEReconstruction {
  patchIndex: number;
  originalPixels: number[];
  reconstructedPixels: number[];
  mseLoss: number;
}

export class MaskedAutoencoderDecoder {
  private _patchSize: number;
  private _decoderWeights: number[][];
  private _pixelsPerPatch: number;
  private _reconstructions: MAEReconstruction[] = [];

  constructor(patchSize: number = 16, dim: number = 64) {
    this._patchSize = patchSize;
    this._pixelsPerPatch = patchSize * patchSize * 3;
    this._decoderWeights = Array.from({ length: dim }, () =>
      Array.from({ length: this._pixelsPerPatch }, () => (Math.random() - 0.5) * 0.1)
    );
  }

  reconstruct(latent: number[], originalPixels: number[], patchIndex: number = 0): MAEReconstruction {
    const reconstructed: number[] = [];
    for (let i = 0; i < this._pixelsPerPatch; i++) {
      let sum = 0;
      for (let j = 0; j < latent.length; j++) {
        sum += latent[j] * this._decoderWeights[j][i];
      }
      reconstructed.push(sum);
    }
    let mse = 0;
    const len = Math.min(reconstructed.length, originalPixels.length);
    for (let i = 0; i < len; i++) {
      mse += Math.pow(reconstructed[i] - originalPixels[i], 2);
    }
    mse /= len;
    const rec: MAEReconstruction = {
      patchIndex,
      originalPixels,
      reconstructedPixels: reconstructed,
      mseLoss: mse
    };
    this._reconstructions.push(rec);
    return rec;
  }

  computeTotalLoss(): number {
    if (this._reconstructions.length === 0) return 0;
    const sum = this._reconstructions.reduce((s, r) => s + r.mseLoss, 0);
    return sum / this._reconstructions.length;
  }

  getReconstructions(): MAEReconstruction[] {
    return [...this._reconstructions];
  }

  get patchSize(): number { return this._patchSize; }
  get pixelsPerPatch(): number { return this._pixelsPerPatch; }
}

// ============================================================================
// 10. PretrainAdvancedIndex — Batch 2/3 summary
// ============================================================================

export class PretrainAdvancedIndex {
  private _engines: string[] = [
    'MomentumUpdater',
    'EMAEncoder',
    'BYOLPredictor',
    'SimSIAMHead',
    'ClusterAssignment',
    'ReLICEncoder',
    'BarlowTwinsLoss',
    'VICRegLoss',
    'MaskedAutoencoderDecoder'
  ];

  getEngines(): string[] {
    return [...this._engines];
  }

  getEngineCount(): number {
    return this._engines.length;
  }

  getBatchInfo(): { batch: string; engines: number; category: string } {
    return {
      batch: '2/3 Advanced',
      engines: this._engines.length,
      category: 'Self-Supervised Pretraining — Advanced'
    };
  }

  describe(engine: string): string {
    const descriptions: Record<string, string> = {
      'MomentumUpdater': 'EMA momentum weight updater (online→target)',
      'EMAEncoder': 'Exponential moving average encoder with decay',
      'BYOLPredictor': 'BYOL predictor + asymmetric MSE loss',
      'SimSIAMHead': 'Stop-gradient predictor head + BN',
      'ClusterAssignment': 'Sinkhorn-Knopp iterative cluster assignment',
      'ReLICEncoder': 'Relational logic inductive rules + apply',
      'BarlowTwinsLoss': 'Cross-correlation matrix diagonal loss',
      'VICRegLoss': 'Variance-Invariance-Covariance regularization',
      'MaskedAutoencoderDecoder': 'MAE decoder reconstruction + MSE loss'
    };
    return descriptions[engine] ?? 'Unknown engine';
  }
}