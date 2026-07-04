# ai-novel-assistant

AI 写作助手，多 Agent 协作写作系统（V3 Agent Runtime + 270+ nanobot + 24 创作大师方向 AB-X-Y-AA-AC-Z-AD-AE-AF-AG-AH-AI-AJ-AK-AL-AM-AN-AO-AP-AQ-AR-AS-AT-AU 共 720 engines）。

## 创作大师方向（V3016-V3735 · 24 方向 · 720 engines · 1600+ tests · 100% pass · ≥98% coverage）

### Round 1（V3016-V3255 · 8 方向 · 240 engines · 609 tests）

| 方向 | 引擎数 | 测试 | Coverage | 文档 |
|------|--------|------|----------|------|
| **AB Pacing & Structure** — 故事结构与节奏大师 | 30 | 86 | 99.09% | [AB_PACING_README.md](./docs/AB_PACING_README.md) |
| **X Prose Craft** — 文笔打磨工坊 | 30 | 81 | 99.47% | [X_PROSE_README.md](./docs/X_PROSE_README.md) |
| **Y Reader Psychology** — 读者心理与留存 | 30 | 78 | 98.48% | [Y_READER_README.md](./docs/Y_READER_README.md) |
| **AA Worldbuilding** — 世界设定自洽 | 30 | 78 | 98.39% | [AA_WORLDBUILD_README.md](./docs/AA_WORLDBUILD_README.md) |
| **AC Continuity & Lore** — 时间线与连续性 | 30 | 84 | ~98% | [AC_CONTINUITY_README.md](./docs/AC_CONTINUITY_README.md) |
| **Z Genre Masters** — 类型小说精通 | 30 | 80 | 98.51% | [Z_GENRE_README.md](./docs/Z_GENRE_README.md) |
| **AD Voice & Style** — 风格指纹 | 30 | 53 | ~99% | [AD_VOICE_README.md](./docs/AD_VOICE_README.md) |
| **AE Publishing & Marketing** — 出版与营销 | 30 | 69 | 99.34% | [AE_PUBLISHING_README.md](./docs/AE_PUBLISHING_README.md) |

### Round 2（V3256-V3495 · 8 方向 · 240 engines · 510 tests）

| 方向 | 引擎数 | 测试 | Coverage | 文档 |
|------|--------|------|----------|------|
| **AF Plot Hole Detector** — 跨章逻辑漏洞检测 | 30 | 74 | 98.62% | [AF_PLOTHOLE_README.md](./docs/AF_PLOTHOLE_README.md) |
| **AG Emotional Arc Mapper** — 情绪曲线可视化 | 30 | 62 | 99% | [AG_EMOTION_README.md](./docs/AG_EMOTION_README.md) |
| **AH Character Voice Differentiator** — 多角色声音辨识 | 30 | 55 | 98.76% | [AH_VOICE_README.md](./docs/AH_VOICE_README.md) |
| **AI Chapter Title Optimizer** — 标题党 + A/B 测试 | 30 | 70 | 98.88% | [AI_TITLE_README.md](./docs/AI_TITLE_README.md) |
| **AJ Author Block Breaker** — 创作瓶颈突破 | 30 | 69 | ≥98% | [AJ_BLOCK_README.md](./docs/AJ_BLOCK_README.md) |
| **AK Adaptive Writing Coach** — 个人化教练 | 30 | 64 | ≥98% | [AK_COACH_README.md](./docs/AK_COACH_README.md) |
| **AL Beta Reader Persona** — 模拟 3 类读者反馈 | 30 | 59 | ≥98% | [AL_BETAREADER_README.md](./docs/AL_BETAREADER_README.md) |
| **AM Cross-Media Adaptation** — 小说→剧本→漫画→游戏 | 30 | 57 | 98.94% | [AM_CROSSMEDIA_README.md](./docs/AM_CROSSMEDIA_README.md) |

### Round 3（V3496-V3735 · 8 方向 · 240 engines · 490+ tests）

