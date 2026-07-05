// Round 8 Direction CE — Offline-First Storage 2.0 Batch 2/3
// V4716-V4725: Retry + Cache + Offline-first + Migration + Schema + Encryption + Compression + ChangeLog + Timestamp + Optimistic

// V4716: BackgroundSyncRetryManager — 后台同步重试（指数退避）
export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class BackgroundSyncRetryManager {
  private _policy: RetryPolicy;
  private _history: Map<string, { attempts: number; lastError?: string }> = new Map();

  constructor(policy: Partial<RetryPolicy> = {}) {
    this._policy = {
      maxAttempts: policy.maxAttempts ?? 5,
      baseDelayMs: policy.baseDelayMs ?? 1000,
      maxDelayMs: policy.maxDelayMs ?? 60000,
      backoffMultiplier: policy.backoffMultiplier ?? 2,
    };
  }

  nextDelayMs(attempt: number): number {
    if (attempt > this._policy.maxAttempts) return -1;
    const delay = this._policy.baseDelayMs * Math.pow(this._policy.backoffMultiplier, attempt - 1);
    return Math.min(delay, this._policy.maxDelayMs);
  }

  shouldRetry(attempt: number): boolean {
    return attempt <= this._policy.maxAttempts;
  }

  recordAttempt(id: string, error?: string): number {
    const existing = this._history.get(id) || { attempts: 0 };
    existing.attempts++;
    if (error) existing.lastError = error;
    this._history.set(id, existing);
    return existing.attempts;
  }

  attempts(id: string): number { return this._history.get(id)?.attempts || 0; }
  lastError(id: string): string | undefined { return this._history.get(id)?.lastError; }
  reset(id: string): void { this._history.delete(id); }

  policy(): RetryPolicy { return { ...this._policy }; }
}

// V4717: RequestCacheManager — 请求缓存（TTL）
export interface CachedResponse {
  url: string;
  status: number;
  body: string;
  headers: Record<string, string>;
  cachedAt: number;
  ttlMs: number;
}

export class RequestCacheManager {
  private _cache: Map<string, CachedResponse> = new Map();

  put(resp: Omit<CachedResponse, 'cachedAt'>): void {
    this._cache.set(resp.url, { ...resp, cachedAt: Date.now() });
  }

  get(url: string): CachedResponse | undefined {
    const r = this._cache.get(url);
    if (!r) return undefined;
    if (Date.now() - r.cachedAt > r.ttlMs) {
      this._cache.delete(url);
      return undefined;
    }
    return r;
  }

  isFresh(url: string): boolean {
    const r = this._cache.get(url);
    return !!r && Date.now() - r.cachedAt <= r.ttlMs;
  }

  invalidate(url: string): boolean { return this._cache.delete(url); }

  invalidateMatching(predicate: (url: string) => boolean): number {
    let n = 0;
    this._cache.forEach((_, url) => {
      if (predicate(url)) { this._cache.delete(url); n++; }
    });
    return n;
  }

  size(): number { return this._cache.size; }
  clear(): void { this._cache.clear(); }
}

// V4718: OfflineFirstCache — offline-first 缓存层（网络失败用缓存）
export class OfflineFirstCache<T> {
  private _cache: Map<string, { value: T; cachedAt: number }> = new Map();
  private _staleAfterMs: number;

  constructor(staleAfterMs = 60000) { this._staleAfterMs = staleAfterMs; }

  set(key: string, value: T): void {
    this._cache.set(key, { value, cachedAt: Date.now() });
  }

  getFresh(key: string): T | undefined {
    const e = this._cache.get(key);
    if (!e) return undefined;
    if (Date.now() - e.cachedAt > this._staleAfterMs) return undefined;
    return e.value;
  }

  getStale(key: string): T | undefined {
    return this._cache.get(key)?.value;
  }

  age(key: string): number {
    const e = this._cache.get(key);
    return e ? Date.now() - e.cachedAt : -1;
  }

  isStale(key: string): boolean {
    const e = this._cache.get(key);
    if (!e) return true;
    return Date.now() - e.cachedAt > this._staleAfterMs;
  }

  delete(key: string): boolean { return this._cache.delete(key); }
  size(): number { return this._cache.size; }
  clear(): void { this._cache.clear(); }
}

