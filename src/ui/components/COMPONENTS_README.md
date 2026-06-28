# Advanced UI Components (V3) — Direction O

**Version**: 1.0.0
**Engines**: V2746-V2775 (30 engines, 6 batches)
**Tests**: 67 tests, 100% pass

## 目标

完整应用级组件库：虚拟滚动、拖拽、模态、提示、表单、骨架屏、错误边界、Suspense、性能监控。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| O1-O15 | `AdvancedOverlays.ts` + `AdvancedOverlays2.ts` | VirtualScroller + LazyList + InfiniteScroll + StickyHeader + AutoSizer + DragDropContext + DropZone + SortableList + KanbanBoard + TreeView + Modal + Drawer + Toast + Tooltip + Popover |
| O16-O25 | `Forms.ts` | FormField (10 types) + ValidationEngine + InputMask (5 types) + DatePicker + ColorPicker + SkeletonLoader + EmptyStateConfig + ErrorBoundary + SuspenseWrapper + PerformanceMonitor |
| O26 | `index.ts` + `demo/components-integration-demo.ts` | 12 端到端断言 |
| O27 | `__tests__/components-integration.test.ts` | 5 集成测试 |
| O28 | `COMPONENTS_README.md` | 本文档 |
| O29 | 主 README 更新 | 验证命令 |
| O30 | 收口 commit + push | |

## 核心 API 示例

### 1. Virtual Scrolling

```ts
import { VirtualScroller } from '@/ui/components'

const vs = new VirtualScroller(40, 400, 2)  // itemSize, containerHeight, overscan
vs.setTotalItems(1000)
vs.setScrollTop(200)
const { start, end } = vs.visibleRange()  // render only visible items
```

### 2. Drag & Drop

```ts
import { DragDropContext, DropZone, SortableList, KanbanBoard, TreeView } from '@/ui/components'

const dd = new DragDropContext()
dd.start({ id: 'a1', type: 'card', data: {} })
dd.move('zone1')
const item = dd.end()

const sortable = new SortableList([{ id: 'a' }, { id: 'b' }], (x) => x.id)
sortable.move('a', 'b')

const tree = new TreeView({ id: 'root', data: 'r', children: [] })
tree.expand('root')
```

### 3. Overlays

```ts
import { ModalManager, DrawerManager, ToastManager, TooltipManager, PopoverManager } from '@/ui/components'

const modal = new ModalManager()
modal.open('settings')

const toast = new ToastManager()
toast.success('Saved!')
toast.error('Failed!')

const pop = new PopoverManager()
pop.open('help', '#help', 'Help text', 'top')
```

### 4. Forms

```ts
import { FormField, ValidationEngine, InputMask, ColorPicker } from '@/ui/components'

const ve = new ValidationEngine()
ve.addField(new FormField({ name: 'email', label: 'Email', type: 'email', required: true }))
const result = ve.validateAll({ email: 'a@b.com' })

InputMask.apply('1234567890', 'phone')  // '(123) 456-7890'
ColorPicker.normalize('#fff')  // '#ffffff'
```

### 5. Error + Performance

```ts
import { ErrorBoundary, SuspenseWrapper, PerformanceMonitor } from '@/ui/components'

const eb = new ErrorBoundary()
eb.capture(new Error('oops'))
eb.recover('err_1')

const sw = new SuspenseWrapper<number>()
sw.resolve(42)

const perf = new PerformanceMonitor()
perf.record('render', 5)
perf.p95('render')  // P95 latency
```

## 验证命令

```bash
npx vitest run src/ui/components/  # 67 passed
npx vitest run src/ui/components/demo/components-integration-demo.test.ts
npx vitest run src/ui/components/__tests__/components-integration.test.ts
```

## 灵感

- React Window / TanStack Virtual (virtual scrolling)
- react-dnd (drag & drop)
- react-beautiful-dnd (sortable)
- Radix UI (modals/popovers/tooltips)
- react-hook-form (forms)
- React Error Boundary
- Sentry (error tracking)
- Lighthouse (performance)

## 累计

- Direction A-O: **455 engines / 5,497 tests** (A-G 1024 + H 50 + I 126 + J 75 + K 82 + L 51 + M 92 + N 95 + O 67)
- 16 commits pushed
- 灵感: React Window + Radix UI + react-hook-form + react-dnd + Sentry