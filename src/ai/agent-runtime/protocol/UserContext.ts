/**
 * protocol/UserContext.ts (V2416-V2425) - 10 engines
 *
 * - V2416 UserContextProjector: 5 视图（plotter/stylist/critic/dialogue/continuity）
 * - V2417 UserView: 单视图结构
 * - V2418 UserViewRegistry: 视图注册表
 * - V2419 UserViewSelector: 根据 agent 选视图
 * - V2420 UserViewBuilder: 构造视图
 * - V2421 UserPrivacyGuard: 字段遮蔽
 * - V2422 UserAliasing: 替换真名
 * - V2423 UserRedactionRules: 规则集
 * - V2424 UserConsent: 同意管理
 * - V2425 UserConsentLog: 同意日志
 */

import type { AgentUserBinding } from '../types'

// =============================================================================
// V2416: UserView
// =============================================================================

/** 视图类型（按 agent 类型） */
export type UserViewType =
  | 'plotter'      // 剧情顾问视图
  | 'stylist'      // 风格教练视图
  | 'critic'       // 批评家视图
  | 'dialogue'     // 对话大师视图
  | 'continuity'   // 一致性守护视图
  | 'generic'      // 通用视图

/** 单个视图（agent 看到的 user 切片） */
export interface UserView {
  viewType: UserViewType
  fields: Record<string, unknown>
  redactedFields: string[]
  aliasMap: Record<string, string>
  generatedAt: number
  sourceUserId: string
}

export interface UserContext {
  userId: string
  penName?: string
  realName?: string
  email?: string
  voiceProfile?: Record<string, unknown>
  plotOutline?: Record<string, unknown>
  preferences?: Record<string, unknown>
  privacyLevel?: 'public' | 'private' | 'confidential'
  [key: string]: unknown
}

// =============================================================================
// V2418: UserViewRegistry
// =============================================================================

export type ViewSelector = (user: UserContext) => string[]

export class UserViewRegistry {
  private _selectors: Map<UserViewType, ViewSelector> = new Map()

  register(viewType: UserViewType, selector: ViewSelector): void {
    this._selectors.set(viewType, selector)
  }

  get(viewType: UserViewType): ViewSelector | undefined {
    return this._selectors.get(viewType)
  }

  list(): UserViewType[] {
    return Array.from(this._selectors.keys())
  }
}

// =============================================================================
// V2419/V2420: UserViewSelector + UserViewBuilder
// =============================================================================

/** 默认视图选择器 */
export const DEFAULT_VIEW_SELECTORS: Record<UserViewType, ViewSelector> = {
  plotter: (u) => ['penName', 'plotOutline', 'preferences', 'voiceProfile'],
  stylist: (u) => ['penName', 'voiceProfile', 'preferences'],
  critic: (u) => ['penName', 'plotOutline', 'preferences'],
  dialogue: (u) => ['penName', 'voiceProfile', 'preferences'],
  continuity: (u) => ['penName', 'plotOutline', 'preferences'],
  generic: (u) => ['penName', 'preferences'],
}

/** 根据 viewType 构造视图 */
export function buildUserView(
  user: UserContext,
  viewType: UserViewType,
  registry?: UserViewRegistry,
): UserView {
  const selector = registry?.get(viewType) ?? DEFAULT_VIEW_SELECTORS[viewType]
  const fields: Record<string, unknown> = {}
  for (const f of selector(user)) {
    if (f in user) fields[f] = user[f]
  }
  return {
    viewType,
    fields,
    redactedFields: [],
    aliasMap: {},
    generatedAt: Date.now(),
    sourceUserId: user.userId,
  }
}

// =============================================================================
// V2416: UserContextProjector
// =============================================================================

export class UserContextProjector {
  private _registry: UserViewRegistry

  constructor(registry?: UserViewRegistry) {
    this._registry = registry ?? new UserViewRegistry()
    // 注册默认选择器
    for (const [vt, sel] of Object.entries(DEFAULT_VIEW_SELECTORS)) {
      this._registry.register(vt as UserViewType, sel)
    }
  }

  project(user: UserContext, viewType: UserViewType): UserView {
    return buildUserView(user, viewType, this._registry)
  }

  /** 根据 agent 推断 viewType */
  inferViewType(agentArchetype: string): UserViewType {
    switch (agentArchetype) {
      case 'specialist': return 'plotter'
      case 'instructor': return 'stylist'
      case 'critic': return 'critic'
      case 'reviewer': return 'continuity'
      case 'assistant':
      case 'executor': return 'generic'
      default: return 'generic'
    }
  }

