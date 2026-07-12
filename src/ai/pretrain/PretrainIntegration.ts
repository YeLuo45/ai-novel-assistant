// V5446-V5455: DD Self-Supervised Pretraining Integration Batch 3/3
// PretrainLoop + DistributedSampler + CheckpointManager + TensorBoardLogger + LRScheduler + MixedPrecisionTrainer + GradientClipper + PretrainMasterIndex + DDPretrainBridge + PretrainIntegrationIndex

// ============================================================================
// 1. PretrainLoop — main pretraining loop orchestrator
// ============================================================================

export interface PretrainStep {
  step: number;
  epoch: number;
  loss: number;
  learningRate: number;
  duration: number;
}

export interface PretrainConfig {
  totalSteps: number;
  batchSize: number;
  warmupSteps: number;
  logInterval: number;
  evalInterval: number;
}

export class PretrainLoop {
  private _config: PretrainConfig;
  private _history: PretrainStep[] = [];
  private _currentStep: number = 0;
  private _currentEpoch: number = 0;
  private _lossFn: ((batch: number[][]) => number) | null = null;
  private _runningLoss: number = 0;

  constructor(config: PretrainConfig) {
    this._config = config;
  }

  setLossFunction(fn: (batch: number[][]) => number): void {
    this._lossFn = fn;
  }

  step(batch: number[][]): PretrainStep {
    if (!this._lossFn) throw new Error('Loss function not set');
    const start = Date.now();
    const loss = this._lossFn(batch);
    const lr = this._currentStep < this._config.warmupSteps
      ? 0.001 * (this._currentStep / this._config.warmupSteps)
      : 0.001;
    const duration = Date.now() - start;
    this._runningLoss = 0.9 * this._runningLoss + 0.1 * loss;
    const stepRec: PretrainStep = {
      step: this._currentStep,
      epoch: this._currentEpoch,
      loss: this._runningLoss,
      learningRate: lr,
      duration
    };
    this._history.push(stepRec);
    this._currentStep++;
    if (this._currentStep % 100 === 0) this._currentEpoch++;
    return stepRec;
  }

  shouldLog(): boolean {
    return this._currentStep > 0 && this._currentStep % this._config.logInterval === 0;
  }

  shouldEval(): boolean {
    return this._currentStep > 0 && this._currentStep % this._config.evalInterval === 0;
  }

  isFinished(): boolean {
    return this._currentStep >= this._config.totalSteps;
  }

  getHistory(): PretrainStep[] {
    return [...this._history];
  }

  get currentStep(): number { return this._currentStep; }
  get currentEpoch(): number { return this._currentEpoch; }
  get config(): PretrainConfig { return { ...this._config }; }
}

// ============================================================================
// 2. DistributedSampler — multi-GPU/multi-node sample distribution
// ============================================================================

export interface DistributedShard {
  rank: number;
  worldSize: number;
  indices: number[];
}

export class DistributedSampler {
  private _worldSize: number;
  private _rank: number;
  private _seed: number;
  private _epoch: number = 0;

  constructor(worldSize: number, rank: number, seed: number = 42) {
    this._worldSize = worldSize;
    this._rank = rank;
    this._seed = seed;
  }

  shard(totalSize: number): DistributedShard {
    const indices = Array.from({ length: totalSize }, (_, i) => i);
    // shuffle deterministically
    let state = this._seed + this._epoch;
    const rand = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0xffffffff;
    };
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // split into worldSize shards
    const shardSize = Math.ceil(indices.length / this._worldSize);
    const start = this._rank * shardSize;
    const end = Math.min(start + shardSize, indices.length);
    return {
      rank: this._rank,
      worldSize: this._worldSize,
      indices: indices.slice(start, end)
    };
  }

  setEpoch(epoch: number): void {
    this._epoch = epoch;
  }

  getShardSize(totalSize: number): number {
    return Math.ceil(totalSize / this._worldSize);
  }

  get rank(): number { return this._rank; }
  get worldSize(): number { return this._worldSize; }
}

// ============================================================================
// 3. CheckpointManager — model checkpoint save/load
// ============================================================================

