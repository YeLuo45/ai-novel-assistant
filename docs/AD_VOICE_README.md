# Direction AD — Voice & Style Fingerprint

**V3196-V3225 · 30 engines · 53 tests · 100% pass · ~99% coverage**

作者风格可量化、可学习、可迁移。

## 灵感来源

Stylometry 文学计量学 (Mosteller&Wallace《联邦党人文集》作者识别) / 鲁迅/老舍/张爱玲风格研究 / 各种"模仿 X 写作" prompt / AI 风格迁移 / 写作教练对学员作品的风格分析

## 30 engines 分组

### 风格指纹 (1)
- **AuthorStyleFingerprint** — 风格指纹提取（8 fields + compare）

### 中国大师 (5)
- **LuXunStyle** — 鲁迅风格
- **LaoSheStyle** — 老舍风格
- **ZhangAilingStyle** — 张爱玲风格
- **JinYongStyle** — 金庸风格
- **GuLongStyle** — 古龙风格

### 西方大师 (3)
- **HemingwayStyle** — 海明威风格
- **FitzgeraldStyle** — 菲茨杰拉德风格
- **JKRowlingStyle** — JK 罗琳风格

### 风格相似度 (1)
- **StyleSimilarity** — 8 大师 rank + mostSimilar

### 日本大师 (3)
- **HigashinoKeigoStyle** — 东野圭吾风格
- **MurakamiHarukiStyle** — 村上春树风格
- **NatsumeSosekiStyle** — 夏目漱石风格

### 现代中文 (2)
- **LuXunModernStyle** — 鲁迅体白话
- **WenYanWenConverter** — 古文/白话转换（13 字字典）

### 风格迁移 (4)
- **StyleTransfer** — 风格转换器
- **StyleMixer** — 风格混合器（ratio 0-1）
- **StyleEvolution** — 风格进化追踪
- **StyleMaturity** — 文风成熟度（4 等级）

### 段落级 (1)
- **ParagraphLevelTransfer** — 段落级转换

### 训练与识别 (5)
- **StyleTrainingDataGenerator** — 风格训练数据
- **StyleComparison** — 两作者相似度
- **StyleDriftDetector** — 风格漂移检测
- **StyleConsistencyScorer** — 一致性评分
- **AuthorIdentifier** — 猜作者

### 文体识别 (3)
- **GenreStyleRecognizer** — 文体识别（novel/poem/essay/drama）
- **EraStyleRecognizer** — 时代风格（ancient/classical/modern/future）
- **SentenceLevelTransfer** — 句级转换

### 收口 (2)
- **ParagraphMixer** — 段落混合
- **VoiceStyleIndex** — 30 engines 收口

## 使用方式

```ts
import { AuthorStyleFingerprint, LuXunStyle, StyleSimilarity } from './src/ai/voice/AuthorStyleFingerprint';
import { WenYanWenConverter, StyleTransfer } from './src/ai/voice/StyleTransferLearning';
import { AuthorIdentifier, EraStyleRecognizer } from './src/ai/voice/StyleRegisterAdaptation';

const fp = new AuthorStyleFingerprint();
const profile = fp.extract('lu_xun', '讽刺，尖锐，批判的短句。');
console.log(profile.avgSentenceLength);

const similar = new StyleSimilarity();
const top = similar.mostSimilar('江湖门派内力剑法大侠豪杰。');
console.log(top.author); // 'JinYong'

const converter = new WenYanWenConverter();
const classical = converter.modernToClassical('我来了');
// '余来矣'
```

## 测试命令

```bash
npx vitest run src/ai/voice/ --coverage --coverage.include='src/ai/voice/**'
```

## 文件位置

- `src/ai/voice/AuthorStyleFingerprint.ts` — 指纹 + 大师
- `src/ai/voice/StyleTransferLearning.ts` — 风格迁移
- `src/ai/voice/StyleRegisterAdaptation.ts` — 文体识别 + 收口
