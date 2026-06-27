# Soul Marketplace (V3) — Direction E

**Version**: 1.0.0
**Engines**: V2446-V2475 (30 engines, 6 batches)
**Tests**: 70+ tests, 100% pass

## 目标

Soul 模板**可分享、可继承、可版本化**。用户能选"村上春树风格 + 钱德勒侦探剧情顾问"，并通过分享链接传播给其他用户。

## 核心能力

| 能力 | 实现 |
|------|------|
| 模板发布 | `SoulMarketplace.publish(template, author)` |
| 模板搜索 | `SoulMarketplace.search(query)` |
| 安装/卸载 | `install(id)` / `uninstall(id)` |
| 激活/停用 | `activate(id)` / `deactivate(id)` |
| 评分系统 | `rate(id, rater, stars)` + `ratingFor(id)` |
| 模板组合 | `composeSoul(parent, overrides)` + `mergeSouls(...)` |
| 版本控制 | `parseSoulVersion("1.0.0")` + `SoulMigrator` |
| 弃用管理 | `SoulDeprecationRegistry` |
| 导入/导出 | `SoulExporter` + `SoulImporter` (JSON) |
| 分享链接 | `SoulShareLink.encode/decode` (base64) |
| 自动发现 | `SoulDiscovery.discover(sources)` |
| Studio UI | `SoulStudioConfig` + 6 sections |

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| V2446-V2455 | `SoulMarketplace.ts` | TemplateRegistry + Composer + Marketplace + Installer + Activation + Rating + Author + Listing + Search |
| V2456-V2460 | `SoulVersioning.ts` | SoulVersion (semver) + Changelog + Deprecation + Migrator + Compatibility |
| V2461-V2465 | `SoulExportImport.ts` | Exporter + Importer + Package + Discovery + ShareLink |
| V2466-V2470 | `SoulStudio.ts` | StudioConfig + Sections + Preview + Validator + Export |
| V2471 | `demo/soul-marketplace-demo.ts` | 5 个 demo 断言 |
| V2472 | `__tests__/soul-marketplace-integration.test.ts` | 10 个 e2e |
| V2473 | `SOUL_MARKET_README.md` | 本文档 |
| V2474 | 主 README.md 更新 | 验证命令 |
| V2475 | 收口 commit | |

## 核心 API 示例

### 1. 发布 + 安装 + 激活

```ts
import { SoulMarketplace, SoulTemplateRegistry, SoulAuthor } from '@/ai/agent-runtime/protocol'

const m = new SoulMarketplace(new SoulTemplateRegistry())
const author: SoulAuthor = { authorId: 'u1', displayName: 'Author' }
m.publish(PLOT_ADVISOR_TEMPLATE, author, { description: 'plot expert', tags: ['plot'] })
m.install('plot-advisor')
m.activate('plot-advisor')
```

### 2. 模板组合

```ts
import { composeSoul, mergeSouls } from '@/ai/agent-runtime/protocol'

const derived = composeSoul(PLOT_ADVISOR_TEMPLATE, { displayName: 'Plot Pro' })
const merged = mergeSouls(PLOT_ADVISOR_TEMPLATE, STYLE_COACH_TEMPLATE)
```

### 3. 版本控制

```ts
import { parseSoulVersion, SoulMigrator } from '@/ai/agent-runtime/protocol'

const v = parseSoulVersion('1.0.0')
const migrator = new SoulMigrator()
migrator.add({ fromVersion: '1.0.0', toVersion: '2.0.0', description: 'arch', migrate: (t) => ({ ...t, archetype: 'instructor' }) })
const newT = migrator.migrate(template, '2.0.0')
```

### 4. 分享 + 导入

```ts
import { SoulExporter, SoulImporter, SoulShareLink } from '@/ai/agent-runtime/protocol'

const link = new SoulShareLink().encode(PLOT_ADVISOR_TEMPLATE)
// "soul://base64..."

const exporter = new SoulExporter()
const json = exporter.exportJson({ packageId: 'p1', template: PLOT_ADVISOR_TEMPLATE, ... })
const result = new SoulImporter().importJson(json)
```

### 5. 评分

```ts
m.rate('plot-advisor', 'r1', 5, 'Excellent template!')
m.rate('plot-advisor', 'r2', 4)
m.ratingFor('plot-advisor')  // 4.5
```

## 验证命令

```bash
# 跑全部 protocol 测试（应 424+ passed）
npx vitest run src/ai/agent-runtime/protocol/

# 跑 soul marketplace demo
npx vitest run src/ai/agent-runtime/protocol/demo/soul-marketplace-demo.test.ts

# 跑端到端 soul 集成
npx vitest run src/ai/agent-runtime/protocol/__tests__/soul-marketplace-integration.test.ts
```

## 灵感来源

- npm registry + semver — 模板版本管理
- VSCode Extension Marketplace — 评分/评论系统
- ruflo Agent Federation — 模板共享
- Hugging Face Model Hub — soul 发布/发现

## 下一步（Direction F-G）

- **F**: UI Collaboration Studio V4（30 engines）— Visual editor
- **G**: 可观测性 + 自我进化（30 engines）— Soul metrics + evolution
