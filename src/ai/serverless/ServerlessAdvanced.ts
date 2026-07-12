// V5346-V5355: DA Serverless Edge Functions Advanced Batch 2/3
// MemoryManager + EnvVarResolver + SecretVault + LogStreamer + MetricsCollector + ProvisionedConcurrency + FailureInjector + TimeoutGuard + VersionManager + ServerlessAdvancedIndex

export interface MemoryAllocation {
  functionName: string;
  allocatedMb: number;
  usedMb: number;
  ts: number;
}

export class MemoryManager {
  private _allocations: MemoryAllocation[] = [];
  private _peak = new Map<string, number>();

  allocate(functionName: string, allocatedMb: number): MemoryAllocation {
    const alloc: MemoryAllocation = {
      functionName,
      allocatedMb,
      usedMb: 0,
      ts: Date.now()
    };
    this._allocations.push(alloc);
    return alloc;
  }

  recordUsage(functionName: string, usedMb: number): void {
    let updated = false;
    for (let i = this._allocations.length - 1; i >= 0; i--) {
      const a = this._allocations[i];
      if (a.functionName === functionName) {
        a.usedMb = usedMb;
        updated = true;
        break;
      }
    }
    if (updated) {
      const peak = this._peak.get(functionName) ?? 0;
      if (usedMb > peak) this._peak.set(functionName, usedMb);
    }
  }

  peakUsage(functionName: string): number {
    return this._peak.get(functionName) ?? 0;
  }

  averageUtilization(functionName?: string): number {
    const subset = functionName
      ? this._allocations.filter(a => a.functionName === functionName)
      : this._allocations;
    if (subset.length === 0) return 0;
    const sum = subset.reduce((acc, a) => acc + (a.usedMb / a.allocatedMb), 0);
    return sum / subset.length;
  }

  overProvisioned(threshold: number = 0.5): string[] {
    return [...this._peak.entries()]
      .filter(([_, peak]) => peak < threshold * 256)
      .map(([fn]) => fn);
  }

  totalAllocations(): number { return this._allocations.length; }
}

export interface EnvVar {
  key: string;
  value: string;
  source: 'literal' | 'secrets' | 'parameter-store' | 'env-file';
}

export class EnvVarResolver {
  private _store = new Map<string, EnvVar>();
  private _secretsRef = new Map<string, string>();

  set(key: string, value: string, source: EnvVar['source'] = 'literal'): void {
    this._store.set(key, { key, value, source });
  }

  resolve(key: string): string | null {
    const v = this._store.get(key);
    if (!v) return null;
    if (v.source === 'secrets') {
      return this._secretsRef.get(v.value) ?? '[REDACTED]';
    }
    return v.value;
  }

  setSecret(alias: string, realValue: string): void {
    this._secretsRef.set(alias, realValue);
  }

  keys(): string[] { return [...this._store.keys()]; }

  bySource(source: EnvVar['source']): EnvVar[] {
    return [...this._store.values()].filter(v => v.source === source);
  }

  resolveAll(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const key of this._store.keys()) {
      const v = this.resolve(key);
      if (v !== null) out[key] = v;
    }
    return out;
  }

  size(): number { return this._store.size; }
}

export interface Secret {
  name: string;
  cipherText: string;
  version: number;
  rotatedAt: number;
}

export class SecretVault {
  private _secrets = new Map<string, Secret[]>();

  put(name: string, cipherText: string): Secret {
    const list = this._secrets.get(name) ?? [];
    const version = list.length + 1;
    const secret: Secret = {
      name,
      cipherText,
      version,
      rotatedAt: Date.now()
    };
    list.push(secret);
    this._secrets.set(name, list);
    return secret;
  }

  rotate(name: string, newCipherText: string): Secret {
    return this.put(name, newCipherText);
  }

  current(name: string): Secret | null {
    const list = this._secrets.get(name);
    return list && list.length > 0 ? list[list.length - 1] : null;
  }

  history(name: string): Secret[] {
    return [...(this._secrets.get(name) ?? [])];
  }

  previousVersion(name: string): Secret | null {
    const list = this._secrets.get(name) ?? [];
    return list.length >= 2 ? list[list.length - 2] : null;
  }

  ageMs(name: string): number {
    const current = this.current(name);
    return current ? Date.now() - current.rotatedAt : Infinity;
  }

