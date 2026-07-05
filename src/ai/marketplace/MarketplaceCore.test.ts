// Round 8 Direction CI — Marketplace for Plugins 2.0 Batch 1/3 (Core Tests)
// V4826-V4835: 10 engines tested
import { describe, it, expect } from 'vitest';
import {
  MarketplaceCore, StoreFront, PluginListing, Category, PricingTier,
  SubscriptionModel, PaymentProcessor, InvoiceGenerator, LicenseKey, ReceiptTracker,
  MarketplaceCoreIndex, CI_BATCH_1_ENGINES
} from './MarketplaceCore';

describe('MarketplaceCore', () => {
  it('registerPlugin + hasPlugin', () => {
    const m = new MarketplaceCore();
    expect(m.registerPlugin('plug1', 'seller1', 9.99)).toBe(true);
    expect(m.hasPlugin('plug1')).toBe(true);
    expect(m.pluginCount()).toBe(1);
  });

  it('registerPlugin returns false on duplicate', () => {
    const m = new MarketplaceCore();
    m.registerPlugin('plug1', 'seller1', 9.99);
    expect(m.registerPlugin('plug1', 'seller2', 19.99)).toBe(false);
  });

  it('unregisterPlugin', () => {
    const m = new MarketplaceCore();
    m.registerPlugin('plug1', 'seller1', 9.99);
    expect(m.unregisterPlugin('plug1')).toBe(true);
    expect(m.hasPlugin('plug1')).toBe(false);
  });

  it('getPlugin returns registered info', () => {
    const m = new MarketplaceCore();
    m.registerPlugin('plug1', 'seller1', 9.99, 'EUR');
    const p = m.getPlugin('plug1');
    expect(p!.sellerId).toBe('seller1');
    expect(p!.currency).toBe('EUR');
  });

  it('recordRevenue + totalRevenue', () => {
    const m = new MarketplaceCore();
    m.recordRevenue('USD', 99.99);
    m.recordRevenue('USD', 50.00);
    m.recordRevenue('EUR', 30.00);
    expect(m.totalRevenue('USD')).toBe(149.99);
    expect(m.totalRevenue('EUR')).toBe(30);
  });

  it('sellerCount tracks unique sellers', () => {
    const m = new MarketplaceCore();
    m.registerPlugin('a', 'seller1', 1);
    m.registerPlugin('b', 'seller2', 2);
    m.registerPlugin('c', 'seller1', 3);
    expect(m.sellerCount()).toBe(2);
  });
});

describe('StoreFront', () => {
  it('default layout grid', () => {
    expect(new StoreFront().layout()).toBe('grid');
  });

  it('setBanner + banner()', () => {
    const s = new StoreFront().setBanner('Welcome to marketplace');
    expect(s.banner()).toBe('Welcome to marketplace');
  });

  it('addCategory + removeCategory', () => {
    const s = new StoreFront();
    s.addCategory('productivity').addCategory('writing');
    expect(s.categories()).toHaveLength(2);
    s.removeCategory('productivity');
    expect(s.categories()).toEqual(['writing']);
  });

  it('feature + unfeature tracks plugin', () => {
    const s = new StoreFront();
    s.feature('plugin-a');
    s.feature('plugin-b');
    expect(s.featured()).toHaveLength(2);
    s.unfeature('plugin-a');
    expect(s.featured()).toEqual(['plugin-b']);
  });

  it('toDict returns full config', () => {
    const s = new StoreFront().setBanner('Hi').setLayout('list');
    s.addCategory('tools').feature('p1');
    const d = s.toDict();
    expect(d.banner).toBe('Hi');
    expect(d.layout).toBe('list');
    expect(d.categories).toContain('tools');
  });
});

describe('PluginListing', () => {
  it('default empty listing is incomplete', () => {
    expect(new PluginListing().isComplete()).toBe(false);
    expect(new PluginListing().completeness()).toBeLessThan(1);
  });

  it('isComplete when name+description+screenshot+requirement', () => {
    const p = new PluginListing().setName('My Plugin').setDescription('A description with more than 10 chars');
    p.addScreenshot('/img.png').addRequirement('Node 18').addTag('ai');
    expect(p.isComplete()).toBe(true);
    expect(p.completeness()).toBe(1);
  });

  it('addTag dedupes', () => {
    const p = new PluginListing();
    p.addTag('ai').addTag('ai').addTag('writing');
    expect(p.tags()).toEqual(['ai', 'writing']);
  });

  it('addChangelog + changelog returns sorted entries', () => {
    const p = new PluginListing();
    p.addChangelog('1.0.0', '2026-01-01', 'Initial');
    p.addChangelog('1.1.0', '2026-02-01', 'Bugfix');
    expect(p.changelog()).toHaveLength(2);
    expect(p.changelog()[1].version).toBe('1.1.0');
  });

  it('addRequirement tracks requirements', () => {
    const p = new PluginListing();
    p.addRequirement('Node 18').addRequirement('React 18');
    expect(p.requirements()).toHaveLength(2);
  });
});

