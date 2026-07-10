// V5286-V5295: CX Real-time Collaboration 2.0 Advanced Batch 2/3
// AwarenessProtocol2 + SelectionSync2 + CursorShare2 + LatencyOptimizer2 + OfflineQueue2 + ReconnectReplay2 + BandwidthOptimizer + RetryStrategy + BackoffCalculator + AdvancedIndex

export class AwarenessProtocol2 {
  private _states: Map<string, { cursor: number; color: string; ts: number }> = new Map();
  private _listeners: Array<(states: Map<string, { cursor: number; color: string }>) => void> = [];

  setState(userId: string, cursor: number, color = '#000'): void {
    this._states.set(userId, { cursor, color, ts: Date.now() });
    this._notify();
  }

  on(listener: (states: Map<string, { cursor: number; color: string }>) => void): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  private _notify(): void {
    const m = new Map<string, { cursor: number; color: string }>();
    for (const [k, v] of this._states.entries()) m.set(k, { cursor: v.cursor, color: v.color });
    for (const l of this._listeners) l(m);
  }

  getState(userId: string): { cursor: number; color: string } | null {
    const s = this._states.get(userId);
    return s ? { cursor: s.cursor, color: s.color } : null;
  }

  activeUsers(): string[] {
    return [...this._states.keys()];
  }

  clear(): void {
    this._states.clear();
  }
}

export class SelectionSync2 {
  private _selections: Map<string, { anchor: number; head: number; ts: number }> = new Map();

  set(userId: string, anchor: number, head: number): this {
    this._selections.set(userId, { anchor, head, ts: Date.now() });
    return this;
  }

  get(userId: string): { anchor: number; head: number; ts: number } | null {
    return this._selections.get(userId) ?? null;
  }

  isEmpty(userId: string): boolean {
    const s = this._selections.get(userId);
    return s ? s.anchor === s.head : true;
  }

  range(userId: string): { start: number; end: number } {
    const s = this._selections.get(userId);
    return s ? { start: Math.min(s.anchor, s.head), end: Math.max(s.anchor, s.head) } : { start: 0, end: 0 };
  }

  remove(userId: string): boolean {
    return this._selections.delete(userId);
  }
}

export class CursorShare2 {
  private _cursors: Map<string, { position: number; visible: boolean; ts: number }> = new Map();

  publish(userId: string, position: number, visible = true): this {
    this._cursors.set(userId, { position, visible, ts: Date.now() });
    return this;
  }

  position(userId: string): number {
    return this._cursors.get(userId)?.position ?? 0;
  }

  isVisible(userId: string): boolean {
    return this._cursors.get(userId)?.visible ?? false;
  }

  hide(userId: string): this {
    const c = this._cursors.get(userId);
    if (c) this._cursors.set(userId, { ...c, visible: false });
    return this;
  }

  show(userId: string): this {
    const c = this._cursors.get(userId);
    if (c) this._cursors.set(userId, { ...c, visible: true });
    return this;
  }

  remove(userId: string): boolean {
    return this._cursors.delete(userId);
  }
}

export class LatencyOptimizer2 {
  // Adaptive timeout based on RTT
  optimalTimeout(rttMs: number, safetyFactor = 3): number {
    return rttMs * safetyFactor;
  }

  // Predict next latency using exponential smoothing
  predict(history: number[], alpha = 0.3): number {
    if (history.length === 0) return 0;
    let s = history[0];
    for (let i = 1; i < history.length; i++) s = alpha * history[i] + (1 - alpha) * s;
    return s;
  }

  // Should retry based on RTT
  shouldRetry(latencyMs: number, maxLatencyMs: number): boolean {
    return latencyMs < maxLatencyMs;
  }
}

export class OfflineQueue2 {
  private _queue: Array<{ id: string; op: string; payload: unknown; ts: number }> = [];
  private _nextId = 0;

  enqueue(op: string, payload: unknown): string {
    const id = `oq-${this._nextId++}`;
    this._queue.push({ id, op, payload, ts: Date.now() });
    return id;
  }

  dequeue(): { id: string; op: string; payload: unknown } | null {
    return this._queue.shift() ?? null;
  }

  size(): number { return this._queue.length; }
  clear(): void { this._queue = []; }
  ids(): string[] { return this._queue.map(q => q.id); }
}

export class ReconnectReplay2 {
  private _buffer: Array<{ ts: number; op: string; payload: unknown }> = [];

  record(op: string, payload: unknown): this {
    this._buffer.push({ ts: Date.now(), op, payload });
    return this;
  }

  bufferSize(): number { return this._buffer.length; }
  clear(): void { this._buffer = []; }

  replay(handler: (op: string, payload: unknown) => void): number {
    let n = 0;
    for (const r of this._buffer) {
      handler(r.op, r.payload);
      n += 1;
    }
    return n;
  }
}

export class BandwidthOptimizer {
  // Estimate bytes to send
  estimate(payload: unknown): number {
    return JSON.stringify(payload).length;
  }

  shouldThrottle(currentKbps: number, maxKbps: number): boolean {
    return currentKbps > maxKbps;
  }

  // Adaptive batch size
  optimalBatchSize(availableBandwidthKbps: number, avgPayloadBytes: number): number {
    return Math.max(1, Math.floor((availableBandwidthKbps * 1024) / Math.max(1, avgPayloadBytes)));
  }
}

export class RetryStrategy {
  // Exponential backoff
  backoff(attempt: number, baseMs = 100, maxMs = 10_000): number {
    return Math.min(maxMs, baseMs * Math.pow(2, attempt));
  }

  shouldRetry(attempt: number, maxAttempts = 5): boolean {
    return attempt < maxAttempts;
  }

  nextDelay(attempt: number, jitter = 0.1): number {
    const base = this.backoff(attempt);
    const jit = base * jitter * (Math.random() * 2 - 1);
    return base + jit;
  }
}

export class BackoffCalculator {
  // Decorrelated jitter
  decorrelated(prevMs: number, baseMs = 100, maxMs = 10_000): number {
    return Math.min(maxMs, Math.random() * (prevMs * 3 - baseMs) + baseMs);
  }

  fullJitter(maxMs: number): number {
    return Math.random() * maxMs;
  }

  equalJitter(baseMs: number, maxMs: number): number {
    // Equal jitter: random in [base/2, max - base/2]
    return baseMs / 2 + Math.random() * Math.max(0, maxMs - baseMs);
  }
}

// V5295: CollabV2AdvancedIndex
export const CX_BATCH_2_ENGINES = [
  'AwarenessProtocol2', 'SelectionSync2', 'CursorShare2', 'LatencyOptimizer2', 'OfflineQueue2',
  'ReconnectReplay2', 'BandwidthOptimizer', 'RetryStrategy', 'BackoffCalculator', 'CollabV2AdvancedIndex'
] as const;

export class CollabV2AdvancedIndex {
  list(): string[] {
    return [...CX_BATCH_2_ENGINES];
  }

  count(): number {
    return CX_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CX_BATCH_2_ENGINES.includes(name as typeof CX_BATCH_2_ENGINES[number]);
  }
}