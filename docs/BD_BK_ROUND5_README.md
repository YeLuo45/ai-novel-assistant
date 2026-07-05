# Round 5 — V3976-V4215

**8 方向 · 240 engines · 393+ tests · 100% pass · ≥98% coverage**

Round 5 创作大师方向 — 创作流程工具与衍生。

## 8 方向总览

| 方向 | 引擎数 | 测试 | Coverage | 文档 |
|------|--------|------|----------|------|
| **BD Writing Sprint Timer** — 写作冲刺计时器 | 30 | 50 | ≥98% | [BD_SPRINT_README.md](./BD_SPRINT_README.md) |
| **BE Idea Clustering** — 想法聚类分析 | 30 | 53 | ≥98% | [BE_CLUSTERING_README.md](./BE_CLUSTERING_README.md) |
| **BF Beta Reader Auto-Match** — 测试读者自动匹配 | 30 | 39 | ≥98% | [BF_BETA_READER_README.md](./BF_BETA_READER_README.md) |
| **BG Comic Script Engine** — 漫画脚本引擎 | 30 | 55 | ≥98% | [BG_COMIC_README.md](./BG_COMIC_README.md) |
| **BH Short Story Adapter** — 短篇改编器 | 30 | 56 | ≥98% | [BH_SHORT_STORY_README.md](./BH_SHORT_STORY_README.md) |
| **BI Audio Drama Script** — 广播剧脚本 | 30 | 51 | ≥98% | [BI_AUDIO_DRAMA_README.md](./BI_AUDIO_DRAMA_README.md) |
| **BJ Trope Encyclopedia** — 套路百科 | 30 | 41 | ≥98% | [BJ_TROPE_README.md](./BJ_TROPE_README.md) |
| **BK Fandom Wiki Generator** — 同人百科生成器 | 30 | 48 | ≥98% | [BK_FANDOM_README.md](./BK_FANDOM_README.md) |

## 测试命令

```bash
# 全 8 方向
npx vitest run src/ai/{sprint,clustering,beta_match,comic,short_story,audio_drama,trope,fandom}/
```

## 文件位置

每个方向 3 个 .ts 文件：

- `src/ai/sprint/` — Writing Sprint Timer (3 files)
- `src/ai/clustering/` — Idea Clustering (3 files)
- `src/ai/beta_match/` — Beta Reader Auto-Match (3 files)
- `src/ai/comic/` — Comic Script Engine (3 files)
- `src/ai/short_story/` — Short Story Adapter (3 files)
- `src/ai/audio_drama/` — Audio Drama Script (3 files)
- `src/ai/trope/` — Trope Encyclopedia (3 files)
- `src/ai/fandom/` — Fandom Wiki Generator (3 files)