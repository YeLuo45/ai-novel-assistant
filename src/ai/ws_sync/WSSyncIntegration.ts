// Round 8 Direction CC — WebSocket Real-time Sync 2.0 Batch 3/3
// V4666-V4675: SyncSession + Endpoints + Room + Presence + DocumentSync + CursorSync + Awareness + Backoff + PartialDiff + Integration

import {
  BinaryFrameCodec, MessageCompressor, ConnectionPool, HeartbeatManager,
  ReconnectWithBackoff, MessageDeduplicator, SequenceNumberTracker,
  AckReceiptTracker, MessageRouter, ProtocolVersionNegotiator,
  WS_SYNC_BATCH_1_ENGINES,
} from './WSSyncCore';
import {
  AdaptiveRateLimiter, BandwidthMonitor, LatencyTracker, SyncConflictResolver,
  OperationLog, MessagePriorityQueue, BatchSendBuffer, ChannelMultiplexer,
  SubscriptionRegistry, SyncMetricsAggregator,
  WS_SYNC_BATCH_2_ENGINES,
} from './WSSyncAdvanced';

// V4666: SyncSession — session 顶层 (持有所有引擎引用)
export interface SyncSessionConfig {
  maxConnections: number;
  heartbeatMs: number;
  bandwidthWindowMs: number;
}

export class SyncSession {
  readonly id: string;
  readonly codec: BinaryFrameCodec;
  readonly compressor: MessageCompressor;
  readonly pool: ConnectionPool;
  readonly heartbeat: HeartbeatManager;
  readonly reconnect: ReconnectWithBackoff;
  readonly dedup: MessageDeduplicator;
  readonly sequence: SequenceNumberTracker;
  readonly ack: AckReceiptTracker;
  readonly router: MessageRouter;
  readonly protocol: ProtocolVersionNegotiator;
  readonly rateLimiter: AdaptiveRateLimiter;
  readonly bandwidth: BandwidthMonitor;
  readonly latency: LatencyTracker;
  readonly conflict: SyncConflictResolver;
  readonly opLog: OperationLog;
  readonly queue: MessagePriorityQueue;
  readonly batch: BatchSendBuffer;
  readonly multiplexer: ChannelMultiplexer;
  readonly subs: SubscriptionRegistry;
  readonly metrics: SyncMetricsAggregator;
  readonly createdAt: number;

  constructor(id: string, config: SyncSessionConfig) {
    this.id = id;
    this.createdAt = Date.now();
    this.codec = new BinaryFrameCodec();
    this.compressor = new MessageCompressor();
    this.pool = new ConnectionPool(config.maxConnections);
    this.heartbeat = new HeartbeatManager(config.heartbeatMs);
    this.reconnect = new ReconnectWithBackoff();
    this.dedup = new MessageDeduplicator();
    this.sequence = new SequenceNumberTracker();
    this.ack = new AckReceiptTracker();
    this.router = new MessageRouter();
    this.protocol = new ProtocolVersionNegotiator();
    this.rateLimiter = new AdaptiveRateLimiter();
    this.bandwidth = new BandwidthMonitor(config.bandwidthWindowMs);
    this.latency = new LatencyTracker();
    this.conflict = new SyncConflictResolver();
    this.opLog = new OperationLog();
    this.queue = new MessagePriorityQueue();
    this.batch = new BatchSendBuffer();
    this.multiplexer = new ChannelMultiplexer();
    this.subs = new SubscriptionRegistry();
    this.metrics = new SyncMetricsAggregator();
  }

  age(): number { return Date.now() - this.createdAt; }
}

// V4667: EndpointRegistry — endpoint 注册 (URL + handler)
export interface EndpointSpec {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (payload: string) => string;
}

export class EndpointRegistry {
  private _endpoints: EndpointSpec[] = [];

  register(spec: EndpointSpec): void { this._endpoints.push(spec); }

  route(path: string, method: string): EndpointSpec | undefined {
    return this._endpoints.find(e => e.path === path && e.method === method);
  }

  paths(): string[] {
    return Array.from(new Set(this._endpoints.map(e => e.path)));
  }

