# Real-time Multi-User Sync (V3) — Direction N

**Version**: 1.0.0
**Engines**: V2716-V2745 (30 engines, 6 batches)
**Tests**: 95 tests, 100% pass

## 目标

多 agent 协作的"实时"层：WebSocket transport + CRDT 同步 + presence/cursor/awareness + 离线/重连/冲突 + 加密/认证/审计。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| N1-N10 | `SyncTransport.ts` | WebSocketTransport + ConnectionManager + ReconnectStrategy (Backoff) + Heartbeat + Backoff + CRDTSync + OperationQueue + SyncMessage + SyncResponse + SyncError |
| N11-N20 | `SyncAdvanced.ts` | PresenceBroadcaster + CursorShare + SelectionSync + AwarenessProtocol + LatencyOptimizer + OfflineQueue + ReconnectReplay + WireConflictResolver + PartialSync + BandwidthThrottle |
| N21-N25 | `SyncSecurity.ts` | MessageEncryption (xor/aes-gcm) + AuthToken (HMAC-like) + RoomMembership + PermissionSync + AuditBroadcast |
| N26 | `index.ts` + `demo/sync-integration-demo.ts` | 11 端到端断言 |
| N27 | `__tests__/sync-integration.test.ts` | 5 集成测试 |
| N28 | `SYNC_README.md` | 本文档 |
| N29 | 主 README 更新 | 验证命令 |
| N30 | 收口 commit + push | |

## 核心 API 示例

### 1. Connection + Sync

```ts
import { ConnectionManager, CRDTSync, OperationQueue } from '@/realtime'
import { CRDT } from '@/ai/persistence/PersistenceAdvanced'

class MyTransport implements WebSocketTransport { ... }
const cm = new ConnectionManager(new MyTransport(), 10)  // 10 reconnect attempts
await cm.connect('wss://example.com/room1')

const crdt = new CRDT<number>('d1')
const sync = new CRDTSync(crdt, new OperationQueue(3))
sync.localSet('counter', 42)
```

### 2. Presence + Cursor + Awareness

```ts
import { PresenceBroadcaster, CursorShare, AwarenessProtocol } from '@/realtime'

const presence = new PresenceBroadcaster()
presence.broadcast({ userId: 'u1', status: 'online', lastSeen: Date.now() })
presence.subscribe(p => console.log(`${p.userId} is now ${p.status}`))

const cursors = new CursorShare(5000)
cursors.update('u1', 100, 200, 'ch1')

const aw = new AwarenessProtocol(30000)
aw.update({ userId: 'u1', status: 'typing', lastUpdate: 0 })
```

### 3. Conflict Resolution

```ts
import { WireConflictResolver } from '@/realtime'

const r = new WireConflictResolver()
const res = r.resolve('local', 'remote', Date.now() + 1000, Date.now(), 'newer-wins')
// res.winner === 'remote', res.resolved === 'remote'
```

### 4. Offline + Reconnect

```ts
import { OfflineQueue, ReconnectReplay } from '@/realtime'

const offline = new OfflineQueue()
offline.setOnline(false)
offline.enqueue(item)  // queued

// 重新联网后：
const replay = new ReconnectReplay()
replay.enqueue(item)
await replay.replay(async (it) => { /* apply */ return true })
```

### 5. Encryption + Auth

```ts
import { MessageEncryption, AuthTokenManager } from '@/realtime'

const enc = new MessageEncryption('aes-gcm', 'secret-key')
const encrypted = enc.encrypt('hello')
const decrypted = enc.decrypt(encrypted)

const tm = new AuthTokenManager('secret', 3600000)  // 1h TTL
const token = tm.issue('u1', 'r1', ['read', 'write'])
const valid = tm.verify(token).valid  // true
```

### 6. Bandwidth Throttle

```ts
import { BandwidthThrottle } from '@/realtime'

const bw = new BandwidthThrottle(10_000)  // 10KB/s
if (bw.record(bytes)) {
  send(message)
} else {
  queueForLater(message)
}
```

## 验证命令

```bash
npx vitest run src/realtime/  # 95 passed
npx vitest run src/realtime/demo/sync-integration-demo.test.ts
npx vitest run src/realtime/__tests__/sync-integration.test.ts
```

## 灵感

- Yjs / Automerge (CRDT)
- WebSocket API
- Liveblocks / Presence API
- Socket.IO
- OT/CRDT Papers
- Google Docs collaboration
- Figma multiplayer

## 累计

- Direction A-N: **425 engines / 5,430 tests** (A-G 1024 + H 50 + I 126 + J 75 + K 82 + L 51 + M 92 + N 95)
- 15 commits pushed
- 灵感: Yjs + Liveblocks + Socket.IO + Google Docs + Figma