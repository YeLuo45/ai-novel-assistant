/**
 * MomentsForeshadow.test.ts — Direction AB, V3026-V3035 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ClimaxMapper,
  AllIsLostMoment,
  DarkNightOfSoul,
  MirrorMoment,
  BStoryDetector,
  FinaleConvergence,
  ForeshadowPlanter,
  ForeshadowPayoffTracker,
  PlantPayoffLedger,
  ChekhovGunAuditor,
  type Chapter,
} from './MomentsForeshadow';

describe('ClimaxMapper', () => {
  const cm = new ClimaxMapper();

  it('scores high for climax keywords', () => {
    expect(cm.scoreIntensity('最终决战开始')).toBeGreaterThan(0);
  });

  it('chapter at 0.9 with climax keyword is climax', () => {
    const chs: Chapter[] = [
      { content: '开始' },
      { content: '高潮对决' },
    ];
    const found = cm.findClimax(chs);
    expect(found?.chapter).toBe(1);
  });

  it('returns all chapters with progress', () => {
    const chs: Chapter[] = [{ content: 'a' }, { content: 'b' }, { content: 'c' }];
    const all = cm.map(chs);
    expect(all).toHaveLength(3);
    expect(all[2].progress).toBeCloseTo(1.0, 5);
  });
});

describe('AllIsLostMoment', () => {
  const a = new AllIsLostMoment();

  it('scores despair', () => {
    expect(a.score('他失去了所有希望，绝望中死亡')).toBeGreaterThan(0);
  });

  it('detects at chapter 7 of 10 with despair', () => {
    const chs: Chapter[] = Array.from({ length: 10 }, (_, i) => ({
      content: i === 7 ? '他彻底失败，失去了家人' : '其他',
    }));
    const found = a.detect(chs);
    expect(found?.chapter).toBe(7);
  });

  it('returns null when no despair in range', () => {
    const chs: Chapter[] = Array.from({ length: 5 }, () => ({ content: 'happy' }));
    expect(a.detect(chs)).toBeNull();
  });
});

describe('DarkNightOfSoul', () => {
  const d = new DarkNightOfSoul();

  it('detects at chapter 8 of 11 with introspection', () => {
    const r = d.detect(8, 11, '他在夜晚独自反思过去');
    expect(r.isDarkNight).toBe(true);
  });

  it('not detected at chapter 1', () => {
    const r = d.detect(1, 10, '他在夜晚反思');
    expect(r.isDarkNight).toBe(false);
  });
});

describe('MirrorMoment', () => {
  const m = new MirrorMoment();

  it('detects with 2+ mirror keywords', () => {
    expect(m.detect('他反观过去，曾经的他是如此').isMirror).toBe(true);
  });

  it('not detected with single keyword', () => {
    expect(m.detect('他反观自己').isMirror).toBe(false);
  });
});

describe('BStoryDetector', () => {
  const b = new BStoryDetector();

  it('detects love theme at chapter 3 of 10', () => {
    const r = b.detect('他遇到了爱情', 3, 10);
    expect(r.isBStory).toBe(true);
  });

  it('not BStory if no love keywords', () => {
    const r = b.detect('他遇到敌人', 3, 10);
    expect(r.isBStory).toBe(false);
  });
});

describe('FinaleConvergence', () => {
  const f = new FinaleConvergence();

  it('7 of 10 = 0.7 converged', () => {
    const r = f.compute(7, 10);
    expect(r.isConverged).toBe(true);
  });

  it('5 of 10 = 0.5 not converged', () => {
    const r = f.compute(5, 10);
    expect(r.isConverged).toBe(false);
  });
});

describe('ForeshadowPlanter', () => {
  const p = new ForeshadowPlanter();

  it('plants with unique id', () => {
    const a = p.plant('mysterious letter', 1);
    const b = p.plant('red herring', 2);
    expect(a.id).not.toBe(b.id);
  });

  it('clamps strength to 0-1', () => {
    const f = p.plant('x', 1, 1.5);
    expect(f.strength).toBe(1);
  });

  it('plant strength 0 is allowed', () => {
    const f = p.plant('x', 1, 0);
    expect(f.strength).toBe(0);
  });

  it('getCount tracks plants', () => {
    const pp = new ForeshadowPlanter();
    pp.plant('a', 1);
    pp.plant('b', 2);
    expect(pp.getCount()).toBe(2);
  });
});

describe('ForeshadowPayoffTracker', () => {
  const t = new ForeshadowPayoffTracker();

  it('tracks payoff with distance', () => {
    const p = t.track('fs_1', 10, 'letter opens', 1, 0.7);
    expect(p.distanceChapters).toBe(9);
  });

  it('findByForeshadowId', () => {
    t.track('fs_2', 5, 'reveal', 1);
    expect(t.findByForeshadowId('fs_2')).toHaveLength(1);
  });

  it('getAll returns tracked', () => {
    const tt = new ForeshadowPayoffTracker();
    tt.track('a', 1, 'x', 0);
    expect(tt.getAll().length).toBe(1);
  });
});

describe('PlantPayoffLedger', () => {
  const l = new PlantPayoffLedger();

  it('markPlanted → planted', () => {
    l.markPlanted('key1', 1);
    expect(l.getStatus('key1')).toBe('planted');
  });

  it('markPlanted then markPaidOff → resolved', () => {
    l.markPlanted('key2', 1);
    l.markPaidOff('key2', 5);
    expect(l.getStatus('key2')).toBe('resolved');
  });

  it('orphans are planted but not paid', () => {
    l.markPlanted('orphan', 1);
    const o = l.getOrphans();
    expect(o.some((e) => e.id === 'orphan')).toBe(true);
  });

  it('getResolved returns resolved entries', () => {
    const ll = new PlantPayoffLedger();
    ll.markPlanted('k1', 1);
    ll.markPaidOff('k1', 5);
    expect(ll.getResolved().length).toBe(1);
  });
});

describe('ChekhovGunAuditor', () => {
  const c = new ChekhovGunAuditor();

  it('introduce then use → used', () => {
    c.introduce('gun', 1);
    c.use('gun', 10);
    expect(c.getUsed()).toHaveLength(1);
  });

  it('unused guns are returned', () => {
    c.introduce('vase', 1);
    expect(c.getUnused().length).toBeGreaterThanOrEqual(1);
  });
});