export interface Checkpoint {
  id: number;
  step: number;
  modelState: Record<string, number[][]>;
  optimizerState: Record<string, number[]>;
  metrics: Record<string, number>;
  timestamp: number;
}

export class CheckpointManager {
  private _checkpoints: Map<number, Checkpoint> = new Map();
  private _maxKeep: number;
  private _checkpointCounter: number = 0;

  constructor(maxKeep: number = 5) {
    this._maxKeep = maxKeep;
  }

  save(step: number, modelState: Record<string, number[][]>, optimizerState: Record<string, number[]>, metrics: Record<string, number> = {}): Checkpoint {
    const id = this._checkpointCounter++;
    const cp: Checkpoint = {
      id,
      step,
      modelState,
      optimizerState,
      metrics,
      timestamp: Date.now()
    };
    this._checkpoints.set(id, cp);
    // evict oldest if over maxKeep
    if (this._checkpoints.size > this._maxKeep) {
      const sorted = Array.from(this._checkpoints.values()).sort((a, b) => a.id - b.id);
      this._checkpoints.delete(sorted[0].id);
    }
    return cp;
  }

  load(id: number): Checkpoint | null {
    return this._checkpoints.get(id) ?? null;
  }

  loadLatest(): Checkpoint | null {
    if (this._checkpoints.size === 0) return null;
    const sorted = Array.from(this._checkpoints.values()).sort((a, b) => b.id - a.id);
    return sorted[0];
  }

  listCheckpoints(): Checkpoint[] {
    return Array.from(this._checkpoints.values()).sort((a, b) => b.id - a.id);
  }

  getCheckpointCount(): number {
    return this._checkpoints.size;
  }

  delete(id: number): boolean {
    return this._checkpoints.delete(id);
  }

  get maxKeep(): number { return this._maxKeep; }
}

// ============================================================================
// 4. TensorBoardLogger — pretraining metrics logger
// ============================================================================

export interface LoggedMetric {
  tag: string;
  step: number;
  value: number;
  timestamp: number;
}

export class TensorBoardLogger {
  private _metrics: LoggedMetric[] = [];
  private _histograms: Map<string, number[]> = new Map();
  private _textEntries: Map<string, string> = new Map();

  scalar(tag: string, step: number, value: number): void {
    this._metrics.push({ tag, step, value, timestamp: Date.now() });
  }

  histogram(tag: string, values: number[]): void {
    this._histograms.set(tag, [...values]);
  }

  text(tag: string, content: string): void {
    this._textEntries.set(tag, content);
  }

  getScalars(tag: string): LoggedMetric[] {
    return this._metrics.filter(m => m.tag === tag);
  }

  getLatestScalar(tag: string): number | null {
    const entries = this.getScalars(tag);
    if (entries.length === 0) return null;
    return entries[entries.length - 1].value;
  }

  getHistogram(tag: string): number[] | null {
    return this._histograms.get(tag) ?? null;
  }

  getText(tag: string): string | null {
    return this._textEntries.get(tag) ?? null;
  }

  getTotalLogs(): number {
    return this._metrics.length + this._histograms.size + this._textEntries.size;
  }

  getMetrics(): LoggedMetric[] {
    return [...this._metrics];
  }
}

// ============================================================================
// 5. LRScheduler — learning rate schedule (warmup + cosine)
// ============================================================================

export class LRScheduler {
  private _baseLR: number;
  private _warmupSteps: number;
  private _totalSteps: number;
  private _minLR: number;
  private _currentStep: number = 0;

  constructor(baseLR: number, warmupSteps: number, totalSteps: number, minLR: number = 0) {
    this._baseLR = baseLR;
    this._warmupSteps = warmupSteps;
    this._totalSteps = totalSteps;
    this._minLR = minLR;
  }

  step(): number {
    const lr = this.computeLR(this._currentStep);
    this._currentStep++;
    return lr;
  }

