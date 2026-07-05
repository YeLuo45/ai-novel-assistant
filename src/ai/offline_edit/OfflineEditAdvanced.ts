// V4956-V4965: CM Offline Edit Advanced Batch 2/3
// CRDT document + vector clock + lamport clock + OT + delta encode/decode + compression + encrypted channel + presence

export class CRDTDocument {
  private _state: Map<string, string> = new Map();

  set(key: string, value: string, ts: number): void {
    const existing = this._state.get(key);
    if (existing && this._extractTs(existing) >= ts) return;
    this._state.set(key, `${ts}:${value}`);
  }

  private _extractTs(entry: string): number {
    const idx = entry.indexOf(':');
    return parseInt(entry.slice(0, idx), 10);
  }

  get(key: string): string | null {
    const entry = this._state.get(key);
    if (!entry) return null;
    return entry.slice(entry.indexOf(':') + 1);
  }

  ts(key: string): number | null {
    const entry = this._state.get(key);
    return entry ? this._extractTs(entry) : null;
  }

  delete(key: string): boolean {
    return this._state.delete(key);
  }

  size(): number {
    return this._state.size;
  }

  keys(): string[] {
    return [...this._state.keys()];
  }

  merge(remote: CRDTDocument): void {
    for (const key of remote.keys()) {
      const remoteTs = remote.ts(key);
      const localTs = this.ts(key);
      if (localTs === null || (remoteTs !== null && remoteTs > localTs)) {
        const v = remote.get(key);
        if (v !== null && remoteTs !== null) {
          this.set(key, v, remoteTs);
        }
      }
    }
  }
}

export class VectorClock {
  private _clocks: Map<string, number> = new Map();

  increment(nodeId: string): void {
    this._clocks.set(nodeId, (this._clocks.get(nodeId) ?? 0) + 1);
  }

  get(nodeId: string): number {
    return this._clocks.get(nodeId) ?? 0;
  }

  merge(remote: VectorClock): void {
    for (const [node, ts] of remote._clocks.entries()) {
      this._clocks.set(node, Math.max(this.get(node), ts));
    }
  }

  compare(other: VectorClock): 'before' | 'after' | 'equal' | 'concurrent' {
    let less = false, greater = false;
    const allKeys = new Set([...this._clocks.keys(), ...other._clocks.keys()]);
    for (const k of allKeys) {
      const a = this.get(k);
      const b = other.get(k);
      if (a < b) less = true;
      if (a > b) greater = true;
    }
    if (less && greater) return 'concurrent';
    if (less) return 'before';
    if (greater) return 'after';
    return 'equal';
  }

  toMap(): Record<string, number> {
    return Object.fromEntries(this._clocks.entries());
  }
}

export class LamportClock {
  private _value: number = 0;

  tick(): number {
    this._value += 1;
    return this._value;
  }

  observe(remoteValue: number): number {
    this._value = Math.max(this._value, remoteValue) + 1;
    return this._value;
  }

  current(): number {
    return this._value;
  }
}

export class OperationalTransform {
  // Insert op: { type: 'insert', pos, text }
  apply(op: { type: 'insert' | 'delete'; pos: number; text?: string; length?: number }, text: string): string {
    if (op.type === 'insert' && typeof op.text === 'string') {
      return text.slice(0, op.pos) + op.text + text.slice(op.pos);
    } else if (op.type === 'delete' && typeof op.length === 'number') {
      return text.slice(0, op.pos) + text.slice(op.pos + op.length);
    }
    return text;
  }

  transform(op1: { type: 'insert' | 'delete'; pos: number; text?: string; length?: number },
             op2: { type: 'insert' | 'delete'; pos: number; text?: string; length?: number }): { type: 'insert' | 'delete'; pos: number; text?: string; length?: number } {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.pos <= op2.pos) {
        return { ...op1, pos: op1.pos };
      }
      return { ...op1, pos: op1.pos + (op2.text?.length ?? 0) };
    }
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.pos >= op2.pos + (op2.length ?? 0)) {
        return { ...op1, pos: op1.pos - (op2.length ?? 0) };
      }
      return { ...op1 };
    }
    return op1;
  }
}

