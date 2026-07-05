// Round 8 Direction CE — Offline-First Storage 2.0 Batch 1/3
// V4706-V4715: LocalStorage + IndexedDB + Quota + Estimate + OfflineDB + SyncQueue + Conflict + LWW + 3Way + Token

// V4706: LocalStorageAdapter — 浏览器 localStorage 包装 (with in-memory fallback for SSR)
export class LocalStorageAdapter {
  private _store: Map<string, string> = new Map();
  private _useReal = false;

  constructor(useReal = false) { this._useReal = useReal && typeof localStorage !== 'undefined'; }

  setItem(key: string, value: string): void {
    if (this._useReal) localStorage.setItem(key, value);
    else this._store.set(key, value);
  }

  getItem(key: string): string | null {
    if (this._useReal) return localStorage.getItem(key);
    return this._store.get(key) ?? null;
  }

  removeItem(key: string): void {
    if (this._useReal) localStorage.removeItem(key);
    else this._store.delete(key);
  }

  clear(): void {
    if (this._useReal) localStorage.clear();
    else this._store.clear();
  }

  key(index: number): string | null {
    if (this._useReal) return localStorage.key(index);
    return Array.from(this._store.keys())[index] ?? null;
  }

  get length(): number {
    return this._useReal ? localStorage.length : this._store.size;
  }
}

// V4707: IndexedDBAdapter — IndexedDB 模拟 (in-memory)
export interface IDBStore {
  name: string;
  data: Map<string, any>;
  keyPath: string;
}

export class IndexedDBAdapter {
  private _stores: Map<string, IDBStore> = new Map();

  createStore(name: string, keyPath = 'id'): void {
    this._stores.set(name, { name, data: new Map(), keyPath });
  }

  put(storeName: string, value: any): void {
    const store = this._stores.get(storeName);
    if (!store) throw new Error(`Store ${storeName} not found`);
    const key = value[store.keyPath];
    if (key === undefined) throw new Error(`Missing keyPath ${store.keyPath}`);
    store.data.set(String(key), value);
  }

  get(storeName: string, key: any): any | undefined {
    return this._stores.get(storeName)?.data.get(String(key));
  }

  delete(storeName: string, key: any): boolean {
    return this._stores.get(storeName)?.data.delete(String(key)) || false;
  }

  getAll(storeName: string): any[] {
    return Array.from(this._stores.get(storeName)?.data.values() || []);
  }

  count(storeName: string): number {
    return this._stores.get(storeName)?.data.size || 0;
  }

  deleteStore(name: string): boolean {
    return this._stores.delete(name);
  }

  storeNames(): string[] { return Array.from(this._stores.keys()); }
}

// V4708: StorageQuotaManager — 配额管理 (limits + cleanup)
export class StorageQuotaManager {
  private _quotaBytes: number;
  private _usedBytes = 0;
  private _entries: Map<string, number> = new Map();

  constructor(quotaBytes = 5 * 1024 * 1024) { // 5MB default
    this._quotaBytes = quotaBytes;
  }

  add(key: string, sizeBytes: number): boolean {
    if (this._usedBytes + sizeBytes > this._quotaBytes) return false;
    const existing = this._entries.get(key) || 0;
    this._usedBytes = this._usedBytes - existing + sizeBytes;
    this._entries.set(key, sizeBytes);
    return true;
  }

  remove(key: string): void {
    const size = this._entries.get(key) || 0;
    this._usedBytes -= size;
    this._entries.delete(key);
  }

  used(): number { return this._usedBytes; }
  available(): number { return this._quotaBytes - this._usedBytes; }
  quota(): number { return this._quotaBytes; }
  usagePercent(): number {
    return this._usedBytes / Math.max(this._quotaBytes, 1);
  }
  size(): number { return this._entries.size; }
  setQuota(bytes: number): void { this._quotaBytes = bytes; }
}

// V4709: StorageEstimate — 存储容量估算
export interface StorageEstimateResult {
  quota: number;
  usage: number;
  available: number;
  percentUsed: number;
}

export class StorageEstimate {
  private _quota = 0;
  private _usage = 0;

  setEstimate(quota: number, usage: number): void {
    this._quota = quota;
    this._usage = usage;
  }

  estimate(): StorageEstimateResult {
    return {
      quota: this._quota,
      usage: this._usage,
      available: Math.max(0, this._quota - this._usage),
      percentUsed: this._quota > 0 ? this._usage / this._quota : 0,
    };
  }

