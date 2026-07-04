# Direction AS — Self-Editing Pipeline

**V3646-V3675 · 30 engines · 58 tests · 100% pass · ≥98% coverage**

自编辑流水线 + 结构编辑 + 语言编辑 + 集成。

## 灵感来源

专业编辑工作流 / 出版业编辑标准 / On Writing Well / The Elements of Style

## 30 engines 分组

### Structure Editor (9)
- **StructureAnalyzer** — 结构分析（sentences + paragraphs + isStructured）
- **PlotHoleFinder** — 漏洞查找（莫名其妙 + count）
- **ChapterReorderer** — 章节重排（filter valid + isValidOrder）
- **SceneCutter** — 场景切割（\n\n+ filter 50+ + count）
- **PlotRestructurer** — 情节重构（reverse + isBetter）
- **CharacterArcChecker** — 角色弧检查（他没有 + isConsistent）
- **ThemeConsistencyChecker** — 主题一致性（occurrences + isStrong 3+）
- **ConflictBalancer** — 冲突平衡（main with sub + hasBalance）
- **NarrativeTensionOptimizer** — 张力优化（normalize punctuation）

### Language Editor (9)
- **ProsePolisher** — 文笔抛光（trim + 然后→接着 + isPolished）
- **RedundancyRemover** — 冗余去除（非常/特别的 + countRemoved）
- **VerbImprover** — 动词优化（走→迈步 + isImproved）
- **AdverbCutter** — 副词切除（地 + isAdverbFree）
- **ClichéRemover** — 陈词去除（他很帅→他 + isClean）
- **ToneAdjuster** — 语气调整（[tone] + hasTone）
- **SentenceVariety** — 句式变化（avgLen + isVaried 5+）
- **ReadabilityScorer** — 可读性（len/1000 + isReadable 0.5+）
- **DialogueTagger** — 对话标签（"Alice说：\"hi\"" + isValid）

### Self-Edit Integration (9)
- **EditingPipeline** — 编辑流程（5 steps + isComplete + next）
- **EditVersionControl** — 版本控制（save + getVersion + count）
- **SelfEditStats** — 统计（recordEdit + recordImprovement + rate）
- **EditingChecklist** — 编辑清单（5 items + isComplete + remaining）
- **SelfEditDirector** — AI 总监（fix_critical/polish/continue）
- **EditDiffReporter** — 差异报告（generateDiff + hasChanges）
- **StyleConsistencyChecker** — 一致性检查（rules + isConsistent）
- **SelfEditMemoryBank** — 记忆库（recordPattern + topPattern + size）
- **EditingGuide** — 编辑指南（5 tips + randomTip + isValidTip）

### 收口
- **StructureEditorIndex** / **LanguageEditorIndex** / **SelfEditMasterIndex** (28 engines)

## 使用方式

```ts
import { StructureAnalyzer, PlotHoleFinder } from './src/ai/selfedit/StructureEditor';
import { ProsePolisher, ReadabilityScorer } from './src/ai/selfedit/LanguageEditor';
import { EditingPipeline, SelfEditDirector } from './src/ai/selfedit/SelfEditIntegration';

const analyzer = new StructureAnalyzer();
const r = analyzer.analyze('一。二。三。\n\n四。');
console.log(r.sentences); // 4

const polish = new ProsePolisher();
const polished = polish.polish('然后走');
console.log(polished); // '接着走'

const director = new SelfEditDirector();
console.log(director.decide({ pipelineStep: 'language', issueCount: 10 })); // 'fix_critical'
```

## 测试命令

```bash
npx vitest run src/ai/selfedit/ --coverage --coverage.include='src/ai/selfedit/**'
```