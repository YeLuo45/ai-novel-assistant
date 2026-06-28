/**
 * ui/components/AdvancedOverlays.test.ts (O1-O15) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  VirtualScroller, LazyList, InfiniteScroll, StickyHeader, AutoSizer,
  DragDropContext, DropZone, SortableList, KanbanBoard, TreeView,
  ModalManager, DrawerManager,
} from './AdvancedOverlays'
import {
  ToastManager, TooltipManager, PopoverManager,
} from './AdvancedOverlays2'

describe('O1: VirtualScroller', () => {
  it('visibleRange', () => {
    const v = new VirtualScroller(50, 200, 2)
    v.setTotalItems(100)
    v.setScrollTop(0)
    const r = v.visibleRange()
    expect(r.start).toBe(0)
    expect(r.end).toBeGreaterThan(0)
  })

  it('totalHeight', () => {
    const v = new VirtualScroller(50, 200)
    v.setTotalItems(10)
    expect(v.totalHeight()).toBe(500)
  })
})

describe('O2: LazyList', () => {
  it('get auto-loads', () => {
    const l = new LazyList<string>()
    l.setItems(['a', 'b', 'c'])
    const r = l.get(0, 2)
    expect(r).toEqual(['a', 'b'])
    expect(l.loaded()).toBe(2)
  })

  it('shouldPreload', () => {
    const l = new LazyList<string>(3)
    l.setItems(['a', 'b', 'c', 'd', 'e'])
    l.get(0, 1)
    expect(l.shouldPreload(0)).toBe(true)
  })
})

describe('O3: InfiniteScroll', () => {
  it('load + hasMore', () => {
    const inf = new InfiniteScroll(10)
    const r = inf.load(true)
    expect(r.count).toBe(10)
    expect(r.hasMore).toBe(true)
  })

  it('reset', () => {
    const inf = new InfiniteScroll(10)
    inf.load(false)
    inf.reset()
    expect(inf.loaded).toBe(0)
    expect(inf.hasMore).toBe(true)
  })
})

describe('O4: StickyHeader', () => {
  it('updates sticky state', () => {
    const s = new StickyHeader(100)
    expect(s.update(50)).toBe(false)
    expect(s.update(200)).toBe(true)
  })
})

describe('O5: AutoSizer', () => {
  it('breakpointFor', () => {
    const a = new AutoSizer()
    a.setBreakpoint('sm', { width: 0, height: 0 })
    a.setBreakpoint('md', { width: 768, height: 0 })
    a.setBreakpoint('lg', { width: 1024, height: 0 })
    expect(a.breakpointFor(800)).toBe('md')
  })
})

describe('O6: DragDropContext', () => {
  it('start + move + end', () => {
    const d = new DragDropContext()
    d.start({ id: 'a1', type: 'card', data: {} })
    expect(d.isDragging()).toBe(true)
    d.move('zone1')
    expect(d.getHoverTarget()).toBe('zone1')
    d.end()
    expect(d.isDragging()).toBe(false)
  })
})

describe('O7: DropZone', () => {
  it('accepts', () => {
    const z = new DropZone('z1', ['card', 'agent'])
    expect(z.accepts('card')).toBe(true)
    expect(z.accepts('tool')).toBe(false)
  })

  it('hover tracking', () => {
    const z = new DropZone('z1')
    z.onEnter(); z.onEnter()
    expect(z.isHover()).toBe(true)
    z.onLeave()
    expect(z.isHover()).toBe(true)
    z.onLeave()
    expect(z.isHover()).toBe(false)
  })
})

describe('O8: SortableList', () => {
  it('move + reorder', () => {
    const l = new SortableList([{ id: 'a' }, { id: 'b' }, { id: 'c' }], (x) => x.id)
    l.move('a', 'c')
    expect(l.items.map(i => i.id)).toEqual(['b', 'a', 'c'])
  })
})

describe('O9: KanbanBoard', () => {
  it('moveItem between columns', () => {
    const k = new KanbanBoard([
      { columnId: 'todo', title: 'Todo', items: [{ id: 'a' }] },
      { columnId: 'done', title: 'Done', items: [] },
    ], (x) => x.id)
    k.moveItem('a', 'todo', 'done')
    expect(k.columns[0].items.length).toBe(0)
    expect(k.columns[1].items.length).toBe(1)
  })
})

describe('O10: TreeView', () => {
  it('expand + flatten', () => {
    const t = new TreeView({
      id: 'root', data: 'r', children: [
        { id: 'a', data: 'a', children: [{ id: 'a1', data: 'a1', children: [] }] },
      ],
    })
    t.expand('root')  // expand root
    t.expand('a')      // expand a
    const flat = t.flatten()
    expect(flat.length).toBe(3)  // root + a + a1
  })

  it('find', () => {
    const t = new TreeView({ id: 'r', data: 'x', children: [] })
    expect(t.find('r')?.data).toBe('x')
  })
})

describe('O11: Modal', () => {
  it('open + close + isOpen', () => {
    const m = new ModalManager()
    m.open('m1')
    expect(m.isOpen('m1')).toBe(true)
    m.close('m1')
    expect(m.isOpen('m1')).toBe(false)
  })
})

describe('O12: Drawer', () => {
  it('open with side', () => {
    const d = new DrawerManager()
    d.open('d1', 'left')
    expect(d.sideOf('d1')).toBe('left')
  })
})

describe('O13: Toast', () => {
  it('show + dismiss + prune', () => {
    const t = new ToastManager(50)
    const toast = t.success('Hi')
    expect(t.list().length).toBe(1)
    expect(t.dismiss(toast.id)).toBe(true)
    expect(t.list().length).toBe(0)
  })

  it('prune expired', () => {
    const t = new ToastManager(1)
    t.info('hi')
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(t.prune()).toBe(1)
        resolve()
      }, 20)
    })
  })
})

describe('O14: Tooltip', () => {
  it('show + hide', () => {
    const t = new TooltipManager()
    t.show('tt1', '#btn', 'Click me', 'top', 10)
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(t.get('tt1')?.visible).toBe(true)
        t.hide('tt1')
        expect(t.get('tt1')).toBeUndefined()
        resolve()
      }, 30)
    })
  })
})

describe('O15: Popover', () => {
  it('open + closeTop', () => {
    const p = new PopoverManager()
    p.open('p1', '#a', { x: 1 })
    p.open('p2', '#b', { x: 2 })
    expect(p.isOpen('p1')).toBe(true)
    expect(p.closeTop()).toBe('p2')
    expect(p.isOpen('p2')).toBe(false)
  })
})