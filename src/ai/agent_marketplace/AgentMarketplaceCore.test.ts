// V5366-V5375: Agent Marketplace Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  AgentRegistry,
  AgentPublisher,
  AgentSearch,
  AgentRating,
  AgentRanking,
  AgentReview,
  AgentCategory,
  AgentTag,
  AgentInstallCounter,
  AgentMarketplaceCoreIndex,
  AgentListing
} from './AgentMarketplaceCore';

const sampleAgent = (id: string, overrides: Partial<AgentListing> = {}): AgentListing => ({
  id,
  name: `Agent ${id}`,
  author: 'alice',
  description: `desc ${id}`,
  category: 'productivity',
  tags: ['llm', 'writing'],
  version: '1.0.0',
  publishedAt: Date.now(),
  priceUsd: 0,
  downloads: 100,
  ...overrides
});

describe('AgentRegistry', () => {
  it('register and get', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('a1'));
    expect(r.get('a1')?.name).toBe('Agent a1');
    expect(r.get('missing')).toBeNull();
  });

  it('unregister removes agent', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('a1'));
    expect(r.unregister('a1')).toBe(true);
    expect(r.unregister('a1')).toBe(false);
  });

  it('byAuthor filters', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('a1', { author: 'alice' }));
    r.register(sampleAgent('a2', { author: 'bob' }));
    expect(r.byAuthor('alice').length).toBe(1);
  });

  it('byCategory filters', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('a1', { category: 'productivity' }));
    r.register(sampleAgent('a2', { category: 'analytics' }));
    expect(r.byCategory('productivity').length).toBe(1);
  });

  it('searchByTag finds agents with tag', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('a1', { tags: ['llm', 'writing'] }));
    r.register(sampleAgent('a2', { tags: ['vision'] }));
    expect(r.searchByTag('llm').length).toBe(1);
  });
});

describe('AgentPublisher', () => {
  it('publish creates new agent', () => {
    const r = new AgentRegistry();
    const p = new AgentPublisher(r);
    p.publish(sampleAgent('a1'));
    expect(r.get('a1')).not.toBeNull();
  });

  it('publishLog tracks create vs update', () => {
    const r = new AgentRegistry();
    const p = new AgentPublisher(r);
    p.publish(sampleAgent('a1'));
    p.publish(sampleAgent('a1', { name: 'Updated' }));
    const log = p.publishLog('a1');
    expect(log.map(l => l.action)).toEqual(['create', 'update']);
  });

  it('deprecate removes agent', () => {
    const r = new AgentRegistry();
    const p = new AgentPublisher(r);
    p.publish(sampleAgent('a1'));
    expect(p.deprecate('a1')).toBe(true);
    expect(p.deprecate('a1')).toBe(false);
  });

  it('versionBump updates version', () => {
    const r = new AgentRegistry();
    const p = new AgentPublisher(r);
    p.publish(sampleAgent('a1'));
    expect(p.versionBump('a1', '2.0.0')).toBe(true);
    expect(r.get('a1')?.version).toBe('2.0.0');
  });

  it('versionBump fails on missing agent', () => {
    const r = new AgentRegistry();
    const p = new AgentPublisher(r);
    expect(p.versionBump('missing', '2.0.0')).toBe(false);
  });
});

describe('AgentSearch', () => {
  it('search by query string', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('a1', { name: 'Writing Assistant' }));
    r.register(sampleAgent('a2', { name: 'Code Helper' }));
    const s = new AgentSearch(r);
    const results = s.search({ query: 'writing' });
    expect(results.length).toBe(1);
  });

  it('search by category', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('a1', { category: 'productivity' }));
    const s = new AgentSearch(r);
    expect(s.search({ query: '', category: 'productivity' }).length).toBe(1);
  });

  it('search by tags', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('a1', { tags: ['llm'] }));
    const s = new AgentSearch(r);
    expect(s.search({ query: '', tags: ['vision'] }).length).toBe(0);
    expect(s.search({ query: '', tags: ['llm'] }).length).toBe(1);
  });

  it('search by maxPriceUsd', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('free', { priceUsd: 0 }));
    r.register(sampleAgent('paid', { priceUsd: 50 }));
    const s = new AgentSearch(r);
    expect(s.search({ query: '', maxPriceUsd: 10 }).length).toBe(1);
  });

  it('suggestions returns prefix matches', () => {
    const r = new AgentRegistry();
    r.register(sampleAgent('a1', { name: 'Writing Helper' }));
    r.register(sampleAgent('a2', { name: 'Writing Coach' }));
    r.register(sampleAgent('a3', { name: 'Code Helper' }));
    const s = new AgentSearch(r);
    expect(s.suggestions('Writ').length).toBe(2);
  });
});

