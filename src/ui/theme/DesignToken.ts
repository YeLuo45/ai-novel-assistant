/**
 * ui/theme/DesignToken.ts (M1-M10) - 10 engines
 *
 * - M1 DesignToken: 设计 tokens 抽象
 * - M2 ThemeProvider: 主题 provider
 * - M3 ThemeRegistry: 主题注册表
 * - M4 LightTheme: light 主题
 * - M5 DarkTheme: dark 主题
 * - M6 SepiaTheme: sepia 主题
 * - M7 NordTheme: nord 主题
 * - M8 ThemeSwitcher: 切换器
 * - M9 CustomThemeBuilder: 自定义主题
 * - M10 ThemePersistence: 持久化
 */

import type { Theme } from './types'

// =============================================================================
// M1: DesignToken
// =============================================================================

export interface DesignToken<T = string> {
  name: string
  value: T
  description?: string
}

export class DesignTokenRegistry<T = string> {
  private _tokens: Map<string, DesignToken<T>> = new Map()

  set(name: string, value: T, description?: string): void {
    this._tokens.set(name, { name, value, description })
  }

  get(name: string): T | undefined {
    return this._tokens.get(name)?.value
  }

  has(name: string): boolean {
    return this._tokens.has(name)
  }

  all(): DesignToken<T>[] {
    return Array.from(this._tokens.values())
  }

  /** 导出为对象 */
  toObject(): Record<string, T> {
    const out: Record<string, T> = {}
    for (const [k, v] of this._tokens) out[k] = v.value
    return out
  }
}

// =============================================================================
// M4-M7: 4 个 built-in themes
// =============================================================================

export const LIGHT_THEME: Theme = {
  name: 'light',
  displayName: 'Light',
  isDark: false,
  colors: {
    bg: '#ffffff',
    bgSecondary: '#f5f5f5',
    bgTertiary: '#e8e8e8',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#e0e0e0',
    accent: '#1976d2',
    accentText: '#ffffff',
    error: '#d32f2f',
    warning: '#f57c00',
    success: '#388e3c',
    info: '#0288d1',
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, monospace',
    fontSizeXs: '12px',
    fontSizeSm: '14px',
    fontSizeMd: '16px',
    fontSizeLg: '18px',
    fontSizeXl: '24px',
    lineHeight: 1.5,
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  radius: { sm: '4px', md: '8px', lg: '16px', pill: '9999px' },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 2px 4px rgba(0,0,0,0.1)',
    lg: '0 4px 8px rgba(0,0,0,0.15)',
  },
}

export const DARK_THEME: Theme = {
  name: 'dark',
  displayName: 'Dark',
  isDark: true,
  colors: {
    bg: '#0d1117',
    bgSecondary: '#161b22',
    bgTertiary: '#21262d',
    text: '#e6edf3',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',
    border: '#30363d',
    accent: '#58a6ff',
    accentText: '#0d1117',
    error: '#f85149',
    warning: '#d29922',
    success: '#3fb950',
    info: '#58a6ff',
  },
  typography: LIGHT_THEME.typography,
  spacing: LIGHT_THEME.spacing,
  radius: LIGHT_THEME.radius,
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 2px 4px rgba(0,0,0,0.4)',
    lg: '0 4px 8px rgba(0,0,0,0.5)',
  },
}

export const SEPIA_THEME: Theme = {
  name: 'sepia',
  displayName: 'Sepia (护眼)',
  isDark: false,
  colors: {
    bg: '#f4ecd8',
    bgSecondary: '#e8dfc1',
    bgTertiary: '#ddd0a8',
    text: '#5b4636',
    textSecondary: '#8b6f47',
    textTertiary: '#a89b7b',
    border: '#d6c8a4',
    accent: '#8b5a2b',
    accentText: '#f4ecd8',
    error: '#a52a2a',
    warning: '#cc7722',
    success: '#6b8e23',
    info: '#708090',
  },
  typography: LIGHT_THEME.typography,
  spacing: LIGHT_THEME.spacing,
  radius: LIGHT_THEME.radius,
  shadow: {
    sm: '0 1px 2px rgba(91,70,54,0.1)',
    md: '0 2px 4px rgba(91,70,54,0.15)',
    lg: '0 4px 8px rgba(91,70,54,0.2)',
  },
}

export const NORD_THEME: Theme = {
  name: 'nord',
  displayName: 'Nord (北欧)',
  isDark: true,
  colors: {
    bg: '#2e3440',
    bgSecondary: '#3b4252',
    bgTertiary: '#434c5e',
    text: '#eceff4',
    textSecondary: '#d8dee9',
    textTertiary: '#a3be8c',
    border: '#4c566a',
    accent: '#88c0d0',
    accentText: '#2e3440',
    error: '#bf616a',
    warning: '#ebcb8b',
    success: '#a3be8c',
    info: '#81a1c1',
  },
  typography: LIGHT_THEME.typography,
  spacing: LIGHT_THEME.spacing,
  radius: LIGHT_THEME.radius,
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 2px 4px rgba(0,0,0,0.4)',
    lg: '0 4px 8px rgba(0,0,0,0.5)',
  },
}

// =============================================================================
// M3: ThemeRegistry
// =============================================================================

export class ThemeRegistry {
  private _themes: Map<string, Theme> = new Map()
  private _activeId: string = 'light'

