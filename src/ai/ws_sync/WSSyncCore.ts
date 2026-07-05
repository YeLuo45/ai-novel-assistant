// Round 8 Direction CC — WebSocket Real-time Sync 2.0 Batch 1/3
// V4646-V4655: Binary codec + compression + pool + heartbeat + reconnect + dedup + sequence + ack + router + protocol neg
// 3-files × 10-engines pattern (P-97)

export interface BinaryFrame {
  magic: number;
  type: number; // 1=text 2=binary 3=ping 4=pong 5=ack 6=error
  payload: Uint8Array;
  checksum: number;
}

export interface WireMessage {
  id: string;
  type: string;
  payload: string;
  timestamp: number;
  seq?: number;
}

// V4646: BinaryFrameCodec — 二进制帧编解码 (header + payload + checksum)
export class BinaryFrameCodec {
  static readonly MAGIC = 0x575343; // "WSC"
  static readonly HEADER_SIZE = 9; // magic(3) + type(1) + len(4) + checksum(1)

  encode(type: number, payload: Uint8Array): Uint8Array {
    const headerSize = BinaryFrameCodec.HEADER_SIZE;
    const magic = BinaryFrameCodec.MAGIC;
    const checksum = this._fnv1a(payload);
    const buffer = new Uint8Array(headerSize + payload.length);
    buffer[0] = (magic >> 16) & 0xff;
    buffer[1] = (magic >> 8) & 0xff;
    buffer[2] = magic & 0xff;
    buffer[3] = type & 0xff;
    buffer[4] = (payload.length >> 24) & 0xff;
    buffer[5] = (payload.length >> 16) & 0xff;
    buffer[6] = (payload.length >> 8) & 0xff;
    buffer[7] = payload.length & 0xff;
    buffer[8] = checksum & 0xff;
    buffer.set(payload, headerSize);
    return buffer;
  }

  decode(buffer: Uint8Array): BinaryFrame | null {
    const headerSize = BinaryFrameCodec.HEADER_SIZE;
    const magic = BinaryFrameCodec.MAGIC;
    if (buffer.length < headerSize) return null;
    const decodedMagic = (buffer[0] << 16) | (buffer[1] << 8) | buffer[2];
    if (decodedMagic !== magic) return null;
    const type = buffer[3];
    const len = (buffer[4] << 24) | (buffer[5] << 16) | (buffer[6] << 8) | buffer[7];
    const checksum = buffer[8];
    if (buffer.length < headerSize + len) return null;
    const payload = buffer.slice(headerSize, headerSize + len);
    return { magic: decodedMagic, type, payload, checksum };
  }

  validate(frame: BinaryFrame): boolean {
    // Compare only the low byte (matches encode which stores checksum & 0xff)
    return frame.checksum === (this._fnv1a(frame.payload) & 0xff);
  }

  validateBuffer(buffer: Uint8Array): boolean {
    const f = this.decode(buffer);
    if (!f) return false;
    return this.validate(f);
  }

  // FNV-1a 32-bit hash, no crypto dep (P-49)
  private _fnv1a(bytes: Uint8Array): number {
    let h = 2166136261;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = (h * 16777619) >>> 0;
    }
    return h;
  }
}

// V4647: MessageCompressor — 简化版 RLE + 字典压缩
export class MessageCompressor {
  private _dictionary: Map<string, string> = new Map();

  compress(text: string): string {
    if (text.length < 8) return text;
    // Simple RLE: replace 3+ consecutive identical chars with char + count
    let compressed = text.replace(/(.)\1{2,}/g, (m, c) => `${c}{${m.length}}`);
    // Dictionary substitution: track common 4+ char words
    const words = compressed.match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z]{4,}/g) || [];
    const counts = new Map<string, number>();
    words.forEach(w => counts.set(w, (counts.get(w) || 0) + 1));
    const dictEntries: [string, string][] = [];
    let nextCode = 0;
    counts.forEach((cnt, w) => {
      if (cnt >= 2 && w.length >= 4 && nextCode < 10) {
        const code = `\x01${nextCode++}\x01`;
        this._dictionary.set(code, w);
        dictEntries.push([w, code]);
      }
    });
    dictEntries.forEach(([w, code]) => {
      compressed = compressed.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), code);
    });
    return compressed;
  }

  decompress(text: string): string {
    let result = text;
    // Reverse dictionary
    this._dictionary.forEach((value, code) => {
      result = result.split(code).join(value);
    });
    // Reverse RLE
    result = result.replace(/(.)\{(\d+)\}/g, (_m, c, n) => c.repeat(parseInt(n)));
    return result;
  }

  ratio(original: string, compressed: string): number {
    return compressed.length / Math.max(original.length, 1);
  }

  dictionarySize(): number { return this._dictionary.size; }
  reset(): void { this._dictionary.clear(); }
}

// V4648: ConnectionPool — WebSocket 连接池 (max connections + reuse)
export class ConnectionPool {
  private _connections: Map<string, { id: string; created: number; lastUsed: number; busy: boolean }> = new Map();
  private _max: number;

