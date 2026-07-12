// V5336-V5345: DA Serverless Edge Functions Core Batch 1/3
// FunctionDeployer + ColdStartOptimizer + WarmPool + RequestRouter + EdgeCache + FunctionRegistry + EventTrigger + InvocationQueue + ConcurrencyLimiter + ServerlessCoreIndex

export interface FunctionDefinition {
  name: string;
  runtime: string;
  handler: string;
  memoryMb: number;
  timeoutSec: number;
  env: Record<string, string>;
  code: string;
}

export interface DeploymentRecord {
  functionName: string;
  version: string;
  deployedAt: number;
  status: 'pending' | 'active' | 'failed' | 'rolled-back';
  region: string;
}

export class FunctionDeployer {
  private _deployments: DeploymentRecord[] = [];
  private _versions = new Map<string, number>();

  deploy(def: FunctionDefinition, region: string = 'us-east-1'): DeploymentRecord {
    const existing = this._versions.get(def.name) ?? 0;
    const nextVersion = `v${existing + 1}`;
    this._versions.set(def.name, existing + 1);
    const rec: DeploymentRecord = {
      functionName: def.name,
      version: nextVersion,
      deployedAt: Date.now(),
      status: 'active',
      region
    };
    this._deployments.push(rec);
    return rec;
  }

  rollback(functionName: string): DeploymentRecord | null {
    const history = this.history(functionName);
    if (history.length < 2) return null;
    const previous = history[history.length - 2];
    const latest = history[history.length - 1];
    latest.status = 'rolled-back';
    for (const d of history) {
      if (d.version === previous.version && d !== latest) {
        d.status = 'active';
      }
    }
    return previous;
  }

  history(functionName: string): DeploymentRecord[] {
    return this._deployments.filter(d => d.functionName === functionName);
  }

  latestVersion(functionName: string): string | null {
    const history = this.history(functionName);
    if (history.length === 0) return null;
    return history[history.length - 1].version;
  }

  activeDeployments(): DeploymentRecord[] {
    return this._deployments.filter(d => d.status === 'active');
  }

  totalDeployments(): number { return this._deployments.length; }
}

export interface ColdStartMetric {
  functionName: string;
  durationMs: number;
  ts: number;
  reason: 'init' | 'cold-pool' | 'cold-disk';
}

export class ColdStartOptimizer {
  private _metrics: ColdStartMetric[] = [];
  private _warmHints = new Set<string>();

  recordColdStart(functionName: string, durationMs: number, reason: ColdStartMetric['reason']): void {
    this._metrics.push({ functionName, durationMs, ts: Date.now(), reason });
    if (durationMs > 1000) {
      this._warmHints.add(functionName);
    }
  }

  shouldPreWarm(functionName: string): boolean {
    return this._warmHints.has(functionName);
  }

  averageColdStartMs(functionName?: string): number {
    const subset = functionName
      ? this._metrics.filter(m => m.functionName === functionName)
      : this._metrics;
    if (subset.length === 0) return 0;
    return subset.reduce((sum, m) => sum + m.durationMs, 0) / subset.length;
  }

  byReason(reason: ColdStartMetric['reason']): ColdStartMetric[] {
    return this._metrics.filter(m => m.reason === reason);
  }

  coldStarts(): number { return this._metrics.length; }

  reset(): void {
    this._metrics = [];
    this._warmHints.clear();
  }
}

export interface WarmInstance {
  functionName: string;
  region: string;
  acquiredAt: number;
  lastUsed: number;
  invocations: number;
}

export class WarmPool {
  private _pool = new Map<string, WarmInstance[]>();

  add(functionName: string, region: string, count: number = 1): void {
    const existing = this._pool.get(functionName) ?? [];
    for (let i = 0; i < count; i++) {
      existing.push({
        functionName,
        region,
        acquiredAt: Date.now(),
        lastUsed: Date.now(),
        invocations: 0
      });
    }
    this._pool.set(functionName, existing);
  }

  acquire(functionName: string): WarmInstance | null {
    const instances = this._pool.get(functionName) ?? [];
    const available = instances.find(i => i.invocations < 1000);
    if (!available) return null;
    available.lastUsed = Date.now();
    available.invocations += 1;
    return available;
  }

