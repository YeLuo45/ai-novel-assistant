/**
 * ui/animation/AnimationAdvanced.ts (Q16-Q25) - 10 engines
 *
 * - Q16 HapticEngine
 * - Q17 SoundFeedback
 * - Q18 VisualFeedback
 * - Q19 TooltipAnimator
 * - Q20 RippleEffect
 * - Q21 ReducedMotion
 * - Q22 PerformanceAware
 * - Q23 GPUAccelerated
 * - Q24 TransformOptimizer
 * - Q25 IdleCallback
 */

import { RAFScheduler } from './Animation'

// =============================================================================
// Q16: HapticEngine
// =============================================================================

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

export class HapticEngine {
  private _supported: boolean = true
  private _history: Array<{ pattern: HapticPattern; timestamp: number }> = []

  isSupported(): boolean { return this._supported }

  trigger(pattern: HapticPattern): void {
    this._history.push({ pattern, timestamp: Date.now() })
  }

  history(): Array<{ pattern: HapticPattern; timestamp: number }> {
    return [...this._history]
  }

  count(): number { return this._history.length }
}

// =============================================================================
// Q17: SoundFeedback
// =============================================================================

export type SoundEffect = 'click' | 'success' | 'error' | 'notification' | 'warning' | 'tap'

export class SoundFeedback {
  private _enabled: boolean = true
  private _volume: number = 1.0
  private _history: Array<{ effect: SoundEffect; timestamp: number; volume: number }> = []

  setEnabled(enabled: boolean): void { this._enabled = enabled }
  setVolume(v: number): void { this._volume = Math.max(0, Math.min(1, v)) }
  isEnabled(): boolean { return this._enabled }
  volume(): number { return this._volume }

  play(effect: SoundEffect): boolean {
    if (!this._enabled) return false
    this._history.push({ effect, timestamp: Date.now(), volume: this._volume })
    return true
  }

  history(): Array<{ effect: SoundEffect; timestamp: number; volume: number }> {
    return [...this._history]
  }
}

// =============================================================================
// Q18: VisualFeedback
// =============================================================================

export class VisualFeedback {
  private _effects: Map<string, { x: number; y: number; intensity: number; createdAt: number }> = new Map()
  private _maxAge: number = 2000
  private _nextId: number = 0

  constructor(maxAgeMs: number = 2000) {
    this._maxAge = maxAgeMs
  }

  emit(x: number, y: number, intensity: number = 1): string {
    const id = `vf_${++this._nextId}`
    this._effects.set(id, { x, y, intensity, createdAt: Date.now() })
    return id
  }

  active(): Array<{ id: string; x: number; y: number; intensity: number }> {
    const now = Date.now()
    const out: Array<{ id: string; x: number; y: number; intensity: number }> = []
    for (const [id, e] of this._effects) {
      if (now - e.createdAt < this._maxAge) {
        out.push({ id, x: e.x, y: e.y, intensity: e.intensity })
      } else {
        this._effects.delete(id)
      }
    }
    return out
  }

  clear(): void { this._effects.clear() }
}

// =============================================================================
// Q19: TooltipAnimator
// =============================================================================

export class TooltipAnimator {
  private _showing: Set<string> = new Set()
  private _delayMs: number
  private _durationMs: number

  constructor(delayMs: number = 200, durationMs: number = 1500) {
    this._delayMs = delayMs
    this._durationMs = durationMs
  }

  show(id: string): void { this._showing.add(id) }
  hide(id: string): void { this._showing.delete(id) }
  isShowing(id: string): boolean { return this._showing.has(id) }
  visible(): string[] { return Array.from(this._showing) }

  /** 计算动画进度 0-1 */
  progress(id: string, elapsedMs: number): number {
    if (elapsedMs < this._delayMs) return 0  // 还在 delay
    if (elapsedMs > this._delayMs + this._durationMs) return 1  // 已结束
    return (elapsedMs - this._delayMs) / this._durationMs
  }
}

// =============================================================================
// Q20: RippleEffect
// =============================================================================

export class Ripple {
  private _ripples: Map<string, { x: number; y: number; radius: number; startedAt: number; maxRadius: number }> = new Map()
  private _nextId: number = 0
  private _maxRadius: number
  private _duration: number

  constructor(maxRadius: number = 100, durationMs: number = 600) {
    this._maxRadius = maxRadius
    this._duration = durationMs
  }

  start(x: number, y: number): string {
    const id = `ripple_${++this._nextId}`
    this._ripples.set(id, { x, y, radius: 0, startedAt: Date.now(), maxRadius: this._maxRadius })
    return id
  }

  update(): void {
    const now = Date.now()
    for (const [id, r] of this._ripples) {
      const elapsed = now - r.startedAt
      r.radius = Math.max(1, (elapsed / this._duration) * this._maxRadius)
      if (elapsed >= this._duration) this._ripples.delete(id)
    }
  }

  active(): Array<{ id: string; x: number; y: number; radius: number }> {
    const out: Array<{ id: string; x: number; y: number; radius: number }> = []
    for (const [id, r] of this._ripples) {
      out.push({ id, x: r.x, y: r.y, radius: r.radius })
    }
    return out
  }

