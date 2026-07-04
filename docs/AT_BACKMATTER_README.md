# Direction AT — Backmatter Generator

**V3676-V3705 · 30 engines · 56 tests · 100% pass · ≥98% coverage**

番外/后记/设定集/访谈/bonus 内容生成器。

## 灵感来源

网文运营 / 出版社需求 / 番外 / 设定集 / 作者访谈 / Bonus 内容

## 30 engines 分组

### Backmatter Core (9)
- **SideStoryGenerator** — 番外生成（character + event + isValid）
- **BackstoryGenerator** — 前史生成（character + age + isValidBackstory）
- **EpilogueGenerator** — 后记生成（多年以后 + isHappy）
- **PrologueGenerator** — 序章生成（一切开始之前 + isHook）
- **CharacterBioGenerator** — 角色简介（name + traits + isComplete）
- **WorldRuleGuide** — 世界规则（numbered + isComprehensive 20+）
- **GlossaryGenerator** — 词汇表（k: v + hasGlossary）
- **TimelineAppendix** — 时间线（date + event + isComplete）
- **AuthorNoteGenerator** — 作者按（topic + isHelpful）

### Backmatter Advanced (9)
- **BloopersGenerator** — 穿帮集（[穿帮] + isFunny）
- **AuthorInterviewGenerator** — 作者访谈（Q/A + isComplete）
- **DeletedSceneGenerator** — 删除场景（[删除原因] + isDeleted）
- **AlternateEndingGenerator** — 替代结局（结局A/B + hasAlternate）
- **ArtPromptGenerator** — 美术 prompt（[art] + isArtPrompt）
- **MusicPlaylistCurator** — 歌单（2 songs + isValid）
- **TimelineInfographic** — 信息图（numbered + hasNumbers）
- **ReadingGroupGuide** — 共读指南（周 + isRealistic）
- **BonusContentGenerator** — Bonus 内容（[bonus-] + isBonus）

### Backmatter Integration (9)
- **BackmatterCollection** — 后记集合（add + getAll + size）
- **BackmatterOrderer** — 后记排序（sort + isOrdered）
- **BonusPDFGenerator** — Bonus PDF（join + isValidPDF 10+）
- **BackmatterIndex** — 标准索引（4 items + isStandard）
- **ExclusiveContent** — 独家内容（title + content + isValid）
- **BackmatterLengthAdjuster** — 长度调整（slice/pad + meetsTarget）
- **BackmatterTranslator** — 翻译（[lang] + isTranslated）
- **BackmatterADirector** — AI 总监（create/order/publish）
- **BackmatterPackager** — 打包（Bonus Pack + isPackaged）

### 收口
- **BackmatterCoreIndex** / **BackmatterAdvancedIndex** / **BackmatterMasterIndex** (28 engines)

## 使用方式

```ts
import { SideStoryGenerator, EpilogueGenerator } from './src/ai/backmatter/BackmatterCore';
import { AlternateEndingGenerator, MusicPlaylistCurator } from './src/ai/backmatter/BackmatterAdvanced';
import { BackmatterPackager, BackmatterADirector } from './src/ai/backmatter/BackmatterIntegration';

const side = new SideStoryGenerator();
console.log(side.generate('Alice', 'meet Bob')); // 'Alice的故事 - meet Bob'

const epilogue = new EpilogueGenerator();
console.log(epilogue.generate('结束')); // '多年以后，结束。'

const ending = new AlternateEndingGenerator();
console.log(ending.generate('Happy', 'Sad')); // '结局A: Happy\n结局B: Sad'
```

## 测试命令

```bash
npx vitest run src/ai/backmatter/ --coverage --coverage.include='src/ai/backmatter/**'
```