  release(functionName: string, region: string): boolean {
    const instances = this._pool.get(functionName) ?? [];
    const idx = instances.findIndex(i => i.region === region);
    if (idx < 0) return false;
    instances.splice(idx, 1);
    this._pool.set(functionName, instances);
    return true;
  }

  poolSize(functionName: string): number {
    return (this._pool.get(functionName) ?? []).length;
  }

  idleInstances(functionName: string, idleThresholdMs: number = 60000): WarmInstance[] {
    const instances = this._pool.get(functionName) ?? [];
    const cutoff = Date.now() - idleThresholdMs;
    return instances.filter(i => i.lastUsed < cutoff);
  }

  totalInstances(): number {
    let sum = 0;
    for (const list of this._pool.values()) sum += list.length;
    return sum;
  }
}

export interface RouteRule {
  pattern: string;
  functionName: string;
  weight: number;
}

export interface RoutedRequest {
  path: string;
  method: string;
  matchedFunction: string | null;
  ts: number;
}

export class RequestRouter {
  private _rules: RouteRule[] = [];

  addRule(rule: RouteRule): void {
    this._rules.push(rule);
  }

  route(path: string, method: string = 'GET'): RoutedRequest {
    const matched = this._rules.find(r => this.matches(r.pattern, path));
    return {
      path,
      method,
      matchedFunction: matched?.functionName ?? null,
      ts: Date.now()
    };
  }

  private matches(pattern: string, path: string): boolean {
    if (pattern === path) return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return path.startsWith(prefix);
    }
    return false;
  }

  rules(): RouteRule[] { return [...this._rules]; }

  rulesForFunction(functionName: string): RouteRule[] {
    return this._rules.filter(r => r.functionName === functionName);
  }

  clear(): void { this._rules = []; }
}

export interface CacheEntry {
  key: string;
  value: string;
  ttlMs: number;
  insertedAt: number;
  hits: number;
}

export class EdgeCache {
  private _store = new Map<string, CacheEntry>();

  put(key: string, value: string, ttlMs: number = 60000): void {
    this._store.set(key, {
      key,
      value,
      ttlMs,
      insertedAt: Date.now(),
      hits: 0
    });
  }

  get(key: string): string | null {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.insertedAt > entry.ttlMs) {
      this._store.delete(key);
      return null;
    }
    entry.hits += 1;
    return entry.value;
  }

  invalidate(key: string): boolean {
    return this._store.delete(key);
  }

  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) {
        this._store.delete(key);
        count++;
      }
    }
    return count;
  }

  hotKeys(topN: number = 5): CacheEntry[] {
    return [...this._store.values()]
      .sort((a, b) => b.hits - a.hits)
      .slice(0, topN);
  }

  size(): number { return this._store.size; }

  hitRate(): number {
    let totalHits = 0;
    let totalAccesses = 0;
    for (const entry of this._store.values()) {
      totalHits += entry.hits;
      totalAccesses += entry.hits + 1;
    }
    return totalAccesses === 0 ? 0 : totalHits / totalAccesses;
  }
}

export class FunctionRegistry {
  private _functions = new Map<string, FunctionDefinition>();

  register(def: FunctionDefinition): void {
    this._functions.set(def.name, def);
  }

  get(name: string): FunctionDefinition | null {
    return this._functions.get(name) ?? null;
  }

  unregister(name: string): boolean {
    return this._functions.delete(name);
  }

  byRuntime(runtime: string): FunctionDefinition[] {
    return [...this._functions.values()].filter(f => f.runtime === runtime);
  }

  totalMemoryMb(): number {
    let sum = 0;
    for (const f of this._functions.values()) sum += f.memoryMb;
    return sum;
  }

  names(): string[] { return [...this._functions.keys()]; }

  count(): number { return this._functions.size; }
}

export interface EventBinding {
  eventType: string;
  functionName: string;
  filter?: Record<string, string>;
}

export class EventTrigger {
  private _bindings: EventBinding[] = [];
  private _history: Array<{ binding: EventBinding; payload: unknown; ts: number }> = [];

  bind(binding: EventBinding): void {
    this._bindings.push(binding);
  }

