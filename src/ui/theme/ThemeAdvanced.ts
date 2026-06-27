/**
 * ui/theme/ThemeAdvanced.ts (M11-M20) - 10 engines
 *
 * - M11 ColorPalette: 颜色调色板
 * - M12 TypographyScale: 字体比例
 * - M13 ThemeTransition: 平滑过渡
 * - M14 AutoThemeDetection: 自动检测
 * - M15 ContrastValidator: 对比度检查
 * - M16 ThemeValidator: 完整性校验
 * - M17 ThemeVersioning: 版本控制
 * - M18 ThemeExportImport: 导出导入
 * - M19 ThemePreview: 预览
 * - M20 ThemeAccessibility: a11y 检查
 */

// =============================================================================
// M11: ColorPalette
// =============================================================================

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string  // base
  600: string
  700: string
  800: string
  900: string
}

export const BLUE_SCALE: ColorScale = {
  50: '#e3f2fd', 100: '#bbdefb', 200: '#90caf9', 300: '#64b5f6', 400: '#42a5f5',
  500: '#2196f3', 600: '#1e88e5', 700: '#1976d2', 800: '#1565c0', 900: '#0d47a1',
}

export class ColorPalette {
  private _scales: Map<string, ColorScale> = new Map()

  addScale(name: string, scale: ColorScale): void {
    this._scales.set(name, scale)
  }

  get(name: string, weight: keyof ColorScale): string | undefined {
    return this._scales.get(name)?.[weight]
  }

  list(): string[] {
    return Array.from(this._scales.keys())
  }
}

// =============================================================================
// M12: TypographyScale
// =============================================================================

export interface TypographyToken {
  name: string
  fontSize: number  // px
  lineHeight: number
  fontWeight: number
  letterSpacing: number
}

export class TypographyScale {
  private _tokens: Map<string, TypographyToken> = new Map()

  define(token: TypographyToken): void {
    this._tokens.set(token.name, token)
  }

  get(name: string): TypographyToken | undefined {
    return this._tokens.get(name)
  }

  /** 计算 modular scale（以 1.25 比例） */
  modularScale(base: number, ratio: number, steps: number): TypographyToken[] {
    const tokens: TypographyToken[] = []
    for (let i = -1; i < steps; i++) {
      const size = base * Math.pow(ratio, i)
      tokens.push({ name: `step-${i + 1}`, fontSize: Math.round(size), lineHeight: 1.5, fontWeight: 400, letterSpacing: 0 })
    }
    return tokens
  }

  list(): TypographyToken[] {
    return Array.from(this._tokens.values())
  }
}

// =============================================================================
// M13: ThemeTransition
// =============================================================================

export interface TransitionConfig {
  durationMs: number
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  properties: string[]  // CSS properties to transition
}

export const DEFAULT_TRANSITION: TransitionConfig = {
  durationMs: 200,
  easing: 'ease-in-out',
  properties: ['background-color', 'color', 'border-color'],
}

export class ThemeTransition {
  private _config: TransitionConfig

  constructor(config: Partial<TransitionConfig> = {}) {
    this._config = { ...DEFAULT_TRANSITION, ...config }
  }

  /** 生成 CSS transition 字符串 */
  toCSS(): string {
    return this._config.properties
      .map(p => `${p} ${this._config.durationMs}ms ${this._config.easing}`)
      .join(', ')
  }

  /** 生成 CSS-in-JS 对象 */
  toObject(): Record<string, string> {
    const obj: Record<string, string> = {}
    for (const p of this._config.properties) {
      obj[p] = `${this._config.durationMs}ms ${this._config.easing}`
    }
    return obj
  }

  config(): TransitionConfig {
    return { ...this._config }
  }

  setDuration(ms: number): void {
    this._config.durationMs = ms
  }
}

// =============================================================================
// M14: AutoThemeDetection
// =============================================================================

export type SystemPreference = 'light' | 'dark' | 'no-preference'

export class AutoThemeDetection {
  private _listeners: Set<(pref: SystemPreference) => void> = new Set()
  private _current: SystemPreference = 'no-preference'

  /** 模拟检测系统偏好（实际需要 window.matchMedia） */
  detect(): SystemPreference {
    // 在 Node/jsdom 中无法访问 matchMedia；返回 stored
    return this._current
  }

  setPreference(pref: SystemPreference): void {
    this._current = pref
    for (const l of this._listeners) {
      try { l(pref) } catch { /* swallow */ }
    }
  }

  subscribe(fn: (pref: SystemPreference) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  current(): SystemPreference {
    return this._current
  }
}

// =============================================================================
// M15: ContrastValidator
// =============================================================================

export interface ContrastResult {
  ratio: number
  AA: boolean
  AAA: boolean
  AALarge: boolean
  AAALarge: boolean
}

export class ContrastValidator {
  /** 将 hex 颜色转 RGB */
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.match(/^#?([0-9a-fA-F]{6})$/)
    if (!m) return null
    const n = parseInt(m[1], 16)
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
  }

  /** 相对亮度 */
  relativeLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return 0
    const transform = (c: number): number => {
      const v = c / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * transform(rgb.r) + 0.7152 * transform(rgb.g) + 0.0722 * transform(rgb.b)
  }

  /** 对比度 */
  contrast(hex1: string, hex2: string): number {
    const l1 = this.relativeLuminance(hex1)
    const l2 = this.relativeLuminance(hex2)
    const [bright, dark] = l1 > l2 ? [l1, l2] : [l2, l1]
    return (bright + 0.05) / (dark + 0.05)
  }