  size(): number { return this._endpoints.length; }

  unregister(path: string, method: string): boolean {
    const before = this._endpoints.length;
    this._endpoints = this._endpoints.filter(e => !(e.path === path && e.method === method));
    return this._endpoints.length < before;
  }
}

// V4668: SyncRoom — 多端房间
export interface RoomMember {
  id: string;
  joinedAt: number;
  lastActiveAt: number;
  role: 'owner' | 'editor' | 'viewer';
}

export class SyncRoom {
  private _members: Map<string, RoomMember> = new Map();
  readonly id: string;

  constructor(id: string) { this.id = id; }

  join(id: string, role: RoomMember['role'] = 'editor'): void {
    this._members.set(id, { id, joinedAt: Date.now(), lastActiveAt: Date.now(), role });
  }

  leave(id: string): boolean {
    return this._members.delete(id);
  }

  heartbeat(id: string): void {
    const m = this._members.get(id);
    if (m) m.lastActiveAt = Date.now();
  }

  members(): RoomMember[] { return Array.from(this._members.values()); }

  size(): number { return this._members.size; }

  activeMembers(maxIdleMs = 30000): RoomMember[] {
    const now = Date.now();
    return this.members().filter(m => now - m.lastActiveAt < maxIdleMs);
  }

  hasMember(id: string): boolean { return this._members.has(id); }

  evict(maxIdleMs = 300000): number {
    const now = Date.now();
    let removed = 0;
    this._members.forEach((m, id) => {
      if (now - m.lastActiveAt >= maxIdleMs) {
        this._members.delete(id);
        removed++;
      }
    });
    return removed;
  }
}

// V4669: PresenceBeacon — 在线状态广播
export interface PresenceRecord {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastBeat: number;
  metadata?: Record<string, string>;
}

export class PresenceBeacon {
  private _records: Map<string, PresenceRecord> = new Map();

  update(userId: string, status: PresenceRecord['status'], metadata?: Record<string, string>): void {
    this._records.set(userId, { userId, status, lastBeat: Date.now(), metadata });
  }

  get(userId: string): PresenceRecord | undefined {
    return this._records.get(userId);
  }

  online(): PresenceRecord[] {
    return Array.from(this._records.values()).filter(r => r.status === 'online');
  }

  away(): PresenceRecord[] {
    return Array.from(this._records.values()).filter(r => r.status === 'away');
  }

  offline(): PresenceRecord[] {
    return Array.from(this._records.values()).filter(r => r.status === 'offline');
  }

  count(): number { return this._records.size; }

  cleanup(maxAgeMs = 60000): number {
    const now = Date.now();
    let removed = 0;
    this._records.forEach((r, id) => {
      if (now - r.lastBeat >= maxAgeMs) {
        this._records.delete(id);
        removed++;
      }
    });
    return removed;
  }

  set(userId: string, status: PresenceRecord['status']): void {
    const r = this._records.get(userId);
    if (r) {
      r.status = status;
      r.lastBeat = Date.now();
    } else {
      this._records.set(userId, { userId, status, lastBeat: Date.now() });
    }
  }
}

// V4670: DocumentSync — 文档同步引擎
export interface DocumentVersion {
  version: number;
  content: string;
  author: string;
  timestamp: number;
}

export class DocumentSync {
  private _versions: DocumentVersion[] = [];
  readonly id: string;

  constructor(id: string, initialContent = '', author = 'system') {
    this.id = id;
    this._versions.push({ version: 1, content: initialContent, author, timestamp: Date.now() });
  }

  update(content: string, author: string): DocumentVersion {
    const v: DocumentVersion = {
      version: this._versions.length + 1,
      content,
      author,
      timestamp: Date.now(),
    };
    this._versions.push(v);
    return v;
  }

  current(): DocumentVersion { return this._versions[this._versions.length - 1]; }

  get(v: number): DocumentVersion | undefined {
    return this._versions.find(x => x.version === v);
  }

  applyRemote(v: DocumentVersion): boolean {
    // Append if version is next expected
    if (v.version === this._versions.length + 1) {
      this._versions.push(v);
      return true;
    }
    return false;
  }

