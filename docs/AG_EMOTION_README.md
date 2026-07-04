# Direction AG — Emotional Arc Mapper

**V3286-V3315 · 30 engines · 62 tests · 100% pass · 99% coverage**

情绪曲线可视化 + 净化点 + 弃文情绪预测。

## 灵感来源

情感计算 / reader engagement 前置 / 共情曲线 / Save the Cat 心理学基础

## 30 engines 分组

### 情绪画像 (9)
- **EmotionProfile** — 角色情绪画像（8 emotion + dominantEmotion）
- **EmotionIntensity** — 情绪强度（low/medium/high 3 等级 + score 0-1）
- **EmotionWordCounter** — 情绪词计数（8 emotion lexicon + totalEmotionWords）
- **EmotionTypeDistribution** — 情绪类型分布（dominantType）
- **EmotionalValence** — 情绪效价（positive/negative/neutral + compute -1 to 1）
- **EmotionalArousal** — 情绪唤醒度（high/low/medium + 0-1）
- **EmotionDuration** — 情绪持续时间（trackDuration + isStagnant 5+）
- **EmotionTransition** — 情绪转换（detect + isVolatile 50%+）
- **EmotionalPeakDetector** — 情绪峰值（0.8+ + hasCatharticPeak 0.95+）

### 弧线可视化 (9)
- **ArcVisualizer** — 弧线可视化（▁▂▃▄▅▆▇█ ASCII + renderProfile）
- **MultiCharacterArcOverlay** — 多角色弧线叠加（overlay + alignedArcs）
- **ChapterEmotionProfile** — 章节情绪画像（setProfile + get + getAll）
- **EmotionVsTension** — 情绪 vs 张力（computeGap + isAligned + contrastScore）
- **ReaderEmpathyPredictor** — 读者共情预测（peaks + empathy + isHighlyEmpathetic）
- **EmotionStagnationDetector** — 情绪停滞检测（windowSize 5 + variance 0.01）
- **CatharticReleasePlanner** — 净化释放规划（recommend + isReadyForRelease）
- **EmotionalBeatsMapper** — 情绪节拍映射（mapBeats + countMajorBeats 0.7+）
- **MoodContagion** — 情绪传染（setInfluence + predict）

### 集成 (9)
- **FullStoryEmotionAnalyzer** — 全文情绪分析（avgIntensity + dominant + peaks）
- **PerChapterEmotionDistribution** — 每章情绪分布（build + isConsistent）
- **EmotionalPacingAdvisor** — 情绪节奏建议（addJoy/addTension/addCatharsis）
- **ConflictEmotionTracker** — 冲突情绪追踪（record + isConflictHeavy 5+）
- **ResolutionEmotionTracker** — 解决情绪追踪（hasResolution joy/love）
- **ReaderDropEmotionPredictor** — 弃文情绪预测（sustained sadness risk）
- **BingeEmotionPredictor** — 暴读情绪预测（high joy binge score）
- **GenreEmotionProfile** — 类型情绪画像（4 genre: romance/mystery/horror/adventure）
- **EmotionChapterSummary** — 章节情绪摘要（top 3 emotions）

### 收口 (3)
- **EmotionProfileIndex** — 9 engines 收口
- **EmotionArcIndex** — 9 engines 收口
- **EmotionArcIndexFinal** — 28 engines 收口

## 使用方式

```ts
import { EmotionProfile, EmotionalValence, EmotionalPeakDetector } from './src/ai/emotion/EmotionProfile';
import { ArcVisualizer, CatharticReleasePlanner } from './src/ai/emotion/EmotionArcVisualization';
import { FullStoryEmotionAnalyzer, BingeEmotionPredictor } from './src/ai/emotion/EmotionIntegration';

const profile = new EmotionProfile();
profile.record('Alice', 1, 'joy', 0.8);
profile.record('Alice', 2, 'sadness', 0.6);
console.log(profile.dominantEmotion('Alice')); // 'joy' 或 'sadness'

const valence = new EmotionalValence();
console.log(valence.compute('开心快乐爱。')); // > 0

const visualizer = new ArcVisualizer();
const intensities = [0.1, 0.5, 0.9, 0.3, 0.7];
console.log(visualizer.asciiCurve(intensities)); // '▁▄█▃▆'
```

## 测试命令

```bash
npx vitest run src/ai/emotion/ --coverage --coverage.include='src/ai/emotion/**'
```

## 文件位置

- `src/ai/emotion/EmotionProfile.ts` — 情绪画像
- `src/ai/emotion/EmotionArcVisualization.ts` — 弧线可视化
- `src/ai/emotion/EmotionIntegration.ts` — 集成 + 收口
