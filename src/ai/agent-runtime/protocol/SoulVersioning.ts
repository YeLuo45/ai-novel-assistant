/**
 * protocol/SoulVersioning.ts (V2456-V2460) - 5 engines
 *
 * - V2456 SoulVersion: 版本号
 * - V2457 SoulMigration: 版本迁移
 * - V2458 SoulChangelog: 变更日志
 * - V2459 SoulDeprecation: 弃用管理
 * - V2460 SoulCompatibility: 兼容性检查
 */

import type { SoulTemplate } from '../types'

// =============================================================================
// V2456: SoulVersion (semver-like)
// =============================================================================

export interface SoulVersion {
  major: number
  minor: number
  patch: number
  preRelease?: string
}

export function parseSoulVersion(s: string): SoulVersion {
  const m = s.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/)
  if (!m) throw new Error(`invalid version string: ${s}`)
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: parseInt(m[3], 10),
    preRelease: m[4],
  }
}

export function formatSoulVersion(v: SoulVersion): string {
  const base = `${v.major}.${v.minor}.${v.patch}`
  return v.preRelease ? `${base}-${v.preRelease}` : base
}

export function compareVersions(a: SoulVersion, b: SoulVersion): number {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  return 0
}

// =============================================================================
// V2458: SoulChangelog
// =============================================================================

export interface ChangelogEntry {
  version: string
  date: number
  changes: string[]
  author?: string
}

export class SoulChangelog {
  private _entries: ChangelogEntry[] = []

  add(entry: ChangelogEntry): void {
    this._entries.push(entry)
    this._entries.sort((a, b) => b.date - a.date) // newest first
  }

  latest(): ChangelogEntry | undefined {
    return this._entries[0]
  }

  all(): ChangelogEntry[] {
    return [...this._entries]
  }

  forVersion(version: string): ChangelogEntry | undefined {
    return this._entries.find(e => e.version === version)
  }
}

// =============================================================================
// V2459: SoulDeprecation
// =============================================================================

export interface DeprecationNotice {
  templateId: string
  deprecatedAt: number
  sunsetAt?: number
  reason: string
  replacementId?: string
}

export class SoulDeprecationRegistry {
  private _notices: Map<string, DeprecationNotice> = new Map()

  deprecate(templateId: string, reason: string, options?: { sunsetAt?: number; replacementId?: string }): void {
    this._notices.set(templateId, {
      templateId,
      deprecatedAt: Date.now(),
      sunsetAt: options?.sunsetAt,
      reason,
      replacementId: options?.replacementId,
    })
  }

  isDeprecated(templateId: string): boolean {
    return this._notices.has(templateId)
  }

  noticeFor(templateId: string): DeprecationNotice | undefined {
    return this._notices.get(templateId)
  }

  active(): DeprecationNotice[] {
    const now = Date.now()
    return Array.from(this._notices.values()).filter(n => !n.sunsetAt || n.sunsetAt > now)
  }

  all(): DeprecationNotice[] {
    return Array.from(this._notices.values())
  }
}

// =============================================================================
// V2457: SoulMigration
// =============================================================================

export interface SoulMigration {
  fromVersion: string
  toVersion: string
  description: string
  migrate: (template: SoulTemplate) => SoulTemplate
}

export class SoulMigrator {
  private _migrations: SoulMigration[] = []

  add(m: SoulMigration): void {
    this._migrations.push(m)
  }

  migrate(template: SoulTemplate, targetVersion: string): SoulTemplate {
    let current = template
    let currentVersion = '1.0.0'
    while (currentVersion !== targetVersion) {
      const step = this._migrations.find(m =>
        m.fromVersion === currentVersion && m.toVersion !== currentVersion
      )
      if (!step) break
      current = step.migrate(current)
      currentVersion = step.toVersion
    }
    return current
  }

  availableMigrations(): SoulMigration[] {
    return [...this._migrations]
  }
}

// =============================================================================
// V2460: SoulCompatibility
// =============================================================================

export interface CompatibilityResult {
  compatible: boolean
  issues: string[]
}

export function checkCompatibility(
  template: SoulTemplate,
  requiredCapabilities: string[],
  requiredArchetypes?: string[],
): CompatibilityResult {
  const issues: string[] = []
  for (const cap of requiredCapabilities) {
    if (!template.baseCapabilities.includes(cap as never)) {
      issues.push(`missing capability: ${cap}`)
    }
  }
  if (requiredArchetypes && !requiredArchetypes.includes(template.archetype)) {
    issues.push(`archetype mismatch: expected ${requiredArchetypes.join('|')}, got ${template.archetype}`)
  }
  return { compatible: issues.length === 0, issues }
}
