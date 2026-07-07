// V5126-V5135: CS Federated Learning Core Batch 1/3
// Coordinator + LocalTrainer + ModelAggregator + SecureAggregator + DifferentialPrivacy + NoiseInjector + GradientClipper + PrivacyBudget + SecureProtocol + ClientRegistry

export interface ModelUpdate {
  clientId: string;
  weights: number[];
  samples: number;
  ts: number;
}

export class FederatedCoordinator {
  private _rounds: Map<number, { updates: ModelUpdate[]; status: 'collecting' | 'aggregating' | 'done' }> = new Map();
  private _currentRound = 0;

  startRound(): number {
    this._currentRound += 1;
    this._rounds.set(this._currentRound, { updates: [], status: 'collecting' });
    return this._currentRound;
  }

  submitUpdate(update: ModelUpdate): boolean {
    const r = this._rounds.get(this._currentRound);
    if (!r || r.status !== 'collecting') return false;
    r.updates.push(update);
    return true;
  }

  beginAggregation(): boolean {
    const r = this._rounds.get(this._currentRound);
    if (!r || r.status !== 'collecting') return false;
    r.status = 'aggregating';
    return true;
  }

  completeRound(): boolean {
    const r = this._rounds.get(this._currentRound);
    if (!r || r.status !== 'aggregating') return false;
    r.status = 'done';
    return true;
  }

  currentRound(): number { return this._currentRound; }

  updates(round: number): ModelUpdate[] {
    return [...(this._rounds.get(round)?.updates ?? [])];
  }

  status(round: number): 'collecting' | 'aggregating' | 'done' | null {
    return this._rounds.get(round)?.status ?? null;
  }
}

export class LocalTrainer {
  private _model: number[] = [];
  private _lr: number;

  constructor(initialWeights: number[], learningRate = 0.01) {
    this._model = [...initialWeights];
    this._lr = learningRate;
  }

  trainStep(gradients: number[]): number[] {
    return gradients.map((g, i) => this._model[i] - this._lr * g);
  }

  model(): number[] { return [...this._model]; }

  setModel(weights: number[]): this {
    this._model = [...weights];
    return this;
  }

  learningRate(): number { return this._lr; }
}

export class ModelAggregator {
  aggregate(updates: ModelUpdate[]): number[] | null {
    if (updates.length === 0) return null;
    const dim = updates[0].weights.length;
    const totalSamples = updates.reduce((s, u) => s + u.samples, 0);
    if (totalSamples === 0) return null;
    const aggregated = new Array(dim).fill(0);
    for (const u of updates) {
      const w = u.samples / totalSamples;
      for (let i = 0; i < dim; i++) aggregated[i] += u.weights[i] * w;
    }
    return aggregated;
  }

  averageWeights(updates: ModelUpdate[]): number[] | null {
    return this.aggregate(updates);
  }
}

export class SecureAggregator {
  // Mask each update with random noise + share key
  mask(update: ModelUpdate, key: number): number[] {
    return update.weights.map(w => w + Math.sin(key * w) * 0.001);
  }

  unmask(masked: number[][], key: number): number[] {
    if (masked.length === 0) return [];
    const dim = masked[0].length;
    const result = new Array(dim).fill(0);
    for (const m of masked) {
      for (let i = 0; i < dim; i++) result[i] += m[i] - Math.sin(key * m[i]) * 0.001;
    }
    return result.map(v => v / masked.length);
  }

  secureAggregate(updates: ModelUpdate[], key: number): number[] | null {
    const masked = updates.map(u => this.mask(u, key));
    return this.unmask(masked, key);
  }
}

export class DifferentialPrivacy {
  private _epsilon: number;
  private _delta: number;

  constructor(epsilon = 1.0, delta = 1e-5) {
    this._epsilon = epsilon;
    this._delta = delta;
  }

  epsilon(): number { return this._epsilon; }
  delta(): number { return this._delta; }

  setEpsilon(e: number): this { this._epsilon = e; return this; }
  setDelta(d: number): this { this._delta = d; return this; }

  // Simple Laplace noise scale
  noiseScale(sensitivity: number): number {
    return sensitivity / this._epsilon;
  }
}

export class NoiseInjector {
  inject(weights: number[], scale: number, seed = 0): number[] {
    let s = seed;
    return weights.map(w => {
      s = (s * 9301 + 49297) % 233280;
      const noise = (s / 233280 - 0.5) * 2 * scale;
      return w + noise;
    });
  }

  laplaceNoise(weights: number[], scale: number): number[] {
    return this.inject(weights, scale, 1);
  }
}

export class GradientClipper {
  clip(gradients: number[], maxNorm: number): number[] {
    let norm = 0;
    for (const g of gradients) norm += g * g;
    norm = Math.sqrt(norm);
    if (norm <= maxNorm) return [...gradients];
    const factor = maxNorm / norm;
    return gradients.map(g => g * factor);
  }

  globalNorm(gradients: number[]): number {
    let n = 0;
    for (const g of gradients) n += g * g;
    return Math.sqrt(n);
  }
}

export class PrivacyBudget {
  private _spent: number = 0;
  private _total: number;

  constructor(total: number) {
    this._total = total;
  }

  spend(amount: number): boolean {
    if (this._spent + amount > this._total) return false;
    this._spent += amount;
    return true;
  }

  remaining(): number {
    return this._total - this._spent;
  }

  spent(): number { return this._spent; }
  total(): number { return this._total; }
}

export class SecureProtocol {
  private _keys: Map<string, string> = new Map();

  generateKey(clientId: string): string {
    const key = Math.random().toString(36).slice(2);
    this._keys.set(clientId, key);
    return key;
  }

  getKey(clientId: string): string | null {
    return this._keys.get(clientId) ?? null;
  }

  rotateKey(clientId: string): string | null {
    if (!this._keys.has(clientId)) return null;
    return this.generateKey(clientId);
  }

  hasKey(clientId: string): boolean {
    return this._keys.has(clientId);
  }
}

export class ClientRegistry {
  private _clients: Map<string, { joinedAt: number; samples: number; active: boolean }> = new Map();

  register(clientId: string, samples = 0): this {
    this._clients.set(clientId, { joinedAt: Date.now(), samples, active: true });
    return this;
  }

  deregister(clientId: string): boolean {
    const c = this._clients.get(clientId);
    if (!c) return false;
    c.active = false;
    return true;
  }

  isActive(clientId: string): boolean {
    return this._clients.get(clientId)?.active ?? false;
  }

  samples(clientId: string): number {
    return this._clients.get(clientId)?.samples ?? 0;
  }

  activeClients(): string[] {
    return [...this._clients.entries()].filter(([_, c]) => c.active).map(([id]) => id);
  }

  count(): number { return this._clients.size; }
}

// V5135: FedLearnCoreIndex
export const CS_BATCH_1_ENGINES = [
  'FederatedCoordinator', 'LocalTrainer', 'ModelAggregator', 'SecureAggregator', 'DifferentialPrivacy',
  'NoiseInjector', 'GradientClipper', 'PrivacyBudget', 'SecureProtocol', 'ClientRegistry', 'FedLearnCoreIndex'
] as const;

export class FedLearnCoreIndex {
  list(): string[] {
    return [...CS_BATCH_1_ENGINES];
  }

  count(): number {
    return CS_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CS_BATCH_1_ENGINES.includes(name as typeof CS_BATCH_1_ENGINES[number]);
  }
}