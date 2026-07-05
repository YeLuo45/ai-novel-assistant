// Round 8 Direction CI — Marketplace for Plugins 2.0 Batch 2/3 (Advanced)
// V4836-V4845: ReviewSystem + RatingEngine + RecommendationEngine + FeaturedSection
//            + TrendingSection + BundlePackage + DiscountCode + GiftCard + AffiliateTracker + RefundProcessor
// 3-files × 10-engines pattern (P-97)

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type DiscountType = 'percentage' | 'fixed-amount' | 'free-shipping' | 'buy-x-get-y';
export type TrendPeriod = 'hour' | 'day' | 'week' | 'month';
export type RefundReason = 'defective' | 'not-as-described' | 'unauthorized' | 'duplicate' | 'other';
export type RefundStatus = 'requested' | 'processing' | 'completed' | 'denied';

// V4836: ReviewSystem — user reviews + moderation
export class ReviewSystem {
  private _reviews: Map<string, { pluginId: string; userId: string; rating: number; text: string; status: ReviewStatus; date: number }[]> = new Map();
  private _moderators: Set<string> = new Set();
  private _bannedWords: Set<string> = new Set(['spam', 'fake']);

  addModerator(userId: string): this { this._moderators.add(userId); return this; }
  removeModerator(userId: string): this { this._moderators.delete(userId); return this; }
  addBannedWord(word: string): this { this._bannedWords.add(word.toLowerCase()); return this; }

  submit(pluginId: string, userId: string, rating: number, text: string): { status: ReviewStatus; reason?: string } {
    const normalized = text.toLowerCase();
    const hasBanned = Array.from(this._bannedWords).some(w => normalized.includes(w));
    const status: ReviewStatus = hasBanned ? 'flagged' : 'pending';
    if (!this._reviews.has(pluginId)) this._reviews.set(pluginId, []);
    this._reviews.get(pluginId)!.push({ pluginId, userId, rating, text, status, date: Date.now() });
    return hasBanned ? { status, reason: 'banned_word' } : { status };
  }

  moderate(pluginId: string, reviewIndex: number, moderatorId: string, approve: boolean): boolean {
    if (!this._moderators.has(moderatorId)) return false;
    const reviews = this._reviews.get(pluginId);
    if (!reviews || reviewIndex < 0 || reviewIndex >= reviews.length) return false;
    reviews[reviewIndex].status = approve ? 'approved' : 'rejected';
    return true;
  }

  getReviews(pluginId: string, status?: ReviewStatus): { pluginId: string; userId: string; rating: number; text: string; status: ReviewStatus; date: number }[] {
    const all = this._reviews.get(pluginId) || [];
    return status ? all.filter(r => r.status === status) : all;
  }

  isModerator(userId: string): boolean { return this._moderators.has(userId); }
}

// V4837: RatingEngine — aggregated ratings + histograms
export class RatingEngine {
  private _ratings: Map<string, number[]> = new Map();

  add(pluginId: string, rating: number): void {
    if (!this._ratings.has(pluginId)) this._ratings.set(pluginId, []);
    this._ratings.get(pluginId)!.push(Math.max(1, Math.min(5, rating)));
  }

  average(pluginId: string): number {
    const r = this._ratings.get(pluginId);
    if (!r || r.length === 0) return 0;
    return r.reduce((s, n) => s + n, 0) / r.length;
  }

  count(pluginId: string): number {
    return (this._ratings.get(pluginId) || []).length;
  }

  histogram(pluginId: string): { 1: number; 2: number; 3: number; 4: number; 5: number } {
    const r = this._ratings.get(pluginId) || [];
    const hist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    r.forEach(rating => {
      hist[Math.round(rating) as 1 | 2 | 3 | 4 | 5]++;
    });
    return hist;
  }

  distribution(pluginId: string): { 1: number; 2: number; 3: number; 4: number; 5: number } {
    const h = this.histogram(pluginId);
    const total = Object.values(h).reduce((s, n) => s + n, 0);
    if (total === 0) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    return {
      1: h[1] / total,
      2: h[2] / total,
      3: h[3] / total,
      4: h[4] / total,
      5: h[5] / total
    };
  }

