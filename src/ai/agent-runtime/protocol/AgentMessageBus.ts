/**
 * AgentMessageBus.ts (V2357)
 *
 * Scoped message bus：agent 之间的 in-memory 消息传递。
 *
 * 关键设计：
 * - 内部 mailbox：每个 agentId 一个队列
 * - 订阅：按 kind 过滤
 * - 广播：to = "*" 时投递到所有 mailbox
 * - 已读追踪：消息可标记 read
 * - TTL 自动清理
 */

import {
  createEnvelope,
  isExpired,
  matchesTarget,
  type MessageEnvelope,
  type MessageKind,
  type MessagePayload,
  type EnvelopeInput,
} from './types'

// =============================================================================
// 1. 订阅描述
// =============================================================================

export type MessageHandler = (env: MessageEnvelope) => void | Promise<void>

export interface MailboxEntry {
  envelope: MessageEnvelope
  read: boolean
  receivedAt: number
}

export interface BusSubscription {
  id: string
  agentId: string
  filterKinds?: MessageKind[]
  handler: MessageHandler
}

// =============================================================================
// 2. AgentMessageBus
// =============================================================================

export class AgentMessageBus {
  private _mailboxes: Map<string, MailboxEntry[]> = new Map()
  private _subs: Map<string, BusSubscription> = new Map()
  private _nextSubId: number = 0
  private _sentLog: MessageEnvelope[] = [] // 全局发送日志
  private _maxSentLog: number = 1000

  /** 发送消息 */
  send(input: EnvelopeInput): MessageEnvelope {
    const env = createEnvelope(input)
    this._deliver(env)
    this._sentLog.push(env)
    if (this._sentLog.length > this._maxSentLog) {
      this._sentLog = this._sentLog.slice(-this._maxSentLog)
    }
    return env
  }

  /** 直接投递 envelope（内部） */
  private _deliver(env: MessageEnvelope): void {
    if (isExpired(env)) return
    if (env.to === '*') {
      // 广播到所有 mailbox
      for (const agentId of this._mailboxes.keys()) {
        if (agentId === env.from) continue // 不送给自己
        this._addToMailbox(agentId, env)
      }
      // 调用所有订阅（除了发送方）
      for (const sub of this._subs.values()) {
        if (sub.agentId === env.from) continue
        if (sub.filterKinds && !sub.filterKinds.includes(env.kind)) continue
        this._callHandler(sub, env)
      }
    } else {
      this._addToMailbox(env.to, env)
      for (const sub of this._subs.values()) {
        if (sub.agentId !== env.to) continue
        if (sub.filterKinds && !sub.filterKinds.includes(env.kind)) continue
        this._callHandler(sub, env)
      }
    }
  }

  private _addToMailbox(agentId: string, env: MessageEnvelope): void {
    if (!this._mailboxes.has(agentId)) this._mailboxes.set(agentId, [])
    this._mailboxes.get(agentId)!.push({
      envelope: env,
      read: false,
      receivedAt: Date.now(),
    })
  }

  private async _callHandler(sub: BusSubscription, env: MessageEnvelope): Promise<void> {
    try {
      await sub.handler(env)
    } catch {
      // 吞掉异常
    }
  }

  /** 订阅一个 agent 的消息（带 kind 过滤） */
  subscribe(
    agentId: string,
    handler: MessageHandler,
    filterKinds?: MessageKind[],
  ): string {
    const id = `bus_sub_${++this._nextSubId}`
    this._subs.set(id, { id, agentId, handler, filterKinds })
    return id
  }

  /** 取消订阅 */
  unsubscribe(subscriptionId: string): boolean {
    return this._subs.delete(subscriptionId)
  }

  /** 取 mailbox 全部消息 */
  mailbox(agentId: string): MailboxEntry[] {
    return this._mailboxes.get(agentId) ?? []
  }

  /** 取 mailbox 未读消息 */
  unread(agentId: string): MailboxEntry[] {
    return (this._mailboxes.get(agentId) ?? []).filter(e => !e.read)
  }

  /** 标记已读 */
  markRead(agentId: string, envelopeId: string): boolean {
    const entries = this._mailboxes.get(agentId)
    if (!entries) return false
    const entry = entries.find(e => e.envelope.id === envelopeId)
    if (!entry) return false
    entry.read = true
    return true
  }

  /** 清空 agent mailbox */
  clearMailbox(agentId: string): number {
    const entries = this._mailboxes.get(agentId) ?? []
    this._mailboxes.delete(agentId)
    return entries.length
  }

  /** 全部 mailbox key 列表 */
  knownAgents(): string[] {
    return Array.from(this._mailboxes.keys())
  }

  /** 全局发送日志 */
  sentLog(): MessageEnvelope[] {
    return [...this._sentLog]
  }

  /** 按 kind 过滤发送日志 */
  sentLogByKind(kind: MessageKind): MessageEnvelope[] {
    return this._sentLog.filter(e => e.kind === kind)
  }

  /** 订阅数 */
  subscriptionCount(): number {
    return this._subs.size
  }

  /** 清理过期消息（call 一次后所有过期 entry 被移除） */
  pruneExpired(now: number = Date.now()): number {
    let removed = 0
    for (const [agentId, entries] of this._mailboxes) {
      const remaining = entries.filter(e => !isExpired(e.envelope, now))
      removed += entries.length - remaining.length
      if (remaining.length === 0) {
        this._mailboxes.delete(agentId)
      } else {
        this._mailboxes.set(agentId, remaining)
      }
    }
    return removed
  }

  /** 全部清理 */
  clear(): void {
    this._mailboxes.clear()
    this._subs.clear()
    this._sentLog = []
  }
}

// =============================================================================
// 3. 全局单例
// =============================================================================

let _globalBus: AgentMessageBus | null = null

export function getGlobalBus(): AgentMessageBus {
  if (!_globalBus) _globalBus = new AgentMessageBus()
  return _globalBus
}

export function resetGlobalBus(): void {
  _globalBus = null
}
