// V5276-V5285: CX Real-time Collaboration 2.0 Core Batch 1/3
// OperationalTransform2 + YjsStyleCRDT + PresenceEngine2 + ConflictResolver2 + HistoryManager + SnapshotSync + RealtimeSerializer + DeltaCompressor + NetworkOptimizer

export class OperationalTransform2 {
  // Enhanced OT: handles insert + delete + format marks
  transform(op: { type: 'insert' | 'delete' | 'format'; pos: number; text?: string; length?: number; attrs?: Record<string, string> }, against: { type: 'insert' | 'delete'; pos: number; text?: string; length?: number }): typeof op {
    if (op.type === 'insert' && against.type === 'insert') {
      return { ...op, pos: op.pos <= against.pos ? op.pos : op.pos + (against.text?.length ?? 0) };
    }
    if (op.type === 'insert' && against.type === 'delete') {
      if (op.pos >= against.pos && op.pos <= against.pos + (against.length ?? 0)) {
        return { ...op, pos: against.pos };
      }
      return { ...op, pos: op.pos > against.pos ? op.pos - (against.length ?? 0) : op.pos };
    }
    if (op.type === 'delete' && against.type === 'insert') {
      return { ...op, pos: op.pos >= against.pos ? op.pos + (against.text?.length ?? 0) : op.pos };
    }
    if (op.type === 'delete' && against.type === 'delete') {
      if (op.pos >= against.pos + (against.length ?? 0)) {
        return { ...op, pos: op.pos - (against.length ?? 0) };
      }
      return op;
    }
    return op;
  }

  apply(text: string, op: { type: 'insert' | 'delete'; pos: number; text?: string; length?: number }): string {
    if (op.type === 'insert' && typeof op.text === 'string') {
      return text.slice(0, op.pos) + op.text + text.slice(op.pos);
    }
    if (op.type === 'delete' && typeof op.length === 'number') {
      return text.slice(0, op.pos) + text.slice(op.pos + op.length);
    }
    return text;
  }
}

export class YjsStyleCRDT {
  private _state: Map<string, { value: string; clock: number }> = new Map();
  private _clock: number = 0;

  set(key: string, value: string): number {
    this._clock += 1;
    this._state.set(key, { value, clock: this._clock });
    return this._clock;
  }

  get(key: string): string | null {
    return this._state.get(key)?.value ?? null;
  }

  // Yjs merge: keep higher clock
  mergeRemote(remote: Array<{ key: string; value: string; clock: number }>): void {
    for (const r of remote) {
      const local = this._state.get(r.key);
      if (!local || r.clock > local.clock) {
        this._state.set(r.key, { value: r.value, clock: r.clock });
        if (r.clock > this._clock) this._clock = r.clock;
      }
    }
  }

  export(): Array<{ key: string; value: string; clock: number }> {
    return [...this._state.entries()].map(([k, v]) => ({ key: k, ...v }));
  }

  size(): number { return this._state.size; }

  clock(): number { return this._clock; }
}

export class PresenceEngine2 {
  private _peers: Map<string, { lastSeen: number; cursor: number; selection: [number, number] }> = new Map();
  private _timeoutMs: number;

  constructor(timeoutMs = 30_000) {
    this._timeoutMs = timeoutMs;
  }

  heartbeat(peerId: string, cursor = 0, selection: [number, number] = [0, 0]): void {
    this._peers.set(peerId, { lastSeen: Date.now(), cursor, selection });
  }

  peers(): string[] {
    return [...this._peers.keys()];
  }

  cursor(peerId: string): number {
    return this._peers.get(peerId)?.cursor ?? 0;
  }

  selection(peerId: string): [number, number] {
    return this._peers.get(peerId)?.selection ?? [0, 0];
  }

  active(now: number): string[] {
    const result: string[] = [];
    for (const [id, p] of this._peers.entries()) {
      if (now - p.lastSeen < this._timeoutMs) result.push(id);
    }
    return result;
  }

  timeout(): number { return this._timeoutMs; }
}

export class ConflictResolver2 {
  // Multi-strategy resolver
  resolve(local: string, remote: string, strategy: 'local' | 'remote' | 'merge' | 'threeway' = 'threeway', base?: string): string {
    switch (strategy) {
      case 'local': return local;
      case 'remote': return remote;
      case 'merge': return local + '\n---\n' + remote;
      case 'threeway': {
        if (!base) return local;
        if (base === local) return local; // local unchanged → keep local
        if (base === remote) return remote; // remote unchanged → keep remote
        return local + '\n<<<<<<<\n' + remote + '\n>>>>>>>';
      }
    }
  }