  constructor(max = 10) { this._max = max; }

  acquire(id: string): boolean {
    if (this._connections.has(id)) {
      const c = this._connections.get(id)!;
      if (c.busy) return false;
      c.busy = true;
      c.lastUsed = Date.now();
      return true;
    }
    if (this._connections.size >= this._max) return false;
    this._connections.set(id, { id, created: Date.now(), lastUsed: Date.now(), busy: true });
    return true;
  }

  release(id: string): void {
    const c = this._connections.get(id);
    if (c) c.busy = false;
  }

  evict(id: string): void { this._connections.delete(id); }

  size(): number { return this._connections.size; }
  busyCount(): number {
    let n = 0;
    this._connections.forEach(c => { if (c.busy) n++; });
    return n;
  }

  // Evict connections idle for >maxIdleMs
  gc(maxIdleMs = 60000): number {
    let removed = 0;
    const now = Date.now();
    this._connections.forEach((c, id) => {
      if (!c.busy && now - c.lastUsed >= maxIdleMs) {
        this._connections.delete(id);
        removed++;
      }
    });
    return removed;
  }
}

// V4649: HeartbeatManager — 心跳管理 (ping/pong + timeout detection)
export interface HeartbeatRecord {
  id: string;
  lastBeat: number;
  missed: number;
  alive: boolean;
}

export class HeartbeatManager {
  private _records: Map<string, HeartbeatRecord> = new Map();
  private _intervalMs: number;
  private _maxMissed: number;

  constructor(intervalMs = 30000, maxMissed = 3) {
    this._intervalMs = intervalMs;
    this._maxMissed = maxMissed;
  }

  register(id: string): void {
    this._records.set(id, { id, lastBeat: Date.now(), missed: 0, alive: true });
  }

  beat(id: string): void {
    const r = this._records.get(id);
    if (r) {
      r.lastBeat = Date.now();
      r.missed = 0;
      r.alive = true;
    }
  }

  tick(): string[] {
    const now = Date.now();
    const dead: string[] = [];
    this._records.forEach((r, id) => {
      if (now - r.lastBeat > this._intervalMs) {
        r.missed++;
        if (r.missed >= this._maxMissed) {
          r.alive = false;
          dead.push(id);
        }
      }
    });
    return dead;
  }

  alive(id: string): boolean {
    return this._records.get(id)?.alive ?? false;
  }

  size(): number { return this._records.size; }

  unregister(id: string): void { this._records.delete(id); }
}

// V4650: ReconnectWithBackoff — 指数退避重连策略
export interface ReconnectAttempt {
  attempt: number;
  delayMs: number;
  scheduledAt: number;
}

export class ReconnectWithBackoff {
  private _history: ReconnectAttempt[] = [];
  private _maxAttempts: number;
  private _baseMs: number;
  private _maxMs: number;

  constructor(maxAttempts = 5, baseMs = 100, maxMs = 30000) {
    this._maxAttempts = maxAttempts;
    this._baseMs = baseMs;
    this._maxMs = maxMs;
  }

  nextDelay(attempt: number): number {
    if (attempt > this._maxAttempts) return -1; // give up
    const exp = Math.min(this._baseMs * Math.pow(2, attempt - 1), this._maxMs);
    const jitter = Math.random() * (exp * 0.1);
    return Math.floor(exp + jitter);
  }

  record(attempt: number, delayMs: number): ReconnectAttempt {
    const a: ReconnectAttempt = { attempt, delayMs, scheduledAt: Date.now() };
    this._history.push(a);
    return a;
  }

  shouldRetry(attempt: number): boolean {
    return attempt <= this._maxAttempts;
  }

  history(): ReconnectAttempt[] { return [...this._history]; }

  reset(): void { this._history = []; }
}

// V4651: MessageDeduplicator — 消息去重 (基于 id 滑动窗口)
export class MessageDeduplicator {
  private _seen: Set<string> = new Set();
  private _order: string[] = [];
  private _window: number;

  constructor(window = 1000) { this._window = window; }

  seen(id: string): boolean { return this._seen.has(id); }

  mark(id: string): void {
    if (this._seen.has(id)) return;
    this._seen.add(id);
    this._order.push(id);
    if (this._order.length > this._window) {
      const evict = this._order.shift();
      if (evict) this._seen.delete(evict);
    }
  }

  unique(ids: string[]): string[] {
    const out: string[] = [];
    ids.forEach(id => {
      if (!this._seen.has(id)) {
        this._seen.add(id);
        this._order.push(id);
        out.push(id);
      }
    });
    return out;
  }

  size(): number { return this._seen.size; }
  clear(): void { this._seen.clear(); this._order = []; }
}

// V4652: SequenceNumberTracker — 序列号追踪 (检测丢失)
export class SequenceNumberTracker {
  private _expected = 1;
  private _received = 0;
  private _gaps: number[] = [];

  next(): number { return this._expected++; }