// V4719: DataMigrationManager — 数据迁移 (版本链)
export interface Migration {
  fromVersion: number;
  toVersion: number;
  migrate: (data: any) => any;
  description?: string;
}

export class DataMigrationManager {
  private _migrations: Migration[] = [];

  add(m: Migration): void { this._migrations.push(m); }

  find(fromVersion: number, toVersion: number): Migration | undefined {
    return this._migrations.find(m => m.fromVersion === fromVersion && m.toVersion === toVersion);
  }

  migrate(fromVersion: number, toVersion: number, data: any): { data: any; applied: number } {
    let current = data;
    let applied = 0;
    let currentVersion = fromVersion;
    while (currentVersion < toVersion) {
      const m = this._migrations.find(mig => mig.fromVersion === currentVersion && mig.toVersion === currentVersion + 1);
      if (!m) break;
      current = m.migrate(current);
      currentVersion = m.toVersion;
      applied++;
    }
    return { data: current, applied };
  }

  versions(): number[] {
    const set = new Set<number>();
    this._migrations.forEach(m => { set.add(m.fromVersion); set.add(m.toVersion); });
    return Array.from(set).sort((a, b) => a - b);
  }
}

// V4720: SchemaVersionManager — schema 版本管理
export class SchemaVersionManager {
  private _currentVersion = 1;
  private _history: { version: number; timestamp: number; changes: string[] }[] = [];

  setVersion(v: number, changes: string[] = []): void {
    this._currentVersion = v;
    this._history.push({ version: v, timestamp: Date.now(), changes });
  }

  current(): number { return this._currentVersion; }

  history(): { version: number; timestamp: number; changes: string[] }[] {
    return [...this._history];
  }

  isCompatibleWith(v: number): boolean { return v === this._currentVersion; }

  needsUpgrade(v: number): boolean { return v < this._currentVersion; }

  needsDowngrade(v: number): boolean { return v > this._currentVersion; }
}

// V4721: DataEncryptionLayer — 数据加密层 (XOR + 简单 hash)
export class DataEncryptionLayer {
  private _key: string;

  constructor(key: string) { this._key = key; }

  encrypt(plaintext: string): string {
    const keyBytes = new TextEncoder().encode(this._key);
    const data = new TextEncoder().encode(plaintext);
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      out[i] = data[i] ^ keyBytes[i % keyBytes.length];
    }
    return btoa(String.fromCharCode(...out));
  }

  decrypt(ciphertext: string): string {
    const binary = atob(ciphertext);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const keyBytes = new TextEncoder().encode(this._key);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(out);
  }

  rotateKey(newKey: string): void { this._key = newKey; }

  hash(data: string): string {
    let h = 2166136261;
    for (let i = 0; i < data.length; i++) {
      h ^= data.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h.toString(16);
  }
}

// V4722: CompressedStorage — 压缩存储 (RLE + dictionary)
export class CompressedStorage {
  private _dictionary: Map<string, string> = new Map();
  private _store: Map<string, string> = new Map();

  compress(text: string): string {
    let compressed = text.replace(/(.)\1{2,}/g, (m, c) => `${c}{${m.length}}`);
    let code = 0;
    const words = compressed.match(/[a-zA-Z]{4,}/g) || [];
    const counts = new Map<string, number>();
    words.forEach(w => counts.set(w, (counts.get(w) || 0) + 1));
    counts.forEach((cnt, w) => {
      if (cnt >= 2 && code < 20) {
        const placeholder = `${code}`;
        this._dictionary.set(placeholder, w);
        compressed = compressed.split(w).join(placeholder);
        code++;
      }
    });
    return compressed;
  }

  decompress(compressed: string): string {
    let result = compressed;
    this._dictionary.forEach((value, placeholder) => {
      result = result.split(placeholder).join(value);
    });
    result = result.replace(/(.)\{(\d+)\}/g, (_m, c, n) => c.repeat(parseInt(n)));
    return result;
  }

  store(key: string, text: string): { originalSize: number; compressedSize: number } {
    const compressed = this.compress(text);
    this._store.set(key, compressed);
    return { originalSize: text.length, compressedSize: compressed.length };
  }

