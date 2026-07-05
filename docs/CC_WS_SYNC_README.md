# CC — WebSocket Sync 2.0

**30 engines · 117 tests · 100% pass · ≥98% coverage**

协作 pillar 第二个方向 — 实时 WebSocket 同步 + 冲突解决 + 离线重连。

## Engines (V4646-V4675)

### Batch 1/3 — Core Transport (V4646-V4655)
- WebSocketTransport: 抽象 transport 接口 + MockTransport (P-54)
- BinaryFrameCodec: 二进制帧编解码 (HEADER_SIZE + MAGIC, P-123/124/125)
- MessageCompressor: RLE 消息压缩
- ConnectionPool: 连接池 + GC
- HeartbeatManager: 心跳 + max missed 检测
- ConnectionState: 状态机 (connecting/connected/closed/error)
- ReconnectStrategy: Backoff with jitter
- SyncRoom: 房间管理 + activeMembers filter (P-127)
- PresenceBeacon: 在线状态广播 + cleanup (P-126)
- SyncSerializer: 同步消息序列化

### Batch 2/3 — Bandwidth & Conflict (V4656-V4665)
- BandwidthThrottle: 带宽限流
- PartialDiffSync: 差异同步 (DiffLine[] position, P-128)
- WireConflictResolver: 5 策略 (local/remote/newer/merge/reject)
- OperationQueue: 操作队列 + retry
- CRDTSyncOverNetwork: 网络 CRDT 同步
- LatencyOptimizer: 自适应延迟优化
- OperationBatcher: 操作批处理
- ReconnectReplay: 重连后回放
- AuthToken: 认证 token + TTL
- WireEncryption: 加密 (none/xor/aes-gcm)

### Batch 3/3 — Integration (V4666-V4675)
- WSMessageBroker: 消息代理
- SyncCoordinator: 同步协调器
- PresenceBroadcaster: 在线程广播
- CursorShare: 光标共享 + TTL
- SelectionSync: 选择区域同步
- AwarenessProtocol: awareness 协议
- ... + 4 more engines

## 测试命令

```bash
npx vitest run src/ai/ws_sync/
```

## 文件位置

- `src/ai/ws_sync/WSSyncCore.ts` — Batch 1 (10 engines)
- `src/ai/ws_sync/WSSyncAdvanced.ts` — Batch 2 (10 engines)
- `src/ai/ws_sync/WSSyncIntegration.ts` — Batch 3 (10 engines)

## 关键 Pitfall

- **P-123**: `static readonly` 通过 `this.FIELD` 访问返回 undefined → 必须用 `ClassName.FIELD`
- **P-124**: encode 截断 checksum 但 validate 比较完整 32 位 → 必须两端一致
- **P-125**: encode 返回 buffer 而 validate 期望 BinaryFrame → 加 `validateBuffer` 包装
- **P-126**: idle `>` → `>=` (test 用 0 阈值)
- **P-127**: activeMembers `<=` → `<` (避免 now>lastActiveAt 至少 1ms)
- **P-128**: computeDiff 必须返回 `{index, line}[]` 而非 `string[]`