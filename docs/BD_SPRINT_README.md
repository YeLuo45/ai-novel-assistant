# Direction BD — Writing Sprint Timer

**V3976-V4005 · 30 engines · 50 tests · 100% pass · ≥98% coverage**

写作冲刺计时器 + 目标预测 + 习惯追踪 + 集成。

## 灵感来源

番茄工作法 / Flowtime / 52/17 / 写作者专注训练

## 30 engines 分组

### Sprint Core (9)
- SprintTimer / SprintTracker / SprintSessionType / SprintProgress / SprintGoalSetter / SprintBreakTimer / SprintGoalPredictor / SprintDistractionLogger / SprintStats

### Sprint Advanced (9)
- SprintLeaderboard / SprintGroupSession / SprintReward / SprintStreak / SprintNotification / SprintRecoveryTime / SprintEnergyEstimate / SprintProductivityCalculator / SprintHabit

### Sprint Integration (9)
- SprintRunner / SprintSchedule / SprintChallenge / SprintPhase / SprintFocusMusic / SprintADirector / SprintLibrary / SprintTools / SprintReport

### 收口
- SprintCoreIndex / SprintAdvancedIndex / SprintMasterIndex

## 使用方式

```ts
import { SprintTimer, SprintTracker } from './src/ai/sprint/SprintCore';

const timer = new SprintTimer();
const sprint = timer.start(30);
console.log(timer.remaining(sprint)); // 30
```

## 测试

```bash
npx vitest run src/ai/sprint/
```