  constructor() {
    this.register(LIGHT_THEME)
    this.register(DARK_THEME)
    this.register(SEPIA_THEME)
    this.register(NORD_THEME)
  }

  register(theme: Theme): void {
    this._themes.set(theme.name, theme)
  }

  unregister(name: string): boolean {
    return this._themes.delete(name)
  }

  get(name: string): Theme | undefined {
    return this._themes.get(name)
  }

  list(): Theme[] {
    return Array.from(this._themes.values())
  }

  setActive(name: string): boolean {
    if (!this._themes.has(name)) return false
    this._activeId = name
    return true
  }

  getActive(): Theme {
    return this._themes.get(this._activeId) ?? LIGHT_THEME
  }

  activeId(): string {
    return this._activeId
  }

  count(): number {
    return this._themes.size
  }
}

// =============================================================================
// M2: ThemeProvider (state management)
// =============================================================================

export type ThemeName = 'light' | 'dark' | 'sepia' | 'nord' | 'system'

export class ThemeProvider {
  private _registry: ThemeRegistry
  private _activeName: ThemeName = 'light'
  private _systemPreference: 'light' | 'dark' = 'light'
  private _listeners: Set<() => void> = new Set()

  constructor(registry?: ThemeRegistry) {
    this._registry = registry ?? new ThemeRegistry()
  }

  setTheme(name: ThemeName): boolean {
    if (name === 'system') {
      this._activeName = 'system'
      this._resolveSystem()
    } else {
      if (!this._registry.get(name)) return false
      this._activeName = name
      this._registry.setActive(name)
    }
    this._notify()
    return true
  }

  setSystemPreference(pref: 'light' | 'dark'): void {
    this._systemPreference = pref
    if (this._activeName === 'system') this._resolveSystem()
    this._notify()
  }

  private _resolveSystem(): void {
    this._registry.setActive(this._systemPreference)
  }

  current(): Theme {
    return this._registry.getActive()
  }

  currentName(): ThemeName {
    return this._activeName
  }

  registry(): ThemeRegistry {
    return this._registry
  }

  subscribe(fn: () => void): () => void {
    this._listeners.add(fn)
    return () => {
      this._listeners.delete(fn)
    }
  }

  private _notify(): void {
    for (const l of this._listeners) {
      try { l() } catch { /* swallow */ }
    }
  }

  /** 列出所有可用主题 */
  availableThemes(): Theme[] {
    return this._registry.list()
  }
}

// =============================================================================
// M9: CustomThemeBuilder
// =============================================================================

export class CustomThemeBuilder {
  private _theme: Partial<Theme> = {}

  name(name: string): this { this._theme.name = name; return this }
  displayName(d: string): this { this._theme.displayName = d; return this }
  isDark(d: boolean): this { this._theme.isDark = d; return this }

  color(key: keyof Theme['colors'], value: string): this {
    if (!this._theme.colors) this._theme.colors = { ...LIGHT_THEME.colors }
    this._theme.colors[key] = value
    return this
  }

  typography(key: keyof Theme['typography'], value: string): this {
    if (!this._theme.typography) this._theme.typography = { ...LIGHT_THEME.typography }
    this._theme.typography[key] = value
    return this
  }

  spacing(key: keyof Theme['spacing'], value: string): this {
    if (!this._theme.spacing) this._theme.spacing = { ...LIGHT_THEME.spacing }
    this._theme.spacing[key] = value
    return this
  }

  build(): Theme {
    return {
      name: this._theme.name ?? 'custom',
      displayName: this._theme.displayName ?? 'Custom',
      isDark: this._theme.isDark ?? false,
      colors: this._theme.colors ?? LIGHT_THEME.colors,
      typography: this._theme.typography ?? LIGHT_THEME.typography,
      spacing: this._theme.spacing ?? LIGHT_THEME.spacing,
      radius: this._theme.radius ?? LIGHT_THEME.radius,
      shadow: this._theme.shadow ?? LIGHT_THEME.shadow,
    }
  }
}

// =============================================================================
// M10: ThemePersistence
// =============================================================================

export class ThemePersistence {
  private _storageKey: string

  constructor(storageKey: string = 'ai-novel-theme') {
    this._storageKey = storageKey
  }

  /** 序列化主题为可存储字符串 */
  serialize(themeName: ThemeName): string {
    return JSON.stringify({ theme: themeName, savedAt: Date.now() })
  }

  /** 反序列化 */
  deserialize(data: string): ThemeName | null {
    try {
      const obj = JSON.parse(data) as { theme: ThemeName }
      if (['light', 'dark', 'sepia', 'nord', 'system'].includes(obj.theme)) {
        return obj.theme
      }
      return null
    } catch {
      return null
    }
  }

  storageKey(): string {
    return this._storageKey
  }
}

// =============================================================================
// M8: ThemeSwitcher
// =============================================================================

export class ThemeSwitcher {
  private _provider: ThemeProvider
  private _history: ThemeName[] = []

  constructor(provider: ThemeProvider) {
    this._provider = provider
  }

  switchTo(name: ThemeName): boolean {
    const ok = this._provider.setTheme(name)
    if (ok) this._history.push(name)
    return ok
  }

  toggle(): ThemeName {
    const current = this._provider.currentName()
    const next: ThemeName = current === 'light' ? 'dark' : 'light'
    this.switchTo(next)
    return next
  }

  history(): ThemeName[] {
    return [...this._history]
  }

  available(): Theme[] {
    return this._provider.availableThemes()
  }
}