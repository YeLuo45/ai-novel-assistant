/**
 * protocol/SoulStudio.ts (V2466-V2470) - 5 engines
 *
 * - V2466 SoulStudioConfig: UI 配置
 * - V2467 SoulStudioSection: 分区（preview/metadata/principles/capabilities）
 * - V2468 SoulStudioPreview: 预览生成
 * - V2469 SoulStudioValidator: UI-side 验证
 * - V2470 SoulStudioExport: UI-side 导出
 */

import type { SoulTemplate } from '../types'

// =============================================================================
// V2466: SoulStudioConfig
// =============================================================================

export interface SoulStudioConfig {
  showPreview: boolean
  showMetadata: boolean
  showPrinciples: boolean
  showCapabilities: boolean
  showCompatCheck: boolean
  enableSharing: boolean
  theme: 'light' | 'dark'
  autoSaveIntervalMs: number
}

export const DEFAULT_SOUL_STUDIO_CONFIG: SoulStudioConfig = {
  showPreview: true,
  showMetadata: true,
  showPrinciples: true,
  showCapabilities: true,
  showCompatCheck: true,
  enableSharing: true,
  theme: 'light',
  autoSaveIntervalMs: 30_000,
}

// =============================================================================
// V2467: SoulStudioSection
// =============================================================================

export type SoulStudioSectionName = 'preview' | 'metadata' | 'principles' | 'capabilities' | 'compat' | 'sharing'

export interface SoulStudioSection {
  name: SoulStudioSectionName
  enabled: boolean
  order: number
  title: string
}

export function buildSections(config: SoulStudioConfig = DEFAULT_SOUL_STUDIO_CONFIG): SoulStudioSection[] {
  return [
    { name: 'preview', enabled: config.showPreview, order: 0, title: '预览' },
    { name: 'metadata', enabled: config.showMetadata, order: 1, title: '元数据' },
    { name: 'principles', enabled: config.showPrinciples, order: 2, title: '原则' },
    { name: 'capabilities', enabled: config.showCapabilities, order: 3, title: '能力' },
    { name: 'compat', enabled: config.showCompatCheck, order: 4, title: '兼容性' },
    { name: 'sharing', enabled: config.enableSharing, order: 5, title: '分享' },
  ]
}

// =============================================================================
// V2468: SoulStudioPreview
// =============================================================================

export interface SoulPreview {
  displayName: string
  tagline: string
  archetype: string
  capabilities: string[]
  principles: string[]
  toneSnapshot: Record<string, number>
  decisionSnapshot: Record<string, number>
}

export function buildPreview(template: SoulTemplate): SoulPreview {
  return {
    displayName: template.displayName,
    tagline: template.description,
    archetype: template.archetype,
    capabilities: template.baseCapabilities,
    principles: template.basePersona.principles,
    toneSnapshot: { ...template.basePersona.tone },
    decisionSnapshot: { ...template.basePersona.decisionPolicy },
  }
}

// =============================================================================
// V2469: SoulStudioValidator
// =============================================================================

export interface StudioValidationIssue {
  section: SoulStudioSectionName
  field: string
  message: string
  severity: 'error' | 'warning'
}

export function validateForStudio(template: SoulTemplate): StudioValidationIssue[] {
  const issues: StudioValidationIssue[] = []
  if (!template.displayName || template.displayName.length < 2) {
    issues.push({ section: 'metadata', field: 'displayName', message: 'display name too short', severity: 'error' })
  }
  if (!template.description || template.description.length < 5) {
    issues.push({ section: 'metadata', field: 'description', message: 'description too short', severity: 'warning' })
  }
  if (template.baseCapabilities.length === 0) {
    issues.push({ section: 'capabilities', field: 'baseCapabilities', message: 'no capabilities', severity: 'error' })
  }
  if (template.basePersona.principles.length === 0) {
    issues.push({ section: 'principles', field: 'principles', message: 'no principles', severity: 'warning' })
  }
  return issues
}

// =============================================================================
// V2470: SoulStudioExport
// =============================================================================

export function exportStudioConfig(config: SoulStudioConfig): string {
  return JSON.stringify(config, null, 2)
}

export function importStudioConfig(json: string): SoulStudioConfig {
  const obj = JSON.parse(json)
  return { ...DEFAULT_SOUL_STUDIO_CONFIG, ...obj }
}
