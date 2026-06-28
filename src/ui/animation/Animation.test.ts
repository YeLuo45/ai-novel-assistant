/**
 * ui/animation/Animation.test.ts (Q1-Q15) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  SpringConfig, DEFAULT_SPRING, Easing, SpringInterpolator, SpringController,
  PhysicsEngine, TransitionOrchestrator, PageTransition,
  StaggeredAnimation, Choreographer, RAFScheduler,
  SkeletonGenerator, LoadingDots, ProgressBar, Spinner, PulseAnimation,
} from './Animation'

describe('Q1: SpringConfig', () => {
  it('default', () => {
    const c = new SpringConfig()
    expect(c.tension).toBe(DEFAULT_SPRING.tension)
  })

  it('custom', () => {
    const c = new SpringConfig({ tension: 200, friction: 30 })
    expect(c.tension).toBe(200)
  })

  it('estimateDurationMs > 0', () => {
    expect(new SpringConfig().estimateDurationMs()).toBeGreaterThan(0)
  })
})

describe('Q2: Easing', () => {
  it('linear', () => {
    expect(Easing.linear(0.5)).toBe(0.5)
  })
  it('easeIn', () => {
    expect(Easing.easeIn(0)).toBe(0)
    expect(Easing.easeIn(1)).toBe(1)
    expect(Easing.easeIn(0.5)).toBe(0.25)
  })
  it('easeOut', () => {
    expect(Easing.easeOut(0.5)).toBe(0.75)
  })
  it('easeInOut', () => {
    expect(Easing.easeInOut(0)).toBe(0)
    expect(Easing.easeInOut(1)).toBe(1)
    expect(Easing.easeInOut(0.5)).toBe(0.5)
  })
  it('bounceOut ends at 1', () => {
    expect(Easing.bounceOut(1)).toBeCloseTo(1, 1)
  })
  it('elasticOut ends at 1', () => {
    expect(Easing.elasticOut(1)).toBe(1)
  })
  it('get', () => {
    expect(typeof Easing.get('ease-in')).toBe('function')
  })
})

describe('Q3: SpringInterpolator', () => {
  it('converges to target', () => {
    const s = new SpringInterpolator(0, 100, new SpringConfig({ tension: 80, friction: 20 }))
    for (let i = 0; i < 2000; i++) s.update(0.005)
    expect(Math.abs(s.value - 100)).toBeLessThan(1)
  })

  it('at rest at target', () => {
    const s = new SpringInterpolator(0, 100, new SpringConfig({ tension: 200, friction: 30, precision: 0.1 }))
    for (let i = 0; i < 5000; i++) s.update(0.001)
    expect(s.isAtRest()).toBe(true)
  })
})

describe('Q4: SpringController', () => {
  it('create + tickAll', () => {
    const c = new SpringController()
    const s = c.create('a', 0, 10, new SpringConfig({ tension: 80, friction: 20 }))
    for (let i = 0; i < 2000; i++) c.tickAll(0.005)
    expect(Math.abs(s.value - 10)).toBeLessThan(1)
  })

  it('remove', () => {
    const c = new SpringController()
    c.create('a', 0, 10)
    expect(c.remove('a')).toBe(true)
  })
})

describe('Q5: PhysicsEngine', () => {
  it('add + step + applyForce', () => {
    const p = new PhysicsEngine()
    p.addBody('a', { x: 0, y: 0 })
    p.applyForce('a', { x: 10, y: 0 })
    p.step(0.1)
    const b = p.get('a')!
    expect(b.pos.x).toBeGreaterThan(0)
  })
})

describe('Q6: TransitionOrchestrator', () => {
  it('enter + exit cycle', () => {
    const o = new TransitionOrchestrator()
    o.enter()
    expect(o.phase()).toBe('active')
    o.exit()
    expect(o.phase()).toBe('idle')
  })
})

describe('Q7: PageTransition', () => {
  it('set + start + end', () => {
    const t = new PageTransition()
    t.setType('slide-left')
    t.setDuration(500)
    expect(t.type()).toBe('slide-left')
    expect(t.duration()).toBe(500)
    t.start()
    expect(t.isActive()).toBe(true)
  })
})

describe('Q8: StaggeredAnimation', () => {
  it('progress by id', () => {
    const a = new StaggeredAnimation(50, 100)
    a.setItems(['a', 'b', 'c'], 100)
    a.update(150, 0)  // 150ms after start
    expect(a.progress('a')).toBeGreaterThan(0)
  })

  it('isComplete when all done', () => {
    const a = new StaggeredAnimation(10, 50)
    a.setItems(['a'], 50)
    a.update(100, 0)
    expect(a.isComplete()).toBe(true)
  })
})

describe('Q9: Choreographer', () => {
  it('steps + active + done', () => {
    const c = new Choreographer()
    c.setSteps([{ id: 's1', startMs: 0, durationMs: 100 }])
    c.start(0)
    c.update(150)
    expect(c.isAllDone()).toBe(true)
  })

  it('not active before start', () => {
    const c = new Choreographer()
    c.setSteps([{ id: 's1', startMs: 0, durationMs: 100 }])
    expect(c.isActive()).toBe(false)
  })
})

describe('Q10: RAFScheduler', () => {
  it('schedule + cancel + count', () => {
    const r = new RAFScheduler()
    const id = r.schedule(() => {})
    expect(r.count()).toBe(1)
    expect(r.cancel(id)).toBe(true)
    expect(r.count()).toBe(0)
  })
})

describe('Q11: SkeletonGenerator', () => {
  it('generates shapes', () => {
    const g = new SkeletonGenerator()
    expect(g.generate('text').shape).toBe('text')
    expect(g.generate('circle').borderRadius).toBe('50%')
  })
})

describe('Q12: LoadingDots', () => {
  it('tick cycles', () => {
    const d = new LoadingDots(3, 100)
    expect(d.tick(0)).toBe(0)
    expect(d.tick(150)).toBe(1)
  })

  it('dotAlpha sequence', () => {
    const d = new LoadingDots(3)
    expect(d.dotAlpha(0, 0)).toBe(1)  // active
    expect(d.dotAlpha(1, 0)).toBe(0.7)  // next
    expect(d.dotAlpha(2, 0)).toBe(0.4)  // 2nd next
    expect(d.dotAlpha(0, 1)).toBe(0.4)  // was active 1 step ago (0.4 alpha)
  })
})

describe('Q13: ProgressBar', () => {
  it('set + percent', () => {
    const p = new ProgressBar()
    p.setValue(50, 100)
    expect(p.percent()).toBe(50)
  })

  it('stages', () => {
    const p = new ProgressBar()
    p.setStages([{ label: 'A', progress: 100 }, { label: 'B', progress: 50 }])
    expect(p.currentStage()?.label).toBe('B')
  })
})

describe('Q14: Spinner', () => {
  it('tick + phase', () => {
    const s = new Spinner()
    s.tick(100)
    expect(s.phase()).toBeGreaterThan(0)
  })
})

describe('Q15: PulseAnimation', () => {
  it('value between 0 and 1', () => {
    const p = new PulseAnimation()
    p.tick(0.1)
    expect(p.value()).toBeGreaterThanOrEqual(0)
    expect(p.value()).toBeLessThanOrEqual(1)
  })
})