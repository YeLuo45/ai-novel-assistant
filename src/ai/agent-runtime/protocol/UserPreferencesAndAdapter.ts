/**
 * protocol/UserPreferencesAndAdapter.ts (V2426-V2440) - 15 engines
 *
 * - V2426 UserPreferenceInjector: 偏好按 agent 维度拆分
 * - V2427 UserPreference: 单个偏好项
 * - V2428 UserPreferenceStore: 偏好存储
 * - V2429 UserPreferenceFilter: 按 agent 过滤偏好
 * - V2430 UserPreferenceMerger: 多 user 偏好合并
 * - V2431 UserContextSnapshot: 上下文快照
 * - V2432 UserContextDiff: 上下文差异
 * - V2433 UserContextMerger: 多 user context 合并
 * - V2434 UserContextCache: 缓存
 * - V2435 UserContextVersion: 版本控制
 * - V2436 UserContextAdapter: 适配器（外部 → internal）
 * - V2437 UserContextValidator: 验证
 * - V2438 UserContextSchema: schema 校验
 * - V2439 UserContextMigrator: 跨版本迁移
 * - V2440 UserContextExporter: 导出
 */

import type { UserContext, UserView } from './UserContext'
import { buildUserView } from './UserContext'

// =============================================================================
// V2427: UserPreference
// =============================================================================

export interface UserPreference {
  key: string
  value: unknown
  category: 'style' | 'plot' | 'character' | 'theme' | 'meta'
  scope: 'global' | 'project' | 'session'
  updatedAt: number
}

// =============================================================================
// V2428: UserPreferenceStore
// =============================================================================

export class UserPreferenceStore {
  private _prefs: Map<string, UserPreference> = new Map()

  set(pref: UserPreference): void {
    this._prefs.set(pref.key, pref)
  }

  get(key: string): UserPreference | undefined {
    return this._prefs.get(key)
  }

  delete(key: string): boolean {
    return this._prefs.delete(key)
  }

  all(): UserPreference[] {
    return Array.from(this._prefs.values())
  }

  byCategory(category: UserPreference['category']): UserPreference[] {
    return this.all().filter(p => p.category === category)
  }

  count(): number {
    return this._prefs.size
  }

  clear(): void {
    this._prefs.clear()
  }
}

// =============================================================================
// V2429: UserPreferenceFilter
// =============================================================================

export function filterPreferences(
  prefs: UserPreference[],
  filter: { categories?: UserPreference['category'][]; scopes?: UserPreference['scope'][] },
): UserPreference[] {
  return prefs.filter(p => {
    if (filter.categories && !filter.categories.includes(p.category)) return false
    if (filter.scopes && !filter.scopes.includes(p.scope)) return false
    return true
  })
}

// =============================================================================
// V2430: UserPreferenceMerger
// =============================================================================

/** 多 user 偏好合并（later 覆盖 earlier） */
export function mergePreferences(...stores: UserPreferenceStore[]): UserPreferenceStore {
  const result = new UserPreferenceStore()
  for (const s of stores) {
    for (const p of s.all()) {
      const existing = result.get(p.key)
      if (!existing || existing.updatedAt < p.updatedAt) {
        result.set(p)
      }
    }
  }
  return result
}

// =============================================================================
// V2426: UserPreferenceInjector
// =============================================================================

export interface PreferenceInjection {
  /** 注入到 baseContext 的字段名 */
  field: string
  /** 取值的 source key（from preference store） */
  sourceKey: string
  /** 缺失时的 fallback */
  fallback?: unknown
}

/** 把 prefs 注入到 user context（按 field 名） */
export function injectPreferences(
  user: UserContext,
  store: UserPreferenceStore,
  injections: PreferenceInjection[],
): UserContext {
  const result = { ...user }
  for (const inj of injections) {
    const pref = store.get(inj.sourceKey)
    result[inj.field] = pref?.value ?? inj.fallback
  }
  return result
}

// =============================================================================
// V2431: UserContextSnapshot
// =============================================================================

export interface UserContextSnapshot {
  timestamp: number
  userId: string
  context: UserContext
  preferences: UserPreference[]
  views: UserView[]
}

export function snapshotUserContext(
  user: UserContext,
  prefs: UserPreferenceStore,
  views: UserView[] = [],
): UserContextSnapshot {
  return {
    timestamp: Date.now(),
    userId: user.userId,
    context: { ...user },
    preferences: prefs.all(),
    views: [...views],
  }
}

// =============================================================================
// V2432: UserContextDiff
// =============================================================================

export interface UserContextDiff {
  added: string[]
  removed: string[]
  changed: string[]
}

