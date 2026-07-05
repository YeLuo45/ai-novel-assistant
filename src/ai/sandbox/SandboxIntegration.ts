// Round 9 Direction CJ — Plugin Runtime Sandbox Batch 3/3 (Integration)
// V4876-V4885: PluginLifecycle + VersionCompatibility + AuditLog + PolicyEnforcer + SandboxPool
//            + CrashRecovery + SandboxedPluginRunner + SandboxMetrics + SandboxMasterIndex
// 3-files × 10-engines pattern (P-97)

import { SandboxCore } from './SandboxCore';
import { PermissionManager, CapabilitySet, CodeLoader, ResourceLimiter, ExecutionContext, ApiGateway } from './SandboxCore';
import { MemoryIsolation, CPUScheduler, NetworkFilter, FilesystemGuard } from './SandboxAdvanced';

export type LifecycleState = 'registered' | 'loaded' | 'activated' | 'deactivated' | 'uninstalled' | 'crashed';
export type CrashSeverity = 'minor' | 'major' | 'critical';
export type PolicyAction = 'allow' | 'deny' | 'log' | 'throttle' | 'sandbox';

// V4876: PluginLifecycle — full lifecycle state machine
export class PluginLifecycle {
  private _plugins: Map<string, { id: string; version: string; state: LifecycleState; loadedAt: number | null; activatedAt: number | null }> = new Map();
  private _transitions: { pluginId: string; from: LifecycleState; to: LifecycleState; ts: number }[] = [];

  register(id: string, version: string): boolean {
    if (this._plugins.has(id)) return false;
    this._plugins.set(id, { id, version, state: 'registered', loadedAt: null, activatedAt: null });
    return true;
  }

  load(id: string): boolean { return this._transition(id, 'registered', 'loaded'); }
  activate(id: string): boolean { return this._transition(id, 'loaded', 'activated'); }
  deactivate(id: string): boolean { return this._transition(id, 'activated', 'deactivated'); }
  uninstall(id: string): boolean { return this._transition(id, 'deactivated', 'uninstalled'); }

  crash(id: string): boolean { return this._transition(id, 'activated', 'crashed'); }

  recover(id: string): boolean { return this._transition(id, 'crashed', 'activated'); }

  private _transition(id: string, from: LifecycleState, to: LifecycleState): boolean {
    const p = this._plugins.get(id);
    if (!p || p.state !== from) return false;
    const now = Date.now();
    if (to === 'loaded') p.loadedAt = now;
    if (to === 'activated') p.activatedAt = now;
    p.state = to;
    this._transitions.push({ pluginId: id, from, to, ts: now });
    return true;
  }

  getState(id: string): LifecycleState | null {
    return this._plugins.get(id)?.state || null;
  }

  isActive(id: string): boolean {
    return this._plugins.get(id)?.state === 'activated';
  }

  versions(id: string): string | undefined {
    return this._plugins.get(id)?.version;
  }

  count(): number { return this._plugins.size; }

  transitionHistory(id: string): { from: LifecycleState; to: LifecycleState; ts: number }[] {
    return this._transitions.filter(t => t.pluginId === id).map(t => ({ from: t.from, to: t.to, ts: t.ts }));
  }
}

// V4877: VersionCompatibility — semver + version constraints
export class VersionCompatibility {
  private _compatible: Map<string, { pluginId: string; minVersion: string; maxVersion: string }> = new Map();

  setCompatible(pluginId: string, minVersion: string, maxVersion: string = '999.0.0'): void {
    this._compatible.set(pluginId, { pluginId, minVersion, maxVersion });
  }

  isCompatible(pluginId: string, version: string): boolean {
    const c = this._compatible.get(pluginId);
    if (!c) return false;
    return this._compare(version, c.minVersion) >= 0 && this._compare(version, c.maxVersion) <= 0;
  }

  constraints(pluginId: string): { minVersion: string; maxVersion: string } | undefined {
    const c = this._compatible.get(pluginId);
    if (!c) return undefined;
    return { minVersion: c.minVersion, maxVersion: c.maxVersion };
  }

