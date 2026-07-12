// V5356-V5365: DA Serverless Edge Functions Integration Batch 3/3
// APIGateway + EdgeMiddleware + CostOptimizer + PerformanceMonitor + DistributedTraceLinker + HealthChecker + MigrationTool + ServerlessIntegrationIndex + DAEdgeBridge + ServerlessMasterIndex

import {
  FunctionRegistry,
  RequestRouter,
  RouteRule
} from './ServerlessCore';
import {
  MetricsCollector,
  LogStreamer,
  TimeoutGuard
} from './ServerlessAdvanced';

export interface RouteConfig {
  path: string;
  method: string;
  functionName: string;
  authRequired: boolean;
  rateLimitPerMin: number;
}

export interface ApiRequest {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse {
  status: number;
  body: unknown;
  requestId: string;
  durationMs: number;
}

export class APIGateway {
  private _routes: RouteConfig[] = [];
  private _metrics = new MetricsCollector();
  private _logs = new LogStreamer();

  addRoute(route: RouteConfig): void {
    this._routes.push(route);
  }

  async handle(req: ApiRequest): Promise<ApiResponse> {
    const start = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const route = this._routes.find(r => r.path === req.path && r.method === req.method);
    if (!route) {
      this._logs.log({ level: 'warn', message: 'route-not-found', functionName: 'gateway', requestId });
      return { status: 404, body: { error: 'Not Found' }, requestId, durationMs: 0 };
    }
    if (route.authRequired && !req.headers['authorization']) {
      this._logs.log({ level: 'warn', message: 'auth-missing', functionName: route.functionName, requestId });
      return { status: 401, body: { error: 'Unauthorized' }, requestId, durationMs: 0 };
    }
    this._metrics.record({
      name: 'requests',
      value: 1,
      tags: { function: route.functionName, method: req.method }
    });
    const duration = Date.now() - start + 5;
    this._logs.log({ level: 'info', message: 'invoked', functionName: route.functionName, requestId });
    return {
      status: 200,
      body: { ok: true, function: route.functionName },
      requestId,
      durationMs: duration
    };
  }

  routes(): RouteConfig[] { return [...this._routes]; }
  metrics(): MetricsCollector { return this._metrics; }
  logs(): LogStreamer { return this._logs; }
}

export type Middleware = (req: ApiRequest) => ApiRequest | Promise<ApiRequest>;

export class EdgeMiddleware {
  private _chain: Array<{ name: string; fn: Middleware }> = [];

  use(name: string, fn: Middleware): void {
    this._chain.push({ name, fn });
  }

  async execute(req: ApiRequest): Promise<ApiRequest> {
    let current = req;
    for (const m of this._chain) {
      current = await m.fn(current);
    }
    return current;
  }

  middlewareNames(): string[] {
    return this._chain.map(m => m.name);
  }

  remove(name: string): boolean {
    const idx = this._chain.findIndex(m => m.name === name);
    if (idx < 0) return false;
    this._chain.splice(idx, 1);
    return true;
  }

  size(): number { return this._chain.length; }
}

export interface CostBreakdown {
  functionName: string;
  invocations: number;
  gbSeconds: number;
  estimatedCostUsd: number;
}

export class CostOptimizer {
  private _invocations = new Map<string, number>();
  private _gbSeconds = new Map<string, number>();
  private _pricePerGbSec = 0.0000166667;
  private _pricePerRequest = 0.0000002;

  recordInvocation(functionName: string, durationMs: number, memoryMb: number): void {
    this._invocations.set(functionName, (this._invocations.get(functionName) ?? 0) + 1);
    const gbSec = (memoryMb / 1024) * (durationMs / 1000);
    this._gbSeconds.set(functionName, (this._gbSeconds.get(functionName) ?? 0) + gbSec);
  }

