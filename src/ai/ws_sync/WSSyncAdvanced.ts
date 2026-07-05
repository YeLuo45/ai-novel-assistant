// Round 8 Direction CC — WebSocket Real-time Sync 2.0 Batch 2/3
// V4656-V4665: RateLimit + Bandwidth + Latency + Conflict + OpLog + Priority + Batch + Multiplexer + Subscriptions + Metrics

// V4656: AdaptiveRateLimiter — 自适应速率限制（token bucket + dynamic adjustment）
export class AdaptiveRateLimiter {
  private _tokens: number;
  private _capacity: number;
  private _refillRate: number;
  private _lastRefill: number;

  constructor(capacity = 100, refillRate = 10) {
    this._capacity = capacity;
    this._tokens = capacity;
    this._refillRate = refillRate;
    this._lastRefill = Date.now();
  }

  tryAcquire(n = 1): boolean {
    this._refill();
    if (this._tokens >= n) {
      this._tokens -= n;
      return true;
    }
    return false;
  }

  private _refill(): void {
    const now = Date.now();
    const elapsed = (now - this._lastRefill) / 1000;
    this._tokens = Math.min(this._capacity, this._tokens + elapsed * this._refillRate);
    this._lastRefill = now;
  }

  setRefillRate(r: number): void { this._refillRate = r; }
  capacity(): number { return this._capacity; }
  available(): number { this._refill(); return Math.floor(this._tokens); }

  adapt(loadFactor: number): void {
    // loadFactor 0-1: high load → reduce refill
    this._refillRate = Math.max(1, 100 * (1 - loadFactor * 0.5));
  }
}

// V4657: BandwidthMonitor — 带宽监控（滑动窗口 + 平均值）
export class BandwidthMonitor {
  private _samples: { timestamp: number; bytes: number }[] = [];
  private _windowMs: number;

  constructor(windowMs = 1000) { this._windowMs = windowMs; }

  record(bytes: number): void {
    this._samples.push({ timestamp: Date.now(), bytes });
    this._gc();
  }

  bytesPerSecond(): number {
    this._gc();
    const total = this._samples.reduce((s, x) => s + x.bytes, 0);
    return total / (this._windowMs / 1000);
  }

  peakBytesPerSecond(): number {
    this._gc();
    const grouped = new Map<number, number>();
    this._samples.forEach(s => {
      const sec = Math.floor(s.timestamp / 1000);
      grouped.set(sec, (grouped.get(sec) || 0) + s.bytes);
    });
    let peak = 0;
    grouped.forEach(b => { if (b > peak) peak = b; });
    return peak;
  }

  sampleCount(): number { return this._samples.length; }

  private _gc(): void {
    const cutoff = Date.now() - this._windowMs;
    this._samples = this._samples.filter(s => s.timestamp >= cutoff);
  }
}

// V4658: LatencyTracker — 延迟追踪（p50/p95/p99 估算）
export class LatencyTracker {
  private _samples: number[] = [];
  private _maxSamples: number;

  constructor(maxSamples = 1000) { this._maxSamples = maxSamples; }

  record(ms: number): void {
    this._samples.push(ms);
    if (this._samples.length > this._maxSamples) this._samples.shift();
  }

  percentile(p: number): number {
    if (this._samples.length === 0) return 0;
    const sorted = [...this._samples].sort((a, b) => a - b);
    const idx = Math.floor((p / 100) * sorted.length);
    return sorted[Math.min(idx, sorted.length - 1)];
  }

  average(): number {
    if (this._samples.length === 0) return 0;
    return this._samples.reduce((s, x) => s + x, 0) / this._samples.length;
  }

  reset(): void { this._samples = []; }
  count(): number { return this._samples.length; }
}

// V4659: SyncConflictResolver — 同步冲突解决（last-write-wins + 版本号）
export interface ConflictingOp {
  id: string;
  version: number;
  data: string;
  timestamp: number;
}

export class SyncConflictResolver {
  resolve(local: ConflictingOp, remote: ConflictingOp): ConflictingOp {
    if (local.version > remote.version) return local;
    if (remote.version > local.version) return remote;
    // Same version: latest timestamp wins
    return local.timestamp >= remote.timestamp ? local : remote;
  }

  resolveBatch(pairs: [ConflictingOp, ConflictingOp][]): ConflictingOp[] {
    return pairs.map(([l, r]) => this.resolve(l, r));
  }

  hasConflict(local: ConflictingOp, remote: ConflictingOp): boolean {
    return local.id === remote.id && local.version === remote.version && local.data !== remote.data;
  }

  versionGap(local: ConflictingOp, remote: ConflictingOp): number {
    return Math.abs(local.version - remote.version);
  }
}

// V4660: OperationLog — 操作日志（追加 only + replay）
export interface LoggedOp {
  seq: number;
  op: string;
  data: string;
  timestamp: number;
}

export class OperationLog {
  private _log: LoggedOp[] = [];
  private _seq = 0;

  append(op: string, data: string): LoggedOp {
    const entry: LoggedOp = { seq: this._seq++, op, data, timestamp: Date.now() };
    this._log.push(entry);
    return entry;
  }

  replay(fromSeq = 0): LoggedOp[] {
    return this._log.filter(e => e.seq >= fromSeq);
  }

  get(seq: number): LoggedOp | undefined {
    return this._log.find(e => e.seq === seq);
  }

  trim(keep = 100): number {
    if (this._log.length <= keep) return 0;
    const removed = this._log.length - keep;
    this._log = this._log.slice(-keep);
    return removed;
  }

  size(): number { return this._log.length; }
  latest(): LoggedOp | undefined {
    return this._log[this._log.length - 1];
  }
}

