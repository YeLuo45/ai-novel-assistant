# Direction AR — AI Co-Author Assistant

**V3616-V3645 · 30 engines · 56 tests · 100% pass · ≥98% coverage**

AI 协作写作助手 + 章节 prompt + 大纲 + 续写 + 对话生成 + 风格模仿。

## 灵感来源

Claude/GPT 写作实践 / Prompt 模板 / 网文 AI 辅助 / Notion AI

## 30 engines 分组

### Co-Author Core (9)
- **ChapterPromptBuilder** — 章节 prompt 构建（5 context fields + isValid 20+）
- **OutlineGenerator** — 大纲生成（N chapters + isComplete）
- **SceneWriter** — 场景写作（setting + characters + action + isValidScene 30+）
- **CharacterDialogueWriter** — 角色对话（character + context + mood + isRealistic）
- **DescriptionGenerator** — 描写生成（target + senses + isVivid 20+ 5 word+）
- **PlotTwistSuggester** — 情节转折（3 suggestions + isSurprising 10+）
- **ContinuationEngine** — 续写引擎（continue + meetsTarget）
- **StyleMimicry** — 风格模仿（mimic + isValidMimic 5+）
- **CoAuthorMode** — 共创模式（5 mode: brainstorm→polish）

### Co-Author Advanced (9)
- **DialogueImprover** — 对话改进（trim + normalize + isBetter 0.3-3.0）
- **ActionSequenceWriter** — 动作序列（→ join + isSequence）
- **EmotionAdjuster** — 情绪调整（[emotion] prepend + hasEmotion）
- **PacingAdjuster** — 节奏调整（slowDown + speedUp + isSlowed）
- **CliffhangerGenerator** — 悬念生成（... + isCliffhanger）
- **HookGenerator** — 钩子生成（[钩子] tag + isHook）
- **ForeshadowingSuggester** — 伏笔建议（2 foreshadows + isForeshadow）
- **CoherenceChecker** — 连贯性检查（check + issues for 矛盾）
- **InspirationTrigger** — 灵感触发（3 random + isValid）

### Co-Author Integration (9)
- **CoAuthorSession** — 协作会话（setMode + record + getHistory + size）
- **WritingWorkflow** — 写作流程（5 steps + isComplete + nextStep）
- **CoAuthorAssistant** — AI 助手（generate [mode] + isValidMode）
- **PromptTemplateLibrary** — prompt 模板（4+ templates + count + isValid 10+）
- **CoAuthorStats** — 统计（recordPrompt + recordOutput + efficiency）
- **WritingMemoryBank** — 记忆库（store + retrieve + size）
- **CoAuthorFeedback** — 反馈（record + getFeedbackScore 0.8）
- **CollaborativeWritingRules** — 协作规则（4 rules + isValid）
- **CoAuthorADirector** — AI 总监（decideTask brainstorm/continue）

### 收口
- **CoAuthorCoreIndex** / **CoAuthorAdvancedIndex** / **CoAuthorMasterIndex** (28 engines)

## 使用方式

```ts
import { ChapterPromptBuilder, SceneWriter, PlotTwistSuggester } from './src/ai/coauthor/CoAuthorCore';
import { DialogueImprover, CliffhangerGenerator } from './src/ai/coauthor/CoAuthorAdvanced';
import { WritingWorkflow, CoAuthorAssistant } from './src/ai/coauthor/CoAuthorIntegration';

const prompt = new ChapterPromptBuilder();
const p = prompt.build({ genre: 'romance', previousSummary: 'met', characters: ['A', 'B'], targetWords: 1000, tone: 'warm' });

const twist = new PlotTwistSuggester();
const twists = twist.suggest('主角遇到挑战');
console.log(twists[0]); // 'Twist based on 主角遇到挑战: character was actually the villain'

const workflow = new WritingWorkflow();
console.log(workflow.nextStep('outline')); // 'draft'
```

## 测试命令

```bash
npx vitest run src/ai/coauthor/ --coverage --coverage.include='src/ai/coauthor/**'
```