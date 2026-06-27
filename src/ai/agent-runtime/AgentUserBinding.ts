/**
 * AgentUserBinding.ts (V2328)
 *
 * User 投影：把"完整 user context"按 agent 维度切片，让不同 agent 看到不同视图。
 *
 * 关键设计：
 * - 同一份 user context，5 个 agent 看到不同字段
 * - 隐私：内部 alias 替换真名
 * - 注入：customInstructions 拼接到 system prompt
 * - 校验：visibleUserFields 字段名必须在 user context 中存在（缺则警告）
 */

import type { AgentUserBinding } from './types'

// =============================================================================
// 1. Factory
// =============================================================================

export interface CreateUserBindingInput {
  agentId: string
  visibleUserFields?: string[]
  userAlias?: string
  customInstructions?: string
  baseContext?: Record<string, unknown>
}

/** 创建 user binding（不可变） */
export function createUserBinding(input: CreateUserBindingInput): AgentUserBinding {
  return Object.freeze({
    agentId: input.agentId,
    visibleUserFields: Array.from(new Set(input.visibleUserFields ?? [])),
    userAlias: input.userAlias ?? `user-for-${input.agentId}`,
    customInstructions: input.customInstructions ?? '',
    baseContext: { ...(input.baseContext ?? {}) },
  }) as AgentUserBinding
}

// =============================================================================
// 2. Projection（把完整 user 投影成 agent 可见切片）
// =============================================================================

export interface UserContextSlice {
  /** 投影后的字段（只含 visibleUserFields 指定的） */
  fields: Record<string, unknown>
  /** 隐私脱敏后的 alias */
  alias: string
  /** 给该 agent 的 system prompt 附加段 */
  systemPromptFragment: string
  /** 投影时缺失的字段名（用于警告） */
  missingFields: string[]
}

/** 把 user context 投影成 agent 可见切片 */
export function projectUserContext(
  binding: AgentUserBinding,
  fullUserContext: Record<string, unknown>,
): UserContextSlice {
  const fields: Record<string, unknown> = {}
  const missingFields: string[] = []
  for (const f of binding.visibleUserFields) {
    if (f in fullUserContext) {
      fields[f] = fullUserContext[f]
    } else {
      missingFields.push(f)
    }
  }
  // baseContext 总是注入
  Object.assign(fields, binding.baseContext)
  return {
    fields,
    alias: binding.userAlias,
    missingFields,
    systemPromptFragment: buildSystemPromptFragment(binding, fields, fullUserContext),
  }
}

/**
 * alias-aware 文本替换：把 user 真名 → alias
 * 例："李雷" → "user-for-plot-1"
 *
 * 策略：
 * - 从 user context 中提取 name / displayName / penName / realName
 * - 转义后用全局正则替换
 * - 接受"全名匹配"语义（不做 word boundary）；
 *   因为 LLM 输入中文通常是 "你好李雷" 这种有标点/空格的格式
 */
export function aliasUser(
  binding: AgentUserBinding,
  text: string,
  fullUserContext: Record<string, unknown>,
): string {
  const alias = binding.userAlias
  const candidates: string[] = []
  for (const key of ['name', 'displayName', 'penName', 'realName'] as const) {
    const v = fullUserContext[key]
    if (typeof v === 'string' && v.length > 0 && !candidates.includes(v)) {
      candidates.push(v)
    }
  }
  let result = text
  for (const real of candidates) {
    const escaped = real.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(escaped, 'g')
    result = result.replace(re, alias)
  }
  return result
}

// =============================================================================
// 3. System Prompt 注入
// =============================================================================

/** 构造该 agent 专属的 system prompt 片段 */
export function buildSystemPromptFragment(
  binding: AgentUserBinding,
  projectedFields: Record<string, unknown>,
  _fullUserContext: Record<string, unknown>,
): string {
  const lines: string[] = []
  lines.push(`[user alias] ${binding.userAlias}`)
  if (binding.customInstructions) {
    lines.push(`[agent-specific user instructions] ${binding.customInstructions}`)
  }
  if (Object.keys(projectedFields).length > 0) {
    lines.push('[projected user context]')
    for (const [k, v] of Object.entries(projectedFields)) {
      lines.push(`  - ${k}: ${formatValue(v)}`)
    }
  }
  return lines.join('\n')
}

function formatValue(v: unknown): string {
  if (v == null) return '(null)'
  if (typeof v === 'string') return v.length > 100 ? v.slice(0, 100) + '...' : v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    return JSON.stringify(v).slice(0, 100)
  } catch {
    return '[unserializable]'
  }
}

// =============================================================================
// 4. 校验
// =============================================================================

export interface BindingValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
}

/** 校验 binding 引用是否合理（不存在的字段给 warning） */
export function validateBinding(
  binding: AgentUserBinding,
  fullUserContext: Record<string, unknown>,
): BindingValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  if (!binding.agentId || typeof binding.agentId !== 'string') {
    errors.push('agentId must be non-empty string')
  }
  for (const f of binding.visibleUserFields) {
    if (!(f in fullUserContext)) {
      warnings.push(`visibleUserField '${f}' not present in user context`)
    }
  }
  if (!binding.userAlias || binding.userAlias.length === 0) {
    warnings.push('userAlias is empty (privacy risk: real name will leak)')
  }
  return { valid: errors.length === 0, warnings, errors }
}

// =============================================================================
// 5. 派生
// =============================================================================

/** 派生新 binding（保留 agentId，更新其他字段） */
export function deriveBinding(
  parent: AgentUserBinding,
  overrides: Partial<CreateUserBindingInput>,
): AgentUserBinding {
  return createUserBinding({
    agentId: parent.agentId,
    visibleUserFields: overrides.visibleUserFields ?? parent.visibleUserFields,
    userAlias: overrides.userAlias ?? parent.userAlias,
    customInstructions: overrides.customInstructions ?? parent.customInstructions,
    baseContext: overrides.baseContext ?? parent.baseContext,
  })
}
