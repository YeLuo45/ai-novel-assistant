// Round 8 Direction CE — Offline-First Storage 2.0 Batch 3/3
// V4726-V4735: Session + Adapter + Inspector + Backup + Restore + Replication + PartitionDetector + Resync + Metrics + Integration

import {
  LocalStorageAdapter, IndexedDBAdapter, StorageQuotaManager, StorageEstimate,
  OfflineDatabase, SyncQueueManager, ConflictDetector,
  LastWriteWinsResolver, ThreeWayMergeResolver, SyncTokenManager,
  OFFLINE_BATCH_1_ENGINES,
} from './OfflineCore';
import {
  BackgroundSyncRetryManager, RequestCacheManager, OfflineFirstCache,
  DataMigrationManager, SchemaVersionManager, DataEncryptionLayer,
  CompressedStorage, OfflineChangeLog, SyncTimestampTracker, OptimisticUpdateManager,
  OFFLINE_BATCH_2_ENGINES,
} from './OfflineAdvanced';

// V4726: OfflineSession — session 顶层
export interface OfflineSessionConfig {
  cacheName: string;
  quotaBytes: number;
  encryptionKey: string;
}

export class OfflineSession {
  readonly id: string;
  readonly config: OfflineSessionConfig;
  readonly localStorage: LocalStorageAdapter;
  readonly idb: IndexedDBAdapter;
  readonly quota: StorageQuotaManager;
  readonly estimate: StorageEstimate;
  readonly database: OfflineDatabase;
  readonly syncQueue: SyncQueueManager;
  readonly conflictDetector: ConflictDetector;
  readonly lwwResolver: LastWriteWinsResolver;
  readonly mergeResolver: ThreeWayMergeResolver;
  readonly token: SyncTokenManager;
  readonly retry: BackgroundSyncRetryManager;
  readonly requestCache: RequestCacheManager;
  readonly offlineCache: OfflineFirstCache<any>;
  readonly migration: DataMigrationManager;
  readonly schema: SchemaVersionManager;
  readonly encryption: DataEncryptionLayer;
  readonly compression: CompressedStorage;
  readonly changeLog: OfflineChangeLog;
  readonly timestamp: SyncTimestampTracker;
  readonly optimistic: OptimisticUpdateManager;
  readonly createdAt: number;

  constructor(id: string, config: OfflineSessionConfig) {
    this.id = id;
    this.config = config;
    this.createdAt = Date.now();
    this.localStorage = new LocalStorageAdapter(false);
    this.idb = new IndexedDBAdapter();
    this.quota = new StorageQuotaManager(config.quotaBytes);
    this.estimate = new StorageEstimate();
    this.database = new OfflineDatabase();
    this.syncQueue = new SyncQueueManager();
    this.conflictDetector = new ConflictDetector();
    this.lwwResolver = new LastWriteWinsResolver();
    this.mergeResolver = new ThreeWayMergeResolver();
    this.token = new SyncTokenManager();
    this.retry = new BackgroundSyncRetryManager();
    this.requestCache = new RequestCacheManager();
    this.offlineCache = new OfflineFirstCache<any>();
    this.migration = new DataMigrationManager();
    this.schema = new SchemaVersionManager();
    this.encryption = new DataEncryptionLayer(config.encryptionKey);
    this.compression = new CompressedStorage();
    this.changeLog = new OfflineChangeLog();
    this.timestamp = new SyncTimestampTracker();
    this.optimistic = new OptimisticUpdateManager();
  }

  age(): number { return Date.now() - this.createdAt; }
}

// V4727: StorageAdapter — 统一存储适配器接口
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// V4728: DatabaseInspector — 数据库检视
export class DatabaseInspector {
  inspect(db: OfflineDatabase): { collections: { name: string; count: number }[]; totalDocs: number } {
    const collections = db.collections().map(name => ({ name, count: db.count(name) }));
    const totalDocs = collections.reduce((s, c) => s + c.count, 0);
    return { collections, totalDocs };
  }

  estimateSize(db: OfflineDatabase, avgDocBytes = 500): number {
    const total = db.collections().reduce((s, name) => s + db.count(name), 0);
    return total * avgDocBytes;
  }
}

