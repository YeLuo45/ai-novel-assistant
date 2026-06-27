/**
 * ui/theme/ThemeSpecialized.ts (M21-M25) - 5 engines
 *
 * - M21 HighContrastMode: 高对比度模式（a11y）
 * - M22 ColorBlindSupport: 色盲支持
 * - M23 DarkModeOptimizer: dark mode 优化
 * - M24 SepiaModeOptimizer: sepia 优化
 * - M25 NordModeOptimizer: nord 优化
 */

import type { Theme } from './types'
import { LIGHT_THEME, DARK_THEME, SEPIA_THEME, NORD_THEME } from './DesignToken'

// =============================================================================
// M21: HighContrastMode
// =============================================================================

export const HIGH_CONTRAST_LIGHT: Theme = {
  ...LIGHT_THEME,
  name: 'hc-light',
  displayName: 'High Contrast Light',
  colors: {
    ...LIGHT_THEME.colors,
    bg: '#ffffff',
    bgSecondary: '#f0f0f0',
    text: '#000000',
    textSecondary: '#1a1a1a',
    border: '#000000',
    accent: '#0000ee',
    accentText: '#ffffff',
  },
}

export const HIGH_CONTRAST_DARK: Theme = {
  ...DARK_THEME,
  name: 'hc-dark',
  displayName: 'High Contrast Dark',
  colors: {
    ...DARK_THEME.colors,
    bg: '#000000',
    bgSecondary: '#0a0a0a',
    text: '#ffffff',
    textSecondary: '#e6e6e6',
    border: '#ffffff',
    accent: '#ffff00',
    accentText: '#000000',
  },
}

export class HighContrastMode {
  /** 从基础主题生成 high-contrast 版本 */
  static fromTheme(theme: Theme, isDark: boolean): Theme {
    return isDark ? HIGH_CONTRAST_DARK : HIGH_CONTRAST_LIGHT
  }

  /** 检测主题是否是 high contrast */
  static isHighContrast(theme: Theme): boolean {
    return theme.name.startsWith('hc-')
  }

  /** 列出所有 high-contrast 主题 */
  static list(): Theme[] {
    return [HIGH_CONTRAST_LIGHT, HIGH_CONTRAST_DARK]
  }
}

// =============================================================================
// M22: ColorBlindSupport
// =============================================================================

export type ColorBlindMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'

export interface ColorFilter {
  mode: ColorBlindMode
  /** 红色 filter 矩阵 */
  matrix: number[][]
}

export const COLOR_BLIND_FILTERS: Record<ColorBlindMode, ColorFilter> = {
  normal: { mode: 'normal', matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  protanopia: { mode: 'protanopia', matrix: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]] },
  deuteranopia: { mode: 'deuteranopia', matrix: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]] },
  tritanopia: { mode: 'tritanopia', matrix: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]] },
  achromatopsia: { mode: 'achromatopsia', matrix: [[0.299, 0.587, 0.114], [0.299, 0.587, 0.114], [0.299, 0.587, 0.114]] },
}

export class ColorBlindSupport {
  private _current: ColorBlindMode = 'normal'

  setMode(mode: ColorBlindMode): void {
    this._current = mode
  }

  current(): ColorBlindMode {
    return this._current
  }

  /** 应用 filter 到 hex 颜色 */
  apply(hex: string, mode?: ColorBlindMode): string {
    const m = mode ?? this._current
    if (m === 'normal') return hex
    const matrix = COLOR_BLIND_FILTERS[m].matrix
    const rgb = this._hexToRgb(hex)
    if (!rgb) return hex
    const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255]
    const nr = Math.round((matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b) * 255)
    const ng = Math.round((matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b) * 255)
    const nb = Math.round((matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b) * 255)
    return this._rgbToHex(
      Math.max(0, Math.min(255, nr)),
      Math.max(0, Math.min(255, ng)),
      Math.max(0, Math.min(255, nb)),
    )
  }

  /** 应用到整个 theme */
  applyToTheme(theme: Theme, mode?: ColorBlindMode): Theme {
    const targetMode = mode ?? this._current
    if (targetMode === 'normal') return theme
    const newColors: any = { ...theme.colors }
    for (const k of Object.keys(theme.colors)) {
      newColors[k] = this.apply(theme.colors[k], targetMode)
    }
    return { ...theme, colors: newColors }
  }

  private _hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.match(/^#?([0-9a-fA-F]{6})$/)
    if (!m) return null
    const n = parseInt(m[1], 16)
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
  }

  private _rgbToHex(r: number, g: number, b: number): string {
    const c = (v: number): string => v.toString(16).padStart(2, '0')
    return `#${c(r)}${c(g)}${c(b)}`
  }
}

