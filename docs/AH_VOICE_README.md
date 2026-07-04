# Direction AH — Character Voice Differentiator

**V3316-V3345 · 30 engines · 55 tests · 100% pass · 98.76% coverage**

量化每个角色的 speech pattern，让多角色长篇小说的每个角色"一听就知道是谁"。

## 灵感来源

长篇多 POV 刚需 / 量化角色 voice fingerprint / 出版业角色塑造标准

## 30 engines 分组

### 声音特征 (9)
- **CharacterSpeechPattern** — 说话模式（avgLen/avgWords + terse/normal/verbose）
- **SentenceLengthByCharacter** — 角色句长（mean/stdev/median）
- **VocabularyRichnessByCharacter** — 词汇丰富度（TTR + isRich 0.6+）
- **QuestionFrequencyByCharacter** — 提问频率（10 中英文 pattern + rate）
- **ExclamationByCharacter** — 感叹频率（count + rate）
- **FillerWordsByCharacter** — 口头禅（10 中英文 filler + isFillerHeavy 3+）
- **FormalityByCharacter** — 正式度（6 formal + 9 informal markers + classify）
- **DialectByCharacter** — 方言（northern/southern/western + hasDialect）
- **SlangByCharacter** — 俚语（9 流行词 + isSlangHeavy 2+）

### 差异化 (9)
- **VoiceDifferentiationAnalyzer** — 声音差异化分析器（7 fields profile）
- **CrossCharacterComparison** — 跨角色对比（compare 0-1 + isDistinct 0.3+）
- **VoiceConsistencyChecker** — 声音一致性（check + issues）
- **VoiceEvolutionTracker** — 声音进化（record + hasVoiceShift 0.3+）
- **VoiceAnomalyDetector** — 声音异常（setBaseline + isAnomalous 0.5+）
- **DialogueConflictDetector** — 对话冲突（detect + hasConflict）
- **CharacterVoiceClassifier** — 角色声音分类（5 type: child/elder/educated/common/dramatic）
- **VoiceStrengthMeter** — 声音强度（measure 5 维度 + isStrong 0.6+）
- **VoiceTemplateBuilder** — 声音模板（build + toMarkdown）

### 应用 (9)
- **VoiceGenerationPrompt** — 声音生成 prompt（generate + isActionable）
- **CharacterVoiceLibrary** — 角色声音库（register + get + list + size）
- **VoiceConsistencyEnforcer** — 一致性执行（check + hasDeviation 0.5+）
- **DialogueAttributor** — 对话归属（attribute closest + hasMultipleCandidates）
- **POVVoiceAdapter** — POV 声音适配（formal→汝/余，casual→你）
- **MultiCharacterSimulator** — 多角色模拟器（predictScene top 3）
- **VoiceTemplateLibrary** — 模板库（add + findClosest）
- **VoiceMigrationHelper** — 声音迁移（generateTransition 跨 POV）
- **VoiceComparisonReport** — 声音对比报告（generate + toMarkdown）

### 收口 (3)
- **VoiceFeaturesIndex** — 9 engines 收口
- **VoiceDifferentiationIndex** — 9 engines 收口
- **CharacterVoiceIndex** — 28 engines 收口

## 使用方式

```ts
import { CharacterSpeechPattern, FormalityByCharacter } from './src/ai/character_voice/VoiceFeatures';
import { VoiceDifferentiationAnalyzer, CrossCharacterComparison } from './src/ai/character_voice/VoiceDifferentiation';
import { VoiceGenerationPrompt, CharacterVoiceLibrary } from './src/ai/character_voice/VoiceApplication';

const analyzer = new VoiceDifferentiationAnalyzer();
const aliceProfile = analyzer.profile('Alice', ['短的', '这是长一点的句子。']);
const bobProfile = analyzer.profile('Bob', ['短。']);

const comp = new CrossCharacterComparison();
console.log(comp.isDistinct(aliceProfile, bobProfile)); // true

const prompt = new VoiceGenerationPrompt();
console.log(prompt.generate('Alice', aliceProfile));
// 角色 Alice 的声音特征：
// - 平均句长：10 字符
// - 词汇丰富度（TTR）：0.67
// - 正式度：0.50
// ...

const lib = new CharacterVoiceLibrary();
lib.register(aliceProfile);
lib.register(bobProfile);
```

## 测试命令

```bash
npx vitest run src/ai/character_voice/ --coverage --coverage.include='src/ai/character_voice/**'
```

## 文件位置

- `src/ai/character_voice/VoiceFeatures.ts` — 声音特征
- `src/ai/character_voice/VoiceDifferentiation.ts` — 差异化分析
- `src/ai/character_voice/VoiceApplication.ts` — 应用 + 收口
