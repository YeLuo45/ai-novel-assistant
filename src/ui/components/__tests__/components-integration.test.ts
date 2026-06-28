/**
 * ui/components/__tests__/components-integration.test.ts (O27)
 */

import { describe, it, expect } from 'vitest'
import {
  VirtualScroller, LazyList, InfiniteScroll, AutoSizer,
  DragDropContext, DropZone, SortableList, KanbanBoard, TreeView,
  ModalManager, DrawerManager, ToastManager, TooltipManager, PopoverManager,
  FormField, ValidationEngine, InputMask, ColorPicker, DatePicker,
  SkeletonLoader, ErrorBoundary, SuspenseWrapper, PerformanceMonitor,
} from '../index'

describe('Components — end-to-end', () => {
  it('list rendering pipeline', () => {
    const vs = new VirtualScroller(40, 400)
    vs.setTotalItems(1000)
    const ll = new LazyList<number>(5)
    ll.setItems(Array.from({ length: 50 }, (_, i) => i))
    const inf = new InfiniteScroll(20)
    inf.load(true)
    expect(vs.totalHeight()).toBe(40_000)
    expect(ll.loaded()).toBe(0)  // not loaded yet
    expect(inf.hasMore).toBe(true)
  })

  it('drag drop + sort + kanban + tree', () => {
    const dd = new DragDropContext()
    const zone = new DropZone('z1', ['card'])
    expect(zone.accepts('card')).toBe(true)

    const sortable = new SortableList([{ id: 'a' }, { id: 'b' }], (x) => x.id)
    sortable.move('a', 'b')

    const kanban = new KanbanBoard([
      { columnId: 'todo', title: 'T', items: [{ id: 'x' }] },
      { columnId: 'done', title: 'D', items: [] },
    ], (x) => x.id)
    kanban.moveItem('x', 'todo', 'done')

    const tree = new TreeView({ id: 'r', data: 'r', children: [] })
    tree.expand('r')
    expect(tree.flatten().length).toBe(1)
  })

  it('modals + drawers + toasts + tooltips + popovers', () => {
    const m = new ModalManager(); m.open('m1')
    const d = new DrawerManager(); d.open('d1', 'left')
    const t = new ToastManager(); t.info('hi')
    const tt = new TooltipManager(); tt.show('tt', '#b', 'tip', 'top', 1)
    const p = new PopoverManager(); p.open('p1', '#a', 'x')
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(m.isOpen('m1')).toBe(true)
        expect(d.isOpen('d1')).toBe(true)
        expect(t.list().length).toBe(1)
        expect(tt.get('tt')?.visible).toBe(true)
        expect(p.isOpen('p1')).toBe(true)
        resolve()
      }, 30)
    })
  })

  it('forms + masks + date + color', () => {
    const ve = new ValidationEngine()
    ve.addField(new FormField({ name: 'x', label: 'X', type: 'text', required: true }))
    expect(ve.validateAll({ x: 'ok' }).valid).toBe(true)
    expect(InputMask.apply('1234567890', 'phone').length).toBe(14)
    expect(ColorPicker.isValidHex('#fff')).toBe(true)
    expect(new DatePicker().format(new Date('2026-01-01T00:00:00Z'), 'iso')).toBe('2026-01-01')
  })

  it('skeleton + errorBoundary + suspense + performance', () => {
    const s = new SkeletonLoader().generate({ type: 'text' })
    expect(s.type).toBe('text')

    const eb = new ErrorBoundary()
    eb.capture(new Error('x'))
    expect(eb.getErrors().length).toBe(1)

    const sw = new SuspenseWrapper<number>()
    sw.resolve(42)
    expect(sw.getData()).toBe(42)

    const perf = new PerformanceMonitor()
    perf.record('op', 10)
    expect(perf.average('op')).toBe(10)
  })
})