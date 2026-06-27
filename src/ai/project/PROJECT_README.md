# Project 编排 (V3) — Direction J

**Version**: 1.0.0
**Engines**: V2596-V2625 (30 engines, 6 batches)
**Tests**: 75 tests, 100% pass

## 目标

写作系统的核心业务逻辑：从 chapter / outline / plot thread 到 StoryBible（完整故事百科）。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| J1-J10 | `ChapterPlan.ts` | ChapterPlan + Builder + List + OutlineBuilder + PlotThread + CharacterArc + PlotHole + Foreshadow + Subplot + BeatSheet + SceneComposer |
| J11-J20 | `StoryBible.ts` | WorldState + RelationshipGraph + ThemeTracker + SymbolTracker + PlotGraph (DAG) + ContinuityChecker + StoryArc + NarrativePacing + ReadabilityScore + StoryBible |
| J21-J25 | (合并到 J1-J20) | Skip |
| J26 | `demo/project-integration-demo.ts` | 10 端到端断言 |
| J27 | `__tests__/project-integration.test.ts` | 7 集成测试 |
| J28 | `PROJECT_README.md` | 本文档 |
| J29 | 主 README 更新 | 验证命令 |
| J30 | 收口 commit + push | |

## 核心 API 示例

```ts
import { ChapterPlanBuilder, ChapterList, BeatSheet, StoryBible } from '@/ai/project'

// 1. 章节 + 大纲
const list = new ChapterList()
list.add(new ChapterPlanBuilder().id('ch1').index(1).title('A').wordGoal(3000).build())

// 2. Save the Cat 节拍
const beats = new BeatSheet()
beats.applySaveTheCat()  // 15 beats

// 3. Story Bible（综合）
const bible = new StoryBible('w1', 'modern Tokyo 2025')
bible.world.addLocation({ locationId: 'l1', name: 'Tokyo', description: 'capital', properties: {} })
bible.plot.addNode({ nodeId: 'p1', label: 'Inciting incident', chapterIndex: 1 })
bible.arc.addPoint(1, 0.3)
bible.arc.addPoint(5, 0.9)
```

## 验证命令

```bash
npx vitest run src/ai/project/  # 75 passed
npx vitest run src/ai/project/demo/project-integration-demo.test.ts  # 10 passed
npx vitest run src/ai/project/__tests__/project-integration.test.ts  # 7 passed
```

## 累计

- Direction A-J: 300 engines
- Direction K (持久化) + L (多用户): 60 engines 待做