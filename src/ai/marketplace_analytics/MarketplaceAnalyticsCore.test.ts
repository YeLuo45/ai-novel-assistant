// V4976-V4985: CN Marketplace Analytics Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  MarketplaceAnalytics,
  DownloadTracker,
  RatingAggregator,
  ReviewSentiment,
  UserActivityTracker,
  EngagementMetrics,
  TrendDetector,
  ABTestEngine,
  CohortAnalyzer,
  MarketplaceAnalyticsCoreIndex,
  CN_BATCH_1_ENGINES
} from './MarketplaceAnalyticsCore';

describe('MarketplaceAnalytics', () => {
  it('trackView + trackInstall + views + installs + conversion + topByInstalls + reset', () => {
    const a = new MarketplaceAnalytics();
    a.trackView('p1'); a.trackView('p1');
    a.trackInstall('p1');
    a.trackView('p2'); a.trackInstall('p2');
    a.trackInstall('p3'); a.trackInstall('p3');
    expect(a.views('p1')).toBe(2);
    expect(a.installs('p1')).toBe(1);
    expect(a.conversionRate('p1')).toBe(0.5);
    expect(a.conversionRate('p4')).toBe(0);
    expect(a.topByInstalls(1)).toEqual(['p3']);
    expect(a.topByInstalls(3)).toContain('p3');
    expect(a.topByInstalls(3).length).toBe(3);
    a.reset();
    expect(a.views('p1')).toBe(0);
  });
});

describe('DownloadTracker', () => {
  it('record + total + totalAll + topPlugins + size', () => {
    const d = new DownloadTracker();
    d.record('p1', 5); d.record('p2', 10); d.record('p1', 3);
    expect(d.total('p1')).toBe(8);
    expect(d.total('p2')).toBe(10);
    expect(d.totalAll()).toBe(18);
    expect(d.topPlugins(1)).toEqual(['p2']);
    expect(d.size()).toBe(2);
  });
});

describe('RatingAggregator', () => {
  it('add + average + count + distribution + topRated', () => {
    const r = new RatingAggregator();
    r.add('p1', 5); r.add('p1', 4); r.add('p1', 3);
    expect(r.average('p1')).toBe(4);
    expect(r.count('p1')).toBe(3);
    expect(r.distribution('p1')).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 });
    r.add('p2', 5); r.add('p2', 5);
    expect(r.topRated(2)[0]).toBe('p2');
    expect(r.count('missing')).toBe(0);
    expect(r.average('missing')).toBe(0);
  });
});

describe('ReviewSentiment', () => {
  it('analyze + score + bulkScore', () => {
    const r = new ReviewSentiment();
    expect(r.analyze('This is great!')).toBe('positive');
    expect(r.analyze('It is horrible')).toBe('negative');
    expect(r.analyze('meh')).toBe('neutral');
    expect(r.score('great')).toBe(1);
    expect(r.score('bad')).toBe(-1);
    expect(r.bulkScore(['great', 'bad', 'meh'])).toEqual({ positive: 1, neutral: 1, negative: 1 });
  });
});

describe('UserActivityTracker', () => {
  it('log + activity + lastAction + count + activeUsers', () => {
    const u = new UserActivityTracker();
    u.log('u1', 'view').log('u1', 'install').log('u2', 'rate');
    expect(u.count('u1')).toBe(2);
    expect(u.lastAction('u1')).toBe('install');
    expect(u.lastAction('u3')).toBeNull();
    expect(u.activeUsers().sort()).toEqual(['u1', 'u2']);
    expect(u.activity('u3')).toEqual([]);
  });
});

describe('EngagementMetrics', () => {
  it('startSession + endSession + averageSessionDuration + counts', () => {
    const e = new EngagementMetrics();
    const s1 = e.startSession('u1');
    e.endSession(s1, 1000);
    expect(e.activeSessionCount()).toBe(0);
    expect(e.totalSessions('u1')).toBe(1);
    expect(e.averageSessionDuration('u1')).toBe(1000);
    expect(e.averageSessionDuration('u2')).toBe(0);
    expect(e.totalSessions('u2')).toBe(0);
    e.startSession('u1');
    expect(e.activeSessionCount()).toBe(1);
  });
});

describe('TrendDetector', () => {
  it('record + detectTrend + history', () => {
    const t = new TrendDetector();
    t.record('m', 10); t.record('m', 20); t.record('m', 30); t.record('m', 40);
    expect(t.detectTrend('m')).toBe('rising');
    t.record('n', 100); t.record('n', 50); t.record('n', 20);
    expect(t.detectTrend('n')).toBe('falling');
    t.record('s', 10); t.record('s', 10);
    expect(t.detectTrend('s')).toBe('stable');
    expect(t.detectTrend('missing')).toBe('stable');
    expect(t.history('missing')).toEqual([]);
    expect(t.history('m')).toEqual([10, 20, 30, 40]);
  });
});

describe('ABTestEngine', () => {
  it('assign + recordResult + conversionRate + isWinner', () => {
    const ab = new ABTestEngine();
    expect(ab.assign('u1', 0)).toBe('A');
    expect(ab.assign('u1', 100)).toBe('A'); // cached
    expect(ab.assign('u2', 1)).toBe('B');
    ab.recordResult('u1', 1);
    ab.recordResult('u2', 0);
    expect(ab.conversionRate('A')).toBe(1);
    expect(ab.conversionRate('B')).toBe(0);
    expect(ab.isWinner()).toBe('A');

    // Empty conversion rate
    const abEmpty = new ABTestEngine();
    expect(abEmpty.conversionRate('A')).toBe(0);

    // B wins
    const ab2 = new ABTestEngine();
    ab2.assign('u1', 0); ab2.assign('u2', 1);
    ab2.recordResult('u1', 0);
    ab2.recordResult('u2', 1);
    expect(ab2.isWinner()).toBe('B');

    // Tie
    const ab3 = new ABTestEngine();
    ab3.assign('u1', 0); ab3.assign('u2', 1);
    ab3.recordResult('u1', 1);
    ab3.recordResult('u2', 1);
    expect(ab3.isWinner()).toBeNull();

    // Record result for unassigned user → defaults to A
    const ab4 = new ABTestEngine();
    ab4.recordResult('stranger', 1);
    expect(ab4.conversionRate('A')).toBe(1);

    ab.reset();
    expect(ab.assign('u1', 0)).toBe('A'); // fresh assignment
  });
});

describe('CohortAnalyzer', () => {
  it('define + add + size + cohorts + members + overlap', () => {
    const c = new CohortAnalyzer();
    c.defineCohort('vip');
    c.addUser('vip', 'u1');
    c.addUser('vip', 'u2');
    c.addUser('free', 'u2');
    c.addUser('free', 'u3');
    expect(c.size('vip')).toBe(2);
    expect(c.cohorts().sort()).toEqual(['free', 'vip']);
    expect(c.members('vip').sort()).toEqual(['u1', 'u2']);
    expect(c.members('missing')).toEqual([]);
    expect(c.overlap('vip', 'free')).toEqual(['u2']);
    expect(c.overlap('vip', 'missing')).toEqual([]);
    expect(c.overlap('missing', 'vip')).toEqual([]);
    expect(c.size('missing')).toBe(0);
  });
});

describe('MarketplaceAnalyticsCoreIndex', () => {
  it('list has 10', () => {
    expect(new MarketplaceAnalyticsCoreIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new MarketplaceAnalyticsCoreIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('MarketplaceAnalytics')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CN_BATCH_1_ENGINES const has 10', () => {
    expect(CN_BATCH_1_ENGINES).toHaveLength(10);
  });
});