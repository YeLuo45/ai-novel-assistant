# CB — AI Co-Author 2.0

**30 engines · 117 tests · 100% pass · ≥98% coverage**

协作 pillar 第一个方向 — 增强多 Agent 协作 + 流式写作 + 风格一致性。

## Engines (V4616-V4645)

### Batch 1/3 — Multi-Agent Core (V4616-V4625)
- MultiAgentOrchestrator: 并行/串行调度多 agent task
- ContextWindow: 上下文窗口管理 + token 预算
- TokenBudget: 预算控制 + 超限检测
- PromptChain: 提示链组装
- ChapterPlan: 章节级规划
- SceneBeats: 场景节拍 (Save the Cat 风格)
- PlotThread: 情节线索追踪
- CharacterVoice: 角色声音一致性
- FactChecker: 事实一致性核查
- VersionedDoc: 版本化文档

### Batch 2/3 — Stream + Quality + Style (V4626-V4635)
- StreamingWriter: 流式写作 + chunked output
- StyleTransferEngine: 风格迁移
- ReadabilityAnalyzer: 可读性分析 (Flesch + 中文)
- AutoSaveCheckpoint: 自动保存检查点
- CoAuthorMode: 协作模式选择 (solo/assist/co-pilot)
- WritingSession: 写作会话管理
- CoherenceScorer: 连贯性评分
- PacingAdjuster: 节奏调整
- DialogueImprover: 对话润色
- ToneAdjuster: 语气调整

### Batch 3/3 — Integration (V4636-V4645)
- CoAuthorWorkflow: 多步骤工作流引擎
- SceneContinuationEngine: 场景续写引擎
- OutlineBuilder: 大纲生成器 (汉字数字章节 P-130)
- CoAuthor2Integration: 集成 orchestrator
- ... + 6 more engines

## 测试命令

```bash
npx vitest run src/ai/coauthor2/
```

## 文件位置

- `src/ai/coauthor2/CoAuthor2Core.ts` — Batch 1 (10 engines)
- `src/ai/coauthor2/CoAuthor2Advanced.ts` — Batch 2 (10 engines)
- `src/ai/coauthor2/CoAuthor2Integration.ts` — Batch 3 (10 engines)

## 关键 Pitfall

- **P-129**: workflow.advance `< length - 1` 导致最后一步永不 mark done → 改 `< length`
- **P-130**: 中文章节用汉字数字 ("第一章" 而非 "第1章")
- **P-131**: word count 算法 split 后 sum 字符数不含标点