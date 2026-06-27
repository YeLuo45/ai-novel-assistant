# UI Studio (V3) — Direction F

**Version**: 1.0.0
**Engines**: V2476-V2505 (30 engines, 6 batches)
**Tests**: 60+ tests, 100% pass

## 目标

为 agent-runtime 提供 **headless 的 Studio 状态机**（React UI 可消费这些 hooks/state）。核心：State + Reducer + Store + Undo/Redo + Command + Selection + Clipboard + Drag + Replay + Metrics + Snapshot + Theme + Hotkey。

## 核心数据流

```
Action → Reducer → Store → Subscriber → React Component
                     ↓
              History (undo/redo)
                     ↓
              Snapshot (持久化)
```

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| V2476-V2480 | `StudioState.ts` | State + Action + Reducer + Store + Middleware |
| V2481-V2485 | `StudioState.ts` | Panel + Registry + Renderer + Section + List |
| V2486-V2490 | `StudioAdvanced.ts` | Command + Registry + Selection + Clipboard + Drag |
| V2491-V2500 | `StudioAdvanced.ts` | Replay + Metrics + Snapshot + Export/Import + Validator + Schema + Theme + Layout + Hotkey |
| V2501 | `demo/studio-demo.ts` | 4 个 demo 断言 |
| V2502 | `__tests__/studio-integration.test.ts` | 7 个 e2e |
| V2503 | `STUDIO_README.md` | 本文档 |
| V2504 | 主 README.md 更新 | 验证命令 |
| V2505 | 收口 commit | |

## 核心 API 示例

### 1. Store + Reducer

```ts
import { StudioStore, INITIAL_STUDIO_STATE } from '@/ai/agent-runtime/protocol'

const store = new StudioStore()
store.dispatch({ type: 'agent.add', agent: myAgent })
store.subscribe(state => render(state))
```

### 2. Undo/Redo

```ts
store.dispatch({ type: 'agent.add', agent: a1 })
store.dispatch({ type: 'history.undo' })
store.dispatch({ type: 'history.redo' })
```

### 3. Selection + Clipboard

```ts
import { StudioSelection, StudioClipboard } from '@/ai/agent-runtime/protocol'

const sel = new StudioSelection()
sel.selectAgent('a1')
sel.selectConnection('a1', 'a2')

const cb = new StudioClipboard()
cb.set({ agents: [a1, a2], connections: [], copiedAt: Date.now() })
```

### 4. Drag

```ts
import { StudioDragController } from '@/ai/agent-runtime/protocol'

const drag = new StudioDragController()
drag.start('a1', 0, 0)
drag.update(100, 200)
const delta = drag.currentDelta()  // { dx: 100, dy: 200 }
drag.end()
```

### 5. Replay + Metrics

```ts
import { StudioReplay, computeMetrics, exportStudioState, importStudioState } from '@/ai/agent-runtime/protocol'

const steps = new StudioReplay().replay(initial, actions)
const metrics = computeMetrics(state)
const json = exportStudioState(state)
```

### 6. Theme + Hotkey

```ts
import { DEFAULT_THEME, DARK_THEME, DEFAULT_LAYOUT, StudioHotkeyManager } from '@/ai/agent-runtime/protocol'

const hotkeys = new StudioHotkeyManager()
hotkeys.bind({ key: 'f', action: 'fit-to-screen', description: 'Fit to screen' })
```

## 验证命令

```bash
# 跑全部 protocol 测试（应 484+ passed）
npx vitest run src/ai/agent-runtime/protocol/

# 跑 studio demo
npx vitest run src/ai/agent-runtime/protocol/demo/studio-demo.test.ts

# 跑 studio 端到端
npx vitest run src/ai/agent-runtime/protocol/__tests__/studio-integration.test.ts
```

## 灵感来源

- Redux — Reducer + Store + Middleware
- React DnD — DragController
- Figma — Canvas + Panels + Selection
- VSCode — Command + Hotkey + Snapshot

## 下一步（Direction G）

- **G**: 可观测性 + 自我进化（30 engines）— Metrics + Evolution + A/B testing
