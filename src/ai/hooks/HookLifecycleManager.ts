/**
 * HookLifecycleManager - V70
 * Hook 全生命周期管理: 注册 → 激活 → 暂停 → 弃用 → 移除
 * Inspired by ruflo-design 27 hooks + PluginRegistry lifecycle
 * 
 * 增强 HookManager 的生命周期能力:
 * - Hook 启用/禁用
 * - Hook 版本管理
 * - Hook 弃用警告
 * - Hook 执行指标
 * - 生命周期事件监听器
 */

import type { HookType, HookHandler, HookContext } from './types'

// ===============================================================================
// Types
// ===============================================================================

export type HookLifecycleState = 
  | 'registered'   // 已注册，待激活
  | 'active'       // 活跃，可执行
  | 'paused'       // 暂停，不执行
  | 'deprecated'    // 弃用，即将移除
  | 'removed'      // 已移除

export interface HookMetrics {
  totalInvocations: number      // 总调用次数
  successfulInvocations: number  // 成功次数
  failedInvocations: number     // 失败次数
  totalDurationMs: number        // 总执行时间
  lastInvocation: number | null   // 上次调用时间戳
  lastError: string | null       // 上次错误信息
}

export interface HookLifecycleRegistration {
  id: string
  type: HookType
  handler: HookHandler
  priority: number
  state: HookLifecycleState
  version: string
  deprecated: boolean
  deprecationMessage?: string
  createdAt: number
  updatedAt: number
  metrics: HookMetrics
}

export interface LifecycleEvent {
  hookId: string
  event: 'registered' | 'activated' | 'paused' | 'deprecated' | 'removed' | 'invoked' | 'error'
  timestamp: number
  details?: Record<string, unknown>
}

export interface LifecycleListener {
  onEvent: (event: LifecycleEvent) => void
  filter?: (event: LifecycleEvent) => boolean  // Optional filter
}

// ===============================================================================
// Constants
// ===============================================================================

const DEFAULT_VERSION = '1.0.0'

const LIFECYCLE_TRANSITIONS: Record<HookLifecycleState, HookLifecycleState[]> = {
  'registered': ['active', 'deprecated', 'removed'],  // Allow cleanup without activation
  'active': ['paused', 'deprecated', 'removed'],
  'paused': ['active', 'deprecated', 'removed'],
  'deprecated': ['removed'],
  'removed': []
}

const MAX_METRICS_HISTORY = 100  // 保留最近100条执行记录

// ===============================================================================
// HookLifecycleManager
// ===============================================================================

export class HookLifecycleManager {
  private registrations: Map<string, HookLifecycleRegistration> = new Map()
  private listeners: LifecycleListener[] = []
  private idCounter = 0

  /**
   * Generate unique hook ID
   */
  private generateHookId(type: HookType): string {
    this.idCounter++
    return `hook-${type}-${this.idCounter}-${Date.now()}`
  }

  /**
   * Register a hook with lifecycle tracking
   */
  register(
    type: HookType,
    handler: HookHandler,
    priority = 50,
    version = DEFAULT_VERSION
  ): string {
    const id = this.generateHookId(type)
    
    const registration: HookLifecycleRegistration = {
      id,
      type,
      handler,
      priority,
      state: 'registered',
      version,
      deprecated: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metrics: {
        totalInvocations: 0,
        successfulInvocations: 0,
        failedInvocations: 0,
        totalDurationMs: 0,
        lastInvocation: null,
        lastError: null
      }
    }
    
    this.registrations.set(id, registration)
    this.emitLifecycleEvent({ hookId: id, event: 'registered', timestamp: Date.now() })
    
    return id
  }

  /**
   * Trigger hooks by type (respects lifecycle state)
   */
  async trigger(type: HookType, context: HookContext): Promise<void> {
    const registrations = Array.from(this.registrations.values())
      .filter(r => r.type === type && r.state === 'active')
      .sort((a, b) => b.priority - a.priority)
    
    for (const reg of registrations) {
      if (reg.deprecated) {
        console.warn(`[HookLifecycle] Deprecated hook "${reg.id}" (${reg.deprecationMessage}) is still being triggered`)
      }
      
      const startTime = Date.now()
      this.emitLifecycleEvent({ 
        hookId: reg.id, 
        event: 'invoked', 
        timestamp: startTime,
        details: { type, context }
      })
      
      try {
        await reg.handler(context)
        
        // Update metrics
        reg.metrics.totalInvocations++
        reg.metrics.successfulInvocations++
        reg.metrics.totalDurationMs += Date.now() - startTime
        reg.metrics.lastInvocation = Date.now()
        reg.metrics.lastError = null
        reg.updatedAt = Date.now()
        
      } catch (error) {
        // Update metrics
        reg.metrics.totalInvocations++
        reg.metrics.failedInvocations++
        reg.metrics.totalDurationMs += Date.now() - startTime
        reg.metrics.lastInvocation = Date.now()
        reg.metrics.lastError = error instanceof Error ? error.message : String(error)
        reg.updatedAt = Date.now()
        
        this.emitLifecycleEvent({ 
          hookId: reg.id, 
          event: 'error', 
          timestamp: Date.now(),
          details: { error: reg.metrics.lastError }
        })
        
        console.error(`[HookLifecycle] Error in hook "${reg.id}":`, error)
      }
    }
  }

