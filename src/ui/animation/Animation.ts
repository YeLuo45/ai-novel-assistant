/**
 * ui/animation/Animation.ts (Q1-Q15) - 15 engines
 *
 * - Q1 SpringConfig
 * - Q2 EasingFunctions
 * - Q3 SpringInterpolator
 * - Q4 SpringController
 * - Q5 PhysicsEngine
 * - Q6 TransitionOrchestrator
 * - Q7 PageTransition
 * - Q8 StaggeredAnimation
 * - Q9 Choreographer
 * - Q10 RAFScheduler
 * - Q11 SkeletonGenerator
 * - Q12 LoadingDots
 * - Q13 ProgressBar
 * - Q14 Spinner
 * - Q15 PulseAnimation
 */

// =============================================================================
// Q1: SpringConfig
// =============================================================================

export interface SpringConfigData {
  tension: number  // stiffness
  friction: number
  mass: number
  precision?: number
}

export const DEFAULT_SPRING: SpringConfigData = {
  tension: 170,
  friction: 26,
  mass: 1,
  precision: 0.01,
}

export class SpringConfig {
  private _config: SpringConfigData

  constructor(config: Partial<SpringConfigData> = {}) {
    this._config = { ...DEFAULT_SPRING, ...config }
  }

  get tension(): number { return this._config.tension }
  get friction(): number { return this._config.friction }
  get mass(): number { return this._config.mass }
  get precision(): number { return this._config.precision ?? 0.01 }

  /** 估算 duration (ms) */
  estimateDurationMs(): number {
    // 简化：基于 tension/friction
    const omega = Math.sqrt(this._config.tension / this._config.mass)
    const damping = this._config.friction / (2 * this._config.mass)
    if (damping >= omega) {
      // critically damped 或 overdamped
      return (3 / damping) * 1000
    }
    // underdamped
    return (3 / damping) * 1000
  }

  toObject(): SpringConfigData { return { ...this._config } }
}

// =============================================================================
// Q2: EasingFunctions
// =============================================================================

export type EasingFunction = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier'

export class Easing {
  static linear(t: number): number { return t }
  static easeIn(t: number): number { return t * t }
  static easeOut(t: number): number { return 1 - (1 - t) * (1 - t) }
  static easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }
  static bounceOut(t: number): number {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  }
  static elasticOut(t: number): number {
    if (t === 0 || t === 1) return t
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1
  }
  static get(name: EasingFunction): (t: number) => number {
    switch (name) {
      case 'ease-in': return Easing.easeIn
      case 'ease-out': return Easing.easeOut
      case 'ease-in-out': return Easing.easeInOut
      case 'linear': return Easing.linear
      default: return Easing.easeInOut
    }
  }
}

// =============================================================================
// Q3: SpringInterpolator
// =============================================================================

export class SpringInterpolator {
  private _from: number
  private _to: number
  private _config: SpringConfig
  private _velocity: number = 0
  private _value: number
  private _lastTime: number = 0

  constructor(from: number, to: number, config?: SpringConfig) {
    this._from = from
    this._to = to
    this._config = config ?? new SpringConfig()
    this._value = from
  }

  /** 更新一帧（返回新 value） */
  update(dt: number): number {
    const k = -this._config.tension * (this._value - this._to)
    const d = -this._config.friction * this._velocity
    const acceleration = (k + d) / this._config.mass
    this._velocity += acceleration * dt
    this._value += this._velocity * dt
    if (Math.abs(this._to - this._value) < this._config.precision && Math.abs(this._velocity) < this._config.precision) {
      this._value = this._to
      this._velocity = 0
    }
    return this._value
  }

  get value(): number { return this._value }
  get velocity(): number { return this._velocity }
  isAtRest(): boolean { return this._velocity === 0 && this._value === this._to }
}

// =============================================================================
// Q4: SpringController
// =============================================================================

export class SpringController {
  private _springs: Map<string, SpringInterpolator> = new Map()
  private _listeners: Set<() => void> = new Set()

  create(id: string, from: number, to: number, config?: SpringConfig): SpringInterpolator {
    const spring = new SpringInterpolator(from, to, config)
    this._springs.set(id, spring)
    return spring
  }

  get(id: string): SpringInterpolator | undefined {
    return this._springs.get(id)
  }

  remove(id: string): boolean { return this._springs.delete(id) }

  tickAll(dt: number): void {
    for (const s of this._springs.values()) s.update(dt)
    for (const l of this._listeners) l()
  }

  count(): number { return this._springs.size }

