# Direction AW — Emotion Intensity Tuner

**V3766-V3795 · 30 engines · 51 tests · 100% pass · ≥98% coverage**

情绪强度评分 + 调节工具 + 集成。

## 灵感来源

基于 AG Emotional Arc Mapper + 情绪工程 / 情感计算 / 心理学

## 30 engines 分组

### Intensity Core (9)
- **EmotionIntensityScorer** — 强度评分（!/?/。/len + isHigh 0.7+）
- **IntensityAdjuster** — 强度调整（amplify + dampen）
- **EmotionPeakDetector** — 峰值检测（detect + hasPeak）
- **IntensityCalibrator** — 校准器（calibrate + isCalibrated 0.1）
- **EmotionDynamics** — 动力学（arc + isMonotone + isVaried）
- **EmotionCurveSmoother** — 曲线平滑（smooth + isSmoother 0.3-）
- **MoodTransitioner** — 情绪转换（transition + isNatural joy→sadness）
- **EmotionIntensityTuner** — 调节器（tune + isTuned 0.5-）
- **EmotionBalance** — 平衡（balance + isBalanced 0.5+）

### Intensity Tuning (9)
- **WordIntensityAdjuster** — 词级（amplify + isAmplified）
- **SentenceIntensityAdjuster** — 句级（boost + isBoosted 2+）
- **ParagraphIntensityAdjuster** — 段级（adjust + isAdjusted 0.3-）
- **IntensityByGenre** — 按类型（adjust + isGenreAppropriate romance/action/horror/literary）
- **IntensityByCharacter** — 按角色（adjustFor + isConsistentWith）
- **IntensityVariance** — 方差（variance + isStable 0.05-）
- **IntensityRange** — 范围（inRange + clamp）
- **IntensityDistribution** — 分布（distribution + isBalanced）
- **IntensityHistory** — 历史（record + getAll + size）

### Intensity Integration (9)
- **IntensityReport** — 报告（generate + hasReport）
- **IntensityTarget** — 目标（setTarget + getTarget）
- **IntensityTunerDirector** — 调节总监（done/amplify/dampen）
- **IntensityProfile** — 画像（set + get + all）
- **IntensityStats** — 统计（recordAdjustment + count）
- **IntensityMemoryBank** — 记忆（store + top）
- **IntensityADirector** — AI 总监（finalize/continue）
- **IntensityReview** — 评审（review + isImproved 0.1+）
- **IntensityTools** — 工具（Amplify/Dampen/Balance/Rescale）

### 收口
- **IntensityCoreIndex** / **IntensityTuningIndex** / **IntensityMasterIndex** (28 engines)

## 使用方式

```ts
import { EmotionIntensityScorer, EmotionIntensityTuner } from './src/ai/emotion_tuner/IntensityCore';
import { IntensityByGenre } from './src/ai/emotion_tuner/IntensityTuning';

const scorer = new EmotionIntensityScorer();
console.log(scorer.score('hi！！！')); // 0.3+

const tuner = new EmotionIntensityTuner();
const t = tuner.tune('hi', 0.8);
console.log(t); // 'hi！！！！！...'

const byGenre = new IntensityByGenre();
const g = byGenre.adjust('hi', 'action', 0.8);
console.log(g); // 'hi！'
```

## 测试命令

```bash
npx vitest run src/ai/emotion_tuner/ --coverage --coverage.include='src/ai/emotion_tuner/**'
```