  history(): DocumentVersion[] { return [...this._versions]; }

  versionCount(): number { return this._versions.length; }
}

// V4671: CursorSync — 鼠标光标同步
export interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  selection?: string;
  timestamp: number;
}

export class CursorSync {
  private _cursors: Map<string, CursorPosition> = new Map();
  private _maxAgeMs: number;

  constructor(maxAgeMs = 5000) { this._maxAgeMs = maxAgeMs; }

  update(pos: Omit<CursorPosition, 'timestamp'>): void {
    this._cursors.set(pos.userId, { ...pos, timestamp: Date.now() });
  }

  get(userId: string): CursorPosition | undefined {
    const c = this._cursors.get(userId);
    if (!c) return undefined;
    if (Date.now() - c.timestamp > this._maxAgeMs) {
      this._cursors.delete(userId);
      return undefined;
    }
    return c;
  }

  all(): CursorPosition[] {
    const now = Date.now();
    const out: CursorPosition[] = [];
    this._cursors.forEach((c, id) => {
      if (now - c.timestamp <= this._maxAgeMs) out.push(c);
      else this._cursors.delete(id);
    });
    return out;
  }

  remove(userId: string): void { this._cursors.delete(userId); }
  size(): number { return this._cursors.size; }
}

// V4672: AwarenessProtocol — awareness 协议 (status + metadata)
export interface AwarenessState {
  userId: string;
  status: 'focused' | 'unfocused' | 'idle';
  activity: string;
  updatedAt: number;
}

export class AwarenessProtocol {
  private _states: Map<string, AwarenessState> = new Map();

  setState(state: AwarenessState): void {
    this._states.set(state.userId, { ...state, updatedAt: Date.now() });
  }

  getState(userId: string): AwarenessState | undefined {
    return this._states.get(userId);
  }

  statesForActivity(activity: string): AwarenessState[] {
    return Array.from(this._states.values()).filter(s => s.activity === activity);
  }

  count(): number { return this._states.size; }

  focused(): AwarenessState[] {
    return Array.from(this._states.values()).filter(s => s.status === 'focused');
  }

  unfocused(): AwarenessState[] {
    return Array.from(this._states.values()).filter(s => s.status === 'unfocused');
  }
}

// V4673: BackoffRetry — backoff 重试封装
export class BackoffRetry {
  private _attempts = 0;
  private _maxAttempts: number;
  private _baseMs: number;

  constructor(maxAttempts = 5, baseMs = 100) {
    this._maxAttempts = maxAttempts;
    this._baseMs = baseMs;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    while (this._attempts < this._maxAttempts) {
      try {
        const result = await fn();
        this._attempts = 0;
        return result;
      } catch (e) {
        lastError = e;
        this._attempts++;
        if (this._attempts >= this._maxAttempts) break;
        await new Promise(r => setTimeout(r, this._baseMs * Math.pow(2, this._attempts - 1)));
      }
    }
    throw lastError;
  }

  reset(): void { this._attempts = 0; }
  attempt(): number { return this._attempts; }
}

// V4674: PartialDiffSync — 局部 diff 同步（仅传差异，按行 index）
export interface DiffLine {
  index: number;
  line: string;
}

export class PartialDiffSync {
  computeDiff(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff: DiffLine[] = [];
    const max = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < max; i++) {
      if (oldLines[i] !== newLines[i]) {
        diff.push({ index: i, line: newLines[i] || '' });
      }
    }
    return diff;
  }

  applyDiff(baseText: string, diff: DiffLine[]): string {
    const baseLines = baseText.split('\n');
    diff.forEach(({ index, line }) => {
      if (index < baseLines.length) baseLines[index] = line;
    });
    return baseLines.join('\n');
  }

  diffSize(diff: DiffLine[]): number {
    return diff.reduce((s, d) => s + d.line.length, 0);
  }

  compressionRatio(oldText: string, newText: string): number {
    const fullSize = newText.length;
    if (fullSize === 0) return 0;
    const diff = this.computeDiff(oldText, newText);
    return this.diffSize(diff) / fullSize;
  }
}