  isNearLimit(threshold = 0.9): boolean {
    return this.estimate().percentUsed >= threshold;
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

// V4710: OfflineDatabase — 离线数据库封装 (key-value + collections)
export class OfflineDatabase {
  private _collections: Map<string, Map<string, any>> = new Map();

  collection(name: string): Map<string, any> {
    if (!this._collections.has(name)) this._collections.set(name, new Map());
    return this._collections.get(name)!;
  }

  insert(coll: string, doc: any): void {
    const id = doc.id || `auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.collection(coll).set(id, { ...doc, id });
  }

  find(coll: string, id: string): any | undefined {
    return this.collection(coll).get(id);
  }

  update(coll: string, id: string, updates: Partial<any>): any | undefined {
    const c = this.collection(coll);
    const existing = c.get(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...updates, id };
    c.set(id, merged);
    return merged;
  }

  remove(coll: string, id: string): boolean {
    return this.collection(coll).delete(id);
  }

  findAll(coll: string): any[] {
    return Array.from(this.collection(coll).values());
  }

  count(coll: string): number {
    return this.collection(coll).size;
  }

  collections(): string[] { return Array.from(this._collections.keys()); }

  clearAll(): void { this._collections.clear(); }
}

// V4711: SyncQueueManager — 同步队列 (离线→在线 replay)
export interface SyncItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: any;
  enqueuedAt: number;
}

export class SyncQueueManager {
  private _queue: SyncItem[] = [];
  private _synced: SyncItem[] = [];

  enqueue(item: Omit<SyncItem, 'id' | 'enqueuedAt'>): SyncItem {
    const r: SyncItem = {
      ...item,
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      enqueuedAt: Date.now(),
    };
    this._queue.push(r);
    return r;
  }

  pending(): SyncItem[] { return [...this._queue]; }

  pendingCount(): number { return this._queue.length; }

  markSynced(id: string): boolean {
    const idx = this._queue.findIndex(i => i.id === id);
    if (idx === -1) return false;
    const [item] = this._queue.splice(idx, 1);
    this._synced.push(item);
    return true;
  }

  synced(): SyncItem[] { return [...this._synced]; }

  syncedCount(): number { return this._synced.length; }

  clearPending(): void { this._queue = []; }
}

// V4712: ConflictDetector — 数据冲突检测
export interface VersionedDoc {
  id: string;
  version: number;
  data: any;
  updatedAt: number;
}

export class ConflictDetector {
  detect(local: VersionedDoc, remote: VersionedDoc): boolean {
    if (local.id !== remote.id) return false;
    // Conflict when same version but different data, OR different versions with diverged data
    if (local.version === remote.version) {
      return JSON.stringify(local.data) !== JSON.stringify(remote.data);
    }
    return JSON.stringify(local.data) !== JSON.stringify(remote.data);
    }

  detectBatch(pairs: [VersionedDoc, VersionedDoc][]): boolean[] {
    return pairs.map(([l, r]) => this.detect(l, r));
  }
}

// V4713: LastWriteWinsResolver — 最后写入胜出
export class LastWriteWinsResolver {
  resolve(local: VersionedDoc, remote: VersionedDoc): VersionedDoc {
    return local.updatedAt >= remote.updatedAt ? local : remote;
  }

  resolveBatch(pairs: [VersionedDoc, VersionedDoc][]): VersionedDoc[] {
    return pairs.map(([l, r]) => this.resolve(l, r));
  }
}

// V4714: ThreeWayMergeResolver — 三路合并 (base + local + remote)
export interface MergeResult<T> {
  result: T;
  conflicts: string[];
  strategy: 'auto' | 'manual';
}

export class ThreeWayMergeResolver {
  merge<T extends Record<string, any>>(base: T, local: T, remote: T): MergeResult<T> {
    const result: any = { ...base };
    const conflicts: string[] = [];
    const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
    keys.forEach(k => {
      const baseVal = base[k];
      const localVal = local[k];
      const remoteVal = remote[k];
      if (localVal === remoteVal) {
        result[k] = localVal;
      } else if (baseVal === localVal) {
        // Only remote changed
        result[k] = remoteVal;
      } else if (baseVal === remoteVal) {
        // Only local changed
        result[k] = localVal;
      } else {
        // Both changed differently → conflict
        conflicts.push(k);
        result[k] = localVal; // default to local
      }
    });
    return { result, conflicts, strategy: conflicts.length > 0 ? 'manual' : 'auto' };
  }
}

// V4715: SyncTokenManager — 同步 token 管理 (JWT-like)
export interface SyncToken {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

export class SyncTokenManager {
  private _tokens: Map<string, SyncToken> = new Map();

  set(userId: string, token: string, expiresAt: number, refreshToken?: string): SyncToken {
    const t: SyncToken = { token, expiresAt, refreshToken };
    this._tokens.set(userId, t);
    return t;
  }

  get(userId: string): SyncToken | undefined { return this._tokens.get(userId); }

  isExpired(userId: string): boolean {
    const t = this._tokens.get(userId);
    return !t || Date.now() >= t.expiresAt;
  }

  refresh(userId: string, newToken: string, newExpiresAt: number): SyncToken | undefined {
    const t = this._tokens.get(userId);
    if (!t || !t.refreshToken) return undefined;
    const updated: SyncToken = { token: newToken, expiresAt: newExpiresAt, refreshToken: t.refreshToken };
    this._tokens.set(userId, updated);
    return updated;
  }

  remove(userId: string): void { this._tokens.delete(userId); }

  all(): Record<string, SyncToken> {
    const out: Record<string, SyncToken> = {};
    this._tokens.forEach((v, k) => { out[k] = v; });
    return out;
  }
}

export const OFFLINE_BATCH_1_ENGINES: readonly string[] = [
  'LocalStorageAdapter', 'IndexedDBAdapter', 'StorageQuotaManager', 'StorageEstimate',
  'OfflineDatabase', 'SyncQueueManager', 'ConflictDetector',
  'LastWriteWinsResolver', 'ThreeWayMergeResolver', 'SyncTokenManager',
];

export class OfflineCoreIndex {
  list(): string[] { return [...OFFLINE_BATCH_1_ENGINES, 'OfflineCoreIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}