describe('AgentRating', () => {
  it('submit and averageStars', () => {
    const r = new AgentRating();
    r.submit({ agentId: 'a1', userId: 'u1', stars: 5, review: 'great' });
    r.submit({ agentId: 'a1', userId: 'u2', stars: 3, review: 'ok' });
    expect(r.averageStars('a1')).toBe(4);
  });

  it('averageStars returns 0 when no ratings', () => {
    const r = new AgentRating();
    expect(r.averageStars('missing')).toBe(0);
  });

  it('ratingsFor filters by agent', () => {
    const r = new AgentRating();
    r.submit({ agentId: 'a1', userId: 'u1', stars: 5, review: 'x' });
    r.submit({ agentId: 'a2', userId: 'u2', stars: 4, review: 'y' });
    expect(r.ratingsFor('a1').length).toBe(1);
  });

  it('ratingsByUser filters', () => {
    const r = new AgentRating();
    r.submit({ agentId: 'a1', userId: 'u1', stars: 5, review: 'x' });
    r.submit({ agentId: 'a2', userId: 'u1', stars: 4, review: 'y' });
    r.submit({ agentId: 'a1', userId: 'u2', stars: 3, review: 'z' });
    expect(r.ratingsByUser('u1').length).toBe(2);
  });

  it('starDistribution counts per star', () => {
    const r = new AgentRating();
    r.submit({ agentId: 'a1', userId: 'u1', stars: 5, review: '' });
    r.submit({ agentId: 'a1', userId: 'u2', stars: 5, review: '' });
    r.submit({ agentId: 'a1', userId: 'u3', stars: 3, review: '' });
    const dist = r.starDistribution('a1');
    expect(dist[5]).toBe(2);
    expect(dist[3]).toBe(1);
  });
});

describe('AgentRanking', () => {
  it('rank scores by downloads + rating + free bonus', () => {
    const r = new AgentRegistry();
    const ratings = new AgentRating();
    r.register(sampleAgent('free', { downloads: 10, priceUsd: 0 }));
    r.register(sampleAgent('paid', { downloads: 1000, priceUsd: 50 }));
    ratings.submit({ agentId: 'paid', userId: 'u1', stars: 5, review: '' });
    const ranker = new AgentRanking(r, ratings);
    const ranked = ranker.rank();
    expect(ranked[0].agent.id).toBe('paid');
  });

  it('topByCategory filters', () => {
    const r = new AgentRegistry();
    const ratings = new AgentRating();
    r.register(sampleAgent('a1', { category: 'prod', downloads: 100 }));
    r.register(sampleAgent('a2', { category: 'analytics', downloads: 500 }));
    const ranker = new AgentRanking(r, ratings);
    const top = ranker.topByCategory('prod');
    expect(top.length).toBe(1);
  });

  it('rank returns agents with rank index', () => {
    const r = new AgentRegistry();
    const ratings = new AgentRating();
    r.register(sampleAgent('a1'));
    r.register(sampleAgent('a2'));
    const ranked = new AgentRanking(r, ratings).rank();
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });

  it('rank with empty registry returns empty', () => {
    const ranker = new AgentRanking(new AgentRegistry(), new AgentRating());
    expect(ranker.rank()).toEqual([]);
  });

  it('free bonus boosts score', () => {
    const r = new AgentRegistry();
    const ratings = new AgentRating();
    r.register(sampleAgent('free', { downloads: 0, priceUsd: 0 }));
    r.register(sampleAgent('paid', { downloads: 0, priceUsd: 50 }));
    const ranker = new AgentRanking(r, ratings);
    const ranked = ranker.rank();
    expect(ranked[0].agent.id).toBe('free');
  });
});

describe('AgentReview', () => {
  it('add returns review with id', () => {
    const r = new AgentReview();
    const rev = r.add({ agentId: 'a1', userId: 'u1', title: 'Great', body: 'Loved it' });
    expect(rev.id).toBe('rev-1');
    expect(rev.helpful).toBe(0);
  });

  it('markHelpful increments counter', () => {
    const r = new AgentReview();
    const rev = r.add({ agentId: 'a1', userId: 'u1', title: 't', body: 'b' });
    r.markHelpful(rev.id);
    r.markHelpful(rev.id);
    expect(r.reviewsFor('a1')[0].helpful).toBe(2);
  });

  it('mostHelpful sorts by helpful count', () => {
    const r = new AgentReview();
    const rev1 = r.add({ agentId: 'a1', userId: 'u1', title: 't1', body: 'b1' });
    r.add({ agentId: 'a1', userId: 'u2', title: 't2', body: 'b2' });
    r.markHelpful(rev1.id);
    r.markHelpful(rev1.id);
    expect(r.mostHelpful('a1')[0].id).toBe(rev1.id);
  });

  it('reviewsByUser filters', () => {
    const r = new AgentReview();
    r.add({ agentId: 'a1', userId: 'u1', title: 't', body: 'b' });
    r.add({ agentId: 'a2', userId: 'u2', title: 't', body: 'b' });
    expect(r.reviewsByUser('u1').length).toBe(1);
  });

  it('markHelpful fails on missing id', () => {
    const r = new AgentReview();
    expect(r.markHelpful('missing')).toBe(false);
  });
});

