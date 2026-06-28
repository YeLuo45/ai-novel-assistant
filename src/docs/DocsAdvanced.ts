/**
 * docs/DocsAdvanced.ts (V11-V25) - 15 engines
 *
 * - V11 StorybookConfig
 * - V12 ComponentCatalog
 * - V13 PropTable
 * - V14 StoryControls
 * - V15 DocExtractor
 * - V16 RecipeSystem
 * - V17 TemplateEngine
 * - V18 SnippetCollector
 * - V19 ExampleBuilder
 * - V20 Cookbook
 * - V21 SpecValidator
 * - V22 ContractTest
 * - V23 APIVersioning
 * - V24 CompatChecker
 * - V25 DeprecationTracker
 */

// =============================================================================
// V11: StorybookConfig
// =============================================================================

export interface StoryConfig {
  storyId: string
  title: string
  component: string
  args?: Record<string, unknown>
}

export class StorybookConfig {
  private _stories: StoryConfig[] = []

  addStory(story: StoryConfig): void { this._stories.push(story) }

  generateIndex(): string {
    return [
      '{',
      '  "stories": [',
      ...this._stories.map(s => `    { "id": "${s.storyId}", "title": "${s.title}", "component": "${s.component}" }`),
      '  ]',
      '}',
    ].join('\n')
  }

  count(): number { return this._stories.length }
}

// =============================================================================
// V12: ComponentCatalog
// =============================================================================

export interface CatalogEntry {
  name: string
  category: string
  description: string
  tags: string[]
}

export class ComponentCatalog {
  private _entries: Map<string, CatalogEntry> = new Map()

  register(entry: CatalogEntry): void { this._entries.set(entry.name, entry) }

  get(name: string): CatalogEntry | undefined { return this._entries.get(name) }

  byCategory(category: string): CatalogEntry[] {
    return Array.from(this._entries.values()).filter(e => e.category === category)
  }

  search(query: string): CatalogEntry[] {
    const q = query.toLowerCase()
    return Array.from(this._entries.values()).filter(e =>
      e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
    )
  }

  categories(): string[] {
    return Array.from(new Set(Array.from(this._entries.values()).map(e => e.category)))
  }
}

// =============================================================================
// V13: PropTable
// =============================================================================

export interface PropDef {
  name: string
  type: string
  required: boolean
  defaultValue?: unknown
  description?: string
}

export class PropTable {
  generate(props: PropDef[]): string {
    const lines: string[] = ['| Prop | Type | Required | Default | Description |', '|------|------|----------|---------|-------------|']
    for (const p of props) {
      const def = p.defaultValue !== undefined ? String(p.defaultValue) : '-'
      lines.push(`| ${p.name} | \`${p.type}\` | ${p.required ? '✓' : ''} | ${def} | ${p.description ?? ''} |`)
    }
    return lines.join('\n')
  }
}

// =============================================================================
// V14: StoryControls
// =============================================================================

export type ControlType = 'text' | 'number' | 'boolean' | 'select' | 'color' | 'date'

export interface Control {
  name: string
  type: ControlType
  defaultValue: unknown
  options?: string[]  // for select
  min?: number
  max?: number
}

export class StoryControls {
  private _controls: Control[] = []

  add(control: Control): void { this._controls.push(control) }

  generateArgs(): Record<string, unknown> {
    const args: Record<string, unknown> = {}
    for (const c of this._controls) args[c.name] = c.defaultValue
    return args
  }

  toJSON(): string {
    return JSON.stringify(this._controls, null, 2)
  }
}

// =============================================================================
// V15: DocExtractor
// =============================================================================

export class DocExtractor {
  /** 从 source code 提取 JSDoc */
  fromCode(code: string): Array<{ name: string; description: string; signature?: string }> {
    const results: Array<{ name: string; description: string; signature?: string }> = []
    // 匹配 /** ... */ @something 或 JSDoc + function/class
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/g
    let match
    while ((match = jsdocRegex.exec(code)) !== null) {
      results.push({
        name: match[2]!,
        description: match[1]!.trim().split('\n')[0] ?? '',
        signature: `function ${match[2]}`,
      })
    }
    return results
  }

  /** 提取 TODO/FIXME */
  fromComments(code: string): Array<{ type: 'TODO' | 'FIXME' | 'XXX'; line: number; text: string }> {
    const results: Array<{ type: 'TODO' | 'FIXME' | 'XXX'; line: number; text: string }> = []
    const lines = code.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i]!.match(/\/\/\s*(TODO|FIXME|XXX):?\s*(.*)/)
      if (m) results.push({ type: m[1] as any, line: i + 1, text: m[2] ?? '' })
    }
    return results
  }
}

// =============================================================================
// V16: RecipeSystem
// =============================================================================

