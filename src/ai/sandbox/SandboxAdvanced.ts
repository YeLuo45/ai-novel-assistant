// Round 9 Direction CJ — Plugin Runtime Sandbox Batch 2/3 (Advanced)
// V4866-V4875: CodeValidator + ASTAnalyzer + SignatureChecker + DependencyResolver + SandboxCommunicator
//            + IPCChannel + MemoryIsolation + CPUScheduler + NetworkFilter + FilesystemGuard
// 3-files × 10-engines pattern (P-97)

export type ValidationSeverity = 'error' | 'warning' | 'info';
export type IsolationLevel = 'none' | 'process' | 'vm' | 'worker' | 'container';
export type SchedulingPolicy = 'fifo' | 'round-robin' | 'priority' | 'fair';

// V4866: CodeValidator — static analysis + lint rules
export class CodeValidator {
  private _rules: { name: string; pattern: RegExp; severity: ValidationSeverity; message: string }[] = [
    { name: 'no-eval', pattern: /\beval\s*\(/g, severity: 'error', message: 'eval() is forbidden' },
    { name: 'no-document-write', pattern: /document\.write/g, severity: 'warning', message: 'document.write is discouraged' },
    { name: 'no-innerHTML', pattern: /\.innerHTML\s*=/g, severity: 'warning', message: 'innerHTML assignment may cause XSS' },
    { name: 'no-fs-readFileSync', pattern: /fs\.readFileSync/g, severity: 'info', message: 'Consider async fs.readFile' }
  ];

  addRule(name: string, pattern: RegExp, severity: ValidationSeverity, message: string): void {
    this._rules.push({ name, pattern, severity, message });
  }

  validate(code: string): { rule: string; severity: ValidationSeverity; message: string; line: number }[] {
    const issues: { rule: string; severity: ValidationSeverity; message: string; line: number }[] = [];
    for (const rule of this._rules) {
      const matches = code.match(rule.pattern);
      if (matches) {
        matches.forEach(() => {
          const idx = code.indexOf(matches[0]);
          const line = code.substring(0, idx).split('\n').length;
          issues.push({ rule: rule.name, severity: rule.severity, message: rule.message, line });
        });
      }
    }
    return issues;
  }

  hasErrors(issues: { severity: ValidationSeverity }[]): boolean {
    return issues.some(i => i.severity === 'error');
  }

  ruleCount(): number { return this._rules.length; }
}

// V4867: ASTAnalyzer — lightweight abstract syntax tree
export class ASTAnalyzer {
  // Extract function declarations
  functions(code: string): { name: string; line: number }[] {
    const result: { name: string; line: number }[] = [];
    const re = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      const name = m[1] || m[2];
      const line = code.substring(0, m.index).split('\n').length;
      result.push({ name, line });
    }
    return result;
  }

  // Extract imports/requires
  imports(code: string): { source: string; type: 'esm' | 'cjs' }[] {
    const result: { source: string; type: 'esm' | 'cjs' }[] = [];
    const esmRe = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
    const cjsRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let m;
    while ((m = esmRe.exec(code)) !== null) result.push({ source: m[1], type: 'esm' });
    while ((m = cjsRe.exec(code)) !== null) result.push({ source: m[1], type: 'cjs' });
    return result;
  }

  // Count statements (rough)
  statementCount(code: string): number {
    return code.split(/;\s*(?=\w|$)/).filter(s => s.trim().length > 0).length;
  }

  // Cyclomatic complexity (rough estimate)
  cyclomaticComplexity(code: string): number {
    let complexity = 1;
    const patterns = [/\bif\b/g, /\belse if\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g, /\bcatch\b/g, /\b\?\b/g, /&&/g, /\|\|/g];
    patterns.forEach(re => {
      const matches = code.match(re);
      if (matches) complexity += matches.length;
    });
    return complexity;
  }

  // Find variables declared with let/const/var
  variables(code: string): { name: string; kind: 'let' | 'const' | 'var' }[] {
    const result: { name: string; kind: 'let' | 'const' | 'var' }[] = [];
    const re = /(let|const|var)\s+(\w+)/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      result.push({ name: m[2], kind: m[1] as 'let' | 'const' | 'var' });
    }
    return result;
  }
}

// V4868: SignatureChecker — verify code signature against expected
export class SignatureChecker {
  private _signatures: Map<string, string> = new Map();

  register(pluginId: string, signature: string): void {
    this._signatures.set(pluginId, signature);
  }

