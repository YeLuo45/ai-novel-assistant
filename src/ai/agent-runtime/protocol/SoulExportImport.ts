/**
 * protocol/SoulExportImport.ts (V2461-V2465) - 5 engines
 *
 * - V2461 SoulExporter: 导出 soul package
 * - V2462 SoulImporter: 导入 soul package
 * - V2463 SoulPackage: 完整包结构
 * - V2464 SoulDiscovery: 自动发现 (文件扫描)
 * - V2465 SoulShareLink: 分享链接（base64 编码）
 */

import type { SoulTemplate } from '../types'

// =============================================================================
// V2463: SoulPackage
// =============================================================================

export interface SoulPackage {
  packageId: string
  template: SoulTemplate
  version: string
  author: string
  createdAt: number
  signature?: string
  dependencies?: string[]
}

// =============================================================================
// V2461: SoulExporter
// =============================================================================

export class SoulExporter {
  /** 导出为 JSON 字符串 */
  exportJson(pkg: SoulPackage): string {
    return JSON.stringify(pkg, null, 2)
  }

  /** 导出为 file-like 格式（紧凑 JSON） */
  exportCompact(pkg: SoulPackage): string {
    return JSON.stringify(pkg)
  }

  /** 批量导出多个 */
  exportBatch(packages: SoulPackage[]): string {
    return JSON.stringify({ packages, exportedAt: Date.now() })
  }
}

// =============================================================================
// V2462: SoulImporter
// =============================================================================

export interface ImportResult {
  ok: boolean
  package?: SoulPackage
  error?: string
}

export class SoulImporter {
  importJson(json: string): ImportResult {
    try {
      const obj = JSON.parse(json)
      if (!obj.packageId || !obj.template) {
        return { ok: false, error: 'invalid package structure' }
      }
      return { ok: true, package: obj as SoulPackage }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  importBatch(json: string): ImportResult[] {
    try {
      const obj = JSON.parse(json)
      if (!Array.isArray(obj.packages)) return [{ ok: false, error: 'no packages array' }]
      return obj.packages.map((p: SoulPackage) => ({ ok: true, package: p }))
    } catch (e) {
      return [{ ok: false, error: e instanceof Error ? e.message : String(e) }]
    }
  }
}

// =============================================================================
// V2465: SoulShareLink
// =============================================================================

export class SoulShareLink {
  /** template → base64 URL */
  encode(template: SoulTemplate): string {
    const json = JSON.stringify(template)
    return 'soul://' + Buffer.from(json).toString('base64')
  }

  /** URL → template */
  decode(link: string): SoulTemplate | null {
    if (!link.startsWith('soul://')) return null
    try {
      const json = Buffer.from(link.slice(7), 'base64').toString('utf-8')
      return JSON.parse(json)
    } catch {
      return null
    }
  }

  /** 短 ID（用于 URL 缩短） */
  shortId(template: SoulTemplate): string {
    const json = JSON.stringify(template)
    let h = 0
    for (let i = 0; i < json.length; i++) {
      h = ((h << 5) - h) + json.charCodeAt(i)
      h = h & h
    }
    return Math.abs(h).toString(36).slice(0, 8)
  }
}

// =============================================================================
// V2464: SoulDiscovery（模拟：从 source 字符串发现 soul）
// =============================================================================

export interface DiscoverySource {
  path: string
  content: string
}

export interface DiscoveredSoul {
  path: string
  templateId: string
  displayName: string
}

export class SoulDiscovery {
  /** 简单实现：扫描含 `templateId:` 的内容行 */
  discover(sources: DiscoverySource[]): DiscoveredSoul[] {
    const results: DiscoveredSoul[] = []
    for (const src of sources) {
      // 简单正则：找 templateId 和 displayName
      const idMatch = src.content.match(/templateId:\s*['"]([^'"]+)['"]/)
      const nameMatch = src.content.match(/displayName:\s*['"]([^'"]+)['"]/)
      if (idMatch) {
        results.push({
          path: src.path,
          templateId: idMatch[1],
          displayName: nameMatch?.[1] ?? idMatch[1],
        })
      }
    }
    return results
  }
}