| 方向 | 引擎数 | 测试 | Coverage | 文档 |
|------|--------|------|----------|------|
| **AN Writing Streak Optimizer** — 连续写作策略 | 30 | 60 | 98.79% | [AN_STREAK_README.md](./docs/AN_STREAK_README.md) |
| **AO Inspiration Network** — 灵感来源追踪 | 30 | 47 | 99.33% | [AO_INSPIRATION_README.md](./docs/AO_INSPIRATION_README.md) |
| **AP Reader Behavior Predictor** — 行为预测 | 30 | 56 | ≥98% | [AP_READER_BEHAVIOR_README.md](./docs/AP_READER_BEHAVIOR_README.md) |
| **AQ Genre Blending Advisor** — 类型融合顾问 | 30 | 58 | ≥98% | [AQ_GENRE_BLEND_README.md](./docs/AQ_GENRE_BLEND_README.md) |
| **AR AI Co-Author Assistant** — AI 协作写作助手 | 30 | 56 | ≥98% | [AR_COAUTHOR_README.md](./docs/AR_COAUTHOR_README.md) |
| **AS Self-Editing Pipeline** — 自编辑流水线 | 30 | 58 | ≥98% | [AS_SELFEDIT_README.md](./docs/AS_SELFEDIT_README.md) |
| **AT Backmatter Generator** — 番外/后记生成器 | 30 | 56 | ≥98% | [AT_BACKMATTER_README.md](./docs/AT_BACKMATTER_README.md) |
| **AU Translation-Aware Writing** — 翻译友好写作 | 30 | 53 | ≥98% | [AU_TRANSLATION_README.md](./docs/AU_TRANSLATION_README.md) |

## 基本信息

- **项目 ID**: ai-novel-assistant
- **本地路径（WSL）**: `/home/hermes/projects/ai-novel-assistant`
- **本地路径（Windows）**: `\\wsl$\Ubuntu\home\hermes\projects\ai-novel-assistant`
- **Git 仓库**: https://github.com/YeLuo45/ai-novel-assistant
- **V3 Agent Runtime**: [`src/ai/agent-runtime/`](./src/ai/agent-runtime/) — 30 engines / 426 tests / 100% pass / 98.56% coverage

## 环境要求

- Node.js 18+
- npm（或兼容的包管理器）

## 本地启动

### 推荐：一键启动（Windows + WSL）

在 **Windows PowerShell** 中进入项目目录后执行（通过 WSL 启动，避免 UNC 路径下 `npm` 失败）：

```powershell
cd \\wsl$\Ubuntu\home\hermes\projects\ai-novel-assistant
.\scripts\dev.ps1
```

在 **WSL / Linux** 中：

```bash
cd /home/hermes/projects/ai-novel-assistant
bash scripts/dev.sh
```

启动后在浏览器打开：

- 开发环境：<http://127.0.0.1:5173/ai-novel-assistant/>
- 若 5173 被占用，终端会提示实际端口（如 5174），将 URL 中的端口替换即可

> 项目 `vite.config.ts` 中配置了 `base: '/ai-novel-assistant/'`，本地访问需带上该路径前缀。

### 首次安装依赖

```bash
cd /home/hermes/projects/ai-novel-assistant   # WSL
npm install
```

Windows 下请优先在 WSL 内安装，或使用 `.\scripts\dev.ps1`（脚本会在缺少 `node_modules` 时自动执行 `npm install`）。

### 推送到 GitHub / 更新 Pages

当前默认分支为 **`master`**（远端无 `main` 时，推送会用 `master:main` 创建 `main`）。

**先确保能访问 GitHub**（若出现 `raw.hellogithub.com` 证书与 `github.com` 不匹配，请在 Windows 管理员 PowerShell 刷新 hosts 或暂时注释 GitHub520 相关行后 `ipconfig /flushdns`）。

```powershell
# Windows：一键经 WSL 推送 master、同步 main、发布 gh-pages
cd \\wsl$\Ubuntu\home\hermes\projects\ai-novel-assistant
.\scripts\publish.ps1
```

