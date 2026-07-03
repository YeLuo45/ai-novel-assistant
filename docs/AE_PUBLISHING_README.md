# Direction AE — Publishing & Marketing

**V3226-V3255 · 30 engines · 69 tests · 100% pass · 99.34% coverage**

写完之后能"卖出去" — 多平台分发 + 营销文案 + 出版成书。

## 灵感来源

起点签约要求 / 番茄/七猫平台规则 / 出版业图书简介写作 / 微博/小红书/抖音 推书模式 / 各种"如何写一本好简介"指南 / Nielsen BookScan 销售分析

## 30 engines 分组

### 平台适配 (5)
- **PlatformWordcountAdapter** — 5 platform 字数规范
- **PlatformFormat** — 5 platform 缩进/换行
- **PlatformTone** — 平台调性（男频/女频）
- **PlatformSensitivity** — 违禁词检测
- **PlatformContractCheck** — 平台合同检查

### 营销文案 (5)
- **SynopsisGenerator** — 简介生成（3 风格）
- **TitleClickbait** — 标题党生成器（4 template）
- **SellingPointExtractor** — 卖点提炼（8 关键词）
- **KeywordSEO** — SEO 关键词（10 trending）
- **RecommendationGenerator** — 编辑推荐语

### 读者画像 (1)
- **TargetReaderPersonaEngine** — 3 详细 persona

### 数据分析 (3)
- **CompetitorAnalysis** — 竞品分析
- **HeatmapPredictor** — 热度预测（cold/warm/hot/viral）
- **ReviewGenerator** — 书评生成（positive/neutral/negative）
- **ReaderFeedbackAnalyzer** — 读者反馈分析

### 社媒分发 (5)
- **WeiboCopywriter** — 微博文案
- **XiaohongshuPost** — 小红书贴
- **DouyinScript** — 抖音脚本（30s + 3 segment）
- **BilibiliScript** — B 站脚本（3min + 4 outline）
- **PosterSlogan** — 海报文案（4 template）

### 系列出版 (5)
- **VolumeStructurePlanner** — 卷/部规划
- **VolumeNameSuggester** — 卷名建议
- **SeriesBible** — 系列圣经
- **SeriesReadingOrder** — 系列阅读顺序
- **SpinOffPotential** — 衍生潜力

### 成书 (4)
- **CopyEditor** — 校对
- **EbookFormatter** — 电子书排版
- **PrintBookLayout** — 实体书排版
- **CopyrightPageGenerator** — 版权页生成

### 收口 (1)
- **PublishingIndex** — 30 engines 收口

## 使用方式

```ts
import { PlatformWordcountAdapter, SynopsisGenerator, KeywordSEO } from './src/ai/publishing/PlatformAdaptation';
import { TargetReaderPersonaEngine, WeiboCopywriter, DouyinScript } from './src/ai/publishing/ReaderSocial';
import { SeriesBible, CopyrightPageGenerator } from './src/ai/publishing/BookProduction';

const adapter = new PlatformWordcountAdapter();
const spec = adapter.getSpec('qidian');
console.log(spec.min, spec.max); // 2000 3000

const synopsis = new SynopsisGenerator();
const intro = synopsis.generate('My Book', '玄幻', 'selling');
// 'My Book：一部 玄幻 题材的精彩作品...'

const seo = new KeywordSEO();
const keywords = seo.recommend('穿越书', '金手指');
// ['穿越', '金手指', '重生', '系统', '无敌']

const douyin = new DouyinScript();
const script = douyin.generate('X', '钩子', '点赞关注');
console.log(script.segments); // 3 segments
```

## 测试命令

```bash
npx vitest run src/ai/publishing/ --coverage --coverage.include='src/ai/publishing/**'
```

## 文件位置

- `src/ai/publishing/PlatformAdaptation.ts` — 平台适配
- `src/ai/publishing/ReaderSocial.ts` — 读者 + 社媒
- `src/ai/publishing/BookProduction.ts` — 出版成书 + 收口
