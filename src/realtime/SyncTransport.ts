/**
 * realtime/SyncTransport.ts (N1-N10) - 10 engines
 *
 * - N1 WebSocketTransport: WebSocket transport
 * - N2 ConnectionManager: 连接管理
 * - N3 ReconnectStrategy: 重连策略
 * - N4 Heartbeat: 心跳
 * - N5 Backoff: 指数退避
 * - N6 CRDTSync: CRDT 同步
 * - N7 OperationQueue: 操作队列
 * - N8 SyncMessage: 同步消息
 * - N9 SyncResponse: 同步响应
 * - N10 SyncError: 同步错误
 */

import { CRDT, type CRDTItem } from '../../ai/persistence/PersistenceAdvanced'

// =============================================================================
// N1: WebSocketTransport (abstract)
// =============================================================================

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface TransportMessage {
  id: string
  type: 'op' | 'presence' | 'cursor' | 'sync' | 'ack' | 'error'
  senderId: string
  payload: unknown
  timestamp: number
}

export interface WebSocketTransport {
  connect(url: string): Promise<void>
  disconnect(): void
  send(msg: TransportMessage): void
  onMessage(handler: (msg: TransportMessage) => void): () => void
  getState(): ConnectionState
}

// =============================================================================
// N4: Heartbeat
// =============================================================================

export class Heartbeat {
  private _interval: ReturnType<typeof setInterval> | null = null
  private _intervalMs: number
  private _onTick: () => void
  private _lastTick: number = 0
  private _tickCount: number = 0

  constructor(intervalMs: number, onTick: () => void) {
    this._intervalMs = intervalMs
    this._onTick = onTick
  }

  start(): void {
    if (this._interval !== null) return
    this._lastTick = Date.now()
    this._interval = setInterval(() => {
      this._tickCount += 1
      this._lastTick = Date.now()
      this._onTick()
    }, this._intervalMs)
  }

  stop(): void {
    if (this._interval !== null) {
      clearInterval(this._interval)
      this._interval = null
    }
  }

  /** 检查是否超时（last tick + timeoutMs < now） */
  isStale(timeoutMs: number = 5000): boolean {
    return Date.now() - this._lastTick > timeoutMs
  }

  get tickCount(): number {
    return this._tickCount
  }
}

// =============================================================================
// N5: Backoff
// =============================================================================

export interface BackoffConfig {
  initialMs: number
  maxMs: number
  multiplier: number
  jitter: boolean
}

export class Backoff {
  private _config: BackoffConfig
  private _attempt: number = 0

  constructor(config: Partial<BackoffConfig> = {}) {
    this._config = {
      initialMs: config.initialMs ?? 1000,
      maxMs: config.maxMs ?? 30_000,
      multiplier: config.multiplier ?? 2,
      jitter: config.jitter ?? true,
    }
  }

  /** 计算 delay */
  delay(): number {
    const base = Math.min(
      this._config.initialMs * Math.pow(this._config.multiplier, this._attempt),
      this._config.maxMs,
    )
    this._attempt += 1
    return this._config.jitter ? base * (0.5 + Math.random() * 0.5) : base
  }

  reset(): void {
    this._attempt = 0
  }

  get attempt(): number {
    return this._attempt
  }
}

// =============================================================================
// N3: ReconnectStrategy
// =============================================================================

export class ReconnectStrategy {
  private _backoff: Backoff
  private _maxAttempts: number
  private _attempts: number = 0
  private _lastAttemptAt: number = 0
  private _status: 'idle' | 'reconnecting' | 'failed' = 'idle'

  constructor(maxAttempts: number = 10, config?: Partial<BackoffConfig>) {
    this._maxAttempts = maxAttempts
    this._backoff = new Backoff(config)
  }

  /** 记录一次尝试，返回 delay */
  recordAttempt(): number {
    this._attempts += 1
    this._lastAttemptAt = Date.now()
    if (this._attempts > this._maxAttempts) {
      this._status = 'failed'
      return -1
    }
    this._status = 'reconnecting'
    return this._backoff.delay()
  }