  isStale(name: string, maxAgeMs: number = 90 * 24 * 3600 * 1000): boolean {
    return this.ageMs(name) > maxAgeMs;
  }

  totalSecrets(): number {
    let count = 0;
    for (const list of this._secrets.values()) count += list.length;
    return count;
  }
}

export interface LogLine {
  ts: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  functionName: string;
  requestId?: string;
}

export class LogStreamer {
  private _buffer: LogLine[] = [];
  private _subscribers: Array<(line: LogLine) => void> = [];

  log(line: Omit<LogLine, 'ts'>): void {
    const full: LogLine = { ...line, ts: Date.now() };
    this._buffer.push(full);
    for (const sub of this._subscribers) sub(full);
  }

  subscribe(fn: (line: LogLine) => void): () => void {
    this._subscribers.push(fn);
    return () => {
      const idx = this._subscribers.indexOf(fn);
      if (idx >= 0) this._subscribers.splice(idx, 1);
    };
  }

  byLevel(level: LogLine['level']): LogLine[] {
    return this._buffer.filter(l => l.level === level);
  }

  byFunction(functionName: string): LogLine[] {
    return this._buffer.filter(l => l.functionName === functionName);
  }

  errors(): LogLine[] { return this.byLevel('error'); }

  recent(n: number = 10): LogLine[] {
    return this._buffer.slice(-n);
  }

  totalLines(): number { return this._buffer.length; }

  clear(): void { this._buffer = []; }
}

export interface MetricSample {
  name: string;
  value: number;
  ts: number;
  tags: Record<string, string>;
}

export class MetricsCollector {
  private _samples: MetricSample[] = [];
  private _aggregates = new Map<string, { sum: number; count: number; min: number; max: number }>();

  record(sample: Omit<MetricSample, 'ts'>): void {
    const full: MetricSample = { ...sample, ts: Date.now() };
    this._samples.push(full);
    const agg = this._aggregates.get(sample.name);
    if (agg) {
      agg.sum += sample.value;
      agg.count += 1;
      agg.min = Math.min(agg.min, sample.value);
      agg.max = Math.max(agg.max, sample.value);
    } else {
      this._aggregates.set(sample.name, {
        sum: sample.value,
        count: 1,
        min: sample.value,
        max: sample.value
      });
    }
  }

  summary(name: string): { avg: number; min: number; max: number; count: number } | null {
    const agg = this._aggregates.get(name);
    if (!agg) return null;
    return {
      avg: agg.sum / agg.count,
      min: agg.min,
      max: agg.max,
      count: agg.count
    };
  }

  byTag(name: string, tagKey: string, tagValue: string): MetricSample[] {
    return this._samples.filter(s => s.name === name && s.tags[tagKey] === tagValue);
  }

  metricNames(): string[] { return [...this._aggregates.keys()]; }

  totalSamples(): number { return this._samples.length; }
}

export interface ConcurrencyWindow {
  functionName: string;
  level: number;
  ts: number;
  expiresAt: number;
}

export class ProvisionedConcurrency {
  private _windows: ConcurrencyWindow[] = [];

  setProvisioned(functionName: string, level: number, ttlMs: number = 3600000): ConcurrencyWindow {
    const w: ConcurrencyWindow = {
      functionName,
      level,
      ts: Date.now(),
      expiresAt: Date.now() + ttlMs
    };
    this._windows.push(w);
    return w;
  }

  provisionedFor(functionName: string): number {
    const active = this._windows.filter(
      w => w.functionName === functionName && w.expiresAt > Date.now()
    );
    if (active.length === 0) return 0;
    return Math.max(...active.map(w => w.level));
  }

  activeWindows(): ConcurrencyWindow[] {
    return this._windows.filter(w => w.expiresAt > Date.now());
  }

  expiredWindows(): ConcurrencyWindow[] {
    return this._windows.filter(w => w.expiresAt <= Date.now());
  }

  cleanup(): number {
    const before = this._windows.length;
    this._windows = this._windows.filter(w => w.expiresAt > Date.now());
    return before - this._windows.length;
  }

  totalProvisioned(): number {
    const active = this.activeWindows();
    return active.reduce((sum, w) => sum + w.level, 0);
  }
}

export interface FaultSpec {
  functionName: string;
  type: 'error' | 'timeout' | 'memory' | 'throttle';
  probability: number;
  active: boolean;
}

export class FailureInjector {
  private _faults: FaultSpec[] = [];
  private _invocations = 0;
  private _failures = 0;