describe('AgentCategory', () => {
  it('add and list', () => {
    const c = new AgentCategory();
    c.add('prod', 'Productivity', 'boost work');
    c.add('analytics', 'Analytics', 'data insights');
    expect(c.list().sort()).toEqual(['analytics', 'prod']);
  });

  it('increment tracks agent count', () => {
    const c = new AgentCategory();
    c.add('prod', 'Productivity', 'x');
    c.increment('prod');
    c.increment('prod');
    expect(c.byId('prod')?.count).toBe(2);
  });

  it('popular sorts by count desc', () => {
    const c = new AgentCategory();
    c.add('a', 'A', '');
    c.add('b', 'B', '');
    c.increment('a');
    c.increment('b');
    c.increment('b');
    expect(c.popular()[0]).toBe('b');
  });

  it('byId returns null for missing', () => {
    const c = new AgentCategory();
    expect(c.byId('missing')).toBeNull();
  });

  it('totalCategories counts', () => {
    const c = new AgentCategory();
    c.add('a', 'A', '');
    c.add('b', 'B', '');
    expect(c.totalCategories()).toBe(2);
  });
});

describe('AgentTag', () => {
  it('tag and tagsFor', () => {
    const t = new AgentTag();
    t.tag('a1', 'llm');
    t.tag('a1', 'writing');
    t.tag('a2', 'vision');
    expect(t.tagsFor('a1').sort()).toEqual(['llm', 'writing']);
  });

  it('globalTagCloud aggregates', () => {
    const t = new AgentTag();
    t.tag('a1', 'llm');
    t.tag('a2', 'llm');
    t.tag('a3', 'vision');
    const cloud = t.globalTagCloud();
    expect(cloud[0].tag).toBe('llm');
    expect(cloud[0].count).toBe(2);
  });

  it('totalTags counts unique', () => {
    const t = new AgentTag();
    t.tag('a1', 'llm');
    t.tag('a2', 'llm');
    t.tag('a3', 'vision');
    expect(t.totalTags()).toBe(2);
  });

  it('tagsFor returns empty for new agent', () => {
    const t = new AgentTag();
    expect(t.tagsFor('a1')).toEqual([]);
  });

  it('globalTagCloud respects limit', () => {
    const t = new AgentTag();
    t.tag('a1', 'a');
    t.tag('a1', 'b');
    t.tag('a1', 'c');
    expect(t.globalTagCloud(2).length).toBe(2);
  });
});

describe('AgentInstallCounter', () => {
  it('install increments and counts', () => {
    const c = new AgentInstallCounter();
    c.install('a1', 'u1');
    c.install('a1', 'u2');
    expect(c.count('a1')).toBe(2);
  });

  it('uninstall decrements', () => {
    const c = new AgentInstallCounter();
    c.install('a1', 'u1');
    c.install('a1', 'u2');
    c.uninstall('a1', 'u1');
    expect(c.count('a1')).toBe(1);
  });

  it('uniqueInstalls counts distinct users', () => {
    const c = new AgentInstallCounter();
    c.install('a1', 'u1');
    c.install('a1', 'u1');
    c.install('a1', 'u2');
    expect(c.uniqueInstalls('a1')).toBe(2);
  });

  it('topInstalled sorts by count', () => {
    const c = new AgentInstallCounter();
    c.install('a', 'u1');
    c.install('b', 'u1');
    c.install('b', 'u2');
    expect(c.topInstalled(1)[0].agentId).toBe('b');
  });

  it('totalInstalls sums across agents', () => {
    const c = new AgentInstallCounter();
    c.install('a', 'u1');
    c.install('b', 'u1');
    expect(c.totalInstalls()).toBe(2);
  });
});

describe('AgentMarketplaceCoreIndex', () => {
  it('summary includes counts', () => {
    const r = new AgentRegistry();
    const ratings = new AgentRating();
    const installs = new AgentInstallCounter();
    r.register(sampleAgent('a1'));
    ratings.submit({ agentId: 'a1', userId: 'u1', stars: 5, review: '' });
    installs.install('a1', 'u1');
    const s = AgentMarketplaceCoreIndex.summary(r, ratings, installs);
    expect(s).toContain('Agents: 1');
    expect(s).toContain('Ratings: 1');
    expect(s).toContain('Installs: 1');
  });
});