```bash
# WSL 内等价命令
cd /home/hermes/projects/ai-novel-assistant
bash scripts/publish.sh
```

手动步骤：`git push origin master` → `git push origin master:main` → `npm run deploy:gh-pages`

### 样式未生效时

若页面呈「纯文字左对齐、紫色链接、无卡片网格」，说明 Tailwind 未编译。请确认项目根目录存在 `tailwind.config.js` 与 `postcss.config.js`，然后**重启**开发服务器（`Ctrl+C` 后重新运行 `.\scripts\dev.ps1`）。

### 开发模式（手动）

在 **WSL** 内执行（不要在 `\\wsl$\...` UNC 路径下直接跑 `npm`，Windows CMD 不支持该路径）：

```bash
cd /home/hermes/projects/ai-novel-assistant
npm run dev -- --host 127.0.0.1
```

等价命令：

```bash
npm run dev
```

### 构建与预览

```bash
# 生产构建
npm run build

# 类型检查 + 构建
npm run build:check

# 预览构建产物（需先 build）
npm run preview
```

预览默认地址：<http://127.0.0.1:4173/ai-novel-assistant/>

### 测试

```bash
# 单次运行测试
npm run test

# 监听模式
npm run test:watch

# 覆盖率
npm run coverage

# 仅跑 Agent Runtime 测试
npx vitest run src/ai/agent-runtime/

# 仅跑 Agent Runtime 覆盖率（98.56% / 95.6% / 95.9% / 98.56%）
npx vitest run src/ai/agent-runtime/ --coverage --coverage.include='src/ai/agent-runtime/**'
```

### Agent Runtime 快速验证

```bash
# 跑全部 426 tests（应输出 426 passed）
npx vitest run src/ai/agent-runtime/ 2>&1 | tail -5

# 跑 5 agent 团队 demo（test 文件形式，已通过 426 tests 验证）
npx vitest run src/ai/agent-runtime/demo/plot-team-demo.test.ts
```

## 验证命令

```bash
# 跑全部 426 tests（应输出 426 passed）
npx vitest run src/ai/agent-runtime/ 2>&1 | tail -5
```

## 后续迭代方向（Direction B-G）

