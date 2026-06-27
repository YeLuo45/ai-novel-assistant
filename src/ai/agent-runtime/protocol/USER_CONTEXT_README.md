# User Context (V3) — Direction D

**Version**: 1.0.0
**Engines**: V2416-V2445 (30 engines, 6 batches)
**Tests**: 60+ tests, 100% pass
**Coverage**: 96%+

## 目标

为不同 archetype 的 agent 提供**差异化的 user 视图 + 隐私脱敏**。PlotAdvisor 看 plotOutline，StyleCoach 看 voiceProfile，CriticMaster 看全部。Real name + email 自动 mask/alias。

## 5 种视图

| View | 字段 | 适用 agent |
|------|------|-----------|
| `plotter` | penName, plotOutline, preferences, voiceProfile | PlotAdvisor (specialist) |
| `stylist` | penName, voiceProfile, preferences | StyleCoach (instructor) |
| `critic` | penName, plotOutline, preferences | CriticMaster (critic) |
| `dialogue` | penName, voiceProfile, preferences | DialogueMaster |
| `continuity` | penName, plotOutline, preferences | ContinuityGuard |
| `generic` | penName, preferences | 其他 |

## 隐私脱敏规则

| 字段 | 默认处理 | 可配置 |
|------|----------|--------|
| `email` | mask 前 2 字符 + `*` | ✅ |
| `realName` | alias（哈希） | ✅ |
| `phone` | mask | ✅ |
| `address` | remove | ✅ |

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| V2416-V2420 | `UserContext.ts` | UserView + UserViewRegistry + DEFAULT_VIEW_SELECTORS + UserContextProjector + buildUserView |
| V2421-V2425 | `UserContext.ts` | applyRedaction + UserPrivacyGuard + UserConsentLog |
| V2426-V2430 | `UserPreferencesAndAdapter.ts` | UserPreference + Store + Filter + Merger + Injector |
| V2431-V2435 | `UserPreferencesAndAdapter.ts` | Snapshot + Diff + Merger + Cache + Version |
| V2436-V2440 | `UserPreferencesAndAdapter.ts` | Adapter + Validator + Schema + Migrator + Exporter |
| V2441 | `demo/user-context-demo.ts` | 5 agent 投影 + 脱敏 + 注入 demo |
| V2442 | `__tests__/user-context-integration.test.ts` | 8 个 e2e 测试 |
| V2443 | `USER_CONTEXT_README.md` | 本文档 |
| V2444 | 主 README 更新 | 验证命令 |
| V2445 | 收口 commit | |

## 核心 API 示例

### 1. 投影 user context 到 agent

```ts
import { UserContextProjector } from '@/ai/agent-runtime/protocol'

const projector = new UserContextProjector()
const view = projector.project(user, 'plotter')
// view.fields = { penName, plotOutline, preferences, voiceProfile }
```

### 2. 隐私脱敏

```ts
import { UserPrivacyGuard, DEFAULT_REDACTION_RULES } from '@/ai/agent-runtime/protocol'

const guard = new UserPrivacyGuard()
const redacted = guard.guard(user)
// redacted.email = 'li*****@e*******.com' (masked)
// redacted.realName = 'alias_abc123' (aliased)
```

### 3. 同意管理

```ts
import { UserConsentLog } from '@/ai/agent-runtime/protocol'

const log = new UserConsentLog()
log.record({ userId: 'u1', consentType: 'memory', granted: true, grantedAt: Date.now() })
if (log.hasConsent('u1', 'memory')) {
  // 允许 memory 操作
}
log.revoke('u1', 'memory') // 撤销
```

### 4. 偏好注入

```ts
import { UserPreferenceStore, injectPreferences } from '@/ai/agent-runtime/protocol'

const store = new UserPreferenceStore()
store.set({ key: 'genre', value: 'scifi', category: 'meta', scope: 'global', updatedAt: Date.now() })
const final = injectPreferences(user, store, [
  { field: 'genrePref', sourceKey: 'genre' },
])
// final.genrePref = 'scifi'
```

### 5. 验证 + 迁移

```ts
import { validateUserContext, validateAgainstSchema, migrateContext } from '@/ai/agent-runtime/protocol'

const issues = validateUserContext(user)
const schemaIssues = validateAgainstSchema(user)
const migrated = migrateContext({ userId: 'u' }) // v1 → v2
```

## 验证命令

```bash
# 跑全部 protocol 测试（应 334+ passed）
npx vitest run src/ai/agent-runtime/protocol/

# 跑 user context demo
npx vitest run src/ai/agent-runtime/protocol/demo/user-context-demo.test.ts

# 跑端到端 user context 集成
npx vitest run src/ai/agent-runtime/protocol/__tests__/user-context-integration.test.ts
```

## 灵感来源

- hermes-agent-collab Direction E (MultiAgent Protocol) — agent 间协议
- ruflo Personality Mapping — 不同 agent 不同视图
- 联邦学习 Privacy Guard — 字段脱敏
- GDPR / CCPA — 同意管理

## 下一步（Direction E-G）

- **E**: Soul 模板市场（30 engines）
- **F**: UI Collaboration Studio V4（30 engines）
- **G**: 可观测性 + 自我进化（30 engines）
