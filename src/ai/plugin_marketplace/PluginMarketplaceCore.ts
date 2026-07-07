// V5096-V5105: CR Advanced Plugin Marketplace Core Batch 1/3
// Pricing + usage metering + billing + revenue share + payout + subscription + trial + coupon + tax + invoice

export class PluginPricing {
  private _plans: Map<string, { monthly: number; yearly: number; features: string[] }> = new Map();

  setPlan(name: string, monthly: number, yearly: number, features: string[] = []): this {
    this._plans.set(name, { monthly, yearly, features });
    return this;
  }

  getPlan(name: string): { monthly: number; yearly: number; features: string[] } | null {
    return this._plans.get(name) ?? null;
  }

  monthlyPrice(plan: string): number {
    return this._plans.get(plan)?.monthly ?? 0;
  }

  yearlyPrice(plan: string): number {
    return this._plans.get(plan)?.yearly ?? 0;
  }

  hasFeature(plan: string, feature: string): boolean {
    return this._plans.get(plan)?.features.includes(feature) ?? false;
  }

  planNames(): string[] {
    return [...this._plans.keys()];
  }

  planCount(): number { return this._plans.size; }
}

export class UsageMetering {
  private _usage: Map<string, number> = new Map();
  private _limits: Map<string, number> = new Map();

  record(userId: string, amount = 1): this {
    this._usage.set(userId, (this._usage.get(userId) ?? 0) + amount);
    return this;
  }

  setLimit(userId: string, limit: number): this {
    this._limits.set(userId, limit);
    return this;
  }

  usage(userId: string): number {
    return this._usage.get(userId) ?? 0;
  }

  limit(userId: string): number {
    return this._limits.get(userId) ?? Infinity;
  }

  remaining(userId: string): number {
    if (this.limit(userId) === Infinity) return 0;
    return Math.max(0, this.limit(userId) - this.usage(userId));
  }

  isOverLimit(userId: string): boolean {
    if (this.limit(userId) === Infinity) return false;
    return this.usage(userId) > this.limit(userId);
  }

  reset(userId: string): this {
    this._usage.set(userId, 0);
    return this;
  }
}

export class BillingEngine {
  private _invoices: Map<string, { userId: string; amount: number; paid: boolean; items: Array<{ description: string; amount: number }> }> = new Map();

  generate(userId: string, items: Array<{ description: string; amount: number }>): string {
    const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const amount = items.reduce((a, b) => a + b.amount, 0);
    this._invoices.set(id, { userId, amount, paid: false, items });
    return id;
  }

  pay(invoiceId: string): boolean {
    const inv = this._invoices.get(invoiceId);
    if (!inv || inv.paid) return false;
    inv.paid = true;
    return true;
  }

  isPaid(invoiceId: string): boolean {
    return this._invoices.get(invoiceId)?.paid ?? false;
  }

  amount(invoiceId: string): number {
    return this._invoices.get(invoiceId)?.amount ?? 0;
  }

  userInvoices(userId: string): string[] {
    return [...this._invoices.entries()].filter(([_, inv]) => inv.userId === userId).map(([id]) => id);
  }

  totalRevenue(): number {
    let s = 0;
    for (const inv of this._invoices.values()) if (inv.paid) s += inv.amount;
    return s;
  }
}

export class RevenueShare {
  private _splits: Map<string, Map<string, number>> = new Map(); // productId → recipientId → %

  setSplit(productId: string, recipientId: string, percent: number): this {
    let m = this._splits.get(productId);
    if (!m) { m = new Map(); this._splits.set(productId, m); }
    m.set(recipientId, percent);
    return this;
  }

  compute(productId: string, revenue: number): Map<string, number> {
    const m = this._splits.get(productId);
    const result = new Map<string, number>();
    if (!m) return result;
    for (const [recipient, pct] of m.entries()) {
      result.set(recipient, (revenue * pct) / 100);
    }
    return result;
  }

  recipients(productId: string): string[] {
    return [...(this._splits.get(productId)?.keys() ?? [])];
  }

  totalPercent(productId: string): number {
    let s = 0;
    for (const v of this._splits.get(productId)?.values() ?? []) s += v;
    return s;
  }
}

export class PayoutManager {
  private _payouts: Map<string, { amount: number; recipient: string; status: 'pending' | 'paid' | 'failed' }> = new Map();

