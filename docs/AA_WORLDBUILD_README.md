# Direction AA — Worldbuilding Coherence

**V3106-V3135 · 30 engines · 78 tests · 100% pass · 98.39% coverage**

世界设定自洽 — 长篇/系列小说的"设定圣经"自动维护。

## 灵感来源

Tolkien Middle-earth / Brandon Sanderson 魔法三定律 / World Anvil / Fandom Wiki / 考据党对红楼梦/三体的分析

## 30 engines 分组

### 基础体系 (6)
- **MagicSystemAuditor** — 魔法三定律（self_consistent/has_cost/has_limit）
- **TechConsistency** — 科技一致性（hard sci 比例）
- **PowerEconomy** — 力量经济（强/弱 tier 平衡）
- **SpeciesEcology** — 物种生态（10 物种 + 平衡 2-6）
- **ReligionSystem** — 宗教体系
- **LanguageCohort** — 语言/方言

### 地理/时间 (4)
- **GeographicConsistency** — 地理一致性（places map + distance）
- **TimelineTracker** — 时间线追踪（DAG + checkOrder）
- **SeasonWeather** — 季节/天气
- **DistanceSpeedValidator** — 距离/速度（5 mode）

### 政治经济 (5)
- **PoliticalSystem** — 6 政体
- **EconomicBalance** — 经济平衡
- **LawSystemAuditor** — 法律审计
- **EducationKnowledge** — 教育/知识
- **MilitaryWarLogic** — 军事/战争逻辑

### 文化社会 (4)
- **CustomsCulture** — 习俗/文化
- **FoodAgriculture** — 食物/农业
- **ClothingStyle** — 服装/风格（+ 时代一致性）
- **SocialHierarchy** — 社会阶层

### 设定账本 (3)
- **PropTracker** — 道具流转（introduce/use/destroy/findLost）
- **SettingBibleGenerator** — 设定 Bible 生成
- **MentionedButUndefined** — 设定空白检测

### 人物经济 (4)
- **CharacterOutfitMemory** — 角色装扮记忆
- **CharacterAgeBirthday** — 角色年龄/生日
- **FamilyRelationshipGraph** — 家族关系图
- **OccupationSkill** — 角色职业/技能

### 实体图 (4)
- **EntityRelationshipGraph** — 实体关系图（5 type）
- **SettingInspirationGenerator** — 设定灵感生成
- **FandomWikiExporter** — 粉丝 Wiki 导出
- **WorldbuildIndex** — 30 engines 收口

## 使用方式

```ts
import { MagicSystemAuditor, TimelineTracker } from './src/ai/worldbuild/SystemRules';
import { PoliticalSystem, PropTracker } from './src/ai/worldbuild/PolityEconomy';
import { CharacterAgeBirthday, SettingBibleGenerator } from './src/ai/worldbuild/CharacterEconomy';

const magic = new MagicSystemAuditor();
const rules = magic.audit('魔法消耗生命，有限制。');
const score = magic.ruleScore(text); // 0-1

const timeline = new TimelineTracker();
const a = timeline.add('event1', 1, 100);
timeline.add('event2', 5, 200, a.id);
const order = timeline.checkOrder(); // { valid, issues }

const wiki = new SettingBibleGenerator();
const md = wiki.generate('MyWorld', { Magic: 'has rules', History: 'ancient' });
```

## 测试命令

```bash
npx vitest run src/ai/worldbuild/ --coverage --coverage.include='src/ai/worldbuild/**'
```

## 文件位置

- `src/ai/worldbuild/SystemRules.ts` — 基础体系
- `src/ai/worldbuild/PolityEconomy.ts` — 政治经济
- `src/ai/worldbuild/CharacterEconomy.ts` — 人物经济 + 收口
