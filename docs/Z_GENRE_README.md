# Direction Z — Genre Masters

**V3166-V3195 · 30 engines · 80 tests · 100% pass · 98.51% coverage**

类型小说精通 — 每种类型专属的"规矩"和"爽点"。

## 灵感来源

网文流派研究 (起点/番茄分类) / 推理小说十诫 (诺克斯/范达因) / 科幻硬伤百科 / 奇幻魔法体系研究 / 言情节奏理论 / 东野圭吾/阿加莎结构分析

## 30 engines 分组

### 网文 (6)
- **HuanDianScheduler** — 爽点编排（5 type + density 3/10）
- **FaceSlapEngine** — 装逼打脸引擎
- **PretendWeakHiddenStrong** — 扮猪吃虎
- **SystemFlowRPG** — 系统流/数值流（level/exp/hp/mp）
- **InfiniteFlowDesigner** — 无限流任务设计
- **PowerUpMoment** — 金手指触发

### 武侠/仙侠 (3)
- **WuxiaLevelSystem** — 7 等级 三流→先天
- **XianxiaRealm** — 9 境界 炼气→渡劫
- **SystemTaskDesigner** — 系统任务

### 推理 (4)
- **FairPlayAuditor** — Van Dine/Knox 5 戒律
- **ClueLedger** — 线索账本
- **DeductionChainValidator** — 推理链验证
- **LockedRoomLogic** — 密室逻辑
- **RedHerringDetector** — 红鲱鱼检测

### 科幻 (4)
- **PhysicsHardnessChecker** — 物理硬度
- **FTLConsistency** — 超光速一致性
- **AIBehaviorAuditor** — AI 行为审计
- **TimeParadoxValidator** — 时间悖论验证

### 奇幻 (1)
- **MythologyFaithfulness** — 神话忠实度（4 神话体系）

### 类型惯例 (2)
- **GenreConventionAuditor** — 类型惯例审计（5 genre）
- **GenrePacingTemplate** — 类型节奏模板

### 言情/浪漫 (4)
- **HEAPathPlanner** — HE/HEA 路径
- **SugarKnifeRatio** — 糖刀比例
- **MisunderstandingAuditor** — 误会审计
- **RelationshipMilestoneTracker** — 关系里程碑

### 恐怖/惊悚 (2)
- **HorrorAtmosphere** — 恐怖氛围
- **ThrillerCountdownManager** — 惊悚倒计时

### 文学深度 (3)
- **LiteraryDepthScorer** — 文学深度评分
- **TropeAvoidanceAdvisor** — 套路规避建议
- **GenreMasterIndex** — 30 engines 收口

## 使用方式

```ts
import { HuanDianScheduler, FaceSlapEngine, WuxiaLevelSystem } from './src/ai/genre/WebNovelGenres';
import { FairPlayAuditor, ClueLedger, PhysicsHardnessChecker } from './src/ai/genre/MysteryScifiFantasy';
import { HEAPathPlanner, SugarKnifeRatio, HorrorAtmosphere } from './src/ai/genre/RomanceHorrorEtc';

const huan = new HuanDianScheduler();
huan.schedule(1, 'face_slap', 0.8);
console.log(huan.densityPer10Chapters(20)); // 0.5

const mystery = new FairPlayAuditor();
const audit = mystery.audit('凶手有线索。');
console.log(audit.violations); // [3] (没有不能的密室)

const wuxia = new WuxiaLevelSystem();
wuxia.setLevel('A', '宗师');
console.log(wuxia.canBeat('A', 'B')); // true if B is 一流 or below
```

## 测试命令

```bash
npx vitest run src/ai/genre/ --coverage --coverage.include='src/ai/genre/**'
```

## 文件位置

- `src/ai/genre/WebNovelGenres.ts` — 网文流派
- `src/ai/genre/MysteryScifiFantasy.ts` — 推理/科幻/奇幻
- `src/ai/genre/RomanceHorrorEtc.ts` — 言情/恐怖/文学 + 收口
