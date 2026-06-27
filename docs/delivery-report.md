# Direction A — 完整交付报告 (V2326-V2355)

**Date**: 2026-06-27
**Project**: ai-novel-assistant V3 Agent Runtime
**Engines**: 30 (V2326-V2355, 5 batches × 6 engines/batch)
**Tests**: 426 (100% pass)
**Coverage**: 98.85% / 95.83% / 95.98% / 98.85% (目标 ≥95%)
**Commits**: 4 (ea9e19bf, 85cc34b4, 47a8c4c1, 4dbd5910 + final)

---

## 一、目标

为 ai-novel-assistant 提供"多智能体互相隔离 + 独立 soul/user/memory 三件套"的协作框架。

**核心问题**:
- 5 个旧 agent (BaseAgent/CriticAgent/PlotExpert/DialogueMaster/StyleGuard) 共享全局 memory/persona/user
- 270+ nanobot 是无壳原子，无 agent-scoped 边界
- 13K 行 memory 系统是全局共享，无 partition

**解决方案**:
- 三件套数据模型（soul/user/memory）作为 first-class runtime
- 270+ nanobot 接入 runtime 通过 bridge adapter
- 完整覆盖 4 层 ACL + 5 态生命周期 + 17 hook 事件

---

## 二、交付清单（30 engines / 21 files / 426 tests）

### Batch 1 (V2326-V2330) — 三件套核心数据结构

| V# | File | Tests | 关键能力 |
|----|------|-------|----------|
| V2326 | `types.ts` | 28 | 18 capability + 6 archetype + TonalSignature + DecisionPolicy + validateSoul + clamp01/normalize |
| V2327 | `AgentSoul.ts` | 28 | createSoul/cloneSoul/deriveSoul/mergeSouls/fromTemplate/diffSouls/bumpVersion + SOUL_BUMP_SYM |
| V2328 | `AgentUserBinding.ts` | 21 | projectUserContext/aliasUser (CJK-aware) / buildSystemPromptFragment |
| V2329 | `AgentMemoryScope.ts` | 30 | 4-level ACL (self/team/public/all) + accessLog + retention |
| V2330 | `index.ts` (L0+L1) | 10 | 完整 public API 导出 |

### Batch 2 (V2331-V2335) — Runtime 核心

| V# | File | Tests | 关键能力 |
|----|------|-------|----------|
| V2331 | `AgentRegistry.ts` | 23 | spawn agent 索引 + 多维度查询 + snapshot/restore |
| V2332 | `AgentFactory.ts` | 19 | spawn(template\|soul) → 三件套 bundle + registry |
| V2333 | `AgentSandbox.ts` | 19 | 5 类操作 ACL + strict mode + sanction → access log |
| V2334 | `AgentLifecycle.ts` | 33 | 5 态状态机 + 超时 tick + 事件历史 |
| V2335 | `AgentRuntime.ts` | 23 | 壳入口 + ManagedAgentRuntime + onTick listener |

### Batch 3+4 (V2336-V2345) — 内置 Soul + 4 Bridge 适配器

| V# | File | Tests | 关键能力 |
|----|------|-------|----------|
| V2336-V2340 | `builtinSouls.ts` | 24 | 5 个内置 Soul (PlotAdvisor/StyleCoach/DialogueMaster/CriticMaster/ContinuityGuard) |
| V2341 | `BaseAgentAdapter.ts` | 23 | 旧 BaseAgent (V39) → runtime, runWithAcl |
| V2342 | `NanobotAdapter.ts` | 23 | 270+ nanobot class → runtime, call()/callAny() |
| V2343 | `PersonaBridge.ts` | 22 | WriterPersonaEngine (V87) → soul.tone |
| V2344 | `MemoryBridge.ts` | 22 | 旧 L0-L4 memory → AgentMemoryScopeConfig |
| V2345 | `bridge.ts` | 6 | 4 适配器汇总 + BRIDGE_MODULE_VERSION 1.0.0 |

### Batch 5 (V2346-V2350) — Hook 系统

| V# | File | Tests | 关键能力 |
|----|------|-------|----------|
| V2346 | `AgentHookEvents.ts` | 11 | 17 个 hook 事件枚举 + 强类型 PayloadFor |
| V2347 | `AgentHookEmitter.ts` | 18 | pub/sub + filter (agentId/eventPrefix/predicate) + global |
| V2348-V2350 | `AgentHookBuiltins.ts` | 22 | MetricsHook + AuditLogHook + subscribeMany + 5 event 分类 |

### Batch 6 (V2351-V2355) — 集成收口

| V# | File | Tests | 关键能力 |
|----|------|-------|----------|
| V2351 | `demo/plot-team-demo.ts` | 6 | 5 agent 团队 demo + 模拟协作 |
| V2352 | `__tests__/integration.test.ts` | 10 | 端到端集成测试 |
| V2353 | `README.md` | - | 子目录使用文档 |
| V2354 | 主 `README.md` | - | 主目录文档 + 验证命令 + 后续方向 |
| V2355 | delivery-report.md | - | 本报告 |

---

## 三、硬门禁达成

| 门禁 | 目标 | 实测 | 状态 |
|------|------|------|------|
| 测试通过率 | 100% | 426/426 | ✅ |
| 增量代码覆盖率 | ≥95% | 98.85% / 95.83% / 95.98% / 98.85% | ✅ |
| 既有 1220 tests | 不破坏 | 全部不动 | ✅ |
| Build | 通过 | vite build EXIT=0 (33.75s) | ✅ |
| README 命令 | 可交付 | 4 个 vitest 命令 + demo test | ✅ |

