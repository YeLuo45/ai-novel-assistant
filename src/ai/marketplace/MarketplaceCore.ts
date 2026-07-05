// Round 8 Direction CI — Marketplace for Plugins 2.0 Batch 1/3 (Core)
// V4826-V4835: MarketplaceCore + StoreFront + PluginListing + Category + PricingTier
//            + SubscriptionModel + PaymentProcessor + InvoiceGenerator + LicenseKey + ReceiptTracker
// 3-files × 10-engines pattern (P-97)

export type PricingModel = 'one-time' | 'subscription' | 'freemium' | 'pay-what-you-want' | 'tiered';
export type SubscriptionInterval = 'monthly' | 'quarterly' | 'annual' | 'lifetime';
export type PaymentMethod = 'credit-card' | 'paypal' | 'crypto' | 'bank-transfer' | 'apple-pay' | 'google-pay';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'BTC' | 'ETH';
export type LicenseType = 'mit' | 'apache' | 'gpl' | 'commercial' | 'proprietary' | 'creative-commons';

// V4826: MarketplaceCore — central marketplace registry
export class MarketplaceCore {
  private _plugins: Map<string, { sellerId: string; price: number; currency: Currency }> = new Map();
  private _sellers: Set<string> = new Set();
  private _totalRevenue: Map<Currency, number> = new Map();

  registerPlugin(pluginId: string, sellerId: string, price: number, currency: Currency = 'USD'): boolean {
    if (this._plugins.has(pluginId)) return false;
    this._plugins.set(pluginId, { sellerId, price, currency });
    this._sellers.add(sellerId);
    return true;
  }

  unregisterPlugin(pluginId: string): boolean {
    const p = this._plugins.get(pluginId);
    if (!p) return false;
    this._plugins.delete(pluginId);
    return true;
  }

  hasPlugin(pluginId: string): boolean {
    return this._plugins.has(pluginId);
  }

  getPlugin(pluginId: string): { sellerId: string; price: number; currency: Currency } | undefined {
    return this._plugins.get(pluginId);
  }

  pluginCount(): number { return this._plugins.size; }
  sellerCount(): number { return this._sellers.size; }

  recordRevenue(currency: Currency, amount: number): void {
    this._totalRevenue.set(currency, (this._totalRevenue.get(currency) || 0) + amount);
  }

  totalRevenue(currency: Currency): number {
    return this._totalRevenue.get(currency) || 0;
  }

  allSellers(): string[] {
    return Array.from(this._sellers);
  }
}

// V4827: StoreFront — public marketplace page + featured layout
export class StoreFront {
  private _featured: string[] = [];
  private _banner: string = '';
  private _categories: string[] = [];
  private _layout: 'grid' | 'list' | 'carousel' = 'grid';

  setBanner(text: string): this { this._banner = text; return this; }
  setLayout(l: 'grid' | 'list' | 'carousel'): this { this._layout = l; return this; }

  addCategory(c: string): this {
    if (!this._categories.includes(c)) this._categories.push(c);
    return this;
  }

  removeCategory(c: string): this {
    this._categories = this._categories.filter(cat => cat !== c);
    return this;
  }

  feature(pluginId: string): this {
    if (!this._featured.includes(pluginId)) this._featured.push(pluginId);
    return this;
  }

  unfeature(pluginId: string): this {
    this._featured = this._featured.filter(p => p !== pluginId);
    return this;
  }

  featured(): string[] { return [...this._featured]; }
  categories(): string[] { return [...this._categories]; }
  banner(): string { return this._banner; }
  layout(): 'grid' | 'list' | 'carousel' { return this._layout; }

  toDict(): { banner: string; layout: string; categories: string[]; featured: string[] } {
    return { banner: this._banner, layout: this._layout, categories: [...this._categories], featured: [...this._featured] };
  }
}

// V4828: PluginListing — detailed plugin page
export class PluginListing {
  private _pluginId: string = '';
  private _name: string = '';
  private _description: string = '';
  private _screenshots: string[] = [];
  private _tags: string[] = [];
  private _changelog: { version: string; date: string; notes: string }[] = [];
  private _requirements: string[] = [];

