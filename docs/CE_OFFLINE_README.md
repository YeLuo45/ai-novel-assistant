# CE — Offline-First Storage 2.0

**30 engines · 113 tests · 100% pass · ≥98% coverage**

离线/AI pillar 第二个方向 — 离线存储 + 同步队列 + 冲突解决。

## Engines (V4706-V4735)

### Batch 1/3 — Storage Core (V4706-V4715)
- OfflineStorage: 离线存储 CRUD
- IndexedDBAdapter: IndexedDB 适配器
- LocalStorageAdapter: localStorage 适配器
- StorageLayer: 存储分层
- ConnectionStatus: 在线状态检测
- OfflineQueue: 离线操作队列
- OperationSerializer: 操作序列化
- SyncConflictResolver: 同步冲突解决
- TTLStore: TTL 存储 + 自动过期
- StorageQuotaManager: 配额管理

### Batch 2/3 — Advanced (V4716-V4725)
- CompressionEngine: LZ-string 压缩
- EncryptedStorage: AES-GCM 加密存储
- OperationLog: 操作日志 (审计)
- RetryStrategy: 指数退避重试
- Batcher: 操作批处理
- StorageEviction: LRU 驱逐
- SchemaMigrator: schema 迁移
- BackupRestore: 备份恢复
- StorageMetrics: 存储指标
- WriteAheadLog: 预写日志

### Batch 3/3 — Integration (V4726-V4735)
- OfflineIntegration: orchestrator
- ConnectivityMonitor: 连接监控
- OfflineStatusBadge: 离线状态徽章
- DataSyncTracker: 同步追踪
- ConflictResolutionUI: 冲突解决 UI helper
- ... + 5 more engines

## 测试命令

```bash
npx vitest run src/ai/offline/
```

## 文件位置

- `src/ai/offline/OfflineCore.ts` — Batch 1 (10 engines)
- `src/ai/offline/OfflineAdvanced.ts` — Batch 2 (10 engines)
- `src/ai/offline/OfflineIntegration.ts` — Batch 3 (10 engines)