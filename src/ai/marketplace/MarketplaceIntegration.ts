// Round 8 Direction CI — Marketplace for Plugins 2.0 Batch 3/3 (Integration)
// V4846-V4855: SellerAccount + BuyerDashboard + Wishlist + ComparisonTool + SearchFilter
//            + RevenueAnalytics + PluginInstaller + AutoUpdater + CompatibilityMatrix + MarketplaceMasterIndex
// 3-files × 10-engines pattern (P-97)

import { MarketplaceCore, Category } from './MarketplaceCore';
import { ReviewSystem, RatingEngine, RecommendationEngine } from './MarketplaceAdvanced';

export type SellerTier = 'new' | 'verified' | 'partner' | 'enterprise';
export type InstallStatus = 'pending' | 'installing' | 'installed' | 'failed' | 'disabled';
export type UpdateChannel = 'stable' | 'beta' | 'nightly';
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'year';

// V4846: SellerAccount — seller profile + verification + payouts
export class SellerAccount {
  private _accounts: Map<string, { sellerId: string; tier: SellerTier; payoutTotal: number; verified: boolean; joinedAt: number }> = new Map();

  register(sellerId: string): boolean {
    if (this._accounts.has(sellerId)) return false;
    this._accounts.set(sellerId, { sellerId, tier: 'new', payoutTotal: 0, verified: false, joinedAt: Date.now() });
    return true;
  }

  verify(sellerId: string): boolean {
    const a = this._accounts.get(sellerId);
    if (!a) return false;
    a.verified = true;
    a.tier = 'verified';
    return true;
  }

  promote(sellerId: string, tier: SellerTier): boolean {
    const a = this._accounts.get(sellerId);
    if (!a) return false;
    a.tier = tier;
    return true;
  }

  recordPayout(sellerId: string, amount: number): boolean {
    const a = this._accounts.get(sellerId);
    if (!a) return false;
    a.payoutTotal += amount;
    return true;
  }

  getAccount(sellerId: string): { sellerId: string; tier: SellerTier; payoutTotal: number; verified: boolean; joinedAt: number } | undefined {
    return this._accounts.get(sellerId);
  }

  isVerified(sellerId: string): boolean {
    return this._accounts.get(sellerId)?.verified || false;
  }

  sellerCount(): number { return this._accounts.size; }

  byTier(tier: SellerTier): string[] {
    return Array.from(this._accounts.entries()).filter(([, a]) => a.tier === tier).map(([id]) => id);
  }
}

// V4847: BuyerDashboard — purchase history + recommendations + stats
export class BuyerDashboard {
  private _purchases: { buyerId: string; pluginId: string; price: number; currency: string; date: number }[] = [];
  private _viewedPlugins: Map<string, Set<string>> = new Map();

  recordPurchase(buyerId: string, pluginId: string, price: number, currency: string = 'USD'): void {
    this._purchases.push({ buyerId, pluginId, price, currency, date: Date.now() });
  }

  recordView(buyerId: string, pluginId: string): void {
    if (!this._viewedPlugins.has(buyerId)) this._viewedPlugins.set(buyerId, new Set());
    this._viewedPlugins.get(buyerId)!.add(pluginId);
  }

  history(buyerId: string): { pluginId: string; price: number; currency: string; date: number }[] {
    return this._purchases.filter(p => p.buyerId === buyerId);
  }

  totalSpent(buyerId: string, currency: string = 'USD'): number {
    return this._purchases
      .filter(p => p.buyerId === buyerId && p.currency === currency)
      .reduce((s, p) => s + p.price, 0);
  }

  recentlyViewed(buyerId: string): string[] {
    return Array.from(this._viewedPlugins.get(buyerId) || []);
  }

  purchaseCount(buyerId: string): number {
    return this._purchases.filter(p => p.buyerId === buyerId).length;
  }
}

// V4848: Wishlist — saved for later + price drop alerts
export class Wishlist {
  private _items: Map<string, { pluginId: string; addedAt: number; priceAlert: number | null }[]> = new Map();

  add(buyerId: string, pluginId: string, priceAlert: number | null = null): this {
    if (!this._items.has(buyerId)) this._items.set(buyerId, []);
    const list = this._items.get(buyerId)!;
    if (!list.find(i => i.pluginId === pluginId)) {
      list.push({ pluginId, addedAt: Date.now(), priceAlert });
    }
    return this;
  }