  reset(): void {
    this._attempts = 0
    this._backoff.reset()
    this._status = 'idle'
  }

  status(): 'idle' | 'reconnecting' | 'failed' {
    return this._status
  }

  get attempts(): number {
    return this._attempts
  }

  canRetry(): boolean {
    return this._attempts < this._maxAttempts
  }
}

// =============================================================================
// N2: ConnectionManager
// =============================================================================

export class ConnectionManager {
  private _state: ConnectionState = 'disconnected'
  private _url: string = ''
  private _transport: WebSocketTransport | null = null
  private _reconnect: ReconnectStrategy
  private _heartbeat: Heartbeat | null = null
  private _handlers: Set<(msg: TransportMessage) => void> = new Set()

  constructor(transport: WebSocketTransport, maxReconnect: number = 10) {
    this._transport = transport
    this._reconnect = new ReconnectStrategy(maxReconnect)
  }

  async connect(url: string): Promise<void> {
    this._url = url
    this._state = 'connecting'
    if (!this._transport) {
      this._state = 'error'
      throw new Error('no transport')
    }
    try {
      await this._transport.connect(url)
      this._state = 'connected'
      this._reconnect.reset()
      this._startHeartbeat()
    } catch {
      this._state = 'error'
      throw new Error('connection failed')
    }
  }

  disconnect(): void {
    this._state = 'disconnected'
    if (this._transport) this._transport.disconnect()
    if (this._heartbeat) this._heartbeat.stop()
  }

  send(msg: TransportMessage): boolean {
    if (this._state !== 'connected' || !this._transport) return false
    this._transport.send(msg)
    return true
  }

  onMessage(handler: (msg: TransportMessage) => void): () => void {
    this._handlers.add(handler)
    if (this._transport) {
      return this._transport.onMessage(handler)
    }
    return () => this._handlers.delete(handler)
  }

  getState(): ConnectionState {
    return this._state
  }

  getReconnectStatus(): 'idle' | 'reconnecting' | 'failed' {
    return this._reconnect.status()
  }

  attemptReconnect(): number {
    return this._reconnect.recordAttempt()
  }

  private _startHeartbeat(): void {
    this._heartbeat = new Heartbeat(30000, () => {
      if (this._state === 'connected' && this._transport) {
        this._transport.send({
          id: `hb_${Date.now()}`,
          type: 'sync',
          senderId: 'heartbeat',
          payload: { kind: 'heartbeat' },
          timestamp: Date.now(),
        })
      }
    })
    this._heartbeat.start()
  }
}

// =============================================================================
// N8: SyncMessage
// =============================================================================

export type SyncMessageType = 'operation' | 'snapshot' | 'request' | 'response' | 'heartbeat' | 'auth'

export interface SyncMessage {
  type: SyncMessageType
  roomId: string
  senderId: string
  payload: unknown
  timestamp: number
  id: string
}

export class SyncMessageBuilder {
  private _nextId: number = 0

  build(type: SyncMessageType, roomId: string, senderId: string, payload: unknown): SyncMessage {
    return {
      type, roomId, senderId, payload,
      id: `msg_${++this._nextId}_${Date.now()}`,
      timestamp: Date.now(),
    }
  }
}

// =============================================================================
// N10: SyncError
// =============================================================================

export type SyncErrorCode =
  | 'CONNECTION_LOST' | 'AUTH_FAILED' | 'TIMEOUT' | 'INVALID_MESSAGE'
  | 'CONFLICT' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'UNKNOWN'

export class SyncError extends Error {
  code: SyncErrorCode
  retryable: boolean
  context: Record<string, unknown>

  constructor(code: SyncErrorCode, message: string, retryable: boolean = false, context: Record<string, unknown> = {}) {
    super(message)
    this.code = code
    this.retryable = retryable
    this.context = context
  }
}

export class SyncErrorHandler {
  private _errors: SyncError[] = []
  private _onError: ((e: SyncError) => void) | null = null

  onError(handler: (e: SyncError) => void): void {
    this._onError = handler
  }

