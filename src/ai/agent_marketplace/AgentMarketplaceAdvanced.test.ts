// V5376-V5385: Agent Marketplace Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  AgentBilling,
  AgentRevenue,
  AgentSubscription,
  AgentLicense,
  AgentPayout,
  AgentCoupon,
  AgentRefund,
  AgentFraudDetector,
  AgentPricingEngine,
  AgentMarketplaceAdvancedIndex
} from './AgentMarketplaceAdvanced';
import { AgentListing } from './AgentMarketplaceCore';

const sampleAgent = (id: string, overrides: Partial<AgentListing> = {}): AgentListing => ({
  id,
  name: `Agent ${id}`,
  author: 'alice',
  description: `desc ${id}`,
  category: 'productivity',
  tags: [],
  version: '1.0.0',
  publishedAt: Date.now(),
  priceUsd: 0,
  downloads: 100,
  ...overrides
});

describe('AgentBilling', () => {
  it('charge creates paid entry', () => {
    const b = new AgentBilling();
    const e = b.charge('a1', 'u1', 9.99);
    expect(e.status).toBe('paid');
    expect(e.amountUsd).toBe(9.99);
  });

  it('fail marks status', () => {
    const b = new AgentBilling();
    const e = b.charge('a1', 'u1', 9.99);
    expect(b.fail(e.id)).toBe(true);
  });

  it('refund requires paid entry', () => {
    const b = new AgentBilling();
    const e = b.charge('a1', 'u1', 9.99);
    expect(b.refund(e.id)).toBe(true);
    expect(b.refund(e.id)).toBe(false);
  });

  it('entriesByAgent filters', () => {
    const b = new AgentBilling();
    b.charge('a1', 'u1', 10);
    b.charge('a2', 'u2', 20);
    expect(b.entriesByAgent('a1').length).toBe(1);
  });

  it('totalRevenue only counts paid', () => {
    const b = new AgentBilling();
    const e1 = b.charge('a1', 'u1', 10);
    b.charge('a1', 'u2', 20);
    b.fail(e1.id);
    expect(b.totalRevenue()).toBe(20);
  });
});

describe('AgentRevenue', () => {
  it('record with default 30% platform fee', () => {
    const r = new AgentRevenue();
    const s = r.record('a1', 100);
    expect(s.platformFeeUsd).toBe(30);
    expect(s.authorPayoutUsd).toBe(70);
  });

  it('setPlatformFeeRate clamps to [0,1]', () => {
    const r = new AgentRevenue();
    r.setPlatformFeeRate(0.5);
    expect(r.record('a1', 100).platformFeeUsd).toBe(50);
    r.setPlatformFeeRate(1.5);
    expect(r.record('a2', 100).platformFeeUsd).toBe(100);
  });

  it('totalAuthorPayouts sums', () => {
    const r = new AgentRevenue();
    r.record('a1', 100);
    r.record('a2', 200);
    expect(r.totalAuthorPayouts()).toBe(70 + 140);
  });

  it('sharesFor filters by agent', () => {
    const r = new AgentRevenue();
    r.record('a1', 100);
    r.record('a2', 200);
    expect(r.sharesFor('a1').length).toBe(1);
  });

  it('totalPlatformFees sums', () => {
    const r = new AgentRevenue();
    r.record('a1', 100);
    r.record('a2', 100);
    expect(r.totalPlatformFees()).toBe(60);
  });
});

describe('AgentSubscription', () => {
  it('subscribe creates active sub', () => {
    const s = new AgentSubscription();
    const sub = s.subscribe('u1', 'a1', 'pro');
    expect(sub.active).toBe(true);
    expect(sub.tier).toBe('pro');
  });

  it('cancel marks inactive', () => {
    const s = new AgentSubscription();
    const sub = s.subscribe('u1', 'a1', 'pro');
    expect(s.cancel(sub.id)).toBe(true);
    expect(sub.active).toBe(false);
  });

  it('activeFor returns active subscription', () => {
    const s = new AgentSubscription();
    s.subscribe('u1', 'a1', 'pro');
    expect(s.activeFor('u1', 'a1')).not.toBeNull();
    expect(s.activeFor('u2', 'a1')).toBeNull();
  });

  it('activeSubscribers counts', () => {
    const s = new AgentSubscription();
    s.subscribe('u1', 'a1', 'pro');
    s.subscribe('u2', 'a1', 'free');
    s.subscribe('u3', 'a2', 'pro');
    expect(s.activeSubscribers('a1')).toBe(2);
  });

  it('expiringSoon within 7 days', () => {
    const s = new AgentSubscription();
    s.subscribe('u1', 'a1', 'pro', 3 * 24 * 3600 * 1000);
    s.subscribe('u2', 'a1', 'pro', 30 * 24 * 3600 * 1000);
    expect(s.expiringSoon(7 * 24 * 3600 * 1000).length).toBe(1);
  });
});

