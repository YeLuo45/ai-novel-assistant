/**
 * ui/a11y/A11yAdvanced.ts (R16-R25) - 10 engines
 *
 * - R16 HighContrastCheck
 * - R17 ColorBlindSimulation
 * - R18 FontSizeAdjuster
 * - R19 TextSpacingAdjuster
 * - R20 ReadingOrderValidator
 * - R21 ARIAValidator
 * - R22 AutoAltText
 * - R23 CaptionGenerator
 * - R24 SignLanguagePlaceholder
 * - R25 AccessibilityAudit
 */

import { ContrastValidator } from '../theme/ThemeAdvanced'
import { ColorBlindSupport } from '../theme/ThemeSpecialized'

// =============================================================================
// R16: HighContrastCheck
// =============================================================================

export class HighContrastCheck {
  private _cv = new ContrastValidator()

  /** 检查 colors 是否符合 high contrast (WCAG AAA) */
  checkPair(fg: string, bg: string): { pass: boolean; ratio: number } {
    const r = this._cv.contrast(fg, bg)
    return { pass: r >= 7, ratio: r }
  }

  /** 检查 theme 内所有 text/bg pairs */
  checkTheme(colors: Record<string, string>): Array<{ pair: string; ratio: number; pass: boolean }> {
    const pairs = [
      { name: 'text/bg', fg: colors.text, bg: colors.bg },
      { name: 'textSecondary/bg', fg: colors.textSecondary, bg: colors.bg },
      { name: 'textTertiary/bg', fg: colors.textTertiary, bg: colors.bg },
    ]
    return pairs
      .filter(p => p.fg && p.bg)
      .map(p => ({ pair: p.name, ...this.checkPair(p.fg!, p.bg!) }))
  }

  /** 是否所有 pairs 通过 AAA */
  allPass(pairs: Array<{ pass: boolean }>): boolean {
    return pairs.every(p => p.pass)
  }
}

// =============================================================================
// R17: ColorBlindSimulation
// =============================================================================

export class ColorBlindSimulator {
  private _cb = new ColorBlindSupport()

  /** 模拟色盲效果（返回 theme 副本） */
  simulate(colors: Record<string, string>, mode: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(colors)) {
      result[key] = this._cb.apply(value, mode)
    }
    return result
  }
}

// =============================================================================
// R18: FontSizeAdjuster
// =============================================================================

export class FontSizeAdjuster {
  private _scale: number = 1.0
  private _minScale: number = 0.8
  private _maxScale: number = 2.0

  setScale(scale: number): void {
    this._scale = Math.max(this._minScale, Math.min(this._maxScale, scale))
  }

  scale(): number { return this._scale }

  /** 调整 base font size (px) */
  adjust(basePx: number): number {
    return Math.round(basePx * this._scale)
  }

  /** 输出 CSS variable */
  toCSS(): string { return `--font-scale: ${this._scale}` }
}

// =============================================================================
// R19: TextSpacingAdjuster
// =============================================================================

export class TextSpacingAdjuster {
  private _lineHeightScale: number = 1.0
  private _letterSpacingScale: number = 1.0
  private _wordSpacingScale: number = 1.0
  private _paragraphSpacingScale: number = 1.0

  setLineHeight(scale: number): void { this._lineHeightScale = scale }
  setLetterSpacing(scale: number): void { this._letterSpacingScale = scale }
  setWordSpacing(scale: number): void { this._wordSpacingScale = scale }
  setParagraphSpacing(scale: number): void { this._paragraphSpacingScale = scale }

  /** 输出 CSS 规则 */
  toCSS(): string {
    return [
      `line-height: ${this._lineHeightScale};`,
      `letter-spacing: ${this._letterSpacingScale * 0.05}em;`,
      `word-spacing: ${this._wordSpacingScale * 0.16}em;`,
      `margin-bottom: ${this._paragraphSpacingScale * 1.5}em;`,
    ].join(' ')
  }
}

// =============================================================================
// R20: ReadingOrderValidator
// =============================================================================

export interface ReadingOrderNode {
  id: string
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'figure' | 'nav'
  level?: number  // for headings
  order: number
}

export class ReadingOrderValidator {
  validate(nodes: ReadingOrderNode[]): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    // Check 1: 排序连续
    const orders = nodes.map(n => n.order).sort((a, b) => a - b)
    for (let i = 0; i < orders.length - 1; i++) {
      if (orders[i + 1]! - orders[i]! !== 1) {
        issues.push(`Non-consecutive order at ${i}`)
        break
      }
    }
    // Check 2: heading 层级递减（h1 → h2 不能跳到 h4）
    let lastLevel = 0
    for (const n of nodes.filter(n => n.type === 'heading').sort((a, b) => a.order - b.order)) {
      if (n.level !== undefined && n.level > lastLevel + 1) {
        issues.push(`Heading level skip at ${n.id} (h${lastLevel} → h${n.level})`)
      }
      lastLevel = n.level ?? lastLevel
    }
    // Check 3: nav 应在 main 之前
    const navIdx = nodes.find(n => n.type === 'nav')?.order ?? -1
    const mainIdx = nodes.find(n => n.type === 'paragraph')?.order ?? -1
    if (navIdx > mainIdx && mainIdx > 0) issues.push('Nav after main content')
    return { valid: issues.length === 0, issues }
  }
}

