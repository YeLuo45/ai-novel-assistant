/**
 * protocol/types.ts (V2356)
 *
 * Agent 间协议的核心类型：MessageKind + MessageEnvelope。
 *
 * 9 种消息类型（参考 hermes-agent-collab Direction E + chatdev 阶段协议）：
 * - REQUEST: 同步请求（需要 RESPONSE）
 * - RESPONSE: 对 REQUEST 的应答
 * - NOTIFY: 异步通知（无需应答）
 * - OFFER: 提供方案（可被 ACCEPT/REJECT）
 * - ACCEPT: 接受 OFFER
 * - REJECT: 拒绝 OFFER
 * - VOTE: 投票（投票协议）
 * - DELEGATE: 任务委派
 * - RETURN: 委派任务的结果
 *
 * 设计原则：
 * - 不可变 envelope（Object.freeze）
 * - 强类型 payload（按 kind 分发）
 * - 自带 traceId + timestamp + ttl
 */

// =============================================================================
// 1. MessageKind 枚举
// =============================================================================

export type MessageKind =
  | 'REQUEST'
  | 'RESPONSE'
  | 'NOTIFY'
  | 'OFFER'
  | 'ACCEPT'
  | 'REJECT'
  | 'VOTE'
  | 'DELEGATE'
  | 'RETURN'

export const ALL_MESSAGE_KINDS: readonly MessageKind[] = [
  'REQUEST', 'RESPONSE', 'NOTIFY', 'OFFER', 'ACCEPT',
  'REJECT', 'VOTE', 'DELEGATE', 'RETURN',
] as const

/** 按需求类型分组 */
export const REQUEST_RESPONSE_KINDS: MessageKind[] = ['REQUEST', 'RESPONSE']
export const NEGOTIATION_KINDS: MessageKind[] = ['OFFER', 'ACCEPT', 'REJECT']
export const VOTING_KINDS: MessageKind[] = ['VOTE']
export const DELEGATION_KINDS: MessageKind[] = ['DELEGATE', 'RETURN']
export const ASYNC_KINDS: MessageKind[] = ['NOTIFY', ...NEGOTIATION_KINDS, ...VOTING_KINDS, ...DELEGATION_KINDS]

/** 任意 payload（业务侧定义） */
export type MessagePayload = unknown

// =============================================================================
// 2. Payload 类型（按 kind 分发）
// =============================================================================

/** REQUEST payload */
export interface RequestPayload {
  intent: string
  input?: unknown
  expectedReturnKind?: 'RESPONSE' | 'NOTIFY'
  timeoutMs?: number
}

/** RESPONSE payload */
export interface ResponsePayload {
  requestId: string
  result?: unknown
  error?: string
  success: boolean
}

/** NOTIFY payload */
export interface NotifyPayload {
  topic: string
  data: unknown
  severity?: 'info' | 'warn' | 'error'
}

/** OFFER payload */
export interface OfferPayload {
  proposal: string
  terms: Record<string, unknown>
  constraints?: Record<string, unknown>
  expiresAt?: number
}

/** ACCEPT payload */
export interface AcceptPayload {
  offerId: string
  reason?: string
}

/** REJECT payload */
export interface RejectPayload {
  offerId: string
  reason: string
}

/** VOTE payload */
export interface VotePayload {
  topic: string
  choice: string
  weight?: number
  rationale?: string
}

/** DELEGATE payload */
export interface DelegatePayload {
  task: string
  input?: unknown
  scope?: {
    read?: 'self' | 'team' | 'public' | 'all'
    write?: 'self' | 'team' | 'public'
    tools?: string[]
  }
  maxRetries?: number
  deadline?: number
}

/** RETURN payload (delegation result) */
export interface ReturnPayload {
  delegateId: string
  result?: unknown
  error?: string
  success: boolean
  durationMs: number
}

// =============================================================================
// 3. MessageEnvelope（不可变消息容器）
// =============================================================================

export interface MessageEnvelope {
  /** 唯一消息 ID */
  id: string
  /** 消息类型 */
  kind: MessageKind
  /** 发送方 agentId */
  from: string
  /** 接收方 agentId（"*" = 广播） */
  to: string
  /** 关联 ID（REQUEST → RESPONSE，OFFER → ACCEPT/REJECT） */
  correlationId?: string
  /** 业务 payload */
  payload: MessagePayload
  /** 时间戳 */
  timestamp: number
  /** 过期时间（ms 后无效） */
  ttl?: number
  /** 消息元数据（trace/debug） */
  metadata: Record<string, unknown>
}

// =============================================================================
// 4. 工厂函数
// =============================================================================

let _msgIdCounter = 0
function nextMsgId(): string {
  _msgIdCounter += 1
  return `msg_${Date.now()}_${_msgIdCounter}`
}

export interface EnvelopeInput {
  kind: MessageKind
  from: string
  to: string
  payload: MessagePayload
  correlationId?: string
  ttl?: number
  metadata?: Record<string, unknown>
}

/** 创建不可变 envelope */
export function createEnvelope(input: EnvelopeInput): MessageEnvelope {
  return Object.freeze({
    id: nextMsgId(),
    kind: input.kind,
    from: input.from,
    to: input.to,
    correlationId: input.correlationId,
    payload: input.payload,
    timestamp: Date.now(),
    ttl: input.ttl,
    metadata: { ...(input.metadata ?? {}) },
  })
}

