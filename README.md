# ai-novel-assistant

AI 写作助手，多 Agent 协作写作系统（V65 Collaboration Studio V3）。

## 基本信息

- **项目 ID**: ai-novel-assistant
- **本地路径（WSL）**: `/home/hermes/projects/ai-novel-assistant`
- **本地路径（Windows）**: `\\wsl$\Ubuntu\home\hermes\projects\ai-novel-assistant`
- **Git 仓库**: https://github.com/YeLuo45/ai-novel-assistant
- **创建时间**: 2026-06-01

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
```

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