  configure(spec: FaultSpec): void {
    this._faults.push(spec);
  }

  disable(functionName: string): void {
    for (const f of this._faults) {
      if (f.functionName === functionName) f.active = false;
    }
  }

  shouldFail(functionName: string): boolean {
    this._invocations += 1;
    const active = this._faults.filter(f => f.functionName === functionName && f.active);
    if (active.length === 0) return false;
    const trigger = Math.random() < Math.max(...active.map(a => a.probability));
    if (trigger) this._failures += 1;
    return trigger;
  }

  injectType(functionName: string): 'error' | 'timeout' | 'memory' | 'throttle' | null {
    const active = this._faults.filter(f => f.functionName === functionName && f.active);
    if (active.length === 0) return null;
    const selected = active[Math.floor(Math.random() * active.length)];
    return selected.type;
  }

  failureRate(): number {
    return this._invocations === 0 ? 0 : this._failures / this._invocations;
  }

  activeFaults(): FaultSpec[] {
    return this._faults.filter(f => f.active);
  }
}

export interface TimeoutRecord {
  functionName: string;
  timeoutSec: number;
  durationMs: number;
  breached: boolean;
  ts: number;
}

export class TimeoutGuard {
  private _records: TimeoutRecord[] = [];

  check(functionName: string, timeoutSec: number, durationMs: number): TimeoutRecord {
    const r: TimeoutRecord = {
      functionName,
      timeoutSec,
      durationMs,
      breached: durationMs > timeoutSec * 1000,
      ts: Date.now()
    };
    this._records.push(r);
    return r;
  }

  breachRate(functionName?: string): number {
    const subset = functionName
      ? this._records.filter(r => r.functionName === functionName)
      : this._records;
    if (subset.length === 0) return 0;
    return subset.filter(r => r.breached).length / subset.length;
  }

  breachesFor(functionName: string): TimeoutRecord[] {
    return this._records.filter(r => r.functionName === functionName && r.breached);
  }

  worstOffender(): { name: string; breachRate: number } | null {
    const grouped = new Map<string, { total: number; breached: number }>();
    for (const r of this._records) {
      const g = grouped.get(r.functionName) ?? { total: 0, breached: 0 };
      g.total += 1;
      if (r.breached) g.breached += 1;
      grouped.set(r.functionName, g);
    }
    let worst: { name: string; breachRate: number } | null = null;
    for (const [name, g] of grouped) {
      const rate = g.breached / g.total;
      if (!worst || rate > worst.breachRate) worst = { name, breachRate: rate };
    }
    return worst;
  }

  totalRecords(): number { return this._records.length; }
}

export class VersionManager {
  private _versions = new Map<string, string[]>();
  private _aliases = new Map<string, string>();

  publish(functionName: string, version: string): void {
    const list = this._versions.get(functionName) ?? [];
    if (!list.includes(version)) list.push(version);
    this._versions.set(functionName, list);
  }

  alias(functionName: string, alias: string, version: string): boolean {
    const list = this._versions.get(functionName) ?? [];
    if (!list.includes(version)) return false;
    this._aliases.set(`${functionName}:${alias}`, version);
    return true;
  }

  resolve(functionName: string, alias: string = 'latest'): string | null {
    const list = this._versions.get(functionName) ?? [];
    if (alias === 'latest') return list[list.length - 1] ?? null;
    return this._aliases.get(`${functionName}:${alias}`) ?? null;
  }

  versions(functionName: string): string[] {
    return [...(this._versions.get(functionName) ?? [])];
  }

  aliasesFor(functionName: string): string[] {
    return [...this._aliases.keys()]
      .filter(k => k.startsWith(`${functionName}:`))
      .map(k => k.split(':')[1]);
  }

  totalVersions(): number {
    let sum = 0;
    for (const list of this._versions.values()) sum += list.length;
    return sum;
  }
}

export class ServerlessAdvancedIndex {
  static summary(
    secrets: SecretVault,
    metrics: MetricsCollector,
    logs: LogStreamer,
    timeouts: TimeoutGuard
  ): string {
    return [
      `Secrets: ${secrets.totalSecrets()}`,
      `Metrics: ${metrics.totalSamples()}`,
      `Logs: ${logs.totalLines()}`,
      `Timeout records: ${timeouts.totalRecords()}`
    ].join(' | ');
  }
}