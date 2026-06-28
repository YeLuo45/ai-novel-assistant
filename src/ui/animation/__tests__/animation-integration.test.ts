/**
 * ui/animation/__tests__/animation-integration.test.ts (Q27)
 */

import { describe, it, expect } from 'vitest'
import {
  SpringConfig, Easing, SpringController, TransitionOrchestrator, PageTransition,
  StaggeredAnimation, Choreographer, LoadingDots, ProgressBar, Spinner, PulseAnimation,
  HapticEngine, SoundFeedback, VisualFeedback, TooltipAnimator, Ripple,
  ReducedMotion, PerformanceAware, GPUAccelerated, TransformOptimizer, IdleCallback,
} from '../index'

describe('Animation — end-to-end', () => {
  it('spring flow: create → tick → converge', () => {
    const c = new SpringController()
    const s = c.create('a', 0, 10, new SpringConfig({ tension: 80, friction: 20 }))
    for (let i = 0; i < 2000; i++) c.tickAll(0.005)
    expect(Math.abs(s.value - 10)).toBeLessThan(1)
  })

  it('page transition: enter → exit', () => {
    const pt = new PageTransition()
    pt.setType('fade')
    pt.setDuration(300)
    pt.start()
    expect(pt.isActive()).toBe(true)
    pt.end()
    expect(pt.isActive()).toBe(false)
  })

  it('stagger animation: items appear sequentially', () => {
    const a = new StaggeredAnimation(50, 200)
    a.setItems(['a', 'b', 'c'], 200)
    a.update(50)   // only a visible
    expect(a.progress('a')).toBeGreaterThan(0)
    expect(a.progress('b')).toBe(0)
    a.update(300)  // all done
    expect(a.isComplete()).toBe(true)
  })

  it('choreographer: multi-step', () => {
    const c = new Choreographer()
    c.setSteps([
      { id: 'a', startMs: 0, durationMs: 100 },
      { id: 'b', startMs: 100, durationMs: 100 },
      { id: 'c', startMs: 200, durationMs: 100 },
    ])
    c.start(0)
    c.update(150)  // a done
    expect(c.stepDone('a')).toBe(true)
    expect(c.stepDone('b')).toBe(false)
    c.update(350)  // all done
    expect(c.isAllDone()).toBe(true)
  })

  it('feedback pipeline: haptic + sound + visual', () => {
    const h = new HapticEngine()
    const s = new SoundFeedback()
    const v = new VisualFeedback(10000)
    h.trigger('success')
    s.play('success')
    v.emit(100, 100)
    expect(h.count()).toBe(1)
    expect(s.history().length).toBe(1)
    expect(v.active().length).toBe(1)
  })

  it('performance-aware: slow frame detection', () => {
    const p = new PerformanceAware()
    for (let i = 0; i < 10; i++) p.recordFrame(50)
    expect(p.isPerformant()).toBe(false)
    expect(p.recommend()).toBe('low')
  })

  it('reduced motion: disable animation', () => {
    const rm = new ReducedMotion()
    rm.setEnabled(true)
    expect(rm.shouldAnimate()).toBe(false)
    expect(rm.adjustDuration(500)).toBe(0)
  })

  it('GPU layers + transform optimization', () => {
    const gpu = new GPUAccelerated()
    gpu.createLayer('a')
    gpu.markChanged('a')
    expect(gpu.get('a')?.willChange).toBe(true)
    expect(GPUAccelerated.gpuFriendlyProperty('transform')).toBe(true)

    const to = new TransformOptimizer()
    to.compose('scale(1.2)', 'rotate(45deg)')
    expect(to.cacheSize()).toBe(1)
  })

  it('tooltip + ripple lifecycle', () => {
    const t = new TooltipAnimator(100, 1000)
    t.show('a')
    expect(t.isShowing('a')).toBe(true)
    expect(t.progress('a', 500)).toBeCloseTo(0.4, 1)

    const r = new Ripple(50, 500)
    r.start(10, 10)
    r.update()
    expect(r.active().length).toBe(1)
  })

  it('idle callback processes by priority', () => {
    const ic = new IdleCallback()
    const order: string[] = []
    ic.schedule(() => order.push('normal'), 'normal')
    ic.schedule(() => order.push('background'), 'background')
    ic.schedule(() => order.push('user-visible'), 'user-visible')
    ic.flush()  // 手动 flush，按优先级排序执行
    expect(order).toEqual(['background', 'normal', 'user-visible'])
  })

  it('choreographer: multi-step', () => {
    const c = new Choreographer()
    c.setSteps([
      { id: 'a', startMs: 0, durationMs: 100 },
      { id: 'b', startMs: 100, durationMs: 100 },
      { id: 'c', startMs: 200, durationMs: 100 },
    ])
    c.start(0)
    c.update(150)  // a done
    expect(c.stepDone('a')).toBe(true)
    expect(c.stepDone('b')).toBe(false)
    c.update(350)  // all done
    expect(c.isAllDone()).toBe(true)
  })

  it('easing curves', () => {
    expect(Easing.easeIn(0.5)).toBe(0.25)
    expect(Easing.easeOut(0.5)).toBe(0.75)
    expect(Easing.easeInOut(0)).toBe(0)
    expect(Easing.easeInOut(1)).toBe(1)
  })
})