export class DeltaEncoder {
  encode(prev: string, next: string): { op: 'equal' | 'insert' | 'delete' | 'replace'; from: number; value: string } {
    if (prev === next) return { op: 'equal', from: 0, value: '' };
    const common = this._commonPrefix(prev, next);
    if (common === prev.length) {
      return { op: 'insert', from: common, value: next.slice(common) };
    }
    if (common === next.length) {
      return { op: 'delete', from: common, value: '' };
    }
    return { op: 'replace', from: common, value: next.slice(common) };
  }

  private _commonPrefix(a: string, b: string): number {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
    return i;
  }

  decode(prev: string, delta: { op: 'insert' | 'delete' | 'replace'; from: number; value: string }): string {
    if (delta.op === 'insert') return prev.slice(0, delta.from) + delta.value + prev.slice(delta.from);
    if (delta.op === 'delete') return prev.slice(0, delta.from);
    if (delta.op === 'replace') return prev.slice(0, delta.from) + delta.value;
    return prev;
  }
}

export class DeltaDecoder {
  decode(prev: string, delta: string): string {
    try {
      const parsed = JSON.parse(delta);
      const enc = new DeltaEncoder();
      return enc.decode(prev, parsed);
    } catch {
      return prev;
    }
  }

  encode(prev: string, next: string): string {
    const enc = new DeltaEncoder();
    return JSON.stringify(enc.encode(prev, next));
  }
}

export class CompressionCodec {
  compress(input: string): string {
    if (!input) return '';
    return input.split('').map(c => {
      const code = c.charCodeAt(0);
      return code < 128 ? c : `\\u${code.toString(16).padStart(4, '0')}`;
    }).join('');
  }

  decompress(input: string): string {
    return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  }

  ratio(original: string, compressed: string): number {
    return original.length === 0 ? 0 : compressed.length / original.length;
  }
}

export class EncryptedChannel {
  private _xorKey: number;

  constructor(xorKey = 42) {
    this._xorKey = xorKey;
  }

  encrypt(input: string): string {
    let out = '';
    for (let i = 0; i < input.length; i++) {
      out += String.fromCharCode(input.charCodeAt(i) ^ this._xorKey);
    }
    return out;
  }

  decrypt(input: string): string {
    return this.encrypt(input); // XOR symmetric
  }

  setKey(key: number): void {
    this._xorKey = key;
  }
}

export class PresenceTracker {
  private _peers: Map<string, { lastSeen: number; cursor: number }> = new Map();
  private _timeoutMs: number;

  constructor(timeoutMs = 30_000) {
    this._timeoutMs = timeoutMs;
  }

  heartbeat(peerId: string, cursor: number): void {
    this._peers.set(peerId, { lastSeen: Date.now(), cursor });
  }

  peers(): string[] {
    return [...this._peers.keys()];
  }

  cursor(peerId: string): number | null {
    return this._peers.get(peerId)?.cursor ?? null;
  }

  active(now: number): string[] {
    const result: string[] = [];
    for (const [id, info] of this._peers.entries()) {
      if (now - info.lastSeen < this._timeoutMs) result.push(id);
    }
    return result;
  }

  remove(peerId: string): boolean {
    return this._peers.delete(peerId);
  }

  size(): number {
    return this._peers.size;
  }
}

// V4965: OfflineEditAdvancedIndex
export const CM_BATCH_2_ENGINES = [
  'CRDTDocument', 'VectorClock', 'LamportClock', 'OperationalTransform', 'DeltaEncoder',
  'DeltaDecoder', 'CompressionCodec', 'EncryptedChannel', 'PresenceTracker', 'OfflineEditAdvancedIndex'
] as const;

export class OfflineEditAdvancedIndex {
  list(): string[] {
    return [...CM_BATCH_2_ENGINES];
  }

  count(): number {
    return CM_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CM_BATCH_2_ENGINES.includes(name as typeof CM_BATCH_2_ENGINES[number]);
  }
}