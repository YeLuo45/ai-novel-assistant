# Direction AU — Translation-Aware Writing

**V3706-V3735 · 30 engines · 53 tests · 100% pass · ≥98% coverage**

翻译友好写作 + 文化引用检测 + 成语检测 + 多语言一致性。

## 灵感来源

国际出版 / Webnovel trend / 多语言版本一致性 / DeepL / ChatGPT 翻译

## 30 engines 分组

### Translation Core (9)
- **CulturalReferenceDetector** — 文化引用检测（饺子/春节/孔子 + count）
- **IdiomaticExpressionDetector** — 成语检测（说曹操/画蛇添足 + isIdiomatic）
- **WordplayDetector** — 双关语检测（谐音 + isLostInTranslation）
- **NameAdaptabilityChecker** — 名字适配（translatable + isAdaptable）
- **CulturalSensitivityScanner** — 文化敏感性（歧视/偏见 + hasIssues）
- **HonorificTracker** — 敬语追踪（先生/女士 + 哥们/姐们 + isFormal）
- **TranslationLengthEstimator** — 长度预估（4 lang ratio + fitsInBudget）
- **LocaleAdaptability** — 区域适配（[locale] + isAdapted）
- **SlangDetector** — 俚语检测（装逼 + isSlang）

### Translation Advanced (9)
- **MultilingualCoherence** — 多语言一致性（add + get + hasAll）
- **TranslationGlossary** — 翻译词汇表（add + getTarget + size）
- **ParallelTextGenerator** — 平行文本（EN:JA: + isParallel）
- **TranslatorNotes** — 译者注（addNote + hasNote [translator:]）
- **LanguagePair** — 语言对（from/to + isReversed）
- **TranslationProject** — 翻译项目（addPage + totalPages + getPages）
- **TMEntry** — TM 条目（source + target + quality + isReliable 0.8+）
- **TranslationMemory** — 翻译记忆（add + find + size）
- **TranslationADirector** — AI 总监（create_glossary/translate_more/finalize）

### Translation Integration (9)
- **TranslationGuide** — 翻译指南（5 tips + randomTip + isValid）
- **WritingForTranslation** — 翻译友好写作（score 1-0.3×issues + isGood 0.7+）
- **LocaleSpecificTerms** — 区域特定术语（en/ja/ko + isUniversal）
- **TranslationIssuesTracker** — 问题追踪（track + getAll + count）
- **StylePreservation** — 风格保留（original/translated + similarity 0.5-1.0）
- **TranslationFeedbackLoop** — 反馈循环（addFeedback + averageRating + isGood 4+）
- **CrossLangIndex** — 跨语言索引（add + get + size）
- **TranslationADirector2** — AI 总监（redo/improve/publish based on quality）
- **TranslationTools** — 翻译工具（DeepL/Google/ChatGPT/译者）

### 收口
- **TranslationCoreIndex** / **TranslationAdvancedIndex** / **TranslationMasterIndex** (28 engines)

## 使用方式

```ts
import { CulturalReferenceDetector, HonorificTracker } from './src/ai/translation/TranslationCore';
import { TranslationGlossary, TranslationMemory } from './src/ai/translation/TranslationAdvanced';
import { WritingForTranslation, TranslationGuide } from './src/ai/translation/TranslationIntegration';

const detector = new CulturalReferenceDetector();
console.log(detector.detect('吃饺子')); // ['food:饺子']

const tracker = new HonorificTracker();
console.log(tracker.track('先生女士')); // { formal: 2, informal: 0 }

const writer = new WritingForTranslation();
console.log(writer.check('plain text')); // { score: 1, issues: [] }
```

## 测试命令

```bash
npx vitest run src/ai/translation/ --coverage --coverage.include='src/ai/translation/**'
```