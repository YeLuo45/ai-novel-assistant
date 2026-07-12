// V5386-V5395: Agent Marketplace Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  AgentAnalytics,
  AgentABTest,
  AgentRecommendation,
  AgentTrendingList,
  AgentFeatured,
  AgentSearchPersonalizer,
  AgentCompliance,
  AgentMarketplaceIntegrationIndex,
  AgentMarketplaceMasterIndex,
  DBAgentBridge
} from './AgentMarketplaceIntegration';
import {
  AgentRegistry,
  AgentRating,
  AgentInstallCounter,
  AgentListing
} from './AgentMarketplaceCore';
import {
  AgentBilling
} from './AgentMarketplaceAdvanced';

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

describe('AgentAnalytics', () => {
  it('record and snapshot', () => {
    const a = new AgentAnalytics();
    a.record({ agentId: 'a1', installs: 10, activeUsers: 5, revenueUsd: 100, avgRating: 4.5 });
    const snap = a.snapshot('a1');
    expect(snap?.installs).toBe(10);
    expect(snap?.revenueUsd).toBe(100);
  });

  it('snapshot returns null when no data', () => {
    const a = new AgentAnalytics();
    expect(a.snapshot('missing')).toBeNull();
  });

  it('allSnapshots aggregates across agents', () => {
    const a = new AgentAnalytics();
    a.record({ agentId: 'a1', installs: 10, activeUsers: 5, revenueUsd: 100, avgRating: 4.5 });
    a.record({ agentId: 'a2', installs: 20, activeUsers: 10, revenueUsd: 200, avgRating: 4.0 });
    expect(a.allSnapshots().length).toBe(2);
  });

  it('topByInstalls sorts', () => {
    const a = new AgentAnalytics();
    a.record({ agentId: 'a1', installs: 10, activeUsers: 5, revenueUsd: 100, avgRating: 4.5 });
    a.record({ agentId: 'a2', installs: 50, activeUsers: 10, revenueUsd: 200, avgRating: 4.0 });
    expect(a.topByInstalls(1)[0].agentId).toBe('a2');
  });

  it('topByRevenue sorts', () => {
    const a = new AgentAnalytics();
    a.record({ agentId: 'a1', installs: 10, activeUsers: 5, revenueUsd: 50, avgRating: 4.5 });
    a.record({ agentId: 'a2', installs: 50, activeUsers: 10, revenueUsd: 200, avgRating: 4.0 });
    expect(a.topByRevenue(1)[0].agentId).toBe('a2');
  });
});

describe('AgentABTest', () => {
  it('create initializes test', () => {
    const ab = new AgentABTest();
    const t = ab.create('test', [
      { name: 'A', agentId: 'a1' },
      { name: 'B', agentId: 'a1' }
    ]);
    expect(t.variants.length).toBe(2);
  });

  it('recordImpression increments', () => {
    const ab = new AgentABTest();
    const t = ab.create('test', [{ name: 'A', agentId: 'a1' }]);
    expect(ab.recordImpression(t.id, 'v1')).toBe(true);
    expect(t.variants[0].impressions).toBe(1);
  });

  it('recordConversion increments', () => {
    const ab = new AgentABTest();
    const t = ab.create('test', [{ name: 'A', agentId: 'a1' }]);
    ab.recordImpression(t.id, 'v1');
    ab.recordImpression(t.id, 'v1');
    ab.recordConversion(t.id, 'v1');
    expect(t.variants[0].conversions).toBe(1);
  });

  it('end marks ended', () => {
    const ab = new AgentABTest();
    const t = ab.create('test', [{ name: 'A', agentId: 'a1' }]);
    expect(ab.end(t.id)).toBe(true);
    expect(t.endedAt).not.toBeNull();
  });

  it('winner picks highest conversion rate', () => {
    const ab = new AgentABTest();
    const t = ab.create('test', [
      { name: 'A', agentId: 'a1' },
      { name: 'B', agentId: 'a1' }
    ]);
    for (let i = 0; i < 10; i++) ab.recordImpression(t.id, 'v1');
    ab.recordConversion(t.id, 'v1');
    for (let i = 0; i < 10; i++) ab.recordImpression(t.id, 'v2');
    for (let i = 0; i < 5; i++) ab.recordConversion(t.id, 'v2');
    expect(ab.winner(t.id)?.name).toBe('B');
  });
});

