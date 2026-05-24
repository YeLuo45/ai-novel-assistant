/**
 * MessageBus.ts - 分布式消息传递系统
 * V41 多Agent协作系统核心组件
 */

export type MessageType = 'request' | 'response' | 'event' | 'signal'
export type Channel = string

export interface Message {
  id: string
  from: string
  to: string
  channel: Channel
  type: MessageType
  payload: unknown
  timestamp: number
}

export interface MessageHandler {
  (message: Message): void | Promise<void>
}

export class MessageBus {
  private channels: Map<Channel, Set<MessageHandler>> = new Map()
  private messageLog: Message[] = []
  private messageIdCounter: number = 0

  /**
   * 生成唯一消息ID
   */
  generateMessageId(): string {
    return `msg_${Date.now()}_${++this.messageIdCounter}`
  }

  /**
   * 发布消息到指定通道
   */
  publish(channel: Channel, message: Message): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }

    const handlers = this.channels.get(channel)!
    for (const handler of Array.from(handlers)) {
      try {
        const result = handler(message)
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error(`[MessageBus] Async handler error on ${channel}:`, err)
          })
        }
      } catch (err) {
        console.error(`[MessageBus] Handler error on ${channel}:`, err)
      }
    }

    this.messageLog.push(message)
  }

  /**
   * 订阅指定通道
   */
  subscribe(channel: Channel, handler: MessageHandler): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }

    this.channels.get(channel)!.add(handler)

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(channel, handler)
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(channel: Channel, handler: MessageHandler): void {
    const handlers = this.channels.get(channel)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.channels.delete(channel)
      }
    }
  }

  /**
   * 广播消息（无指定目标）
   */
  broadcast(channel: Channel, message: Omit<Message, 'id' | 'to'>): void {
    const fullMessage: Message = {
      ...message,
      id: this.generateMessageId(),
      to: '*'
    }
    this.publish(channel, fullMessage)
  }

  /**
   * 发送消息（指定目标）
   */
  send(from: string, to: string, channel: Channel, type: MessageType, payload: unknown): Message {
    const message: Message = {
      id: this.generateMessageId(),
      from,
      to,
      channel,
      type,
      payload,
      timestamp: Date.now()
    }
    this.publish(channel, message)
    return message
  }

  /**
   * 创建请求消息
   */
  request(from: string, to: string, channel: Channel, payload: unknown): Message {
    return this.send(from, to, channel, 'request', payload)
  }

  /**
   * 创建响应消息
   */
  response(from: string, to: string, channel: Channel, payload: unknown): Message {
    return this.send(from, to, channel, 'response', payload)
  }

  /**
   * 创建事件消息
   */
  event(from: string, channel: Channel, payload: unknown): Message {
    return this.send(from, '*', channel, 'event', payload)
  }

  /**
   * 创建信号消息
   */
  signal(from: string, to: string, channel: Channel): Message {
    return this.send(from, to, channel, 'signal', null)
  }

  /**
   * 获取通道订阅者数量
   */
  getChannelSubscriberCount(channel: Channel): number {
    return this.channels.get(channel)?.size ?? 0
  }

  /**
   * 获取消息日志
   */
  getMessageLog(limit?: number): Message[] {
    if (limit) {
      return this.messageLog.slice(-limit)
    }
    return [...this.messageLog]
  }

  /**
   * 清除消息日志
   */
  clearLog(): void {
    this.messageLog = []
  }

  /**
   * 清空通道
   */
  clearChannel(channel: Channel): void {
    this.channels.delete(channel)
  }

  /**
   * 清空所有通道
   */
  clearAll(): void {
    this.channels.clear()
    this.messageLog = []
  }
}

// 导出单例
export const messageBus = new MessageBus()