/**
 * mobile/MobileAdvanced.ts (P11-P25) - 15 engines
 *
 * - P11 MobileFirstLayout
 * - P12 AdaptiveNavigation
 * - P13 HamburgerMenu
 * - P14 TabBar
 * - P15 StackNavigator
 * - P16 PWAConfig
 * - P17 ServiceWorker
 * - P18 ManifestGenerator
 * - P19 InstallPrompt
 * - P20 UpdatePrompt
 * - P21 OfflineDetection
 * - P22 StorageQuota
 * - P23 BackgroundSync
 * - P24 PushNotification
 * - P25 ShareAPI
 */

// =============================================================================
// P11: MobileFirstLayout
// =============================================================================

export type DeviceClass = 'mobile' | 'tablet' | 'desktop' | 'wide'

export class MobileFirstLayout {
  private _width: number = 0
  private _height: number = 0

  setViewport(width: number, height: number): void {
    this._width = width
    this._height = height
  }

  deviceClass(): DeviceClass {
    if (this._width < 640) return 'mobile'
    if (this._width < 1024) return 'tablet'
    if (this._width < 1920) return 'desktop'
    return 'wide'
  }

  /** 单列 vs 多列 */
  columns(): number {
    const c = this.deviceClass()
    if (c === 'mobile') return 1
    if (c === 'tablet') return 2
    if (c === 'desktop') return 3
    return 4
  }

  /** 字体大小（px） */
  baseFontSize(): number {
    if (this._width < 640) return 14
    if (this._width < 1024) return 15
    return 16
  }

  /** 是否单栏布局 */
  isSingleColumn(): boolean {
    return this._width < 768
  }
}

// =============================================================================
// P12: AdaptiveNavigation
// =============================================================================

export type NavMode = 'top' | 'side' | 'bottom' | 'hamburger' | 'tabs'

export class AdaptiveNavigation {
  private _currentMode: NavMode = 'top'
  private _listeners: Set<(mode: NavMode) => void> = new Set()

  adapt(width: number): NavMode {
    let mode: NavMode
    if (width < 640) mode = 'bottom'  // mobile: bottom bar
    else if (width < 1024) mode = 'hamburger'  // tablet
    else mode = 'side'  // desktop

    if (mode !== this._currentMode) {
      this._currentMode = mode
      for (const l of this._listeners) l(mode)
    }
    return mode
  }

