// V5386-V5395: DB AI Agent Marketplace 2.0 Integration Batch 3/3
// AgentAnalytics + AgentABTest + AgentRecommendation + AgentTrendingList + AgentFeatured + AgentSearchPersonalizer + AgentCompliance + AgentMarketplaceIntegrationIndex + AgentMarketplaceMasterIndex + DBAgentBridge

import {
  AgentRegistry,
  AgentListing,
  AgentRating,
  AgentInstallCounter
} from './AgentMarketplaceCore';
import {
  AgentBilling,
  AgentSubscription
} from './AgentMarketplaceAdvanced';

export interface AgentMetric {
  agentId: string;
  installs: number;
  activeUsers: number;
  revenueUsd: number;
  avgRating: number;
  ts: number;
}

export class AgentAnalytics {
  private _metrics: AgentMetric[] = [];

  record(metric: Omit<AgentMetric, 'ts'>): void {
    this._metrics.push({ ...metric, ts: Date.now() });
  }

  snapshot(agentId: string): AgentMetric | null {
    const subset = this._metrics.filter(m => m.agentId === agentId);
    if (subset.length === 0) return null;
    const latest = subset[subset.length - 1];
    const installs = subset.reduce((sum, m) => sum + m.installs, 0);
    const revenue = subset.reduce((sum, m) => sum + m.revenueUsd, 0);
    const ratings = subset.reduce((sum, m) => sum + m.avgRating, 0) / subset.length;
    return { ...latest, installs, revenueUsd: revenue, avgRating: ratings };
  }

  allSnapshots(): AgentMetric[] {
    const ids = new Set(this._metrics.map(m => m.agentId));
    return [...ids].map(id => this.snapshot(id)).filter((m): m is AgentMetric => m !== null);
  }

  topByInstalls(limit: number = 5): AgentMetric[] {
    return this.allSnapshots()
      .sort((a, b) => b.installs - a.installs)
      .slice(0, limit);
  }

  topByRevenue(limit: number = 5): AgentMetric[] {
    return this.allSnapshots()
      .sort((a, b) => b.revenueUsd - a.revenueUsd)
      .slice(0, limit);
  }

  totalMetrics(): number { return this._metrics.length; }
}

export interface ABVariant {
  id: string;
  name: string;
  agentId: string;
  impressions: number;
  conversions: number;
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABVariant[];
  startedAt: number;
  endedAt: number | null;
}

export class AgentABTest {
  private _tests: ABTest[] = [];
  private _nextId = 1;

  create(name: string, variants: Omit<ABVariant, 'id' | 'impressions' | 'conversions'>[]): ABTest {
    const test: ABTest = {
      id: `ab-${this._nextId++}`,
      name,
      variants: variants.map((v, i) => ({
        id: `v${i + 1}`,
        impressions: 0,
        conversions: 0,
        ...v
      })),
      startedAt: Date.now(),
      endedAt: null
    };
    this._tests.push(test);
    return test;
  }

  recordImpression(testId: string, variantId: string): boolean {
    const test = this._tests.find(t => t.id === testId);
    const variant = test?.variants.find(v => v.id === variantId);
    if (!test || !variant) return false;
    variant.impressions += 1;
    return true;
  }

  recordConversion(testId: string, variantId: string): boolean {
    const test = this._tests.find(t => t.id === testId);
    const variant = test?.variants.find(v => v.id === variantId);
    if (!test || !variant) return false;
    variant.conversions += 1;
    return true;
  }

  end(testId: string): boolean {
    const test = this._tests.find(t => t.id === testId);
    if (!test || test.endedAt !== null) return false;
    test.endedAt = Date.now();
    return true;
  }

  winner(testId: string): ABVariant | null {
    const test = this._tests.find(t => t.id === testId);
    if (!test) return null;
    let best: ABVariant | null = null;
    let bestRate = -1;
    for (const v of test.variants) {
      const rate = v.impressions === 0 ? 0 : v.conversions / v.impressions;
      if (rate > bestRate) {
        best = v;
        bestRate = rate;
      }
    }
    return best;
  }