  create(recipient: string, amount: number): string {
    const id = `po-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this._payouts.set(id, { amount, recipient, status: 'pending' });
    return id;
  }

  markPaid(id: string): boolean {
    const p = this._payouts.get(id);
    if (!p || p.status !== 'pending') return false;
    p.status = 'paid';
    return true;
  }

  markFailed(id: string): boolean {
    const p = this._payouts.get(id);
    if (!p) return false;
    p.status = 'failed';
    return true;
  }

  status(id: string): 'pending' | 'paid' | 'failed' | null {
    return this._payouts.get(id)?.status ?? null;
  }

  pendingPayouts(): string[] {
    return [...this._payouts.entries()].filter(([_, p]) => p.status === 'pending').map(([id]) => id);
  }

  totalPending(): number {
    let s = 0;
    for (const p of this._payouts.values()) if (p.status === 'pending') s += p.amount;
    return s;
  }
}

export class SubscriptionManager {
  private _subs: Map<string, { plan: string; status: 'active' | 'cancelled' | 'expired'; startedAt: number }> = new Map();

  subscribe(userId: string, plan: string): this {
    this._subs.set(userId, { plan, status: 'active', startedAt: Date.now() });
    return this;
  }

  cancel(userId: string): boolean {
    const s = this._subs.get(userId);
    if (!s || s.status !== 'active') return false;
    s.status = 'cancelled';
    return true;
  }

  expire(userId: string): boolean {
    const s = this._subs.get(userId);
    if (!s) return false;
    s.status = 'expired';
    return true;
  }

  status(userId: string): 'active' | 'cancelled' | 'expired' | null {
    return this._subs.get(userId)?.status ?? null;
  }

  plan(userId: string): string | null {
    return this._subs.get(userId)?.plan ?? null;
  }

  isActive(userId: string): boolean {
    return this._subs.get(userId)?.status === 'active';
  }

  activeUsers(): string[] {
    return [...this._subs.entries()].filter(([_, s]) => s.status === 'active').map(([id]) => id);
  }
}

export class TrialManager {
  private _trials: Map<string, { startedAt: number; durationMs: number }> = new Map();

  start(userId: string, durationMs = 14 * 24 * 60 * 60 * 1000): this {
    this._trials.set(userId, { startedAt: Date.now(), durationMs });
    return this;
  }

  isActive(userId: string): boolean {
    const t = this._trials.get(userId);
    if (!t) return false;
    return Date.now() - t.startedAt < t.durationMs;
  }

  remainingMs(userId: string): number {
    const t = this._trials.get(userId);
    if (!t) return 0;
    return Math.max(0, t.durationMs - (Date.now() - t.startedAt));
  }

  end(userId: string): boolean {
    return this._trials.delete(userId);
  }
}

export class CouponEngine {
  private _coupons: Map<string, { percent: number; maxUses: number; used: number }> = new Map();

  create(code: string, percent: number, maxUses = 1): this {
    this._coupons.set(code, { percent, maxUses, used: 0 });
    return this;
  }

  redeem(code: string): number {
    const c = this._coupons.get(code);
    if (!c) return 0;
    if (c.used >= c.maxUses) return 0;
    c.used += 1;
    return c.percent;
  }

  isValid(code: string): boolean {
    const c = this._coupons.get(code);
    return c ? c.used < c.maxUses : false;
  }

  usesRemaining(code: string): number {
    const c = this._coupons.get(code);
    return c ? c.maxUses - c.used : 0;
  }
}

export class TaxCalculator {
  // Simple flat tax by region
  calculate(subtotal: number, region: string, rate = 0.0): number {
    return subtotal * rate;
  }

  total(subtotal: number, region: string, rate = 0.0): number {
    return subtotal + this.calculate(subtotal, region, rate);
  }
}

export class InvoiceGenerator {
  generate(id: string, items: Array<{ description: string; quantity: number; unitPrice: number }>, tax = 0): string {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const total = subtotal + tax;
    const lines: string[] = [`Invoice: ${id}`, '', 'Item | Qty | Unit | Total'];
    for (const i of items) {
      lines.push(`${i.description} | ${i.quantity} | ${i.unitPrice.toFixed(2)} | ${(i.quantity * i.unitPrice).toFixed(2)}`);
    }
    lines.push('', `Subtotal: ${subtotal.toFixed(2)}`);
    lines.push(`Tax: ${tax.toFixed(2)}`);
    lines.push(`Total: ${total.toFixed(2)}`);
    return lines.join('\n');
  }
}

// V5105: PluginMarketplaceCoreIndex
export const CR_BATCH_1_ENGINES = [
  'PluginPricing', 'UsageMetering', 'BillingEngine', 'RevenueShare', 'PayoutManager',
  'SubscriptionManager', 'TrialManager', 'CouponEngine', 'TaxCalculator', 'InvoiceGenerator', 'PluginMarketplaceCoreIndex'
] as const;

export class PluginMarketplaceCoreIndex {
  list(): string[] {
    return [...CR_BATCH_1_ENGINES];
  }

  count(): number {
    return CR_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CR_BATCH_1_ENGINES.includes(name as typeof CR_BATCH_1_ENGINES[number]);
  }
}