describe('AgentRecommendation', () => {
  it('recommend excludes installed', () => {
    const reg = new AgentRegistry();
    reg.register(sampleAgent('a1'));
    reg.register(sampleAgent('a2'));
    const rec = new AgentRecommendation(reg);
    const result = rec.recommend({ userId: 'u1', installedAgents: ['a1'], viewedCategories: [] });
    expect(result.every(a => a.id !== 'a1')).toBe(true);
  });

  it('recommend boosts category matches', () => {
    const reg = new AgentRegistry();
    reg.register(sampleAgent('a1', { category: 'prod', downloads: 0 }));
    reg.register(sampleAgent('a2', { category: 'analytics', downloads: 1000 }));
    const rec = new AgentRecommendation(reg);
    const result = rec.recommend({ userId: 'u1', installedAgents: [], viewedCategories: ['prod'] });
    expect(result[0].id).toBe('a1');
  });

  it('related finds same-category agents', () => {
    const reg = new AgentRegistry();
    reg.register(sampleAgent('a1', { category: 'prod' }));
    reg.register(sampleAgent('a2', { category: 'prod' }));
    reg.register(sampleAgent('a3', { category: 'analytics' }));
    const rec = new AgentRecommendation(reg);
    const related = rec.related('a1', 2);
    expect(related.length).toBe(2);
    expect(related[0].id).toBe('a2');
  });

  it('related returns empty for missing', () => {
    const reg = new AgentRegistry();
    const rec = new AgentRecommendation(reg);
    expect(rec.related('missing')).toEqual([]);
  });

  it('related finds shared-tag agents', () => {
    const reg = new AgentRegistry();
    reg.register(sampleAgent('a1', { category: 'prod', tags: ['llm'] }));
    reg.register(sampleAgent('a2', { category: 'analytics', tags: ['llm'] }));
    reg.register(sampleAgent('a3', { category: 'analytics', tags: ['vision'] }));
    const rec = new AgentRecommendation(reg);
    const related = rec.related('a1', 1);
    expect(related[0].id).toBe('a2');
  });
});

describe('AgentTrendingList', () => {
  it('recordDownload and trending', () => {
    const reg = new AgentRegistry();
    reg.register(sampleAgent('a1'));
    reg.register(sampleAgent('a2'));
    const t = new AgentTrendingList(reg);
    t.recordDownload('a1');
    t.recordDownload('a1');
    t.recordDownload('a2');
    expect(t.trending(2)[0].id).toBe('a1');
  });

  it('reviews boost score', () => {
    const reg = new AgentRegistry();
    reg.register(sampleAgent('a1'));
    reg.register(sampleAgent('a2'));
    const t = new AgentTrendingList(reg);
    t.recordDownload('a2');
    t.recordReview('a1');
    t.recordReview('a1');
    expect(t.trending()[0].id).toBe('a1');
  });

  it('reset clears scores', () => {
    const reg = new AgentRegistry();
    reg.register(sampleAgent('a1'));
    const t = new AgentTrendingList(reg);
    t.recordDownload('a1');
    t.reset();
    expect(t.trending().length).toBe(1);
  });

  it('trending respects limit', () => {
    const reg = new AgentRegistry();
    for (let i = 0; i < 5; i++) reg.register(sampleAgent(`a${i}`));
    const t = new AgentTrendingList(reg);
    expect(t.trending(3).length).toBe(3);
  });

  it('trending with no activity returns all', () => {
    const reg = new AgentRegistry();
    reg.register(sampleAgent('a1'));
    reg.register(sampleAgent('a2'));
    const t = new AgentTrendingList(reg);
    expect(t.trending().length).toBe(2);
  });
});

describe('AgentFeatured', () => {
  it('feature and unfeature', () => {
    const f = new AgentFeatured();
    expect(f.feature('a1')).toBe(true);
    expect(f.feature('a1')).toBe(false);
    expect(f.unfeature('a1')).toBe(true);
    expect(f.unfeature('a1')).toBe(false);
  });

  it('isFeatured checks membership', () => {
    const f = new AgentFeatured();
    f.feature('a1');
    expect(f.isFeatured('a1')).toBe(true);
    expect(f.isFeatured('a2')).toBe(false);
  });

  it('featuredList preserves order', () => {
    const f = new AgentFeatured();
    f.feature('a1');
    f.feature('a2');
    f.feature('a3');
    expect(f.featuredList()).toEqual(['a1', 'a2', 'a3']);
  });

  it('reorder updates order', () => {
    const f = new AgentFeatured();
    f.feature('a1');
    f.feature('a2');
    f.feature('a3');
    expect(f.reorder(['a3', 'a2', 'a1'])).toBe(true);
    expect(f.featuredList()).toEqual(['a3', 'a2', 'a1']);
  });

  it('reorder fails on mismatch', () => {
    const f = new AgentFeatured();
    f.feature('a1');
    f.feature('a2');
    expect(f.reorder(['a1', 'a3'])).toBe(false);
  });
});

