/**
 * protocol/SoulMarketplace.ts (V2446-V2455) - 10 engines
 *
 * - V2446 SoulTemplateRegistry: 模板注册表
 * - V2447 SoulComposer: 模板组合（继承 + 覆盖）
 * - V2448 SoulMarketplace: 本地市场
 * - V2449 SoulInstaller: 安装/卸载
 * - V2450 SoulActivation: 激活/停用
 * - V2451 SoulRating: 评分
 * - V2452 SoulReview: 评价
 * - V2453 SoulAuthor: 作者信息
 * - V2454 SoulListing: 列表项
 * - V2455 SoulSearch: 搜索/过滤
 */

import type { SoulTemplate } from '../types'

// =============================================================================
// V2453: SoulAuthor
// =============================================================================

export interface SoulAuthor {
  authorId: string
  displayName: string
  bio?: string
  url?: string
}

// =============================================================================
// V2454: SoulListing
// =============================================================================

export interface SoulListing {
  template: SoulTemplate
  author: SoulAuthor
  downloads: number
  rating: number  // 0-5
  createdAt: number
  updatedAt: number
  tags: string[]
  description: string
  featured: boolean
}

// =============================================================================
// V2451: SoulRating
// =============================================================================

export interface SoulRating {
  templateId: string
  raterId: string
  stars: number  // 0-5
  comment?: string
  ratedAt: number
}

export class SoulRating {
  private _ratings: Map<string, SoulRating[]> = new Map()

  add(r: SoulRating): void {
    if (!this._ratings.has(r.templateId)) this._ratings.set(r.templateId, [])
    this._ratings.get(r.templateId)!.push(r)
  }

  forTemplate(templateId: string): SoulRating[] {
    return [...(this._ratings.get(templateId) ?? [])]
  }

  averageStars(templateId: string): number {
    const rs = this.forTemplate(templateId)
    if (rs.length === 0) return 0
    return rs.reduce((acc, r) => acc + r.stars, 0) / rs.length
  }

  count(templateId: string): number {
    return this.forTemplate(templateId).length
  }

  all(): SoulRating[] {
    return Array.from(this._ratings.values()).flat()
  }
}

// =============================================================================
// V2446: SoulTemplateRegistry
// =============================================================================

export class SoulTemplateRegistry {
  private _templates: Map<string, SoulTemplate> = new Map()

  register(template: SoulTemplate): void {
    this._templates.set(template.templateId, template)
  }

  get(id: string): SoulTemplate | undefined {
    return this._templates.get(id)
  }

  all(): SoulTemplate[] {
    return Array.from(this._templates.values())
  }

  has(id: string): boolean {
    return this._templates.has(id)
  }

  unregister(id: string): boolean {
    return this._templates.delete(id)
  }

  count(): number {
    return this._templates.size
  }
}

// =============================================================================
// V2447: SoulComposer
// =============================================================================

/** 模板组合：parent + override 字段 */
export function composeSoul(parent: SoulTemplate, overrides: Partial<SoulTemplate>): SoulTemplate {
  return {
    ...parent,
    ...overrides,
    templateId: overrides.templateId ?? `${parent.templateId}_derived`,
    basePersona: {
      ...parent.basePersona,
      ...(overrides.basePersona ?? {}),
    },
    baseCapabilities: overrides.baseCapabilities ?? parent.baseCapabilities,
    defaultMemoryScopes: overrides.defaultMemoryScopes ?? parent.defaultMemoryScopes,
  }
}

/** 多个模板 capability union + persona 取最新 */
export function mergeSouls(...templates: SoulTemplate[]): SoulTemplate {
  if (templates.length === 0) throw new Error('mergeSouls: requires at least one template')
  const latest = templates[templates.length - 1]
  const allCapabilities = Array.from(new Set(templates.flatMap(t => t.baseCapabilities)))
  const allPrinciples = Array.from(new Set(templates.flatMap(t => t.basePersona.principles)))
  return composeSoul(latest, {
    templateId: `merged_${templates.map(t => t.templateId).join('_')}`,
    baseCapabilities: allCapabilities,
    basePersona: {
      ...latest.basePersona,
      principles: allPrinciples,
    },
  })
}

// =============================================================================
// V2448: SoulMarketplace
// =============================================================================

export class SoulMarketplace {
  private _listings: Map<string, SoulListing> = new Map()
  private _registry: SoulTemplateRegistry
  private _rating: SoulRating
  private _installed: Set<string> = new Set()
  private _active: Set<string> = new Set()

  constructor(registry: SoulTemplateRegistry) {
    this._registry = registry
    this._rating = new SoulRating()
  }

  /** 发布（来自 registry） */
  publish(template: SoulTemplate, author: SoulAuthor, options?: { description?: string; tags?: string[]; featured?: boolean }): SoulListing {
    const now = Date.now()
    const listing: SoulListing = {
      template,
      author,
      downloads: 0,
      rating: 0,
      createdAt: now,
      updatedAt: now,
      tags: options?.tags ?? [],
      description: options?.description ?? template.description,
      featured: options?.featured ?? false,
    }
    this._listings.set(template.templateId, listing)
    this._registry.register(template)
    return listing
  }

  get(id: string): SoulListing | undefined {
    return this._listings.get(id)
  }

  list(): SoulListing[] {
    return Array.from(this._listings.values())
  }

  search(query: string): SoulListing[] {
    const q = query.toLowerCase()
    return this.list().filter(l =>
      l.template.displayName.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.tags.some(t => t.toLowerCase().includes(q))
    )
  }

  /** V2449 install */
  install(templateId: string): boolean {
    if (!this._listings.has(templateId)) return false
    this._installed.add(templateId)
    const l = this._listings.get(templateId)!
    l.downloads += 1
    return true
  }

  uninstall(templateId: string): boolean {
    return this._installed.delete(templateId)
  }

  isInstalled(templateId: string): boolean {
    return this._installed.has(templateId)
  }

  installed(): SoulListing[] {
    return this.list().filter(l => this._installed.has(l.template.templateId))
  }

  /** V2450 activation */
  activate(templateId: string): boolean {
    if (!this._installed.has(templateId)) return false
    this._active.add(templateId)
    return true
  }

  deactivate(templateId: string): boolean {
    return this._active.delete(templateId)
  }

  isActive(templateId: string): boolean {
    return this._active.has(templateId)
  }

  active(): SoulListing[] {
    return this.list().filter(l => this._active.has(l.template.templateId))
  }

  /** V2451 rate */
  rate(templateId: string, raterId: string, stars: number, comment?: string): boolean {
    if (stars < 0 || stars > 5) return false
    if (!this._listings.has(templateId)) return false
    this._rating.add({ templateId, raterId, stars, comment, ratedAt: Date.now() })
    const l = this._listings.get(templateId)!
    l.rating = this._rating.averageStars(templateId)
    return true
  }

  ratingsFor(templateId: string): SoulRating[] {
    return this._rating.forTemplate(templateId)
  }

  ratingFor(templateId: string): number {
    return this._rating.averageStars(templateId)
  }

  registry(): SoulTemplateRegistry {
    return this._registry
  }
}