export interface Recipe {
  recipeId: string
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

export class RecipeSystem {
  private _recipes: Map<string, Recipe> = new Map()

  add(recipe: Recipe): void { this._recipes.set(recipe.recipeId, recipe) }

  get(id: string): Recipe | undefined { return this._recipes.get(id) }
  byDifficulty(d: Recipe['difficulty']): Recipe[] {
    return Array.from(this._recipes.values()).filter(r => r.difficulty === d)
  }
  all(): Recipe[] { return Array.from(this._recipes.values()) }
}

// =============================================================================
// V17: TemplateEngine
// =============================================================================

export class TemplateEngine {
  /** Mustache-like 模板：{{var}} */
  render(template: string, vars: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const v = vars[key]
      return v !== undefined ? String(v) : `{{${key}}}`
    })
  }

  /** 条件块：{{#if cond}}...{{/if}} */
  renderConditional(template: string, vars: Record<string, unknown>): string {
    return template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, body) => {
      return vars[key] ? body : ''
    })
  }

  /** 循环：{{#each items}}...{{/each}} */
  renderEach(template: string, itemsKey: string, items: unknown[], itemVars: (item: unknown, idx: number) => Record<string, unknown>): string {
    return template.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, body) => {
      if (key !== itemsKey) return ''
      return items.map((item, i) => this.render(body, itemVars(item, i))).join('')
    })
  }
}

// =============================================================================
// V18: SnippetCollector
// =============================================================================

export interface CodeSnippet {
  snippetId: string
  title: string
  language: string
  code: string
  tags: string[]
}

export class SnippetCollector {
  private _snippets: Map<string, CodeSnippet> = new Map()

  add(snippet: CodeSnippet): void { this._snippets.set(snippet.snippetId, snippet) }

  get(id: string): CodeSnippet | undefined { return this._snippets.get(id) }
  byTag(tag: string): CodeSnippet[] {
    return Array.from(this._snippets.values()).filter(s => s.tags.includes(tag))
  }
  search(query: string): CodeSnippet[] {
    const q = query.toLowerCase()
    return Array.from(this._snippets.values()).filter(s =>
      s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    )
  }
  count(): number { return this._snippets.size }
}

// =============================================================================
// V19: ExampleBuilder
// =============================================================================

export class ExampleBuilder {
  private _examples: Map<string, { name: string; steps: string[]; expected: string }> = new Map()

  add(id: string, name: string, steps: string[], expected: string): void {
    this._examples.set(id, { name, steps, expected })
  }

  /** 构建最小可运行示例 */
  build(id: string): string | null {
    const ex = this._examples.get(id)
    if (!ex) return null
    return [
      `# Example: ${ex.name}`,
      '',
      '## Steps',
      ...ex.steps.map((s, i) => `${i + 1}. ${s}`),
      '',
      '## Expected Output',
      '```',
      ex.expected,
      '```',
    ].join('\n')
  }
}

// =============================================================================
// V20: Cookbook
// =============================================================================

export interface CookbookSection {
  sectionId: string
  title: string
  recipes: string[]  // recipe ids
}

export class Cookbook {
  private _sections: Map<string, CookbookSection> = new Map()
  private _recipes: Map<string, Recipe> = new Map()

  addRecipe(recipe: Recipe): void { this._recipes.set(recipe.recipeId, recipe) }
  addSection(section: CookbookSection): void { this._sections.set(section.sectionId, section) }

  toMarkdown(): string {
    const lines: string[] = ['# Cookbook', '']
    for (const section of this._sections.values()) {
      lines.push(`## ${section.title}`, '')
      for (const rid of section.recipes) {
        const r = this._recipes.get(rid)
        if (r) {
          lines.push(`### ${r.title}`, '', r.description, '')
          for (let i = 0; i < r.steps.length; i++) lines.push(`${i + 1}. ${r.steps[i]}`)
          lines.push('')
        }
      }
    }
    return lines.join('\n')
  }
}

// =============================================================================
// V21: SpecValidator
// =============================================================================

export interface ApiSpec {
  name: string
  version: string
  endpoints: Array<{ method: string; path: string }>
}

export class SpecValidator {
  validate(spec: ApiSpec): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    if (!spec.name) issues.push('name is required')
    if (!spec.version) issues.push('version is required')
    if (spec.endpoints.length === 0) issues.push('no endpoints defined')
    // 检查重复 endpoint
    const seen = new Set<string>()
    for (const ep of spec.endpoints) {
      const key = `${ep.method} ${ep.path}`
      if (seen.has(key)) issues.push(`duplicate endpoint: ${key}`)
      seen.add(key)
    }
    return { valid: issues.length === 0, issues }
  }
}

