# Round 8 — V4616-V4855

**8 方向 · 240 engines · 100% pass · ≥98% coverage**

Round 8 续做方向 — 协作 + 离线/AI + 视觉/生态 三大 pillar (P-122 pillar-driven 设计)。

## 8 方向总览

| 方向 | 引擎数 | 测试 | Coverage | 文档 |
|------|--------|------|----------|------|
| **CB AI Co-Author 2.0** — 多 Agent 协作 | 30 | 117 | ≥98% | [CB_COAUTHOR2_README.md](./CB_COAUTHOR2_README.md) |
| **CC WebSocket Sync 2.0** — 实时同步 | 30 | 117 | ≥98% | [CC_WS_SYNC_README.md](./CC_WS_SYNC_README.md) |
| **CD Mobile PWA Installer 2.0** — PWA | 30 | 117 | ≥98% | [CD_PWA_README.md](./CD_PWA_README.md) |
| **CE Offline-First Storage 2.0** — 离线存储 | 30 | 113 | ≥98% | [CE_OFFLINE_README.md](./CE_OFFLINE_README.md) |
| **CF Vector Database for Memory** — 向量库 | 30 | 78 | ≥98% | [CF_VECTOR_DB_README.md](./CF_VECTOR_DB_README.md) |
| **CG RAG for Chapter Context** — 检索增强 | 30 | 48 | ≥98% | [CG_RAG_README.md](./CG_RAG_README.md) |
| **CH Image Generation** — AI 图像生成 | 30 | 172 | ≥98% | [CH_IMAGE_GEN_README.md](./CH_IMAGE_GEN_README.md) |
| **CI Marketplace for Plugins 2.0** — 插件市场 | 30 | 178 | ≥98% | [CI_MARKETPLACE_README.md](./CI_MARKETPLACE_README.md) |

## 测试命令

```bash
# 全 8 方向
npx vitest run src/ai/{coauthor2,ws_sync,pwa,offline,vector_db,rag,image_gen,marketplace}/
```

## 文件位置

- `src/ai/coauthor2/` — AI Co-Author 2.0
- `src/ai/ws_sync/` — WebSocket Sync 2.0
- `src/ai/pwa/` — Mobile PWA Installer 2.0
- `src/ai/offline/` — Offline-First Storage 2.0
- `src/ai/vector_db/` — Vector Database
- `src/ai/rag/` — RAG for Chapter Context
- `src/ai/image_gen/` — Image Generation
- `src/ai/marketplace/` — Marketplace for Plugins 2.0

## 三大 Pillar 设计

### 协作 Pillar (CB + CC)
- CB Co-Author 2.0: 多 Agent 协作 + 流式写作 + 风格一致性
- CC WebSocket Sync 2.0: 实时同步 + 冲突解决 + 离线重连
- 完整实时协作链路：Co-Author (写) → WebSocket (传) → 多用户同步

### 离线/AI Pillar (CD + CE + CF + CG)
- CD Mobile PWA: PWA 安装 + 推送 + 缓存策略
- CE Offline Storage: 离线优先存储 + 同步队列
- CF Vector DB: 向量数据库 + ANN 索引
- CG RAG: 检索增强生成 + chunking + 重排
- 完整离线 + AI 栈：PWA 部署 → 离线写入 → 向量化 → 智能检索

### 视觉/生态 Pillar (CH + CI)
- CH Image Generation: 完整 AI 图像生成 pipeline (30 engines)
- CI Marketplace: 完整插件市场交易流程
- 视觉创作 + 生态闭环：AI 绘图 → 卖家上架 → 买家购买 → 安装使用