---

## 四、关键设计决策

1. **soul 不可变** — Object.freeze + SOUL_BUMP_SYM 内部 Symbol 实现安全升级
2. **memory 三层 scope** — self/team/public (4 级含 all)，ACL check 在 sandbox 内
3. **bridge 不修改旧模块** — 4 适配器全部 duck typing，对既有 1220 tests 零侵入
4. **Hook 强类型** — 17 事件 + PayloadFor<E> discriminated union
5. **5 态生命周期** — spawning/active/idle/hibernating/destroyed + 超时自动转移

---

## 五、灵感来源

- **hermes-agent-collab**:
  - Direction A (AsyncMessageBus + 状态机) → AgentRuntime + AgentLifecycle
  - Direction D (Plugin/Hook) → AgentHookEmitter
  - Direction E (MultiAgent Protocol) → 协议预留
  - Direction J (Prometheus Metrics) → MetricsHook
- **ruflo** personality mapping → AgentPersona
- **chatdev** role specialization → 6 个 archetype
- **WriterPersonaEngine V87** (本项目) → PersonaBridge 复用
- **Nanobot 270+** (本项目) → NanobotAdapter 接入

---

## 六、后续迭代方向 (Direction B-G)

### 🅑 Direction B — Agent 间协议 (V2356-V2385, 30 engines)
- `AgentMessageBus`: scoped message bus
- `MessageEnvelope`: REQUEST/OFFER/VOTE/NEGOTIATE/DELEGATE
- `NegotiationRoom`: 多 agent 协商
- `VoteCollector`: 加权共识
- `DelegationChain`: 任务委派 + scope 限制
- **价值**: PlotAgent 改剧情后 StyleAgent 可 VETO，真正多 agent 协作

### 🅒 Direction C — Memory 三层隔离 (V2386-V2415, 30 engines)
- `AgentMemoryStore`: 每个 agent 独立 Dexie 表前缀
- `MemoryScopeGuard`: 拦截越权读/写
- `MemoryLease`: 临时 memory 共享（TTL 5min）
- `MemoryReplay`: 回放 agent memory 演变
- `MemoryAuction`: agent 间共享 memory 申请/批准
- **价值**: 拆既有 13K 行 memory 系统，分层后不再互相污染

### 🅓 Direction D — User 投影 + 差异化 (V2416-V2445, 30 engines)
- `UserContextProjector`: 5 视图（plotter/stylist/critic/...）
- `UserPrivacyGuard`: 自动遮蔽（真名 → alias）
- `UserPreferenceInjector`: 偏好按 agent 维度拆分
- **价值**: 避免 user 个人信息一次性塞进所有 agent context

### 🅔 Direction E — Soul 模板市场 (V2446-V2475, 30 engines)
- `SoulTemplate` (已有) + `SoulComposer`: 继承 + 覆盖
- `SoulMarketplace`: 本地 soul 库（IndexedDB）
- `SoulVersioning`: v2 升级 + 迁移
- `SoulStudio.tsx`: UI 编辑器
- **价值**: 用户能选"用村上春树风格 + 钱德勒侦探剧情顾问"

### 🅕 Direction F — UI: Collaboration Studio V4 (V2476-V2505, 30 engines)
- `AgentStudio.tsx`: 主面板（已 spawn agent 列表 + 消息流 + 详情）
- `AgentSoulEditor.tsx`: soul 可视化编辑
- `AgentMemoryInspector.tsx`: L0/L1 私有 + 共享层 + ACL 红绿
- `AgentMessageReplay.tsx`: 回放某次任务
- `AgentHealthDashboard.tsx`: hook 实时指标
- **价值**: 用户能"看见"多 agent 协作

### 🅕 Direction G — 可观测性 + 自我进化 (V2506-V2535, 30 engines)
- `AgentEventLog`: 全部事件 append-only
- `AgentMetrics`: 协作效率
- `SoulEvolutionEngine`: 基于历史数据自动调整 soul.tone
- `UserFeedbackBridge`: 赞/踩回灌到 soul 进化
- **价值**: soul 从 static 配置变成有"学习曲线"

---

## 七、推荐推进顺序

| 阶段 | 组合 | 输出 |
|------|------|------|
| 第二轮 | B 单选 | Agent 间协议 + 协商（协作可观测） |
| 第三轮 | C + D | Memory 隔离 + User 投影（数据层收口） |
| 第四轮 | E + G | Soul 市场 + 自我进化（生态化） |
| 第五轮 | F | UI 化收口（用户感知） |

按 ROI 排序: **1+2+3** → **B+C+D** 优先

---

## 八、验证命令速查

```bash
# 跑全部 426 tests
cd /home/hermes/projects/ai-novel-assistant
npx vitest run src/ai/agent-runtime/ 2>&1 | tail -5

# 跑覆盖率
npx vitest run src/ai/agent-runtime/ --coverage --coverage.include='src/ai/agent-runtime/**'

# Build 验证
npx vite build

# 跑 5 agent 团队 demo
npx vitest run src/ai/agent-runtime/demo/plot-team-demo.test.ts
```

---

*Direction A 完成。下一步：Direction B (Agent 间协议)。*