/** 创建 REQUEST（correlationId 自动生成） */
export function createRequest(
  from: string,
  to: string,
  payload: RequestPayload,
  options?: { ttl?: number; metadata?: Record<string, unknown> },
): MessageEnvelope {
  return createEnvelope({
    kind: 'REQUEST',
    from,
    to,
    payload,
    ttl: options?.ttl,
    metadata: options?.metadata,
  })
}

/** 创建 RESPONSE（自动设置 correlationId = request.id） */
export function createResponse(
  from: string,
  to: string,
  request: MessageEnvelope,
  payload: Omit<ResponsePayload, 'requestId'>,
): MessageEnvelope {
  if (request.kind !== 'REQUEST') {
    throw new Error('createResponse: target must be a REQUEST')
  }
  return createEnvelope({
    kind: 'RESPONSE',
    from,
    to,
    correlationId: request.id,
    payload: { ...payload, requestId: request.id },
  })
}

/** 创建 NOTIFY */
export function createNotify(
  from: string,
  to: string,
  payload: NotifyPayload,
  options?: { ttl?: number },
): MessageEnvelope {
  return createEnvelope({
    kind: 'NOTIFY',
    from,
    to,
    payload,
    ttl: options?.ttl,
  })
}

/** 创建 OFFER */
export function createOffer(
  from: string,
  to: string,
  payload: OfferPayload,
  options?: { ttl?: number },
): MessageEnvelope {
  return createEnvelope({
    kind: 'OFFER',
    from,
    to,
    payload,
    ttl: options?.ttl,
  })
}

/** 创建 ACCEPT（auto correlationId = offer.id） */
export function createAccept(
  from: string,
  to: string,
  offer: MessageEnvelope,
  reason?: string,
): MessageEnvelope {
  if (offer.kind !== 'OFFER') {
    throw new Error('createAccept: target must be an OFFER')
  }
  return createEnvelope({
    kind: 'ACCEPT',
    from,
    to,
    correlationId: offer.id,
    payload: { offerId: offer.id, reason },
  })
}

/** 创建 REJECT */
export function createReject(
  from: string,
  to: string,
  offer: MessageEnvelope,
  reason: string,
): MessageEnvelope {
  if (offer.kind !== 'OFFER') {
    throw new Error('createReject: target must be an OFFER')
  }
  return createEnvelope({
    kind: 'REJECT',
    from,
    to,
    correlationId: offer.id,
    payload: { offerId: offer.id, reason },
  })
}

/** 创建 VOTE */
export function createVote(
  from: string,
  to: string,
  payload: VotePayload,
): MessageEnvelope {
  return createEnvelope({ kind: 'VOTE', from, to, payload })
}

/** 创建 DELEGATE */
export function createDelegate(
  from: string,
  to: string,
  payload: DelegatePayload,
): MessageEnvelope {
  return createEnvelope({ kind: 'DELEGATE', from, to, payload })
}

/** 创建 RETURN */
export function createReturn(
  from: string,
  to: string,
  delegate: MessageEnvelope,
  payload: Omit<ReturnPayload, 'delegateId'>,
): MessageEnvelope {
  if (delegate.kind !== 'DELEGATE') {
    throw new Error('createReturn: target must be a DELEGATE')
  }
  return createEnvelope({
    kind: 'RETURN',
    from,
    to,
    correlationId: delegate.id,
    payload: { ...payload, delegateId: delegate.id },
  })
}

// =============================================================================
// 5. 工具函数
// =============================================================================

/** 是否过期 */
export function isExpired(env: MessageEnvelope, now: number = Date.now()): boolean {
  if (env.ttl === undefined) return false
  return (now - env.timestamp) > env.ttl
}

/** 是否是广播 */
export function isBroadcast(env: MessageEnvelope): boolean {
  return env.to === '*'
}

/** 是否匹配 from → to */
export function matchesTarget(env: MessageEnvelope, agentId: string): boolean {
  return env.to === agentId || env.to === '*' || env.from === agentId
}

/** 取 payload 类型守卫 */
export function isRequest(env: MessageEnvelope): env is MessageEnvelope & { payload: RequestPayload } {
  return env.kind === 'REQUEST'
}
export function isResponse(env: MessageEnvelope): env is MessageEnvelope & { payload: ResponsePayload } {
  return env.kind === 'RESPONSE'
}
export function isNotify(env: MessageEnvelope): env is MessageEnvelope & { payload: NotifyPayload } {
  return env.kind === 'NOTIFY'
}
export function isOffer(env: MessageEnvelope): env is MessageEnvelope & { payload: OfferPayload } {
  return env.kind === 'OFFER'
}
export function isAccept(env: MessageEnvelope): env is MessageEnvelope & { payload: AcceptPayload } {
  return env.kind === 'ACCEPT'
}
export function isReject(env: MessageEnvelope): env is MessageEnvelope & { payload: RejectPayload } {
  return env.kind === 'REJECT'
}
export function isVote(env: MessageEnvelope): env is MessageEnvelope & { payload: VotePayload } {
  return env.kind === 'VOTE'
}
export function isDelegate(env: MessageEnvelope): env is MessageEnvelope & { payload: DelegatePayload } {
  return env.kind === 'DELEGATE'
}
export function isReturn(env: MessageEnvelope): env is MessageEnvelope & { payload: ReturnPayload } {
  return env.kind === 'RETURN'
}

/** 协议版本号 */
export const PROTOCOL_VERSION = '1.0.0'

/** 重置 msg ID 计数器（测试用） */
export function resetMsgIdCounter(): void {
  _msgIdCounter = 0
}