  remove(buyerId: string, pluginId: string): this {
    const list = this._items.get(buyerId);
    if (list) this._items.set(buyerId, list.filter(i => i.pluginId !== pluginId));
    return this;
  }

  setPriceAlert(buyerId: string, pluginId: string, price: number): this {
    const list = this._items.get(buyerId);
    const item = list?.find(i => i.pluginId === pluginId);
    if (item) item.priceAlert = price;
    return this;
  }

  items(buyerId: string): { pluginId: string; addedAt: number; priceAlert: number | null }[] {
    return [...(this._items.get(buyerId) || [])];
  }

  has(buyerId: string, pluginId: string): boolean {
    return this._items.get(buyerId)?.some(i => i.pluginId === pluginId) || false;
  }

  checkPriceDrops(currentPrices: Map<string, number>): { buyerId: string; pluginId: string; oldPrice: number; newPrice: number }[] {
    const drops: { buyerId: string; pluginId: string; oldPrice: number; newPrice: number }[] = [];
    for (const [buyerId, items] of this._items.entries()) {
      for (const item of items) {
        if (item.priceAlert !== null && currentPrices.has(item.pluginId)) {
          const current = currentPrices.get(item.pluginId)!;
          if (current <= item.priceAlert) {
            drops.push({ buyerId, pluginId: item.pluginId, oldPrice: item.priceAlert, newPrice: current });
          }
        }
      }
    }
    return drops;
  }
}

// V4849: ComparisonTool — side-by-side plugin comparison
export class ComparisonTool {
  private _items: string[] = [];
  private _maxItems: number = 4;

  setMax(n: number): this { this._maxItems = Math.max(2, Math.min(8, n)); return this; }

  add(pluginId: string): this {
    if (this._items.length >= this._maxItems) return this;
    if (!this._items.includes(pluginId)) this._items.push(pluginId);
    return this;
  }

  remove(pluginId: string): this {
    this._items = this._items.filter(id => id !== pluginId);
    return this;
  }

  clear(): this {
    this._items = [];
    return this;
  }

  items(): string[] {
    return [...this._items];
  }

  count(): number { return this._items.length; }

  // Generate comparison matrix
  compare(pluginData: Map<string, Record<string, string | number>>): Record<string, Record<string, string | number>> {
    const result: Record<string, Record<string, string | number>> = {};
    for (const id of this._items) {
      result[id] = pluginData.get(id) || {};
    }
    return result;
  }
}

// V4850: SearchFilter — multi-faceted search with filters
export class SearchFilter {
  private _query: string = '';
  private _category: string | null = null;
  private _minPrice: number | null = null;
  private _maxPrice: number | null = null;
  private _minRating: number | null = null;
  private _tags: Set<string> = new Set();
  private _sortBy: 'relevance' | 'price' | 'rating' | 'newest' = 'relevance';

  setQuery(q: string): this { this._query = q.toLowerCase(); return this; }
  setCategory(c: string | null): this { this._category = c; return this; }
  setPriceRange(min: number | null, max: number | null): this {
    this._minPrice = min;
    this._maxPrice = max;
    return this;
  }
  setMinRating(r: number | null): this { this._minRating = r !== null ? Math.max(0, Math.min(5, r)) : null; return this; }
  addTag(tag: string): this { this._tags.add(tag.toLowerCase()); return this; }
  removeTag(tag: string): this { this._tags.delete(tag.toLowerCase()); return this; }
  setSortBy(s: 'relevance' | 'price' | 'rating' | 'newest'): this { this._sortBy = s; return this; }

