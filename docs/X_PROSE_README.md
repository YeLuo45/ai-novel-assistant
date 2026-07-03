# Direction X — Prose Craft Mastery

**V3046-V3075 · 30 engines · 81 tests · 100% pass · 99.47% coverage**

文笔打磨工坊 — 从"章节级分析"下沉到"句子级打磨"。

## 灵感来源

Stephen King《写作这回事》/ William Zinsser《On Writing Well》/ 《风格的要素》/ Hemingway Editor / ProWritingAid / show-don't-tell 教学

## 30 engines 分组

### 句法层 (7)
- **SentenceLengthDistribution** — 句长分布
- **OpenerVariety** — 句子开头多样性
- **SentenceTypeMix** — 句型混合
- **ParagraphLengthDist** — 段长分布
- **ActivePassiveRatio** — 主动/被动语态比
- **LongShortAlternation** — 长短句交替
- **ClauseComplexity** — 从句复杂度

### 展示层 (8)
- **ShowVsTellDetector** — show vs tell 检测
- **FilterWordDetector** — 过滤词检测
- **AdverbDetector** — 副词检测
- **GenericVerbAuditor** — 通用动词审计
- **TellingEmotionDetector** — 直接陈述情绪检测
- **SensoryPalette** — 5 感分布
- **SensoryDensity** — 感官密度
- **VisualDominanceAuditor** — 视觉主导审计

### 感官层 (3)
- **SoundScentTouchTracker** — 声/嗅/触追踪
- **ConcreteVsAbstractNouns** — 具体 vs 抽象名词比
- **MetaphorOriginalityScorer** (in VocabularyDialogueLayer) — 比喻原创性

### 词汇层 (4)
- **ClichéDetector** — 套路/陈词检测
- **RepetitionDetector** — 重复词检测
- **ConnotationAuditor** — 色彩义/语域
- **WordEconomy** — 字数经济性

### 对话层 (4)
- **DialogueTagVariety** — 对话标签多样性
- **ActionBeatRatio** — 动作节拍比
- **SubtextDetector** — 潜台词
- **DialogueVoiceFingerprint** — 对话声音指纹

### 视角·时态 (3)
- **POVConsistencyChecker** — 视角一致性
- **TenseConsistency** — 时态一致性
- **POVSlipDetector** — 视角滑移检测

## 使用方式

```ts
import { SentenceLengthDistribution, ShowVsTellDetector } from './src/ai/prose/SyntaxLayer';
import { FilterWordDetector, AdverbDetector, GenericVerbAuditor } from './src/ai/prose/ShowSensoryLayer';
import { RepetitionDetector, POVSlipDetector } from './src/ai/prose/VocabularyDialogueLayer';

const sd = new SentenceLengthDistribution();
const stats = sd.analyze('她走进房间。他看着她。'); // mean, median, stdev

const show = new ShowVsTellDetector();
const tells = show.detect('他很生气。她很高兴。'); // tellCount: 2

const filter = new FilterWordDetector();
const overFiltered = filter.isOverFiltered(text); // bool
```

## 测试命令

```bash
npx vitest run src/ai/prose/ --coverage --coverage.include='src/ai/prose/**'
```

## 文件位置

- `src/ai/prose/SyntaxLayer.ts` — 句法层
- `src/ai/prose/ShowSensoryLayer.ts` — 展示 + 感官
- `src/ai/prose/VocabularyDialogueLayer.ts` — 词汇 + 对话 + 收口