  setId(id: string): this { this._pluginId = id; return this; }
  setName(n: string): this { this._name = n; return this; }
  setDescription(d: string): this { this._description = d; return this; }
  addScreenshot(url: string): this { this._screenshots.push(url); return this; }
  addTag(tag: string): this { if (!this._tags.includes(tag)) this._tags.push(tag); return this; }
  addChangelog(version: string, date: string, notes: string): this {
    this._changelog.push({ version, date, notes });
    return this;
  }
  addRequirement(req: string): this { this._requirements.push(req); return this; }

  pluginId(): string { return this._pluginId; }
  name(): string { return this._name; }
  description(): string { return this._description; }
  screenshots(): string[] { return [...this._screenshots]; }
  tags(): string[] { return [...this._tags]; }
  changelog(): { version: string; date: string; notes: string }[] { return [...this._changelog]; }
  requirements(): string[] { return [...this._requirements]; }

  isComplete(): boolean {
    return this._name.length > 0
      && this._description.length > 10
      && this._screenshots.length >= 1
      && this._requirements.length >= 1;
  }

  completeness(): number {
    const fields = [this._name, this._description, this._screenshots.length >= 1 ? 'x' : '', this._requirements.length >= 1 ? 'x' : '', this._tags.length >= 1 ? 'x' : ''];
    const filled = fields.filter(f => f).length;
    return filled / fields.length;
  }
}

// V4829: Category — taxonomy + breadcrumb + filter
export class Category {
  private _id: string = '';
  private _name: string = '';
  private _parent: string | null = null;
  private _icon: string = '';
  private _pluginIds: Set<string> = new Set();

  constructor(id: string, name: string, parent: string | null = null) {
    this._id = id;
    this._name = name;
    this._parent = parent;
  }

  setIcon(i: string): this { this._icon = i; return this; }
  addPlugin(pluginId: string): this { this._pluginIds.add(pluginId); return this; }
  removePlugin(pluginId: string): this { this._pluginIds.delete(pluginId); return this; }

  id(): string { return this._id; }
  name(): string { return this._name; }
  parent(): string | null { return this._parent; }
  icon(): string { return this._icon; }
  pluginCount(): number { return this._pluginIds.size; }

  plugins(): string[] { return Array.from(this._pluginIds); }

  isRoot(): boolean { return this._parent === null; }
  hasChildren(otherCategoryIds: Set<string>): boolean {
    for (const id of otherCategoryIds) {
      // simple check: would need full category map
      if (id.length > this._id.length && id.startsWith(this._id + '/')) return true;
    }
    return false;
  }

  toDict(): Record<string, string | number | string[] | null> {
    return {
      id: this._id,
      name: this._name,
      parent: this._parent,
      icon: this._icon,
      pluginCount: this._pluginIds.size,
      plugins: Array.from(this._pluginIds)
    };
  }
}

// V4830: PricingTier — multi-tier pricing structure
export class PricingTier {
  private _tiers: Map<string, { price: number; features: string[]; popular?: boolean }> = new Map();

  addTier(name: string, price: number, features: string[], popular: boolean = false): this {
    this._tiers.set(name, { price, features: [...features], popular });
    return this;
  }

  removeTier(name: string): this {
    this._tiers.delete(name);
    return this;
  }

  setPopular(name: string): this {
    const t = this._tiers.get(name);
    if (t) t.popular = true;
    return this;
  }

  getTier(name: string): { price: number; features: string[]; popular?: boolean } | undefined {
    return this._tiers.get(name);
  }

  tiers(): { name: string; price: number; features: string[]; popular?: boolean }[] {
    return Array.from(this._tiers.entries()).map(([name, info]) => ({ name, ...info }));
  }

  cheapest(): { name: string; price: number } | null {
    let topName = '';
    let topPrice = Infinity;
    for (const [name, info] of this._tiers.entries()) {
      if (info.price < topPrice) {
        topPrice = info.price;
        topName = name;
      }
    }
    return topName ? { name: topName, price: topPrice } : null;
  }

