// Round 9 Direction CJ — Plugin Runtime Sandbox Batch 1/3 (Core)
// V4856-V4865: SandboxCore + PermissionManager + CapabilitySet + CodeLoader + ResourceLimiter
//            + ExecutionContext + ApiGateway + HookRegistry + EventEmitter + SandboxCoreIndex
// 3-files × 10-engines pattern (P-97)

export type Permission = 'read' | 'write' | 'execute' | 'network' | 'filesystem' | 'ui' | 'storage' | 'crypto' | 'camera' | 'microphone';
export type HookEvent = 'before-load' | 'after-load' | 'before-execute' | 'after-execute' | 'before-unload' | 'after-unload' | 'error' | 'permission-request';
export type ResourceLimit = 'memory' | 'cpu' | 'time' | 'network' | 'disk' | 'handles';
export type ExecutionState = 'idle' | 'loading' | 'loaded' | 'running' | 'paused' | 'stopped' | 'error';

// V4856: SandboxCore — central sandbox runtime
export class SandboxCore {
  private _sandboxes: Map<string, { id: string; permissions: Set<Permission>; limits: Map<ResourceLimit, number>; state: ExecutionState; createdAt: number }> = new Map();

  create(id: string, permissions: Permission[] = [], limits: Map<ResourceLimit, number> = new Map()): boolean {
    if (this._sandboxes.has(id)) return false;
    this._sandboxes.set(id, {
      id,
      permissions: new Set(permissions),
      limits,
      state: 'idle',
      createdAt: Date.now()
    });
    return true;
  }

  destroy(id: string): boolean {
    return this._sandboxes.delete(id);
  }

  exists(id: string): boolean {
    return this._sandboxes.has(id);
  }

  setState(id: string, state: ExecutionState): boolean {
    const s = this._sandboxes.get(id);
    if (!s) return false;
    s.state = state;
    return true;
  }

  getState(id: string): ExecutionState | null {
    return this._sandboxes.get(id)?.state || null;
  }

  count(): number { return this._sandboxes.size; }

  activeCount(): number {
    let n = 0;
    for (const s of this._sandboxes.values()) if (s.state === 'running' || s.state === 'loaded') n++;
    return n;
  }

  sandboxPermissions(id: string): Set<Permission> | undefined {
    return this._sandboxes.get(id)?.permissions;
  }
}

// V4857: PermissionManager — request + grant + revoke + check
export class PermissionManager {
  private _grants: Map<string, Set<Permission>> = new Map();
  private _requests: Map<string, { permission: Permission; granted: boolean; ts: number }[]> = new Map();

  grant(sandboxId: string, permission: Permission): void {
    if (!this._grants.has(sandboxId)) this._grants.set(sandboxId, new Set());
    this._grants.get(sandboxId)!.add(permission);
  }

  revoke(sandboxId: string, permission: Permission): void {
    this._grants.get(sandboxId)?.delete(permission);
  }

  check(sandboxId: string, permission: Permission): boolean {
    return this._grants.get(sandboxId)?.has(permission) || false;
  }

  checkMany(sandboxId: string, permissions: Permission[]): { permission: Permission; granted: boolean }[] {
    return permissions.map(p => ({ permission: p, granted: this.check(sandboxId, p) }));
  }

  request(sandboxId: string, permission: Permission, granted: boolean = true): void {
    if (!this._requests.has(sandboxId)) this._requests.set(sandboxId, []);
    this._requests.get(sandboxId)!.push({ permission, granted, ts: Date.now() });
    if (granted) this.grant(sandboxId, permission);
  }

  history(sandboxId: string): { permission: Permission; granted: boolean; ts: number }[] {
    return [...(this._requests.get(sandboxId) || [])];
  }

  grantCount(sandboxId: string): number {
    return this._grants.get(sandboxId)?.size || 0;
  }
}

// V4858: CapabilitySet — bundle of permissions + metadata
export class CapabilitySet {
  private _sets: Map<string, { name: string; permissions: Permission[]; description: string; version: string }> = new Map();

  define(name: string, permissions: Permission[], description: string = '', version: string = '1.0.0'): void {
    this._sets.set(name, { name, permissions: [...permissions], description, version });
  }

  remove(name: string): boolean {
    return this._sets.delete(name);
  }

  get(name: string): { name: string; permissions: Permission[]; description: string; version: string } | undefined {
    return this._sets.get(name);
  }

  has(name: string): boolean {
    return this._sets.has(name);
  }

  size(): number { return this._sets.size; }

  names(): string[] {
    return Array.from(this._sets.keys());
  }

  allPermissions(name: string): Permission[] {
    return this._sets.get(name)?.permissions || [];
  }
}