  fire(eventType: string, payload: unknown): EventBinding[] {
    const matched = this._bindings.filter(b => b.eventType === eventType);
    for (const b of matched) {
      this._history.push({ binding: b, payload, ts: Date.now() });
    }
    return matched;
  }

  bindingsFor(functionName: string): EventBinding[] {
    return this._bindings.filter(b => b.functionName === functionName);
  }

  history(functionName?: string): Array<{ binding: EventBinding; payload: unknown; ts: number }> {
    return functionName
      ? this._history.filter(h => h.binding.functionName === functionName)
      : [...this._history];
  }

  totalBindings(): number { return this._bindings.length; }

  totalFired(): number { return this._history.length; }
}

export interface QueuedInvocation {
  id: string;
  functionName: string;
  payload: unknown;
  enqueuedAt: number;
  startedAt: number | null;
  completedAt: number | null;
  status: 'queued' | 'running' | 'done' | 'failed';
}

export class InvocationQueue {
  private _queue: QueuedInvocation[] = [];
  private _nextId = 1;

  enqueue(functionName: string, payload: unknown): QueuedInvocation {
    const inv: QueuedInvocation = {
      id: `inv-${this._nextId++}`,
      functionName,
      payload,
      enqueuedAt: Date.now(),
      startedAt: null,
      completedAt: null,
      status: 'queued'
    };
    this._queue.push(inv);
    return inv;
  }

  dequeue(): QueuedInvocation | null {
    const idx = this._queue.findIndex(i => i.status === 'queued');
    if (idx < 0) return null;
    const item = this._queue[idx];
    item.status = 'running';
    item.startedAt = Date.now();
    return item;
  }

  complete(id: string, success: boolean = true): boolean {
    const item = this._queue.find(i => i.id === id);
    if (!item) return false;
    item.completedAt = Date.now();
    item.status = success ? 'done' : 'failed';
    return true;
  }

  pending(): QueuedInvocation[] {
    return this._queue.filter(i => i.status === 'queued' || i.status === 'running');
  }

  queueDepth(functionName?: string): number {
    return functionName
      ? this._queue.filter(i => i.functionName === functionName && i.status === 'queued').length
      : this._queue.filter(i => i.status === 'queued').length;
  }

  averageWaitMs(): number {
    const queued = this._queue.filter(i => i.startedAt !== null);
    if (queued.length === 0) return 0;
    const sum = queued.reduce((acc, i) => acc + (i.startedAt! - i.enqueuedAt), 0);
    return sum / queued.length;
  }
}

export class ConcurrencyLimiter {
  private _running = new Map<string, number>();
  private _limits = new Map<string, number>();

  setLimit(functionName: string, max: number): void {
    this._limits.set(functionName, max);
  }

  tryAcquire(functionName: string): boolean {
    const limit = this._limits.get(functionName) ?? 10;
    const current = this._running.get(functionName) ?? 0;
    if (current >= limit) return false;
    this._running.set(functionName, current + 1);
    return true;
  }

  release(functionName: string): void {
    const current = this._running.get(functionName) ?? 0;
    this._running.set(functionName, Math.max(0, current - 1));
  }

  activeFor(functionName: string): number {
    return this._running.get(functionName) ?? 0;
  }

  utilization(functionName: string): number {
    const limit = this._limits.get(functionName) ?? 10;
    const current = this._running.get(functionName) ?? 0;
    return limit === 0 ? 0 : current / limit;
  }

  overloadedFunctions(): string[] {
    const out: string[] = [];
    for (const [fn, limit] of this._limits) {
      const current = this._running.get(fn) ?? 0;
      if (current >= limit) out.push(fn);
    }
    return out;
  }
}

export class ServerlessCoreIndex {
  static summary(deployer: FunctionDeployer, optimizer: ColdStartOptimizer, pool: WarmPool, queue: InvocationQueue): string {
    return [
      `Deployments: ${deployer.totalDeployments()}`,
      `Cold starts: ${optimizer.coldStarts()}`,
      `Warm instances: ${pool.totalInstances()}`,
      `Queue depth: ${queue.queueDepth()}`
    ].join(' | ');
  }
}