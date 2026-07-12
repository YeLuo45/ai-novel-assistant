// V5376-V5385: DB AI Agent Marketplace 2.0 Advanced Batch 2/3
// AgentBilling + AgentRevenue + AgentSubscription + AgentLicense + AgentPayout + AgentCoupon + AgentRefund + AgentFraudDetector + AgentPricingEngine + AgentMarketplaceAdvancedIndex

import { AgentListing } from './AgentMarketplaceCore';

export interface BillingEntry {
  id: string;
  agentId: string;
  userId: string;
  amountUsd: number;
  ts: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
}

export class AgentBilling {
  private _entries: BillingEntry[] = [];
  private _nextId = 1;

  charge(agentId: string, userId: string, amountUsd: number): BillingEntry {
    const entry: BillingEntry = {
      id: `bill-${this._nextId++}`,
      agentId,
      userId,
      amountUsd,
      ts: Date.now(),
      status: 'paid'
    };
    this._entries.push(entry);
    return entry;
  }

  fail(billingId: string): boolean {
    const e = this._entries.find(en => en.id === billingId);
    if (!e) return false;
    e.status = 'failed';
    return true;
  }

  refund(billingId: string): boolean {
    const e = this._entries.find(en => en.id === billingId);
    if (!e || e.status !== 'paid') return false;
    e.status = 'refunded';
    return true;
  }

  entriesByAgent(agentId: string): BillingEntry[] {
    return this._entries.filter(e => e.agentId === agentId);
  }

  totalRevenue(agentId?: string): number {
    const subset = agentId
      ? this.entriesByAgent(agentId)
      : this._entries;
    return subset
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amountUsd, 0);
  }

  totalEntries(): number { return this._entries.length; }
}

export interface RevenueShare {
  agentId: string;
  grossUsd: number;
  platformFeeUsd: number;
  authorPayoutUsd: number;
  ts: number;
}

export class AgentRevenue {
  private _shares: RevenueShare[] = [];
  private _platformFeeRate = 0.3;

  record(agentId: string, grossUsd: number): RevenueShare {
    const fee = grossUsd * this._platformFeeRate;
    const share: RevenueShare = {
      agentId,
      grossUsd,
      platformFeeUsd: fee,
      authorPayoutUsd: grossUsd - fee,
      ts: Date.now()
    };
    this._shares.push(share);
    return share;
  }

  setPlatformFeeRate(rate: number): void {
    this._platformFeeRate = Math.max(0, Math.min(1, rate));
  }

  totalAuthorPayouts(agentId?: string): number {
    const subset = agentId
      ? this._shares.filter(s => s.agentId === agentId)
      : this._shares;
    return subset.reduce((sum, s) => sum + s.authorPayoutUsd, 0);
  }

  totalPlatformFees(): number {
    return this._shares.reduce((sum, s) => sum + s.platformFeeUsd, 0);
  }

  sharesFor(agentId: string): RevenueShare[] {
    return this._shares.filter(s => s.agentId === agentId);
  }

  totalShares(): number { return this._shares.length; }
}

export interface Subscription {
  id: string;
  userId: string;
  agentId: string;
  tier: 'free' | 'pro' | 'enterprise';
  startedAt: number;
  renewsAt: number;
  active: boolean;
}

export class AgentSubscription {
  private _subs: Subscription[] = [];
  private _nextId = 1;

  subscribe(userId: string, agentId: string, tier: Subscription['tier'], durationMs: number = 30 * 24 * 3600 * 1000): Subscription {
    const sub: Subscription = {
      id: `sub-${this._nextId++}`,
      userId,
      agentId,
      tier,
      startedAt: Date.now(),
      renewsAt: Date.now() + durationMs,
      active: true
    };
    this._subs.push(sub);
    return sub;
  }

  cancel(subscriptionId: string): boolean {
    const sub = this._subs.find(s => s.id === subscriptionId);
    if (!sub) return false;
    sub.active = false;
    return true;
  }

  activeFor(userId: string, agentId: string): Subscription | null {
    return this._subs.find(s => s.userId === userId && s.agentId === agentId && s.active) ?? null;
  }

  subscriptionsByAgent(agentId: string): Subscription[] {
    return this._subs.filter(s => s.agentId === agentId);
  }

  activeSubscribers(agentId: string): number {
    return this._subs.filter(s => s.agentId === agentId && s.active).length;
  }

  expiringSoon(withinMs: number = 7 * 24 * 3600 * 1000): Subscription[] {
    const cutoff = Date.now() + withinMs;
    return this._subs.filter(s => s.active && s.renewsAt <= cutoff);
  }

