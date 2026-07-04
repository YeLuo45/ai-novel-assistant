# Direction AN — Writing Streak Optimizer

**V3496-V3525 · 30 engines · 60 tests · 100% pass · 98.79% coverage**

连续写作策略 + 习惯养成心理学 + 最佳写作时间 + 抗干扰 + 动量管理。

## 灵感来源

Atomic Habits / 写作马拉松 / 习惯养成心理学 / James Clear / 学习曲线

## 30 engines 分组

### Streak Core (9)
- **StreakCalculator** — 连续天数计算（record + currentStreak + bestStreak）
- **StreakRecord** — 连续记录（addSession + totalWords + averageQuality）
- **HabitLoopBuilder** — 习惯循环（cue + routine + reward + isComplete）
- **DailyGoalSuggester** — 每日目标（suggest + isAmbitious 2x + isRealistic 100-5000）
- **ProgressVisualizer** — 进度可视化（renderCalendar + renderProgressBar + renderStreak 🔥）
- **StreakMilestone** — 里程碑（7/14/30/60/100/365 + isMajorMilestone）
- **StreakRecovery** — 连续恢复（4 tier recommendation + isRecoverable 30-）
- **HabitStackingEngine** — 习惯堆叠（stack + isValidStack + suggestAnchor）
- **TriggerRoutineBuilder** — 触发器+惯例（build + isComplete）

### Streak Advanced (9)
- **StreakPredictor** — 连续预测（predict + isOnTrackToExtend 0.7+）
- **EnergyLevelPredictor** — 能量预测（peak hours 9-11/15-17 + isPeakHour）
- **OptimalWritingTime** — 最佳写作时间（recommend by history max words）
- **StreakRewardSystem** — 奖励系统（4 milestones + nextMilestone）
- **HabitResistancePredictor** — 抗干扰（distractions sum + isHighRisk 0.7+）
- **ProductivityAnalyzer** — 生产力分析（wordsPerHour + trend up/down/stable）
- **WritingEnvironmentOptimizer** — 环境优化（6 factors + issues + suggestions）
- **DistractionBlocker** — 干扰拦截（record + topDistractions）
- **MomentumTracker** — 动量追踪（recordSession + recordSkip + isHighMomentum 0.7+）

### Streak Integration (9)
- **StreakCoachingAI** — AI 教练（5 message + isEncouraging）
- **StreakStrategyRecommender** — 策略推荐（4 stage）
- **WritingSessionPlanner** — 写作会话规划（warmup + writing + review）
- **DailyWritingRoutine** — 每日惯例（generate + hasMinimumSteps）
- **StreakInsightsGenerator** — 洞察生成（stats → text）
- **StreakGoalTracker** — 目标追踪（add + update + getProgress + isAchieved）
- **StreakProgressReport** — 进度报告（markdown 周报）
- **StreakADirector** — AI 总监（decideAction rest/easy/normal/hard）
- **HabitFormationPredictor** — 习惯形成预测（21 days + consistency）

### 收口
- **StreakCoreIndex** / **StreakAdvancedIndex** / **StreakMasterIndex** (28 engines)

## 使用方式

```ts
import { StreakCalculator, DailyGoalSuggester, ProductivityAnalyzer } from './src/ai/streak/StreakCore';
import { EnergyLevelPredictor, StreakPredictor } from './src/ai/streak/StreakAdvanced';
import { HabitFormationPredictor, StreakADirector } from './src/ai/streak/StreakIntegration';

const calc = new StreakCalculator();
calc.record('2026-01-01');
calc.record('2026-01-02');
console.log(calc.currentStreak('2026-01-02')); // 2

const predictor = new HabitFormationPredictor();
console.log(predictor.predict(21, 1.0)); // 1.0 (已形成)

const director = new StreakADirector();
console.log(director.decideAction({ streak: 30, todayDone: false, energy: 0.7 })); // 'hard'
```

## 测试命令

```bash
npx vitest run src/ai/streak/ --coverage --coverage.include='src/ai/streak/**'
```