describe('AgentSearchPersonalizer', () => {
  it('recordView and recentViews', () => {
    const p = new AgentSearchPersonalizer();
    p.recordView('u1', 'a1');
    p.recordView('u1', 'a2');
    expect(p.recentViews('u1', 2)).toEqual(['a1', 'a2']);
  });

  it('personalize boosts recently-viewed categories', () => {
    const p = new AgentSearchPersonalizer();
    p.recordView('u1', 'a1');
    const candidates = [sampleAgent('a2', { category: 'prod' }), sampleAgent('a3', { category: 'analytics' })];
    const result = p.personalize('u1', candidates);
    expect(result[0].category).toBe('prod');
  });

  it('users returns unique user ids', () => {
    const p = new AgentSearchPersonalizer();
    p.recordView('u1', 'a1');
    p.recordView('u2', 'a2');
    expect(p.users().sort()).toEqual(['u1', 'u2']);
  });

  it('recentViews returns empty for new user', () => {
    const p = new AgentSearchPersonalizer();
    expect(p.recentViews('u1')).toEqual([]);
  });

  it('personalize returns same order for new user', () => {
    const p = new AgentSearchPersonalizer();
    const candidates = [sampleAgent('a1'), sampleAgent('a2')];
    expect(p.personalize('new', candidates).length).toBe(2);
  });
});

describe('AgentCompliance', () => {
  it('check records pass/fail', () => {
    const c = new AgentCompliance();
    c.check('a1', 'gdpr', true);
    c.check('a1', 'ccpa', false);
    expect(c.failures().length).toBe(1);
  });

  it('failuresFor returns agent failures', () => {
    const c = new AgentCompliance();
    c.check('a1', 'gdpr', false);
    c.check('a2', 'gdpr', true);
    expect(c.failuresFor('a1').length).toBe(1);
  });

  it('isCompliant returns true when no failures', () => {
    const c = new AgentCompliance();
    c.check('a1', 'gdpr', true);
    expect(c.isCompliant('a1')).toBe(true);
  });

  it('byRule filters', () => {
    const c = new AgentCompliance();
    c.check('a1', 'gdpr', true);
    c.check('a1', 'ccpa', true);
    expect(c.byRule('gdpr').length).toBe(1);
  });

  it('passRate is 1 when no checks', () => {
    const c = new AgentCompliance();
    expect(c.passRate()).toBe(1);
  });
});

describe('AgentMarketplaceIntegrationIndex', () => {
  it('summary combines', () => {
    const reg = new AgentRegistry();
    const analytics = new AgentAnalytics();
    const compliance = new AgentCompliance();
    const ab = new AgentABTest();
    reg.register(sampleAgent('a1'));
    analytics.record({ agentId: 'a1', installs: 1, activeUsers: 1, revenueUsd: 0, avgRating: 0 });
    compliance.check('a1', 'gdpr', true);
    ab.create('test', [{ name: 'A', agentId: 'a1' }]);
    const s = AgentMarketplaceIntegrationIndex.summary(reg, analytics, compliance, ab);
    expect(s).toContain('Agents: 1');
    expect(s).toContain('Metrics: 1');
    expect(s).toContain('A/B tests: 1');
  });
});

describe('AgentMarketplaceMasterIndex', () => {
  it('totalEngines returns count', () => {
    expect(AgentMarketplaceMasterIndex.totalEngines()).toBeGreaterThan(20);
  });

  it('allModules includes core engines', () => {
    const modules = AgentMarketplaceMasterIndex.allModules();
    expect(modules).toContain('AgentRegistry');
    expect(modules).toContain('AgentAnalytics');
    expect(modules).toContain('AgentCompliance');
  });
});

describe('DBAgentBridge', () => {
  it('populateMetrics fills analytics', () => {
    const reg = new AgentRegistry();
    const installs = new AgentInstallCounter();
    const ratings = new AgentRating();
    const analytics = new AgentAnalytics();
    const billing = new AgentBilling();
    reg.register(sampleAgent('a1'));
    reg.register(sampleAgent('a2'));
    installs.install('a1', 'u1');
    ratings.submit({ agentId: 'a1', userId: 'u1', stars: 5, review: '' });
    billing.charge('a1', 'u1', 50);
    const n = DBAgentBridge.populateMetrics(reg, installs, ratings, analytics, billing);
    expect(n).toBe(2);
    expect(analytics.allSnapshots().length).toBe(2);
  });

  it('topAgentsByRevenue sorts', () => {
    const reg = new AgentRegistry();
    const billing = new AgentBilling();
    reg.register(sampleAgent('a1'));
    reg.register(sampleAgent('a2'));
    billing.charge('a1', 'u1', 100);
    billing.charge('a2', 'u2', 500);
    const top = DBAgentBridge.topAgentsByRevenue(reg, billing);
    expect(top[0].id).toBe('a2');
  });
});