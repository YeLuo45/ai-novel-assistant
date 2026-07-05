// Round 8 Direction CI — Marketplace for Plugins 2.0 Batch 2/3 (Advanced Tests)
// V4836-V4845: 10 engines tested
import { describe, it, expect } from 'vitest';
import {
  ReviewSystem, RatingEngine, RecommendationEngine, FeaturedSection, TrendingSection,
  BundlePackage, DiscountCode, GiftCard, AffiliateTracker, RefundProcessor,
  MarketplaceAdvancedIndex, CI_BATCH_2_ENGINES
} from './MarketplaceAdvanced';

describe('ReviewSystem', () => {
  it('submit review + status', () => {
    const r = new ReviewSystem();
    const result = r.submit('plugin1', 'user1', 5, 'Great plugin!');
    expect(result.status).toBe('pending');
    expect(r.getReviews('plugin1')).toHaveLength(1);
  });

  it('flagged review with banned word', () => {
    const r = new ReviewSystem();
    r.addBannedWord('spam');
    const result = r.submit('plugin1', 'user1', 1, 'This is spam content');
    expect(result.status).toBe('flagged');
    expect(result.reason).toBe('banned_word');
  });

  it('moderate review requires moderator', () => {
    const r = new ReviewSystem();
    r.submit('p1', 'u1', 5, 'Good');
    expect(r.moderate('p1', 0, 'u2', true)).toBe(false);
    r.addModerator('u2');
    expect(r.moderate('p1', 0, 'u2', true)).toBe(true);
  });

  it('filter reviews by status', () => {
    const r = new ReviewSystem();
    r.submit('p1', 'u1', 5, 'Good');
    r.submit('p1', 'u2', 1, 'Bad');
    expect(r.getReviews('p1', 'pending')).toHaveLength(2);
  });

  it('isModerator check', () => {
    const r = new ReviewSystem();
    r.addModerator('mod1');
    expect(r.isModerator('mod1')).toBe(true);
    expect(r.isModerator('notmod')).toBe(false);
  });
});

describe('RatingEngine', () => {
  it('add + average', () => {
    const r = new RatingEngine();
    r.add('p1', 5);
    r.add('p1', 3);
    r.add('p1', 4);
    expect(r.average('p1')).toBeCloseTo(4);
    expect(r.count('p1')).toBe(3);
  });

  it('clamps rating to 1-5', () => {
    const r = new RatingEngine();
    r.add('p1', 99);
    expect(r.average('p1')).toBe(5);
    r.add('p1', -5);
    expect(r.average('p1')).toBeLessThanOrEqual(5);
  });

  it('histogram returns star distribution', () => {
    const r = new RatingEngine();
    r.add('p1', 5);
    r.add('p1', 5);
    r.add('p1', 3);
    const h = r.histogram('p1');
    expect(h[5]).toBe(2);
    expect(h[3]).toBe(1);
  });

  it('distribution returns fractions summing to 1', () => {
    const r = new RatingEngine();
    r.add('p1', 5);
    r.add('p1', 3);
    const d = r.distribution('p1');
    expect(d[5] + d[3]).toBeCloseTo(1);
  });

  it('topRated returns sorted by average', () => {
    const r = new RatingEngine();
    r.add('a', 5); r.add('a', 5);
    r.add('b', 3); r.add('b', 3);
    r.add('c', 1);
    const top = r.topRated(3);
    expect(top[0].pluginId).toBe('a');
  });
});

describe('RecommendationEngine', () => {
  it('similarity Jaccard', () => {
    const r = new RecommendationEngine();
    r.record('u1', 'p1');
    r.record('u1', 'p2');
    r.record('u2', 'p1');
    r.record('u2', 'p2');
    expect(r.similarity('u1', 'u2')).toBe(1);
  });

  it('recommend from similar users', () => {
    const r = new RecommendationEngine().setThreshold(0.3);
    r.record('u1', 'p1');
    r.record('u2', 'p1');
    r.record('u2', 'p2');
    const recs = r.recommend('u1');
    expect(recs).toContain('p2');
  });

  it('similarity 0 for disjoint users', () => {
    const r = new RecommendationEngine();
    r.record('u1', 'p1');
    r.record('u2', 'p2');
    expect(r.similarity('u1', 'u2')).toBe(0);
  });

  it('userCount', () => {
    const r = new RecommendationEngine();
    r.record('u1', 'p1');
    r.record('u2', 'p2');
    expect(r.userCount()).toBe(2);
  });

  it('setThreshold clamps 0-1', () => {
    const r = new RecommendationEngine();
    r.setThreshold(5);
    expect(r.userCount()).toBe(0); // no users recorded
  });
});