  receive(seq: number): { ok: boolean; gap: boolean } {
    this._received++;
    if (seq === this._expected) {
      this._expected++;
      return { ok: true, gap: false };
    }
    if (seq > this._expected) {
      // gap detected
      for (let missing = this._expected; missing < seq; missing++) {
        this._gaps.push(missing);
      }
      this._expected = seq + 1;
      return { ok: false, gap: true };
    }
    // duplicate or out-of-order
    return { ok: false, gap: false };
  }

  gaps(): number[] { return [...this._gaps]; }
  clearGaps(): void { this._gaps = []; }

  receivedCount(): number { return this._received; }
  expected(): number { return this._expected; }
}

// V4653: AckReceiptTracker — ACK 接收追踪 (sent messages waiting for ack)
export interface PendingAck {
  id: string;
  sentAt: number;
  acked: boolean;
  retryCount: number;
}

export class AckReceiptTracker {
  private _pending: Map<string, PendingAck> = new Map();
  private _timeoutMs: number;

  constructor(timeoutMs = 5000) { this._timeoutMs = timeoutMs; }

  send(id: string): void {
    this._pending.set(id, { id, sentAt: Date.now(), acked: false, retryCount: 0 });
  }

  acknowledge(id: string): boolean {
    const p = this._pending.get(id);
    if (!p) return false;
    p.acked = true;
    return true;
  }

  retry(id: string): boolean {
    const p = this._pending.get(id);
    if (!p || p.acked) return false;
    p.retryCount++;
    p.sentAt = Date.now();
    return true;
  }

  timedOut(): string[] {
    const now = Date.now();
    const out: string[] = [];
    this._pending.forEach((p, id) => {
      if (!p.acked && now - p.sentAt > this._timeoutMs) out.push(id);
    });
    return out;
  }

  pendingCount(): number {
    let n = 0;
    this._pending.forEach(p => { if (!p.acked) n++; });
    return n;
  }

  remove(id: string): void { this._pending.delete(id); }

  cleanup(): number {
    let removed = 0;
    this._pending.forEach((p, id) => {
      if (p.acked) { this._pending.delete(id); removed++; }
    });
    return removed;
  }
}

// V4654: MessageRouter — 消息路由 (按 type 分发)
export type MessageHandler = (msg: WireMessage) => void;

export class MessageRouter {
  private _routes: Map<string, MessageHandler[]> = new Map();
  private _wildcards: MessageHandler[] = [];

  register(type: string, handler: MessageHandler): void {
    if (!this._routes.has(type)) this._routes.set(type, []);
    this._routes.get(type)!.push(handler);
  }

  registerWildcard(handler: MessageHandler): void {
    this._wildcards.push(handler);
  }

  route(msg: WireMessage): number {
    let count = 0;
    const handlers = this._routes.get(msg.type);
    if (handlers) handlers.forEach(h => { h(msg); count++; });
    this._wildcards.forEach(h => { h(msg); count++; });
    return count;
  }

  unregister(type: string, handler: MessageHandler): void {
    const handlers = this._routes.get(type);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  }

  routeCount(): number { return this._routes.size; }
  handlerCount(): number {
    let n = this._wildcards.length;
    this._routes.forEach(arr => { n += arr.length; });
    return n;
  }
}

// V4655: ProtocolVersionNegotiator — 协议版本协商
export interface ProtocolVersion {
  major: number;
  minor: number;
  patch: number;
}

export class ProtocolVersionNegotiator {
  private _supported: ProtocolVersion[] = [];
  private _current: ProtocolVersion = { major: 1, minor: 0, patch: 0 };

  addSupported(v: ProtocolVersion): void { this._supported.push(v); }

  negotiate(remote: ProtocolVersion): ProtocolVersion | null {
    // Find highest matching major + highest minor/patch
    const candidates = this._supported.filter(s => s.major === remote.major);
    if (candidates.length === 0) return null;
    return candidates.reduce((best, cur) => {
      if (cur.minor > best.minor) return cur;
      if (cur.minor === best.minor && cur.patch > best.patch) return cur;
      return best;
    });
  }

  setCurrent(v: ProtocolVersion): void { this._current = v; }
  current(): ProtocolVersion { return this._current; }

  compatible(v: ProtocolVersion): boolean {
    return v.major === this._current.major;
  }

  toString(v: ProtocolVersion): string {
    return `${v.major}.${v.minor}.${v.patch}`;
  }

  supported(): ProtocolVersion[] { return [...this._supported]; }
}

export const WS_SYNC_BATCH_1_ENGINES: readonly string[] = [
  'BinaryFrameCodec', 'MessageCompressor', 'ConnectionPool', 'HeartbeatManager',
  'ReconnectWithBackoff', 'MessageDeduplicator', 'SequenceNumberTracker',
  'AckReceiptTracker', 'MessageRouter', 'ProtocolVersionNegotiator',
];

export class WSSyncCoreIndex {
  list(): string[] { return [...WS_SYNC_BATCH_1_ENGINES, 'WSSyncCoreIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}