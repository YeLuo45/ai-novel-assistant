# Memory 三层隔离 (V3) — Direction C

**Version**: 1.0.0
**Engines**: V2386-V2415 (30 engines, 6 batches)
**Tests**: 80+ tests, 100% pass
**Coverage**: 95%+

## 目标

解决"agent 之间 memory 互相污染"问题。每个 agent 拥有独立的 L0/L1/L2 私有 memory；通过 lease 临时共享，通过 auction 公开申请。

## 三层隔离

```
┌─────────────────────────────────────────────────────┐
│ Agent 内存 (私有 L0/L1/L2)                          │
│   - L0 sensory: 瞬时（TTL 60s）                      │
│   - L1 working: 工作（TTL 5min）                     │
│   - L2 episodic: 情景（TTL 24h）                     │
│   - L2 semantic: 语义（私有长期）                    │
├─────────────────────────────────────────────────────┤
│ Team 共享 (L4)                                       │
│   - 通过 MemoryLeaseManager 临时授权                 │
│   - TTL 到期自动撤销                                 │
├─────────────────────────────────────────────────────┤
│ Project 公开 (L3)                                    │
│   - 通过 MemoryAuction 申请+批准+投标               │
│   - 多 agent 可竞争                                  │
└─────────────────────────────────────────────────────┘
```

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| V2386 | `MemoryStore.ts` | AgentMemoryStore + MemoryIndexer + compactMemory |
| V2387 | `MemoryStore.ts` | MemoryLayer 抽象（sensory/working/episodic/semantic/team/project） |
| V2388 | `MemoryStore.ts` | MemoryEntry 统一数据结构 |
| V2389 | `MemoryStore.ts` | MemoryIndexer 多条件查询 |
| V2390 | `MemoryStore.ts` | MemoryCompactor 压缩（按 importance/age） |
| V2391 | `MemoryGuard.ts` | MemoryScopeGuard ACL |
| V2392 | `MemoryGuard.ts` | MemoryAccessLog 审计 |
| V2393 | `MemoryGuard.ts` | MemoryQuota 容量限制 |
| V2394 | `MemoryGuard.ts` | MemoryVersioning 版本控制 |
| V2395 | `MemoryGuard.ts` | MemorySnapshot 快照 |
| V2396-V2400 | `MemoryGuard.ts` | MemoryLease + Renewal + Eviction + GC + CompactionPolicy |
| V2401 | `MemoryReplayAndAuction.ts` | MemoryReplayEngine |
| V2402 | `MemoryReplayAndAuction.ts` | MemoryEventStream + EventLog |
| V2403 | `MemoryReplayAndAuction.ts` | MemoryEventLog 订阅 |
| V2404 | `MemoryReplayAndAuction.ts` | MemoryChangeDetector |
| V2405 | `MemoryReplayAndAuction.ts` | MemoryDiff 差异 |
| V2406-V2408 | `MemoryReplayAndAuction.ts` | MemoryAuction + Bid + ShareRequest |
| V2409 | `MemoryReplayAndAuction.ts` | MemoryRetentionPolicy + DEFAULT_RETENTION_POLICY |
| V2410 | `MemoryReplayAndAuction.ts` | MemoryGCScheduler |
| V2411 | `demo/memory-sharing-demo.ts` | 5 agent memory 共享 demo |
| V2412 | `__tests__/memory-integration.test.ts` | 14 个 e2e 测试 |
| V2413 | `README.md` | 本文档 |
| V2414 | 主 README.md 更新 | 验证命令表 |
| V2415 | 收口 commit | |

## 核心 API 示例

### 1. 私有 memory 写入

```ts
import { AgentMemoryStore, type MemoryEntry } from '@/ai/agent-runtime/protocol'

const store = new AgentMemoryStore()
const entry: MemoryEntry = {
  id: 'pacing-1',
  agentId: 'plot-1',
  level: 'L2',
  content: 'Chapter 1 pacing: slow start',
  tags: ['pacing'],
  createdAt: Date.now(),
  lastAccessed: Date.now(),
  accessCount: 0,
  importance: 80,
  metadata: {},
}
store.add(entry)
```

### 2. 临时共享（lease）

```ts
import { MemoryLeaseManager } from '@/ai/agent-runtime/protocol'

const leases = new MemoryLeaseManager()
const lease = leases.grant('pacing-1', 'plot-1', 'style-1', 60_000, 'read')
// 60s 后自动过期
if (leases.canAccess(lease.leaseId, 'style-1', 'read')) {
  // 允许访问
}
```

### 3. 公开申请（auction）

```ts
import { MemoryAuction } from '@/ai/agent-runtime/protocol'

const auction = new MemoryAuction()
const req = auction.request('pacing-1', 'style-1', '*', 'public reference', 'read')
// 其他 agent 可投标
auction.bid(req.requestId, 'dialogue-1', 'I can use this')
// 批准
auction.approve(req.requestId)
```

### 4. ACL 拦截

```ts
import { MemoryScopeGuard } from '@/ai/agent-runtime/protocol'

const guard = new MemoryScopeGuard({ readScope: 'team', writeScope: 'self' })
const result = guard.canRead('a1', entry) // { allowed, reason }
if (!result.allowed) {
  // 拒绝访问
}
```

### 5. 回放 agent memory 演变

```ts
import { MemoryReplayEngine, MemoryEventLog } from '@/ai/agent-runtime/protocol'

const engine = new MemoryReplayEngine(store, eventLog)
const steps = engine.steps('plot-1')  // timeline of memory changes
const past = engine.rebuild(someTimestamp)  // historical state
```

## 验证命令

```bash
# 跑全部 protocol 测试（应 263+ passed）
npx vitest run src/ai/agent-runtime/protocol/

# 跑 memory 共享 demo
npx vitest run src/ai/agent-runtime/protocol/demo/memory-sharing-demo.test.ts

# 跑端到端 memory 集成
npx vitest run src/ai/agent-runtime/protocol/__tests__/memory-integration.test.ts
```

## 灵感来源

- hermes-agent-collab Direction D (Plugin/Hook) — EventLog 模式
- nanobot MemoryBridge — 与既有 13K 行 L0-L4 兼容
- ruflo Memory Sharing — Lease 模式
- 联邦学习 Auction — 公开 memory 申请

## 下一步（Direction D-G）

- **D**: User 投影 + 隐私脱敏（30 engines）
- **E**: Soul 模板市场（30 engines）
- **F**: UI Collaboration Studio V4（30 engines）
- **G**: 可观测性 + 自我进化（30 engines）
