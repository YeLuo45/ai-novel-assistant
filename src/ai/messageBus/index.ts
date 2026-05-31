/**
 * V36 MessageBus - 单例导出
 * 全局事件总线，用于 Agent 间事件驱动通信
 */

import { EventEmitter } from './EventEmitter'
import { CHANNEL, type ChannelName } from './channels'

// 单例实例
const messageBus = new EventEmitter()

export { EventEmitter, CHANNEL }
export type { ChannelName }

/**
 * 全局 messageBus 实例
 * 所有 Agent 和 Orchestrator 通过此总线进行事件通信
 */
export { messageBus }

/**
 * 便捷的 emit 包装
 */
export function emit<T = unknown>(channel: ChannelName, data: T): void {
  messageBus.emit(channel, data)
}

/**
 * 便捷的 on 包装
 */
export function on<T = unknown>(channel: ChannelName, handler: (data: T) => void | Promise<void>): () => void {
  return messageBus.on(channel, handler)
}

/**
 * 便捷的 once 包装
 */
export function once<T = unknown>(channel: ChannelName, handler: (data: T) => void | Promise<void>): () => void {
  return messageBus.once(channel, handler)
}

/**
 * 便捷的 off 包装
 */
export function off<T = unknown>(channel: ChannelName, handler: (data: T) => void | Promise<void>): void {
  messageBus.off(channel, handler)
}