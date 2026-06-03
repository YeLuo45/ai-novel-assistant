/**
 * V36 MessageBus - 轻量级事件发射器
 * 实现标准的 emit/on/off 方法
 */

export type EventHandler<T = unknown> = (data: T) => void | Promise<void>

interface Listener<T = unknown> {
  handler: EventHandler<T>
  once: boolean
}

export class EventEmitter {
  private listeners: Map<string, Listener[]> = new Map()
  private emitter: EventEmitter | null = null

  /**
   * 发送事件
   */
  emit<T = unknown>(channel: string, data: T): void {
    const channelListeners = this.listeners.get(channel)
    if (!channelListeners) return

    // 复制一份防止监听器在执行过程中被修改
    const listenersCopy = [...channelListeners]
    
    for (const listener of listenersCopy) {
      try {
        const result = listener.handler(data)
        if (listener.once) {
          this.removeListener(channel, listener.handler)
        }
        // 如果返回 Promise，不阻塞继续执行
        void result
      } catch (error) {
        console.error(`[EventEmitter] Handler error on channel "${channel}":`, error)
      }
    }
  }

  /**
   * 订阅事件
   */
  on<T = unknown>(channel: string, handler: EventHandler<T>): () => void {
    const listener: Listener<T> = { handler: handler as EventHandler<T>, once: false }
    
    const existing = this.listeners.get(channel)
    if (existing) {
      existing.push(listener)
    } else {
      this.listeners.set(channel, [listener])
    }

    // 返回取消订阅函数
    return () => this.off(channel, handler)
  }

  /**
   * 订阅一次性事件
   */
  once<T = unknown>(channel: string, handler: EventHandler<T>): () => void {
    const listener: Listener<T> = { handler: handler as EventHandler<T>, once: true }
    
    const existing = this.listeners.get(channel)
    if (existing) {
      existing.push(listener)
    } else {
      this.listeners.set(channel, [listener])
    }

    // 返回取消订阅函数
    return () => this.off(channel, handler)
  }

  /**
   * 取消订阅
   */
  off<T = unknown>(channel: string, handler: EventHandler<T>): void {
    this.removeListener(channel, handler)
  }

  /**
   * 移除指定监听器
   */
  private removeListener(channel: string, handler: EventHandler): void {
    const channelListeners = this.listeners.get(channel)
    if (!channelListeners) return

    const index = channelListeners.findIndex(l => l.handler === handler)
    if (index !== -1) {
      channelListeners.splice(index, 1)
    }

    if (channelListeners.length === 0) {
      this.listeners.delete(channel)
    }
  }

  /**
   * 获取指定频道的监听器数量
   */
  listenerCount(channel: string): number {
    return this.listeners.get(channel)?.length ?? 0
  }

  /**
   * 获取所有频道
   */
  channels(): string[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners.clear()
  }
}