  /** WCAG 检查 */
  check(fg: string, bg: string, large: boolean = false): ContrastResult {
    const ratio = this.contrast(fg, bg)
    return {
      ratio,
      AA: large ? ratio >= 3 : ratio >= 4.5,
      AAA: large ? ratio >= 4.5 : ratio >= 7,
      AALarge: ratio >= 3,
      AAALarge: ratio >= 4.5,
    }
  }
}

// =============================================================================
// M16: ThemeValidator
// =============================================================================

export interface ValidationIssue {
  field: string
  severity: 'error' | 'warning'
  message: string
}

export class ThemeValidator {
  validate(theme: any): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    if (!theme.name) issues.push({ field: 'name', severity: 'error', message: 'name is required' })
    if (!theme.colors) issues.push({ field: 'colors', severity: 'error', message: 'colors missing' })
    if (theme.colors) {
      const required = ['bg', 'text', 'accent', 'border'] as const
      for (const r of required) {
        if (!theme.colors[r]) issues.push({ field: `colors.${r}`, severity: 'error', message: `${r} is required` })
      }
    }
    if (!theme.typography) issues.push({ field: 'typography', severity: 'warning', message: 'typography missing' })
    if (!theme.spacing) issues.push({ field: 'spacing', severity: 'warning', message: 'spacing missing' })
    return issues
  }
}

// =============================================================================
// M17: ThemeVersioning
// =============================================================================

export interface ThemeVersion {
  version: string
  themeName: string
  createdAt: number
  changes: string[]
}

export class ThemeVersioning {
  private _versions: Map<string, ThemeVersion[]> = new Map()

  addVersion(themeName: string, version: string, changes: string[]): ThemeVersion {
    const v: ThemeVersion = { version, themeName, createdAt: Date.now(), changes }
    if (!this._versions.has(themeName)) this._versions.set(themeName, [])
    this._versions.get(themeName)!.push(v)
    return v
  }

  versionsOf(themeName: string): ThemeVersion[] {
    return [...(this._versions.get(themeName) ?? [])]
  }

  latest(themeName: string): ThemeVersion | undefined {
    const all = this.versionsOf(themeName)
    return all[all.length - 1]
  }
}

// =============================================================================
// M18: ThemeExportImport
// =============================================================================

export class ThemeExportImport {
  /** 导出为 JSON */
  export(theme: any, version: string = '1.0.0'): string {
    return JSON.stringify({ version, exportedAt: Date.now(), theme }, null, 2)
  }

  /** 从 JSON 导入 */
  import(json: string): { ok: boolean; theme?: any; error?: string } {
    try {
      const obj = JSON.parse(json)
      if (!obj.theme) return { ok: false, error: 'missing theme' }
      return { ok: true, theme: obj.theme }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  /** 导出为 CSS variables 字符串 */
  toCSS(theme: any, prefix: string = '--'): string {
    const lines: string[] = [':root {']
    if (theme.colors) {
      for (const [k, v] of Object.entries(theme.colors)) {
        lines.push(`  ${prefix}color-${k}: ${v};`)
      }
    }
    if (theme.spacing) {
      for (const [k, v] of Object.entries(theme.spacing)) {
        lines.push(`  ${prefix}spacing-${k}: ${v};`)
      }
    }
    lines.push('}')
    return lines.join('\n')
  }
}

// =============================================================================
// M19: ThemePreview
// =============================================================================

export interface ThemePreviewData {
  background: string
  text: string
  accent: string
  border: string
  buttonBg: string
  buttonText: string
}

export class ThemePreview {
  /** 生成 preview data */
  generate(theme: any): ThemePreviewData {
    return {
      background: theme.colors?.bg ?? '#ffffff',
      text: theme.colors?.text ?? '#000000',
      accent: theme.colors?.accent ?? '#0000ff',
      border: theme.colors?.border ?? '#cccccc',
      buttonBg: theme.colors?.accent ?? '#0000ff',
      buttonText: theme.colors?.accentText ?? '#ffffff',
    }
  }

  /** 渲染 preview HTML（字符串） */
  renderHTML(theme: any, title: string = 'Preview'): string {
    const p = this.generate(theme)
    return `<div style="background:${p.background};color:${p.text};border:1px solid ${p.border};padding:16px">
      <h3 style="color:${p.text}">${title}</h3>
      <p>Sample text content</p>
      <button style="background:${p.buttonBg};color:${p.buttonText};border:none;padding:8px 16px;border-radius:4px">Button</button>
    </div>`
  }
}

// =============================================================================
// M20: ThemeAccessibility
// =============================================================================

export class ThemeAccessibility {
  private _validator = new ContrastValidator()
  private _tValidator = new ThemeValidator()

  audit(theme: any): { issues: ValidationIssue[]; contrastIssues: { pair: string; ratio: number; pass: boolean }[] } {
    const issues = this._tValidator.validate(theme)
    const contrastIssues: { pair: string; ratio: number; pass: boolean }[] = []
    if (theme.colors) {
      const checks = [
        { name: 'text on bg', fg: theme.colors.text, bg: theme.colors.bg },
        { name: 'accent on bg', fg: theme.colors.accent, bg: theme.colors.bg },
        { name: 'textSecondary on bg', fg: theme.colors.textSecondary, bg: theme.colors.bg },
      ]
      for (const c of checks) {
        if (c.fg && c.bg) {
          const ratio = this._validator.contrast(c.fg, c.bg)
          contrastIssues.push({ pair: c.name, ratio, pass: ratio >= 4.5 })
        }
      }
    }
    return { issues, contrastIssues }
  }

  hasCriticalIssues(audit: { issues: ValidationIssue[]; contrastIssues: { pass: boolean }[] }): boolean {
    return audit.issues.some(i => i.severity === 'error') ||
      audit.contrastIssues.some(c => !c.pass)
  }
}