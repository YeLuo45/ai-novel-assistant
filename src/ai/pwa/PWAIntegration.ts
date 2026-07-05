// Round 8 Direction CD — Mobile PWA Installer 2.0 Batch 3/3
// V4696-V4705: PWASession + ManifestGenerator + IconSetGenerator + SWGenerator + ServiceWorkerLifecycle + PermissionManager + DeepLinkHandler + ShareTargetHandler + UsageAnalytics + Integration

import {
  InstallPromptManager, BeforeInstallPromptCapture, InstallCriteriaEvaluator,
  ManifestValidator, ServiceWorkerRegistrar, UpdatePromptManager,
  AppInstalledDetector, InstallBannerConfig, InstallCooldownTimer, InstallFunnelTracker,
  PWA_BATCH_1_ENGINES,
} from './PWACore';
import {
  CacheStrategySelector, CacheStorageAdapter, PushSubscriptionManager,
  NotificationBuilder, BackgroundSyncManager, PeriodicSyncManager,
  OfflineRequestQueue, NetworkStateDetector, AppShellRenderer, SplashScreenManager,
  PWA_BATCH_2_ENGINES,
} from './PWAAdvanced';

// V4696: PWASession — session 顶层
export interface PWASessionConfig {
  appName: string;
  appShortName: string;
  themeColor: string;
  backgroundColor: string;
  cacheName: string;
}

export class PWASession {
  readonly id: string;
  readonly config: PWASessionConfig;
  readonly installPrompt: InstallPromptManager;
  readonly beforeInstall: BeforeInstallPromptCapture;
  readonly criteria: InstallCriteriaEvaluator;
  readonly manifestValidator: ManifestValidator;
  readonly sw: ServiceWorkerRegistrar;
  readonly updatePrompt: UpdatePromptManager;
  readonly installed: AppInstalledDetector;
  readonly banner: InstallBannerConfig;
  readonly cooldown: InstallCooldownTimer;
  readonly funnel: InstallFunnelTracker;
  readonly cacheStrategy: CacheStrategySelector;
  readonly cache: CacheStorageAdapter;
  readonly push: PushSubscriptionManager;
  readonly backgroundSync: BackgroundSyncManager;
  readonly periodicSync: PeriodicSyncManager;
  readonly offlineQueue: OfflineRequestQueue;
  readonly network: NetworkStateDetector;
  readonly shell: AppShellRenderer;
  readonly splash: SplashScreenManager;
  readonly createdAt: number;

  constructor(id: string, config: PWASessionConfig) {
    this.id = id;
    this.config = config;
    this.createdAt = Date.now();
    this.installPrompt = new InstallPromptManager();
    this.beforeInstall = new BeforeInstallPromptCapture();
    this.criteria = new InstallCriteriaEvaluator();
    this.manifestValidator = new ManifestValidator();
    this.sw = new ServiceWorkerRegistrar();
    this.updatePrompt = new UpdatePromptManager();
    this.installed = new AppInstalledDetector();
    this.banner = new InstallBannerConfig();
    this.cooldown = new InstallCooldownTimer();
    this.funnel = new InstallFunnelTracker();
    this.cacheStrategy = new CacheStrategySelector();
    this.cache = new CacheStorageAdapter();
    this.push = new PushSubscriptionManager();
    this.backgroundSync = new BackgroundSyncManager();
    this.periodicSync = new PeriodicSyncManager();
    this.offlineQueue = new OfflineRequestQueue();
    this.network = new NetworkStateDetector();
    this.shell = new AppShellRenderer();
    this.splash = new SplashScreenManager();
  }

  age(): number { return Date.now() - this.createdAt; }
}

// V4697: ManifestGenerator — 自动生成 manifest.json
export class ManifestGenerator {
  generate(config: PWASessionConfig, icons: { src: string; sizes: string }[]): object {
    return {
      name: config.appName,
      short_name: config.appShortName,
      start_url: '/',
      display: 'standalone',
      theme_color: config.themeColor,
      background_color: config.backgroundColor,
      icons,
    };
  }

  toJSON(manifest: object): string {
    return JSON.stringify(manifest, null, 2);
  }
}

// V4698: IconSetGenerator — 生成多尺寸图标集
export interface IconSpec {
  size: number;
  url: string;
  purpose: 'any' | 'maskable';
}

export class IconSetGenerator {
  generate(baseUrl: string, sizes = [192, 512]): IconSpec[] {
    return sizes.map(s => ({
      size: s,
      url: `${baseUrl}/icon-${s}x${s}.png`,
      purpose: 'any' as const,
    }));
  }