  report(code: SyncErrorCode, message: string, retryable: boolean = false, context: Record<string, unknown> = {}): SyncError {
    const err = new SyncError(code, message, retryable, context)
    this._errors.push(err)
    if (this._onError) this._onError(err)
    return err
  }

  getErrors(): SyncError[] {
    return [...this._errors]
  }

  clear(): void {
    this._errors = []
  }

  hasRetryable(): boolean {
    return this._errors.some(e => e.retryable)
  }
}

// =============================================================================
// N9: SyncResponse
// =============================================================================

export type SyncResponseStatus = 'ok' | 'partial' | 'failed' | 'conflict'

export class SyncResponseBuilder {
  build(status: SyncResponseStatus, requestId: string, payload: unknown, errors: string[] = []): { status: SyncResponseStatus; requestId: string; payload: unknown; errors: string[]; timestamp: number } {
    return { status, requestId, payload, errors, timestamp: Date.now() }
  }
}

// =============================================================================
// N7: OperationQueue
// =============================================================================

export interface QueuedOperation {
  id: string
  item: CRDTItem<unknown>
  attempts: number
  enqueuedAt: number
  status: 'pending' | 'sent' | 'acked' | 'failed'
}

export class OperationQueue {
  private _queue: QueuedOperation[] = []
  private _maxRetries: number
  private _nextId: number = 0

  constructor(maxRetries: number = 5) {
    this._maxRetries = maxRetries
  }

  enqueue(item: CRDTItem<unknown>): QueuedOperation {
    const op: QueuedOperation = {
      id: `op_${++this._nextId}`,
      item, attempts: 0, enqueuedAt: Date.now(), status: 'pending',
    }
    this._queue.push(op)
    return op
  }

  markSent(opId: string): boolean {
    const op = this._queue.find(o => o.id === opId)
    if (!op) return false
    op.status = 'sent'
    return true
  }

  markAcked(opId: string): boolean {
    const op = this._queue.find(o => o.id === opId)
    if (!op) return false
    op.status = 'acked'
    return true
  }

  markFailed(opId: string): boolean {
    const op = this._queue.find(o => o.id === opId)
    if (!op) return false
    op.attempts += 1
    if (op.attempts >= this._maxRetries) {
      op.status = 'failed'
    } else {
      op.status = 'pending'  // retry
    }
    return true
  }

  pending(): QueuedOperation[] {
    return this._queue.filter(o => o.status === 'pending')
  }

  failed(): QueuedOperation[] {
    return this._queue.filter(o => o.status === 'failed')
  }

  clearAcked(): void {
    this._queue = this._queue.filter(o => o.status !== 'acked')
  }

  count(): number {
    return this._queue.length
  }
}

// =============================================================================
// N6: CRDTSync
// =============================================================================

export class CRDTSync {
  private _crdt: CRDT<unknown>
  private _queue: OperationQueue
  private _remoteUpdates: Map<string, CRDTItem<unknown>> = new Map()

  constructor(crdt: CRDT<unknown>, queue?: OperationQueue) {
    this._crdt = crdt
    this._queue = queue ?? new OperationQueue()
  }

  /** 本地 set + 入队 */
  localSet(key: string, value: unknown): QueuedOperation {
    this._crdt.set(key, value)
    const items = this._crdt.export().filter(i => i.key === key)
    if (items.length === 0) throw new Error('set failed')
    return this._queue.enqueue(items[0])
  }

  /** 处理来自 remote 的更新 */
  receiveRemote(item: CRDTItem<unknown>): { merged: boolean; conflicts: string[] } {
    const before = this._crdt.get(item.key)
    this._crdt.mergeRemote(item)
    const after = this._crdt.get(item.key)
    this._remoteUpdates.set(item.key, item)
    return { merged: JSON.stringify(before) !== JSON.stringify(after), conflicts: [] }
  }

  /** 获取本地待发送的操作 */
  getPendingOps(): CRDTItem<unknown>[] {
    return this._queue.pending().map(op => op.item)
  }

  /** 标记操作已确认 */
  ack(opId: string): boolean {
    return this._queue.markAcked(opId)
  }

  crdt(): CRDT<unknown> {
    return this._crdt
  }
}