  totalSubscriptions(): number { return this._subs.length; }
}

export type LicenseType = 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'proprietary' | 'custom';

export interface License {
  id: string;
  agentId: string;
  type: LicenseType;
  customTerms?: string;
  commercialUse: boolean;
  redistribution: boolean;
}

export class AgentLicense {
  private _licenses = new Map<string, License[]>();

  attach(license: License): void {
    const list = this._licenses.get(license.agentId) ?? [];
    list.push(license);
    this._licenses.set(license.agentId, list);
  }

  current(agentId: string): License | null {
    const list = this._licenses.get(agentId) ?? [];
    return list[list.length - 1] ?? null;
  }

  allowsCommercialUse(agentId: string): boolean {
    return this.current(agentId)?.commercialUse ?? false;
  }

  allowsRedistribution(agentId: string): boolean {
    return this.current(agentId)?.redistribution ?? false;
  }

  history(agentId: string): License[] {
    return [...(this._licenses.get(agentId) ?? [])];
  }

  byType(type: LicenseType): License[] {
    const out: License[] = [];
    for (const list of this._licenses.values()) {
      for (const l of list) if (l.type === type) out.push(l);
    }
    return out;
  }

  totalLicenses(): number {
    let count = 0;
    for (const list of this._licenses.values()) count += list.length;
    return count;
  }
}

export interface Payout {
  id: string;
  authorId: string;
  amountUsd: number;
  method: 'stripe' | 'paypal' | 'crypto';
  status: 'queued' | 'processing' | 'paid' | 'failed';
  ts: number;
}

export class AgentPayout {
  private _payouts: Payout[] = [];
  private _nextId = 1;

  queue(authorId: string, amountUsd: number, method: Payout['method']): Payout {
    const p: Payout = {
      id: `po-${this._nextId++}`,
      authorId,
      amountUsd,
      method,
      status: 'queued',
      ts: Date.now()
    };
    this._payouts.push(p);
    return p;
  }

  markPaid(payoutId: string): boolean {
    const p = this._payouts.find(po => po.id === payoutId);
    if (!p) return false;
    p.status = 'paid';
    return true;
  }

  markFailed(payoutId: string): boolean {
    const p = this._payouts.find(po => po.id === payoutId);
    if (!p) return false;
    p.status = 'failed';
    return true;
  }

  payoutsFor(authorId: string): Payout[] {
    return this._payouts.filter(p => p.authorId === authorId);
  }

  totalPaid(authorId?: string): number {
    const subset = authorId
      ? this.payoutsFor(authorId)
      : this._payouts;
    return subset.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amountUsd, 0);
  }

  pendingPayouts(): Payout[] {
    return this._payouts.filter(p => p.status === 'queued' || p.status === 'processing');
  }

  totalPayouts(): number { return this._payouts.length; }
}

export interface Coupon {
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiresAt: number;
  agentId?: string;
}

export class AgentCoupon {
  private _coupons = new Map<string, Coupon>();

  create(coupon: Coupon): void {
    this._coupons.set(coupon.code, coupon);
  }

  apply(code: string, amountUsd: number): number | null {
    const c = this._coupons.get(code);
    if (!c) return null;
    if (c.usedCount >= c.maxUses) return null;
    if (Date.now() > c.expiresAt) return null;
    c.usedCount += 1;
    return amountUsd * (1 - c.discountPercent / 100);
  }

  validate(code: string): boolean {
    const c = this._coupons.get(code);
    if (!c) return false;
    if (c.usedCount >= c.maxUses) return false;
    return Date.now() <= c.expiresAt;
  }

  remainingUses(code: string): number {
    const c = this._coupons.get(code);
    if (!c) return 0;
    return Math.max(0, c.maxUses - c.usedCount);
  }

  byAgent(agentId: string): Coupon[] {
    return [...this._coupons.values()].filter(c => c.agentId === agentId);
  }

  totalCoupons(): number { return this._coupons.size; }
}

export interface RefundRequest {
  id: string;
  billingId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  ts: number;
}

export class AgentRefund {
  private _requests: RefundRequest[] = [];
  private _nextId = 1;

  request(billingId: string, userId: string, reason: string): RefundRequest {
    const r: RefundRequest = {
      id: `ref-${this._nextId++}`,
      billingId,
      userId,
      reason,
      status: 'pending',
      ts: Date.now()
    };
    this._requests.push(r);
    return r;
  }