  private _compare(a: string, b: string): number {
    const ap = a.split('.').map(Number);
    const bp = b.split('.').map(Number);
    for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
      const av = ap[i] || 0;
      const bv = bp[i] || 0;
      if (av > bv) return 1;
      if (av < bv) return -1;
    }
    return 0;
  }

  satisfies(version: string, constraint: string): boolean {
    if (constraint.startsWith('^')) {
      const base = constraint.slice(1);
      // ^x.y.z means >= x.y.z and < (x+1).0.0
      const baseMajor = base.split('.')[0];
      const versionMajor = version.split('.')[0];
      if (baseMajor !== versionMajor) return false;
      return this._compare(version, base) >= 0;
    }
    if (constraint.startsWith('~')) {
      const base = constraint.slice(1);
      return this._compare(version, base) >= 0 && this._sameMinor(version, base);
    }
    if (constraint.startsWith('>=')) return this._compare(version, constraint.slice(2)) >= 0;
    if (constraint.startsWith('<=')) return this._compare(version, constraint.slice(2)) <= 0;
    if (constraint.startsWith('>')) return this._compare(version, constraint.slice(1)) > 0;
    if (constraint.startsWith('<')) return this._compare(version, constraint.slice(1)) < 0;
    return version === constraint;
  }

  private _sameMinor(a: string, b: string): boolean {
    const ap = a.split('.');
    const bp = b.split('.');
    return ap[0] === bp[0] && ap[1] === bp[1];
  }

  count(): number { return this._compatible.size; }
}

// V4878: AuditLog — track all sandbox events
export class AuditLog {
  private _entries: { ts: number; action: string; target: string; details: Record<string, unknown>; severity: 'info' | 'warn' | 'error' }[] = [];
  private _maxEntries: number = 10000;

  setMaxEntries(max: number): this {
    this._maxEntries = Math.max(100, max);
    if (this._entries.length > this._maxEntries) {
      this._entries = this._entries.slice(-this._maxEntries);
    }
    return this;
  }

  log(action: string, target: string, details: Record<string, unknown> = {}, severity: 'info' | 'warn' | 'error' = 'info'): void {
    this._entries.push({ ts: Date.now(), action, target, details, severity });
    if (this._entries.length > this._maxEntries) {
      this._entries = this._entries.slice(-this._maxEntries);
    }
  }

  query(filter: { action?: string; target?: string; severity?: 'info' | 'warn' | 'error' } = {}): { ts: number; action: string; target: string; details: Record<string, unknown>; severity: 'info' | 'warn' | 'error' }[] {
    return this._entries.filter(e => {
      if (filter.action && e.action !== filter.action) return false;
      if (filter.target && e.target !== filter.target) return false;
      if (filter.severity && e.severity !== filter.severity) return false;
      return true;
    });
  }

  errors(): { ts: number; action: string; target: string; details: Record<string, unknown> }[] {
    return this._entries.filter(e => e.severity === 'error').map(e => ({ ts: e.ts, action: e.action, target: e.target, details: e.details }));
  }

  count(): number { return this._entries.length; }
  errorCount(): number { return this._entries.filter(e => e.severity === 'error').length; }
}

// V4879: PolicyEnforcer — security policies + actions
export class PolicyEnforcer {
  private _policies: { name: string; condition: (ctx: Record<string, unknown>) => boolean; action: PolicyAction; reason: string }[] = [];

  addPolicy(name: string, condition: (ctx: Record<string, unknown>) => boolean, action: PolicyAction, reason: string): void {
    this._policies.push({ name, condition, action, reason });
  }

  enforce(ctx: Record<string, unknown>): { allowed: boolean; action: PolicyAction; reason: string } {
    for (const p of this._policies) {
      if (p.condition(ctx)) {
        if (p.action === 'deny') return { allowed: false, action: p.action, reason: p.reason };
        if (p.action === 'allow') return { allowed: true, action: p.action, reason: p.reason };
        // log/throttle/sandbox: continue evaluating but record
      }
    }
    return { allowed: true, action: 'allow', reason: 'default_allow' };
  }

  policyCount(): number { return this._policies.length; }

  matchedPolicies(ctx: Record<string, unknown>): { name: string; action: PolicyAction; reason: string }[] {
    return this._policies
      .filter(p => p.condition(ctx))
      .map(p => ({ name: p.name, action: p.action, reason: p.reason }));
  }
}

// V4880: SandboxPool — pool of sandbox instances for reuse
export class SandboxPool {
  private _pool: string[] = [];
  private _maxSize: number = 10;
  private _borrowed: Set<string> = new Set();

  setMax(n: number): this { this._maxSize = Math.max(1, Math.min(100, n)); return this; }

  add(id: string): boolean {
    if (this._pool.length >= this._maxSize) return false;
    if (this._pool.includes(id)) return false;
    this._pool.push(id);
    return true;
  }

  remove(id: string): boolean {
    const idx = this._pool.indexOf(id);
    if (idx < 0) return false;
    this._pool.splice(idx, 1);
    this._borrowed.delete(id);
    return true;
  }