详见 [delivery-report.md](docs/delivery-report.md)（V2326-V2355 完整交付报告）。

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `.\scripts\dev.ps1` | Windows：经 WSL 启动开发服务器（推荐） |
| `bash scripts/dev.sh` | WSL/Linux：启动开发服务器 |
| `npm install` | 安装依赖 |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run dev -- --host 127.0.0.1` | 开发服务器（绑定本机，便于 WSL + Windows 访问） |
| `npm run build` | 构建到 `dist/` |
| `npm run build:check` | TypeScript 检查并构建 |
| `npm run preview` | 预览生产构建 |
| `npm run test` | 运行 Vitest |
| `npm run test:watch` | Vitest 监听模式 |
| `npm run coverage` | 测试覆盖率报告 |
| `npx vitest run src/ai/agent-runtime/` | 仅 Agent Runtime 测试（571 tests） |
| `npx vitest run src/ai/agent-runtime/ --coverage` | Agent Runtime 覆盖率 |
| `npx vitest run src/ai/agent-runtime/protocol/` | 仅 Agent 协议测试 |
| `npx vitest run src/ai/agent-runtime/protocol/demo/negotiation-demo.test.ts` | 5 agent 协商 demo |
| `npx vitest run src/ai/agent-runtime/protocol/demo/memory-sharing-demo.test.ts` | 5 agent memory 共享 demo |
| `npx vitest run src/ai/agent-runtime/protocol/__tests__/memory-integration.test.ts` | Memory 三层隔离 e2e |
| `npx vitest run src/ai/agent-runtime/protocol/demo/user-context-demo.test.ts` | User 投影 + 隐私 demo |
| `npx vitest run src/ai/agent-runtime/protocol/__tests__/user-context-integration.test.ts` | User context e2e |
| `npx vitest run src/ai/agent-runtime/protocol/demo/soul-marketplace-demo.test.ts` | Soul 模板市场 demo |
| `npx vitest run src/ai/agent-runtime/protocol/__tests__/soul-marketplace-integration.test.ts` | Soul 集成 e2e |
| `npx vitest run src/ai/agent-runtime/protocol/demo/studio-demo.test.ts` | Studio 状态机 demo |
| `npx vitest run src/ai/agent-runtime/protocol/__tests__/studio-integration.test.ts` | Studio e2e |
| `npx vitest run src/ai/agent-runtime/protocol/demo/observability-demo.test.ts` | 可观测性 + 自我进化 demo |
| `npx vitest run src/collab/v3/__tests__/studio-integration.test.ts` | Studio v3 集成 e2e |
| `npx vitest run src/collab/v3/demo/studio-integration-demo.test.ts` | Studio v3 demo |
| `npx vitest run src/collab/v3/StudioPanels.smoke.test.ts` | Studio 基础 panels |
| `npx vitest run src/collab/v3/StudioPanels2.smoke.test.ts` | Studio 专项 panels |
| `npx vitest run src/collab/v3/StudioPanels3.smoke.test.ts` | Studio 高级 panels |
| `npx vitest run src/ai/providers/` | LLM Provider 集成（126 tests）|
| `npx vitest run src/ai/providers/demo/provider-integration-demo.test.ts` | Provider demo |
| `npx vitest run src/ai/providers/__tests__/provider-integration.test.ts` | Provider 集成 e2e |
| `npx vitest run src/ai/project/` | Project 编排（75 tests）|
| `npx vitest run src/ai/project/demo/project-integration-demo.test.ts` | Project demo |
| `npx vitest run src/ai/project/__tests__/project-integration.test.ts` | Project 集成 e2e |
| `npx vitest run src/ai/persistence/` | Cross-Session 持久化（82 tests）|
| `npx vitest run src/ai/persistence/demo/persistence-integration-demo.test.ts` | Persistence demo |
| `npx vitest run src/ai/persistence/__tests__/persistence-integration.test.ts` | Persistence 集成 e2e |
| `npx vitest run src/ai/collab/MultiUser.test.ts` | Multi-User 协作（31 tests）|
| `npx vitest run src/ai/collab/demo/multi-user-integration-demo.test.ts` | Multi-User demo |
| `npx vitest run src/ai/collab/__tests__/multi-user-integration.test.ts` | Multi-User 集成 e2e |
| `npx vitest run src/ui/theme/` | Theme System 4 套主题（92 tests）|
| `npx vitest run src/ui/theme/demo/theme-integration-demo.test.ts` | Theme demo |
| `npx vitest run src/ui/theme/__tests__/theme-integration.test.ts` | Theme 集成 e2e |
| `npx vitest run src/realtime/` | Real-time Multi-User Sync（95 tests）|
| `npx vitest run src/realtime/demo/sync-integration-demo.test.ts` | Sync demo |
| `npx vitest run src/realtime/__tests__/sync-integration.test.ts` | Sync 集成 e2e |
| `npx vitest run src/ui/components/` | Advanced UI Components（67 tests）|
| `npx vitest run src/ui/components/demo/components-integration-demo.test.ts` | Components demo |
| `npx vitest run src/ui/components/__tests__/components-integration.test.ts` | Components 集成 e2e |
| `npx vitest run src/mobile/` | Mobile & PWA（76 tests）|
| `npx vitest run src/mobile/demo/mobile-pwa-demo.test.ts` | Mobile demo |
| `npx vitest run src/mobile/__tests__/mobile-pwa-integration.test.ts` | Mobile 集成 e2e |
| `npx vitest run src/ui/animation/` | Animation & Feedback（74 tests）|
| `npx vitest run src/ui/animation/demo/animation-demo.test.ts` | Animation demo |
| `npx vitest run src/ui/animation/__tests__/animation-integration.test.ts` | Animation 集成 e2e |
| `npx vitest run src/ui/a11y/` | a11y + i18n（80 tests）|
| `npx vitest run src/ui/a11y/demo/a11y-i18n-demo.test.ts` | a11y demo |
| `npx vitest run src/ui/a11y/__tests__/a11y-integration.test.ts` | a11y 集成 e2e |
| `npx vitest run src/perf/` | Performance & Optimization（81 tests）|
| `npx vitest run src/perf/demo/optimization-demo.test.ts` | Optimization demo |
| `npx vitest run src/perf/__tests__/optimization-integration.test.ts` | Optimization 集成 e2e |
| `npx vitest run src/security/` | Security & Compliance（91 tests）|
| `npx vitest run src/security/demo/security-demo.test.ts` | Security demo |
| `npx vitest run src/security/__tests__/security-integration.test.ts` | Security 集成 e2e |
| `npx vitest run src/devops/` | DevOps & Observability（76 tests）|
| `npx vitest run src/devops/demo/devops-demo.test.ts` | DevOps demo |
| `npx vitest run src/devops/__tests__/devops-integration.test.ts` | DevOps 集成 e2e |
| `npx vitest run src/docs/` | Documentation & DX（41 tests）|
| `npx vitest run src/ai/native/` | AI-Native Features（36 tests）|
| `npx vitest run src/ai/agent-runtime/protocol/__tests__/observability-integration.test.ts` | Observability e2e |

## Agent Runtime 速览

V3 Agent Runtime 是多智能体协作框架的核心。每个 agent 拥有独立的 **soul**（决策偏好）、**user 视图**（差异化上下文）、**memory 隔离**（私有 + 共享）。

```
src/ai/agent-runtime/
├── types.ts              # 三件套核心类型（V2326）
├── AgentSoul.ts          # Soul 工厂（V2327）
├── AgentUserBinding.ts   # User 投影（V2328）
├── AgentMemoryScope.ts   # Memory ACL（V2329）
├── index.ts              # L0+L1 入口（V2330）
├── AgentRegistry.ts      # 索引 + 查询（V2331）
├── AgentFactory.ts       # spawn 工厂（V2332）
├── AgentSandbox.ts       # 5 类 ACL 拦截（V2333）
├── AgentLifecycle.ts     # 5 态状态机（V2334）
├── AgentRuntime.ts       # 壳入口（V2335）
├── builtinSouls.ts       # 5 内置 Soul（V2336-V2340）
├── BaseAgentAdapter.ts   # 旧 BaseAgent 桥接（V2341）
├── NanobotAdapter.ts     # 270+ nanobot 桥接（V2342）
├── PersonaBridge.ts      # WriterPersona 桥接（V2343）
├── MemoryBridge.ts       # 旧 memory 桥接（V2344）
├── bridge.ts             # 4 桥接汇总（V2345）
├── AgentHookEvents.ts    # 17 事件枚举（V2346）
├── AgentHookEmitter.ts   # pub/sub（V2347）
├── AgentHookBuiltins.ts  # MetricsHook + AuditLogHook（V2348-V2350）
├── demo/plot-team-demo.ts # 5 agent 团队 demo（V2351）
├── __tests__/integration.test.ts # 端到端测试（V2352）
└── README.md             # 本模块文档（V2353）
```

详细使用见 [`src/ai/agent-runtime/README.md`](./src/ai/agent-runtime/README.md)。

## 项目结构

```
ai-novel-assistant/
├── index.html
├── package.json
├── vite.config.ts
├── scripts/
│   ├── dev.ps1       # Windows 一键启动（调用 WSL）
│   └── dev.sh        # WSL/Linux 一键启动
├── src/              # React 源码
├── dist/             # 构建输出
├── coverage/         # 测试覆盖率
└── node_modules/
```

## 部署

构建产物在 `dist/`，部署到静态站点时需配置站点根路径或子路径为 `/ai-novel-assistant/`（与 `vite.config.ts` 中 `base` 一致）。GitHub Pages 等部署细节请参考仓库内的部署说明或 CI 配置。