  // FNV-1a (P-39, P-49)
  private _hash(content: string): string {
    let h = 2166136261;
    for (let i = 0; i < content.length; i++) {
      h ^= content.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  verify(pluginId: string, content: string): { valid: boolean; expected: string; actual: string } {
    const expected = this._signatures.get(pluginId);
    const actual = this._hash(content);
    if (!expected) return { valid: false, expected: '', actual };
    return { valid: expected === actual, expected, actual };
  }

  isRegistered(pluginId: string): boolean {
    return this._signatures.has(pluginId);
  }

  count(): number { return this._signatures.size; }
}

// V4869: DependencyResolver — graph-based dependency resolver
export class DependencyResolver {
  private _deps: Map<string, Set<string>> = new Map();

  addDependency(pluginId: string, dep: string): void {
    if (!this._deps.has(pluginId)) this._deps.set(pluginId, new Set());
    this._deps.get(pluginId)!.add(dep);
  }

  removeDependency(pluginId: string, dep: string): void {
    this._deps.get(pluginId)?.delete(dep);
  }

  dependencies(pluginId: string): string[] {
    return Array.from(this._deps.get(pluginId) || []);
  }

  hasCircularDependency(pluginId: string): boolean {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const dfs = (id: string): boolean => {
      if (stack.has(id)) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      stack.add(id);
      const deps = this._deps.get(id) || new Set();
      for (const d of deps) {
        if (dfs(d)) return true;
      }
      stack.delete(id);
      return false;
    };
    return dfs(pluginId);
  }

  topologicalOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];
    const dfs = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const deps = this._deps.get(id) || new Set();
      deps.forEach(d => dfs(d));
      order.push(id);
    };
    Array.from(this._deps.keys()).forEach(id => dfs(id));
    return order;
  }

  pluginCount(): number { return this._deps.size; }
}

// V4870: SandboxCommunicator — inter-sandbox message passing
export class SandboxCommunicator {
  private _channels: Map<string, Set<string>> = new Map();
  private _messages: { from: string; to: string; payload: unknown; ts: number }[] = [];

  createChannel(from: string, to: string): void {
    if (!this._channels.has(from)) this._channels.set(from, new Set());
    this._channels.get(from)!.add(to);
  }

  closeChannel(from: string, to: string): void {
    this._channels.get(from)?.delete(to);
  }

  send(from: string, to: string, payload: unknown): { success: boolean; reason?: string } {
    if (!this._channels.get(from)?.has(to)) return { success: false, reason: 'no_channel' };
    this._messages.push({ from, to, payload, ts: Date.now() });
    return { success: true };
  }

  canCommunicate(from: string, to: string): boolean {
    return this._channels.get(from)?.has(to) || false;
  }

  channels(from: string): string[] {
    return Array.from(this._channels.get(from) || []);
  }

  messageCount(): number { return this._messages.length; }
}

// V4871: IPCChannel — typed inter-process communication
export class IPCChannel {
  private _channels: Map<string, { name: string; type: 'request-response' | 'fire-forget' | 'pub-sub'; handlers: number }> = new Map();
  private _pendingRequests: Map<string, { payload: unknown; ts: number; resolve: (v: unknown) => void }> = new Map();

  define(name: string, type: 'request-response' | 'fire-forget' | 'pub-sub'): void {
    this._channels.set(name, { name, type, handlers: 0 });
  }

  hasChannel(name: string): boolean {
    return this._channels.has(name);
  }

  isRequestResponse(name: string): boolean {
    return this._channels.get(name)?.type === 'request-response';
  }

  sendRequest(channel: string, payload: unknown, resolve: (v: unknown) => void): string {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this._pendingRequests.set(id, { payload, ts: Date.now(), resolve });
    return id;
  }

  resolveRequest(requestId: string, value: unknown): boolean {
    const req = this._pendingRequests.get(requestId);
    if (!req) return false;
    req.resolve(value);
    this._pendingRequests.delete(requestId);
    return true;
  }

  pendingCount(): number { return this._pendingRequests.size; }
}

// V4872: MemoryIsolation — separate heap allocation per sandbox
export class MemoryIsolation {
  private _heaps: Map<string, { used: number; peak: number }> = new Map();
  private _gc: { lastRun: number; collected: number } = { lastRun: 0, collected: 0 };
  private _level: IsolationLevel = 'vm';

  setLevel(level: IsolationLevel): this { this._level = level; return this; }
  level(): IsolationLevel { return this._level; }

  allocate(sandboxId: string, size: number): boolean {
    if (!this._heaps.has(sandboxId)) this._heaps.set(sandboxId, { used: 0, peak: 0 });
    const heap = this._heaps.get(sandboxId)!;
    heap.used += size;
    if (heap.used > heap.peak) heap.peak = heap.used;
    return true;
  }

  deallocate(sandboxId: string, size: number): void {
    const heap = this._heaps.get(sandboxId);
    if (heap) heap.used = Math.max(0, heap.used - size);
  }

  used(sandboxId: string): number {
    return this._heaps.get(sandboxId)?.used || 0;
  }

  peak(sandboxId: string): number {
    return this._heaps.get(sandboxId)?.peak || 0;
  }

  runGC(sandboxId: string): number {
    const heap = this._heaps.get(sandboxId);
    if (!heap) return 0;
    const collected = Math.floor(heap.used * 0.3);
    heap.used -= collected;
    this._gc = { lastRun: Date.now(), collected };
    return collected;
  }

  gcStats(): { lastRun: number; collected: number } {
    return { ...this._gc };
  }
}

// V4873: CPUScheduler — round-robin + priority scheduling
export class CPUScheduler {
  private _tasks: Map<string, { priority: number; estimatedMs: number; startedAt: number | null }> = new Map();
  private _policy: SchedulingPolicy = 'priority';
  private _currentSlice: number = 0;
  private _sliceMs: number = 10;

