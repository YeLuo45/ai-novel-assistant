/**
 * ui/components/demo/components-integration-demo.ts (O26)
 */

import {
  VirtualScroller, LazyList, InfiniteScroll, AutoSizer,
  DragDropContext, SortableList, KanbanBoard, TreeView,
  ModalManager, DrawerManager, ToastManager, TooltipManager, PopoverManager,
  FormField, ValidationEngine, InputMask, DatePicker, ColorPicker,
  SkeletonLoader, ErrorBoundary, SuspenseWrapper, PerformanceMonitor,
} from '../index'

export interface DemoResult {
  scrollerReady: boolean
  scrolled: number
  dragActive: boolean
  sortableItems: number
  treeNodes: number
  modalsOpen: number
  drawersOpen: number
  toasts: number
  popoversOpen: number
  formValid: boolean
  formErrors: number
  performanceOps: number
  errorsCaught: number
}

export function runComponentsDemo(): DemoResult {
  // 1. Virtual scroller
  const vs = new VirtualScroller(40, 400, 2)
  vs.setTotalItems(1000)
  vs.setScrollTop(200)
  const range = vs.visibleRange()

  // 2. Lazy + infinite
  const ll = new LazyList<number>(3)
  ll.setItems(Array.from({ length: 100 }, (_, i) => i))
  ll.get(0, 5)
  const inf = new InfiniteScroll(20)
  inf.load(true)

  // 3. Drag + sort
  const dd = new DragDropContext()
  dd.start({ id: 'a1', type: 'card', data: {} })
  const dragActive = dd.isDragging()
  dd.end()

  const sortable = new SortableList([{ id: 'a' }, { id: 'b' }, { id: 'c' }], (x) => x.id)
  sortable.move('a', 'c')

  // 4. Kanban
  const kanban = new KanbanBoard([
    { columnId: 'todo', title: 'Todo', items: [{ id: 'a' }, { id: 'b' }] },
    { columnId: 'done', title: 'Done', items: [] },
  ], (x) => x.id)
  kanban.moveItem('a', 'todo', 'done')

  // 5. Tree
  const tree = new TreeView({ id: 'r', data: 'r', children: [{ id: 'a', data: 'a', children: [] }] })
  tree.expand('r')
  const treeNodes = tree.flatten().length

  // 6. Modals
  const modal = new ModalManager()
  modal.open('settings')

  // 7. Drawers
  const drawer = new DrawerManager()
  drawer.open('notifications', 'right')

  // 8. Toasts
  const toast = new ToastManager()
  toast.success('Saved!')
  toast.info('Loading...')

  // 9. Popovers
  const pop = new PopoverManager()
  pop.open('help', '#help', 'Help text', 'top')

  // 10. Forms
  const ve = new ValidationEngine()
  ve.addField(new FormField({ name: 'name', label: 'Name', type: 'text', required: true }))
  ve.addField(new FormField({ name: 'email', label: 'Email', type: 'email', required: true }))
  const validResult = ve.validateAll({ name: 'John', email: 'a@b.com' })
  const invalidResult = ve.validateAll({ name: '', email: 'bad' })

  // 11. Color + Date
  InputMask.apply('12345', 'phone')
  ColorPicker.normalize('#abc')
  const dp = new DatePicker()
  dp.format(new Date(), 'iso')

  // 12. Skeleton
  new SkeletonLoader().generate({ type: 'card' })

  // 13. ErrorBoundary
  const eb = new ErrorBoundary()
  eb.capture(new Error('test'))
  const errorsCaught = eb.getErrors().length

  // 14. Suspense
  const sw = new SuspenseWrapper<number>()
  sw.resolve(42)

  // 15. Performance
  const perf = new PerformanceMonitor()
  perf.record('render', 5)
  perf.record('render', 10)
  perf.record('api', 50)
  const performanceOps = perf.count()

  return {
    scrollerReady: range.end > range.start,
    scrolled: range.end - range.start,
    dragActive,
    sortableItems: sortable.items.length,
    treeNodes,
    modalsOpen: modal.openIds().length,
    drawersOpen: drawer.openIds().length,
    toasts: toast.list().length,
    popoversOpen: pop.isOpen('help') ? 1 : 0,
    formValid: validResult.valid,
    formErrors: invalidResult.errors ? Object.keys(invalidResult.errors).length : 0,
    performanceOps,
    errorsCaught,
  }
}