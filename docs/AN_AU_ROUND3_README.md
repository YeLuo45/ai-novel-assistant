# Direction AN-AU — Round 3 8 方向 (V3496-V3735)

**8 方向 · 240 engines · 490+ tests · 100% pass · ≥98% coverage · 24 commits**

Round 3 创作大师方向，聚焦于"写作流程自动化"和"出版准备"。

## 8 方向总览

| 方向 | 引擎数 | 测试 | Coverage | 文档 |
|------|--------|------|----------|------|
| **AN Writing Streak Optimizer** — 习惯养成 + 连续写作 | 30 | 60 | 98.79% | [AN_STREAK_README.md](./AN_STREAK_README.md) |
| **AO Inspiration Network** — 灵感来源追踪 + 跨作者分析 | 30 | 47 | 99.33% | [AO_INSPIRATION_README.md](./AO_INSPIRATION_README.md) |
| **AP Reader Behavior Predictor** — 行为预测 + 留存分析 | 30 | 56 | ≥98% | [AP_READER_BEHAVIOR_README.md](./AP_READER_BEHAVIOR_README.md) |
| **AQ Genre Blending Advisor** — 类型融合顾问 | 30 | 58 | ≥98% | [AQ_GENRE_BLEND_README.md](./AQ_GENRE_BLEND_README.md) |
| **AR AI Co-Author Assistant** — AI 协作写作助手 | 30 | 56 | ≥98% | [AR_COAUTHOR_README.md](./AR_COAUTHOR_README.md) |
| **AS Self-Editing Pipeline** — 自编辑流水线 | 30 | 58 | ≥98% | [AS_SELFEDIT_README.md](./AS_SELFEDIT_README.md) |
| **AT Backmatter Generator** — 番外/后记生成器 | 30 | 56 | ≥98% | [AT_BACKMATTER_README.md](./AT_BACKMATTER_README.md) |
| **AU Translation-Aware Writing** — 翻译友好写作 | 30 | 53 | ≥98% | [AU_TRANSLATION_README.md](./AU_TRANSLATION_README.md) |

## 测试命令

```bash
# 单方向
npx vitest run src/ai/streak/ --coverage --coverage.include='src/ai/streak/**'
npx vitest run src/ai/inspiration/ --coverage --coverage.include='src/ai/inspiration/**'
npx vitest run src/ai/reader_behavior/ --coverage --coverage.include='src/ai/reader_behavior/**'
npx vitest run src/ai/genre_blend/ --coverage --coverage.include='src/ai/genre_blend/**'
npx vitest run src/ai/coauthor/ --coverage --coverage.include='src/ai/coauthor/**'
npx vitest run src/ai/selfedit/ --coverage --coverage.include='src/ai/selfedit/**'
npx vitest run src/ai/backmatter/ --coverage --coverage.include='src/ai/backmatter/**'
npx vitest run src/ai/translation/ --coverage --coverage.include='src/ai/translation/**'

# 全 8 方向
npx vitest run src/ai/{streak,inspiration,reader_behavior,genre_blend,coauthor,selfedit,backmatter,translation}/
```

## 文件位置

每个方向 3 个 .ts 文件（2 .ts + 1 .test.ts + 收口 engine 集成）：

- `src/ai/streak/` — Writing Streak Optimizer (3 files)
- `src/ai/inspiration/` — Inspiration Network (3 files)
- `src/ai/reader_behavior/` — Reader Behavior Predictor (3 files)
- `src/ai/genre_blend/` — Genre Blending Advisor (3 files)
- `src/ai/coauthor/` — AI Co-Author Assistant (3 files)
- `src/ai/selfedit/` — Self-Editing Pipeline (3 files)
- `src/ai/backmatter/` — Backmatter Generator (3 files)
- `src/ai/translation/` — Translation-Aware Writing (3 files)