  withMaskable(baseUrl: string, sizes = [192, 512]): IconSpec[] {
    const icons = this.generate(baseUrl, sizes);
    return [
      ...icons,
      ...sizes.map(s => ({
        size: s,
        url: `${baseUrl}/icon-${s}x${s}-maskable.png`,
        purpose: 'maskable' as const,
      })),
    ];
  }
}

// V4699: SWGenerator — 生成 Service Worker 脚本
export class SWGenerator {
  generate(cacheName: string, precacheUrls: string[]): string {
    return `
const CACHE_NAME = '${cacheName}';
const PRECACHE = ${JSON.stringify(precacheUrls)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});
`.trim();
  }
}

// V4700: ServiceWorkerLifecycle — SW 生命周期状态机
export type LifecyclePhase = 'parsed' | 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';

export class ServiceWorkerLifecycle {
  private _phase: LifecyclePhase = 'parsed';
  private _transitions: LifecyclePhase[] = [];

  transition(to: LifecyclePhase): boolean {
    const valid: Record<LifecyclePhase, LifecyclePhase[]> = {
      parsed: ['installing'],
      installing: ['installed', 'redundant'],
      installed: ['activating', 'redundant'],
      activating: ['activated', 'redundant'],
      activated: ['redundant'],
      redundant: [],
    };
    if (!valid[this._phase].includes(to)) return false;
    this._phase = to;
    this._transitions.push(to);
    return true;
  }

  current(): LifecyclePhase { return this._phase; }

  history(): LifecyclePhase[] { return [...this._transitions]; }

  isActive(): boolean { return this._phase === 'activated'; }
  isRedundant(): boolean { return this._phase === 'redundant'; }
}

// V4701: PermissionManager — 权限管理（notifications / geolocation / camera）
export type Permission = 'granted' | 'denied' | 'prompt' | 'unknown';

export class PermissionManager {
  private _permissions: Map<string, Permission> = new Map();

  set(name: string, status: Permission): void {
    this._permissions.set(name, status);
  }

  get(name: string): Permission {
    return this._permissions.get(name) || 'unknown';
  }

  request(name: string): boolean {
    // Simulate request: 50% granted, 50% denied
    const granted = Math.random() > 0.5;
    this._permissions.set(name, granted ? 'granted' : 'denied');
    return granted;
  }

  isGranted(name: string): boolean {
    return this._permissions.get(name) === 'granted';
  }

  isDenied(name: string): boolean {
    return this._permissions.get(name) === 'denied';
  }

  reset(): void { this._permissions.clear(); }

  all(): Record<string, Permission> {
    const out: Record<string, Permission> = {};
    this._permissions.forEach((v, k) => { out[k] = v; });
    return out;
  }
}

// V4702: DeepLinkHandler — URL deep link 路由
export interface DeepLink {
  path: string;
  params: Record<string, string>;
  timestamp: number;
}

export class DeepLinkHandler {
  private _handlers: Map<string, (link: DeepLink) => void> = new Map();
  private _history: DeepLink[] = [];

  register(pattern: string, handler: (link: DeepLink) => void): void {
    this._handlers.set(pattern, handler);
  }

  handle(url: string): DeepLink | null {
    if (!url) return null;
    const [path, query] = url.split('?');
    const params: Record<string, string> = {};
    if (query) query.split('&').forEach(p => {
      const [k, v] = p.split('=');
      params[k] = decodeURIComponent(v || '');
    });
    const link: DeepLink = { path: path || '/', params, timestamp: Date.now() };
    this._history.push(link);
    for (const [pattern, handler] of this._handlers) {
      if (path?.includes(pattern)) {
        handler(link);
        break;
      }
    }
    return link;
  }

  history(): DeepLink[] { return [...this._history]; }

  patterns(): string[] { return Array.from(this._handlers.keys()); }
}

// V4703: ShareTargetHandler — Web Share Target API
export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: { name: string; type: string; size: number }[];
}

export class ShareTargetHandler {
  private _supported = false;
  private _handler: ((data: ShareData) => void) | null = null;

  setSupported(s: boolean): void { this._supported = s; }
  isSupported(): boolean { return this._supported; }

  setHandler(h: (data: ShareData) => void): void { this._handler = h; }

  share(data: ShareData): boolean {
    if (!this._supported || !this._handler) return false;
    this._handler(data);
    return true;
  }