  topRated(limit: number = 10): { pluginId: string; average: number; count: number }[] {
    return Array.from(this._ratings.entries())
      .map(([pluginId, ratings]) => ({
        pluginId,
        average: ratings.reduce((s, n) => s + n, 0) / ratings.length,
        count: ratings.length
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, limit);
  }
}

// V4838: RecommendationEngine — collaborative filtering
export class RecommendationEngine {
  private _userInteractions: Map<string, Set<string>> = new Map();
  private _similarityThreshold: number = 0.3;

  record(userId: string, pluginId: string): void {
    if (!this._userInteractions.has(userId)) this._userInteractions.set(userId, new Set());
    this._userInteractions.get(userId)!.add(pluginId);
  }

  setThreshold(t: number): this { this._similarityThreshold = Math.max(0, Math.min(1, t)); return this; }

  // Jaccard similarity
  similarity(userA: string, userB: string): number {
    const a = this._userInteractions.get(userA) || new Set();
    const b = this._userInteractions.get(userB) || new Set();
    if (a.size === 0 && b.size === 0) return 0;
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    return intersection.size / union.size;
  }

  recommend(userId: string, limit: number = 5): string[] {
    const userPlugins = this._userInteractions.get(userId) || new Set();
    const candidates = new Map<string, number>();
    for (const [otherUser, otherPlugins] of this._userInteractions.entries()) {
      if (otherUser === userId) continue;
      const sim = this.similarity(userId, otherUser);
      if (sim < this._similarityThreshold) continue;
      otherPlugins.forEach(p => {
        if (!userPlugins.has(p)) {
          candidates.set(p, (candidates.get(p) || 0) + sim);
        }
      });
    }
    return Array.from(candidates.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([p]) => p);
  }

  userCount(): number { return this._userInteractions.size; }
}

// V4839: FeaturedSection — curated featured plugins
export class FeaturedSection {
  private _items: { pluginId: string; rank: number; reason: string; expiresAt: number }[] = [];
  private _maxItems: number = 10;

  setMax(n: number): this { this._maxItems = Math.max(1, Math.min(50, n)); return this; }

  add(pluginId: string, reason: string, expiresInDays: number = 7): this {
    this._items.push({ pluginId, rank: this._items.length + 1, reason, expiresAt: Date.now() + expiresInDays * 86400000 });
    this._items.sort((a, b) => a.rank - b.rank);
    if (this._items.length > this._maxItems) this._items = this._items.slice(0, this._maxItems);
    return this;
  }

  remove(pluginId: string): this {
    this._items = this._items.filter(i => i.pluginId !== pluginId);
    return this;
  }

  promote(pluginId: string): this {
    const item = this._items.find(i => i.pluginId === pluginId);
    if (!item) return this;
    this._items = this._items.filter(i => i.pluginId !== pluginId);
    this._items.unshift(item);
    this._items.forEach((i, idx) => i.rank = idx + 1);
    return this;
  }

  active(): { pluginId: string; rank: number; reason: string; expiresAt: number }[] {
    const now = Date.now();
    return this._items.filter(i => i.expiresAt > now);
  }

  count(): number { return this._items.length; }
}

// V4840: TrendingSection — top plugins by recent activity
export class TrendingSection {
  private _activity: Map<string, { views: number; downloads: number; purchases: number; lastActivity: number }> = new Map();

  recordView(pluginId: string): void {
    this._recordActivity(pluginId);
    const a = this._activity.get(pluginId)!;
    a.views++;
  }

  recordDownload(pluginId: string): void {
    this._recordActivity(pluginId);
    const a = this._activity.get(pluginId)!;
    a.downloads++;
  }

  recordPurchase(pluginId: string): void {
    this._recordActivity(pluginId);
    const a = this._activity.get(pluginId)!;
    a.purchases++;
  }

  private _recordActivity(pluginId: string): void {
    if (!this._activity.has(pluginId)) {
      this._activity.set(pluginId, { views: 0, downloads: 0, purchases: 0, lastActivity: 0 });
    }
    this._activity.get(pluginId)!.lastActivity = Date.now();
  }

  trending(period: TrendPeriod, limit: number = 10): string[] {
    const now = Date.now();
    const periodMs = { hour: 3600000, day: 86400000, week: 604800000, month: 2592000000 }[period];
    const cutoff = now - periodMs;
    return Array.from(this._activity.entries())
      .filter(([, a]) => a.lastActivity > cutoff)
      .sort((a, b) => {
        const scoreA = a[1].views + a[1].downloads * 5 + a[1].purchases * 10;
        const scoreB = b[1].views + b[1].downloads * 5 + b[1].purchases * 10;
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(([p]) => p);
  }

  reset(): this {
    this._activity.clear();
    return this;
  }
}

// V4841: BundlePackage — multiple plugins at discount
export class BundlePackage {
  private _bundles: Map<string, { pluginIds: string[]; discount: number; expiresAt: number }> = new Map();

  create(name: string, pluginIds: string[], discount: number, validDays: number = 30): void {
    this._bundles.set(name, {
      pluginIds: [...pluginIds],
      discount: Math.max(0, Math.min(0.9, discount)),
      expiresAt: Date.now() + validDays * 86400000
    });
  }

  remove(name: string): boolean {
    return this._bundles.delete(name);
  }

  get(name: string): { pluginIds: string[]; discount: number; expiresAt: number } | undefined {
    const b = this._bundles.get(name);
    if (!b) return undefined;
    if (Date.now() > b.expiresAt) return undefined;
    return b;
  }

  totalValue(name: string, prices: Map<string, number>): number {
    const b = this.get(name);
    if (!b) return 0;
    return b.pluginIds.reduce((s, id) => s + (prices.get(id) || 0), 0);
  }

  bundlePrice(name: string, prices: Map<string, number>): number {
    const total = this.totalValue(name, prices);
    const discount = this.get(name)?.discount || 0;
    return total * (1 - discount);
  }

  savings(name: string, prices: Map<string, number>): number {
    return this.totalValue(name, prices) - this.bundlePrice(name, prices);
  }

  count(): number { return this._bundles.size; }
}

// V4842: DiscountCode — promo codes with validation
export class DiscountCode {
  private _codes: Map<string, { type: DiscountType; value: number; uses: number; maxUses: number; minOrder: number; expiresAt: number }> = new Map();

  create(code: string, type: DiscountType, value: number, maxUses: number = 100, minOrder: number = 0, validDays: number = 30): void {
    this._codes.set(code.toUpperCase(), {
      type,
      value,
      uses: 0,
      maxUses,
      minOrder,
      expiresAt: Date.now() + validDays * 86400000
    });
  }

  validate(code: string, orderTotal: number): { valid: boolean; discount: number; reason?: string } {
    const c = this._codes.get(code.toUpperCase());
    if (!c) return { valid: false, discount: 0, reason: 'unknown_code' };
    if (Date.now() > c.expiresAt) return { valid: false, discount: 0, reason: 'expired' };
    if (c.uses >= c.maxUses) return { valid: false, discount: 0, reason: 'exhausted' };
    if (orderTotal < c.minOrder) return { valid: false, discount: 0, reason: 'below_minimum' };

    let discount = 0;
    if (c.type === 'percentage') discount = orderTotal * c.value;
    else if (c.type === 'fixed-amount') discount = c.value;
    else if (c.type === 'free-shipping') discount = 0; // shipping handled elsewhere
    else if (c.type === 'buy-x-get-y') discount = orderTotal * 0.1; // simplified

    return { valid: true, discount };
  }

  redeem(code: string): boolean {
    const c = this._codes.get(code.toUpperCase());
    if (!c || c.uses >= c.maxUses) return false;
    c.uses++;
    return true;
  }

  count(): number { return this._codes.size; }
  uses(code: string): number { return this._codes.get(code.toUpperCase())?.uses || 0; }
}

// V4843: GiftCard — gift cards with balance
export class GiftCard {
  private _cards: Map<string, { balance: number; currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY'; redeemed: boolean }> = new Map();

  issue(code: string, balance: number, currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' = 'USD'): void {
    this._cards.set(code, { balance, currency, redeemed: false });
  }

  redeem(code: string, amount: number): { success: boolean; remaining: number; reason?: string } {
    const card = this._cards.get(code);
    if (!card) return { success: false, remaining: 0, reason: 'unknown_card' };
    if (card.redeemed) return { success: false, remaining: 0, reason: 'already_redeemed' };
    if (card.balance < amount) return { success: false, remaining: card.balance, reason: 'insufficient_balance' };
    card.balance -= amount;
    if (card.balance === 0) card.redeemed = true;
    return { success: true, remaining: card.balance };
  }

  balance(code: string): number {
    return this._cards.get(code)?.balance || 0;
  }

  isRedeemed(code: string): boolean {
    return this._cards.get(code)?.redeemed || false;
  }

  count(): number { return this._cards.size; }
}

// V4844: AffiliateTracker — referral + commission
export class AffiliateTracker {
  private _affiliates: Map<string, { code: string; commission: number; earnings: number }> = new Map();
  private _referrals: { affiliateCode: string; buyerId: string; amount: number; commission: number; date: number }[] = [];

  registerAffiliate(userId: string, commission: number = 0.1): string {
    const code = `AFF-${userId.toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    this._affiliates.set(userId, { code, commission: Math.max(0, Math.min(0.5, commission)), earnings: 0 });
    return code;
  }

  recordReferral(affiliateCode: string, buyerId: string, amount: number): number {
    const affiliate = Array.from(this._affiliates.values()).find(a => a.code === affiliateCode);
    if (!affiliate) return 0;
    const commission = amount * affiliate.commission;
    affiliate.earnings += commission;
    this._referrals.push({ affiliateCode, buyerId, amount, commission, date: Date.now() });
    return commission;
  }

  getAffiliate(userId: string): { code: string; commission: number; earnings: number } | undefined {
    return this._affiliates.get(userId);
  }

  earnings(userId: string): number {
    return this._affiliates.get(userId)?.earnings || 0;
  }

  referralCount(): number { return this._referrals.length; }
  affiliateCount(): number { return this._affiliates.size; }
}

// V4845: RefundProcessor — refund requests + approval workflow
export class RefundProcessor {
  private _refunds: Map<string, { buyerId: string; pluginId: string; amount: number; reason: RefundReason; status: RefundStatus; date: number }> = new Map();
  private _autoApproveDays: number = 14;

  setAutoApproveDays(d: number): this { this._autoApproveDays = Math.max(1, Math.min(90, d)); return this; }

  request(buyerId: string, pluginId: string, amount: number, reason: RefundReason): { id: string; status: RefundStatus } {
    const id = `REF-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const daysSince = 0; // assume immediate; actual date tracking would be per-purchase
    const autoApprove = reason === 'defective' || reason === 'not-as-described';
    const status: RefundStatus = autoApprove ? 'completed' : 'requested';
    this._refunds.set(id, { buyerId, pluginId, amount, reason, status, date: Date.now() });
    return { id, status };
  }

  approve(refundId: string): boolean {
    const r = this._refunds.get(refundId);
    if (!r || r.status !== 'requested') return false;
    r.status = 'completed';
    return true;
  }

  deny(refundId: string): boolean {
    const r = this._refunds.get(refundId);
    if (!r || r.status !== 'requested') return false;
    r.status = 'denied';
    return true;
  }

  get(refundId: string): { buyerId: string; pluginId: string; amount: number; reason: RefundReason; status: RefundStatus; date: number } | undefined {
    return this._refunds.get(refundId);
  }

  buyerRefunds(buyerId: string): { id: string; status: RefundStatus }[] {
    return Array.from(this._refunds.entries())
      .filter(([, r]) => r.buyerId === buyerId)
      .map(([id, r]) => ({ id, status: r.status }));
  }

  count(): number { return this._refunds.size; }
  autoApproveDays(): number { return this._autoApproveDays; }
}

// V4836-V4845: CI Batch 2/3 Index
export const CI_BATCH_2_ENGINES = [
  'ReviewSystem', 'RatingEngine', 'RecommendationEngine', 'FeaturedSection', 'TrendingSection',
  'BundlePackage', 'DiscountCode', 'GiftCard', 'AffiliateTracker', 'RefundProcessor'
] as const;

export class MarketplaceAdvancedIndex {
  list(): string[] {
    return [...CI_BATCH_2_ENGINES];
  }

  count(): number {
    return CI_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return [...CI_BATCH_2_ENGINES];
  }

  has(name: string): boolean {
    return CI_BATCH_2_ENGINES.includes(name as typeof CI_BATCH_2_ENGINES[number]);
  }
}