  totalTests(): number { return this._tests.length; }
}

export interface RecommendationContext {
  userId: string;
  installedAgents: string[];
  viewedCategories: string[];
}

export class AgentRecommendation {
  private _registry: AgentRegistry;

  constructor(registry: AgentRegistry) {
    this._registry = registry;
  }

  recommend(ctx: RecommendationContext, limit: number = 5): AgentListing[] {
    const all = this._registry.all();
    const installed = new Set(ctx.installedAgents);
    const candidates = all.filter(a => !installed.has(a.id));
    const scored = candidates.map(a => ({
      agent: a,
      score: this.scoreAgent(a, ctx)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.agent);
  }

  private scoreAgent(a: AgentListing, ctx: RecommendationContext): number {
    let score = a.downloads * 0.1;
    if (ctx.viewedCategories.includes(a.category)) score += 1000;
    return score;
  }

  related(agentId: string, limit: number = 3): AgentListing[] {
    const target = this._registry.get(agentId);
    if (!target) return [];
    const all = this._registry.all().filter(a => a.id !== agentId);
    return all
      .map(a => ({
        agent: a,
        score: this.relatedness(target, a)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.agent);
  }

  private relatedness(a: AgentListing, b: AgentListing): number {
    if (a.category === b.category) return 10;
    const sharedTags = a.tags.filter(t => b.tags.includes(t)).length;
    return sharedTags;
  }
}

export class AgentTrendingList {
  private _registry: AgentRegistry;
  private _recentDownloads = new Map<string, number>();
  private _recentReviews = new Map<string, number>();

  constructor(registry: AgentRegistry) {
    this._registry = registry;
  }

  recordDownload(agentId: string): void {
    this._recentDownloads.set(agentId, (this._recentDownloads.get(agentId) ?? 0) + 1);
  }

  recordReview(agentId: string): void {
    this._recentReviews.set(agentId, (this._recentReviews.get(agentId) ?? 0) + 1);
  }

  trending(limit: number = 10): AgentListing[] {
    const all = this._registry.all();
    return all
      .map(a => ({
        agent: a,
        score: this.trendingScore(a.id)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.agent);
  }

  private trendingScore(agentId: string): number {
    return (this._recentDownloads.get(agentId) ?? 0) * 2 + (this._recentReviews.get(agentId) ?? 0);
  }

  reset(): void {
    this._recentDownloads.clear();
    this._recentReviews.clear();
  }
}

export class AgentFeatured {
  private _featured = new Set<string>();
  private _order: string[] = [];

  feature(agentId: string): boolean {
    if (this._featured.has(agentId)) return false;
    this._featured.add(agentId);
    this._order.push(agentId);
    return true;
  }

  unfeature(agentId: string): boolean {
    if (!this._featured.has(agentId)) return false;
    this._featured.delete(agentId);
    this._order = this._order.filter(id => id !== agentId);
    return true;
  }

  isFeatured(agentId: string): boolean {
    return this._featured.has(agentId);
  }

  featuredList(): string[] {
    return [...this._order];
  }

  reorder(agentIds: string[]): boolean {
    if (agentIds.length !== this._featured.size) return false;
    for (const id of agentIds) {
      if (!this._featured.has(id)) return false;
    }
    this._order = agentIds;
    return true;
  }

  totalFeatured(): number { return this._featured.size; }
}

export class AgentSearchPersonalizer {
  private _userHistory = new Map<string, string[]>();

  recordView(userId: string, agentId: string): void {
    const history = this._userHistory.get(userId) ?? [];
    history.push(agentId);
    this._userHistory.set(userId, history);
  }

  recentViews(userId: string, limit: number = 5): string[] {
    const history = this._userHistory.get(userId) ?? [];
    return history.slice(-limit);
  }

  personalize(userId: string, candidates: AgentListing[]): AgentListing[] {
    const history = this._userHistory.get(userId) ?? [];
    const recentCategories = new Set(
      history.map(id => candidates.find(c => c.id === id)?.category).filter((c): c is string => !!c)
    );
    return [...candidates].sort((a, b) => {
      const aBoost = recentCategories.has(a.category) ? 1 : 0;
      const bBoost = recentCategories.has(b.category) ? 1 : 0;
      return bBoost - aBoost;
    });
  }

  users(): string[] {
    return [...this._userHistory.keys()];
  }
}

export interface ComplianceCheck {
  id: string;
  agentId: string;
  rule: 'gdpr' | 'ccpa' | 'pii' | 'content-policy' | 'age-restriction';
  passed: boolean;
  notes: string;
  ts: number;
}

export class AgentCompliance {
  private _checks: ComplianceCheck[] = [];
  private _nextId = 1;

  check(agentId: string, rule: ComplianceCheck['rule'], passed: boolean, notes: string = ''): ComplianceCheck {
    const c: ComplianceCheck = {
      id: `cmp-${this._nextId++}`,
      agentId,
      rule,
      passed,
      notes,
      ts: Date.now()
    };
    this._checks.push(c);
    return c;
  }

  failures(): ComplianceCheck[] {
    return this._checks.filter(c => !c.passed);
  }

  failuresFor(agentId: string): ComplianceCheck[] {
    return this._checks.filter(c => c.agentId === agentId && !c.passed);
  }

  isCompliant(agentId: string): boolean {
    return this.failuresFor(agentId).length === 0;
  }

  byRule(rule: ComplianceCheck['rule']): ComplianceCheck[] {
    return this._checks.filter(c => c.rule === rule);
  }

  passRate(agentId?: string): number {
    const subset = agentId
      ? this._checks.filter(c => c.agentId === agentId)
      : this._checks;
    if (subset.length === 0) return 1;
    return subset.filter(c => c.passed).length / subset.length;
  }

  totalChecks(): number { return this._checks.length; }
}

export class AgentMarketplaceIntegrationIndex {
  static summary(
    registry: AgentRegistry,
    analytics: AgentAnalytics,
    compliance: AgentCompliance,
    abTests: AgentABTest
  ): string {
    return [
      `Agents: ${registry.count()}`,
      `Metrics: ${analytics.totalMetrics()}`,
      `Pass rate: ${(compliance.passRate() * 100).toFixed(0)}%`,
      `A/B tests: ${abTests.totalTests()}`
    ].join(' | ');
  }
}

export class AgentMarketplaceMasterIndex {
  static allModules(): string[] {
    return [
      'AgentRegistry', 'AgentPublisher', 'AgentSearch', 'AgentRating',
      'AgentRanking', 'AgentReview', 'AgentCategory', 'AgentTag',
      'AgentInstallCounter',
      'AgentBilling', 'AgentRevenue', 'AgentSubscription', 'AgentLicense',
      'AgentPayout', 'AgentCoupon', 'AgentRefund', 'AgentFraudDetector',
      'AgentPricingEngine',
      'AgentAnalytics', 'AgentABTest', 'AgentRecommendation',
      'AgentTrendingList', 'AgentFeatured', 'AgentSearchPersonalizer',
      'AgentCompliance'
    ];
  }

  static totalEngines(): number {
    return AgentMarketplaceMasterIndex.allModules().length;
  }
}

export class DBAgentBridge {
  static populateMetrics(
    registry: AgentRegistry,
    installs: AgentInstallCounter,
    ratings: AgentRating,
    analytics: AgentAnalytics,
    billing: AgentBilling
  ): number {
    let count = 0;
    for (const a of registry.all()) {
      analytics.record({
        agentId: a.id,
        installs: installs.count(a.id),
        activeUsers: installs.uniqueInstalls(a.id),
        revenueUsd: billing.totalRevenue(a.id),
        avgRating: ratings.averageStars(a.id)
      });
      count += 1;
    }
    return count;
  }

  static topAgentsByRevenue(
    registry: AgentRegistry,
    billing: AgentBilling,
    limit: number = 5
  ): AgentListing[] {
    return [...registry.all()]
      .sort((a, b) => billing.totalRevenue(b.id) - billing.totalRevenue(a.id))
      .slice(0, limit);
  }
}