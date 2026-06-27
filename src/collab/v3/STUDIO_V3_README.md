# Studio V3 (Direction H) — Real React UI

**Version**: 1.0.0
**Engines**: V2536-V2565 (30 engines, 6 batches)
**Tests**: 50 tests, 100% pass
**Coverage**: Studio 集成测试覆盖所有 store-level 交互

## 目标

把 V3 Studio headless state machine (Direction F) 转换为**真实 React UI 组件**。每一个 store action 都有对应的 UI 控件，让用户能真正看到和操作 multi-agent 协作。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| H1-H5 | `StudioCanvas.tsx` | Canvas + Node + Edge + Toolbar + StatusBar |
| H6-H10 | `StudioPanels.tsx` | PropertyPanel + MetricsPanel + MemoryPanel + HookLogPanel + MessageLogPanel |
| H11-H15 | `StudioPanels2.tsx` | SoulStudioEditor + MarketPanel + ExperimentPanel + HealthDashboard + AlertCenter |
| H16-H25 | `StudioPanels3.tsx` | SectionList + Storyboard + DocumentPanel + PluginPanel + SettingsPanel + DragDropContext + ContextMenu + KeyboardShortcuts + ThemeProvider + Animation |
| H26 | `demo/studio-integration-demo.ts` | 10 端到端断言 |
| H27 | `__tests__/studio-integration.test.ts` | 10 集成测试 |
| H28 | `STUDIO_V3_README.md` | 本文档 |
| H29 | 主 README.md 更新 | 验证命令 |
| H30 | 收口 commit + push | |

## 核心组件 API

### 1. Studio 主壳

```tsx
import { StudioCanvas, StudioToolbar, StudioStatusBar, StudioStore } from '@/collab/v3/StudioCanvas'

const store = new StudioStore()
<>
  <StudioToolbar store={store} onAddAgent={...} />
  <StudioCanvas store={store} width={1200} height={800} />
  <StudioStatusBar store={store} message="Loading..." />
</>
```

### 2. 5 个基础面板 (H6-H10)

```tsx
import { PropertyPanel, MetricsPanel, MemoryPanel, HookLogPanel, MessageLogPanel } from '@/collab/v3/StudioPanels'

<PropertyPanel state={state} store={store} />  // 选中 agent 的属性
<MetricsPanel state={state} />  // 6 个 metric box
<MemoryPanel state={state} log={memoryLog} />  // memory scope + access log
<HookLogPanel emitter={emitter} limit={30} />  // hook 事件流
<MessageLogPanel state={state} />  // 按 type 分组统计
```

### 3. 5 个专项面板 (H11-H15)

```tsx
import { SoulStudioEditor, MarketPanel, ExperimentPanel, HealthDashboard, AlertCenter } from '@/collab/v3/StudioPanels2'

<SoulStudioEditor template={t} onChange={setT} />  // live preview + validation
<MarketPanel marketplace={marketplace} />  // 搜索 + listing
<ExperimentPanel runner={runner} />  // A/B 测试结果
<HealthDashboard runner={runner} results={results} />  // 健康监控
<AlertCenter manager={alertManager} />  // 告警中心
```

### 4. 10 个高级面板 (H16-H25)

```tsx
import {
  SectionList, Storyboard, DocumentPanel, PluginPanel, SettingsPanel,
  useDragDrop, ContextMenu, KeyboardShortcuts, useTheme, ThemeSwitcher,
  useAnimation,
} from '@/collab/v3/StudioPanels3'

<SectionList list={sectionList} selectedId="s1" onSelect={...} />
<Storyboard sections={sections} />
<DocumentPanel content={text} onChange={setText} />
<PluginPanel plugins={plugins} onToggle={...} />
<SettingsPanel settings={settings} onChange={...} />

const { dragging, startDrag } = useDragDrop((id, x, y) => {...})
<ContextMenu x={100} y={200} items={[{label: 'Edit', onClick: ...}]} onClose={...} />
<KeyboardShortcuts manager={hotkeyManager} onAction={...} />
const { theme, setTheme } = useTheme()
<ThemeSwitcher current={theme.name} onChange={setTheme} />
const { progress } = useAnimation(300, trigger)
```

## 验证命令

```bash
# 跑全部 collab/v3 tests（应 50+ passed）
npx vitest run src/collab/v3/

# 跑 studio integration demo
npx vitest run src/collab/v3/demo/studio-integration-demo.test.ts

# 跑 studio 端到端集成
npx vitest run src/collab/v3/__tests__/studio-integration.test.ts

# 跑特定 panel smoke test
npx vitest run src/collab/v3/StudioPanels.smoke.test.ts
npx vitest run src/collab/v3/StudioPanels2.smoke.test.ts
npx vitest run src/collab/v3/StudioPanels3.smoke.test.ts
```

## 灵感来源

- **Figma**: Canvas + 多 panels + 实时协作
- **VSCode**: Toolbar + StatusBar + Multi-pane layout
- **React DnD**: 拖拽逻辑
- **Framer Motion**: 动画 hook 设计
- **MUI / Ant Design**: Form/Input 组件 API

## 累计（Direction H 完成 = 235 engines）

| 项 | 数据 |
|----|------|
| 总 engines | 235（210 A-G + 25 H1-H25 + 10 H26-H30） |
| 总 tests | 1046（989 A-G + 50 H + 7 H26 demo + 10 H27 集成 - 10 删除项） |
| Commits | 5 commits pushed（H1-H5, H6-H10, H11-H15, H16-H25, H26-H30） |

## 下一步（Direction I-L, 90 engines 待做）

- **I**: LLM Provider 集成 (30 engines)
- **J**: Project 编排 (30 engines)
- **K**: Cross-Session 持久化 (30 engines)
- **L**: Multi-User 协作 (30 engines)