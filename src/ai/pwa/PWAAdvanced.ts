// Round 8 Direction CD — Mobile PWA Installer 2.0 Batch 2/3
// V4686-V4695: Cache + Push + Sync + Network + Shell + Splash

export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';

export interface CacheEntry {
  url: string;
  response: string;
  cachedAt: number;
  ttl?: number;
  headers?: Record<string, string>;
}

// V4686: CacheStrategySelector — 5 种缓存策略选择器
export class CacheStrategySelector {
  private _strategies: Map<string, CacheStrategy> = new Map();

  setStrategy(urlPattern: string, strategy: CacheStrategy): void {
    this._strategies.set(urlPattern, strategy);
  }

  getStrategy(url: string): CacheStrategy {
    for (const [pattern, strategy] of this._strategies) {
      if (url.includes(pattern)) return strategy;
    }
    return 'network-first';
  }

  strategies(): Record<string, CacheStrategy> {
    const out: Record<string, CacheStrategy> = {};
    this._strategies.forEach((v, k) => { out[k] = v; });
    return out;
  }

  size(): number { return this._strategies.size; }

  removeStrategy(pattern: string): boolean {
    return this._strategies.delete(pattern);
  }
}

// V4687: CacheStorageAdapter — Cache Storage API 模拟（in-memory）
export class CacheStorageAdapter {
  private _caches: Map<string, Map<string, CacheEntry>> = new Map();

  open(cacheName: string): void {
    if (!this._caches.has(cacheName)) this._caches.set(cacheName, new Map());
  }

  put(cacheName: string, entry: CacheEntry): void {
    this.open(cacheName);
    this._caches.get(cacheName)!.set(entry.url, entry);
  }

  get(cacheName: string, url: string): CacheEntry | undefined {
    return this._caches.get(cacheName)?.get(url);
  }

  match(cacheName: string, url: string): CacheEntry | undefined {
    const entry = this.get(cacheName, url);
    if (!entry) return undefined;
    if (entry.ttl && Date.now() - entry.cachedAt > entry.ttl) return undefined;
    return entry;
  }

  delete(cacheName: string, url: string): boolean {
    return this._caches.get(cacheName)?.delete(url) || false;
  }

  keys(cacheName: string): string[] {
    return Array.from(this._caches.get(cacheName)?.keys() || []);
  }

  deleteCache(cacheName: string): boolean {
    return this._caches.delete(cacheName);
  }

  cacheNames(): string[] { return Array.from(this._caches.keys()); }

  totalSize(): number {
    let n = 0;
    this._caches.forEach(c => { n += c.size; });
    return n;
  }
}

// V4688: PushSubscriptionManager — Push 订阅管理
export interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime: number | null;
}

export class PushSubscriptionManager {
  private _subscription: PushSubscription | null = null;

  subscribe(endpoint: string, keys: { p256dh: string; auth: string }): PushSubscription {
    this._subscription = { endpoint, keys, expirationTime: null };
    return this._subscription;
  }

  unsubscribe(): boolean {
    const had = this._subscription !== null;
    this._subscription = null;
    return had;
  }

  get(): PushSubscription | null { return this._subscription; }

  isSubscribed(): boolean { return this._subscription !== null; }

  endpoint(): string | null { return this._subscription?.endpoint || null; }

  expirationTime(): number | null { return this._subscription?.expirationTime || null; }
}

// V4689: NotificationBuilder — 通知构建（标题/正文/图标/操作）
export interface NotificationAction {
  action: string;
  title: string;
}

export interface NotificationSpec {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
}

export class NotificationBuilder {
  private _spec: NotificationSpec;

  constructor(title: string, body: string) {
    this._spec = { title, body };
  }

  icon(url: string): this { this._spec.icon = url; return this; }
  badge(url: string): this { this._spec.badge = url; return this; }
  tag(t: string): this { this._spec.tag = t; return this; }
  data(d: Record<string, string>): this { this._spec.data = d; return this; }
  action(action: string, title: string): this {
    if (!this._spec.actions) this._spec.actions = [];
    this._spec.actions.push({ action, title });
    return this;
  }
  requireInteraction(): this { this._spec.requireInteraction = true; return this; }

  build(): NotificationSpec { return { ...this._spec }; }
}

// V4690: BackgroundSyncManager — 后台同步注册
export interface SyncRegistration {
  tag: string;
  minInterval: number;
  registeredAt: number;
}

export class BackgroundSyncManager {
  private _registrations: Map<string, SyncRegistration> = new Map();

  register(tag: string, minInterval = 0): SyncRegistration {
    const reg: SyncRegistration = { tag, minInterval, registeredAt: Date.now() };
    this._registrations.set(tag, reg);
    return reg;
  }

  unregister(tag: string): boolean {
    return this._registrations.delete(tag);
  }

  get(tag: string): SyncRegistration | undefined {
    return this._registrations.get(tag);
  }

  has(tag: string): boolean { return this._registrations.has(tag); }

