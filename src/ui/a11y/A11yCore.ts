/**
 * ui/a11y/A11yCore.ts (R1-R15) - 15 engines
 *
 * - R1 A11yProvider: a11y provider
 * - R2 ARIAManager: ARIA role/property 管理
 * - R3 LiveRegion: ARIA live region
 * - R4 ScreenReaderAnnouncer: SR announcer
 * - R5 AccessibilityPreferences: 偏好设置
 * - R6 KeyboardNav: 键盘导航
 * - R7 FocusTrap: focus trap
 * - R8 FocusVisible: focus-visible 跟踪
 * - R9 SkipLink: skip link
 * - R10 ShortcutRegistry: 快捷键注册
 * - R11 I18nProvider: 国际化 provider
 * - R12 TranslationBundle: 翻译包
 * - R13 LocaleDetector: locale 检测
 * - R14 Pluralization: 复数处理
 * - R15 DateTimeFormat: 日期时间格式化
 */

// =============================================================================
// R1: A11yProvider
// =============================================================================

export class A11yProvider {
  private _listeners: Set<(event: string, value: unknown) => void> = new Set()
  private _enabled: boolean = true

  emit(event: string, value: unknown): void {
    if (!this._enabled) return
    for (const l of this._listeners) l(event, value)
  }

  subscribe(fn: (event: string, value: unknown) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  setEnabled(enabled: boolean): void { this._enabled = enabled }
  isEnabled(): boolean { return this._enabled }
}

// =============================================================================
// R2: ARIAManager
// =============================================================================

export type ARIARole = 'button' | 'link' | 'menu' | 'menuitem' | 'dialog' | 'tab' | 'tabpanel' | 'listbox' | 'option' | 'slider' | 'checkbox' | 'radio' | 'textbox' | 'img' | 'navigation' | 'main' | 'banner' | 'contentinfo' | 'complementary' | 'region'

export interface ARIAAttributes {
  role: ARIARole
  label?: string
  labelledBy?: string
  describedBy?: string
  expanded?: boolean
  selected?: boolean
  checked?: boolean
  disabled?: boolean
  hidden?: boolean
  live?: 'off' | 'polite' | 'assertive'
  level?: number  // for headings
  valueNow?: number
  valueMin?: number
  valueMax?: number
}

export class ARIAManager {
  private _elements: Map<string, ARIAAttributes> = new Map()

  set(elementId: string, attrs: ARIAAttributes): void {
    this._elements.set(elementId, attrs)
  }

  get(elementId: string): ARIAAttributes | undefined {
    return this._elements.get(elementId)
  }

  remove(elementId: string): boolean { return this._elements.delete(elementId) }

  /** 序列化为 ARIA 属性字符串 */
  toAttributeString(elementId: string): string {
    const a = this._elements.get(elementId)
    if (!a) return ''
    const parts: string[] = [`role="${a.role}"`]
    if (a.label) parts.push(`aria-label="${a.label}"`)
    if (a.labelledBy) parts.push(`aria-labelledby="${a.labelledBy}"`)
    if (a.describedBy) parts.push(`aria-describedby="${a.describedBy}"`)
    if (a.expanded !== undefined) parts.push(`aria-expanded="${a.expanded}"`)
    if (a.selected !== undefined) parts.push(`aria-selected="${a.selected}"`)
    if (a.checked !== undefined) parts.push(`aria-checked="${a.checked}"`)
    if (a.disabled !== undefined) parts.push(`aria-disabled="${a.disabled}"`)
    if (a.hidden !== undefined) parts.push(`aria-hidden="${a.hidden}"`)
    if (a.live) parts.push(`aria-live="${a.live}"`)
    if (a.level !== undefined) parts.push(`aria-level="${a.level}"`)
    if (a.valueNow !== undefined) parts.push(`aria-valuenow="${a.valueNow}"`)
    if (a.valueMin !== undefined) parts.push(`aria-valuemin="${a.valueMin}"`)
    if (a.valueMax !== undefined) parts.push(`aria-valuemax="${a.valueMax}"`)
    return parts.join(' ')
  }
}

// =============================================================================
// R3: LiveRegion
// =============================================================================

export class LiveRegion {
  private _id: string
  private _politeness: 'off' | 'polite' | 'assertive'
  private _messages: Array<{ text: string; timestamp: number }> = []
  private _listeners: Set<(msg: string) => void> = new Set()