// V4729: BackupManager — 备份管理 (export to JSON)
export interface Backup {
  timestamp: number;
  collections: Record<string, any[]>;
  version: number;
}

export class BackupManager {
  backup(db: OfflineDatabase, version = 1): Backup {
    const collections: Record<string, any[]> = {};
    db.collections().forEach(name => { collections[name] = db.findAll(name); });
    return { timestamp: Date.now(), collections, version };
  }

  serialize(backup: Backup): string {
    return JSON.stringify(backup);
  }

  deserialize(json: string): Backup {
    return JSON.parse(json);
  }

  restore(db: OfflineDatabase, backup: Backup): number {
    let restored = 0;
    Object.entries(backup.collections).forEach(([name, docs]) => {
      docs.forEach(doc => {
        db.insert(name, doc);
        restored++;
      });
    });
    return restored;
  }
}

// V4730: RestoreManager — 恢复管理 (with conflict resolution)
export class RestoreManager {
  restore(db: OfflineDatabase, backup: Backup, conflictResolver: (local: any, remote: any) => any): { restored: number; conflicts: number } {
    let restored = 0;
    let conflicts = 0;
    Object.entries(backup.collections).forEach(([name, docs]) => {
      docs.forEach(doc => {
        const existing = db.find(name, doc.id);
        if (!existing) {
          db.insert(name, doc);
          restored++;
        } else {
          const resolved = conflictResolver(existing, doc);
          db.update(name, doc.id, resolved);
          conflicts++;
          restored++;
        }
      });
    });
    return { restored, conflicts };
  }
}

// V4731: ReplicationManager — 主从复制 (master → slaves)
export interface ReplicationTarget {
  id: string;
  lastSyncedVersion: number;
}

export class ReplicationManager {
  private _targets: Map<string, ReplicationTarget> = new Map();
  private _version = 0;

  registerTarget(id: string): ReplicationTarget {
    const t: ReplicationTarget = { id, lastSyncedVersion: 0 };
    this._targets.set(id, t);
    return t;
  }

  bumpVersion(): number { return ++this._version; }

  currentVersion(): number { return this._version; }

  pendingForTarget(id: string, fromVersion: number): number[] {
    return Array.from({ length: this._version - fromVersion }, (_, i) => fromVersion + i + 1);
  }

  markSynced(id: string, version: number): void {
    const t = this._targets.get(id);
    if (t) t.lastSyncedVersion = version;
  }

  lagForTarget(id: string): number {
    const t = this._targets.get(id);
    return t ? this._version - t.lastSyncedVersion : -1;
  }

  targets(): ReplicationTarget[] { return Array.from(this._targets.values()); }
}

// V4732: NetworkPartitionDetector — 网络分区检测
export class NetworkPartitionDetector {
  private _online = true;
  private _partitionedAt = 0;
  private _callbacks: Set<(partitioned: boolean) => void> = new Set();

  setOnline(online: boolean): void {
    if (online === this._online) return;
    this._online = online;
    if (!online) this._partitionedAt = Date.now();
    this._callbacks.forEach(cb => cb(!online));
  }

  isOnline(): boolean { return this._online; }
  isPartitioned(): boolean { return !this._online; }

  partitionDurationMs(): number {
    return this._partitionedAt === 0 ? 0 : Date.now() - this._partitionedAt;
  }

  subscribe(cb: (partitioned: boolean) => void): () => void {
    this._callbacks.add(cb);
    return () => this._callbacks.delete(cb);
  }
}

// V4733: ResyncManager — 重新同步 (full vs partial)
export type ResyncStrategy = 'full' | 'partial' | 'since-last';

export class ResyncManager {
  private _lastFullSync = 0;
  private _lastPartialSync = 0;
  private _history: { strategy: ResyncStrategy; timestamp: number; count: number }[] = [];

  resync(strategy: ResyncStrategy, count: number): void {
    const now = Date.now();
    this._history.push({ strategy, timestamp: now, count });
    if (strategy === 'full') this._lastFullSync = now;
    else this._lastPartialSync = now;
  }

  lastFullSync(): number { return this._lastFullSync; }
  lastPartialSync(): number { return this._lastPartialSync; }
  history(): { strategy: ResyncStrategy; timestamp: number; count: number }[] { return [...this._history]; }