  computeLR(step: number): number {
    if (step < this._warmupSteps) {
      // linear warmup
      return this._baseLR * (step / this._warmupSteps);
    }
    // cosine decay
    const progress = (step - this._warmupSteps) / (this._totalSteps - this._warmupSteps);
    const cosine = 0.5 * (1 + Math.cos(Math.PI * Math.min(progress, 1.0)));
    return this._minLR + (this._baseLR - this._minLR) * cosine;
  }

  getCurrentLR(): number {
    return this.computeLR(this._currentStep);
  }

  reset(): void {
    this._currentStep = 0;
  }

  get baseLR(): number { return this._baseLR; }
  get warmupSteps(): number { return this._warmupSteps; }
  get totalSteps(): number { return this._totalSteps; }
  get currentStep(): number { return this._currentStep; }
}

// ============================================================================
// 6. MixedPrecisionTrainer — FP16/FP32 mixed precision
// ============================================================================

export class MixedPrecisionTrainer {
  private _useFP16: boolean;
  private _lossScale: number;
  private _initialLossScale: number;
  private _scaleFactor: number;
  private _scaleWindow: number;
  private _stepsSinceOverflow: number = 0;
  private _overflowCount: number = 0;

  constructor(useFP16: boolean = true, initialLossScale: number = 65536, scaleFactor: number = 2, scaleWindow: number = 1000) {
    this._useFP16 = useFP16;
    this._initialLossScale = initialLossScale;
    this._lossScale = initialLossScale;
    this._scaleFactor = scaleFactor;
    this._scaleWindow = scaleWindow;
  }

  scaleLoss(loss: number): number {
    return this._useFP16 ? loss * this._lossScale : loss;
  }

  unscaleGradients(gradients: number[]): number[] {
    if (!this._useFP16) return [...gradients];
    return gradients.map(g => g / this._lossScale);
  }

  checkOverflow(gradients: number[]): boolean {
    if (!this._useFP16) return false;
    const overflow = gradients.some(g => !Number.isFinite(g) || Math.abs(g) > 1e10);
    if (overflow) {
      this._lossScale = Math.max(1, this._lossScale / this._scaleFactor);
      this._stepsSinceOverflow = 0;
      this._overflowCount++;
    } else {
      this._stepsSinceOverflow++;
      if (this._stepsSinceOverflow >= this._scaleWindow) {
        this._lossScale = Math.min(this._initialLossScale, this._lossScale * this._scaleFactor);
        this._stepsSinceOverflow = 0;
      }
    }
    return overflow;
  }

  get lossScale(): number { return this._lossScale; }
  get useFP16(): boolean { return this._useFP16; }
  get overflowCount(): number { return this._overflowCount; }
}

// ============================================================================
// 7. GradientClipper — gradient norm clipping
// ============================================================================

export class GradientClipper {
  private _maxNorm: number;
  private _normType: 'l2' | 'l1' | 'inf';
  private _clipCount: number = 0;

  constructor(maxNorm: number = 1.0, normType: 'l2' | 'l1' | 'inf' = 'l2') {
    this._maxNorm = maxNorm;
    this._normType = normType;
  }

  computeNorm(gradients: number[]): number {
    if (this._normType === 'l2') {
      return Math.sqrt(gradients.reduce((s, g) => s + g * g, 0));
    }
    if (this._normType === 'l1') {
      return gradients.reduce((s, g) => s + Math.abs(g), 0);
    }
    return gradients.reduce((s, g) => s + (Math.abs(g) > s ? Math.abs(g) : s), 0);
  }

  clip(gradients: number[]): number[] {
    const norm = this.computeNorm(gradients);
    if (norm > this._maxNorm) {
      this._clipCount++;
      const scale = this._maxNorm / norm;
      return gradients.map(g => g * scale);
    }
    return [...gradients];
  }

  getClipCount(): number {
    return this._clipCount;
  }

  resetClipCount(): void {
    this._clipCount = 0;
  }

  get maxNorm(): number { return this._maxNorm; }
  get normType(): 'l2' | 'l1' | 'inf' { return this._normType; }
}

// ============================================================================
// 8. PretrainMasterIndex — all 30 engines summary
// ============================================================================

