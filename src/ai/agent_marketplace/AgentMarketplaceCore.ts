// V5366-V5375: DB AI Agent Marketplace 2.0 Core Batch 1/3
// AgentRegistry + AgentPublisher + AgentSearch + AgentRating + AgentRanking + AgentReview + AgentCategory + AgentTag + AgentInstallCounter + AgentMarketplaceCoreIndex

export interface AgentListing {
  id: string;
  name: string;
  author: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  publishedAt: number;
  priceUsd: number;
  downloads: number;
}

export class AgentRegistry {
  private _agents = new Map<string, AgentListing>();

  register(listing: AgentListing): void {
    this._agents.set(listing.id, listing);
  }

  get(id: string): AgentListing | null {
    return this._agents.get(id) ?? null;
  }

  unregister(id: string): boolean {
    return this._agents.delete(id);
  }

  byAuthor(author: string): AgentListing[] {
    return [...this._agents.values()].filter(a => a.author === author);
  }

  byCategory(category: string): AgentListing[] {
    return [...this._agents.values()].filter(a => a.category === category);
  }

  searchByTag(tag: string): AgentListing[] {
    return [...this._agents.values()].filter(a => a.tags.includes(tag));
  }

  count(): number { return this._agents.size; }

  all(): AgentListing[] {
    return [...this._agents.values()];
  }
}

export class AgentPublisher {
  private _registry: AgentRegistry;
  private _publishLog: Array<{ id: string; ts: number; action: 'create' | 'update' | 'deprecate' }> = [];

  constructor(registry: AgentRegistry) {
    this._registry = registry;
  }

  publish(listing: AgentListing): void {
    const existing = this._registry.get(listing.id);
    if (existing) {
      listing.publishedAt = existing.publishedAt;
    }
    this._registry.register(listing);
    this._publishLog.push({ id: listing.id, ts: Date.now(), action: existing ? 'update' : 'create' });
  }

  deprecate(id: string): boolean {
    const existing = this._registry.get(id);
    if (!existing) return false;
    this._registry.unregister(id);
    this._publishLog.push({ id, ts: Date.now(), action: 'deprecate' });
    return true;
  }

  publishLog(id?: string): Array<{ id: string; ts: number; action: 'create' | 'update' | 'deprecate' }> {
    return id ? this._publishLog.filter(l => l.id === id) : [...this._publishLog];
  }

  versionBump(id: string, newVersion: string): boolean {
    const existing = this._registry.get(id);
    if (!existing) return false;
    existing.version = newVersion;
    this._registry.register(existing);
    this._publishLog.push({ id, ts: Date.now(), action: 'update' });
    return true;
  }
}

export interface SearchQuery {
  query: string;
  category?: string;
  tags?: string[];
  maxPriceUsd?: number;
}

export class AgentSearch {
  private _registry: AgentRegistry;

  constructor(registry: AgentRegistry) {
    this._registry = registry;
  }

  search(q: SearchQuery): AgentListing[] {
    const lowerQuery = q.query.toLowerCase();
    return this._registry.all().filter(a => {
      if (q.query && !`${a.name} ${a.description}`.toLowerCase().includes(lowerQuery)) return false;
      if (q.category && a.category !== q.category) return false;
      if (q.tags && q.tags.length > 0 && !q.tags.some(t => a.tags.includes(t))) return false;
      if (q.maxPriceUsd !== undefined && a.priceUsd > q.maxPriceUsd) return false;
      return true;
    });
  }

  suggestions(prefix: string, limit: number = 5): string[] {
    const lower = prefix.toLowerCase();
    const seen = new Set<string>();
    for (const a of this._registry.all()) {
      if (a.name.toLowerCase().startsWith(lower)) seen.add(a.name);
    }
    return [...seen].slice(0, limit);
  }

  indexSize(): number { return this._registry.count(); }
}

export interface RatingEntry {
  agentId: string;
  userId: string;
  stars: number;
  review: string;
  ts: number;
}

export class AgentRating {
  private _ratings: RatingEntry[] = [];

  submit(entry: Omit<RatingEntry, 'ts'>): void {
    const full: RatingEntry = { ...entry, ts: Date.now() };
    this._ratings.push(full);
  }

  averageStars(agentId: string): number {
    const subset = this._ratings.filter(r => r.agentId === agentId);
    if (subset.length === 0) return 0;
    const sum = subset.reduce((acc, r) => acc + r.stars, 0);
    return sum / subset.length;
  }

  ratingsFor(agentId: string): RatingEntry[] {
    return this._ratings.filter(r => r.agentId === agentId);
  }

  ratingsByUser(userId: string): RatingEntry[] {
    return this._ratings.filter(r => r.userId === userId);
  }

  starDistribution(agentId: string): Record<number, number> {
    const subset = this._ratings.filter(r => r.agentId === agentId);
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of subset) dist[r.stars] = (dist[r.stars] ?? 0) + 1;
    return dist;
  }

  totalRatings(): number { return this._ratings.length; }
}

export interface RankedAgent {
  agent: AgentListing;
  score: number;
  rank: number;
}

export class AgentRanking {
  private _registry: AgentRegistry;
  private _rating: AgentRating;

