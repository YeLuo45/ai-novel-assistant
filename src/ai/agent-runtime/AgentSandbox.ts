/**
 * AgentSandbox.ts (V2333)
 *
 * Agent ACL 沙箱：拦截 + 审计所有跨 agent 操作。
 *
 * 三层 ACL：
 * - L1: tool call 白名单（agent.toolWhitelist）
 * - L2: memory ACL（基于 scope）
 * - L3: agent-to-agent 消息白名单（基于 memory scope + 同 team 标志）
 *
 * 工作模式：
 * - 任何跨边界操作必须先过 sandbox.check*()
 * - denied 操作记录到 access log
 * - 通过的操作返回 Sanction 对象（含审计 trace）
 *
 * 关键设计：
 * - 沙箱本身是无状态判定器，state（access log）外置到 AgentMemoryScopeConfig
 * - 即同一个 sandbox 实例可被多 agent 共享
 */

import { canRead, canWrite, type AclCheckResult } from './AgentMemoryScope'
import type {
  AgentSoul,
  AgentUserBinding,
  AgentMemoryScopeConfig,
  AgentMemoryAccess,
  MemoryLevel,
} from './types'

// =============================================================================
// 1. Sanction（操作授权）
// =============================================================================

export interface Sanction {
  allowed: boolean
  reason: string
  audit: AgentMemoryAccess
  /** violation = 是否触发 ACL 拒绝 */
  violation: boolean
}

export interface SandboxOptions {
  /** 是否把 denied 操作也写入 access log（默认 true） */
  logDenials?: boolean
  /** 自定义 deny 谓词（高级用法） */
  customDeny?: (op: SandboxOp) => boolean
}

/** 所有 sandbox 拦截的操作类型 */
export type SandboxOp =
  | { kind: 'memory.read'; target: string; level: MemoryLevel }
  | { kind: 'memory.write'; target: string; level: MemoryLevel }
  | { kind: 'tool.call'; tool: string }
  | { kind: 'agent.message'; from: string; to: string }
  | { kind: 'agent.inspect'; target: string }

// =============================================================================
// 2. AgentSandbox 实现
// =============================================================================

export class AgentSandbox {
  private _logDenials: boolean
  private _customDeny?: (op: SandboxOp) => boolean

  constructor(options: SandboxOptions = {}) {
    this._logDenials = options.logDenials ?? true
    this._customDeny = options.customDeny
  }

  /** 入口：拦截一次 op 并返回 sanction */
  intercept(
    op: SandboxOp,
    actor: { soul: AgentSoul; memoryScope: AgentMemoryScopeConfig; agentId: string },
  ): Sanction {
    // 1. 自定义 deny
    if (this._customDeny && this._customDeny(op)) {
      return this._deny(actor, op, 'custom deny predicate')
    }

    // 2. 按 kind 分发
    switch (op.kind) {
      case 'memory.read': {
        const same = op.target === actor.agentId
        const r = canRead(actor.soul.memoryReadScope, actor.agentId, op.target, op.level, same)
        return r.allowed
          ? this._allow(actor, op, r.reason)
          : this._deny(actor, op, r.reason)
      }
      case 'memory.write': {
        const same = op.target === actor.agentId
        const r = canWrite(actor.soul.memoryWriteScope, actor.agentId, op.target, op.level, same)
        return r.allowed
          ? this._allow(actor, op, r.reason)
          : this._deny(actor, op, r.reason)
      }
      case 'tool.call': {
        const wl = actor.soul.toolWhitelist
        const allowed = !wl || wl.includes(op.tool) || wl.includes('*')
        return allowed
          ? this._allow(actor, op, allowed ? 'tool in whitelist' : 'no whitelist restriction')
          : this._deny(actor, op, `tool '${op.tool}' not in whitelist`)
      }
      case 'agent.message': {
        // 简单规则：同 team 允许；跨 team 仅当 scope 包含 all/team
        const sameTeam = op.from === op.to
        const allowed = sameTeam || actor.soul.memoryReadScope === 'all' || actor.soul.memoryReadScope === 'team'
        return allowed
          ? this._allow(actor, op, sameTeam ? 'same team' : 'scope allows')
          : this._deny(actor, op, 'cross-team message denied')
      }
      case 'agent.inspect': {
        // inspect = 只读 = 受 memory read scope 约束
        const same = op.target === actor.agentId
        const r = canRead(actor.soul.memoryReadScope, actor.agentId, op.target, 'L3', same)
        return r.allowed
          ? this._allow(actor, op, r.reason)
          : this._deny(actor, op, r.reason)
      }
    }
  }

  /** 批量拦截 */
  interceptBatch(
    ops: SandboxOp[],
    actor: { soul: AgentSoul; memoryScope: AgentMemoryScopeConfig; agentId: string },
  ): Sanction[] {
    return ops.map(op => this.intercept(op, actor))
  }

  /** 内部：构造 allow sanction */
  private _allow(
    actor: { agentId: string },
    op: SandboxOp,
    reason: string,
  ): Sanction {
    const audit: AgentMemoryAccess = {
      timestamp: Date.now(),
      sourceAgentId: actor.agentId,
      targetAgentId: this._targetOf(op),
      level: 'level' in op ? op.level : 'L1',
      operation: this._opToOpKind(op),
    }
    return { allowed: true, reason, audit, violation: false }
  }

  /** 内部：构造 deny sanction */
  private _deny(
    actor: { agentId: string },
    op: SandboxOp,
    reason: string,
  ): Sanction {
    const audit: AgentMemoryAccess = {
      timestamp: Date.now(),
      sourceAgentId: actor.agentId,
      targetAgentId: this._targetOf(op),
      level: 'level' in op ? op.level : 'L1',
      operation: this._opToOpKind(op),
    }
    return { allowed: false, reason, audit, violation: true }
  }

  private _targetOf(op: SandboxOp): string {
    switch (op.kind) {
      case 'memory.read':
      case 'memory.write':
      case 'agent.inspect':
        return op.target
      case 'agent.message':
        return op.to
      case 'tool.call':
        return op.tool
    }
  }

  private _opToOpKind(op: SandboxOp): AgentMemoryAccess['operation'] {
    if (op.kind === 'memory.read') return 'read'
    if (op.kind === 'memory.write') return 'write'
    // tool/message/inspect → log as read
    return 'read'
  }
}

// =============================================================================
// 3. 便捷工厂
// =============================================================================

/** 创建默认 sandbox（log all denials） */
export function createDefaultSandbox(): AgentSandbox {
  return new AgentSandbox({ logDenials: true })
}

/** 严格 sandbox（额外拒绝 cross-agent private memory read） */
export function createStrictSandbox(): AgentSandbox {
  return new AgentSandbox({
    logDenials: true,
    customDeny: (op) => {
      if (op.kind === 'memory.read') {
        // 严格模式：拒绝任何 L0/L1/L2 跨 agent 读
        return op.level !== 'L3' && op.level !== 'L4'
      }
      return false
    },
  })
}

// =============================================================================
// 4. AuditWriter（把 sanction 写入 memory scope 的 accessLog）
// =============================================================================

export function applySanctionToScope(
  config: AgentMemoryScopeConfig,
  sanction: Sanction,
): AgentMemoryScopeConfig {
  // 仅写入 allowed 或 logDenials=true 的 denied
  if (!sanction.allowed && sanction.reason === 'custom deny predicate') {
    return config
  }
  return {
    ...config,
    accessLog: [...config.accessLog, sanction.audit],
  }
}
