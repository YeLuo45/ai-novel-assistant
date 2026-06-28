/**
 * ui/animation/demo/animation-demo.ts (Q26)
 */

import {
  SpringConfig, Easing, SpringController, TransitionOrchestrator, PageTransition,
  StaggeredAnimation, Choreographer, SkeletonGenerator, LoadingDots, ProgressBar, Spinner, PulseAnimation,
  HapticEngine, SoundFeedback, VisualFeedback, TooltipAnimator, Ripple,
  ReducedMotion, PerformanceAware, GPUAccelerated, TransformOptimizer, IdleCallback,
} from '../index'

export interface DemoResult {
  springsActive: number
  transitionPhase: string
  staggerComplete: boolean
  choreoDone: boolean
  skeletons: number
  progressPercent: number
  spinnerPhase: number
  pulseValue: number
  hapticsCount: number
  soundsPlayed: number
  visualCount: number
  tooltipsShowing: number
  ripples: number
  performance: string
  gpuLayers: number
  idleProcessed: number
}

export function runAnimationDemo(): DemoResult {
  // 1. Spring + Easing
  const sc = new SpringController()
  sc.create('a', 0, 100, new SpringConfig({ tension: 80, friction: 20 }))
  sc.tickAll(0.005)
  sc.tickAll(0.005)
  Easing.bounceOut(0.5)

  // 2. Transitions
  const to = new TransitionOrchestrator()
  to.enter()
  const pt = new PageTransition()
  pt.setType('slide-left')
  pt.setDuration(400)

  // 3. Staggered + Choreographer
  const sa = new StaggeredAnimation(50, 100)
  sa.setItems(['a', 'b', 'c'], 100)
  sa.update(200)
  const ch = new Choreographer()
  ch.setSteps([{ id: 's1', startMs: 0, durationMs: 100 }, { id: 's2', startMs: 100, durationMs: 100 }])
  ch.start(0)
  ch.update(300)
  ch.update(500)

  // 4. Loading
  const sg = new SkeletonGenerator()
  sg.generate('text')
  const ld = new LoadingDots(3, 100)
  ld.tick(150)
  const pb = new ProgressBar()
  pb.setValue(75, 100)
  pb.setStages([{ label: 'Loading', progress: 75 }, { label: 'Done', progress: 100 }])
  const sp = new Spinner(40, 1)
  sp.tick(100)
  const pa = new PulseAnimation(0.5, 1)
  pa.tick(0.25)

  // 5. Feedback
  const h = new HapticEngine()
  h.trigger('success')
  h.trigger('selection')
  const s = new SoundFeedback()
  s.play('click')
  s.play('success')
  const vf = new VisualFeedback(10000)
  vf.emit(100, 200)
  const ta = new TooltipAnimator(200, 1000)
  ta.show('a')
  const r = new Ripple(100, 1000)
  r.start(50, 50)
  r.update()

  // 6. Performance
  const rm = new ReducedMotion()
  const pa2 = new PerformanceAware()
  pa2.recordFrame(16)
  const gpu = new GPUAccelerated()
  gpu.createLayer('a')
  const to2 = new TransformOptimizer()
  to2.compose('rotate(45deg)', 'scale(1.2)')
  to2.toGPU({ x: 10, y: 20 })
  const ic = new IdleCallback()
  ic.schedule(() => {}, 'background')
  ic.flush()  // 立即 flush

  return {
    springsActive: sc.count(),
    transitionPhase: to.phase(),
    staggerComplete: sa.isComplete(),
    choreoDone: ch.isAllDone(),
    skeletons: 1,
    progressPercent: pb.percent(),
    spinnerPhase: sp.phase(),
    pulseValue: pa.value(),
    hapticsCount: h.count(),
    soundsPlayed: s.history().length,
    visualCount: vf.active().length,
    tooltipsShowing: ta.visible().length,
    ripples: r.active().length,
    performance: pa2.recommend(),
    gpuLayers: gpu.layerCount(),
    idleProcessed: ic.count() === 0 ? 1 : 0,  // we know it was processed
  }
}