  clear(): void { this._ripples.clear() }
}

// =============================================================================
// Q21: ReducedMotion
// =============================================================================

export class ReducedMotion {
  private _enabled: boolean = false
  private _listeners: Set<(enabled: boolean) => void> = new Set()

  setEnabled(enabled: boolean): void {
    if (this._enabled !== enabled) {
      this._enabled = enabled
      for (const l of this._listeners) l(enabled)
    }
  }

  isEnabled(): boolean { return this._enabled }
  shouldAnimate(): boolean { return !this._enabled }

  /** 调整 duration: 0 表示禁用动画 */
  adjustDuration(originalMs: number): number {
    return this._enabled ? 0 : originalMs
  }

  subscribe(fn: (enabled: boolean) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// Q22: PerformanceAware
// =============================================================================

export class PerformanceAware {
  private _fps: number = 60
  private _slowFrames: number = 0
  private _totalFrames: number = 0

  recordFrame(durationMs: number): void {
    this._totalFrames += 1
    if (durationMs > 16.67) this._slowFrames += 1
    this._fps = 1000 / Math.max(durationMs, 1)
  }

  fps(): number { return this._fps }
  isPerformant(): boolean { return this._slowFrames / Math.max(this._totalFrames, 1) < 0.1 }
  slowFrameRatio(): number { return this._slowFrames / Math.max(this._totalFrames, 1) }
  frameCount(): number { return this._totalFrames }

  /** 根据性能建议渲染选项 */
  recommend(): 'high' | 'medium' | 'low' {
    if (this._fps >= 50) return 'high'
    if (this._fps >= 30) return 'medium'
    return 'low'
  }

  reset(): void {
    this._slowFrames = 0
    this._totalFrames = 0
    this._fps = 60
  }
}

// =============================================================================
// Q23: GPUAccelerated
// =============================================================================

export class GPUAccelerated {
  private _layers: Map<string, { transform: string; opacity: number; willChange: boolean }> = new Map()

  createLayer(id: string): void {
    this._layers.set(id, { transform: 'translateZ(0)', opacity: 1, willChange: true })
  }

  removeLayer(id: string): boolean { return this._layers.delete(id) }

  /** 标记 layer 改变（触发 GPU composite） */
  markChanged(id: string): boolean {
    const l = this._layers.get(id)
    if (!l) return false
    l.willChange = true
    return true
  }

  /** 应用 transform 优化（只修改 transform/opacity） */
  setTransform(id: string, transform: string): boolean {
    const l = this._layers.get(id)
    if (!l) return false
    l.transform = transform
    return true
  }

  setOpacity(id: string, opacity: number): boolean {
    const l = this._layers.get(id)
    if (!l) return false
    l.opacity = opacity
    return true
  }

  get(id: string): { transform: string; opacity: number; willChange: boolean } | undefined {
    return this._layers.get(id)
  }

  layerCount(): number { return this._layers.size }

  static gpuFriendlyProperty(prop: string): boolean {
    return ['transform', 'opacity', 'filter'].includes(prop)
  }
}

// =============================================================================
// Q24: TransformOptimizer
// =============================================================================

export class TransformOptimizer {
  private _cache: Map<string, string> = new Map()

  /** 合并多个 transforms */
  compose(...transforms: string[]): string {
    const key = transforms.join('|')
    if (this._cache.has(key)) return this._cache.get(key)!
    const merged = transforms.filter(t => t.length > 0).join(' ')
    this._cache.set(key, merged)
    return merged
  }

  /** translate3d for GPU acceleration */
  toGPU(translation: { x: number; y: number }): string {
    return `translate3d(${translation.x}px, ${translation.y}px, 0)`
  }

  cacheSize(): number { return this._cache.size }
  clearCache(): void { this._cache.clear() }
}

// =============================================================================
// Q25: IdleCallback
// =============================================================================

export type IdlePriority = 'background' | 'normal' | 'user-visible'

export class IdleCallback {
  private _tasks: Map<string, { fn: () => void; priority: IdlePriority }> = new Map()
  private _nextId: number = 0
  private _running: boolean = false

  schedule(fn: () => void, priority: IdlePriority = 'normal'): string {
    const id = `idle_${++this._nextId}`
    this._tasks.set(id, { fn, priority })
    // 不立即 flush，让所有 tasks 排队然后按优先级批量执行
    return id
  }

  /** 手动 flush（按优先级排序执行） */
  flush(): void {
    if (this._tasks.size === 0) return
    const sorted = Array.from(this._tasks.entries()).sort((a, b) => {
      const order = { 'background': 0, 'normal': 1, 'user-visible': 2 }
      return order[a[1].priority] - order[b[1].priority]
    })
    for (const [id, task] of sorted) {
      try { task.fn() } catch { /* swallow */ }
      this._tasks.delete(id)
    }
  }

  cancel(id: string): boolean { return this._tasks.delete(id) }

  count(): number { return this._tasks.size }

  private _flush(): void {
    this._running = true
    // 占位 — 实际 flush 已抽出为公开方法
    this._running = false
  }
}