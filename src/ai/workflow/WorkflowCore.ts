// V4916-V4925: CL Workflow Core Batch 1/3
// Workflow engine + step executor + registry + guards + error handling + retry + compensation + saga + timeout

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'compensated';

export interface StepResult {
  status: StepStatus;
  output?: unknown;
  error?: string;
}

export interface Step {
  id: string;
  execute: (input: unknown) => Promise<StepResult> | StepResult;
  compensate?: (input: unknown) => Promise<void> | void;
}

export class WorkflowEngine {
  private _steps: Map<string, Step> = new Map();
  private _order: string[] = [];
  private _state: Map<string, StepStatus> = new Map();

  addStep(step: Step): this {
    this._steps.set(step.id, step);
    if (!this._order.includes(step.id)) this._order.push(step.id);
    this._state.set(step.id, 'pending');
    return this;
  }

  getStep(id: string): Step | null {
    return this._steps.get(id) ?? null;
  }

  stepStatus(id: string): StepStatus {
    return this._state.get(id) ?? 'pending';
  }

  setStatus(id: string, status: StepStatus): boolean {
    if (!this._state.has(id)) return false;
    this._state.set(id, status);
    return true;
  }

  stepCount(): number {
    return this._steps.size;
  }

  order(): string[] {
    return [...this._order];
  }

  reset(): void {
    for (const id of this._state.keys()) this._state.set(id, 'pending');
  }
}

export class StepExecutor {
  async run(step: Step, input: unknown): Promise<StepResult> {
    try {
      const result = await step.execute(input);
      return result;
    } catch (e) {
      return { status: 'failed', error: e instanceof Error ? e.message : String(e) };
    }
  }

  async runAll(engine: WorkflowEngine, input: unknown): Promise<StepResult[]> {
    const results: StepResult[] = [];
    for (const id of engine.order()) {
      const step = engine.getStep(id);
      if (!step) continue;
      engine.setStatus(id, 'running');
      const r = await this.run(step, input);
      engine.setStatus(id, r.status);
      results.push(r);
    }
    return results;
  }
}

export class StepRegistry {
  private _factories: Map<string, () => Step> = new Map();

  register(type: string, factory: () => Step): this {
    this._factories.set(type, factory);
    return this;
  }

  create(type: string, id: string): Step | null {
    const factory = this._factories.get(type);
    if (!factory) return null;
    const step = factory();
    return { ...step, id };
  }

  has(type: string): boolean {
    return this._factories.has(type);
  }

  types(): string[] {
    return [...this._factories.keys()];
  }

  count(): number {
    return this._factories.size;
  }
}

export class TransitionGuard {
  private _guards: Map<string, (input: unknown) => boolean> = new Map();

  addGuard(fromId: string, predicate: (input: unknown) => boolean): this {
    this._guards.set(fromId, predicate);
    return this;
  }

  canTransition(fromId: string, input: unknown): boolean {
    const guard = this._guards.get(fromId);
    return guard ? guard(input) : true;
  }

  guards(): string[] {
    return [...this._guards.keys()];
  }

  clear(): void {
    this._guards.clear();
  }
}

export class ErrorHandler {
  private _handlers: Map<string, (e: Error) => void> = new Map();
  private _default?: (e: Error) => void;

  on(errorType: string, handler: (e: Error) => void): this {
    this._handlers.set(errorType, handler);
    return this;
  }

  setDefault(handler: (e: Error) => void): this {
    this._default = handler;
    return this;
  }

  handle(error: Error): void {
    const handler = this._handlers.get(error.constructor.name);
    if (handler) handler(error);
    else if (this._default) this._default(error);
  }

  handledCount(): number {
    return this._handlers.size;
  }
}

export class RetryPolicy {
  private _maxAttempts: number;
  private _backoffMs: number;

  constructor(maxAttempts = 3, backoffMs = 100) {
    this._maxAttempts = maxAttempts;
    this._backoffMs = backoffMs;
  }

  shouldRetry(attempt: number): boolean {
    return attempt < this._maxAttempts;
  }

  backoff(attempt: number): number {
    return this._backoffMs * Math.pow(2, attempt);
  }

  maxAttempts(): number {
    return this._maxAttempts;
  }

  setMaxAttempts(n: number): void {
    this._maxAttempts = n;
  }

  async retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < this._maxAttempts; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        if (!this.shouldRetry(i + 1)) break;
        await new Promise(r => setTimeout(r, this.backoff(i)));
      }
    }
    throw lastErr;
  }
}

export class CompensationEngine {
  private _compensations: Array<(input: unknown) => Promise<void> | void> = [];

  add(compensation: (input: unknown) => Promise<void> | void): this {
    this._compensations.push(compensation);
    return this;
  }

  async compensate(input: unknown): Promise<void> {
    // Run in reverse order
    for (let i = this._compensations.length - 1; i >= 0; i--) {
      await this._compensations[i](input);
    }
  }

  count(): number {
    return this._compensations.length;
  }

  clear(): void {
    this._compensations = [];
  }
}

export class SagaCoordinator {
  private _steps: Array<{ id: string; forward: () => Promise<void>; backward: () => Promise<void> }> = [];
  private _completed: Set<string> = new Set();

  addStep(id: string, forward: () => Promise<void>, backward: () => Promise<void>): this {
    this._steps.push({ id, forward, backward });
    return this;
  }

  async run(): Promise<boolean> {
    for (const step of this._steps) {
      try {
        await step.forward();
        this._completed.add(step.id);
      } catch {
        await this.compensate();
        return false;
      }
    }
    return true;
  }

  async compensate(): Promise<void> {
    for (let i = this._steps.length - 1; i >= 0; i--) {
      if (this._completed.has(this._steps[i].id)) {
        try { await this._steps[i].backward(); } catch { /* swallow */ }
        this._completed.delete(this._steps[i].id);
      }
    }
  }

  completed(): string[] {
    return [...this._completed];
  }
}

export class TimeoutEnforcer {
  private _deadlines: Map<string, number> = new Map();

  setDeadline(id: string, deadlineMs: number): this {
    this._deadlines.set(id, Date.now() + deadlineMs);
    return this;
  }

  isExpired(id: string): boolean {
    const d = this._deadlines.get(id);
    return d === undefined ? false : Date.now() > d;
  }

  remainingMs(id: string): number {
    const d = this._deadlines.get(id);
    return d === undefined ? 0 : Math.max(0, d - Date.now());
  }

  clear(id: string): boolean {
    return this._deadlines.delete(id);
  }

  trackedCount(): number {
    return this._deadlines.size;
  }

  async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]);
  }
}

// V4925: WorkflowCoreIndex
export const CL_BATCH_1_ENGINES = [
  'WorkflowEngine', 'StepExecutor', 'StepRegistry', 'TransitionGuard', 'ErrorHandler',
  'RetryPolicy', 'CompensationEngine', 'SagaCoordinator', 'TimeoutEnforcer', 'WorkflowCoreIndex'
] as const;

export class WorkflowCoreIndex {
  list(): string[] {
    return [...CL_BATCH_1_ENGINES];
  }

  count(): number {
    return CL_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CL_BATCH_1_ENGINES.includes(name as typeof CL_BATCH_1_ENGINES[number]);
  }
}