describe('AgentLicense', () => {
  it('attach and current', () => {
    const l = new AgentLicense();
    l.attach({ id: 'l1', agentId: 'a1', type: 'MIT', commercialUse: true, redistribution: true });
    expect(l.current('a1')?.type).toBe('MIT');
  });

  it('allowsCommercialUse checks current', () => {
    const l = new AgentLicense();
    l.attach({ id: 'l1', agentId: 'a1', type: 'MIT', commercialUse: true, redistribution: false });
    expect(l.allowsCommercialUse('a1')).toBe(true);
    expect(l.allowsRedistribution('a1')).toBe(false);
  });

  it('current returns null when missing', () => {
    const l = new AgentLicense();
    expect(l.current('missing')).toBeNull();
  });

  it('history returns all', () => {
    const l = new AgentLicense();
    l.attach({ id: 'l1', agentId: 'a1', type: 'MIT', commercialUse: true, redistribution: true });
    l.attach({ id: 'l2', agentId: 'a1', type: 'Apache-2.0', commercialUse: true, redistribution: true });
    expect(l.history('a1').length).toBe(2);
  });

  it('byType filters', () => {
    const l = new AgentLicense();
    l.attach({ id: 'l1', agentId: 'a1', type: 'MIT', commercialUse: true, redistribution: true });
    l.attach({ id: 'l2', agentId: 'a2', type: 'Apache-2.0', commercialUse: true, redistribution: true });
    expect(l.byType('MIT').length).toBe(1);
  });
});

describe('AgentPayout', () => {
  it('queue creates queued payout', () => {
    const p = new AgentPayout();
    const po = p.queue('author1', 100, 'stripe');
    expect(po.status).toBe('queued');
  });

  it('markPaid sets status', () => {
    const p = new AgentPayout();
    const po = p.queue('author1', 100, 'stripe');
    expect(p.markPaid(po.id)).toBe(true);
    expect(po.status).toBe('paid');
  });

  it('markFailed sets status', () => {
    const p = new AgentPayout();
    const po = p.queue('author1', 100, 'stripe');
    expect(p.markFailed(po.id)).toBe(true);
  });

  it('payoutsFor filters by author', () => {
    const p = new AgentPayout();
    p.queue('a1', 100, 'stripe');
    p.queue('a2', 200, 'paypal');
    expect(p.payoutsFor('a1').length).toBe(1);
  });

  it('totalPaid sums paid payouts', () => {
    const p = new AgentPayout();
    const po1 = p.queue('a1', 100, 'stripe');
    p.queue('a1', 200, 'stripe');
    p.markPaid(po1.id);
    expect(p.totalPaid('a1')).toBe(100);
  });

  it('pendingPayouts filters queued/processing', () => {
    const p = new AgentPayout();
    p.queue('a1', 100, 'stripe');
    p.queue('a1', 200, 'stripe');
    expect(p.pendingPayouts().length).toBe(2);
  });
});

describe('AgentCoupon', () => {
  it('apply returns discounted amount', () => {
    const c = new AgentCoupon();
    c.create({ code: 'SAVE20', discountPercent: 20, maxUses: 100, usedCount: 0, expiresAt: Date.now() + 86400000 });
    expect(c.apply('SAVE20', 100)).toBe(80);
  });

  it('validate checks expiry and uses', () => {
    const c = new AgentCoupon();
    c.create({ code: 'EXPIRED', discountPercent: 10, maxUses: 100, usedCount: 0, expiresAt: Date.now() - 1000 });
    expect(c.validate('EXPIRED')).toBe(false);
  });

  it('apply fails when max uses reached', () => {
    const c = new AgentCoupon();
    c.create({ code: 'ONCE', discountPercent: 50, maxUses: 1, usedCount: 1, expiresAt: Date.now() + 86400000 });
    expect(c.apply('ONCE', 100)).toBeNull();
  });

  it('remainingUses', () => {
    const c = new AgentCoupon();
    c.create({ code: 'X', discountPercent: 10, maxUses: 5, usedCount: 2, expiresAt: Date.now() + 86400000 });
    expect(c.remainingUses('X')).toBe(3);
  });

  it('byAgent filters', () => {
    const c = new AgentCoupon();
    c.create({ code: 'A', discountPercent: 10, maxUses: 5, usedCount: 0, expiresAt: Date.now() + 86400000, agentId: 'a1' });
    c.create({ code: 'B', discountPercent: 20, maxUses: 5, usedCount: 0, expiresAt: Date.now() + 86400000, agentId: 'a2' });
    expect(c.byAgent('a1').length).toBe(1);
  });
});

