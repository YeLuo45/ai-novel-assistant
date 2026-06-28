/**
 * ui/components/demo/components-integration-demo.test.ts (O26)
 */

import { describe, it, expect } from 'vitest'
import { runComponentsDemo } from './components-integration-demo'

describe('components-integration-demo', () => {
  it('scroller ready', () => {
    const r = runComponentsDemo()
    expect(r.scrollerReady).toBe(true)
  })

  it('drag active', () => {
    expect(runComponentsDemo().dragActive).toBe(true)
  })

  it('sortable has 3 items', () => {
    expect(runComponentsDemo().sortableItems).toBe(3)
  })

  it('tree has 2 nodes (root + a)', () => {
    expect(runComponentsDemo().treeNodes).toBe(2)
  })

  it('modal open', () => {
    expect(runComponentsDemo().modalsOpen).toBe(1)
  })

  it('drawer open', () => {
    expect(runComponentsDemo().drawersOpen).toBe(1)
  })

  it('2 toasts', () => {
    expect(runComponentsDemo().toasts).toBe(2)
  })

  it('form valid (when complete)', () => {
    expect(runComponentsDemo().formValid).toBe(true)
  })

  it('form has 2 errors (when invalid)', () => {
    expect(runComponentsDemo().formErrors).toBe(2)
  })

  it('3 performance samples', () => {
    expect(runComponentsDemo().performanceOps).toBe(3)
  })

  it('1 error caught', () => {
    expect(runComponentsDemo().errorsCaught).toBe(1)
  })

  it('end-to-end summary', () => {
    const r = runComponentsDemo()
    expect(r.toasts + r.modalsOpen + r.drawersOpen + r.popoversOpen).toBeGreaterThan(2)
  })
})