  filter(plugins: { id: string; name: string; category: string; price: number; rating: number; tags: string[]; createdAt: number }[]): { id: string; name: string; category: string; price: number; rating: number; tags: string[]; createdAt: number }[] {
    let result = plugins.filter(p => {
      if (this._query && !p.name.toLowerCase().includes(this._query)) return false;
      if (this._category && p.category !== this._category) return false;
      if (this._minPrice !== null && p.price < this._minPrice) return false;
      if (this._maxPrice !== null && p.price > this._maxPrice) return false;
      if (this._minRating !== null && p.rating < this._minRating) return false;
      if (this._tags.size > 0) {
        const pluginTagsLower = p.tags.map(t => t.toLowerCase());
        for (const tag of this._tags) {
          if (!pluginTagsLower.includes(tag)) return false;
        }
      }
      return true;
    });
    if (this._sortBy === 'price') result.sort((a, b) => a.price - b.price);
    else if (this._sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (this._sortBy === 'newest') result.sort((a, b) => b.createdAt - a.createdAt);
    return result;
  }
}

// V4851: RevenueAnalytics — sales metrics + time series
export class RevenueAnalytics {
  private _sales: { pluginId: string; sellerId: string; amount: number; date: number; currency: string }[] = [];

  recordSale(pluginId: string, sellerId: string, amount: number, currency: string = 'USD'): void {
    this._sales.push({ pluginId, sellerId, amount, currency, date: Date.now() });
  }

  totalRevenue(sellerId: string | null = null, currency: string | null = null): number {
    return this._sales
      .filter(s => (!sellerId || s.sellerId === sellerId) && (!currency || s.currency === currency))
      .reduce((sum, s) => sum + s.amount, 0);
  }

  topSellers(limit: number = 10, currency: string = 'USD'): { sellerId: string; revenue: number }[] {
    const bySeller = new Map<string, number>();
    this._sales.filter(s => s.currency === currency).forEach(s => {
      bySeller.set(s.sellerId, (bySeller.get(s.sellerId) || 0) + s.amount);
    });
    return Array.from(bySeller.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([sellerId, revenue]) => ({ sellerId, revenue }));
  }

  topPlugins(limit: number = 10): { pluginId: string; revenue: number; sales: number }[] {
    const byPlugin = new Map<string, { revenue: number; sales: number }>();
    this._sales.forEach(s => {
      const cur = byPlugin.get(s.pluginId) || { revenue: 0, sales: 0 };
      cur.revenue += s.amount;
      cur.sales += 1;
      byPlugin.set(s.pluginId, cur);
    });
    return Array.from(byPlugin.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, limit)
      .map(([pluginId, info]) => ({ pluginId, ...info }));
  }

  byPeriod(period: AnalyticsPeriod, currency: string = 'USD'): { period: string; revenue: number }[] {
    const now = Date.now();
    const periodMs = { day: 86400000, week: 604800000, month: 2592000000, year: 31536000000 }[period];
    const buckets = new Map<string, number>();
    this._sales.filter(s => s.currency === currency).forEach(s => {
      const bucketIndex = Math.floor((now - s.date) / periodMs);
      const key = `${period}_${bucketIndex}`;
      buckets.set(key, (buckets.get(key) || 0) + s.amount);
    });
    return Array.from(buckets.entries()).map(([period, revenue]) => ({ period, revenue }));
  }

  saleCount(): number { return this._sales.length; }
}

// V4852: PluginInstaller — install/uninstall lifecycle
export class PluginInstaller {
  private _installs: Map<string, { pluginId: string; version: string; status: InstallStatus; installedAt: number | null }> = new Map();

  install(pluginId: string, version: string): { status: InstallStatus; startedAt: number } {
    this._installs.set(pluginId, { pluginId, version, status: 'installing', installedAt: null });
    return { status: 'installing', startedAt: Date.now() };
  }

  complete(pluginId: string, success: boolean = true): boolean {
    const inst = this._installs.get(pluginId);
    if (!inst) return false;
    inst.status = success ? 'installed' : 'failed';
    if (success) inst.installedAt = Date.now();
    return true;
  }

  uninstall(pluginId: string): boolean {
    const inst = this._installs.get(pluginId);
    if (!inst) return false;
    this._installs.delete(pluginId);
    return true;
  }

  disable(pluginId: string): boolean {
    const inst = this._installs.get(pluginId);
    if (!inst) return false;
    inst.status = 'disabled';
    return true;
  }

  enable(pluginId: string): boolean {
    const inst = this._installs.get(pluginId);
    if (!inst) return false;
    inst.status = 'installed';
    return true;
  }

  status(pluginId: string): InstallStatus | null {
    return this._installs.get(pluginId)?.status || null;
  }

