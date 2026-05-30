/**
 * WritingAgent.ts - Agent基类
 * V41 多Agent协作系统核心组件
 */

import { Message, MessageBus, messageBus } from './MessageBus'

export type AgentRole = 'plot' | 'character' | 'dialogue' | 'style' | 'critic'
export type AgentState = 'idle' | 'working' | 'waiting' | 'done' | 'error'

export { Message }

export interface AgentConfig {
  id: string
  name: string
  role: AgentRole
}

export interface ProcessingResult {
  success: boolean
  output?: unknown
  error?: string
}

export abstract class WritingAgent {
  readonly id: string
  readonly name: string
  readonly role: AgentRole
  state: AgentState

  protected inbox: Message[] = []
  protected outbox: Message[] = []
  protected messageBus: MessageBus
  protected subscriptions: Map<string, () => void> = new Map()

  constructor(config: AgentConfig, messageBusInstance?: MessageBus) {
    this.id = config.id
    this.name = config.name
    this.role = config.role
    this.state = 'idle'
    this.messageBus = messageBusInstance ?? messageBus
  }

  /**
   * 处理消息 - 子类实现
   */
  abstract process(message: Message): Promise<ProcessingResult>

  /**
   * 接收消息
   */
  receive(message: Message): void {
    this.inbox.push(message)
    this.messageBus.publish(message.channel, message)
  }

  /**
   * 发送消息（指定目标）
   */
  send(to: string, message: Omit<Message, 'id' | 'from'>): Message {
    const fullMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.id
    }

    this.outbox.push(fullMessage)
    this.messageBus.publish(message.channel, fullMessage)
    return fullMessage
  }

  /**
   * 广播消息到通道
   */
  broadcast(channel: string, message: Omit<Message, 'id' | 'from' | 'to' | 'timestamp'>): Message {
    return this.send('*', {
      ...message,
      channel,
      to: '*',
      timestamp: Date.now()
    })
  }

  /**
   * 订阅通道
   */
  subscribe(channel: string, handler: (message: Message) => void | Promise<void>): () => void {
    const unsubscribe = this.messageBus.subscribe(channel, handler)
    this.subscriptions.set(`${channel}_${handler.toString()}`, unsubscribe)
    return unsubscribe
  }

  /**
   * 取消订阅通道
   */
  unsubscribe(channel: string): void {
    const keys = Array.from(this.subscriptions.keys()).filter(k => k.startsWith(channel))
    for (const key of keys) {
      const unsub = this.subscriptions.get(key)
      if (unsub) {
        unsub()
        this.subscriptions.delete(key)
      }
    }
  }

  /**
   * 获取收件箱消息
   */
  getInbox(): Message[] {
    return [...this.inbox]
  }

  /**
   * 获取发件箱消息
   */
  getOutbox(): Message[] {
    return [...this.outbox]
  }

  /**
   * 清空收件箱
   */
  clearInbox(): void {
    this.inbox = []
  }

  /**
   * 清空发件箱
   */
  clearOutbox(): void {
    this.outbox = []
  }

  /**
   * 设置状态
   */
  setState(state: AgentState): void {
    this.state = state
  }

  /**
   * 重置Agent
   */
  reset(): void {
    this.state = 'idle'
    this.inbox = []
    this.outbox = []
  }

  /**
   * 获取Agent信息
   */
  getInfo(): AgentConfig & { state: AgentState } {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      state: this.state
    }
  }
}