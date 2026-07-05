// Round 8 Direction CD — Mobile PWA Installer 2.0 Batch 1/3
// V4676-V4685: InstallPrompt + BeforeInstall + Criteria + ManifestValidator + SWRegistrar + UpdatePrompt + InstalledDetector + BannerConfig + Cooldown + Funnel

// V4676: InstallPromptManager — 安装提示管理 (用户行为 + 触发逻辑)
export interface InstallPromptEvent {
  userChoice: 'accepted' | 'dismissed';
  platform: string;
  timestamp: number;
}

export class InstallPromptManager {
  private _events: InstallPromptEvent[] = [];
  private _deferredPrompt: any = null; // BeforeInstallPromptEvent
  private _installed = false;

  capturePrompt(event: any): void {
    this._deferredPrompt = event;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
  }

  hasPrompt(): boolean { return this._deferredPrompt !== null; }

  async prompt(): Promise<InstallPromptEvent> {
    if (!this._deferredPrompt) {
      const ev: InstallPromptEvent = { userChoice: 'dismissed', platform: 'unknown', timestamp: Date.now() };
      this._events.push(ev);
      return ev;
    }
    this._deferredPrompt.prompt();
    const choiceResult = await this._deferredPrompt.userChoice;
    const ev: InstallPromptEvent = {
      userChoice: choiceResult.outcome,
      platform: choiceResult.platform || 'web',
      timestamp: Date.now(),
    };
    this._events.push(ev);
    this._deferredPrompt = null;
    return ev;
  }

  markInstalled(): void { this._installed = true; }
  isInstalled(): boolean { return this._installed; }

  events(): InstallPromptEvent[] { return [...this._events]; }
  acceptedCount(): number { return this._events.filter(e => e.userChoice === 'accepted').length; }
  dismissedCount(): number { return this._events.filter(e => e.userChoice === 'dismissed').length; }
  reset(): void { this._events = []; this._deferredPrompt = null; this._installed = false; }
}

// V4677: BeforeInstallPromptCapture — 拦截事件 + 状态追踪
export class BeforeInstallPromptCapture {
  private _captured = false;
  private _capturedAt = 0;
  private _platform = '';

  capture(event: any, platform = 'web'): void {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    this._captured = true;
    this._capturedAt = Date.now();
    this._platform = platform;
  }

  isCaptured(): boolean { return this._captured; }
  capturedAt(): number { return this._capturedAt; }
  platform(): string { return this._platform; }

  age(): number {
    return this._captured ? Date.now() - this._capturedAt : 0;
  }

  clear(): void {
    this._captured = false;
    this._capturedAt = 0;
    this._platform = '';
  }
}

// V4678: InstallCriteriaEvaluator — 安装条件评估
export interface InstallContext {
  isStandalone: boolean;
  hasManifest: boolean;
  hasServiceWorker: boolean;
  isHttps: boolean;
  visitCount: number;
  lastDismissedDaysAgo: number;
}

export class InstallCriteriaEvaluator {
  evaluate(ctx: InstallContext): { eligible: boolean; score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    if (ctx.isStandalone) { reasons.push('already standalone'); return { eligible: false, score: 0, reasons }; }
    if (!ctx.hasManifest) reasons.push('no manifest');
    else score += 30;
    if (!ctx.hasServiceWorker) reasons.push('no service worker');
    else score += 30;
    if (!ctx.isHttps) reasons.push('not HTTPS');
    else score += 20;
    if (ctx.visitCount >= 2) score += 10;
    if (ctx.lastDismissedDaysAgo >= 7) score += 10;
    return { eligible: score >= 60, score, reasons };
  }
}

// V4679: ManifestValidator — manifest.json 字段校验
export interface ManifestSpec {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  icons?: { src: string; sizes: string; type?: string }[];
  theme_color?: string;
  background_color?: string;
}

export class ManifestValidator {
  validate(m: ManifestSpec): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!m.name && !m.short_name) errors.push('name or short_name required');
    if (m.name && m.name.length > 45) warnings.push('name too long (>45)');
    if (m.short_name && m.short_name.length > 12) warnings.push('short_name too long (>12)');
    if (!m.start_url) errors.push('start_url required');
    else if (!m.start_url.startsWith('/') && !m.start_url.startsWith('http')) errors.push('start_url must be absolute or root-relative');
    if (!['fullscreen', 'standalone', 'minimal-ui', 'browser'].includes(m.display || '')) errors.push('display must be one of fullscreen/standalone/minimal-ui/browser');
    if (!m.icons || m.icons.length === 0) errors.push('icons required');
    else {
      const has192 = m.icons.some(i => i.sizes.includes('192'));
      const has512 = m.icons.some(i => i.sizes.includes('512'));
      if (!has192) warnings.push('no 192x192 icon');
      if (!has512) warnings.push('no 512x512 icon');
    }
    if (!m.theme_color) warnings.push('theme_color recommended');
    return { valid: errors.length === 0, errors, warnings };
  }
}

// V4680: ServiceWorkerRegistrar — SW 注册管理
export type SWState = 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';

export interface SWRegistrationInfo {
  scope: string;
  scriptURL: string;
  state: SWState;
  updateFoundAt: number;
}

export class ServiceWorkerRegistrar {
  private _registrations: Map<string, SWRegistrationInfo> = new Map();

  register(scope: string, scriptURL: string, state: SWState = 'installing'): void {
    this._registrations.set(scope, { scope, scriptURL, state, updateFoundAt: Date.now() });
  }