describe('Category', () => {
  it('constructor + id/name/parent', () => {
    const c = new Category('writing', 'Writing', null);
    expect(c.id()).toBe('writing');
    expect(c.parent()).toBeNull();
    expect(c.isRoot()).toBe(true);
  });

  it('addPlugin + pluginCount', () => {
    const c = new Category('ai', 'AI');
    c.addPlugin('p1').addPlugin('p2');
    expect(c.pluginCount()).toBe(2);
    expect(c.plugins()).toContain('p1');
  });

  it('removePlugin', () => {
    const c = new Category('ai', 'AI');
    c.addPlugin('p1');
    c.removePlugin('p1');
    expect(c.pluginCount()).toBe(0);
  });

  it('hasChildren with sub-categories', () => {
    const c = new Category('writing', 'Writing', null);
    const children = new Set(['writing/fiction', 'writing/non-fiction']);
    expect(c.hasChildren(children)).toBe(true);
  });

  it('toDict serializes', () => {
    const c = new Category('a', 'A', 'parent').setIcon('📁');
    c.addPlugin('p1');
    expect(c.toDict().name).toBe('A');
    expect(c.toDict().parent).toBe('parent');
  });
});

describe('PricingTier', () => {
  it('addTier + tiers returns', () => {
    const p = new PricingTier();
    p.addTier('basic', 9.99, ['feature1']);
    p.addTier('pro', 29.99, ['feature1', 'feature2'], true);
    expect(p.tiers()).toHaveLength(2);
  });

  it('cheapest returns lowest price', () => {
    const p = new PricingTier();
    p.addTier('basic', 5, []);
    p.addTier('premium', 50, []);
    expect(p.cheapest()).toEqual({ name: 'basic', price: 5 });
  });

  it('setPopular marks tier', () => {
    const p = new PricingTier();
    p.addTier('pro', 20, []);
    p.setPopular('pro');
    expect(p.getTier('pro')!.popular).toBe(true);
  });

  it('removeTier', () => {
    const p = new PricingTier();
    p.addTier('basic', 5, []);
    p.removeTier('basic');
    expect(p.count()).toBe(0);
  });

  it('count returns tier count', () => {
    expect(new PricingTier().count()).toBe(0);
  });
});

describe('SubscriptionModel', () => {
  it('monthlyEquivalent calculation', () => {
    const s = new SubscriptionModel().setInterval('monthly').setPrice(10);
    expect(s.monthlyEquivalent()).toBe(10);
    const q = new SubscriptionModel().setInterval('quarterly').setPrice(27);
    expect(q.monthlyEquivalent()).toBe(9);
  });

  it('yearlyTotal', () => {
    const s = new SubscriptionModel().setInterval('monthly').setPrice(10);
    expect(s.yearlyTotal()).toBe(120);
    const a = new SubscriptionModel().setInterval('annual').setPrice(100);
    expect(a.yearlyTotal()).toBe(100);
  });

  it('lifetime amortizes over 5 years', () => {
    const s = new SubscriptionModel().setInterval('lifetime').setPrice(600);
    expect(s.monthlyEquivalent()).toBe(10);
  });

  it('setTrialDays clamps 0-90', () => {
    const s = new SubscriptionModel();
    s.setTrialDays(999);
    expect(s.toDict().trialDays).toBe(90);
  });

  it('hasTrial true when days > 0', () => {
    expect(new SubscriptionModel().setTrialDays(14).hasTrial()).toBe(true);
    expect(new SubscriptionModel().hasTrial()).toBe(false);
  });
});

describe('PaymentProcessor', () => {
  it('default supported methods', () => {
    const p = new PaymentProcessor();
    expect(p.supportsMethod('credit-card')).toBe(true);
    expect(p.supportsMethod('crypto')).toBe(false);
  });

  it('enableMethod + disableMethod', () => {
    const p = new PaymentProcessor();
    p.enableMethod('crypto');
    expect(p.supportsMethod('crypto')).toBe(true);
    p.disableMethod('credit-card');
    expect(p.supportsMethod('credit-card')).toBe(false);
  });

  it('process returns completed for valid transaction', () => {
    const p = new PaymentProcessor();
    const r = p.process(99.99, 'credit-card');
    expect(r.status).toBe('completed');
    expect(p.completedCount()).toBe(1);
  });

  it('process fails for amount <= 0', () => {
    const p = new PaymentProcessor();
    expect(p.process(0, 'credit-card').status).toBe('failed');
    expect(p.process(-10, 'credit-card').status).toBe('failed');
  });

  it('process fails for unsupported method', () => {
    const p = new PaymentProcessor();
    expect(p.process(50, 'crypto').status).toBe('failed');
  });

  it('refund completes a successful transaction', () => {
    const p = new PaymentProcessor();
    const r = p.process(50, 'credit-card');
    expect(p.refund(r.id)).toBe(true);
  });
});

