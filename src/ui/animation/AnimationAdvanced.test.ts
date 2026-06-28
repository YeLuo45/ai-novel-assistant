/**
 * ui/animation/AnimationAdvanced.test.ts (Q16-Q25) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  HapticEngine, SoundFeedback, VisualFeedback, TooltipAnimator, Ripple,
  ReducedMotion, PerformanceAware, GPUAccelerated, TransformOptimizer, IdleCallback,
} from './AnimationAdvanced'

describe('Q16: HapticEngine', () => {
  it('trigger + history', () => {
    const h = new HapticEngine()
    h.trigger('success')
    h.trigger('error')
    expect(h.count()).toBe(2)
    expect(h.history()[0]?.pattern).toBe('success')
  })
})

describe('Q17: SoundFeedback', () => {
  it('enable/disable + volume', () => {
    const s = new SoundFeedback()
    s.setVolume(0.5)
    expect(s.volume()).toBe(0.5)
    s.setEnabled(false)
    expect(s.play('click')).toBe(false)
  })

  it('play when enabled', () => {
    const s = new SoundFeedback()
    expect(s.play('tap')).toBe(true)
  })
})

describe('Q18: VisualFeedback', () => {
  it('emit + active', () => {
    const v = new VisualFeedback(10000)
    v.emit(100, 200, 0.5)
    v.emit(300, 400)
    expect(v.active().length).toBe(2)
  })
})

describe('Q19: TooltipAnimator', () => {
  it('show/hide + progress', () => {
    const t = new TooltipAnimator(100, 1000)
    t.show('a')
    expect(t.isShowing('a')).toBe(true)
    expect(t.progress('a', 0)).toBe(0)  // before delay
    expect(t.progress('a', 100)).toBe(0)  // at delay
    expect(t.progress('a', 600)).toBe(0.5)  // halfway
  })
})

describe('Q20: RippleEffect', () => {
  it('start + update + active', () => {
    const r = new Ripple(100, 1000)
    r.start(50, 50)
    r.update()
    expect(r.active().length).toBe(1)
    expect(r.active()[0]?.radius).toBeGreaterThan(0)
  })
})

describe('Q21: ReducedMotion', () => {
  it('shouldAnimate', () => {
    const rm = new ReducedMotion()
    expect(rm.shouldAnimate()).toBe(true)
    rm.setEnabled(true)
    expect(rm.shouldAnimate()).toBe(false)
  })

  it('adjustDuration', () => {
    const rm = new ReducedMotion()
    rm.setEnabled(true)
    expect(rm.adjustDuration(500)).toBe(0)
  })
})

describe('Q22: PerformanceAware', () => {
  it('fps + recommend', () => {
    const p = new PerformanceAware()
    p.recordFrame(16)  // 60fps
    expect(p.fps()).toBeGreaterThan(50)
    expect(p.recommend()).toBe('high')
  })

  it('slow frame detection', () => {
    const p = new PerformanceAware()
    for (let i = 0; i < 10; i++) p.recordFrame(50)  // slow
    expect(p.isPerformant()).toBe(false)
    expect(p.recommend()).toBe('low')
  })
})

describe('Q23: GPUAccelerated', () => {
  it('createLayer + get', () => {
    const g = new GPUAccelerated()
    g.createLayer('a')
    expect(g.get('a')?.transform).toContain('translateZ')
  })

  it('markChanged + setTransform', () => {
    const g = new GPUAccelerated()
    g.createLayer('a')
    g.markChanged('a')
    expect(g.get('a')?.willChange).toBe(true)
    g.setTransform('a', 'scale(1.5)')
    expect(g.get('a')?.transform).toBe('scale(1.5)')
  })

  it('gpuFriendlyProperty', () => {
    expect(GPUAccelerated.gpuFriendlyProperty('transform')).toBe(true)
    expect(GPUAccelerated.gpuFriendlyProperty('width')).toBe(false)
  })
})

describe('Q24: TransformOptimizer', () => {
  it('compose + cache', () => {
    const o = new TransformOptimizer()
    o.compose('rotate(45deg)', 'scale(1.2)')
    expect(o.cacheSize()).toBe(1)
    o.compose('rotate(45deg)', 'scale(1.2)')
    expect(o.cacheSize()).toBe(1)  // cached
  })

  it('toGPU', () => {
    const o = new TransformOptimizer()
    expect(o.toGPU({ x: 100, y: 200 })).toBe('translate3d(100px, 200px, 0)')
  })
})

describe('Q25: IdleCallback', () => {
  it('schedule + run by priority', () => {
    const ic = new IdleCallback()
    const order: string[] = []
    ic.schedule(() => order.push('normal'), 'normal')
    ic.schedule(() => order.push('background'), 'background')
    ic.flush()
    expect(order).toEqual(['background', 'normal'])
  })

  it('cancel', () => {
    const ic = new IdleCallback()
    const id = ic.schedule(() => {}, 'normal')
    expect(ic.count()).toBe(1)
    expect(ic.cancel(id)).toBe(true)
    expect(ic.count()).toBe(0)
  })
})