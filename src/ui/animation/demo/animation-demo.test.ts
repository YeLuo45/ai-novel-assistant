/**
 * ui/animation/demo/animation-demo.test.ts (Q26)
 */

import { describe, it, expect } from 'vitest'
import { runAnimationDemo } from './animation-demo'

describe('animation-demo', () => {
  it('1 spring active', () => expect(runAnimationDemo().springsActive).toBe(1))
  it('transition active', () => expect(runAnimationDemo().transitionPhase).toBe('active'))
  it('stagger complete (after 200ms)', () => expect(runAnimationDemo().staggerComplete).toBe(true))
  it('choreo done', () => expect(runAnimationDemo().choreoDone).toBe(true))
  it('1 skeleton', () => expect(runAnimationDemo().skeletons).toBe(1))
  it('progress 75%', () => expect(runAnimationDemo().progressPercent).toBe(75))
  it('spinner phase > 0', () => expect(runAnimationDemo().spinnerPhase).toBeGreaterThan(0))
  it('pulse in 0-1', () => {
    const v = runAnimationDemo().pulseValue
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(1)
  })
  it('2 haptics', () => expect(runAnimationDemo().hapticsCount).toBe(2))
  it('2 sounds', () => expect(runAnimationDemo().soundsPlayed).toBe(2))
  it('1 visual', () => expect(runAnimationDemo().visualCount).toBe(1))
  it('1 tooltip', () => expect(runAnimationDemo().tooltipsShowing).toBe(1))
  it('1 ripple', () => expect(runAnimationDemo().ripples).toBe(1))
  it('high performance', () => expect(runAnimationDemo().performance).toBe('high'))
  it('1 GPU layer', () => expect(runAnimationDemo().gpuLayers).toBe(1))
  it('idle processed', () => expect(runAnimationDemo().idleProcessed).toBe(1))
})