describe('AgentRefund', () => {
  it('request creates pending', () => {
    const r = new AgentRefund();
    const req = r.request('bill-1', 'u1', 'not satisfied');
    expect(req.status).toBe('pending');
  });

  it('approve changes status', () => {
    const r = new AgentRefund();
    const req = r.request('bill-1', 'u1', 'reason');
    expect(r.approve(req.id)).toBe(true);
    expect(r.pending().length).toBe(0);
  });

  it('reject changes status', () => {
    const r = new AgentRefund();
    const req = r.request('bill-1', 'u1', 'reason');
    expect(r.reject(req.id)).toBe(true);
  });

  it('approve fails on already approved', () => {
    const r = new AgentRefund();
    const req = r.request('bill-1', 'u1', 'reason');
    r.approve(req.id);
    expect(r.approve(req.id)).toBe(false);
  });

  it('requestsByUser filters', () => {
    const r = new AgentRefund();
    r.request('bill-1', 'u1', 'a');
    r.request('bill-2', 'u2', 'b');
    expect(r.requestsByUser('u1').length).toBe(1);
  });
});

describe('AgentFraudDetector', () => {
  it('isSuspicious returns false when no signals', () => {
    const f = new AgentFraudDetector();
    expect(f.isSuspicious('u1')).toBe(false);
  });

  it('isSuspicious returns true for high severity', () => {
    const f = new AgentFraudDetector();
    f.record({ userId: 'u1', type: 'velocity', severity: 0.9 });
    expect(f.isSuspicious('u1')).toBe(true);
  });

  it('riskScore is 0 when no signals', () => {
    const f = new AgentFraudDetector();
    expect(f.riskScore('u1')).toBe(0);
  });

  it('riskScore averages severities', () => {
    const f = new AgentFraudDetector();
    f.record({ userId: 'u1', type: 'velocity', severity: 0.4 });
    f.record({ userId: 'u1', type: 'duplicate-card', severity: 0.6 });
    expect(f.riskScore('u1')).toBe(0.5);
  });

  it('suspiciousUsers returns list', () => {
    const f = new AgentFraudDetector();
    f.record({ userId: 'u1', type: 'velocity', severity: 0.9 });
    f.record({ userId: 'u2', type: 'velocity', severity: 0.3 });
    expect(f.suspiciousUsers()).toEqual(['u1']);
  });
});

describe('AgentPricingEngine', () => {
  it('recommend for high demand paid agent', () => {
    const p = new AgentPricingEngine();
    const agent = sampleAgent('a1', { priceUsd: 50, downloads: 100 });
    p.recordDownload(agent);
    p.recordDownload({ ...agent, downloads: 2000 });
    p.recordDownload({ ...agent, downloads: 3000 });
    const rec = p.recommend(agent);
    expect(rec.recommendedPriceUsd).toBeGreaterThan(agent.priceUsd);
  });

  it('recommend for low demand reduces price', () => {
    const p = new AgentPricingEngine();
    const agent = sampleAgent('a1', { priceUsd: 50, downloads: 10 });
    p.recordDownload(agent);
    p.recordDownload({ ...agent, downloads: 20 });
    const rec = p.recommend(agent);
    expect(rec.recommendedPriceUsd).toBeLessThan(agent.priceUsd);
  });

  it('recommend for popular free agent', () => {
    const p = new AgentPricingEngine();
    const agent = sampleAgent('a1', { priceUsd: 0, downloads: 600 });
    p.recordDownload(agent);
    p.recordDownload({ ...agent, downloads: 1000 });
    const rec = p.recommend(agent);
    expect(rec.recommendedPriceUsd).toBeGreaterThan(0);
  });

  it('recommendBatch returns array', () => {
    const p = new AgentPricingEngine();
    const recs = p.recommendBatch([sampleAgent('a1'), sampleAgent('a2')]);
    expect(recs.length).toBe(2);
  });

  it('totalAgentsTracked counts', () => {
    const p = new AgentPricingEngine();
    p.recordDownload(sampleAgent('a1'));
    p.recordDownload(sampleAgent('a2'));
    expect(p.totalAgentsTracked()).toBe(2);
  });
});

describe('AgentMarketplaceAdvancedIndex', () => {
  it('summary includes counts', () => {
    const b = new AgentBilling();
    const r = new AgentRevenue();
    const s = new AgentSubscription();
    const p = new AgentPayout();
    b.charge('a1', 'u1', 100);
    r.record('a1', 100);
    s.subscribe('u1', 'a1', 'pro');
    p.queue('a1', 70, 'stripe');
    const summary = AgentMarketplaceAdvancedIndex.summary(b, r, s, p);
    expect(summary).toContain('Billed: $100.00');
    expect(summary).toContain('Active subs: 1');
    expect(summary).toContain('Payouts queued: 1');
  });
});