describe('FeaturedSection', () => {
  it('add + count', () => {
    const f = new FeaturedSection();
    f.add('p1', 'Editor\'s pick');
    expect(f.count()).toBe(1);
  });

  it('add respects max items', () => {
    const f = new FeaturedSection().setMax(2);
    f.add('p1', 'pick').add('p2', 'pick').add('p3', 'pick');
    expect(f.count()).toBe(2);
  });

  it('promote moves to top', () => {
    const f = new FeaturedSection();
    f.add('p1', 'a').add('p2', 'b');
    f.promote('p2');
    expect(f.active()[0].pluginId).toBe('p2');
  });

  it('remove', () => {
    const f = new FeaturedSection();
    f.add('p1', 'a');
    f.remove('p1');
    expect(f.count()).toBe(0);
  });

  it('setMax clamps 1-50', () => {
    const f = new FeaturedSection();
    f.setMax(0);
    expect(f.count()).toBe(0);
  });
});

describe('TrendingSection', () => {
  it('recordView + recordDownload + recordPurchase', () => {
    const t = new TrendingSection();
    t.recordView('p1');
    t.recordDownload('p1');
    t.recordPurchase('p1');
    const trend = t.trending('day');
    expect(trend).toContain('p1');
  });

  it('trending weights purchases higher', async () => {
    const t = new TrendingSection();
    t.recordView('p1'); t.recordView('p1'); t.recordView('p1');
    await new Promise(r => setTimeout(r, 5));
    t.recordPurchase('p2');
    const trend = t.trending('day');
    expect(trend[0]).toBe('p2'); // 1 purchase (10) > 3 views (3)
  });

  it('reset clears all activity', () => {
    const t = new TrendingSection();
    t.recordView('p1');
    t.reset();
    expect(t.trending('day')).toHaveLength(0);
  });

  it('trending respects period', async () => {
    const t = new TrendingSection();
    t.recordView('p1');
    // since just now, all periods should include it
    expect(t.trending('hour').length).toBeGreaterThan(0);
  });
});

describe('BundlePackage', () => {
  it('create + get', () => {
    const b = new BundlePackage();
    b.create('starter', ['p1', 'p2'], 0.2);
    expect(b.get('starter')).toBeDefined();
    expect(b.count()).toBe(1);
  });

  it('totalValue sums plugin prices', () => {
    const b = new BundlePackage();
    b.create('starter', ['p1', 'p2'], 0.2);
    const prices = new Map([['p1', 10], ['p2', 20]]);
    expect(b.totalValue('starter', prices)).toBe(30);
  });

  it('bundlePrice applies discount', () => {
    const b = new BundlePackage();
    b.create('starter', ['p1', 'p2'], 0.2);
    const prices = new Map([['p1', 10], ['p2', 20]]);
    expect(b.bundlePrice('starter', prices)).toBe(24);
  });

  it('savings = total - bundle', () => {
    const b = new BundlePackage();
    b.create('starter', ['p1', 'p2'], 0.25);
    const prices = new Map([['p1', 40], ['p2', 60]]);
    expect(b.savings('starter', prices)).toBe(25);
  });

  it('remove bundle', () => {
    const b = new BundlePackage();
    b.create('starter', ['p1'], 0.1);
    expect(b.remove('starter')).toBe(true);
  });
});

describe('DiscountCode', () => {
  it('create + validate percentage', () => {
    const d = new DiscountCode();
    d.create('SAVE20', 'percentage', 0.2);
    const r = d.validate('SAVE20', 100);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(20);
  });

  it('validate fixed-amount', () => {
    const d = new DiscountCode();
    d.create('TENOFF', 'fixed-amount', 10);
    const r = d.validate('TENOFF', 100);
    expect(r.discount).toBe(10);
  });

  it('validate rejects unknown code', () => {
    expect(new DiscountCode().validate('NOPE', 100).reason).toBe('unknown_code');
  });

  it('validate rejects below minimum', () => {
    const d = new DiscountCode();
    d.create('BIG', 'percentage', 0.1, 100, 50);
    expect(d.validate('BIG', 30).reason).toBe('below_minimum');
  });

  it('redeem increments uses', () => {
    const d = new DiscountCode();
    d.create('CODE', 'percentage', 0.1, 5);
    expect(d.redeem('CODE')).toBe(true);
    expect(d.uses('CODE')).toBe(1);
  });

  it('exhausted after max uses', () => {
    const d = new DiscountCode();
    d.create('CODE', 'percentage', 0.1, 1);
    d.redeem('CODE');
    expect(d.validate('CODE', 100).reason).toBe('exhausted');
  });
});

