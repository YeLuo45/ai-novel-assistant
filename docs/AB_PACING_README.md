# Direction AB — Pacing & Structure Mastery

**V3016-V3045 · 30 engines · 86 tests · 100% pass · 99.09% coverage**

故事结构与节奏大师 — 把"故事是否在正确位置发生正确的事"从直觉变成可验证的结构工程。

## 灵感来源

Save the Cat (Blake Snyder) / Story Grid (Shawn Coyne) / 七点结构 (Holt) / 雪花写作法 (Snyder) / K.M.Weiland 结构工程 / 救猫咪节拍表 / 麦基《故事》

## 30 engines 分组

### 结构模板 (5)
- **ThreeActStructure** — 三幕结构（建置/对抗/解决）
- **HeroJourney12Stages** — 英雄之旅 12 阶段
- **SaveTheCat15Beats** — 救猫咪 15 节拍
- **StoryGrid5Commandments** — 故事网格 5 大戒律
- **SnowflakeMethod10Steps** — 雪花写作法 10 步

### 场景功能 (6)
- **ScenePurpose** — 场景目的（goal/conflict/disaster）
- **MRUDetector** — 动机-反应单元检测
- **SceneSequelBalance** — 场景-后续平衡
- **IncitingIncidentLocator** — 激励事件定位
- **MidpointDetector** — 中点检测
- **ClimaxMapper** — 高潮映射

### 关键时刻 (5)
- **AllIsLostMoment** — 失去一切时刻
- **DarkNightOfSoul** — 灵魂黑夜
- **MirrorMoment** — 镜像时刻
- **BStoryDetector** — B 故事检测
- **FinaleConvergence** — 终局汇聚

### 伏笔账本 (6)
- **ForeshadowPlanter** — 伏笔埋设器
- **ForeshadowPayoffTracker** — 伏笔回收追踪
- **PlantPayoffLedger** — 铺垫-回收账本
- **ChekhovGunAuditor** — 契诃夫之枪审计
- **SetupReminder** — 铺垫提醒
- **PayoffStrengthScorer** — 回收强度评分

### 节奏曲线 (4)
- **TensionCurve** — 张力曲线追踪
- **ConflictEscalationCurve** — 冲突升级曲线
- **PacingVisualizer** — 节奏可视化
- **SceneSummaryRatio** — 场景-总结比

### 子线编织 (4)
- **SubplotWeaver** — 子线编织
- **SubplotInterleaveValidator** — 子线交错合理性
- **POVSwitchingReasonableness** — 视角切换合理性
- **TimeJumpAuditor** — 时间跳跃审计

## 使用方式

```ts
import { ThreeActStructure, ForeshadowPlanter, PacingVisualizer } from './src/ai/pacing/StructureTemplates';
import { ChekhovGunAuditor } from './src/ai/pacing/MomentsForeshadow';
import { TensionCurve, PacingVisualizer, SubplotWeaver } from './src/ai/pacing/PacingSubplot';

const three = new ThreeActStructure();
const act = three.classify(0.85); // act: 3 (高潮)

const curve = new TensionCurve();
curve.addPoint(1, 0.3);
curve.addPoint(5, 0.7);
console.log(curve.averageTension()); // 0.5

const chekhov = new ChekhovGunAuditor();
chekhov.introduce('gun', 1);
chekhov.use('gun', 10);
console.log(chekhov.getUnused()); // []
```

## 测试命令

```bash
npx vitest run src/ai/pacing/ --coverage --coverage.include='src/ai/pacing/**'
```

## 文件位置

- `src/ai/pacing/StructureTemplates.ts` — 结构模板 + 场景功能
- `src/ai/pacing/MomentsForeshadow.ts` — 关键时刻 + 伏笔
- `src/ai/pacing/PacingSubplot.ts` — 节奏 + 子线 + 收口
