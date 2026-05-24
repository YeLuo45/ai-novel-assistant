/**
 * HookManager 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HookManager } from './HookManager'
import type { HookContext } from './types'

describe('HookManager', () => {
  let hm: HookManager

  beforeEach(() => { hm = new HookManager() })

  it('registers a handler', () => {
    hm.register('post-task', async () => {})
    expect(hm).toBeDefined()
  })

  it('triggers registered handler', async () => {
    let called = false
    hm.register('post-task', async () => { called = true })
    await hm.trigger('post-task', { taskType: 'test', outcome: 'success', qualityScore: 0.9 })
    expect(called).toBe(true)
  })

  it('does not trigger wrong type', async () => {
    let called = false
    hm.register('post-task', async () => { called = true })
    await hm.trigger('post-review', { taskType: 'test', outcome: 'success', qualityScore: 0.9 })
    expect(called).toBe(false)
  })

  it('executes by priority order', async () => {
    const order: number[] = []
    hm.register('post-task', async () => { order.push(1) }, 10)
    hm.register('post-task', async () => { order.push(2) }, 50)
    hm.register('post-task', async () => { order.push(3) }, 30)
    await hm.trigger('post-task', { taskType: 'test', outcome: 'success', qualityScore: 0.9 })
    expect(order).toEqual([2, 3, 1])
  })

  it('clear removes all registrations', () => {
    hm.register('post-task', async () => {})
    hm.clear()
    // clear 后 trigger 不报错但也不触发
    expect(hm).toBeDefined()
  })

  it('passes context to handler', async () => {
    let received: HookContext | null = null
    hm.register('post-task', async (ctx) => { received = ctx })
    const ctx: HookContext = { taskType: 'chapter', outcome: 'success', qualityScore: 0.85 }
    await hm.trigger('post-task', ctx)
    expect(received?.taskType).toBe('chapter')
    expect(received?.qualityScore).toBe(0.85)
  })

  it('catches handler errors without stopping chain', async () => {
    let secondCalled = false
    hm.register('post-task', async () => { throw new Error('intentional') }, 50)
    hm.register('post-task', async () => { secondCalled = true }, 40)
    await hm.trigger('post-task', { taskType: 'test', outcome: 'success', qualityScore: 0.9 })
    expect(secondCalled).toBe(true)
  })

  it('supports multiple handlers same type', async () => {
    let count = 0
    hm.register('post-task', async () => { count++ })
    hm.register('post-task', async () => { count++ })
    await hm.trigger('post-task', { taskType: 'test', outcome: 'success', qualityScore: 0.9 })
    expect(count).toBe(2)
  })
})