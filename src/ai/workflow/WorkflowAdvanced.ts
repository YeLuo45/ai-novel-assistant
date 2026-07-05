// V4926-V4935: CL Workflow Advanced Batch 2/3
// Branch / parallel / join / conditional / loop / sub-workflow / wait / signal / state machine

export class BranchStep {
  private _branches: Map<string, (input: unknown) => unknown> = new Map();
  private _default?: (input: unknown) => unknown;

  addBranch(name: string, handler: (input: unknown) => unknown): this {
    this._branches.set(name, handler);
    return this;
  }

  setDefault(handler: (input: unknown) => unknown): this {
    this._default = handler;
    return this;
  }

  execute(name: string, input: unknown): unknown {
    const handler = this._branches.get(name);
    if (handler) return handler(input);
    if (this._default) return this._default(input);
    return null;
  }

  branchCount(): number {
    return this._branches.size;
  }

  hasBranch(name: string): boolean {
    return this._branches.has(name);
  }
}

export class ParallelStep {
  private _tasks: Array<(input: unknown) => Promise<unknown>> = [];

  add(task: (input: unknown) => Promise<unknown>): this {
    this._tasks.push(task);
    return this;
  }

  async run(input: unknown): Promise<unknown[]> {
    return Promise.all(this._tasks.map(t => t(input)));
  }

  taskCount(): number {
    return this._tasks.length;
  }

  reset(): void {
    this._tasks = [];
  }
}

export class JoinStep {
  private _expected: number;
  private _arrived: unknown[] = [];

  constructor(expectedCount: number) {
    this._expected = expectedCount;
  }

  arrive(value: unknown): boolean {
    this._arrived.push(value);
    return this._arrived.length >= this._expected;
  }

  isComplete(): boolean {
    return this._arrived.length >= this._expected;
  }

  results(): unknown[] {
    return [...this._arrived];
  }

  expected(): number {
    return this._expected;
  }

  reset(): void {
    this._arrived = [];
  }
}

export class ConditionalStep {
  private _condition: (input: unknown) => boolean;

  constructor(condition: (input: unknown) => boolean) {
    this._condition = condition;
  }

  evaluate(input: unknown): boolean {
    return this._condition(input);
  }

  then<T>(input: unknown, onTrue: (i: unknown) => T, onFalse: (i: unknown) => T): T {
    return this.evaluate(input) ? onTrue(input) : onFalse(input);
  }

  negate(input: unknown): boolean {
    return !this.evaluate(input);
  }
}

export class LoopStep {
  private _maxIterations: number;

  constructor(maxIterations = 100) {
    this._maxIterations = maxIterations;
  }

  iterate<T>(items: T[], fn: (item: T, idx: number) => void): number {
    let n = 0;
    for (let i = 0; i < items.length && n < this._maxIterations; i++) {
      fn(items[i], i);
      n += 1;
    }
    return n;
  }

  async iterateAsync<T>(items: T[], fn: (item: T, idx: number) => Promise<void>): Promise<number> {
    let n = 0;
    for (let i = 0; i < items.length && n < this._maxIterations; i++) {
      await fn(items[i], i);
      n += 1;
    }
    return n;
  }

  maxIterations(): number {
    return this._maxIterations;
  }
}

export class SubWorkflow {
  private _children: Map<string, () => Promise<unknown>> = new Map();

  register(name: string, runner: () => Promise<unknown>): this {
    this._children.set(name, runner);
    return this;
  }

  async invoke(name: string): Promise<unknown | null> {
    const runner = this._children.get(name);
    return runner ? runner() : null;
  }

  names(): string[] {
    return [...this._children.keys()];
  }

  count(): number {
    return this._children.size;
  }
}

export class WaitStep {
  async wait(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  async waitUntil(predicate: () => boolean, pollMs = 50, maxMs = 5000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (predicate()) return true;
      await new Promise(r => setTimeout(r, pollMs));
    }
    return false;
  }

  async waitFor(signal: { resolved: boolean }, ms = 5000): Promise<boolean> {
    const start = Date.now();
    while (!signal.resolved && Date.now() - start < ms) {
      await new Promise(r => setTimeout(r, 50));
    }
    return signal.resolved;
  }
}

export class SignalStep {
  private _listeners: Map<string, Array<(payload: unknown) => void>> = new Map();
  private _signals: Map<string, unknown[]> = new Map();

  emit(name: string, payload: unknown): void {
    const listeners = this._listeners.get(name);
    if (listeners) listeners.forEach(l => l(payload));
    const history = this._signals.get(name) ?? [];
    history.push(payload);
    this._signals.set(name, history);
  }

  on(name: string, listener: (payload: unknown) => void): () => void {
    const listeners = this._listeners.get(name) ?? [];
    listeners.push(listener);
    this._listeners.set(name, listeners);
    return () => {
      const ls = this._listeners.get(name);
      if (ls) this._listeners.set(name, ls.filter(l => l !== listener));
    };
  }

  history(name: string): unknown[] {
    return [...(this._signals.get(name) ?? [])];
  }

  listenerCount(name: string): number {
    return this._listeners.get(name)?.length ?? 0;
  }

  clear(): void {
    this._listeners.clear();
    this._signals.clear();
  }
}

export class WorkflowStateMachine {
  private _transitions: Map<string, Set<string>> = new Map();
  private _state: string = '';

  addTransition(from: string, to: string): this {
    const set = this._transitions.get(from) ?? new Set();
    set.add(to);
    this._transitions.set(from, set);
    return this;
  }

  setInitial(state: string): this {
    if (this._state === '') this._state = state;
    return this;
  }

  current(): string {
    return this._state;
  }

  canTransition(to: string): boolean {
    return this._transitions.get(this._state)?.has(to) ?? false;
  }

  transition(to: string): boolean {
    if (!this.canTransition(to)) return false;
    this._state = to;
    return true;
  }

  states(): string[] {
    return [...this._transitions.keys()];
  }

  reachable(state: string): string[] {
    return [...(this._transitions.get(state) ?? new Set())];
  }
}

// V4935: WorkflowAdvancedIndex
export const CL_BATCH_2_ENGINES = [
  'BranchStep', 'ParallelStep', 'JoinStep', 'ConditionalStep', 'LoopStep',
  'SubWorkflow', 'WaitStep', 'SignalStep', 'WorkflowStateMachine', 'WorkflowAdvancedIndex'
] as const;

export class WorkflowAdvancedIndex {
  list(): string[] {
    return [...CL_BATCH_2_ENGINES];
  }

  count(): number {
    return CL_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CL_BATCH_2_ENGINES.includes(name as typeof CL_BATCH_2_ENGINES[number]);
  }
}