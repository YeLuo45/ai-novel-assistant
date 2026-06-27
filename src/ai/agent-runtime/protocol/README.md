# Agent Protocol (V3) — Direction B

**Version**: 1.0.0
**Engines**: V2356-V2385 (30 engines, 6 batches)
**Tests**: 200+ tests, 100% pass
**Coverage**: 96%+

## 目标

为 ai-novel-assistant V3 Agent Runtime 提供 **agent 之间的结构化通信协议**。

## 9 种消息类型

| Kind | 用途 | 应答 |
|------|------|------|
| `REQUEST` | 同步请求 | `RESPONSE` |
| `RESPONSE` | 应答 | (无) |
| `NOTIFY` | 异步通知 | (无) |
| `OFFER` | 提供方案 | `ACCEPT` / `REJECT` |
| `ACCEPT` | 接受 OFFER | (无) |
| `REJECT` | 拒绝 OFFER | (无) |
| `VOTE` | 投票 | (无) |
| `DELEGATE` | 任务委派 | `RETURN` |
| `RETURN` | 委派结果 | (无) |

## 模块结构

```
src/ai/agent-runtime/protocol/
├── types.ts                         # 9 MessageKind + 9 Payload + factory + type guards (V2356)
├── AgentMessageBus.ts               # Scoped mailbox + pub/sub (V2357)
├── RouterAndSerializer.ts           # 5 routing policies + JSON serializer (V2358-V2360)
├── RequestReply.ts                  # sync/async + PromiseTracker + ReplyMatcher + RequestQueue (V2361-V2365)
├── NegotiationAndDelegation.ts      # Negotiation + Vote + Consensus + Delegation + Arbitration (V2366-V2375)
├── index.ts                         # Public API (V2380)
├── demo/negotiation-demo.ts         # 5 agent 协商 demo (V2381)
└── __tests__/integration.test.ts    # 端到端集成测试 (V2382)
```

## 核心 API 示例

### 1. 同步 Request-Reply

```ts
import { AgentMessageBus, createRequest, createResponse } from '@/ai/agent-runtime/protocol'

const bus = new AgentMessageBus()
const req = createRequest('a', 'b', { intent: 'compute', input: 5 })
bus.send({ kind: 'REQUEST', from: 'a', to: 'b', payload: req.payload })
// b 处理后：
const resp = createResponse('b', 'a', req, { result: 42, success: true })
bus.send({ kind: 'RESPONSE', from: 'b', to: 'a', payload: resp.payload, correlationId: resp.correlationId })
```

### 2. 多 Agent 协商

```ts
import { NegotiationRoom, VoteCollector, buildConsensus } from '@/ai/agent-runtime/protocol'

const room = new NegotiationRoom()
const votes = new VoteCollector()
const p = room.open('plot-1', 'tighten pacing', { style: 'tight' }, { participants: ['plot-1', 'style-1'] })
votes.record(p.proposalId, { voter: 'plot-1', choice: 'yes', weight: 1, votedAt: 0 })
votes.record(p.proposalId, { voter: 'style-1', choice: 'yes', weight: 1, votedAt: 0 })

const consensus = buildConsensus(votes.votesFor(p.proposalId), 'majority')
if (consensus.reached) {
  // 多数通过
}
```

### 3. 委派链

```ts
import { DelegationChain, createDelegate, createReturn } from '@/ai/agent-runtime/protocol'

const chain = new DelegationChain()
const d1 = createDelegate('orchestrator', 'worker-1', { task: 'compute' })
chain.add({ delegateId: d1.id, from: 'orchestrator', to: 'worker-1', task: 'compute', children: [], status: 'running', createdAt: Date.now() })
chain.complete(d1.id, 'result', 100)
```

### 4. 路由策略

```ts
import { MessageRouter, createEnvelope } from '@/ai/agent-runtime/protocol'

const router = new MessageRouter()
const env = createEnvelope({ kind: 'NOTIFY', from: 'x', to: '?', payload: {} })
const ctx = { candidates: ['a', 'b', 'c'], loadMap: new Map(), rrIndex: 0 }
const decision = router.route(env, 'round-robin', ctx)
// decision.targets = ['a']
```

## 验证命令

```bash
# 跑全部 protocol 测试
npx vitest run src/ai/agent-runtime/protocol/

# 跑覆盖率
npx vitest run src/ai/agent-runtime/protocol/ --coverage --coverage.include='src/ai/agent-runtime/protocol/**'

# 跑 demo
npx vitest run src/ai/agent-runtime/protocol/demo/negotiation-demo.test.ts
```

## 灵感来源

- hermes-agent-collab Direction A (AsyncMessageBus + 状态机)
- hermes-agent-collab Direction C (TaskRouter + 复杂度路由)
- hermes-agent-collab Direction E (MultiAgent Protocol)
- chatdev 阶段协议

## 下一步

- **Direction C**: Memory 三层隔离（agent-scoped Dexie + Lease + Auction）
- **Direction D**: User 投影 + 隐私脱敏
- **Direction E**: Soul 模板市场
- **Direction F**: UI Collaboration Studio V4
- **Direction G**: 可观测性 + 自我进化