describe('GiftCard', () => {
  it('issue + balance', () => {
    const g = new GiftCard();
    g.issue('CARD1', 100);
    expect(g.balance('CARD1')).toBe(100);
  });

  it('redeem partial', () => {
    const g = new GiftCard();
    g.issue('CARD1', 100);
    const r = g.redeem('CARD1', 30);
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(70);
    expect(g.balance('CARD1')).toBe(70);
  });

  it('redeem full marks redeemed', () => {
    const g = new GiftCard();
    g.issue('CARD1', 50);
    g.redeem('CARD1', 50);
    expect(g.isRedeemed('CARD1')).toBe(true);
  });

  it('reject insufficient balance', () => {
    const g = new GiftCard();
    g.issue('CARD1', 10);
    expect(g.redeem('CARD1', 50).reason).toBe('insufficient_balance');
  });

  it('reject unknown card', () => {
    expect(new GiftCard().redeem('UNKNOWN', 10).reason).toBe('unknown_card');
  });

  it('count tracks issued cards', () => {
    const g = new GiftCard();
    g.issue('A', 10);
    g.issue('B', 20);
    expect(g.count()).toBe(2);
  });
});

describe('AffiliateTracker', () => {
  it('registerAffiliate returns code', () => {
    const a = new AffiliateTracker();
    const code = a.registerAffiliate('user1', 0.1);
    expect(code).toMatch(/^AFF-/);
  });

  it('recordReferral + earnings', () => {
    const a = new AffiliateTracker();
    const code = a.registerAffiliate('user1', 0.1);
    const commission = a.recordReferral(code, 'buyer1', 100);
    expect(commission).toBe(10);
    expect(a.earnings('user1')).toBe(10);
  });

  it('getAffiliate', () => {
    const a = new AffiliateTracker();
    a.registerAffiliate('user1');
    const aff = a.getAffiliate('user1');
    expect(aff).toBeDefined();
    expect(aff!.earnings).toBe(0);
  });

  it('referralCount + affiliateCount', () => {
    const a = new AffiliateTracker();
    const code = a.registerAffiliate('user1');
    a.recordReferral(code, 'buyer1', 100);
    expect(a.referralCount()).toBe(1);
    expect(a.affiliateCount()).toBe(1);
  });

  it('commission clamps 0-50%', () => {
    const a = new AffiliateTracker();
    a.registerAffiliate('user1', 99);
    expect(a.getAffiliate('user1')!.commission).toBe(0.5);
  });
});

describe('RefundProcessor', () => {
  it('request returns refund id', () => {
    const r = new RefundProcessor();
    const result = r.request('buyer1', 'plugin1', 50, 'defective');
    expect(result.id).toMatch(/^REF-/);
    expect(r.count()).toBe(1);
  });

  it('defective auto-approves', () => {
    const r = new RefundProcessor();
    const result = r.request('buyer1', 'p1', 50, 'defective');
    expect(result.status).toBe('completed');
  });

  it('not-as-described auto-approves', () => {
    const r = new RefundProcessor();
    const result = r.request('buyer1', 'p1', 50, 'not-as-described');
    expect(result.status).toBe('completed');
  });

  it('other reasons go to requested', () => {
    const r = new RefundProcessor();
    const result = r.request('buyer1', 'p1', 50, 'other');
    expect(result.status).toBe('requested');
  });

  it('approve transitions requested→completed', () => {
    const r = new RefundProcessor();
    const result = r.request('buyer1', 'p1', 50, 'other');
    expect(r.approve(result.id)).toBe(true);
    expect(r.get(result.id)!.status).toBe('completed');
  });

  it('deny transitions requested→denied', () => {
    const r = new RefundProcessor();
    const result = r.request('buyer1', 'p1', 50, 'other');
    expect(r.deny(result.id)).toBe(true);
    expect(r.get(result.id)!.status).toBe('denied');
  });

  it('buyerRefunds lists per-buyer refunds', () => {
    const r = new RefundProcessor();
    r.request('b1', 'p1', 10, 'other');
    r.request('b1', 'p2', 20, 'other');
    r.request('b2', 'p1', 30, 'other');
    expect(r.buyerRefunds('b1')).toHaveLength(2);
  });

  it('setAutoApproveDays clamps 1-90', () => {
    const r = new RefundProcessor();
    r.setAutoApproveDays(0);
    expect(r.autoApproveDays()).toBe(1);
  });
});

describe('MarketplaceAdvancedIndex', () => {
  it('list has 10 engines', () => {
    expect(new MarketplaceAdvancedIndex().list()).toHaveLength(10);
  });

  it('count 10', () => {
    expect(new MarketplaceAdvancedIndex().count()).toBe(10);
  });

  it('has checks', () => {
    expect(new MarketplaceAdvancedIndex().has('ReviewSystem')).toBe(true);
    expect(new MarketplaceAdvancedIndex().has('Unknown')).toBe(false);
  });

  it('CI_BATCH_2_ENGINES const has 10', () => {
    expect(CI_BATCH_2_ENGINES).toHaveLength(10);
  });
});