  constructor(registry: AgentRegistry, rating: AgentRating) {
    this._registry = registry;
    this._rating = rating;
  }

  rank(limit: number = 10): RankedAgent[] {
    const all = this._registry.all();
    const scored = all.map(a => ({
      agent: a,
      score: this.scoreAgent(a)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s, i) => ({ agent: s.agent, score: s.score, rank: i + 1 }));
  }

  private scoreAgent(a: AgentListing): number {
    const rating = this._rating.averageStars(a.id);
    return a.downloads * 0.6 + rating * 100 + (a.priceUsd === 0 ? 50 : 0);
  }

  topByCategory(category: string, limit: number = 5): RankedAgent[] {
    return this.rank(100).filter(r => r.agent.category === category).slice(0, limit);
  }
}

export interface Review {
  id: string;
  agentId: string;
  userId: string;
  title: string;
  body: string;
  helpful: number;
  ts: number;
}

export class AgentReview {
  private _reviews: Review[] = [];
  private _nextId = 1;

  add(review: Omit<Review, 'id' | 'ts' | 'helpful'>): Review {
    const r: Review = {
      id: `rev-${this._nextId++}`,
      ts: Date.now(),
      helpful: 0,
      ...review
    };
    this._reviews.push(r);
    return r;
  }

  markHelpful(reviewId: string): boolean {
    const r = this._reviews.find(rv => rv.id === reviewId);
    if (!r) return false;
    r.helpful += 1;
    return true;
  }

  reviewsFor(agentId: string): Review[] {
    return this._reviews.filter(r => r.agentId === agentId);
  }

  mostHelpful(agentId: string, limit: number = 5): Review[] {
    return this.reviewsFor(agentId)
      .sort((a, b) => b.helpful - a.helpful)
      .slice(0, limit);
  }

  reviewsByUser(userId: string): Review[] {
    return this._reviews.filter(r => r.userId === userId);
  }

  totalReviews(): number { return this._reviews.length; }
}

export class AgentCategory {
  private _categories = new Map<string, { name: string; description: string; count: number }>();

  add(id: string, name: string, description: string): void {
    this._categories.set(id, { name, description, count: 0 });
  }

  increment(agentCategory: string): void {
    const c = this._categories.get(agentCategory);
    if (c) c.count += 1;
  }

  list(): string[] { return [...this._categories.keys()]; }

  byId(id: string): { name: string; description: string; count: number } | null {
    return this._categories.get(id) ?? null;
  }

  popular(n: number = 5): string[] {
    return [...this._categories.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, n)
      .map(([id]) => id);
  }

  totalCategories(): number { return this._categories.size; }
}

export class AgentTag {
  private _tagCounts = new Map<string, number>();

  tag(agentId: string, tag: string): void {
    const key = `${agentId}:${tag}`;
    this._tagCounts.set(key, (this._tagCounts.get(key) ?? 0) + 1);
  }

  tagsFor(agentId: string): string[] {
    const out: string[] = [];
    for (const key of this._tagCounts.keys()) {
      const [id, tag] = key.split(':');
      if (id === agentId) out.push(tag);
    }
    return out;
  }

  globalTagCloud(limit: number = 10): Array<{ tag: string; count: number }> {
    const totals = new Map<string, number>();
    for (const [key, count] of this._tagCounts) {
      const [, tag] = key.split(':');
      totals.set(tag, (totals.get(tag) ?? 0) + count);
    }
    return [...totals.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  totalTags(): number {
    const tags = new Set<string>();
    for (const key of this._tagCounts.keys()) {
      const [, tag] = key.split(':');
      tags.add(tag);
    }
    return tags.size;
  }
}

export class AgentInstallCounter {
  private _counts = new Map<string, number>();
  private _installs: Array<{ agentId: string; userId: string; ts: number }> = [];

  install(agentId: string, userId: string): void {
    this._counts.set(agentId, (this._counts.get(agentId) ?? 0) + 1);
    this._installs.push({ agentId, userId, ts: Date.now() });
  }

  uninstall(agentId: string, userId: string): void {
    const c = this._counts.get(agentId);
    if (c && c > 0) this._counts.set(agentId, c - 1);
    this._installs = this._installs.filter(i => !(i.agentId === agentId && i.userId === userId));
  }

  count(agentId: string): number {
    return this._counts.get(agentId) ?? 0;
  }

  uniqueInstalls(agentId: string): number {
    const users = new Set<string>();
    for (const i of this._installs) {
      if (i.agentId === agentId) users.add(i.userId);
    }
    return users.size;
  }

  topInstalled(n: number = 5): Array<{ agentId: string; count: number }> {
    return [...this._counts.entries()]
      .map(([agentId, count]) => ({ agentId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  totalInstalls(): number {
    let sum = 0;
    for (const v of this._counts.values()) sum += v;
    return sum;
  }
}

export class AgentMarketplaceCoreIndex {
  static summary(registry: AgentRegistry, rating: AgentRating, installs: AgentInstallCounter): string {
    return [
      `Agents: ${registry.count()}`,
      `Ratings: ${rating.totalRatings()}`,
      `Installs: ${installs.totalInstalls()}`
    ].join(' | ');
  }
}