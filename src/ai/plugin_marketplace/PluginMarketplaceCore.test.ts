// V5096-V5105: CR Advanced Plugin Marketplace Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  PluginPricing,
  UsageMetering,
  BillingEngine,
  RevenueShare,
  PayoutManager,
  SubscriptionManager,
  TrialManager,
  CouponEngine,
  TaxCalculator,
  InvoiceGenerator,
  PluginMarketplaceCoreIndex,
  CR_BATCH_1_ENGINES
} from './PluginMarketplaceCore';

describe('PluginPricing', () => {
  it('setPlan + getPlan + monthlyPrice + yearlyPrice + hasFeature + planNames + planCount', () => {
    const p = new PluginPricing();
    p.setPlan('pro', 9.99, 99.99, ['analytics', 'priority-support']);
    expect(p.getPlan('pro')?.monthly).toBe(9.99);
    expect(p.monthlyPrice('pro')).toBe(9.99);
    expect(p.yearlyPrice('pro')).toBe(99.99);
    expect(p.hasFeature('pro', 'analytics')).toBe(true);
    expect(p.hasFeature('pro', 'unknown')).toBe(false);
    expect(p.hasFeature('missing', 'analytics')).toBe(false);
    expect(p.monthlyPrice('missing')).toBe(0);
    expect(p.planNames()).toEqual(['pro']);
    expect(p.planCount()).toBe(1);
  });
});

describe('UsageMetering', () => {
  it('record + usage + limit + remaining + isOverLimit + reset', () => {
    const u = new UsageMetering();
    u.record('u1', 5).record('u1', 3);
    u.setLimit('u1', 100);
    expect(u.usage('u1')).toBe(8);
    expect(u.limit('u1')).toBe(100);
    expect(u.remaining('u1')).toBe(92);
    expect(u.isOverLimit('u1')).toBe(false);
    u.record('u1', 200);
    expect(u.isOverLimit('u1')).toBe(true);
    u.reset('u1');
    expect(u.usage('u1')).toBe(0);
    expect(u.limit('missing')).toBe(Infinity);
    expect(u.remaining('missing')).toBe(0);
    expect(u.isOverLimit('missing')).toBe(false);
  });
});

describe('BillingEngine', () => {
  it('generate + pay + isPaid + amount + userInvoices + totalRevenue', () => {
    const b = new BillingEngine();
    const id = b.generate('u1', [{ description: 'pro', amount: 9.99 }]);
    expect(b.amount(id)).toBe(9.99);
    expect(b.isPaid(id)).toBe(false);
    expect(b.pay(id)).toBe(true);
    expect(b.isPaid(id)).toBe(true);
    expect(b.pay(id)).toBe(false);
    expect(b.totalRevenue()).toBe(9.99);
    expect(b.userInvoices('u1')).toEqual([id]);
    expect(b.userInvoices('u2')).toEqual([]);
    expect(b.pay('missing')).toBe(false);
    expect(b.amount('missing')).toBe(0);
    expect(b.isPaid('missing')).toBe(false);
  });
});

describe('RevenueShare', () => {
  it('setSplit + compute + recipients + totalPercent', () => {
    const r = new RevenueShare();
    r.setSplit('prod1', 'dev1', 70).setSplit('prod1', 'platform', 30);
    const dist = r.compute('prod1', 100);
    expect(dist.get('dev1')).toBe(70);
    expect(dist.get('platform')).toBe(30);
    expect(r.recipients('prod1').sort()).toEqual(['dev1', 'platform']);
    expect(r.totalPercent('prod1')).toBe(100);
    expect(r.recipients('missing')).toEqual([]);
    expect(r.totalPercent('missing')).toBe(0);
    expect(r.compute('missing', 100).size).toBe(0);
  });
});