  count(): number { return this._tiers.size; }
}

// V4831: SubscriptionModel — recurring billing with interval
export class SubscriptionModel {
  private _planId: string = '';
  private _interval: SubscriptionInterval = 'monthly';
  private _pricePerInterval: number = 0;
  private _currency: Currency = 'USD';
  private _trialDays: number = 0;
  private _autoRenew: boolean = true;

  setPlanId(id: string): this { this._planId = id; return this; }
  setInterval(i: SubscriptionInterval): this { this._interval = i; return this; }
  setPrice(price: number, currency: Currency = 'USD'): this {
    this._pricePerInterval = Math.max(0, price);
    this._currency = currency;
    return this;
  }
  setTrialDays(d: number): this { this._trialDays = Math.max(0, Math.min(90, d)); return this; }
  setAutoRenew(enabled: boolean): this { this._autoRenew = enabled; return this; }

  monthlyEquivalent(): number {
    if (this._pricePerInterval === 0) return 0;
    const divisor = { monthly: 1, quarterly: 3, annual: 12, lifetime: 1 }[this._interval];
    if (this._interval === 'lifetime') return this._pricePerInterval / 60; // amortized over 5 years
    return this._pricePerInterval / divisor;
  }

  yearlyTotal(): number {
    if (this._interval === 'lifetime') return this._pricePerInterval;
    const multiplier = { monthly: 12, quarterly: 4, annual: 1, lifetime: 1 }[this._interval];
    return this._pricePerInterval * multiplier;
  }

  hasTrial(): boolean { return this._trialDays > 0; }
  toDict(): Record<string, string | number | boolean> {
    return {
      planId: this._planId,
      interval: this._interval,
      price: this._pricePerInterval,
      currency: this._currency,
      trialDays: this._trialDays,
      autoRenew: this._autoRenew
    };
  }
  interval(): SubscriptionInterval { return this._interval; }
}

// V4832: PaymentProcessor — handle payment method + transaction
export class PaymentProcessor {
  private _transactions: { id: string; amount: number; method: PaymentMethod; currency: Currency; status: 'pending' | 'completed' | 'failed' }[] = [];
  private _supportedMethods: Set<PaymentMethod> = new Set(['credit-card', 'paypal']);

  enableMethod(m: PaymentMethod): this { this._supportedMethods.add(m); return this; }
  disableMethod(m: PaymentMethod): this { this._supportedMethods.delete(m); return this; }

  supportedMethods(): PaymentMethod[] { return Array.from(this._supportedMethods); }
  supportsMethod(m: PaymentMethod): boolean { return this._supportedMethods.has(m); }

  process(amount: number, method: PaymentMethod, currency: Currency = 'USD'): { id: string; status: 'pending' | 'completed' | 'failed' } {
    const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let status: 'pending' | 'completed' | 'failed' = 'pending';
    if (amount <= 0) status = 'failed';
    else if (!this._supportedMethods.has(method)) status = 'failed';
    else if (amount > 100000) status = 'failed'; // security limit
    else status = 'completed';
    const txn = { id, amount, method, currency, status };
    this._transactions.push(txn);
    return { id, status };
  }

  refund(transactionId: string): boolean {
    const txn = this._transactions.find(t => t.id === transactionId);
    if (!txn || txn.status !== 'completed') return false;
    txn.status = 'failed';
    return true;
  }

  transactions(): { id: string; amount: number; method: PaymentMethod; currency: Currency; status: 'pending' | 'completed' | 'failed' }[] {
    return [...this._transactions];
  }

  completedCount(): number {
    return this._transactions.filter(t => t.status === 'completed').length;
  }
}

// V4833: InvoiceGenerator — create invoice from transaction + tax
export class InvoiceGenerator {
  private _invoices: Map<string, { items: { description: string; amount: number }[]; tax: number; date: string; currency: Currency }> = new Map();
  private _taxRate: number = 0.0;
  private _prefix: string = 'INV';