  needsFullSync(maxAgeMs = 86400000): boolean {
    return Date.now() - this._lastFullSync > maxAgeMs;
  }
}

// V4734: StorageMetrics — 存储指标
export class StorageMetrics {
  private _counters: Map<string, number> = new Map();

  increment(name: string, by = 1): void {
    this._counters.set(name, (this._counters.get(name) || 0) + by);
  }

  counter(name: string): number { return this._counters.get(name) || 0; }

  report(): Record<string, number> {
    const out: Record<string, number> = {};
    this._counters.forEach((v, k) => { out[k] = v; });
    return out;
  }

  reset(): void { this._counters.clear(); }
}

// V4735: OfflineIntegration — 集成 + 端到端 demo
export class OfflineIntegration {
  private _session: OfflineSession;
  private _inspector: DatabaseInspector;
  private _backup: BackupManager;
  private _restore: RestoreManager;
  private _replication: ReplicationManager;
  private _partition: NetworkPartitionDetector;
  private _resync: ResyncManager;
  private _metrics: StorageMetrics;

  constructor(config: OfflineSessionConfig) {
    this._session = new OfflineSession(`offline-${Date.now()}`, config);
    this._inspector = new DatabaseInspector();
    this._backup = new BackupManager();
    this._restore = new RestoreManager();
    this._replication = new ReplicationManager();
    this._partition = new NetworkPartitionDetector();
    this._resync = new ResyncManager();
    this._metrics = new StorageMetrics();
  }

  runDemo(): {
    backupSize: number;
    inspectorReport: { collections: { name: string; count: number }[]; totalDocs: number };
    replicationTargets: number;
    partitionDurationMs: number;
    metricsReport: Record<string, number>;
  } {
    // Populate database
    this._session.idb.createStore('users', 'id');
    this._session.idb.put('users', { id: '1', name: 'Alice' });
    this._session.idb.put('users', { id: '2', name: 'Bob' });
    this._session.database.insert('users', { id: '1', name: 'Alice' });
    this._session.database.insert('users', { id: '2', name: 'Bob' });

    // Backup
    const backup = this._backup.backup(this._session.database, 1);
    const json = this._backup.serialize(backup);
    const backupSize = json.length;

    // Inspect
    const inspectorReport = this._inspector.inspect(this._session.database);

    // Replication
    this._replication.registerTarget('slave-1');
    this._replication.bumpVersion();
    this._replication.bumpVersion();

    // Partition detection
    this._partition.setOnline(false);
    const partitionDurationMs = this._partition.partitionDurationMs();
    this._partition.setOnline(true);

    // Resync
    this._resync.resync('full', 100);

    // Metrics
    this._metrics.increment('demo_runs');
    this._metrics.increment('backups_created');
    this._metrics.increment('partitions_detected');

    return {
      backupSize,
      inspectorReport,
      replicationTargets: this._replication.targets().length,
      partitionDurationMs,
      metricsReport: this._metrics.report(),
    };
  }

  session(): OfflineSession { return this._session; }
  inspector(): DatabaseInspector { return this._inspector; }
  backup(): BackupManager { return this._backup; }
  restore(): RestoreManager { return this._restore; }
  replication(): ReplicationManager { return this._replication; }
  partition(): NetworkPartitionDetector { return this._partition; }
  resync(): ResyncManager { return this._resync; }
  metrics(): StorageMetrics { return this._metrics; }
}

export const OFFLINE_BATCH_3_ENGINES: readonly string[] = [
  'OfflineSession', 'StorageAdapter', 'DatabaseInspector', 'BackupManager',
  'RestoreManager', 'ReplicationManager', 'NetworkPartitionDetector',
  'ResyncManager', 'StorageMetrics', 'OfflineIntegration',
];

export class OfflineIntegrationIndex {
  list(): string[] { return [...OFFLINE_BATCH_3_ENGINES, 'OfflineIntegrationIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}

export class OfflineMasterIndex {
  list(): string[] {
    return [...OFFLINE_BATCH_1_ENGINES, ...OFFLINE_BATCH_2_ENGINES, ...OFFLINE_BATCH_3_ENGINES, 'OfflineMasterIndex'];
  }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}