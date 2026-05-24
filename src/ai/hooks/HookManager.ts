/**
 * Hook 管理器 — 注册、触发、优先级排序
 */

import type { HookType, HookContext, HookHandler, HookRegistration } from './types'

export class HookManager {
  private registrations: HookRegistration[] = []

  /**
   * 注册一个 Hook 处理器
   * @param type Hook 类型
   * @param handler 处理函数
   * @param priority 优先级（越大越先执行，默认 50）
   */
  register(type: HookType, handler: HookHandler, priority = 50): void {
    this.registrations.push({ type, handler, priority })
    this.registrations.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 触发指定类型的所有 Handler
   */
  async trigger(type: HookType, context: HookContext): Promise<void> {
    const handlers = this.registrations.filter(r => r.type === type)
    for (const reg of handlers) {
      try {
        await reg.handler(context)
      } catch (e) {
        console.error(`[HookManager] Error in hook "${type}" (priority ${reg.priority}):`, e)
      }
    }
  }

  /**
   * 清除所有注册
   */
  clear(): void {
    this.registrations = []
  }
}

// 全局单例
export const hookManager = new HookManager()