  borrow(): string | null {
    const available = this._pool.filter(id => !this._borrowed.has(id));
    if (available.length === 0) return null;
    const id = available[0];
    this._borrowed.add(id);
    return id;
  }

  release(id: string): boolean {
    if (!this._borrowed.has(id)) return false;
    this._borrowed.delete(id);
    return true;
  }

  available(): string[] {
    return this._pool.filter(id => !this._borrowed.has(id));
  }

  borrowed(): string[] {
    return Array.from(this._borrowed);
  }

  size(): number { return this._pool.length; }
}

// V4881: CrashRecovery — handle crashes + restart + retry
export class CrashRecovery {
  private _crashes: Map<string, { severity: CrashSeverity; error: string; ts: number; recovered: boolean }[]> = new Map();
  private _maxRetries: number = 3;
  private _retryCounts: Map<string, number> = new Map();

  setMaxRetries(n: number): this { this._maxRetries = Math.max(0, Math.min(10, n)); return this; }

  recordCrash(pluginId: string, error: string, severity: CrashSeverity = 'minor'): void {
    if (!this._crashes.has(pluginId)) this._crashes.set(pluginId, []);
    this._crashes.get(pluginId)!.push({ severity, error, ts: Date.now(), recovered: false });
    this._retryCounts.set(pluginId, (this._retryCounts.get(pluginId) || 0) + 1);
  }

  canRecover(pluginId: string): boolean {
    return (this._retryCounts.get(pluginId) || 0) < this._maxRetries;
  }

  recover(pluginId: string): boolean {
    if (!this.canRecover(pluginId)) return false;
    const crashes = this._crashes.get(pluginId);
    if (crashes && crashes.length > 0) crashes[crashes.length - 1].recovered = true;
    this._retryCounts.set(pluginId, 0);
    return true;
  }

  crashCount(pluginId: string): number {
    return this._crashes.get(pluginId)?.length || 0;
  }

  history(pluginId: string): { severity: CrashSeverity; error: string; ts: number; recovered: boolean }[] {
    return [...(this._crashes.get(pluginId) || [])];
  }

  retryCount(pluginId: string): number {
    return this._retryCounts.get(pluginId) || 0;
  }

  isCriticalCrash(pluginId: string): boolean {
    return this._crashes.get(pluginId)?.some(c => c.severity === 'critical') || false;
  }
}

// V4882: SandboxedPluginRunner — high-level plugin execution orchestrator
export class SandboxedPluginRunner {
  private _core: SandboxCore = new SandboxCore();
  private _lifecycle: PluginLifecycle = new PluginLifecycle();
  private _permissions: PermissionManager = new PermissionManager();
  private _loader: CodeLoader = new CodeLoader();
  private _ctx: ExecutionContext = new ExecutionContext();
  private _audit: AuditLog = new AuditLog();
  private _recovery: CrashRecovery = new CrashRecovery();

  core(): SandboxCore { return this._core; }
  lifecycle(): PluginLifecycle { return this._lifecycle; }
  permissions(): PermissionManager { return this._permissions; }
  loader(): CodeLoader { return this._loader; }
  ctx(): ExecutionContext { return this._ctx; }
  audit(): AuditLog { return this._audit; }
  recovery(): CrashRecovery { return this._recovery; }

  install(pluginId: string, version: string, code: string, permissions: import('./SandboxCore').Permission[] = []): boolean {
    if (!this._lifecycle.register(pluginId, version)) return false;
    this._core.create(pluginId, permissions);
    const loadResult = this._loader.load(pluginId, code);
    if (!loadResult.success) {
      this._audit.log('load', pluginId, { reason: loadResult.reason }, 'error');
      return false;
    }
    permissions.forEach(p => this._permissions.grant(pluginId, p));
    this._lifecycle.load(pluginId);
    this._audit.log('install', pluginId, { version }, 'info');
    return true;
  }

  execute(pluginId: string): { success: boolean; reason?: string } {
    if (!this._lifecycle.load(pluginId) && this._lifecycle.getState(pluginId) !== 'loaded') {
      // Try to load from installed
      if (this._lifecycle.getState(pluginId) !== 'registered') {
        return { success: false, reason: 'not_installed' };
      }
      this._lifecycle.load(pluginId);
    }
    try {
      this._core.setState(pluginId, 'running');
      this._lifecycle.activate(pluginId);
      this._ctx.start(pluginId);
      this._audit.log('execute', pluginId, {}, 'info');
      return { success: true };
    } catch (e) {
      this._recovery.recordCrash(pluginId, String(e), 'major');
      this._lifecycle.crash(pluginId);
      this._audit.log('execute', pluginId, { error: String(e) }, 'error');
      return { success: false, reason: String(e) };
    }
  }