  isInstalled(pluginId: string): boolean {
    return this._installs.get(pluginId)?.status === 'installed';
  }

  installedList(): string[] {
    return Array.from(this._installs.entries())
      .filter(([, i]) => i.status === 'installed')
      .map(([id]) => id);
  }

  count(): number { return this._installs.size; }
}

// V4853: AutoUpdater — check for updates + auto-apply
export class AutoUpdater {
  private _installedVersions: Map<string, string> = new Map();
  private _availableVersions: Map<string, string> = new Map();
  private _channel: UpdateChannel = 'stable';
  private _autoUpdateEnabled: boolean = true;

  setInstalled(pluginId: string, version: string): this { this._installedVersions.set(pluginId, version); return this; }
  setAvailable(pluginId: string, version: string): this { this._availableVersions.set(pluginId, version); return this; }
  setChannel(c: UpdateChannel): this { this._channel = c; return this; }
  setAutoUpdate(enabled: boolean): this { this._autoUpdateEnabled = enabled; return this; }

  hasUpdate(pluginId: string): boolean {
    const installed = this._installedVersions.get(pluginId);
    const available = this._availableVersions.get(pluginId);
    if (!installed || !available) return false;
    return available !== installed && this._compareVersions(available, installed) > 0;
  }

  updatesAvailable(): string[] {
    return Array.from(this._installedVersions.keys()).filter(id => this.hasUpdate(id));
  }

  update(pluginId: string): boolean {
    if (!this._autoUpdateEnabled) return false;
    if (!this.hasUpdate(pluginId)) return false;
    const v = this._availableVersions.get(pluginId)!;
    this._installedVersions.set(pluginId, v);
    return true;
  }

  updateAll(): number {
    if (!this._autoUpdateEnabled) return 0;
    let count = 0;
    for (const id of this.updatesAvailable()) {
      if (this.update(id)) count++;
    }
    return count;
  }

  installedVersion(pluginId: string): string | undefined {
    return this._installedVersions.get(pluginId);
  }

  channel(): UpdateChannel { return this._channel; }
  autoUpdateEnabled(): boolean { return this._autoUpdateEnabled; }

  private _compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const ap = aParts[i] || 0;
      const bp = bParts[i] || 0;
      if (ap > bp) return 1;
      if (ap < bp) return -1;
    }
    return 0;
  }
}

// V4854: CompatibilityMatrix — plugin × platform/dependency compatibility
export class CompatibilityMatrix {
  private _matrix: Map<string, Map<string, 'compatible' | 'incompatible' | 'unknown' | 'partial'>> = new Map();
  private _plugins: Set<string> = new Set();
  private _platforms: Set<string> = new Set();

  addPlugin(pluginId: string): this { this._plugins.add(pluginId); if (!this._matrix.has(pluginId)) this._matrix.set(pluginId, new Map()); return this; }
  addPlatform(platform: string): this { this._platforms.add(platform); return this; }

  setCompatibility(pluginId: string, platform: string, status: 'compatible' | 'incompatible' | 'unknown' | 'partial'): this {
    if (!this._matrix.has(pluginId)) this._matrix.set(pluginId, new Map());
    this._matrix.get(pluginId)!.set(platform, status);
    return this;
  }

  getCompatibility(pluginId: string, platform: string): 'compatible' | 'incompatible' | 'unknown' | 'partial' {
    return this._matrix.get(pluginId)?.get(platform) || 'unknown';
  }

  isCompatible(pluginId: string, platform: string): boolean {
    return this.getCompatibility(pluginId, platform) === 'compatible';
  }

  // Check if a set of plugins is mutually compatible on a platform
  allCompatible(pluginIds: string[], platform: string): boolean {
    return pluginIds.every(id => this.isCompatible(id, platform));
  }

  // Find conflicting pairs
  conflicts(platform: string): [string, string][] {
    const conflicts: [string, string][] = [];
    const plugins = Array.from(this._plugins);
    for (let i = 0; i < plugins.length; i++) {
      for (let j = i + 1; j < plugins.length; j++) {
        const a = this.getCompatibility(plugins[i], platform);
        const b = this.getCompatibility(plugins[j], platform);
        if (a === 'incompatible' && b === 'incompatible') {
          conflicts.push([plugins[i], plugins[j]]);
        }
      }
    }
    return conflicts;
  }