export function diffUserContext(a: UserContext, b: UserContext): UserContextDiff {
  const aKeys = new Set(Object.keys(a))
  const bKeys = new Set(Object.keys(b))
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []
  for (const k of bKeys) if (!aKeys.has(k)) added.push(k)
  for (const k of aKeys) if (!bKeys.has(k)) removed.push(k)
  for (const k of aKeys) {
    if (bKeys.has(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
      changed.push(k)
    }
  }
  return { added, removed, changed }
}

// =============================================================================
// V2433: UserContextMerger
// =============================================================================

export function mergeUserContexts(target: UserContext, source: UserContext, strategy: 'override' | 'merge' = 'override'): UserContext {
  if (strategy === 'override') {
    return { ...target, ...source }
  }
  // merge: target 优先，缺失才用 source
  const result: UserContext = { ...source }
  for (const k of Object.keys(target)) {
    if (target[k] !== undefined) result[k] = target[k]
  }
  return result
}

// =============================================================================
// V2434: UserContextCache
// =============================================================================

export class UserContextCache {
  private _cache: Map<string, { value: UserContext; expiresAt: number }> = new Map()

  get(userId: string): UserContext | undefined {
    const entry = this._cache.get(userId)
    if (!entry) return undefined
    if (entry.expiresAt < Date.now()) {
      this._cache.delete(userId)
      return undefined
    }
    return entry.value
  }

  set(userId: string, value: UserContext, ttlMs: number = 60_000): void {
    this._cache.set(userId, { value, expiresAt: Date.now() + ttlMs })
  }

  invalidate(userId: string): boolean {
    return this._cache.delete(userId)
  }

  size(): number {
    return this._cache.size
  }

  clear(): void {
    this._cache.clear()
  }
}

// =============================================================================
// V2435: UserContextVersion
// =============================================================================

export interface VersionedContext {
  version: number
  context: UserContext
  migratedAt?: number
  fromVersion?: number
}

export function upgradeContext(c: VersionedContext, targetVersion: number, now: number = Date.now()): VersionedContext {
  return {
    ...c,
    version: targetVersion,
    migratedAt: now,
    fromVersion: c.version,
  }
}

// =============================================================================
// V2436: UserContextAdapter
// =============================================================================

/** 外部 user 格式 → 内部 UserContext */
export function adaptExternalUser(external: Record<string, unknown>): UserContext {
  return {
    userId: String(external.id ?? external.userId ?? 'unknown'),
    realName: typeof external.real_name === 'string' ? external.real_name : undefined,
    penName: typeof external.pen_name === 'string' ? external.pen_name : undefined,
    email: typeof external.email === 'string' ? external.email : undefined,
    voiceProfile: (external.voice_profile as Record<string, unknown>) ?? undefined,
    plotOutline: (external.plot_outline as Record<string, unknown>) ?? undefined,
    preferences: (external.preferences as Record<string, unknown>) ?? undefined,
    privacyLevel: (external.privacy_level as 'public' | 'private' | 'confidential') ?? 'private',
  }
}

// =============================================================================
// V2437: UserContextValidator
// =============================================================================

export interface ValidationIssue {
  field: string
  reason: string
  severity: 'error' | 'warning'
}

export function validateUserContext(user: UserContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!user.userId || user.userId.length === 0) {
    issues.push({ field: 'userId', reason: 'required', severity: 'error' })
  }
  if (user.email && !/^[^@]+@[^@]+$/.test(user.email)) {
    issues.push({ field: 'email', reason: 'invalid format', severity: 'warning' })
  }
  if (user.privacyLevel && !['public', 'private', 'confidential'].includes(user.privacyLevel)) {
    issues.push({ field: 'privacyLevel', reason: 'unknown value', severity: 'error' })
  }
  return issues
}

// =============================================================================
// V2438: UserContextSchema
// =============================================================================

export interface ContextSchema {
  requiredFields: string[]
  optionalFields: string[]
  types: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
}

export const DEFAULT_CONTEXT_SCHEMA: ContextSchema = {
  requiredFields: ['userId'],
  optionalFields: ['penName', 'realName', 'email', 'voiceProfile', 'plotOutline', 'preferences', 'privacyLevel'],
  types: {
    userId: 'string',
    penName: 'string',
    realName: 'string',
    email: 'string',
    voiceProfile: 'object',
    plotOutline: 'object',
    preferences: 'object',
    privacyLevel: 'string',
  },
}

export function validateAgainstSchema(user: UserContext, schema: ContextSchema = DEFAULT_CONTEXT_SCHEMA): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const f of schema.requiredFields) {
    if (!(f in user)) issues.push({ field: f, reason: 'required', severity: 'error' })
  }
  for (const [k, t] of Object.entries(schema.types)) {
    if (k in user) {
      const v = user[k]
      const actual = Array.isArray(v) ? 'array' : typeof v
      if (actual !== t) {
        issues.push({ field: k, reason: `expected ${t}, got ${actual}`, severity: 'error' })
      }
    }
  }
  return issues
}

// =============================================================================
// V2439: UserContextMigrator
// =============================================================================

export interface MigrationStep {
  fromVersion: number
  toVersion: number
  migrate: (c: UserContext) => UserContext
}

export const DEFAULT_MIGRATIONS: MigrationStep[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: (c) => ({ ...c, privacyLevel: c.privacyLevel ?? 'private' }),
  },
]

export function migrateContext(c: UserContext & { version?: number }, steps: MigrationStep[] = DEFAULT_MIGRATIONS): UserContext {
  let current = c
  let v = (c.version ?? 1)
  for (const step of steps) {
    if (step.fromVersion === v) {
      current = { ...step.migrate(current), version: step.toVersion }
      v = step.toVersion
    }
  }
  return current
}

// =============================================================================
// V2440: UserContextExporter
// =============================================================================

export function exportUserContext(user: UserContext): string {
  return JSON.stringify(user, null, 2)
}

export function importUserContext(json: string): UserContext {
  const obj = JSON.parse(json)
  return validateAgainstSchema(obj).length === 0 ? obj : adaptExternalUser(obj)
}