  currentMode(): NavMode { return this._currentMode }
  subscribe(fn: (mode: NavMode) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P13: HamburgerMenu
// =============================================================================

export class HamburgerMenu {
  private _open: boolean = false
  private _listeners: Set<(open: boolean) => void> = new Set()

  toggle(): boolean {
    this._open = !this._open
    for (const l of this._listeners) l(this._open)
    return this._open
  }

  open(): void { this._open = true; for (const l of this._listeners) l(true) }
  close(): void { this._open = false; for (const l of this._listeners) l(false) }
  isOpen(): boolean { return this._open }
  subscribe(fn: (open: boolean) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P14: TabBar
// =============================================================================

export interface TabItem {
  tabId: string
  label: string
  icon: string
  badge?: number
}

export class TabBar {
  private _tabs: TabItem[] = []
  private _activeIndex: number = 0
  private _listeners: Set<(index: number) => void> = new Set()

  setTabs(tabs: TabItem[]): void { this._tabs = tabs }
  setActive(index: number): boolean {
    if (index < 0 || index >= this._tabs.length) return false
    this._activeIndex = index
    for (const l of this._listeners) l(index)
    return true
  }
  active(): TabItem | null { return this._tabs[this._activeIndex] ?? null }
  activeIndex(): number { return this._activeIndex }
  tabs(): TabItem[] { return [...this._tabs] }
  setBadge(tabId: string, badge: number | undefined): boolean {
    const t = this._tabs.find(t => t.tabId === tabId)
    if (!t) return false
    t.badge = badge
    return true
  }
  subscribe(fn: (index: number) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P15: StackNavigator
// =============================================================================

export interface Screen {
  screenId: string
  component: string
  params?: Record<string, unknown>
}

export class StackNavigator {
  private _stack: Screen[] = []

  push(screen: Screen): void { this._stack.push(screen) }
  pop(): Screen | null { return this._stack.pop() ?? null }
  popToRoot(): Screen[] {
    const root = this._stack.slice(0, 1)
    this._stack = root
    return this._stack
  }
  replace(screen: Screen): void { if (this._stack.length > 0) this._stack[this._stack.length - 1] = screen }
  top(): Screen | null { return this._stack[this._stack.length - 1] ?? null }
  size(): number { return this._stack.length }
  stack(): Screen[] { return [...this._stack] }
  reset(screens: Screen[] = []): void { this._stack = [...screens] }
}

// =============================================================================
// P16: PWAConfig
// =============================================================================

export interface PWAConfigData {
  name: string
  shortName: string
  startUrl: string
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
  themeColor: string
  backgroundColor: string
  scope: string
  icons: Array<{ src: string; sizes: string; type: string }>
}

export class PWAConfig {
  private _data: PWAConfigData

  constructor(data?: Partial<PWAConfigData>) {
    this._data = {
      name: data?.name ?? 'My App',
      shortName: data?.shortName ?? 'App',
      startUrl: data?.startUrl ?? '/',
      display: data?.display ?? 'standalone',
      themeColor: data?.themeColor ?? '#1976d2',
      backgroundColor: data?.backgroundColor ?? '#ffffff',
      scope: data?.scope ?? '/',
      icons: data?.icons ?? [],
    }
  }

  set(data: Partial<PWAConfigData>): void { this._data = { ...this._data, ...data } }
  get(): PWAConfigData { return { ...this._data } }
  validate(): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    if (!this._data.name) issues.push('name missing')
    if (!this._data.startUrl) issues.push('startUrl missing')
    if (this._data.icons.length === 0) issues.push('no icons')
    return { valid: issues.length === 0, issues }
  }
}

// =============================================================================
// P17: ServiceWorker
// =============================================================================

export interface SWEvent {
  type: 'install' | 'activate' | 'fetch' | 'message' | 'sync' | 'push'
  data: unknown
}

export class ServiceWorkerManager {
  private _registered: boolean = false
  private _listeners: Set<(e: SWEvent) => void> = new Set()
  private _cache: Map<string, string> = new Map()  // url → response

  register(): boolean {
    if (this._registered) return false
    this._registered = true
    this._emit({ type: 'install', data: { scope: '/' } })
    this._emit({ type: 'activate', data: null })
    return true
  }

  unregister(): boolean {
    if (!this._registered) return false
    this._registered = false
    return true
  }

  isRegistered(): boolean { return this._registered }

  cacheResponse(url: string, response: string): void { this._cache.set(url, response) }
  getCached(url: string): string | null { return this._cache.get(url) ?? null }
  clearCache(): void { this._cache.clear() }

  emit(e: SWEvent): void { this._emit(e) }

  private _emit(e: SWEvent): void { for (const l of this._listeners) l(e) }
  subscribe(fn: (e: SWEvent) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P18: ManifestGenerator
// =============================================================================

export class ManifestGenerator {
  static generate(config: PWAConfigData): string {
    return JSON.stringify({
      name: config.name,
      short_name: config.shortName,
      start_url: config.startUrl,
      display: config.display,
      theme_color: config.themeColor,
      background_color: config.backgroundColor,
      scope: config.scope,
      icons: config.icons,
    }, null, 2)
  }

  static validate(json: string): { valid: boolean; issues: string[] } {
    try {
      const obj = JSON.parse(json)
      const issues: string[] = []
      if (!obj.name) issues.push('missing name')
      if (!obj.start_url) issues.push('missing start_url')
      if (!obj.icons || !Array.isArray(obj.icons)) issues.push('icons must be array')
      return { valid: issues.length === 0, issues }
    } catch (e) {
      return { valid: false, issues: [e instanceof Error ? e.message : 'parse error'] }
    }
  }
}

// =============================================================================
// P19: InstallPrompt
// =============================================================================

export class InstallPrompt {
  private _deferredPrompt: { prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }> } | null = null
  private _installed: boolean = false
  private _listeners: Set<(canInstall: boolean) => void> = new Set()

  capture(prompt: { prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }> }): void {
    this._deferredPrompt = prompt
    for (const l of this._listeners) l(true)
  }

  canInstall(): boolean { return this._deferredPrompt !== null && !this._installed }

  async show(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this._deferredPrompt) return 'unavailable'
    const result = await this._deferredPrompt.prompt()
    this._deferredPrompt = null
    if (result.outcome === 'accepted') this._installed = true
    return result.outcome
  }

  isInstalled(): boolean { return this._installed }
  markInstalled(): void { this._installed = true }

  subscribe(fn: (canInstall: boolean) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P20: UpdatePrompt
// =============================================================================

export class UpdatePrompt {
  private _updateAvailable: boolean = false
  private _listeners: Set<(available: boolean) => void> = new Set()

  setAvailable(available: boolean): void {
    this._updateAvailable = available
    for (const l of this._listeners) l(available)
  }

  isAvailable(): boolean { return this._updateAvailable }

  /** 模拟应用更新（重新加载） */
  apply(): boolean {
    if (!this._updateAvailable) return false
    this._updateAvailable = false
    return true
  }

  dismiss(): void { this._updateAvailable = false }

  subscribe(fn: (available: boolean) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P21: OfflineDetection
// =============================================================================

export class OfflineDetection {
  private _online: boolean = true
  private _listeners: Set<(online: boolean) => void> = new Set()
  private _lastOnlineAt: number = Date.now()
  private _lastOfflineAt: number | null = null

  setOnline(online: boolean): void {
    const changed = this._online !== online
    this._online = online
    if (online) {
      this._lastOnlineAt = Date.now()
    } else {
      this._lastOfflineAt = Date.now()
    }
    if (changed) {
      for (const l of this._listeners) l(online)
    }
  }

  isOnline(): boolean { return this._online }
  isOffline(): boolean { return !this._online }
  lastOnlineAt(): number { return this._lastOnlineAt }
  lastOfflineAt(): number | null { return this._lastOfflineAt }
  offlineDurationMs(): number {
    if (this._online || !this._lastOfflineAt) return 0
    return Date.now() - this._lastOfflineAt
  }
  subscribe(fn: (online: boolean) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P22: StorageQuota
// =============================================================================

export interface QuotaInfo {
  usage: number
  quota: number
  percent: number
  available: number
}

export class StorageQuota {
  private _estimate: QuotaInfo | null = null
  private _warningThreshold: number

  constructor(warningThreshold: number = 0.8) {
    this._warningThreshold = warningThreshold
  }

  /** 模拟 quota 查询（实际 navigator.storage.estimate） */
  update(usage: number, quota: number): QuotaInfo {
    const info: QuotaInfo = {
      usage, quota,
      percent: quota > 0 ? usage / quota : 0,
      available: Math.max(0, quota - usage),
    }
    this._estimate = info
    return info
  }

  isWarning(): boolean {
    if (!this._estimate) return false
    return this._estimate.percent >= this._warningThreshold
  }

  isCritical(): boolean {
    if (!this._estimate) return false
    return this._estimate.percent >= 0.95
  }

  estimate(): QuotaInfo | null { return this._estimate }
}

// =============================================================================
// P23: BackgroundSync
// =============================================================================

export interface SyncTask {
  taskId: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  retries: number
  lastAttemptAt?: number
}

export class BackgroundSync {
  private _tasks: Map<string, SyncTask> = new Map()
  private _nextId: number = 0
  private _maxRetries: number
  private _executing: Set<string> = new Set()

  constructor(maxRetries: number = 3) {
    this._maxRetries = maxRetries
  }

  enqueue(url: string, method: SyncTask['method'], body?: unknown): SyncTask {
    const task: SyncTask = {
      taskId: `bg_${++this._nextId}`,
      url, method, body, retries: 0,
    }
    this._tasks.set(task.taskId, task)
    return task
  }

  markExecuting(taskId: string): boolean {
    if (!this._tasks.has(taskId)) return false
    this._executing.add(taskId)
    return true
  }

  markComplete(taskId: string): boolean {
    if (!this._tasks.has(taskId)) return false
    this._tasks.delete(taskId)
    this._executing.delete(taskId)
    return true
  }

  markFailed(taskId: string): boolean {
    const t = this._tasks.get(taskId)
    if (!t) return false
    t.retries += 1
    t.lastAttemptAt = Date.now()
    if (t.retries >= this._maxRetries) {
      this._tasks.delete(taskId)
      this._executing.delete(taskId)
    }
    return true
  }

  pending(): SyncTask[] { return Array.from(this._tasks.values()) }
  count(): number { return this._tasks.size }
}

// =============================================================================
// P24: PushNotification
// =============================================================================

export interface PushSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  data?: Record<string, unknown>
}

export class PushNotificationManager {
  private _subscription: PushSubscription | null = null
  private _notifications: Array<{ id: string; payload: PushPayload; receivedAt: number; read: boolean }> = []
  private _nextId: number = 0

  subscribe(sub: PushSubscription): void { this._subscription = sub }

  unsubscribe(): boolean {
    if (!this._subscription) return false
    this._subscription = null
    return true
  }

  isSubscribed(): boolean { return this._subscription !== null }

  receive(payload: PushPayload): void {
    this._notifications.push({
      id: `push_${++this._nextId}`,
      payload, receivedAt: Date.now(), read: false,
    })
  }

  markRead(id: string): boolean {
    const n = this._notifications.find(x => x.id === id)
    if (!n) return false
    n.read = true
    return true
  }

  unread(): Array<{ id: string; payload: PushPayload; receivedAt: number }> {
    return this._notifications.filter(n => !n.read).map(({ id, payload, receivedAt }) => ({ id, payload, receivedAt }))
  }

  all(): Array<{ id: string; payload: PushPayload; receivedAt: number; read: boolean }> {
    return [...this._notifications]
  }
}

// =============================================================================
// P25: ShareAPI
// =============================================================================

export interface ShareData {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

export class ShareAPI {
  private _supported: boolean = true

  isSupported(): boolean { return this._supported }

  /** 检查数据是否可分享 */
  canShare(data: ShareData): boolean {
    return !!(data.title || data.text || data.url || (data.files && data.files.length > 0))
  }

  /** 分享（模拟） */
  async share(data: ShareData): Promise<{ shared: boolean; reason?: string }> {
    if (!this._supported) return { shared: false, reason: 'not supported' }
    if (!this.canShare(data)) return { shared: false, reason: 'no content' }
    return { shared: true }
  }
}