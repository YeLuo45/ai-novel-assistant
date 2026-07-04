# Round 4 — V3736-V3975

**8 方向 · 240 engines · 422 tests · 100% pass · ≥98% coverage**

Round 4 创作大师方向 — 自动化与一致性。

## 8 方向总览

| 方向 | 引擎数 | 测试 | Coverage | 文档 |
|------|--------|------|----------|------|
| **AV Plot Hole Auto-Fixer** — 漏洞自动修复 | 30 | 54 | ≥98% | [AV_HOLEFIX_README.md](./AV_HOLEFIX_README.md) |
| **AW Emotion Intensity Tuner** — 情绪强度调节 | 30 | 51 | ≥98% | [AW_EMOTION_TUNER_README.md](./AW_EMOTION_TUNER_README.md) |
| **AX Voice Consistency Enforcer** — 声音一致性执行 | 30 | 57 | ≥98% | [AX_VOICE_README.md](./AX_VOICE_README.md) |
| **AY Title A/B Testing Simulator** — 标题 A/B 测试 | 30 | 52 | ≥98% | [AY_ABTEST_README.md](./AY_ABTEST_README.md) |
| **AZ Genre Compliance Checker** — 类型合规检查 | 30 | 54 | ≥98% | [AZ_GENRE_COMPLIANCE_README.md](./AZ_GENRE_COMPLIANCE_README.md) |
| **BA Co-Author Style Memory** — 协作风格记忆 | 30 | 46 | ≥98% | [BA_STYLE_MEMORY_README.md](./BA_STYLE_MEMORY_README.md) |
| **BB Backmatter Indexer** — 后记索引器 | 30 | 53 | ≥98% | [BB_BACKMATTER_INDEX_README.md](./BB_BACKMATTER_INDEX_README.md) |
| **BC Translation Memory Engine** — 翻译记忆引擎 | 30 | 55 | ≥98% | [BC_TM_ENGINE_README.md](./BC_TM_ENGINE_README.md) |

## 测试命令

```bash
# 单方向
npx vitest run src/ai/holefix/ --coverage --coverage.include='src/ai/holefix/**'
npx vitest run src/ai/emotion_tuner/ --coverage --coverage.include='src/ai/emotion_tuner/**'
npx vitest run src/ai/voice_consistency/ --coverage --coverage.include='src/ai/voice_consistency/**'
npx vitest run src/ai/abtest/ --coverage --coverage.include='src/ai/abtest/**'
npx vitest run src/ai/genre_compliance/ --coverage --coverage.include='src/ai/genre_compliance/**'
npx vitest run src/ai/style_memory/ --coverage --coverage.include='src/ai/style_memory/**'
npx vitest run src/ai/backmatter_index/ --coverage --coverage.include='src/ai/backmatter_index/**'
npx vitest run src/ai/tm_engine/ --coverage --coverage.include='src/ai/tm_engine/**'

# 全 8 方向
npx vitest run src/ai/{holefix,emotion_tuner,voice_consistency,abtest,genre_compliance,style_memory,backmatter_index,tm_engine}/
```

## 文件位置

每个方向 3 个 .ts 文件：

- `src/ai/holefix/` — Plot Hole Auto-Fixer (3 files)
- `src/ai/emotion_tuner/` — Emotion Intensity Tuner (3 files)
- `src/ai/voice_consistency/` — Voice Consistency Enforcer (3 files)
- `src/ai/abtest/` — Title A/B Testing Simulator (3 files)
- `src/ai/genre_compliance/` — Genre Compliance Checker (3 files)
- `src/ai/style_memory/` — Co-Author Style Memory (3 files)
- `src/ai/backmatter_index/` — Backmatter Indexer (3 files)
- `src/ai/tm_engine/` — Translation Memory Engine (3 files)