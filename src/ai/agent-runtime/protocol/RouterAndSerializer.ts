/**
 * protocol/RouterAndSerializer.ts (V2358-V2360)
 *
 * 合并 3 个 engines 到单文件以提高交付效率：
 * - V2358 MessageRouter: 策略路由（broadcast/direct/round-robin/least-busy）
 * - V2359 MessageSerializer: 序列化/反序列化（JSON + custom replacer）
 * - V2360 protocol/index.ts: L0+L1+L2 入口汇总
 */

import {
  type MessageEnvelope,
  type MessageKind,
  type MessagePayload,
} from './types'

// =============================================================================
// V2358: MessageRouter
// =============================================================================

export type RoutingPolicy =
  | 'direct'         // env.to 直接送达
  | 'broadcast'      // 强制 broadcast 到所有 mailbox
  | 'round-robin'    // 多个 target 时轮询（多 agent load balancing）
  | 'least-busy'     // 多个 target 时选 mailbox 最短的
  | 'random'         // 多个 target 时随机选

export interface RouteDecision {
  targets: string[]
  policy: RoutingPolicy
  reason: string
}

export interface RoutingContext {
  /** 所有候选 agentId 列表 */
  candidates: string[]
  /** 各 agent 当前 mailbox 大小（用于 least-busy） */
  loadMap: Map<string, number>
  /** 当前轮询索引 */
  rrIndex: number
}

export class MessageRouter {
  private _rrIndex: number = 0

  /** 单 envelope 路由 */
  route(env: MessageEnvelope, policy: RoutingPolicy, ctx: RoutingContext): RouteDecision {
    if (env.to === '*' || policy === 'broadcast') {
      return {
        targets: [...ctx.candidates],
        policy: 'broadcast',
        reason: 'broadcast mode',
      }
    }
    if (env.to !== '' && ctx.candidates.includes(env.to)) {
      return { targets: [env.to], policy: 'direct', reason: 'direct match' }
    }
    // 没有显式 target，从 candidates 中按 policy 选
    if (ctx.candidates.length === 0) {
      return { targets: [], policy, reason: 'no candidates' }
    }
    const reasonSuffix = `n=${ctx.candidates.length}`
    switch (policy) {
      case 'round-robin': {
        const idx = this._rrIndex % ctx.candidates.length
        this._rrIndex += 1
        return { targets: [ctx.candidates[idx]], policy, reason: `rr idx=${idx} ${reasonSuffix}` }
      }
      case 'least-busy': {
        let best = ctx.candidates[0]
        let bestLoad = ctx.loadMap.get(best) ?? 0
        for (const c of ctx.candidates) {
          const load = ctx.loadMap.get(c) ?? 0
          if (load < bestLoad) { best = c; bestLoad = load }
        }
        return { targets: [best], policy, reason: `least-busy load=${bestLoad} ${reasonSuffix}` }
      }
      case 'random': {
        const idx = Math.floor(Math.random() * ctx.candidates.length)
        return { targets: [ctx.candidates[idx]], policy, reason: `random idx=${idx} ${reasonSuffix}` }
      }
      case 'direct':
        return { targets: [ctx.candidates[0]], policy: 'direct', reason: `fallback direct ${reasonSuffix}` }
      case 'broadcast':
        return { targets: [ctx.candidates[0]], policy: 'broadcast', reason: `fallback broadcast ${reasonSuffix}` }
    }
  }

  /** 批处理路由 */
  routeBatch(envs: MessageEnvelope[], policy: RoutingPolicy, ctx: RoutingContext): RouteDecision[] {
    return envs.map(e => this.route(e, policy, ctx))
  }

  /** 重置轮询索引 */
  resetRoundRobin(): void {
    this._rrIndex = 0
  }
}

// =============================================================================
// V2359: MessageSerializer
// =============================================================================

/** 序列化选项 */
export interface SerializeOptions {
  /** 自定义字段白名单（不传 = 全字段） */
  fieldWhitelist?: string[]
  /** 替换函数（key/value） */
  replacer?: (key: string, value: unknown) => unknown
  /** 美化（带缩进） */
  pretty?: boolean
  /** 删除内部字段（_xxx 前缀） */
  stripInternal?: boolean
}

/** 默认序列化 */
export function serializeMessage(env: MessageEnvelope, options: SerializeOptions = {}): string {
  const { fieldWhitelist, replacer, pretty, stripInternal } = options
  const obj = envToObject(env, { fieldWhitelist, stripInternal })
  return JSON.stringify(obj, replacer ? (k, v) => replacer(k, v) : undefined, pretty ? 2 : undefined)
}

/** 反序列化 */
export function deserializeMessage(json: string): MessageEnvelope {
  const obj = JSON.parse(json)
  if (!obj || typeof obj !== 'object') {
    throw new Error('deserializeMessage: invalid JSON')
  }
  return {
    id: String(obj.id ?? ''),
    kind: obj.kind as MessageKind,
    from: String(obj.from ?? ''),
    to: String(obj.to ?? ''),
    correlationId: obj.correlationId,
    payload: obj.payload as MessagePayload,
    timestamp: Number(obj.timestamp ?? 0),
    ttl: obj.ttl,
    metadata: obj.metadata ?? {},
  }
}

/** env → plain object */
function envToObject(env: MessageEnvelope, opts: { fieldWhitelist?: string[]; stripInternal?: boolean }): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    id: env.id,
    kind: env.kind,
    from: env.from,
    to: env.to,
    correlationId: env.correlationId,
    payload: env.payload,
    timestamp: env.timestamp,
    ttl: env.ttl,
    metadata: env.metadata,
  }
  if (opts.stripInternal) {
    for (const k of Object.keys(obj)) {
      if (k.startsWith('_')) delete obj[k]
    }
  }
  if (opts.fieldWhitelist) {
    const filtered: Record<string, unknown> = {}
    for (const k of opts.fieldWhitelist) {
      if (k in obj) filtered[k] = obj[k]
    }
    return filtered
  }
  return obj
}

// =============================================================================
// V2360: Protocol Public API（汇总导出）
// =============================================================================

// re-export 已经在 module 顶部或按需

export const ROUTING_POLICIES: readonly RoutingPolicy[] = [
  'direct', 'broadcast', 'round-robin', 'least-busy', 'random',
] as const