  hasConflict(local: string, remote: string, base: string): boolean {
    return local !== base && remote !== base && local !== remote;
  }
}

export class HistoryManager {
  private _undo: string[] = [];
  private _redo: string[] = [];
  private _maxSize: number;

  constructor(maxSize = 100) {
    this._maxSize = maxSize;
  }

  push(state: string): this {
    this._undo.push(state);
    if (this._undo.length > this._maxSize) this._undo.shift();
    this._redo = [];
    return this;
  }

  undo(current: string): string | null {
    if (this._undo.length === 0) return null;
    this._redo.push(current);
    return this._undo.pop() ?? null;
  }

  redo(current: string): string | null {
    if (this._redo.length === 0) return null;
    this._undo.push(current);
    return this._redo.pop() ?? null;
  }

  canUndo(): boolean { return this._undo.length > 0; }
  canRedo(): boolean { return this._redo.length > 0; }

  undoSize(): number { return this._undo.length; }
  redoSize(): number { return this._redo.length; }
}

export class SnapshotSync {
  private _snapshots: Map<string, { state: string; ts: number }> = new Map();
  private _current: string = '';

  setCurrent(state: string): this {
    this._current = state;
    return this;
  }

  current(): string { return this._current; }

  save(id: string): void {
    this._snapshots.set(id, { state: this._current, ts: Date.now() });
  }

  load(id: string): string | null {
    const s = this._snapshots.get(id);
    if (!s) return null;
    this._current = s.state;
    return s.state;
  }

  age(id: string): number {
    const s = this._snapshots.get(id);
    return s ? Date.now() - s.ts : -1;
  }

  snapshotIds(): string[] {
    return [...this._snapshots.keys()];
  }

  count(): number { return this._snapshots.size; }
}

export class RealtimeSerializer {
  // Efficient binary-like JSON serializer
  serialize(message: unknown): string {
    return JSON.stringify(message);
  }

  deserialize<T = unknown>(s: string): T {
    return JSON.parse(s) as T;
  }

  size(message: unknown): number {
    return this.serialize(message).length;
  }
}

export class DeltaCompressor {
  // Diff: keep only deltas
  diff(before: string, after: string): string {
    if (before === after) return '';
    let i = 0;
    while (i < before.length && i < after.length && before[i] === after[i]) i += 1;
    let jBefore = before.length;
    let jAfter = after.length;
    while (jBefore > i && jAfter > i && before[jBefore - 1] === after[jAfter - 1]) {
      jBefore -= 1;
      jAfter -= 1;
    }
    return JSON.stringify({ pos: i, del: before.slice(i, jBefore), ins: after.slice(i, jAfter) });
  }

  patch(before: string, delta: string): string {
    try {
      const d = JSON.parse(delta) as { pos: number; del: string; ins: string };
      return before.slice(0, d.pos) + d.ins + before.slice(d.pos + d.del.length);
    } catch {
      return before;
    }
  }

  ratio(before: string, after: string): number {
    return this.diff(before, after).length / Math.max(1, after.length);
  }
}

export class NetworkOptimizer {
  // Adaptive batch size based on RTT
  optimalBatch(rttMs: number, baseBatch = 50): number {
    if (rttMs < 50) return baseBatch;
    if (rttMs < 200) return Math.floor(baseBatch / 2);
    return Math.floor(baseBatch / 5);
  }

  // Compression level by payload size
  recommendCompression(payloadBytes: number): 'none' | 'fast' | 'best' {
    if (payloadBytes < 1024) return 'none';
    if (payloadBytes < 10_240) return 'fast';
    return 'best';
  }

  estimateLatency(payloadBytes: number, rttMs: number, bandwidthKbps: number): number {
    const transferMs = (payloadBytes * 8) / (bandwidthKbps * 1024);
    return rttMs + transferMs;
  }
}

// V5285: CollabV2CoreIndex
export const CX_BATCH_1_ENGINES = [
  'OperationalTransform2', 'YjsStyleCRDT', 'PresenceEngine2', 'ConflictResolver2', 'HistoryManager',
  'SnapshotSync', 'RealtimeSerializer', 'DeltaCompressor', 'NetworkOptimizer', 'CollabV2CoreIndex'
] as const;

export class CollabV2CoreIndex {
  list(): string[] {
    return [...CX_BATCH_1_ENGINES];
  }

  count(): number {
    return CX_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CX_BATCH_1_ENGINES.includes(name as typeof CX_BATCH_1_ENGINES[number]);
  }
}