  setPolicy(p: SchedulingPolicy): this { this._policy = p; return this; }
  setSlice(ms: number): this { this._sliceMs = Math.max(1, ms); return this; }

  add(taskId: string, priority: number, estimatedMs: number): void {
    this._tasks.set(taskId, { priority, estimatedMs, startedAt: null });
  }

  remove(taskId: string): boolean {
    return this._tasks.delete(taskId);
  }

  next(): string | null {
    if (this._tasks.size === 0) return null;
    const taskIds = Array.from(this._tasks.keys());
    let bestTask: string | null = null;
    let bestScore = -Infinity;
    for (const id of taskIds) {
      const t = this._tasks.get(id)!;
      let score = 0;
      if (this._policy === 'priority') score = t.priority;
      else if (this._policy === 'round-robin') {
        const idx = taskIds.indexOf(id);
        score = ((idx + this._currentSlice) % taskIds.length) * 1000 + idx;
      }
      else if (this._policy === 'fifo') score = Date.now() - (t.startedAt || Date.now());
      else if (this._policy === 'fair') score = -t.estimatedMs;
      if (score > bestScore) { bestScore = score; bestTask = id; }
    }
    this._currentSlice++;
    return bestTask;
  }

  start(taskId: string): void {
    const t = this._tasks.get(taskId);
    if (t) t.startedAt = Date.now();
  }

  policy(): SchedulingPolicy { return this._policy; }
  slice(): number { return this._sliceMs; }
  taskCount(): number { return this._tasks.size; }
}

// V4874: NetworkFilter — block/allow list for network access
export class NetworkFilter {
  private _allowList: Set<string> = new Set();
  private _blockList: Set<string> = new Set();
  private _requests: { host: string; allowed: boolean; ts: number }[] = [];

  allow(host: string): void { this._allowList.add(host); }
  block(host: string): void { this._blockList.add(host); }

  isAllowed(host: string): boolean {
    for (const blocked of this._blockList) {
      if (host === blocked || host.endsWith('.' + blocked)) return false;
    }
    if (this._allowList.size > 0) {
      for (const allowed of this._allowList) {
        if (host === allowed || host.endsWith('.' + allowed)) return true;
      }
      return false;
    }
    return true; // open by default
  }

  request(host: string): boolean {
    const allowed = this.isAllowed(host);
    this._requests.push({ host, allowed, ts: Date.now() });
    return allowed;
  }

  blockedCount(): number {
    return this._requests.filter(r => !r.allowed).length;
  }

  allowedCount(): number {
    return this._requests.filter(r => r.allowed).length;
  }

  requestCount(): number { return this._requests.length; }
  allowListSize(): number { return this._allowList.size; }
  blockListSize(): number { return this._blockList.size; }
}

// V4875: FilesystemGuard — restrict path access
export class FilesystemGuard {
  private _allowedPaths: Set<string> = new Set();
  private _blockedPaths: Set<string> = new Set();
  private _operations: { path: string; allowed: boolean; op: 'read' | 'write' | 'delete'; ts: number }[] = [];

  allow(path: string): void { this._allowedPaths.add(path); }
  block(path: string): void { this._blockedPaths.add(path); }

  isPathAllowed(path: string): boolean {
    for (const blocked of this._blockedPaths) {
      if (path.includes(blocked) || path.startsWith(blocked)) return false;
    }
    if (this._allowedPaths.size === 0) return true;
    return Array.from(this._allowedPaths).some(allowed => path.startsWith(allowed) || path.includes(allowed));
  }

  read(path: string): boolean { return this._checkAndRecord(path, 'read'); }
  write(path: string): boolean { return this._checkAndRecord(path, 'write'); }
  delete(path: string): boolean { return this._checkAndRecord(path, 'delete'); }

  private _checkAndRecord(path: string, op: 'read' | 'write' | 'delete'): boolean {
    const allowed = this.isPathAllowed(path);
    this._operations.push({ path, allowed, op, ts: Date.now() });
    return allowed;
  }

  blockedOps(): { path: string; op: 'read' | 'write' | 'delete'; ts: number }[] {
    return this._operations.filter(o => !o.allowed).map(o => ({ path: o.path, op: o.op, ts: o.ts }));
  }

  opCount(): number { return this._operations.length; }
}

// V4866-V4875: CJ Batch 2/3 Index
export const CJ_BATCH_2_ENGINES = [
  'CodeValidator', 'ASTAnalyzer', 'SignatureChecker', 'DependencyResolver', 'SandboxCommunicator',
  'IPCChannel', 'MemoryIsolation', 'CPUScheduler', 'NetworkFilter', 'FilesystemGuard'
] as const;

export class SandboxAdvancedIndex {
  list(): string[] {
    return [...CJ_BATCH_2_ENGINES];
  }

  count(): number {
    return CJ_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return [...CJ_BATCH_2_ENGINES];
  }

  has(name: string): boolean {
    return CJ_BATCH_2_ENGINES.includes(name as typeof CJ_BATCH_2_ENGINES[number]);
  }
}