/**
 * protocol/RequestReply.ts (V2361-V2365)
 *
 * 合并 5 个 engines：
 * - V2361 RequestReply: 同步请求-应答模式
 * - V2362 AsyncRequest: 异步请求（带 timeout）
 * - V2363 PromiseTracker: 跟踪在飞请求的 promise
 * - V2364 ReplyMatcher: 按 correlationId 匹配 RESPONSE
 * - V2365 RequestQueue: 请求优先级队列
 */

import {
  createRequest,
  createResponse,
  type MessageEnvelope,
  type RequestPayload,
  type ResponsePayload,
  type MessageKind,
} from './types'
import type { AgentMessageBus } from './AgentMessageBus'

// =============================================================================
// V2361: RequestReply
// =============================================================================

export interface SyncReply {
  envelope: MessageEnvelope
  result?: unknown
  error?: string
  success: boolean
}

/** 同步请求-应答（带默认 timeout） */
export function requestReply(
  bus: AgentMessageBus,
  from: string,
  to: string,
  intent: string,
  input?: unknown,
  timeoutMs: number = 5000,
): SyncReply {
  const req = createRequest(from, to, { intent, input, timeoutMs })
  bus.send({ kind: 'REQUEST', from, to, payload: req.payload, ttl: timeoutMs })
  // 同步等待 — 实际用 Promise
  return waitForReply(bus, from, req.id, timeoutMs)
}

/** 等待 RESPONSE（按 correlationId） */
export function waitForReply(
  bus: AgentMessageBus,
  waiterAgent: string,
  requestId: string,
  timeoutMs: number,
): SyncReply {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const entries = bus.mailbox(waiterAgent)
    for (const entry of entries) {
      if (entry.envelope.kind === 'RESPONSE' && entry.envelope.correlationId === requestId) {
        const p = entry.envelope.payload as ResponsePayload
        return {
          envelope: entry.envelope,
          result: p.result,
          error: p.error,
          success: p.success,
        }
      }
    }
  }
  return {
    envelope: { id: 'timeout', kind: 'NOTIFY', from: '', to: waiterAgent, payload: {}, timestamp: Date.now(), metadata: {} },
    error: 'timeout',
    success: false,
  }
}

// =============================================================================
// V2362: AsyncRequest
// =============================================================================

export interface AsyncRequestHandle {
  requestId: string
  /** 解析 promise（在 RESPONSE 到达时 resolve） */
  promise: Promise<SyncReply>
  /** 取消 */
  cancel: () => void
}

/** 异步请求 */
export function asyncRequest(
  bus: AgentMessageBus,
  from: string,
  to: string,
  intent: string,
  input?: unknown,
  timeoutMs: number = 10000,
): AsyncRequestHandle {
  const req = createRequest(from, to, { intent, input, timeoutMs })
  bus.send({ kind: 'REQUEST', from, to, payload: req.payload, ttl: timeoutMs })
  let resolveFn: (r: SyncReply) => void = () => {}
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  const promise = new Promise<SyncReply>((resolve) => {
    resolveFn = resolve
    timeoutHandle = setTimeout(() => {
      resolve({
        envelope: req,
        error: 'timeout',
        success: false,
      })
    }, timeoutMs)
  })
  // 注册 RESPONSE 监听（一次性）
  const subId = bus.subscribe(to, (env) => {
    if (env.kind === 'RESPONSE' && env.correlationId === req.id) {
      const p = env.payload as ResponsePayload
      if (timeoutHandle) clearTimeout(timeoutHandle)
      resolveFn({
        envelope: env,
        result: p.result,
        error: p.error,
        success: p.success,
      })
    }
  }, ['RESPONSE'])
  return {
    requestId: req.id,
    promise,
    cancel: () => {
      bus.unsubscribe(subId)
      if (timeoutHandle) clearTimeout(timeoutHandle)
    },
  }
}

// =============================================================================
// V2363: PromiseTracker
// =============================================================================

export interface TrackedPromise {
  requestId: string
  from: string
  to: string
  intent: string
  createdAt: number
  expiresAt: number
  status: 'pending' | 'resolved' | 'rejected' | 'timeout' | 'cancelled'
  result?: unknown
  error?: string
}

export class PromiseTracker {
  private _promises: Map<string, TrackedPromise> = new Map()

  track(req: MessageEnvelope, intent: string, timeoutMs: number = 10000): TrackedPromise {
    const p: TrackedPromise = {
      requestId: req.id,
      from: req.from,
      to: req.to,
      intent,
      createdAt: Date.now(),
      expiresAt: Date.now() + timeoutMs,
      status: 'pending',
    }
    this._promises.set(req.id, p)
    return p
  }

  resolve(requestId: string, result?: unknown): boolean {
    const p = this._promises.get(requestId)
    if (!p || p.status !== 'pending') return false
    p.status = 'resolved'
    p.result = result
    return true
  }