  all(): SyncRegistration[] { return Array.from(this._registrations.values()); }

  size(): number { return this._registrations.size; }
}

// V4691: PeriodicSyncManager — 周期同步（最小间隔）
export class PeriodicSyncManager {
  private _intervals: Map<string, number> = new Map();

  register(tag: string, minInterval: number): void {
    this._intervals.set(tag, minInterval);
  }

  unregister(tag: string): boolean {
    return this._intervals.delete(tag);
  }

  getInterval(tag: string): number | undefined {
    return this._intervals.get(tag);
  }

  allTags(): string[] { return Array.from(this._intervals.keys()); }

  size(): number { return this._intervals.size; }

  tagsWithinLimit(maxInterval: number): string[] {
    return Array.from(this._intervals.entries())
      .filter(([_, iv]) => iv <= maxInterval)
      .map(([t, _]) => t);
  }
}

// V4692: OfflineRequestQueue — 离线请求队列
export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
  enqueuedAt: number;
  retries: number;
}

export class OfflineRequestQueue {
  private _queue: QueuedRequest[] = [];

  enqueue(req: Omit<QueuedRequest, 'id' | 'enqueuedAt' | 'retries'>): QueuedRequest {
    const r: QueuedRequest = {
      ...req,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      enqueuedAt: Date.now(),
      retries: 0,
    };
    this._queue.push(r);
    return r;
  }

  dequeue(): QueuedRequest | undefined {
    return this._queue.shift();
  }

  retry(id: string): boolean {
    const r = this._queue.find(q => q.id === id);
    if (!r) return false;
    r.retries++;
    return true;
  }

  remove(id: string): boolean {
    const before = this._queue.length;
    this._queue = this._queue.filter(q => q.id !== id);
    return this._queue.length < before;
  }

  size(): number { return this._queue.length; }

  all(): QueuedRequest[] { return [...this._queue]; }

  clear(): void { this._queue = []; }
}

// V4693: NetworkStateDetector — 网络状态检测
export type NetworkType = 'online' | 'offline' | 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown';

export class NetworkStateDetector {
  private _state: NetworkType = 'online';
  private _listeners: Set<(s: NetworkType) => void> = new Set();

  setState(s: NetworkType): void {
    this._state = s;
    this._listeners.forEach(fn => fn(s));
  }

  current(): NetworkType { return this._state; }

  isOnline(): boolean { return this._state === 'online' || this._state === '4g' || this._state === '5g' || this._state === '3g'; }
  isOffline(): boolean { return this._state === 'offline'; }
  isSlow(): boolean { return this._state === 'slow-2g' || this._state === '2g'; }

  subscribe(fn: (s: NetworkType) => void): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
}

// V4694: AppShellRenderer — App Shell 渲染骨架
export interface ShellComponent {
  name: string;
  html: string;
  priority: number; // 0=critical, 1=above-fold, 2=below-fold
}

export class AppShellRenderer {
  private _components: ShellComponent[] = [];

  add(c: ShellComponent): void {
    this._components.push(c);
    this._components.sort((a, b) => a.priority - b.priority);
  }

  render(priorityThreshold = 1): string {
    return this._components
      .filter(c => c.priority <= priorityThreshold)
      .map(c => c.html)
      .join('\n');
  }

  critical(): string { return this.render(0); }
  aboveFold(): string { return this.render(1); }

  remove(name: string): boolean {
    const before = this._components.length;
    this._components = this._components.filter(c => c.name !== name);
    return this._components.length < before;
  }

  size(): number { return this._components.length; }
}

// V4695: SplashScreenManager — 启动屏管理
export interface SplashScreenSpec {
  backgroundColor: string;
  image: string;
  duration: number;
}

export class SplashScreenManager {
  private _current: SplashScreenSpec | null = null;
  private _shown = false;
  private _shownAt = 0;

  show(spec: SplashScreenSpec): void {
    this._current = spec;
    this._shown = true;
    this._shownAt = Date.now();
  }

  isShown(): boolean { return this._shown; }

  hide(): boolean {
    const was = this._shown;
    this._shown = false;
    return was;
  }

  age(): number {
    return this._shown ? Date.now() - this._shownAt : 0;
  }

  shouldAutoHide(): boolean {
    return this._current ? Date.now() - this._shownAt >= this._current.duration : false;
  }

  current(): SplashScreenSpec | null { return this._current; }
}

export const PWA_BATCH_2_ENGINES: readonly string[] = [
  'CacheStrategySelector', 'CacheStorageAdapter', 'PushSubscriptionManager',
  'NotificationBuilder', 'BackgroundSyncManager', 'PeriodicSyncManager',
  'OfflineRequestQueue', 'NetworkStateDetector', 'AppShellRenderer', 'SplashScreenManager',
];

export class PWAAdvancedIndex {
  list(): string[] { return [...PWA_BATCH_2_ENGINES, 'PWAAdvancedIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}