// =============================================================================
// M23: DarkModeOptimizer
// =============================================================================

export class DarkModeOptimizer {
  /** 检测 color 是否适合 dark mode（亮度） */
  static isTooBright(bg: string): boolean {
    // 简化：纯白 (ffffff) 在 dark mode 中会刺眼
    return bg.toLowerCase() === '#ffffff' || bg.toLowerCase() === '#fff'
  }

  /** 自动调整颜色以适配 dark mode */
  static adjust(colors: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(colors)) {
      // text 类：保持浅色
      if (k.startsWith('text') || k === 'error' || k === 'warning') {
        out[k] = v
        continue
      }
      // bg 类：变成深色
      if (k === 'bg' || k === 'bgSecondary' || k === 'bgTertiary') {
        if (this.isTooBright(v)) {
          out[k] = '#1a1a1a'  // dark default
          continue
        }
      }
      out[k] = v
    }
    return out
  }

  /** 检查 dark theme 是否合格（暗色背景 + 浅色文字） */
  static isValid(theme: Theme): boolean {
    const bg = theme.colors.bg
    const text = theme.colors.text
    if (!bg || !text) return false
    const bgLuma = this._luminance(bg)
    const textLuma = this._luminance(text)
    return bgLuma < textLuma
  }

  private static _luminance(hex: string): number {
    const m = hex.match(/^#?([0-9a-fA-F]{6})$/)
    if (!m) return 0
    const n = parseInt(m[1], 16)
    return ((n >> 16) & 0xff) * 0.299 + ((n >> 8) & 0xff) * 0.587 + (n & 0xff) * 0.114
  }
}

// =============================================================================
// M24: SepiaModeOptimizer
// =============================================================================

export class SepiaModeOptimizer {
  /** 检测是否是 sepia 主题 */
  static isSepia(theme: Theme): boolean {
    return theme.name === 'sepia' || theme.name.includes('sepia')
  }

  /** 调整色调以更接近 sepia */
  static adjust(colors: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(colors)) {
      // 简化：根据 key 推荐 sepia 颜色
      if (k === 'bg') out[k] = '#f4ecd8'
      else if (k === 'bgSecondary') out[k] = '#e8dfc1'
      else if (k === 'text') out[k] = '#5b4636'
      else if (k === 'accent') out[k] = '#8b5a2b'
      else out[k] = v
    }
    return out
  }
}

// =============================================================================
// M25: NordModeOptimizer
// =============================================================================

export class NordModeOptimizer {
  /** 检测是否是 nord 主题 */
  static isNord(theme: Theme): boolean {
    return theme.name === 'nord' || theme.name.includes('nord')
  }

  /** 调整色调以更接近 nord palette */
  static adjust(colors: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(colors)) {
      if (k === 'bg') out[k] = '#2e3440'
      else if (k === 'bgSecondary') out[k] = '#3b4252'
      else if (k === 'text') out[k] = '#eceff4'
      else if (k === 'accent') out[k] = '#88c0d0'
      else out[k] = v
    }
    return out
  }
}

// =============================================================================
// All optimized
// =============================================================================

export const OPTIMIZED_DARK = DarkModeOptimizer.adjust(LIGHT_THEME.colors)
export const OPTIMIZED_SEPIA = SepiaModeOptimizer.adjust(LIGHT_THEME.colors)
export const OPTIMIZED_NORD = NordModeOptimizer.adjust(LIGHT_THEME.colors)

// 引用以避免 unused 警告
void DARK_THEME
void SEPIA_THEME
void NORD_THEME