  subscribe(fn: () => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// Q5: PhysicsEngine (简化)
// =============================================================================

export interface Vector2D {
  x: number
  y: number
}

export class PhysicsEngine {
  private _bodies: Map<string, { pos: Vector2D; vel: Vector2D; mass: number }> = new Map()

  addBody(id: string, pos: Vector2D, mass: number = 1): void {
    this._bodies.set(id, { pos, vel: { x: 0, y: 0 }, mass })
  }

  applyForce(id: string, force: Vector2D): void {
    const b = this._bodies.get(id)
    if (!b) return
    b.vel.x += force.x / b.mass
    b.vel.y += force.y / b.mass
  }

  step(dt: number, damping: number = 0.99): void {
    for (const b of this._bodies.values()) {
      b.pos.x += b.vel.x * dt
      b.pos.y += b.vel.y * dt
      b.vel.x *= damping
      b.vel.y *= damping
    }
  }

  get(id: string): { pos: Vector2D; vel: Vector2D } | undefined {
    const b = this._bodies.get(id)
    if (!b) return undefined
    return { pos: b.pos, vel: b.vel }
  }
}

// =============================================================================
// Q6: TransitionOrchestrator
// =============================================================================

export type TransitionPhase = 'idle' | 'entering' | 'active' | 'exiting' | 'done'

export class TransitionOrchestrator {
  private _phase: TransitionPhase = 'idle'
  private _listeners: Set<(phase: TransitionPhase) => void> = new Set()

  enter(): void { this._setPhase('entering'); this._setPhase('active') }
  exit(): void { this._setPhase('exiting'); this._setPhase('done'); this._setPhase('idle') }
  phase(): TransitionPhase { return this._phase }
  private _setPhase(phase: TransitionPhase): void {
    this._phase = phase
    for (const l of this._listeners) l(phase)
  }
  subscribe(fn: (phase: TransitionPhase) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// Q7: PageTransition
// =============================================================================

export type PageTransitionType = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'zoom' | 'none'

export class PageTransition {
  private _type: PageTransitionType = 'fade'
  private _duration: number = 300
  private _active: boolean = false
  private _listeners: Set<(active: boolean) => void> = new Set()

  setType(type: PageTransitionType): void { this._type = type }
  setDuration(ms: number): void { this._duration = ms }
  type(): PageTransitionType { return this._type }
  duration(): number { return this._duration }

  start(): void {
    this._active = true
    for (const l of this._listeners) l(true)
  }
  end(): void {
    this._active = false
    for (const l of this._listeners) l(false)
  }
  isActive(): boolean { return this._active }
  subscribe(fn: (active: boolean) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// Q8: StaggeredAnimation
// =============================================================================

export class StaggeredAnimation {
  private _items: Array<{ id: string; delayMs: number; durationMs: number; progress: number; complete: boolean }> = []
  private _staggerMs: number
  private _listeners: Set<() => void> = new Set()

  constructor(staggerMs: number = 50) {
    this._staggerMs = staggerMs
  }

  setItems(itemIds: string[], durationMs: number = 300): void {
    this._items = itemIds.map((id, i) => ({
      id, delayMs: i * this._staggerMs, durationMs,
      progress: 0, complete: false,
    }))
  }

  update(now: number, startTime: number = 0): void {
    let changed = false
    for (const item of this._items) {
      const elapsed = now - startTime - item.delayMs
      if (elapsed < 0) { item.progress = 0; continue }
      const p = Math.min(1, elapsed / item.durationMs)
      if (p !== item.progress) { item.progress = p; changed = true }
      if (p >= 1 && !item.complete) { item.complete = true; changed = true }
    }
    if (changed) for (const l of this._listeners) l()
  }

  isComplete(): boolean { return this._items.every(i => i.complete) }
  progress(id: string): number { return this._items.find(i => i.id === id)?.progress ?? 0 }
  items(): string[] { return this._items.map(i => i.id) }
  subscribe(fn: () => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// Q9: Choreographer
// =============================================================================

export type ChoreographyStep = { id: string; startMs: number; durationMs: number; done: boolean }

export class Choreographer {
  private _steps: ChoreographyStep[] = []
  private _startTime: number = 0
  private _active: boolean = false

  setSteps(steps: Array<Omit<ChoreographyStep, 'done'>>): void {
    this._steps = steps.map(s => ({ ...s, done: false }))
  }

  start(now: number = Date.now()): void {
    this._startTime = now
    this._active = true
  }

  update(now: number = Date.now()): void {
    if (!this._active) return
    for (const step of this._steps) {
      const elapsed = now - this._startTime - step.startMs
      if (elapsed >= step.durationMs) step.done = true
    }
    if (this._steps.every(s => s.done)) this._active = false
  }

  isActive(): boolean { return this._active }
  stepDone(id: string): boolean { return this._steps.find(s => s.id === id)?.done ?? false }
  isAllDone(): boolean { return this._steps.every(s => s.done) }
}

// =============================================================================
// Q10: RAFScheduler
// =============================================================================

export class RAFScheduler {
  private _callbacks: Map<string, (now: number) => void> = new Map()
  private _running: boolean = false
  private _nextId: number = 0

  schedule(callback: (now: number) => void): string {
    const id = `raf_${++this._nextId}`
    this._callbacks.set(id, callback)
    if (!this._running) this._start()
    return id
  }

  cancel(id: string): boolean {
    return this._callbacks.delete(id)
  }

  count(): number { return this._callbacks.size }

  private _start(): void {
    this._running = true
    const tick = () => {
      if (this._callbacks.size === 0) { this._running = false; return }
      const now = Date.now()
      for (const cb of this._callbacks.values()) {
        try { cb(now) } catch { /* swallow */ }
      }
      if (this._running) {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(tick)
        } else {
          setTimeout(tick, 16)
        }
      }
    }
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(tick)
    else setTimeout(tick, 16)
  }
}

// =============================================================================
// Q11: SkeletonGenerator
// =============================================================================

export type SkeletonShape = 'text' | 'circle' | 'rect' | 'card' | 'avatar'

export interface SkeletonItem {
  shape: SkeletonShape
  width: string
  height: string
  borderRadius: string
  shimmer: boolean
}

export class SkeletonGenerator {
  generate(shape: SkeletonShape, width: string = '100%', height: string = '1em'): SkeletonItem {
    const shimmer = true
    const borderRadius = shape === 'circle' || shape === 'avatar' ? '50%' : shape === 'card' ? '8px' : '4px'
    return { shape, width, height, borderRadius, shimmer }
  }
}

// =============================================================================
// Q12: LoadingDots
// =============================================================================

export class LoadingDots {
  private _count: number
  private _delayMs: number
  private _phase: number = 0

  constructor(count: number = 3, delayMs: number = 150) {
    this._count = count
    this._delayMs = delayMs
  }

  tick(dt: number): number {
    this._phase += dt
    return Math.floor(this._phase / this._delayMs) % this._count
  }

  /** 每个 dot 的当前 alpha（0-1） */
  dotAlpha(dotIndex: number, currentActive: number): number {
    if (currentActive === dotIndex) return 1
    if ((currentActive + 1) % this._count === dotIndex) return 0.7
    if ((currentActive + 2) % this._count === dotIndex) return 0.4
    return 0.2
  }

  count(): number { return this._count }
}

// =============================================================================
// Q13: ProgressBar
// =============================================================================

export class ProgressBar {
  private _value: number = 0
  private _max: number = 100
  private _stages: Array<{ label: string; progress: number }> = []

  setValue(value: number, max?: number): void {
    this._value = value
    if (max !== undefined) this._max = max
  }
  value(): number { return this._value }
  max(): number { return this._max }
  percent(): number { return this._max > 0 ? (this._value / this._max) * 100 : 0 }

  setStages(stages: Array<{ label: string; progress: number }>): void {
    this._stages = stages
  }
  currentStage(): { label: string; progress: number } | null {
    return this._stages.find(s => s.progress < 100) ?? null
  }
  stages(): Array<{ label: string; progress: number }> { return [...this._stages] }
}

// =============================================================================
// Q14: Spinner
// =============================================================================

export class Spinner {
  private _phase: number = 0
  private _size: number
  private _speed: number

  constructor(size: number = 32, speed: number = 1) {
    this._size = size
    this._speed = speed
  }

  tick(dt: number): number {
    this._phase = (this._phase + dt * this._speed) % 360
    return this._phase
  }

  phase(): number { return this._phase }
  size(): number { return this._size }
}

// =============================================================================
// Q15: PulseAnimation
// =============================================================================

export class PulseAnimation {
  private _phase: number = 0
  private _intensity: number
  private _frequencyHz: number

  constructor(intensity: number = 0.5, frequencyHz: number = 1) {
    this._intensity = intensity
    this._frequencyHz = frequencyHz
  }

  tick(dt: number): number {
    this._phase += dt * this._frequencyHz * Math.PI * 2
    return this.value()
  }

  value(): number {
    // 0..1 sin wave
    return 0.5 + 0.5 * Math.sin(this._phase) * this._intensity
  }

  intensity(): number { return this._intensity }
}