  reject(requestId: string, error: string): boolean {
    const p = this._promises.get(requestId)
    if (!p || p.status !== 'pending') return false
    p.status = 'rejected'
    p.error = error
    return true
  }

  timeout(requestId: string): boolean {
    const p = this._promises.get(requestId)
    if (!p || p.status !== 'pending') return false
    p.status = 'timeout'
    return true
  }

  get(requestId: string): TrackedPromise | undefined {
    return this._promises.get(requestId)
  }

  list(filter?: { status?: TrackedPromise['status'] }): TrackedPromise[] {
    let arr = Array.from(this._promises.values())
    if (filter?.status) arr = arr.filter(p => p.status === filter.status)
    return arr
  }

  /** 检查过期 promise 并标记为 timeout */
  pruneTimeouts(now: number = Date.now()): number {
    let n = 0
    for (const p of this._promises.values()) {
      if (p.status === 'pending' && p.expiresAt < now) {
        p.status = 'timeout'
        n += 1
      }
    }
    return n
  }

  clear(): void {
    this._promises.clear()
  }

  count(): number {
    return this._promises.size
  }
}

// =============================================================================
// V2364: ReplyMatcher
// =============================================================================

export interface ReplyMatch {
  matched: boolean
  requestId?: string
  response?: MessageEnvelope
}

/** 按 correlationId 匹配 RESPONSE */
export class ReplyMatcher {
  /** 检查 RESPONSE 是否匹配某 REQUEST */
  matchResponse(response: MessageEnvelope, request: MessageEnvelope): boolean {
    return response.kind === 'RESPONSE' && response.correlationId === request.id
  }

  /** 找 mailbox 中所有匹配 request 的 RESPONSE */
  findMatches(mailbox: Array<{ envelope: MessageEnvelope; read: boolean }>, request: MessageEnvelope): MessageEnvelope[] {
    return mailbox
      .filter(e => this.matchResponse(e.envelope, request))
      .map(e => e.envelope)
  }

  /** 找 mailbox 中第一个匹配 */
  findFirst(mailbox: Array<{ envelope: MessageEnvelope; read: boolean }>, request: MessageEnvelope): MessageEnvelope | undefined {
    return this.findMatches(mailbox, request)[0]
  }

  /** 找所有 REQUEST 的匹配 RESPONSE（按 requestId 分组） */
  matchAll(
    mailbox: Array<{ envelope: MessageEnvelope; read: boolean }>,
    requests: MessageEnvelope[],
  ): Map<string, MessageEnvelope[]> {
    const result = new Map<string, MessageEnvelope[]>()
    for (const req of requests) {
      const matches = this.findMatches(mailbox, req)
      if (matches.length > 0) result.set(req.id, matches)
    }
    return result
  }
}

// =============================================================================
// V2365: RequestQueue
// =============================================================================

export type RequestPriority = 'low' | 'normal' | 'high' | 'critical'

export interface QueuedRequest {
  envelope: MessageEnvelope
  priority: RequestPriority
  enqueuedAt: number
  attempts: number
}

const PRIORITY_RANK: Record<RequestPriority, number> = {
  critical: 0, high: 1, normal: 2, low: 3,
}

export class RequestQueue {
  private _items: QueuedRequest[] = []

  enqueue(env: MessageEnvelope, priority: RequestPriority = 'normal'): void {
    const item: QueuedRequest = {
      envelope: env,
      priority,
      enqueuedAt: Date.now(),
      attempts: 0,
    }
    this._items.push(item)
    // 排序（按 priority asc, enqueuedAt asc）
    this._items.sort((a, b) => {
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      if (p !== 0) return p
      return a.enqueuedAt - b.enqueuedAt
    })
  }

  dequeue(): QueuedRequest | undefined {
    return this._items.shift()
  }

  peek(): QueuedRequest | undefined {
    return this._items[0]
  }

  size(): number {
    return this._items.length
  }

  list(): QueuedRequest[] {
    return [...this._items]
  }

  /** 重新入队（用于失败重试；envelope 必须在 queue 中） */
  requeue(env: MessageEnvelope, priority?: RequestPriority): boolean {
    const existing = this._items.find(i => i.envelope.id === env.id)
    if (!existing) {
      // 不在 queue 中，创建一个新 entry
      this.enqueue(env, priority ?? 'normal')
      const newEntry = this._items.find(i => i.envelope.id === env.id)
      if (newEntry) newEntry.attempts = 1
      return true
    }
    existing.attempts += 1
    if (priority) existing.priority = priority
    this._items.sort((a, b) => {
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      if (p !== 0) return p
      return a.enqueuedAt - b.enqueuedAt
    })
    return true
  }

  /** 移除某 envelope */
  remove(envelopeId: string): boolean {
    const before = this._items.length
    this._items = this._items.filter(i => i.envelope.id !== envelopeId)
    return this._items.length < before
  }

  clear(): void {
    this._items = []
  }
}