// V4859: CodeLoader — load code with integrity check + signature
export class CodeLoader {
  private _loaded: Map<string, { hash: string; signature: string; size: number; loadedAt: number }> = new Map();
  private _trustedSigners: Set<string> = new Set();

  addTrustedSigner(signer: string): this { this._trustedSigners.add(signer); return this; }

  // FNV-1a hash (P-39, P-49)
  hash(content: string): string {
    let h = 2166136261;
    for (let i = 0; i < content.length; i++) {
      h ^= content.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  load(id: string, content: string, signature: string = ''): { success: boolean; hash: string; reason?: string } {
    const h = this.hash(content);
    if (signature && !this._trustedSigners.has(signature)) {
      return { success: false, hash: h, reason: 'untrusted_signer' };
    }
    this._loaded.set(id, { hash: h, signature, size: content.length, loadedAt: Date.now() });
    return { success: true, hash: h };
  }

  unload(id: string): boolean {
    return this._loaded.delete(id);
  }

  isLoaded(id: string): boolean {
    return this._loaded.has(id);
  }

  integrity(id: string, content: string): boolean {
    const loaded = this._loaded.get(id);
    if (!loaded) return false;
    return loaded.hash === this.hash(content);
  }

  size(id: string): number {
    return this._loaded.get(id)?.size || 0;
  }

  count(): number { return this._loaded.size; }
}

// V4860: ResourceLimiter — memory + CPU + time + handles
export class ResourceLimiter {
  private _limits: Map<string, Map<ResourceLimit, number>> = new Map();
  private _usage: Map<string, Map<ResourceLimit, number>> = new Map();

  setLimit(sandboxId: string, resource: ResourceLimit, limit: number): this {
    if (!this._limits.has(sandboxId)) this._limits.set(sandboxId, new Map());
    this._limits.get(sandboxId)!.set(resource, Math.max(0, limit));
    return this;
  }

  recordUsage(sandboxId: string, resource: ResourceLimit, amount: number): void {
    if (!this._usage.has(sandboxId)) this._usage.set(sandboxId, new Map());
    const u = this._usage.get(sandboxId)!;
    u.set(resource, (u.get(resource) || 0) + amount);
  }

  getLimit(sandboxId: string, resource: ResourceLimit): number {
    return this._limits.get(sandboxId)?.get(resource) || 0;
  }

  getUsage(sandboxId: string, resource: ResourceLimit): number {
    return this._usage.get(sandboxId)?.get(resource) || 0;
  }

  exceedsLimit(sandboxId: string, resource: ResourceLimit): boolean {
    const limit = this.getLimit(sandboxId, resource);
    const usage = this.getUsage(sandboxId, resource);
    return limit > 0 && usage > limit;
  }

  resetUsage(sandboxId: string): void {
    this._usage.delete(sandboxId);
  }

  utilization(sandboxId: string, resource: ResourceLimit): number {
    const limit = this.getLimit(sandboxId, resource);
    const usage = this.getUsage(sandboxId, resource);
    return limit > 0 ? usage / limit : 0;
  }
}

// V4861: ExecutionContext — runtime state + variables + stack
export class ExecutionContext {
  private _contexts: Map<string, { variables: Map<string, unknown>; stack: string[]; startedAt: number; pausedAt: number | null }> = new Map();

  start(id: string): void {
    this._contexts.set(id, {
      variables: new Map(),
      stack: [],
      startedAt: Date.now(),
      pausedAt: null
    });
  }

  end(id: string): void {
    this._contexts.delete(id);
  }

  setVariable(id: string, key: string, value: unknown): void {
    this._contexts.get(id)?.variables.set(key, value);
  }

  getVariable(id: string, key: string): unknown {
    return this._contexts.get(id)?.variables.get(key);
  }

  pushStack(id: string, frame: string): void {
    this._contexts.get(id)?.stack.push(frame);
  }

  popStack(id: string): string | undefined {
    return this._contexts.get(id)?.stack.pop();
  }

  stackDepth(id: string): number {
    return this._contexts.get(id)?.stack.length || 0;
  }

  pause(id: string): boolean {
    const ctx = this._contexts.get(id);
    if (!ctx) return false;
    ctx.pausedAt = Date.now();
    return true;
  }

  resume(id: string): boolean {
    const ctx = this._contexts.get(id);
    if (!ctx) return false;
    ctx.pausedAt = null;
    return true;
  }

  isPaused(id: string): boolean {
    return this._contexts.get(id)?.pausedAt !== null && this._contexts.get(id)?.pausedAt !== undefined;
  }

  duration(id: string): number {
    const ctx = this._contexts.get(id);
    if (!ctx) return 0;
    const end = ctx.pausedAt || Date.now();
    return end - ctx.startedAt;
  }
}

// V4862: ApiGateway — controlled API access from sandbox
export class ApiGateway {
  private _exposed: Map<string, { name: string; description: string; callable: boolean }> = new Map();
  private _callCounts: Map<string, number> = new Map();
  private _maxCalls: number = 1000;

  expose(name: string, description: string = ''): this {
    this._exposed.set(name, { name, description, callable: true });
    return this;
  }

  revoke(name: string): boolean {
    const api = this._exposed.get(name);
    if (!api) return false;
    api.callable = false;
    return true;
  }

  isExposed(name: string): boolean {
    return this._exposed.get(name)?.callable || false;
  }

  call(name: string): { success: boolean; reason?: string } {
    if (!this.isExposed(name)) return { success: false, reason: 'not_exposed' };
    const count = this._callCounts.get(name) || 0;
    if (count >= this._maxCalls) return { success: false, reason: 'rate_limited' };
    this._callCounts.set(name, count + 1);
    return { success: true };
  }

  callCount(name: string): number {
    return this._callCounts.get(name) || 0;
  }

  setMaxCalls(max: number): this { this._maxCalls = Math.max(1, max); return this; }

  exposedApis(): string[] {
    return Array.from(this._exposed.entries())
      .filter(([, api]) => api.callable)
      .map(([name]) => name);
  }
}

// V4863: HookRegistry — before/after lifecycle hooks
export class HookRegistry {
  private _hooks: Map<HookEvent, ((payload: unknown) => Promise<void> | void)[]> = new Map();
  private _fireCounts: Map<HookEvent, number> = new Map();

  register(event: HookEvent, handler: (payload: unknown) => Promise<void> | void): void {
    if (!this._hooks.has(event)) this._hooks.set(event, []);
    this._hooks.get(event)!.push(handler);
  }

  unregister(event: HookEvent, handler: (payload: unknown) => Promise<void> | void): boolean {
    const list = this._hooks.get(event);
    if (!list) return false;
    const idx = list.indexOf(handler);
    if (idx < 0) return false;
    list.splice(idx, 1);
    return true;
  }

  async fire(event: HookEvent, payload: unknown): Promise<void> {
    this._fireCounts.set(event, (this._fireCounts.get(event) || 0) + 1);
    const handlers = this._hooks.get(event) || [];
    for (const handler of handlers) {
      await handler(payload);
    }
  }

  fireCount(event: HookEvent): number {
    return this._fireCounts.get(event) || 0;
  }

  handlerCount(event: HookEvent): number {
    return this._hooks.get(event)?.length || 0;
  }

  hasHandlers(event: HookEvent): boolean {
    return this.handlerCount(event) > 0;
  }
}

// V4864: EventEmitter — pub/sub for sandbox events
export class EventEmitter {
  private _listeners: Map<string, Set<(payload: unknown) => void>> = new Map();
  private _history: { event: string; payload: unknown; ts: number }[] = [];

  on(event: string, listener: (payload: unknown) => void): () => void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: (payload: unknown) => void): void {
    this._listeners.get(event)?.delete(listener);
  }

  emit(event: string, payload: unknown): number {
    this._history.push({ event, payload, ts: Date.now() });
    const listeners = this._listeners.get(event);
    if (!listeners) return 0;
    listeners.forEach(l => l(payload));
    return listeners.size;
  }

  listenerCount(event: string): number {
    return this._listeners.get(event)?.size || 0;
  }

  removeAllListeners(event?: string): void {
    if (event) this._listeners.delete(event);
    else this._listeners.clear();
  }

  history(limit: number = 100): { event: string; payload: unknown; ts: number }[] {
    return this._history.slice(-limit);
  }

  eventCount(event: string): number {
    return this._history.filter(h => h.event === event).length;
  }
}

// V4865: SandboxCoreIndex — Batch 1/3 index
export const CJ_BATCH_1_ENGINES = [
  'SandboxCore', 'PermissionManager', 'CapabilitySet', 'CodeLoader', 'ResourceLimiter',
  'ExecutionContext', 'ApiGateway', 'HookRegistry', 'EventEmitter', 'SandboxCoreIndex'
] as const;

export class SandboxCoreIndex {
  list(): string[] {
    return [...CJ_BATCH_1_ENGINES];
  }

  count(): number {
    return CJ_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return [...CJ_BATCH_1_ENGINES];
  }

  has(name: string): boolean {
    return CJ_BATCH_1_ENGINES.includes(name as typeof CJ_BATCH_1_ENGINES[number]);
  }
}