// V4675: SyncIntegration — 顶层集成 + 端到端 demo
export class SyncIntegration {
  private _session: SyncSession;
  private _endpoints: EndpointRegistry;
  private _rooms: Map<string, SyncRoom> = new Map();
  private _presence: PresenceBeacon;
  private _documents: Map<string, DocumentSync> = new Map();
  private _cursors: CursorSync;
  private _awareness: AwarenessProtocol;
  private _backoff: BackoffRetry;
  private _partialDiff: PartialDiffSync;

  constructor(config: SyncSessionConfig) {
    this._session = new SyncSession(`sync-${Date.now()}`, config);
    this._endpoints = new EndpointRegistry();
    this._presence = new PresenceBeacon();
    this._cursors = new CursorSync();
    this._awareness = new AwarenessProtocol();
    this._backoff = new BackoffRetry();
    this._partialDiff = new PartialDiffSync();
  }

  registerEndpoint(spec: EndpointSpec): void { this._endpoints.register(spec); }

  createRoom(id: string): SyncRoom {
    const room = new SyncRoom(id);
    this._rooms.set(id, room);
    return room;
  }

  getRoom(id: string): SyncRoom | undefined { return this._rooms.get(id); }

  createDocument(id: string, content = ''): DocumentSync {
    const doc = new DocumentSync(id, content);
    this._documents.set(id, doc);
    return doc;
  }

  getDocument(id: string): DocumentSync | undefined { return this._documents.get(id); }

  runDemo(): {
    roomCount: number;
    docVersions: number;
    endpoints: number;
    metrics: { counters: Record<string, number>; gauges: Record<string, number> };
  } {
    // Create room
    const room = this.createRoom('demo-room');
    room.join('user1', 'owner');
    room.join('user2', 'editor');
    room.heartbeat('user1');

    // Create document
    const doc = this.createDocument('demo-doc', 'initial content');
    doc.update('updated content', 'user1');
    doc.update('final content', 'user2');

    // Register endpoint
    this.registerEndpoint({ path: '/sync', method: 'POST', handler: (p) => `echo: ${p}` });

    // Presence
    this._presence.update('user1', 'online');
    this._presence.update('user2', 'online');

    // Awareness
    this._awareness.setState({ userId: 'user1', status: 'focused', activity: 'editing', updatedAt: Date.now() });

    // Metrics
    this._session.metrics.increment('demo_runs', 1);
    this._session.metrics.gauge('active_users', room.activeMembers().length);

    // OpLog
    this._session.opLog.append('doc_update', 'demo-doc v2');

    return {
      roomCount: this._rooms.size,
      docVersions: doc.versionCount(),
      endpoints: this._endpoints.size(),
      metrics: this._session.metrics.snapshot(),
    };
  }

  session(): SyncSession { return this._session; }
  endpoints(): EndpointRegistry { return this._endpoints; }
  rooms(): Map<string, SyncRoom> { return this._rooms; }
  presence(): PresenceBeacon { return this._presence; }
  cursors(): CursorSync { return this._cursors; }
  awareness(): AwarenessProtocol { return this._awareness; }
  partialDiff(): PartialDiffSync { return this._partialDiff; }
}

export const WS_SYNC_BATCH_3_ENGINES: readonly string[] = [
  'SyncSession', 'EndpointRegistry', 'SyncRoom', 'PresenceBeacon',
  'DocumentSync', 'CursorSync', 'AwarenessProtocol', 'BackoffRetry',
  'PartialDiffSync', 'SyncIntegration',
];

export class WSSyncIntegrationIndex {
  list(): string[] { return [...WS_SYNC_BATCH_3_ENGINES, 'WSSyncIntegrationIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}

export class WSSyncMasterIndex {
  list(): string[] {
    return [...WS_SYNC_BATCH_1_ENGINES, ...WS_SYNC_BATCH_2_ENGINES, ...WS_SYNC_BATCH_3_ENGINES, 'WSSyncMasterIndex'];
  }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}