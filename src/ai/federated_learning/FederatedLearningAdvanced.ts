// V5136-V5145: CS Federated Learning Advanced Batch 2/3
// RoundManager + ClientSelection + ModelVersioning + FLStrategy + AggregationRule + FedAvg + FedProx + FLAnalytics + PrivacyAccountant

export class RoundManager {
  private _rounds: Map<number, { startedAt: number; completedAt?: number; participants: string[] }> = new Map();
  private _currentRound = 0;

  start(participants: string[]): number {
    this._currentRound += 1;
    this._rounds.set(this._currentRound, { startedAt: Date.now(), participants });
    return this._currentRound;
  }

  complete(round: number): boolean {
    const r = this._rounds.get(round);
    if (!r || r.completedAt) return false;
    r.completedAt = Date.now();
    return true;
  }

  isComplete(round: number): boolean {
    return !!this._rounds.get(round)?.completedAt;
  }

  durationMs(round: number): number {
    const r = this._rounds.get(round);
    if (!r) return 0;
    return (r.completedAt ?? Date.now()) - r.startedAt;
  }

  participants(round: number): string[] {
    return [...(this._rounds.get(round)?.participants ?? [])];
  }

  currentRound(): number { return this._currentRound; }
}

export class ClientSelection {
  select(clients: string[], k: number, strategy: 'random' | 'round-robin' | 'top-samples' = 'random', samples?: Map<string, number>): string[] {
    if (clients.length <= k) return [...clients];
    switch (strategy) {
      case 'round-robin':
        return clients.slice(0, k);
      case 'top-samples': {
        if (!samples) return clients.slice(0, k);
        return [...clients].sort((a, b) => (samples.get(b) ?? 0) - (samples.get(a) ?? 0)).slice(0, k);
      }
      case 'random':
      default:
        return [...clients].sort(() => Math.random() - 0.5).slice(0, k);
    }
  }
}

export class ModelVersioning {
  private _versions: Map<string, Array<{ version: number; ts: number }>> = new Map();

  record(modelId: string): number {
    const versions = this._versions.get(modelId) ?? [];
    const next = (versions[versions.length - 1]?.version ?? 0) + 1;
    versions.push({ version: next, ts: Date.now() });
    this._versions.set(modelId, versions);
    return next;
  }

  versionsOf(modelId: string): number[] {
    return (this._versions.get(modelId) ?? []).map(v => v.version);
  }

  latest(modelId: string): number {
    const vs = this._versions.get(modelId);
    return vs && vs.length > 0 ? vs[vs.length - 1].version : 0;
  }

  rollback(modelId: string, toVersion: number): boolean {
    const vs = this._versions.get(modelId);
    return vs ? vs.some(v => v.version === toVersion) : false;
  }

  count(): number { return this._versions.size; }
}

export class FLStrategy {
  private _strategy: 'fedavg' | 'fedprox' | 'fednova' | 'scaffold' = 'fedavg';

  setStrategy(s: 'fedavg' | 'fedprox' | 'fednova' | 'scaffold'): this {
    this._strategy = s;
    return this;
  }

  strategy(): 'fedavg' | 'fedprox' | 'fednova' | 'scaffold' { return this._strategy; }

  isProximal(): boolean {
    return this._strategy === 'fedprox' || this._strategy === 'scaffold';
  }
}

export class AggregationRule {
  // Custom weighted aggregation: weight = samples * clientTrust
  aggregate(updates: Array<{ weights: number[]; samples: number; trust: number }>): number[] | null {
    if (updates.length === 0) return null;
    const dim = updates[0].weights.length;
    let totalWeight = 0;
    for (const u of updates) totalWeight += u.samples * u.trust;
    if (totalWeight === 0) return null;
    const result = new Array(dim).fill(0);
    for (const u of updates) {
      const w = (u.samples * u.trust) / totalWeight;
      for (let i = 0; i < dim; i++) result[i] += u.weights[i] * w;
    }
    return result;
  }
}

export class FedAvg {
  aggregate(updates: Array<{ weights: number[]; samples: number }>): number[] | null {
    if (updates.length === 0) return null;
    const dim = updates[0].weights.length;
    const total = updates.reduce((s, u) => s + u.samples, 0);
    if (total === 0) return null;
    const result = new Array(dim).fill(0);
    for (const u of updates) {
      const w = u.samples / total;
      for (let i = 0; i < dim; i++) result[i] += u.weights[i] * w;
    }
    return result;
  }
}

export class FedProx {
  private _mu: number;

  constructor(mu = 0.01) {
    this._mu = mu;
  }

  // Add proximal term penalty
  applyProximal(localWeights: number[], globalWeights: number[]): number[] {
    return localWeights.map((w, i) => w - this._mu * (w - (globalWeights[i] ?? 0)));
  }

  mu(): number { return this._mu; }
  setMu(m: number): void { this._mu = m; }
}

export class FLAnalytics {
  private _metrics: Map<string, number> = new Map();

  record(metric: string, value: number): this {
    this._metrics.set(metric, (this._metrics.get(metric) ?? 0) + value);
    return this;
  }

  get(metric: string): number {
    return this._metrics.get(metric) ?? 0;
  }

  all(): Record<string, number> {
    return Object.fromEntries(this._metrics.entries());
  }

  reset(): void { this._metrics.clear(); }
}

export class PrivacyAccountant {
  private _history: Array<{ ts: number; epsilon: number; delta: number }> = [];

  record(epsilon: number, delta: number): void {
    this._history.push({ ts: Date.now(), epsilon, delta });
  }

  totalEpsilon(): number {
    return this._history.reduce((s, h) => s + h.epsilon, 0);
  }

  totalDelta(): number {
    return this._history.reduce((s, h) => s + h.delta, 0);
  }

  historyCount(): number { return this._history.length; }

  history(): Array<{ ts: number; epsilon: number; delta: number }> {
    return [...this._history];
  }
}

// V5145: FedLearnAdvancedIndex
export const CS_BATCH_2_ENGINES = [
  'RoundManager', 'ClientSelection', 'ModelVersioning', 'FLStrategy', 'AggregationRule',
  'FedAvg', 'FedProx', 'FLAnalytics', 'PrivacyAccountant', 'FedLearnAdvancedIndex'
] as const;

export class FedLearnAdvancedIndex {
  list(): string[] {
    return [...CS_BATCH_2_ENGINES];
  }

  count(): number {
    return CS_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CS_BATCH_2_ENGINES.includes(name as typeof CS_BATCH_2_ENGINES[number]);
  }
}