  constructor(id: string = 'live-region', politeness: 'off' | 'polite' | 'assertive' = 'polite') {
    this._id = id
    this._politeness = politeness
  }

  announce(text: string): void {
    this._messages.push({ text, timestamp: Date.now() })
    for (const l of this._listeners) l(text)
  }

  clear(): void { this._messages = [] }
  messages(): Array<{ text: string; timestamp: number }> { return [...this._messages] }
  id(): string { return this._id }
  politeness(): 'off' | 'polite' | 'assertive' { return this._politeness }

  subscribe(fn: (msg: string) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// R4: ScreenReaderAnnouncer
// =============================================================================

export class ScreenReaderAnnouncer {
  private _queue: string[] = []
  private _currentRegion: LiveRegion
  private _cooldownMs: number
  private _lastAnnounceAt: number = 0

  constructor(cooldownMs: number = 1000) {
    this._currentRegion = new LiveRegion('main', 'polite')
    this._cooldownMs = cooldownMs
  }

  /** 排队（避免短时间内多次 announce） */
  announce(text: string, force: boolean = false): void {
    const now = Date.now()
    if (!force && now - this._lastAnnounceAt < this._cooldownMs) {
      this._queue.push(text)
      return
    }
    this._currentRegion.announce(text)
    this._lastAnnounceAt = now
  }

  /** 排空队列 */
  flush(): number {
    const n = this._queue.length
    for (const msg of this._queue) this._currentRegion.announce(msg)
    this._queue = []
    return n
  }

  setRegion(region: LiveRegion): void { this._currentRegion = region }
  currentRegion(): LiveRegion { return this._currentRegion }
}

// =============================================================================
// R5: AccessibilityPreferences
// =============================================================================

export interface A11yPrefs {
  prefersReducedMotion: boolean
  prefersHighContrast: boolean
  prefersColorBlindSafe: boolean
  fontSizeScale: number
  textSpacingScale: number
  enableKeyboardNav: boolean
}

export class AccessibilityPreferences {
  private _prefs: A11yPrefs = {
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersColorBlindSafe: false,
    fontSizeScale: 1.0,
    textSpacingScale: 1.0,
    enableKeyboardNav: true,
  }

  set<K extends keyof A11yPrefs>(key: K, value: A11yPrefs[K]): void {
    this._prefs[key] = value
  }

  get<K extends keyof A11yPrefs>(key: K): A11yPrefs[K] {
    return this._prefs[key]
  }

  all(): A11yPrefs { return { ...this._prefs } }
  reset(): void {
    this._prefs = {
      prefersReducedMotion: false,
      prefersHighContrast: false,
      prefersColorBlindSafe: false,
      fontSizeScale: 1.0,
      textSpacingScale: 1.0,
      enableKeyboardNav: true,
    }
  }
}

// =============================================================================
// R6: KeyboardNav
// =============================================================================

export type KeyCode = 'Tab' | 'Enter' | 'Escape' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End' | 'Space' | '?'

export class KeyboardNav {
  private _focusableIds: string[] = []
  private _currentIndex: number = -1
  private _listeners: Set<(focusedId: string) => void> = new Set()

  setFocusable(ids: string[]): void { this._focusableIds = ids }
  focusable(): string[] { return [...this._focusableIds] }

  next(): string | null {
    if (this._focusableIds.length === 0) return null
    this._currentIndex = (this._currentIndex + 1) % this._focusableIds.length
    const id = this._focusableIds[this._currentIndex]!
    this._emit(id)
    return id
  }

  prev(): string | null {
    if (this._focusableIds.length === 0) return null
    this._currentIndex = (this._currentIndex - 1 + this._focusableIds.length) % this._focusableIds.length
    const id = this._focusableIds[this._currentIndex]!
    this._emit(id)
    return id
  }

  /** 处理按键 */
  handleKey(key: KeyCode): string | null {
    switch (key) {
      case 'Tab': return null  // browser handles
      case 'ArrowDown':
      case 'ArrowRight':
        return this.next()
      case 'ArrowUp':
      case 'ArrowLeft':
        return this.prev()
      case 'Home':
        return this.goto(0)
      case 'End':
        return this.goto(this._focusableIds.length - 1)
      default:
        return null
    }
  }

  goto(index: number): string | null {
    if (index < 0 || index >= this._focusableIds.length) return null
    this._currentIndex = index
    const id = this._focusableIds[index]!
    this._emit(id)
    return id
  }

  current(): string | null {
    return this._currentIndex >= 0 ? this._focusableIds[this._currentIndex] ?? null : null
  }

  subscribe(fn: (focusedId: string) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  private _emit(id: string): void {
    for (const l of this._listeners) l(id)
  }
}

// =============================================================================
// R7: FocusTrap
// =============================================================================

export class FocusTrap {
  private _containerId: string = ''
  private _active: boolean = false
  private _focusable: string[] = []
  private _currentIndex: number = -1

  activate(containerId: string, focusableIds: string[]): void {
    this._containerId = containerId
    this._focusable = focusableIds
    this._active = true
    this._currentIndex = -1
  }

  deactivate(): void { this._active = false; this._focusable = []; this._currentIndex = -1 }
  isActive(): boolean { return this._active }

  /** Tab 键处理：循环 focus */
  onTab(reverse: boolean = false): string | null {
    if (!this._active || this._focusable.length === 0) return null
    let nextIdx: number
    if (this._currentIndex === -1) {
      nextIdx = reverse ? this._focusable.length - 1 : 0
    } else if (reverse) {
      nextIdx = (this._currentIndex - 1 + this._focusable.length) % this._focusable.length
    } else {
      nextIdx = (this._currentIndex + 1) % this._focusable.length
    }
    this._currentIndex = nextIdx
    return this._focusable[nextIdx] ?? null
  }
}

// =============================================================================
// R8: FocusVisible
// =============================================================================

export class FocusVisible {
  private _usingKeyboard: boolean = false
  private _listeners: Set<(visible: boolean) => void> = new Set()

  setUsingKeyboard(using: boolean): void {
    if (this._usingKeyboard === using) return
    this._usingKeyboard = using
    for (const l of this._listeners) l(using)
  }

  isVisible(): boolean { return this._usingKeyboard }
  subscribe(fn: (visible: boolean) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// R9: SkipLink
// =============================================================================

export interface SkipTarget {
  id: string
  label: string
}

export class SkipLink {
  private _targets: SkipTarget[] = []

  add(target: SkipTarget): void { this._targets.push(target) }
  remove(id: string): boolean {
    const before = this._targets.length
    this._targets = this._targets.filter(t => t.id !== id)
    return this._targets.length < before
  }
  targets(): SkipTarget[] { return [...this._targets] }
  first(): SkipTarget | null { return this._targets[0] ?? null }
  find(id: string): SkipTarget | null { return this._targets.find(t => t.id === id) ?? null }
}

// =============================================================================
// R10: ShortcutRegistry
// =============================================================================

export type ShortcutHandler = (event: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }) => void

export class ShortcutRegistry {
  private _shortcuts: Map<string, ShortcutHandler> = new Map()

  /** 注册快捷键（key + 修饰键） */
  register(key: string, handler: ShortcutHandler, modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {}): string {
    const signature = this._signature(key, modifiers)
    this._shortcuts.set(signature, handler)
    return signature
  }

  unregister(signature: string): boolean { return this._shortcuts.delete(signature) }

  /** 触发快捷键 */
  trigger(event: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }): boolean {
    const sig = this._signature(event.key, event)
    const handler = this._shortcuts.get(sig)
    if (handler) { handler(event); return true }
    return false
  }

  signatures(): string[] { return Array.from(this._shortcuts.keys()) }
  count(): number { return this._shortcuts.size }

  private _signature(key: string, mods: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }): string {
    const parts: string[] = []
    if (mods.ctrl) parts.push('Ctrl')
    if (mods.alt) parts.push('Alt')
    if (mods.shift) parts.push('Shift')
    if (mods.meta) parts.push('Meta')
    parts.push(key)
    return parts.join('+')
  }
}

// =============================================================================
// R11: I18nProvider
// =============================================================================

export type Locale = 'en' | 'zh-CN' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'ar' | string

export class I18nProvider {
  private _locale: Locale = 'en'
  private _fallback: Locale = 'en'
  private _listeners: Set<(locale: Locale) => void> = new Set()

  setLocale(locale: Locale): void {
    if (this._locale === locale) return
    this._locale = locale
    for (const l of this._listeners) l(locale)
  }

  getLocale(): Locale { return this._locale }
  setFallback(locale: Locale): void { this._fallback = locale }
  fallback(): Locale { return this._fallback }

  subscribe(fn: (locale: Locale) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// R12: TranslationBundle
// =============================================================================

export class TranslationBundle {
  private _bundles: Map<Locale, Map<string, string>> = new Map()

  add(locale: Locale, key: string, value: string): void {
    if (!this._bundles.has(locale)) this._bundles.set(locale, new Map())
    this._bundles.get(locale)!.set(key, value)
  }

  /** 获取翻译（带 fallback） */
  t(locale: Locale, key: string, fallback?: Locale): string {
    const fb = fallback ?? 'en'
    return this._bundles.get(locale)?.get(key)
      ?? this._bundles.get(fb)?.get(key)
      ?? key  // missing key returns key itself
  }

  has(locale: Locale, key: string): boolean {
    return this._bundles.get(locale)?.has(key) ?? false
  }

  keys(locale: Locale): string[] {
    return Array.from(this._bundles.get(locale)?.keys() ?? [])
  }

  locales(): Locale[] { return Array.from(this._bundles.keys()) }

  /** 加载 bundle（批量） */
  loadBundle(locale: Locale, entries: Record<string, string>): void {
    for (const [key, value] of Object.entries(entries)) {
      this.add(locale, key, value)
    }
  }
}

// =============================================================================
// R13: LocaleDetector
// =============================================================================

export class LocaleDetector {
  /** 解析 navigator.language 字符串 */
  static detect(input?: string): Locale {
    const raw = input ?? (typeof navigator !== 'undefined' ? navigator.language : 'en')
    if (!raw) return 'en'
    // 'zh-CN' → 'zh-CN', 'en-US' → 'en', 'fr-FR' → 'fr'
    const parts = raw.split('-')
    if (parts.length === 1) return parts[0]!
    return `${parts[0]}-${parts[1]!.toUpperCase()}`  // e.g. zh-CN, en-US
  }

  static normalize(locale: Locale): { language: string; region?: string } {
    const parts = locale.split('-')
    return parts.length === 2 ? { language: parts[0]!, region: parts[1]! } : { language: locale }
  }
}

// =============================================================================
// R14: Pluralization
// =============================================================================

export type PluralRule = (n: number) => 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

export class Pluralization {
  private _rules: Map<Locale, PluralRule> = new Map([
    ['en', (n) => (n === 1 ? 'one' : 'other')],
    ['zh-CN', (n) => 'other'],  // 中文无单复数
    ['fr', (n) => (n === 0 || n === 1 ? 'one' : 'other')],
  ])

  registerRule(locale: Locale, rule: PluralRule): void {
    this._rules.set(locale, rule)
  }

  select(locale: Locale, n: number): 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' {
    const rule = this._rules.get(locale) ?? this._rules.get('en')!
    return rule(n)
  }

  /** 选择正确的 plural form */
  pick(locale: Locale, n: number, forms: Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many' | 'other', string>>): string {
    const form = this.select(locale, n)
    return forms[form] ?? forms.other ?? ''
  }
}

// =============================================================================
// R15: DateTimeFormat
// =============================================================================

export class DateTimeFormat {
  /** 简单 i18n date formatter */
  static format(date: Date, locale: Locale = 'en', format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
    if (format === 'short') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (format === 'medium') return date.toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
    if (format === 'long') return date.toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    return date.toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  /** 时间格式化 */
  static formatTime(date: Date, locale: Locale = 'en', format: 'short' | 'medium' = 'short'): string {
    return date.toLocaleTimeString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
      hour: '2-digit', minute: '2-digit',
      hour12: format === 'short' && locale === 'en',
    })
  }

  /** 相对时间 */
  static relative(from: Date, to: Date = new Date(), locale: Locale = 'en'): string {
    const diffMs = to.getTime() - from.getTime()
    const diffSec = Math.round(diffMs / 1000)
    const locale_ = locale as string
    const rtf = new Intl.RelativeTimeFormat(locale_, { numeric: 'auto' })
    if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second')
    if (Math.abs(diffSec) < 3600) return rtf.format(-Math.round(diffSec / 60), 'minute')
    if (Math.abs(diffSec) < 86400) return rtf.format(-Math.round(diffSec / 3600), 'hour')
    return rtf.format(-Math.round(diffSec / 86400), 'day')
  }
}