  setTaxRate(rate: number): this { this._taxRate = Math.max(0, Math.min(0.5, rate)); return this; }
  setPrefix(p: string): this { this._prefix = p; return this; }

  generate(items: { description: string; amount: number }[], currency: Currency = 'USD'): { id: string; subtotal: number; tax: number; total: number; currency: Currency; date: string } {
    const subtotal = items.reduce((s, item) => s + item.amount, 0);
    const tax = subtotal * this._taxRate;
    const id = `${this._prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const invoice = { items: [...items], tax, date: new Date().toISOString(), currency };
    this._invoices.set(id, invoice);
    return { id, subtotal, tax, total: subtotal + tax, currency, date: invoice.date };
  }

  get(id: string): { items: { description: string; amount: number }[]; tax: number; date: string; currency: Currency } | undefined {
    return this._invoices.get(id);
  }

  taxRate(): number { return this._taxRate; }
  invoiceCount(): number { return this._invoices.size; }
}

// V4834: LicenseKey — generate + validate + revoke
export class LicenseKey {
  private _keys: Map<string, { pluginId: string; issuedTo: string; expiresAt: number; revoked: boolean }> = new Map();

  // FNV-1a hash for key derivation
  private _hash(input: string): string {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, '0').toUpperCase();
  }

  generate(pluginId: string, userId: string, validDays: number = 365): string {
    const hash = this._hash(`${pluginId}-${userId}-${Date.now()}-${Math.random()}`);
    const key = `MP-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${Date.now().toString(36).toUpperCase()}`;
    this._keys.set(key, {
      pluginId,
      issuedTo: userId,
      expiresAt: Date.now() + validDays * 86400 * 1000,
      revoked: false
    });
    return key;
  }

  validate(key: string): { valid: boolean; reason?: string; pluginId?: string; expiresAt?: number } {
    const record = this._keys.get(key);
    if (!record) return { valid: false, reason: 'unknown_key' };
    if (record.revoked) return { valid: false, reason: 'revoked', pluginId: record.pluginId };
    if (Date.now() > record.expiresAt) return { valid: false, reason: 'expired', pluginId: record.pluginId };
    return { valid: true, pluginId: record.pluginId, expiresAt: record.expiresAt };
  }

  revoke(key: string): boolean {
    const r = this._keys.get(key);
    if (!r) return false;
    r.revoked = true;
    return true;
  }

  count(): number { return this._keys.size; }
}

// V4835: ReceiptTracker — track receipts for accounting
export class ReceiptTracker {
  private _receipts: Map<string, { buyerId: string; total: number; currency: Currency; date: number; items: string[] }> = new Map();
  private _totalByBuyer: Map<string, number> = new Map();

  record(receiptId: string, buyerId: string, total: number, currency: Currency, items: string[]): void {
    this._receipts.set(receiptId, { buyerId, total, currency, date: Date.now(), items: [...items] });
    const key = `${buyerId}:${currency}`;
    this._totalByBuyer.set(key, (this._totalByBuyer.get(key) || 0) + total);
  }

  get(receiptId: string): { buyerId: string; total: number; currency: Currency; date: number; items: string[] } | undefined {
    return this._receipts.get(receiptId);
  }

  buyerTotal(buyerId: string, currency: Currency): number {
    return this._totalByBuyer.get(`${buyerId}:${currency}`) || 0;
  }

  count(): number { return this._receipts.size; }
}

// V4826-V4835: CI Batch 1/3 Index
export const CI_BATCH_1_ENGINES = [
  'MarketplaceCore', 'StoreFront', 'PluginListing', 'Category', 'PricingTier',
  'SubscriptionModel', 'PaymentProcessor', 'InvoiceGenerator', 'LicenseKey', 'ReceiptTracker'
] as const;

export class MarketplaceCoreIndex {
  list(): string[] {
    return [...CI_BATCH_1_ENGINES];
  }

  count(): number {
    return CI_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return [...CI_BATCH_1_ENGINES];
  }

  has(name: string): boolean {
    return CI_BATCH_1_ENGINES.includes(name as typeof CI_BATCH_1_ENGINES[number]);
  }
}