  stop(pluginId: string): void {
    this._core.setState(pluginId, 'stopped');
    this._ctx.end(pluginId);
    this._lifecycle.deactivate(pluginId);
    this._audit.log('stop', pluginId, {}, 'info');
  }

  uninstall(pluginId: string): boolean {
    this.stop(pluginId);
    this._core.destroy(pluginId);
    this._lifecycle.uninstall(pluginId);
    this._loader.unload(pluginId);
    this._audit.log('uninstall', pluginId, {}, 'info');
    return true;
  }
}

// V4883: SandboxMetrics — collect sandbox runtime metrics
export class SandboxMetrics {
  private _metrics: Map<string, { executions: number; errors: number; memoryPeak: number; cpuTime: number; networkCalls: number; lastActivity: number }> = new Map();

  recordExecution(sandboxId: string, durationMs: number): void {
    if (!this._metrics.has(sandboxId)) {
      this._metrics.set(sandboxId, { executions: 0, errors: 0, memoryPeak: 0, cpuTime: 0, networkCalls: 0, lastActivity: 0 });
    }
    const m = this._metrics.get(sandboxId)!;
    m.executions++;
    m.cpuTime += durationMs;
    m.lastActivity = Date.now();
  }

  recordError(sandboxId: string): void {
    if (!this._metrics.has(sandboxId)) {
      this._metrics.set(sandboxId, { executions: 0, errors: 0, memoryPeak: 0, cpuTime: 0, networkCalls: 0, lastActivity: 0 });
    }
    this._metrics.get(sandboxId)!.errors++;
  }

  recordMemory(sandboxId: string, peakBytes: number): void {
    if (!this._metrics.has(sandboxId)) {
      this._metrics.set(sandboxId, { executions: 0, errors: 0, memoryPeak: 0, cpuTime: 0, networkCalls: 0, lastActivity: 0 });
    }
    const m = this._metrics.get(sandboxId)!;
    if (peakBytes > m.memoryPeak) m.memoryPeak = peakBytes;
  }

  recordNetworkCall(sandboxId: string): void {
    if (!this._metrics.has(sandboxId)) {
      this._metrics.set(sandboxId, { executions: 0, errors: 0, memoryPeak: 0, cpuTime: 0, networkCalls: 0, lastActivity: 0 });
    }
    this._metrics.get(sandboxId)!.networkCalls++;
  }

  get(sandboxId: string): { executions: number; errors: number; memoryPeak: number; cpuTime: number; networkCalls: number; lastActivity: number } | undefined {
    return this._metrics.get(sandboxId);
  }

  errorRate(sandboxId: string): number {
    const m = this._metrics.get(sandboxId);
    if (!m || m.executions === 0) return 0;
    return m.errors / m.executions;
  }

  trackedSandboxes(): string[] {
    return Array.from(this._metrics.keys());
  }
}

// V4884: SandboxIntegrationIndex — Batch 3/3 index
export const CJ_BATCH_3_ENGINES = [
  'PluginLifecycle', 'VersionCompatibility', 'AuditLog', 'PolicyEnforcer', 'SandboxPool',
  'CrashRecovery', 'SandboxedPluginRunner', 'SandboxMetrics', 'AuditTrail'
] as const;

export class SandboxIntegrationIndex {
  list(): string[] {
    return [...CJ_BATCH_3_ENGINES, 'SandboxIntegrationIndex'];
  }

  count(): number {
    return CJ_BATCH_3_ENGINES.length + 1;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CJ_BATCH_3_ENGINES.includes(name as typeof CJ_BATCH_3_ENGINES[number]) || name === 'SandboxIntegrationIndex';
  }
}

// V4856-V4884: CJ Master Index (all 30 engines)
import { CJ_BATCH_1_ENGINES as CJ_BATCH_1_ENGINES_FROM_IMPORT } from './SandboxCore';
import { CJ_BATCH_2_ENGINES as CJ_BATCH_2_ENGINES_FROM_IMPORT } from './SandboxAdvanced';

export const CJ_ALL_ENGINES = [
  ...CJ_BATCH_1_ENGINES_FROM_IMPORT,
  ...CJ_BATCH_2_ENGINES_FROM_IMPORT,
  ...CJ_BATCH_3_ENGINES,
  'SandboxIntegrationIndex'
] as const;

export class SandboxMasterIndex {
  list(): string[] {
    return [...CJ_ALL_ENGINES];
  }

  count(): number {
    return CJ_ALL_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return (CJ_ALL_ENGINES as readonly string[]).includes(name);
  }
}