  breakdown(): CostBreakdown[] {
    const names = new Set([...this._invocations.keys(), ...this._gbSeconds.keys()]);
    return [...names].map(name => {
      const inv = this._invocations.get(name) ?? 0;
      const gbSec = this._gbSeconds.get(name) ?? 0;
      const cost = gbSec * this._pricePerGbSec + inv * this._pricePerRequest;
      return {
        functionName: name,
        invocations: inv,
        gbSeconds: gbSec,
        estimatedCostUsd: cost
      };
    });
  }

  topSpenders(n: number = 5): CostBreakdown[] {
    return this.breakdown().sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd).slice(0, n);
  }

  totalCost(): number {
    return this.breakdown().reduce((sum, b) => sum + b.estimatedCostUsd, 0);
  }

  setPricing(gbSec: number, request: number): void {
    this._pricePerGbSec = gbSec;
    this._pricePerRequest = request;
  }
}

export interface PerformanceSnapshot {
  functionName: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  errorRate: number;
  ts: number;
}

export class PerformanceMonitor {
  private _durations = new Map<string, number[]>();
  private _errors = new Map<string, number>();
  private _total = new Map<string, number>();

  record(functionName: string, durationMs: number, isError: boolean = false): void {
    const arr = this._durations.get(functionName) ?? [];
    arr.push(durationMs);
    this._durations.set(functionName, arr);
    this._total.set(functionName, (this._total.get(functionName) ?? 0) + 1);
    if (isError) {
      this._errors.set(functionName, (this._errors.get(functionName) ?? 0) + 1);
    }
  }

  snapshot(functionName: string): PerformanceSnapshot {
    const durations = this._durations.get(functionName) ?? [];
    const sorted = [...durations].sort((a, b) => a - b);
    const total = this._total.get(functionName) ?? 0;
    const errors = this._errors.get(functionName) ?? 0;
    return {
      functionName,
      p50Ms: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      p99Ms: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
      errorRate: total === 0 ? 0 : errors / total,
      ts: Date.now()
    };
  }

  snapshots(): PerformanceSnapshot[] {
    return [...this._durations.keys()].map(n => this.snapshot(n));
  }

  worstP99(): PerformanceSnapshot | null {
    const all = this.snapshots();
    if (all.length === 0) return null;
    return all.reduce((worst, s) => !worst || s.p99Ms > worst.p99Ms ? s : worst, null as PerformanceSnapshot | null);
  }

  totalInvocations(): number {
    let sum = 0;
    for (const v of this._durations.values()) sum += v.length;
    return sum;
  }
}

export class DistributedTraceLinker {
  private _links = new Map<string, string[]>();

  link(traceId: string, functionName: string): void {
    const existing = this._links.get(traceId) ?? [];
    if (!existing.includes(functionName)) existing.push(functionName);
    this._links.set(traceId, existing);
  }

  hops(traceId: string): string[] {
    return [...(this._links.get(traceId) ?? [])];
  }

  hopCount(traceId: string): number {
    return this.hops(traceId).length;
  }

  tracesInvolving(functionName: string): string[] {
    const out: string[] = [];
    for (const [trace, fns] of this._links) {
      if (fns.includes(functionName)) out.push(trace);
    }
    return out;
  }

  totalTraces(): number { return this._links.size; }

  clear(): void { this._links.clear(); }
}

export interface HealthCheck {
  functionName: string;
  healthy: boolean;
  lastChecked: number;
  latencyMs: number;
  message: string;
}

export class HealthChecker {
  private _checks = new Map<string, HealthCheck>();

  check(functionName: string, healthy: boolean, latencyMs: number, message: string = ''): HealthCheck {
    const c: HealthCheck = {
      functionName,
      healthy,
      lastChecked: Date.now(),
      latencyMs,
      message
    };
    this._checks.set(functionName, c);
    return c;
  }

  status(functionName: string): HealthCheck | null {
    return this._checks.get(functionName) ?? null;
  }

  unhealthy(): HealthCheck[] {
    return [...this._checks.values()].filter(c => !c.healthy);
  }