  /** 投影到 binding */
  projectToBinding(user: UserContext, binding: AgentUserBinding): UserView {
    const fields: Record<string, unknown> = {}
    for (const f of binding.visibleUserFields) {
      if (f in user) fields[f] = user[f]
    }
    // baseContext 注入
    Object.assign(fields, binding.baseContext)
    return {
      viewType: 'generic',
      fields,
      redactedFields: [],
      aliasMap: { [user.realName || user.userId]: binding.userAlias },
      generatedAt: Date.now(),
      sourceUserId: user.userId,
    }
  }
}

// =============================================================================
// V2421-V2423: UserPrivacyGuard + Aliasing + RedactionRules
// =============================================================================

/** 隐私脱敏规则 */
export interface RedactionRule {
  field: string
  redaction: 'mask' | 'remove' | 'hash' | 'alias'
  maskChar?: string
}

export const DEFAULT_REDACTION_RULES: RedactionRule[] = [
  { field: 'email', redaction: 'mask', maskChar: '*' },
  { field: 'realName', redaction: 'alias' },
  { field: 'phone', redaction: 'mask', maskChar: '*' },
  { field: 'address', redaction: 'remove' },
]

/** 应用脱敏规则到 user context */
export function applyRedaction(
  user: UserContext,
  rules: RedactionRule[] = DEFAULT_REDACTION_RULES,
  aliasMap: Record<string, string> = {},
): UserContext {
  const result: UserContext = { ...user }
  for (const rule of rules) {
    if (rule.field in result) {
      const v = result[rule.field]
      if (rule.redaction === 'mask' && typeof v === 'string') {
        result[rule.field] = v.slice(0, 2) + (rule.maskChar ?? '*').repeat(Math.max(0, v.length - 2))
      } else if (rule.redaction === 'remove') {
        delete result[rule.field]
      } else if (rule.redaction === 'hash') {
        result[rule.field] = hashString(String(v))
      } else if (rule.redaction === 'alias') {
        const alias = aliasMap[String(v)] ?? `alias_${hashString(String(v)).slice(0, 6)}`
        aliasMap[String(v)] = alias
        result[rule.field] = alias
      }
    }
  }
  return result
}

function hashString(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h = h & h
  }
  return Math.abs(h).toString(36)
}

export class UserPrivacyGuard {
  private _rules: RedactionRule[]
  private _aliasMap: Record<string, string>

  constructor(rules: RedactionRule[] = DEFAULT_REDACTION_RULES) {
    this._rules = rules
    this._aliasMap = {}
  }

  /** 检查某字段是否应被脱敏 */
  shouldRedact(field: string): boolean {
    return this._rules.some(r => r.field === field)
  }

  /** 脱敏 user context */
  guard(user: UserContext): UserContext {
    return applyRedaction(user, this._rules, this._aliasMap)
  }

  /** 取 alias map（用于反向查询） */
  aliasMap(): Record<string, string> {
    return { ...this._aliasMap }
  }

  addRule(rule: RedactionRule): void {
    this._rules.push(rule)
  }

  rules(): RedactionRule[] {
    return [...this._rules]
  }
}

// =============================================================================
// V2424/V2425: UserConsent + UserConsentLog
// =============================================================================

export type ConsentType = 'memory' | 'message' | 'sharing' | 'analytics'

export interface Consent {
  userId: string
  consentType: ConsentType
  granted: boolean
  grantedAt: number
  expiresAt?: number
}

export class UserConsentLog {
  private _consents: Consent[] = []
  private _maxEntries: number

  constructor(maxEntries: number = 1000) {
    this._maxEntries = maxEntries
  }

  record(consent: Consent): void {
    this._consents.push(consent)
    if (this._consents.length > this._maxEntries) {
      this._consents = this._consents.slice(-this._maxEntries)
    }
  }

  /** 是否有有效同意（未过期） */
  hasConsent(userId: string, consentType: ConsentType, now: number = Date.now()): boolean {
    return this._consents.some(c =>
      c.userId === userId && c.consentType === consentType && c.granted &&
      (c.expiresAt === undefined || c.expiresAt > now)
    )
  }

  consentsFor(userId: string): Consent[] {
    return this._consents.filter(c => c.userId === userId)
  }

  revoke(userId: string, consentType: ConsentType): boolean {
    let n = 0
    for (const c of this._consents) {
      if (c.userId === userId && c.consentType === consentType && c.granted) {
        c.granted = false
        n += 1
      }
    }
    return n > 0
  }

  count(): number {
    return this._consents.length
  }

  clear(): void {
    this._consents = []
  }
}
