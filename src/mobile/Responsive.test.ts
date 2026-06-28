/**
 * mobile/Responsive.test.ts (P1-P10) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  BreakpointSystem, ResponsiveContainer, MediaQuery, ContainerQuery, FlexibleGrid,
  TouchGestureDetector, SwipeNavigation, PullToRefresh, BottomSheet, SafeArea,
} from './Responsive'

describe('P1: BreakpointSystem', () => {
  it('detect xs', () => {
    expect(new BreakpointSystem().detect(400)).toBe('xs')
  })
  it('detect md', () => {
    expect(new BreakpointSystem().detect(800)).toBe('md')
  })
  it('detect xl', () => {
    expect(new BreakpointSystem().detect(1500)).toBe('xl')
  })
  it('isUp', () => {
    expect(new BreakpointSystem().isUp('md', 900)).toBe(true)
  })
  it('subscribe + change', () => {
    const bs = new BreakpointSystem()
    let called = 0
    bs.subscribe(() => { called += 1 })
    bs.detect(800)
    bs.detect(1500)
    expect(called).toBeGreaterThan(0)
  })
})

describe('P2: ResponsiveContainer', () => {
  it('update + isMobile', () => {
    const c = new ResponsiveContainer()
    c.update(400, 600)
    expect(c.isMobile()).toBe(true)
  })
  it('isTablet + isDesktop', () => {
    const c = new ResponsiveContainer()
    c.update(800, 600)
    expect(c.isTablet()).toBe(true)
    c.update(1200, 800)
    expect(c.isDesktop()).toBe(true)
  })
  it('contentWidth with padding', () => {
    const c = new ResponsiveContainer(1200, 16)
    c.update(800, 600)
    expect(c.contentWidth()).toBe(768)  // 800 - 32
  })
  it('maxContentWidth caps at maxWidth', () => {
    const c = new ResponsiveContainer(600, 0)
    c.update(2000, 800)
    expect(c.maxContentWidth()).toBe(600)
  })
})

describe('P3: MediaQuery', () => {
  it('set + get', () => {
    const m = new MediaQuery()
    m.set('prefers-dark', true)
    expect(m.get('prefers-dark')).toBe(true)
  })
  it('matches', () => {
    const m = new MediaQuery()
    m.set('prefers-dark', true)
    expect(m.matches('prefers-dark')).toBe(true)
    expect(m.matches('prefers-dark:false')).toBe(false)
  })
  it('subscribe on change', () => {
    const m = new MediaQuery()
    m.set('prefers-dark', true)  // 1st change (undefined → true)
    m.set('prefers-dark', true)  // no change
    m.set('prefers-dark', false)  // 2nd change
    let called = 0
    m.subscribe(() => { called += 1 })
    m.set('prefers-dark', false)  // no change (no callback)
    m.set('prefers-dark', true)   // 1 callback
    expect(called).toBe(1)
  })
})

describe('P4: ContainerQuery', () => {
  it('define + check', () => {
    const c = new ContainerQuery()
    c.setSize(800, 600)
    c.defineQuery('wide', (s) => s.width > 600)
    expect(c.check('wide')).toBe(true)
  })
})

describe('P5: FlexibleGrid', () => {
  it('columnWidth with gap', () => {
    const g = new FlexibleGrid(12, 16, 1280)
    // 12 cols, 16px gap: (1280 - 11*16) / 12 = (1280 - 176) / 12 = 1104/12 = 92
    expect(g.columnWidth()).toBeCloseTo(92, 0)
  })
  it('spanWidth', () => {
    const g = new FlexibleGrid(12, 16, 1200)
    // span 6: 92 * 6 + 16 * 5 = 552 + 80 = 632
    const colW = g.columnWidth()
    const expected = colW * 6 + 16 * 5
    expect(g.spanWidth(6)).toBeCloseTo(expected, 0)
  })
  it('setColumns', () => {
    const g = new FlexibleGrid()
    g.setColumns(6)
    expect(g.columns()).toBe(6)
  })
})

describe('P6: TouchGestureDetector', () => {
  it('tap', () => {
    const d = new TouchGestureDetector()
    expect(d.analyze([{ x: 100, y: 100, timestamp: Date.now() }])).toBe('tap')
  })
  it('swipe-left', () => {
    const d = new TouchGestureDetector()
    const t = Date.now()
    expect(d.analyze([{ x: 100, y: 100, timestamp: t }, { x: 50, y: 100, timestamp: t + 100 }])).toBe('swipe-left')
  })
  it('swipe-right', () => {
    const d = new TouchGestureDetector()
    const t = Date.now()
    expect(d.analyze([{ x: 100, y: 100, timestamp: t }, { x: 200, y: 100, timestamp: t + 100 }])).toBe('swipe-right')
  })
  it('long-press', () => {
    const d = new TouchGestureDetector()
    expect(d.analyze([{ x: 100, y: 100, timestamp: Date.now() - 1000 }])).toBe('long-press')
  })
})

describe('P7: SwipeNavigation', () => {
  it('next + prev + goTo', () => {
    const s = new SwipeNavigation()
    s.setRoutes([{ routeId: 'r1', title: 'A', component: 'A' }, { routeId: 'r2', title: 'B', component: 'B' }])
    expect(s.next()?.routeId).toBe('r2')
    expect(s.prev()?.routeId).toBe('r1')
    expect(s.goTo(1)).toBe(true)
  })
  it('hasNext/hasPrev at edges', () => {
    const s = new SwipeNavigation()
    s.setRoutes([{ routeId: 'r1', title: 'A', component: 'A' }])
    expect(s.hasPrev()).toBe(false)
    expect(s.hasNext()).toBe(false)
  })
})

describe('P8: PullToRefresh', () => {
  it('start + update + threshold', () => {
    const p = new PullToRefresh(100, () => {})
    p.startPull()
    p.updatePull(120)
    expect(p.isOverThreshold()).toBe(true)
  })
  it('trigger', async () => {
    let called = false
    const p = new PullToRefresh(50, () => { called = true })
    p.startPull()
    p.updatePull(60)
    await p.triggerRefresh()
    expect(called).toBe(true)
  })
  it('cancel', () => {
    const p = new PullToRefresh(100)
    p.startPull()
    p.cancel()
    expect(p.isOverThreshold()).toBe(false)
  })
})

describe('P9: BottomSheet', () => {
  it('open + expand + close', () => {
    const s = new BottomSheet()
    s.open()
    expect(s.state()).toBe('peek')
    s.expand()
    expect(s.state()).toBe('full')
    s.close()
    expect(s.isOpen()).toBe(false)
  })
})

describe('P10: SafeArea', () => {
  it('platform defaults', () => {
    const s = new SafeArea()
    s.setPlatformDefaults('ios')
    expect(s.top()).toBe(44)
    expect(s.bottom()).toBe(34)
  })
  it('setInsets', () => {
    const s = new SafeArea()
    s.setInsets({ top: 10, right: 0, bottom: 20, left: 0 })
    expect(s.top()).toBe(10)
  })
})