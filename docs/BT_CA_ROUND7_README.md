# Round 7 — V4376-V4615

**8 方向 · 240 engines · 281+ tests · 100% pass · ≥98% coverage**

Round 7 创作大师方向 — 番茄小说发布 + 语音 + 扩展切换。

## 8 方向总览

| 方向 | 引擎数 | 测试 | Coverage | 文档 |
|------|--------|------|----------|------|
| **BT Tomato Novel Publisher** — 番茄小说发布 | 30 | 36 | ≥98% | [BT_TOMATO_README.md](./BT_TOMATO_README.md) |
| **BU Voice Dictation Engine** — 语音听写 | 30 | 35 | ≥98% | [BU_VOICE_DICTATION_README.md](./BU_VOICE_DICTATION_README.md) |
| **BV Extension Manager** — 扩展管理 | 30 | 34 | ≥98% | [BV_EXTENSION_README.md](./BV_EXTENSION_README.md) |
| **BW Tomato Style Adapter** — 番茄风格 | 30 | 38 | ≥98% | [BW_TOMATO_STYLE_README.md](./BW_TOMATO_STYLE_README.md) |
| **BX Voice Command Engine** — 语音命令 | 30 | 36 | ≥98% | [BX_VOICE_COMMAND_README.md](./BX_VOICE_COMMAND_README.md) |
| **BY Multi-Platform Publisher** — 多平台 | 30 | 39 | ≥98% | [BY_MULTI_PLATFORM_README.md](./BY_MULTI_PLATFORM_README.md) |
| **BZ Plugin Registry** — 插件注册 | 30 | 33 | ≥98% | [BZ_PLUGIN_README.md](./BZ_PLUGIN_README.md) |
| **CA Voice Emotion Detector** — 语音情感 | 30 | 32 | ≥98% | [CA_VOICE_EMOTION_README.md](./CA_VOICE_EMOTION_README.md) |

## 测试命令

```bash
# 全 8 方向
npx vitest run src/ai/{tomato,voice,extension,tomato_style,voice_command,multi_platform,plugin_registry,voice_emotion}/
```

## 文件位置

- `src/ai/tomato/` — Tomato Novel Publisher
- `src/ai/voice/` — Voice Dictation Engine
- `src/ai/extension/` — Extension Manager
- `src/ai/tomato_style/` — Tomato Style Adapter
- `src/ai/voice_command/` — Voice Command Engine
- `src/ai/multi_platform/` — Multi-Platform Publisher
- `src/ai/plugin_registry/` — Plugin Registry
- `src/ai/voice_emotion/` — Voice Emotion Detector

## 核心场景

- **番茄小说发布**: BT 完整发布闭环 (账号 → 章节 → 监控)
- **语音输入**: BU + BX + CA 三层语音栈 (听写 → 命令 → 情感)
- **扩展切换**: BV + BZ 插件基础设施 (Registry + Market)