describe('PayoutManager', () => {
  it('create + markPaid + markFailed + status + pendingPayouts + totalPending', () => {
    const p = new PayoutManager();
    const id = p.create('dev1', 100);
    expect(p.status(id)).toBe('pending');
    p.markPaid(id);
    expect(p.status(id)).toBe('paid');
    expect(p.markPaid(id)).toBe(false);
    const id2 = p.create('dev2', 50);
    expect(p.pendingPayouts()).toEqual([id2]);
    expect(p.totalPending()).toBe(50);
    p.markFailed(id2);
    expect(p.status(id2)).toBe('failed');
    expect(p.status('missing')).toBeNull();
    expect(p.markFailed('missing')).toBe(false);
  });
});

describe('SubscriptionManager', () => {
  it('subscribe + cancel + expire + status + plan + isActive + activeUsers', () => {
    const s = new SubscriptionManager();
    s.subscribe('u1', 'pro');
    expect(s.status('u1')).toBe('active');
    expect(s.plan('u1')).toBe('pro');
    expect(s.isActive('u1')).toBe(true);
    s.cancel('u1');
    expect(s.status('u1')).toBe('cancelled');
    expect(s.isActive('u1')).toBe(false);
    expect(s.cancel('u1')).toBe(false);
    s.subscribe('u2', 'free');
    s.expire('u2');
    expect(s.status('u2')).toBe('expired');
    expect(s.status('missing')).toBeNull();
    expect(s.plan('missing')).toBeNull();
    expect(s.activeUsers()).toEqual([]);
    expect(s.expire('missing')).toBe(false);
  });
});

describe('TrialManager + CouponEngine + TaxCalculator + InvoiceGenerator', () => {
  it('TrialManager start + isActive + remainingMs + end', async () => {
    const t = new TrialManager();
    expect(t.isActive('u1')).toBe(false);
    t.start('u1', 100);
    expect(t.isActive('u1')).toBe(true);
    expect(t.remainingMs('u1')).toBeGreaterThan(0);
    await new Promise(r => setTimeout(r, 10));
    expect(t.end('u1')).toBe(true);
    expect(t.isActive('u1')).toBe(false);
    expect(t.remainingMs('missing')).toBe(0);
  });

  it('CouponEngine create + redeem + isValid + usesRemaining', () => {
    const c = new CouponEngine();
    c.create('SAVE50', 50, 2);
    expect(c.isValid('SAVE50')).toBe(true);
    expect(c.redeem('SAVE50')).toBe(50);
    expect(c.redeem('SAVE50')).toBe(50);
    expect(c.isValid('SAVE50')).toBe(false); // max uses reached
    expect(c.redeem('SAVE50')).toBe(0);
    expect(c.redeem('missing')).toBe(0);
    expect(c.usesRemaining('missing')).toBe(0);
    expect(c.isValid('missing')).toBe(false);
    expect(c.usesRemaining('SAVE50')).toBe(0);
  });

  it('TaxCalculator calculate + total', () => {
    const t = new TaxCalculator();
    expect(t.calculate(100, 'US-CA', 0.1)).toBe(10);
    expect(t.calculate(100, 'DE', 0.19)).toBe(19);
    expect(t.total(100, 'US-CA', 0.1)).toBe(110);
  });

  it('InvoiceGenerator generate', () => {
    const i = new InvoiceGenerator();
    const inv = i.generate('inv-001', [{ description: 'Pro plan', quantity: 1, unitPrice: 9.99 }], 1);
    expect(inv).toContain('inv-001');
    expect(inv).toContain('Pro plan');
    expect(inv).toContain('Subtotal: 9.99');
    expect(inv).toContain('Tax: 1.00');
    expect(inv).toContain('Total: 10.99');
  });
});

describe('PluginMarketplaceCoreIndex', () => {
  it('list has 11', () => {
    expect(new PluginMarketplaceCoreIndex().list()).toHaveLength(11);
  });

  it('count + engines + has', () => {
    const idx = new PluginMarketplaceCoreIndex();
    expect(idx.count()).toBe(11);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('PluginPricing')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CR_BATCH_1_ENGINES const has 11', () => {
    expect(CR_BATCH_1_ENGINES).toHaveLength(11);
  });
});