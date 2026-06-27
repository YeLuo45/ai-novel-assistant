# Agent Runtime (V3) — 多智能体协作框架

**Project ID**: `agent-runtime-v3`
**Version**: `3.0.0`
**Engines**: V2326-V2355 (30 engines, 5 batches)
**Tests**: 426 tests, 100% pass
**Coverage**: 98.56% statements / 95.6% branches / 95.9% funcs / 98.56% lines

## 设计目标

为 ai-novel-assistant 提供"多智能体互相隔离"的协作框架。每个 agent 拥有独立的 **soul**（决策偏好）、**user 视图**（差异化上下文）、**memory 隔离**（私有 + 共享）。

## 三件套数据模型

```
AgentSoul         = 不可变身份（archetype + persona + capabilities + decision policy）
AgentUserBinding  = 该 agent 看到的 user 切片（visible fields + alias + custom instructions）
AgentMemoryScope  = 私有 tables + 共享 tables + access log + retention
```

## 模块结构

| 层 | 模块 | 引擎 |
|----|------|------|
| L0 — 核心类型 | `types.ts` | V2326 |
| L1 — 工厂 | `AgentSoul.ts`, `AgentUserBinding.ts`, `AgentMemoryScope.ts` | V2327-V2329 |
| L1 — 索引 | `index.ts` | V2330 |
| L2 — Runtime | `AgentRegistry.ts`, `AgentFactory.ts`, `AgentSandbox.ts`, `AgentLifecycle.ts`, `AgentRuntime.ts` | V2331-V2335 |
| L2 — 模板 | `builtinSouls.ts` (5 个) | V2336-V2340 |
| L2 — 桥接 | `bridge.ts` (BaseAgent + Nanobot + Persona + Memory adapters) | V2341-V2345 |
| L2 — Hook | `AgentHookEvents.ts`, `AgentHookEmitter.ts`, `AgentHookBuiltins.ts` | V2346-V2350 |
| L3 — 收口 | `demo/`, `__tests__/integration.test.ts` | V2351-V2352 |

## 5 个内置 Soul 模板

| 模板 | archetype | capabilities | 性格特征 |
|------|-----------|--------------|----------|
| `PLOT_ADVISOR` | specialist | plot/pacing/hook | creative 0.8, conservative 0.5 |
| `STYLE_COACH` | instructor | style/voice | 中性, 偏教学 |
| `DIALOGUE_MASTER` | specialist | dialogue/character | humor 0.6, creative 0.7 |
| `CRITIC_MASTER` | critic | critique + 4 个 | reviewThreshold 0.9 |
| `CONTINUITY_GUARD` | reviewer | continuity/pov/world | conservative 0.9 |

## 4 个桥接适配器（不修改旧模块）

| Adapter | 用途 | 输入 |
|---------|------|------|
| `BaseAgentAdapter` | 旧 `BaseAgent` (V39) | `execute`/`run`/`invoke`/`handle` |
| `NanobotAdapter` | 270+ nanobot class | `process`/`analyze`/`generate`/... |
| `PersonaBridge` | 旧 `WriterPersonaEngine` (V87) | voice + tone + structure |
| `MemoryBridge` | 旧 13K 行 L0-L4 memory | `LegacyMemoryItemLike` |

## Hook 系统

17 个事件 + pub/sub + 2 个内置 hook：

```ts
import { AgentHookEmitter, MetricsHook, AuditLogHook } from '@/ai/agent-runtime'

const emitter = new AgentHookEmitter()
const metrics = new MetricsHook()
const audit = new AuditLogHook(1000)
metrics.attach(emitter)
audit.attach(emitter)

emitter.subscribe('agent.spawn.after', (p) => console.log('spawned:', p))
```

## 使用示例

### 1. 启动 5 agent 团队

```ts
import { startPlotTeamDemo, simulateCollaboration, runDemo } from '@/ai/agent-runtime/demo/plot-team-demo'

const result = runDemo()
// { teamSize: 5, metrics: { totalEvents: 10, ... }, auditEntries: 5, collaboration: {...} }
```

### 2. spawn 自定义 soul

```ts
import { createSoul, createUserBinding, createMemoryScope, ManagedAgentRuntime } from '@/ai/agent-runtime'

const soul = createSoul({
  agentId: 'my-agent',
  archetype: 'specialist',
  displayName: 'My Agent',
  capabilities: ['plot', 'style'],
  memoryReadScope: 'team',
})

const runtime = new ManagedAgentRuntime()
const agent = runtime.spawn({
  soul,
  agentId: 'my-agent',
  userBinding: { visibleUserFields: ['penName'] },
})
```

### 3. 拦截 + 审计

```ts
const sanction = runtime.intercept(
  { kind: 'memory.read', target: 'other-agent', level: 'L3' },
  'my-agent',
)
if (sanction.allowed) {
  // proceed
}
```

## 验证命令

```bash
# 1. 跑全部 agent-runtime 测试
npx vitest run src/ai/agent-runtime/

# 2. 跑覆盖率（仅 agent-runtime）
npx vitest run src/ai/agent-runtime/ --coverage --coverage.include='src/ai/agent-runtime/**'

# 3. Build
npx vite build

# 4. 跑 demo
node -e "import('./src/ai/agent-runtime/demo/plot-team-demo.ts').then(m => console.log(m.runDemo()))"
```

## 已知约束

- soul 不可变（Object.freeze）；变更必须派生新 agent
- memory table 命名：`agent_${id}_L*_` 前缀，跨 agent 隔离
- bridge 适配器**不修改**旧模块（向后兼容）
- Hook payload 强类型（`PayloadFor<E>` discriminated union）

## 下一步（Direction B-G）

- **Direction B**: Agent 间协议（MessageBus/Negotiation/Vote/Delegate）
- **Direction C**: Memory 三层隔离（agent-scoped Dexie + Lease + Auction）
- **Direction D**: User 投影 + 隐私脱敏
- **Direction E**: Soul 模板市场（继承/版本/分享）
- **Direction F**: UI Collaboration Studio V4
- **Direction G**: 可观测性 + 自我进化

详见 [proposal-index.md](/proposals/proposal-index.md)。