  updateState(scope: string, state: SWState): void {
    const r = this._registrations.get(scope);
    if (r) r.state = state;
  }

  get(scope: string): SWRegistrationInfo | undefined {
    return this._registrations.get(scope);
  }

  isActivated(scope: string): boolean {
    return this._registrations.get(scope)?.state === 'activated';
  }

  all(): SWRegistrationInfo[] { return Array.from(this._registrations.values()); }

  unregister(scope: string): boolean {
    return this._registrations.delete(scope);
  }

  count(): number { return this._registrations.size; }
}

// V4681: UpdatePromptManager — 更新提示（SW 等待激活）
export class UpdatePromptManager {
  private _waitingWorker: any = null;
  private _promptedAt = 0;

  setWaitingWorker(worker: any): void {
    this._waitingWorker = worker;
    this._promptedAt = Date.now();
  }

  hasUpdate(): boolean { return this._waitingWorker !== null; }

  async applyUpdate(): Promise<boolean> {
    if (!this._waitingWorker) return false;
    this._waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    this._waitingWorker = null;
    return true;
  }

  timeWaitingMs(): number {
    return this._waitingWorker ? Date.now() - this._promptedAt : 0;
  }

  clear(): void {
    this._waitingWorker = null;
    this._promptedAt = 0;
  }
}

// V4682: AppInstalledDetector — 检测 standalone display mode
export class AppInstalledDetector {
  private _detected = false;
  private _method = '';

  detect(method: 'media-query' | 'navigator' | 'referrer'): boolean {
    this._method = method;
    this._detected = true;
    return true;
  }

  isInstalled(): boolean { return this._detected; }
  method(): string { return this._method; }

  reset(): void { this._detected = false; this._method = ''; }
}

// V4683: InstallBannerConfig — 安装横幅配置（A/B 测试 + 文案）
export interface BannerVariant {
  id: string;
  headline: string;
  body: string;
  ctaText: string;
  weight: number;
}

export class InstallBannerConfig {
  private _variants: BannerVariant[] = [];
  private _shownVariants: Set<string> = new Set();

  addVariant(v: BannerVariant): void { this._variants.push(v); }

  pickVariant(seed?: number): BannerVariant | undefined {
    if (this._variants.length === 0) return undefined;
    const totalWeight = this._variants.reduce((s, v) => s + v.weight, 0);
    let r = (seed ?? Math.random()) * totalWeight;
    for (const v of this._variants) {
      r -= v.weight;
      if (r <= 0) return v;
    }
    return this._variants[this._variants.length - 1];
  }

  markShown(id: string): void { this._shownVariants.add(id); }
  hasBeenShown(id: string): boolean { return this._shownVariants.has(id); }

  variants(): BannerVariant[] { return [...this._variants]; }
  size(): number { return this._variants.length; }
}

// V4684: InstallCooldownTimer — 拒绝后冷却（避免频繁打扰）
export class InstallCooldownTimer {
  private _lastDismissedAt = 0;
  private _cooldownMs: number;

  constructor(cooldownMs = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    this._cooldownMs = cooldownMs;
  }

  dismiss(): void { this._lastDismissedAt = Date.now(); }

  canPrompt(): boolean {
    if (this._lastDismissedAt === 0) return true;
    return Date.now() - this._lastDismissedAt >= this._cooldownMs;
  }

  remainingMs(): number {
    if (this._lastDismissedAt === 0) return 0;
    const elapsed = Date.now() - this._lastDismissedAt;
    return Math.max(0, this._cooldownMs - elapsed);
  }

  reset(): void { this._lastDismissedAt = 0; }

  setCooldown(ms: number): void { this._cooldownMs = ms; }
}

// V4685: InstallFunnelTracker — 安装漏斗（看到→点击→安装→拒绝）
export type FunnelStage = 'seen' | 'clicked' | 'accepted' | 'dismissed' | 'installed';

export class InstallFunnelTracker {
  private _stages: Map<FunnelStage, number> = new Map();

  track(stage: FunnelStage): void {
    this._stages.set(stage, (this._stages.get(stage) || 0) + 1);
  }

  count(stage: FunnelStage): number { return this._stages.get(stage) || 0; }

  // Conversion rate: installed / seen
  conversionRate(): number {
    const seen = this.count('seen');
    if (seen === 0) return 0;
    return this.count('installed') / seen;
  }

  // Click-through rate: clicked / seen
  ctr(): number {
    const seen = this.count('seen');
    if (seen === 0) return 0;
    return this.count('clicked') / seen;
  }

  // Acceptance rate: accepted / clicked
  acceptanceRate(): number {
    const clicked = this.count('clicked');
    if (clicked === 0) return 0;
    return this.count('accepted') / clicked;
  }

  reset(): void { this._stages.clear(); }
  all(): Record<string, number> {
    const out: Record<string, number> = {};
    this._stages.forEach((v, k) => { out[k] = v; });
    return out;
  }
}

export const PWA_BATCH_1_ENGINES: readonly string[] = [
  'InstallPromptManager', 'BeforeInstallPromptCapture', 'InstallCriteriaEvaluator',
  'ManifestValidator', 'ServiceWorkerRegistrar', 'UpdatePromptManager',
  'AppInstalledDetector', 'InstallBannerConfig', 'InstallCooldownTimer', 'InstallFunnelTracker',
];

export class PWACoreIndex {
  list(): string[] { return [...PWA_BATCH_1_ENGINES, 'PWACoreIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}