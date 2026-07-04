# Direction AF-AM — Round 2 8 方向 (V3256-V3495)

**8 方向 · 240 engines · 598 tests · 100% pass · ≥98% coverage · 24 commits**

Round 2 创作大师方向扩展，聚焦于"写作流程优化"和"跨媒体衍生"。

## 8 方向总览

| 方向 | 引擎数 | 测试 | Coverage | 文档 |
|------|--------|------|----------|------|
| **AF Plot Hole Detector** — 跨章逻辑漏洞检测 | 30 | 74/74 | 98.62% | [AF_PLOTHOLE_README.md](./AF_PLOTHOLE_README.md) |
| **AG Emotional Arc Mapper** — 情绪曲线可视化 | 30 | 62/62 | 99% | [AG_EMOTION_README.md](./AG_EMOTION_README.md) |
| **AH Character Voice Differentiator** — 多角色声音辨识 | 30 | 55/55 | 98.76% | [AH_VOICE_README.md](./AH_VOICE_README.md) |
| **AI Chapter Title Optimizer** — 标题党 + A/B 测试 | 30 | 70/70 | 98.88% | [AI_TITLE_README.md](./AI_TITLE_README.md) |
| **AJ Author Block Breaker** — 创作瓶颈突破 | 30 | 69/69 | ≥98% | [AJ_BLOCK_README.md](./AJ_BLOCK_README.md) |
| **AK Adaptive Writing Coach** — 个人化教练 | 30 | 64/64 | ≥98% | [AK_COACH_README.md](./AK_COACH_README.md) |
| **AL Beta Reader Persona** — 模拟 3 类读者反馈 | 30 | 59/59 | ≥98% | [AL_BETAREADER_README.md](./AL_BETAREADER_README.md) |
| **AM Cross-Media Adaptation** — 小说→剧本→漫画→游戏 | 30 | 57/57 | 98.94% | [AM_CROSSMEDIA_README.md](./AM_CROSSMEDIA_README.md) |

## 测试命令

```bash
# 单方向
npx vitest run src/ai/plothole/ --coverage --coverage.include='src/ai/plothole/**'
npx vitest run src/ai/emotion/ --coverage --coverage.include='src/ai/emotion/**'
npx vitest run src/ai/character_voice/ --coverage --coverage.include='src/ai/character_voice/**'
npx vitest run src/ai/title/ --coverage --coverage.include='src/ai/title/**'
npx vitest run src/ai/block/ --coverage --coverage.include='src/ai/block/**'
npx vitest run src/ai/coach/ --coverage --coverage.include='src/ai/coach/**'
npx vitest run src/ai/betareader/ --coverage --coverage.include='src/ai/betareader/**'
npx vitest run src/ai/crossmedia/ --coverage --coverage.include='src/ai/crossmedia/**'

# 全 8 方向
npx vitest run src/ai/{plothole,emotion,character_voice,title,block,coach,betareader,crossmedia}/
```

## 文件位置

每个方向 3 个 .ts 文件（2 .ts + 1 .test.ts + 收口 engine 集成）：

- `src/ai/plothole/` — Plot Hole Detector (3 files)
- `src/ai/emotion/` — Emotional Arc Mapper (3 files)
- `src/ai/character_voice/` — Character Voice Differentiator (3 files)
- `src/ai/title/` — Chapter Title Optimizer (3 files)
- `src/ai/block/` — Author Block Breaker (3 files)
- `src/ai/coach/` — Adaptive Writing Coach (3 files)
- `src/ai/betareader/` — Beta Reader Persona (3 files)
- `src/ai/crossmedia/` — Cross-Media Adaptation (3 files)