  pluginCount(): number { return this._plugins.size; }
  platformCount(): number { return this._platforms.size; }
}

// V4855: MarketplaceIntegration — orchestrator
export class MarketplaceIntegration {
  private _core: MarketplaceCore = new MarketplaceCore();
  private _reviews: ReviewSystem = new ReviewSystem();
  private _ratings: RatingEngine = new RatingEngine();
  private _recs: RecommendationEngine = new RecommendationEngine();
  private _wishlist: Wishlist = new Wishlist();
  private _installer: PluginInstaller = new PluginInstaller();
  private _analytics: RevenueAnalytics = new RevenueAnalytics();
  private _history: { type: string; payload: Record<string, unknown>; ts: number }[] = [];

  core(): MarketplaceCore { return this._core; }
  reviews(): ReviewSystem { return this._reviews; }
  ratings(): RatingEngine { return this._ratings; }
  recs(): RecommendationEngine { return this._recs; }
  wishlist(): Wishlist { return this._wishlist; }
  installer(): PluginInstaller { return this._installer; }
  analytics(): RevenueAnalytics { return this._analytics; }

  record(type: string, payload: Record<string, unknown>): void {
    this._history.push({ type, payload, ts: Date.now() });
  }

  history(): { type: string; payload: Record<string, unknown>; ts: number }[] {
    return [...this._history];
  }

  // End-to-end: purchase → install → review
  purchase(buyerId: string, pluginId: string, amount: number): { installed: boolean } {
    const seller = this._core.getPlugin(pluginId)?.sellerId || 'unknown';
    this._analytics.recordSale(pluginId, seller, amount);
    this._installer.install(pluginId, '1.0.0');
    this._installer.complete(pluginId, true);
    this._recs.record(buyerId, pluginId);
    this.record('purchase', { buyerId, pluginId, amount });
    return { installed: this._installer.isInstalled(pluginId) };
  }
}

// V4846-V4855: CI Batch 3/3 Index
export const CI_BATCH_3_ENGINES = [
  'SellerAccount', 'BuyerDashboard', 'Wishlist', 'ComparisonTool', 'SearchFilter',
  'RevenueAnalytics', 'PluginInstaller', 'AutoUpdater', 'CompatibilityMatrix', 'MarketplaceIntegration'
] as const;

export class MarketplaceIntegrationIndex {
  list(): string[] {
    return [...CI_BATCH_3_ENGINES];
  }

  count(): number {
    return CI_BATCH_3_ENGINES.length;
  }

  engines(): string[] {
    return [...CI_BATCH_3_ENGINES];
  }

  has(name: string): boolean {
    return CI_BATCH_3_ENGINES.includes(name as typeof CI_BATCH_3_ENGINES[number]);
  }
}

// CI 30 engines Master Index
import { CI_BATCH_1_ENGINES as CI_BATCH_1_ENGINES_FROM_IMPORT } from './MarketplaceCore';
import { CI_BATCH_2_ENGINES as CI_BATCH_2_ENGINES_FROM_IMPORT } from './MarketplaceAdvanced';

export const CI_ALL_ENGINES = [
  ...CI_BATCH_1_ENGINES_FROM_IMPORT,
  ...CI_BATCH_2_ENGINES_FROM_IMPORT,
  ...CI_BATCH_3_ENGINES
] as const;

export class MarketplaceMasterIndex {
  list(): string[] {
    return [...CI_BATCH_1_ENGINES_FROM_IMPORT, ...CI_BATCH_2_ENGINES_FROM_IMPORT, ...CI_BATCH_3_ENGINES];
  }

  count(): number {
    return CI_BATCH_1_ENGINES_FROM_IMPORT.length + CI_BATCH_2_ENGINES_FROM_IMPORT.length + CI_BATCH_3_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return (CI_BATCH_1_ENGINES_FROM_IMPORT as readonly string[]).includes(name)
      || (CI_BATCH_2_ENGINES_FROM_IMPORT as readonly string[]).includes(name)
      || (CI_BATCH_3_ENGINES as readonly string[]).includes(name);
  }
}