// =============================================================================
// R21: ARIAValidator
// =============================================================================

export class ARIAValidator {
  /** 验证 element 的 ARIA 属性是否符合规范 */
  validate(role: string, attrs: Record<string, unknown>): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    // 简化规则
    if (role === 'button') {
      if (attrs.label === undefined && attrs.labelledBy === undefined) {
        issues.push('button needs accessible name (label or labelledBy)')
      }
    }
    if (role === 'img') {
      if (attrs.label === undefined && attrs.labelledBy === undefined) {
        issues.push('img needs alt text')
      }
    }
    if (role === 'slider' || role === 'progressbar') {
      if (attrs.valueNow === undefined) issues.push(`${role} needs valueNow`)
      if (attrs.valueMin === undefined) issues.push(`${role} needs valueMin`)
      if (attrs.valueMax === undefined) issues.push(`${role} needs valueMax`)
    }
    return { valid: issues.length === 0, issues }
  }
}

// =============================================================================
// R22: AutoAltText
// =============================================================================

export class AutoAltText {
  /** 简化：根据 filename/context 生成 alt text */
  generate(context: { filename?: string; description?: string; type?: string }): string {
    if (context.description) return context.description
    if (context.filename) {
      // strip extension + dashes
      return context.filename
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
    }
    if (context.type) return `${context.type} image`
    return 'Image'
  }

  /** 检测 alt text 是否有效（非空、非占位符） */
  isValidAlt(alt: string): boolean {
    if (!alt) return false
    const placeholders = ['image', 'img', 'untitled', 'photo', 'picture', 'tba', 'todo']
    return !placeholders.includes(alt.toLowerCase().trim())
  }
}

// =============================================================================
// R23: CaptionGenerator
// =============================================================================

export class CaptionGenerator {
  /** 从音频 metadata 生成 caption */
  generate(transcript: string, maxCharsPerLine: number = 80): string[] {
    const words = transcript.split(/\s+/)
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      if ((current + ' ' + word).length > maxCharsPerLine) {
        if (current) lines.push(current.trim())
        current = word
      } else {
        current += ' ' + word
      }
    }
    if (current) lines.push(current.trim())
    return lines
  }
}

// =============================================================================
// R24: SignLanguagePlaceholder
// =============================================================================

export class SignLanguagePlaceholder {
  private _supported: boolean = false

  isSupported(): boolean { return this._supported }
  setSupported(supported: boolean): void { this._supported = supported }

  /** 占位符：在 UI 中显示 sign language avatar 的位置 */
  placeholderFor(elementId: string): { elementId: string; type: 'sign-avatar'; position: 'top' | 'bottom' | 'overlay' } {
    return { elementId, type: 'sign-avatar', position: 'overlay' }
  }
}

// =============================================================================
// R25: AccessibilityAudit
// =============================================================================

export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor'

export interface A11yIssue {
  rule: string
  severity: IssueSeverity
  message: string
  elements?: string[]
}

export class AccessibilityAudit {
  /** 完整 audit */
  audit(report: {
    contrastIssues?: Array<{ pair: string; ratio: number; pass: boolean }>
    ariaIssues?: Array<{ element: string; issues: string[] }>
    semanticIssues?: string[]
    keyboardIssues?: string[]
  }): { issues: A11yIssue[]; score: number } {
    const issues: A11yIssue[] = []

    for (const c of report.contrastIssues ?? []) {
      if (!c.pass) {
        issues.push({ rule: 'WCAG-1.4.3', severity: 'serious', message: `Low contrast on ${c.pair}: ${c.ratio.toFixed(2)}` })
      }
    }

    for (const a of report.ariaIssues ?? []) {
      if (a.issues.length > 0) {
        issues.push({ rule: 'ARIA-01', severity: 'serious', message: `ARIA issues on ${a.element}: ${a.issues.join(', ')}`, elements: [a.element] })
      }
    }

    for (const s of report.semanticIssues ?? []) {
      issues.push({ rule: 'SEM-01', severity: 'moderate', message: s })
    }

    for (const k of report.keyboardIssues ?? []) {
      issues.push({ rule: 'KB-01', severity: 'critical', message: k })
    }

    // 评分：扣分制
    const deduction: Record<IssueSeverity, number> = {
      critical: 30,
      serious: 15,
      moderate: 5,
      minor: 1,
    }
    const totalDeduction = issues.reduce((sum, i) => sum + deduction[i.severity], 0)
    const score = Math.max(0, 100 - totalDeduction)

    return { issues, score }
  }
}