  healthy(): HealthCheck[] {
    return [...this._checks.values()].filter(c => c.healthy);
  }

  averageLatency(): number {
    const arr = [...this._checks.values()];
    if (arr.length === 0) return 0;
    return arr.reduce((sum, c) => sum + c.latencyMs, 0) / arr.length;
  }

  totalChecked(): number { return this._checks.size; }
}

export interface MigrationStep {
  from: string;
  to: string;
  functionName: string;
  status: 'pending' | 'in-progress' | 'done' | 'failed';
  ts: number;
}

export class MigrationTool {
  private _steps: MigrationStep[] = [];

  plan(functionName: string, from: string, to: string): MigrationStep {
    const step: MigrationStep = {
      functionName,
      from,
      to,
      status: 'pending',
      ts: Date.now()
    };
    this._steps.push(step);
    return step;
  }

  execute(functionName: string, from: string, to: string): MigrationStep {
    const step = this.plan(functionName, from, to);
    step.status = 'in-progress';
    return step;
  }

  complete(functionName: string, success: boolean): boolean {
    const inProgress = this._steps.filter(
      s => s.functionName === functionName && s.status === 'in-progress'
    );
    if (inProgress.length === 0) return false;
    inProgress[inProgress.length - 1].status = success ? 'done' : 'failed';
    return true;
  }

  pending(): MigrationStep[] {
    return this._steps.filter(s => s.status === 'pending' || s.status === 'in-progress');
  }

  completed(): MigrationStep[] {
    return this._steps.filter(s => s.status === 'done');
  }

  progress(functionName: string): { done: number; total: number } {
    const all = this._steps.filter(s => s.functionName === functionName);
    const done = all.filter(s => s.status === 'done').length;
    return { done, total: all.length };
  }
}

export class ServerlessIntegrationIndex {
  static summary(
    gateway: APIGateway,
    cost: CostOptimizer,
    monitor: PerformanceMonitor,
    health: HealthChecker
  ): string {
    return [
      `Routes: ${gateway.routes().length}`,
      `Cost: $${cost.totalCost().toFixed(6)}`,
      `Invocations: ${monitor.totalInvocations()}`,
      `Healthy: ${health.healthy().length}/${health.totalChecked()}`
    ].join(' | ');
  }
}

export class DAEdgeBridge {
  static wireRouter(router: RequestRouter, registry: FunctionRegistry): number {
    let wired = 0;
    for (const name of registry.names()) {
      const route: RouteRule = {
        pattern: `/${name}`,
        functionName: name,
        weight: 1
      };
      router.addRule(route);
      wired += 1;
    }
    return wired;
  }

  static healthFromMonitor(monitor: PerformanceMonitor, checker: HealthChecker): HealthCheck[] {
    const results: HealthCheck[] = [];
    for (const snap of monitor.snapshots()) {
      const healthy = snap.errorRate < 0.1 && snap.p99Ms < 5000;
      results.push(checker.check(snap.functionName, healthy, snap.p99Ms, `p99=${snap.p99Ms}`));
    }
    return results;
  }
}

export class ServerlessMasterIndex {
  static allModules(): string[] {
    return [
      'FunctionDeployer', 'ColdStartOptimizer', 'WarmPool', 'RequestRouter',
      'EdgeCache', 'FunctionRegistry', 'EventTrigger', 'InvocationQueue',
      'ConcurrencyLimiter',
      'MemoryManager', 'EnvVarResolver', 'SecretVault', 'LogStreamer',
      'MetricsCollector', 'ProvisionedConcurrency', 'FailureInjector',
      'TimeoutGuard', 'VersionManager',
      'APIGateway', 'EdgeMiddleware', 'CostOptimizer', 'PerformanceMonitor',
      'DistributedTraceLinker', 'HealthChecker', 'MigrationTool'
    ];
  }

  static totalEngines(): number {
    return ServerlessMasterIndex.allModules().length;
  }
}