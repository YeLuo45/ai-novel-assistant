# ai-novel-assistant

AI 写作助手，多 Agent 协作写作系统（V3 Agent Runtime + 270+ nanobot）。

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