  validate(data: ShareData): string[] {
    const errors: string[] = [];
    if (!data.title && !data.text && !data.url) errors.push('at least one of title/text/url required');
    if (data.url && !/^https?:\/\//.test(data.url)) errors.push('invalid url');
    return errors;
  }
}

// V4704: UsageAnalytics — PWA 使用分析
export class UsageAnalytics {
  private _events: { name: string; timestamp: number; metadata?: Record<string, string> }[] = [];

  track(name: string, metadata?: Record<string, string>): void {
    this._events.push({ name, timestamp: Date.now(), metadata });
  }

  count(name: string): number {
    return this._events.filter(e => e.name === name).length;
  }

  recent(n: number): { name: string; timestamp: number }[] {
    return this._events.slice(-n).map(e => ({ name: e.name, timestamp: e.timestamp }));
  }

  uniqueEventNames(): string[] {
    return Array.from(new Set(this._events.map(e => e.name)));
  }

  reset(): void { this._events = []; }
  totalEvents(): number { return this._events.length; }
}

// V4705: PWAIntegration — 顶层集成 + 端到端 demo
export class PWAIntegration {
  private _session: PWASession;
  private _manifestGenerator: ManifestGenerator;
  private _iconGenerator: IconSetGenerator;
  private _swGenerator: SWGenerator;
  private _lifecycle: ServiceWorkerLifecycle;
  private _permissions: PermissionManager;
  private _deepLink: DeepLinkHandler;
  private _shareTarget: ShareTargetHandler;
  private _analytics: UsageAnalytics;

  constructor(config: PWASessionConfig) {
    this._session = new PWASession(`pwa-${Date.now()}`, config);
    this._manifestGenerator = new ManifestGenerator();
    this._iconGenerator = new IconSetGenerator();
    this._swGenerator = new SWGenerator();
    this._lifecycle = new ServiceWorkerLifecycle();
    this._permissions = new PermissionManager();
    this._deepLink = new DeepLinkHandler();
    this._shareTarget = new ShareTargetHandler();
    this._analytics = new UsageAnalytics();
  }

  runDemo(): {
    manifest: object;
    swScript: string;
    icons: number;
    lifecyclePhase: string;
    permissionGranted: number;
    analyticsEvents: number;
  } {
    // Generate manifest
    const icons = this._iconGenerator.generate('/icons', [192, 512]);
    const manifest = this._manifestGenerator.generate(this._session.config, icons);

    // Generate SW
    const swScript = this._swGenerator.generate(this._session.config.cacheName, ['/', '/index.html', '/manifest.json']);

    // Lifecycle progression
    this._lifecycle.transition('installing');
    this._lifecycle.transition('installed');
    this._lifecycle.transition('activating');
    this._lifecycle.transition('activated');

    // Permissions
    this._permissions.set('notifications', 'granted');
    this._permissions.set('geolocation', 'prompt');

    // Analytics events
    this._analytics.track('app_open');
    this._analytics.track('page_view', { page: '/' });
    this._analytics.track('install_prompt_shown');

    // Deep link
    this._deepLink.handle('/article/123?from=email');

    return {
      manifest,
      swScript,
      icons: icons.length,
      lifecyclePhase: this._lifecycle.current(),
      permissionGranted: this._permissions.isGranted('notifications') ? 1 : 0,
      analyticsEvents: this._analytics.totalEvents(),
    };
  }

  session(): PWASession { return this._session; }
  manifestGenerator(): ManifestGenerator { return this._manifestGenerator; }
  iconGenerator(): IconSetGenerator { return this._iconGenerator; }
  swGenerator(): SWGenerator { return this._swGenerator; }
  lifecycle(): ServiceWorkerLifecycle { return this._lifecycle; }
  permissions(): PermissionManager { return this._permissions; }
  deepLink(): DeepLinkHandler { return this._deepLink; }
  shareTarget(): ShareTargetHandler { return this._shareTarget; }
  analytics(): UsageAnalytics { return this._analytics; }
}

export const PWA_BATCH_3_ENGINES: readonly string[] = [
  'PWASession', 'ManifestGenerator', 'IconSetGenerator', 'SWGenerator',
  'ServiceWorkerLifecycle', 'PermissionManager', 'DeepLinkHandler',
  'ShareTargetHandler', 'UsageAnalytics', 'PWAIntegration',
];

export class PWAIntegrationIndex {
  list(): string[] { return [...PWA_BATCH_3_ENGINES, 'PWAIntegrationIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}

export class PWAMasterIndex {
  list(): string[] {
    return [...PWA_BATCH_1_ENGINES, ...PWA_BATCH_2_ENGINES, ...PWA_BATCH_3_ENGINES, 'PWAMasterIndex'];
  }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}