// V4661: MessagePriorityQueue — 优先级队列
export interface PriorityMessage {
  priority: number; // higher = more important
  payload: string;
  enqueuedAt: number;
}

export class MessagePriorityQueue {
  private _queue: PriorityMessage[] = [];

  enqueue(msg: PriorityMessage): void {
    this._queue.push(msg);
    this._queue.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): PriorityMessage | undefined {
    return this._queue.shift();
  }

  peek(): PriorityMessage | undefined {
    return this._queue[0];
  }

  size(): number { return this._queue.length; }

  drain(max = Infinity): PriorityMessage[] {
    const out = this._queue.splice(0, max);
    return out;
  }

  clear(): void { this._queue = []; }
}

// V4662: BatchSendBuffer — 批量发送缓冲（按 size 或 time flush）
export interface BufferedMessage {
  id: string;
  data: string;
  enqueuedAt: number;
}

export class BatchSendBuffer {
  private _buffer: BufferedMessage[] = [];
  private _maxSize: number;
  private _maxWaitMs: number;
  private _firstEnqueueTime = 0;

  constructor(maxSize = 10, maxWaitMs = 100) {
    this._maxSize = maxSize;
    this._maxWaitMs = maxWaitMs;
  }

  enqueue(msg: BufferedMessage): boolean {
    if (this._buffer.length === 0) this._firstEnqueueTime = Date.now();
    this._buffer.push(msg);
    return this._buffer.length >= this._maxSize;
  }

  shouldFlush(): boolean {
    if (this._buffer.length === 0) return false;
    if (this._buffer.length >= this._maxSize) return true;
    return Date.now() - this._firstEnqueueTime >= this._maxWaitMs;
  }

  flush(): BufferedMessage[] {
    const out = [...this._buffer];
    this._buffer = [];
    this._firstEnqueueTime = 0;
    return out;
  }

  size(): number { return this._buffer.length; }
  clear(): void { this._buffer = []; this._firstEnqueueTime = 0; }
}

// V4663: ChannelMultiplexer — 通道多路复用（多 channel 共享单连接）
export class ChannelMultiplexer {
  private _channels: Map<string, { name: string; createdAt: number; msgCount: number }> = new Map();

  open(name: string): void {
    if (!this._channels.has(name)) {
      this._channels.set(name, { name, createdAt: Date.now(), msgCount: 0 });
    }
  }

  close(name: string): boolean {
    return this._channels.delete(name);
  }

  recordMessage(channel: string): void {
    const c = this._channels.get(channel);
    if (c) c.msgCount++;
  }

  list(): string[] { return Array.from(this._channels.keys()); }

  msgCount(channel: string): number {
    return this._channels.get(channel)?.msgCount || 0;
  }

  totalMessages(): number {
    let n = 0;
    this._channels.forEach(c => { n += c.msgCount; });
    return n;
  }

  age(channel: string): number {
    const c = this._channels.get(channel);
    return c ? Date.now() - c.createdAt : 0;
  }

  size(): number { return this._channels.size; }
}

// V4664: SubscriptionRegistry — 订阅注册表（topic-based pub-sub）
export type SubscriptionHandler = (payload: string) => void;

export class SubscriptionRegistry {
  private _subs: Map<string, Set<SubscriptionHandler>> = new Map();

  subscribe(topic: string, handler: SubscriptionHandler): void {
    if (!this._subs.has(topic)) this._subs.set(topic, new Set());
    this._subs.get(topic)!.add(handler);
  }

  unsubscribe(topic: string, handler: SubscriptionHandler): void {
    const s = this._subs.get(topic);
    if (s) s.delete(handler);
  }

  publish(topic: string, payload: string): number {
    const handlers = this._subs.get(topic);
    if (!handlers) return 0;
    let count = 0;
    handlers.forEach(h => { h(payload); count++; });
    return count;
  }

  topicCount(): number { return this._subs.size; }
  subscriberCount(topic: string): number {
    return this._subs.get(topic)?.size || 0;
  }

  topics(): string[] { return Array.from(this._subs.keys()); }
}

// V4665: SyncMetricsAggregator — 同步指标聚合
export class SyncMetricsAggregator {
  private _counters: Map<string, number> = new Map();
  private _gauges: Map<string, number> = new Map();

  increment(name: string, by = 1): void {
    this._counters.set(name, (this._counters.get(name) || 0) + by);
  }

  gauge(name: string, value: number): void {
    this._gauges.set(name, value);
  }

  counter(name: string): number {
    return this._counters.get(name) || 0;
  }

  gaugeValue(name: string): number {
    return this._gauges.get(name) || 0;
  }

  snapshot(): { counters: Record<string, number>; gauges: Record<string, number> } {
    const counters: Record<string, number> = {};
    const gauges: Record<string, number> = {};
    this._counters.forEach((v, k) => { counters[k] = v; });
    this._gauges.forEach((v, k) => { gauges[k] = v; });
    return { counters, gauges };
  }

  reset(): void { this._counters.clear(); this._gauges.clear(); }
  counterNames(): string[] { return Array.from(this._counters.keys()); }
  gaugeNames(): string[] { return Array.from(this._gauges.keys()); }
}

export const WS_SYNC_BATCH_2_ENGINES: readonly string[] = [
  'AdaptiveRateLimiter', 'BandwidthMonitor', 'LatencyTracker', 'SyncConflictResolver',
  'OperationLog', 'MessagePriorityQueue', 'BatchSendBuffer', 'ChannelMultiplexer',
  'SubscriptionRegistry', 'SyncMetricsAggregator',
];

export class WSSyncAdvancedIndex {
  list(): string[] { return [...WS_SYNC_BATCH_2_ENGINES, 'WSSyncAdvancedIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}