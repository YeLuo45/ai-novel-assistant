// V4976-V4985: CN Marketplace Analytics Core Batch 1/3
// Analytics + downloads + ratings + sentiment + activity + engagement + trends + A/B + cohort

export class MarketplaceAnalytics {
  private _views: Map<string, number> = new Map();
  private _installs: Map<string, number> = new Map();

  trackView(pluginId: string): void {
    this._views.set(pluginId, (this._views.get(pluginId) ?? 0) + 1);
  }

  trackInstall(pluginId: string): void {
    this._installs.set(pluginId, (this._installs.get(pluginId) ?? 0) + 1);
  }

  views(pluginId: string): number {
    return this._views.get(pluginId) ?? 0;
  }

  installs(pluginId: string): number {
    return this._installs.get(pluginId) ?? 0;
  }

  conversionRate(pluginId: string): number {
    const v = this.views(pluginId);
    return v === 0 ? 0 : this.installs(pluginId) / v;
  }

  topByInstalls(n: number): string[] {
    return [...this._installs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([id]) => id);
  }

  reset(): void {
    this._views.clear();
    this._installs.clear();
  }
}

export class DownloadTracker {
  private _downloads: Map<string, number> = new Map();

  record(pluginId: string, count = 1): void {
    this._downloads.set(pluginId, (this._downloads.get(pluginId) ?? 0) + count);
  }

  total(pluginId: string): number {
    return this._downloads.get(pluginId) ?? 0;
  }

  totalAll(): number {
    let s = 0;
    for (const v of this._downloads.values()) s += v;
    return s;
  }

  topPlugins(n: number): string[] {
    return [...this._downloads.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([id]) => id);
  }

  size(): number {
    return this._downloads.size;
  }
}

export class RatingAggregator {
  private _ratings: Map<string, number[]> = new Map();

  add(pluginId: string, stars: number): void {
    const list = this._ratings.get(pluginId) ?? [];
    list.push(stars);
    this._ratings.set(pluginId, list);
  }

  average(pluginId: string): number {
    const list = this._ratings.get(pluginId);
    if (!list || list.length === 0) return 0;
    return list.reduce((a, b) => a + b, 0) / list.length;
  }

  count(pluginId: string): number {
    return this._ratings.get(pluginId)?.length ?? 0;
  }

  distribution(pluginId: string): Record<1 | 2 | 3 | 4 | 5, number> {
    const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const list = this._ratings.get(pluginId) ?? [];
    for (const s of list) {
      if (s >= 1 && s <= 5) dist[s as 1 | 2 | 3 | 4 | 5] += 1;
    }
    return dist;
  }

  topRated(n: number): string[] {
    return [...this._ratings.entries()]
      .filter(([_, list]) => list.length > 0)
      .sort((a, b) => this.average(b[0]) - this.average(a[0]))
      .slice(0, n)
      .map(([id]) => id);
  }
}

export class ReviewSentiment {
  // Naive keyword-based sentiment
  analyze(text: string): 'positive' | 'neutral' | 'negative' {
    const lower = text.toLowerCase();
    const positive = ['good', 'great', 'excellent', 'love', 'amazing', 'best', 'awesome', 'perfect'];
    const negative = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'broken', 'useless'];
    let pos = 0, neg = 0;
    for (const p of positive) if (lower.includes(p)) pos += 1;
    for (const n of negative) if (lower.includes(n)) neg += 1;
    if (pos > neg) return 'positive';
    if (neg > pos) return 'negative';
    return 'neutral';
  }

  score(text: string): number {
    const s = this.analyze(text);
    return s === 'positive' ? 1 : s === 'negative' ? -1 : 0;
  }

  bulkScore(reviews: string[]): { positive: number; neutral: number; negative: number } {
    let p = 0, n = 0, ne = 0;
    for (const r of reviews) {
      const s = this.analyze(r);
      if (s === 'positive') p += 1;
      else if (s === 'negative') n += 1;
      else ne += 1;
    }
    return { positive: p, neutral: ne, negative: n };
  }
}

export class UserActivityTracker {
  private _activity: Map<string, Array<{ ts: number; action: string }>> = new Map();

  log(userId: string, action: string): this {
    const list = this._activity.get(userId) ?? [];
    list.push({ ts: Date.now(), action });
    this._activity.set(userId, list);
    return this;
  }

  activity(userId: string): Array<{ ts: number; action: string }> {
    return [...(this._activity.get(userId) ?? [])];
  }

  lastAction(userId: string): string | null {
    const list = this._activity.get(userId);
    return list && list.length > 0 ? list[list.length - 1].action : null;
  }