  approve(requestId: string): boolean {
    const r = this._requests.find(req => req.id === requestId);
    if (!r || r.status !== 'pending') return false;
    r.status = 'approved';
    return true;
  }

  reject(requestId: string): boolean {
    const r = this._requests.find(req => req.id === requestId);
    if (!r || r.status !== 'pending') return false;
    r.status = 'rejected';
    return true;
  }

  pending(): RefundRequest[] {
    return this._requests.filter(r => r.status === 'pending');
  }

  approved(): RefundRequest[] {
    return this._requests.filter(r => r.status === 'approved');
  }

  requestsByUser(userId: string): RefundRequest[] {
    return this._requests.filter(r => r.userId === userId);
  }

  totalRequests(): number { return this._requests.length; }
}

export interface FraudSignal {
  userId: string;
  type: 'velocity' | 'duplicate-card' | 'chargeback-history' | 'suspicious-location';
  severity: number;
  ts: number;
}

export class AgentFraudDetector {
  private _signals: FraudSignal[] = [];
  private _threshold = 0.7;

  record(signal: Omit<FraudSignal, 'ts'>): void {
    this._signals.push({ ...signal, ts: Date.now() });
  }

  setThreshold(t: number): void {
    this._threshold = Math.max(0, Math.min(1, t));
  }

  isSuspicious(userId: string): boolean {
    const userSignals = this._signals.filter(s => s.userId === userId);
    if (userSignals.length === 0) return false;
    const maxSeverity = Math.max(...userSignals.map(s => s.severity));
    return maxSeverity >= this._threshold;
  }

  riskScore(userId: string): number {
    const userSignals = this._signals.filter(s => s.userId === userId);
    if (userSignals.length === 0) return 0;
    return userSignals.reduce((sum, s) => sum + s.severity, 0) / userSignals.length;
  }

  suspiciousUsers(): string[] {
    const users = new Set(this._signals.map(s => s.userId));
    return [...users].filter(u => this.isSuspicious(u));
  }

  signalsFor(userId: string): FraudSignal[] {
    return this._signals.filter(s => s.userId === userId);
  }

  totalSignals(): number { return this._signals.length; }
}

export interface PricingRecommendation {
  agentId: string;
  currentPriceUsd: number;
  recommendedPriceUsd: number;
  confidence: number;
  reasoning: string;
}

export class AgentPricingEngine {
  private _history = new Map<string, number[]>();

  recordDownload(agent: AgentListing): void {
    const arr = this._history.get(agent.id) ?? [];
    arr.push(agent.downloads);
    this._history.set(agent.id, arr);
  }

  recommend(agent: AgentListing): PricingRecommendation {
    const history = this._history.get(agent.id) ?? [];
    let recommended = agent.priceUsd;
    let confidence = 0.5;
    let reasoning = 'insufficient data';

    if (history.length > 0) {
      const avgDownloads = history.reduce((a, b) => a + b, 0) / history.length;
      if (avgDownloads > 1000 && agent.priceUsd > 0) {
        recommended = agent.priceUsd * 1.2;
        confidence = 0.8;
        reasoning = 'high demand, increase price';
      } else if (avgDownloads < 100 && agent.priceUsd > 0) {
        recommended = agent.priceUsd * 0.8;
        confidence = 0.7;
        reasoning = 'low demand, decrease price';
      } else if (agent.priceUsd === 0 && avgDownloads > 500) {
        recommended = 9.99;
        confidence = 0.6;
        reasoning = 'popular free agent, monetize';
      }
    }

    return {
      agentId: agent.id,
      currentPriceUsd: agent.priceUsd,
      recommendedPriceUsd: Math.round(recommended * 100) / 100,
      confidence,
      reasoning
    };
  }

  recommendBatch(agents: AgentListing[]): PricingRecommendation[] {
    return agents.map(a => this.recommend(a));
  }

  totalAgentsTracked(): number { return this._history.size; }
}

export class AgentMarketplaceAdvancedIndex {
  static summary(
    billing: AgentBilling,
    revenue: AgentRevenue,
    subs: AgentSubscription,
    payouts: AgentPayout
  ): string {
    return [
      `Billed: $${billing.totalRevenue().toFixed(2)}`,
      `Author payouts: $${revenue.totalAuthorPayouts().toFixed(2)}`,
      `Active subs: ${subs.totalSubscriptions()}`,
      `Payouts queued: ${payouts.pendingPayouts().length}`
    ].join(' | ');
  }
}