describe('InvoiceGenerator', () => {
  it('generate with subtotal + tax + total', () => {
    const i = new InvoiceGenerator().setTaxRate(0.1);
    const inv = i.generate([{ description: 'Plugin A', amount: 100 }, { description: 'Plugin B', amount: 50 }]);
    expect(inv.subtotal).toBe(150);
    expect(inv.tax).toBe(15);
    expect(inv.total).toBe(165);
  });

  it('setTaxRate clamps 0-0.5', () => {
    const i = new InvoiceGenerator();
    i.setTaxRate(2);
    expect(i.taxRate()).toBe(0.5);
  });

  it('setPrefix + invoice id uses prefix', () => {
    const i = new InvoiceGenerator().setPrefix('TEST');
    const inv = i.generate([{ description: 'x', amount: 10 }]);
    expect(inv.id).toMatch(/^TEST-/);
  });

  it('get retrieves invoice by id', () => {
    const i = new InvoiceGenerator();
    const inv = i.generate([{ description: 'x', amount: 10 }]);
    expect(i.get(inv.id)).toBeDefined();
  });

  it('invoiceCount tracks total', () => {
    const i = new InvoiceGenerator();
    i.generate([{ description: 'x', amount: 10 }]);
    i.generate([{ description: 'y', amount: 20 }]);
    expect(i.invoiceCount()).toBe(2);
  });
});

describe('LicenseKey', () => {
  it('generate produces MP-prefixed key', () => {
    const l = new LicenseKey();
    const key = l.generate('plugin1', 'user1');
    expect(key).toMatch(/^MP-/);
    expect(l.count()).toBe(1);
  });

  it('validate returns valid for fresh key', () => {
    const l = new LicenseKey();
    const key = l.generate('plugin1', 'user1', 365);
    const v = l.validate(key);
    expect(v.valid).toBe(true);
    expect(v.pluginId).toBe('plugin1');
  });

  it('validate returns invalid for unknown key', () => {
    const l = new LicenseKey();
    expect(l.validate('MP-INVALID').valid).toBe(false);
  });

  it('revoke + validate returns revoked', () => {
    const l = new LicenseKey();
    const key = l.generate('p1', 'u1');
    l.revoke(key);
    expect(l.validate(key).reason).toBe('revoked');
  });

  it('expired key returns expired reason', () => {
    const l = new LicenseKey();
    const key = l.generate('p1', 'u1', -1);
    expect(l.validate(key).reason).toBe('expired');
  });
});

describe('ReceiptTracker', () => {
  it('record + get', () => {
    const r = new ReceiptTracker();
    r.record('R001', 'user1', 99.99, 'USD', ['plugin1']);
    expect(r.get('R001')).toBeDefined();
    expect(r.count()).toBe(1);
  });

  it('buyerTotal aggregates by buyer+currency', () => {
    const r = new ReceiptTracker();
    r.record('R1', 'user1', 50, 'USD', ['p1']);
    r.record('R2', 'user1', 30, 'USD', ['p2']);
    r.record('R3', 'user1', 100, 'EUR', ['p3']);
    expect(r.buyerTotal('user1', 'USD')).toBe(80);
    expect(r.buyerTotal('user1', 'EUR')).toBe(100);
  });

  it('different buyers are tracked separately', () => {
    const r = new ReceiptTracker();
    r.record('R1', 'alice', 50, 'USD', []);
    r.record('R2', 'bob', 100, 'USD', []);
    expect(r.buyerTotal('alice', 'USD')).toBe(50);
    expect(r.buyerTotal('bob', 'USD')).toBe(100);
  });

  it('count returns receipt count', () => {
    const r = new ReceiptTracker();
    r.record('R1', 'a', 1, 'USD', []);
    r.record('R2', 'a', 2, 'USD', []);
    expect(r.count()).toBe(2);
  });

  it('get returns undefined for unknown', () => {
    expect(new ReceiptTracker().get('unknown')).toBeUndefined();
  });
});

describe('MarketplaceCoreIndex', () => {
  it('list has 10 engines', () => {
    expect(new MarketplaceCoreIndex().list()).toHaveLength(10);
  });

  it('count 10', () => {
    expect(new MarketplaceCoreIndex().count()).toBe(10);
  });

  it('has checks', () => {
    expect(new MarketplaceCoreIndex().has('MarketplaceCore')).toBe(true);
    expect(new MarketplaceCoreIndex().has('Unknown')).toBe(false);
  });

  it('CI_BATCH_1_ENGINES const has 10', () => {
    expect(CI_BATCH_1_ENGINES).toHaveLength(10);
  });
});