// =============================================================================
// V22: ContractTest
// =============================================================================

export interface ContractRule {
  field: string
  rule: 'type' | 'min' | 'max' | 'pattern' | 'enum'
  value?: unknown
}

export class ContractTest {
  private _contracts: Map<string, ContractRule[]> = new Map()

  define(responseId: string, rules: ContractRule[]): void {
    this._contracts.set(responseId, rules)
  }

  verify(responseId: string, data: Record<string, unknown>): { valid: boolean; failures: string[] } {
    const rules = this._contracts.get(responseId) ?? []
    const failures: string[] = []
    for (const rule of rules) {
      const value = data[rule.field]
      if (rule.rule === 'type') {
        const expected = rule.value as string
        if (typeof value !== expected) failures.push(`${rule.field} expected ${expected}, got ${typeof value}`)
      } else if (rule.rule === 'min') {
        if (typeof value === 'number' && value < (rule.value as number)) failures.push(`${rule.field} below min`)
      } else if (rule.rule === 'max') {
        if (typeof value === 'number' && value > (rule.value as number)) failures.push(`${rule.field} above max`)
      } else if (rule.rule === 'pattern' && typeof value === 'string') {
        if (!new RegExp(rule.value as string).test(value)) failures.push(`${rule.field} doesn't match pattern`)
      } else if (rule.rule === 'enum') {
        const allowed = rule.value as unknown[]
        if (!allowed.includes(value)) failures.push(`${rule.field} not in enum`)
      }
    }
    return { valid: failures.length === 0, failures }
  }
}

// =============================================================================
// V23: APIVersioning
// =============================================================================

export interface ApiVersion {
  version: string
  deprecated: boolean
  sunsetAt?: number
}

export class APIVersioning {
  private _versions: Map<string, ApiVersion> = new Map()

  add(version: string): void {
    this._versions.set(version, { version, deprecated: false })
  }

  deprecate(version: string, sunsetAt?: number): boolean {
    const v = this._versions.get(version)
    if (!v) return false
    v.deprecated = true
    if (sunsetAt !== undefined) v.sunsetAt = sunsetAt
    return true
  }

  isDeprecated(version: string): boolean {
    return this._versions.get(version)?.deprecated ?? false
  }

  /** 解析 Accept-Version header 选最新可用版本 */
  resolve(requested: string): string | null {
    if (this._versions.has(requested) && !this.isDeprecated(requested)) return requested
    // 否则选第一个 active 版本
    for (const v of this._versions.values()) {
      if (!v.deprecated) return v.version
    }
    return null
  }

  list(): ApiVersion[] { return Array.from(this._versions.values()) }
}

// =============================================================================
// V24: CompatChecker
// =============================================================================

export interface CompatRule {
  from: string
  to: string
  breakingChanges: string[]
}

export class CompatChecker {
  private _rules: CompatRule[] = []

  addRule(rule: CompatRule): void { this._rules.push(rule) }

  /** 检查 from → to 是否兼容 */
  check(from: string, to: string): { compatible: boolean; breakingChanges: string[] } {
    const rule = this._rules.find(r => r.from === from && r.to === to)
    if (!rule) return { compatible: true, breakingChanges: [] }
    return { compatible: rule.breakingChanges.length === 0, breakingChanges: rule.breakingChanges }
  }

  /** 检查所有路径 */
  allPaths(): CompatRule[] { return [...this._rules] }
}

// =============================================================================
// V25: DeprecationTracker
// =============================================================================

export interface DeprecatedItem {
  itemId: string
  itemType: 'function' | 'class' | 'api' | 'config' | 'feature'
  deprecatedAt: number
  replacementId?: string
  reason: string
}

export class DeprecationTracker {
  private _items: Map<string, DeprecatedItem> = new Map()

  mark(itemId: string, itemType: DeprecatedItem['itemType'], reason: string, replacementId?: string): void {
    this._items.set(itemId, { itemId, itemType, deprecatedAt: Date.now(), replacementId, reason })
  }

  isDeprecated(itemId: string): boolean { return this._items.has(itemId) }

  get(itemId: string): DeprecatedItem | undefined { return this._items.get(itemId) }

  byType(itemType: DeprecatedItem['itemType']): DeprecatedItem[] {
    return Array.from(this._items.values()).filter(i => i.itemType === itemType)
  }

  all(): DeprecatedItem[] { return Array.from(this._items.values()) }

  /** 生成 deprecation warning */
  warning(itemId: string): string | null {
    const item = this._items.get(itemId)
    if (!item) return null
    let msg = `[DEPRECATED] ${item.itemType} '${itemId}' is deprecated: ${item.reason}`
    if (item.replacementId) msg += ` Use '${item.replacementId}' instead.`
    return msg
  }
}