export class PretrainMasterIndex {
  private _engines = {
    core: [
      'MaskedLMHead',
      'ContrastivePairBuilder',
      'TokenShuffler',
      'SimCSEEncoder',
      'MomentumEncoder',
      'MAEMasker',
      'DINOStudent',
      'ReplacedTokenDetector',
      'NextSentencePredictor',
      'PretrainCoreIndex'
    ],
    advanced: [
      'MomentumUpdater',
      'EMAEncoder',
      'BYOLPredictor',
      'SimSIAMHead',
      'ClusterAssignment',
      'ReLICEncoder',
      'BarlowTwinsLoss',
      'VICRegLoss',
      'MaskedAutoencoderDecoder',
      'PretrainAdvancedIndex'
    ],
    integration: [
      'PretrainLoop',
      'DistributedSampler',
      'CheckpointManager',
      'TensorBoardLogger',
      'LRScheduler',
      'MixedPrecisionTrainer',
      'GradientClipper',
      'PretrainIntegrationIndex',
      'DDPretrainBridge'
    ]
  };

  getCoreEngines(): string[] {
    return [...this._engines.core];
  }

  getAdvancedEngines(): string[] {
    return [...this._engines.advanced];
  }

  getIntegrationEngines(): string[] {
    return [...this._engines.integration];
  }

  getAllEngines(): string[] {
    return [
      ...this._engines.core,
      ...this._engines.advanced,
      ...this._engines.integration
    ];
  }

  getEngineCount(): number {
    return this._engines.core.length + this._engines.advanced.length + this._engines.integration.length;
  }

  getBatchCounts(): { core: number; advanced: number; integration: number } {
    return {
      core: this._engines.core.length,
      advanced: this._engines.advanced.length,
      integration: this._engines.integration.length
    };
  }
}

// ============================================================================
// 9. DDPretrainBridge — Core/Advanced ↔ Integration wiring
// ============================================================================

export class DDPretrainBridge {
  private _components: Map<string, unknown> = new Map();

  register(name: string, component: unknown): void {
    this._components.set(name, component);
  }

  get<T = unknown>(name: string): T | null {
    return (this._components.get(name) as T) ?? null;
  }

  has(name: string): boolean {
    return this._components.has(name);
  }

  listComponents(): string[] {
    return Array.from(this._components.keys());
  }

  unregister(name: string): boolean {
    return this._components.delete(name);
  }

  getComponentCount(): number {
    return this._components.size;
  }

  clear(): void {
    this._components.clear();
  }
}

// ============================================================================
// 10. PretrainIntegrationIndex — Batch 3/3 summary
// ============================================================================

export class PretrainIntegrationIndex {
  private _engines: string[] = [
    'PretrainLoop',
    'DistributedSampler',
    'CheckpointManager',
    'TensorBoardLogger',
    'LRScheduler',
    'MixedPrecisionTrainer',
    'GradientClipper',
    'DDPretrainBridge'
  ];

  getEngines(): string[] {
    return [...this._engines];
  }

  getEngineCount(): number {
    return this._engines.length;
  }

  getBatchInfo(): { batch: string; engines: number; category: string } {
    return {
      batch: '3/3 Integration',
      engines: this._engines.length,
      category: 'Self-Supervised Pretraining — Integration'
    };
  }

  describe(engine: string): string {
    const descriptions: Record<string, string> = {
      'PretrainLoop': 'Main pretraining loop orchestrator with EMA loss tracking',
      'DistributedSampler': 'Multi-GPU/multi-node sample distribution',
      'CheckpointManager': 'Model checkpoint save/load with FIFO eviction',
      'TensorBoardLogger': 'Scalars + histograms + text logging',
      'LRScheduler': 'Warmup + cosine decay LR schedule',
      'MixedPrecisionTrainer': 'FP16/FP32 mixed precision with dynamic loss scaling',
      'GradientClipper': 'Gradient norm clipping (L1/L2/inf)',
      'DDPretrainBridge': 'Core/Advanced ↔ Integration component registry'
    };
    return descriptions[engine] ?? 'Unknown engine';
  }
}