  /**
   * Activate a hook (transition from registered/paused)
   */
  activate(hookId: string): boolean {
    const reg = this.registrations.get(hookId)
    if (!reg) return false
    
    if (!this.canTransition(reg.state, 'active')) {
      console.warn(`[HookLifecycle] Cannot activate hook "${hookId}" from state "${reg.state}"`)
      return false
    }
    
    reg.state = 'active'
    reg.updatedAt = Date.now()
    this.emitLifecycleEvent({ hookId, event: 'activated', timestamp: Date.now() })
    
    return true
  }

  /**
   * Pause a hook (temporarily disable)
   */
  pause(hookId: string): boolean {
    const reg = this.registrations.get(hookId)
    if (!reg) return false
    
    if (!this.canTransition(reg.state, 'paused')) {
      return false
    }
    
    reg.state = 'paused'
    reg.updatedAt = Date.now()
    this.emitLifecycleEvent({ hookId, event: 'paused', timestamp: Date.now() })
    
    return true
  }

  /**
   * Deprecate a hook with optional message
   */
  deprecate(hookId: string, message?: string): boolean {
    const reg = this.registrations.get(hookId)
    if (!reg) return false
    
    if (!this.canTransition(reg.state, 'deprecated')) {
      return false
    }
    
    reg.state = 'deprecated'
    reg.deprecated = true
    reg.deprecationMessage = message || `Hook "${hookId}" is deprecated and will be removed in a future version.`
    reg.updatedAt = Date.now()
    this.emitLifecycleEvent({ 
      hookId, 
      event: 'deprecated', 
      timestamp: Date.now(),
      details: { message: reg.deprecationMessage }
    })
    
    return true
  }

  /**
   * Remove a hook completely
   */
  remove(hookId: string): boolean {
    const reg = this.registrations.get(hookId)
    if (!reg) return false
    
    if (!this.canTransition(reg.state, 'removed')) {
      return false
    }
    
    this.emitLifecycleEvent({ hookId, event: 'removed', timestamp: Date.now() })
    this.registrations.delete(hookId)
    
    return true
  }

  /**
   * Get hook by ID
   */
  get(hookId: string): HookLifecycleRegistration | undefined {
    return this.registrations.get(hookId)
  }

  /**
   * Get all hooks of a specific type
   */
  getByType(type: HookType): HookLifecycleRegistration[] {
    return Array.from(this.registrations.values())
      .filter(r => r.type === type)
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get all active hooks
   */
  getActive(): HookLifecycleRegistration[] {
    return Array.from(this.registrations.values())
      .filter(r => r.state === 'active')
  }

  /**
   * Get all deprecated hooks
   */
  getDeprecated(): HookLifecycleRegistration[] {
    return Array.from(this.registrations.values())
      .filter(r => r.deprecated)
  }

  /**
   * Get hook metrics
   */
  getMetrics(hookId: string): HookMetrics | null {
    const reg = this.registrations.get(hookId)
    return reg ? { ...reg.metrics } : null
  }

  /**
   * Get hook execution success rate
   */
  getSuccessRate(hookId: string): number | null {
    const reg = this.registrations.get(hookId)
    if (!reg || reg.metrics.totalInvocations === 0) return null
    return reg.metrics.successfulInvocations / reg.metrics.totalInvocations
  }

  /**
   * Get average execution time
   */
  getAverageDuration(hookId: string): number | null {
    const reg = this.registrations.get(hookId)
    if (!reg || reg.metrics.totalInvocations === 0) return null
    return reg.metrics.totalDurationMs / reg.metrics.totalInvocations
  }

  /**
   * Add lifecycle event listener
   */
  addListener(listener: LifecycleListener): void {
    this.listeners.push(listener)
  }

  /**
   * Remove lifecycle event listener
   */
  removeListener(listener: LifecycleListener): void {
    const idx = this.listeners.indexOf(listener)
    if (idx >= 0) {
      this.listeners.splice(idx, 1)
    }
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.registrations.clear()
  }

  /**
   * Get lifecycle state summary
   */
  getStateSummary(): Record<HookLifecycleState, number> {
    const summary: Record<HookLifecycleState, number> = {
      registered: 0,
      active: 0,
      paused: 0,
      deprecated: 0,
      removed: 0
    }
    
    this.registrations.forEach(reg => {
      summary[reg.state]++
    })
    
    return summary
  }

  /**
   * Check if state transition is valid
   */
  private canTransition(from: HookLifecycleState, to: HookLifecycleState): boolean {
    return LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false
  }

  /**
   * Emit lifecycle event to all listeners
   */
  private emitLifecycleEvent(event: LifecycleEvent): void {
    for (const listener of this.listeners) {
      if (!listener.filter || listener.filter(event)) {
        listener.onEvent(event)
      }
    }
  }

  /**
   * Reset metrics for a hook
   */
  resetMetrics(hookId: string): boolean {
    const reg = this.registrations.get(hookId)
    if (!reg) return false
    
    reg.metrics = {
      totalInvocations: 0,
      successfulInvocations: 0,
      failedInvocations: 0,
      totalDurationMs: 0,
      lastInvocation: null,
      lastError: null
    }
    reg.updatedAt = Date.now()
    
    return true
  }
}

// Export singleton
export const hookLifecycleManager = new HookLifecycleManager()