  load(key: string): string | undefined {
    const compressed = this._store.get(key);
    return compressed ? this.decompress(compressed) : undefined;
  }

  ratio(originalSize: number, compressedSize: number): number {
    return originalSize === 0 ? 0 : compressedSize / originalSize;
  }
}

// V4723: OfflineChangeLog — 离线变更日志 (追加 only + replay)
export interface ChangeLogEntry {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: any;
  timestamp: number;
  synced: boolean;
}

export class OfflineChangeLog {
  private _entries: ChangeLogEntry[] = [];
  private _seq = 0;

  record(op: 'create' | 'update' | 'delete', collection: string, docId: string, data?: any): ChangeLogEntry {
    const e: ChangeLogEntry = {
      id: `cl-${this._seq++}`,
      operation: op,
      collection,
      docId,
      data,
      timestamp: Date.now(),
      synced: false,
    };
    this._entries.push(e);
    return e;
  }

  markSynced(id: string): boolean {
    const e = this._entries.find(x => x.id === id);
    if (!e) return false;
    e.synced = true;
    return true;
  }

  unsynced(): ChangeLogEntry[] { return this._entries.filter(e => !e.synced); }
  synced(): ChangeLogEntry[] { return this._entries.filter(e => e.synced); }

  byCollection(coll: string): ChangeLogEntry[] {
    return this._entries.filter(e => e.collection === coll);
  }

  size(): number { return this._entries.length; }

  clear(): void { this._entries = []; this._seq = 0; }
}

// V4724: SyncTimestampTracker — 同步时间戳追踪
export class SyncTimestampTracker {
  private _lastSync: Map<string, number> = new Map();

  recordSync(scope: string, ts = Date.now()): void { this._lastSync.set(scope, ts); }

  lastSync(scope: string): number { return this._lastSync.get(scope) || 0; }

  msSinceSync(scope: string): number {
    const last = this.lastSync(scope);
    return last === 0 ? Infinity : Date.now() - last;
  }

  needsSync(scope: string, maxAgeMs = 60000): boolean {
    const last = this.lastSync(scope);
    if (last === 0) return true;
    return Date.now() - last > maxAgeMs;
  }

  scopes(): string[] { return Array.from(this._lastSync.keys()); }
  clear(): void { this._lastSync.clear(); }
}

// V4725: OptimisticUpdateManager — 乐观更新（先本地应用，后同步）
export interface OptimisticUpdate {
  id: string;
  appliedAt: number;
  collection: string;
  docId: string;
  data: any;
  confirmed: boolean;
  rolledBack: boolean;
}

export class OptimisticUpdateManager {
  private _updates: OptimisticUpdate[] = [];

  apply(coll: string, docId: string, data: any): OptimisticUpdate {
    const u: OptimisticUpdate = {
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      appliedAt: Date.now(),
      collection: coll,
      docId,
      data,
      confirmed: false,
      rolledBack: false,
    };
    this._updates.push(u);
    return u;
  }

  confirm(id: string): boolean {
    const u = this._updates.find(x => x.id === id);
    if (!u) return false;
    u.confirmed = true;
    return true;
  }

  rollback(id: string): boolean {
    const u = this._updates.find(x => x.id === id);
    if (!u) return false;
    u.rolledBack = true;
    return true;
  }

  pending(): OptimisticUpdate[] {
    return this._updates.filter(u => !u.confirmed && !u.rolledBack);
  }

  confirmed(): OptimisticUpdate[] {
    return this._updates.filter(u => u.confirmed);
  }

  rolledBack(): OptimisticUpdate[] {
    return this._updates.filter(u => u.rolledBack);
  }

  size(): number { return this._updates.length; }
  clear(): void { this._updates = []; }
}

export const OFFLINE_BATCH_2_ENGINES: readonly string[] = [
  'BackgroundSyncRetryManager', 'RequestCacheManager', 'OfflineFirstCache',
  'DataMigrationManager', 'SchemaVersionManager', 'DataEncryptionLayer',
  'CompressedStorage', 'OfflineChangeLog', 'SyncTimestampTracker', 'OptimisticUpdateManager',
];

export class OfflineAdvancedIndex {
  list(): string[] { return [...OFFLINE_BATCH_2_ENGINES, 'OfflineAdvancedIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}