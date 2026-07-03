# Direction AC — Continuity & Lore

**V3136-V3165 · 30 engines · 84 tests · 100% pass · ~98% coverage**

时间线与连续性 — 网文/连载小说的"防穿帮"核心。

## 灵感来源

Marvel Cinematic Universe 编剧室 continuity bible / 《权力的游戏》连续性错误分析 / 起点编辑"穿帮检查" / Airtable 角色追踪模板 / 各种 fanfic wiki

## 30 engines 分组

### 时间线 (5)
- **EventTimeline** — 事件时间轴（add/sortByTime/hasContradiction）
- **TimeJumpAuditor** — 时间跳跃审计（>365d + <7d flashback）
- **FlashbackReasonableness** — 闪回合理性
- **AgeCalculator** — 跨章节年龄计算
- **AnniversaryReminder** — 周年纪念提醒

### 信息传播 (4)
- **InformationPropagation** — 信息传播链（tell/confirm/whoKnows）
- **CharacterKnowledgeLedger** — 角色知识账本
- **SecretKeeper** — 秘密守护
- **RevealTracker** — 揭示追踪

### 谣言/新闻 (1)
- **RumorsNews** — 谣言/新闻（start/spread/isViral）

### 道具流转 (4)
- **PropLifecycle** — 道具生命周期
- **ChekhovGun** — 契诃夫之枪
- **GiftExchange** — 礼物交换
- **LostItemAuditor** — 失踪道具审计

### 人物连续性 (5)
- **CharacterLocation** — 角色位置
- **CharacterMoodContinuity** — 角色情绪连续性
- **RelationshipStateMachine** — 6 状态关系机
- **CharacterVoice** — 角色声音（catchphrases）
- **CharacterHealth** — 角色健康（5 状态）
- **CharacterWealth** — 角色财富（earn/spend）

### 矛盾检测 (5)
- **ContradictionDetector** — 矛盾检测
- **InfoConflictResolver** — 信息冲突解决（4 策略）
- **DistanceConflict** — 距离冲突
- **SeasonConflict** — 季节冲突
- **TimeConflict** — 时间冲突

### 信息披露 (4)
- **InfoReleaseStrategy** — 信息释放策略
- **ShowTellRatio** — show vs tell 比
- **ImplicitExplicitBalance** — 隐式/显式平衡
- **RepetitionDetectorInfo** — 信息重复检测
- **ContinuityIndex** — 30 engines 收口

## 使用方式

```ts
import { EventTimeline, TimeJumpAuditor, InformationPropagation } from './src/ai/continuity/TimelineEvents';
import { PropLifecycle, CharacterLocation, CharacterHealth } from './src/ai/continuity/PropCharacterTracking';
import { ContradictionDetector, InfoConflictResolver } from './src/ai/continuity/ContradictionsAndDisclosure';

const timeline = new EventTimeline();
timeline.add('a', 1, 100);
timeline.add('b', 5, 200);
console.log(timeline.sortByTime()); // chronological

const prop = new PropLifecycle();
prop.introduce('sword', 1);
prop.use('sword', 5);
console.log(prop.getActive()); // []

const rel = new CharacterLocation();
rel.moveTo('Alice', 'Paris', 1);
console.log(rel.currentLocation('Alice')); // 'Paris'
```

## 测试命令

```bash
npx vitest run src/ai/continuity/ --coverage --coverage.include='src/ai/continuity/**'
```

## 文件位置

- `src/ai/continuity/TimelineEvents.ts` — 时间线 + 信息传播
- `src/ai/continuity/PropCharacterTracking.ts` — 道具 + 人物
- `src/ai/continuity/ContradictionsAndDisclosure.ts` — 矛盾 + 披露 + 收口