  count(userId: string): number {
    return this._activity.get(userId)?.length ?? 0;
  }

  activeUsers(): string[] {
    return [...this._activity.keys()];
  }
}

export class EngagementMetrics {
  private _sessions: Map<string, number> = new Map();
  private _durations: Map<string, number[]> = new Map();

  startSession(userId: string): string {
    const id = `${userId}-${Date.now()}-${Math.random()}`;
    this._sessions.set(id, Date.now());
    return id;
  }

  endSession(sessionId: string, durationMs: number): void {
    this._sessions.delete(sessionId);
    const userId = sessionId.split('-')[0];
    const list = this._durations.get(userId) ?? [];
    list.push(durationMs);
    this._durations.set(userId, list);
  }

  averageSessionDuration(userId: string): number {
    const list = this._durations.get(userId);
    return list && list.length > 0 ? list.reduce((a, b) => a + b, 0) / list.length : 0;
  }

  activeSessionCount(): number {
    return this._sessions.size;
  }

  totalSessions(userId: string): number {
    return this._durations.get(userId)?.length ?? 0;
  }
}

export class TrendDetector {
  private _history: Map<string, number[]> = new Map();

  record(metric: string, value: number): void {
    const list = this._history.get(metric) ?? [];
    list.push(value);
    this._history.set(metric, list);
  }

  detectTrend(metric: string): 'rising' | 'falling' | 'stable' {
    const list = this._history.get(metric);
    if (!list || list.length < 2) return 'stable';
    const recent = list.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const first = list[0];
    if (avg > first * 1.2) return 'rising';
    if (avg < first * 0.8) return 'falling';
    return 'stable';
  }

  history(metric: string): number[] {
    return [...(this._history.get(metric) ?? [])];
  }
}

export class ABTestEngine {
  private _assignments: Map<string, 'A' | 'B'> = new Map();
  private _results: Map<string, { A: number[]; B: number[] }> = new Map();

  assign(userId: string, seed: number): 'A' | 'B' {
    const a = this._assignments.get(userId);
    if (a) return a;
    const group = seed % 2 === 0 ? 'A' : 'B';
    this._assignments.set(userId, group);
    return group;
  }

  recordResult(userId: string, value: number): void {
    const group = this._assignments.get(userId) ?? 'A';
    const result = this._results.get(userId) ?? { A: [], B: [] };
    result[group].push(value);
    this._results.set(userId, result);
  }

  conversionRate(group: 'A' | 'B'): number {
    let total = 0, positive = 0;
    for (const r of this._results.values()) {
      const list = r[group];
      total += list.length;
      for (const v of list) if (v > 0) positive += 1;
    }
    return total === 0 ? 0 : positive / total;
  }

  isWinner(): 'A' | 'B' | null {
    const a = this.conversionRate('A');
    const b = this.conversionRate('B');
    if (a === b) return null;
    return a > b ? 'A' : 'B';
  }

  reset(): void {
    this._assignments.clear();
    this._results.clear();
  }
}

export class CohortAnalyzer {
  private _cohorts: Map<string, Set<string>> = new Map();

  defineCohort(name: string): void {
    if (!this._cohorts.has(name)) this._cohorts.set(name, new Set());
  }

  addUser(cohort: string, userId: string): void {
    this.defineCohort(cohort);
    this._cohorts.get(cohort)!.add(userId);
  }

  size(cohort: string): number {
    return this._cohorts.get(cohort)?.size ?? 0;
  }

  cohorts(): string[] {
    return [...this._cohorts.keys()];
  }

  members(cohort: string): string[] {
    return [...(this._cohorts.get(cohort) ?? [])];
  }

  overlap(c1: string, c2: string): string[] {
    const a = this._cohorts.get(c1) ?? new Set();
    const b = this._cohorts.get(c2) ?? new Set();
    return [...a].filter(x => b.has(x));
  }
}

// V4985: MarketplaceAnalyticsCoreIndex
export const CN_BATCH_1_ENGINES = [
  'MarketplaceAnalytics', 'DownloadTracker', 'RatingAggregator', 'ReviewSentiment', 'UserActivityTracker',
  'EngagementMetrics', 'TrendDetector', 'ABTestEngine', 'CohortAnalyzer', 'MarketplaceAnalyticsCoreIndex'
] as const;

export class MarketplaceAnalyticsCoreIndex {
  list(): string[] {
    return [...CN_BATCH_1_ENGINES];
  }

  count(): number {
    return CN_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CN_BATCH_1_ENGINES.includes(name as typeof CN_BATCH_1_ENGINES[number]);
  }
}