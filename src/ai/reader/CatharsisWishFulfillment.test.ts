/**
 * CatharsisWishFulfillment.test.ts — Direction Y, V3086-V3095 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  CatharsisPointLocator,
  WishFulfillmentTracker,
  DropOffRiskPredictor,
  BoredomRiskDetector,
  ConfusionRiskDetector,
  MemoryLoadEstimator,
  POVConfusionAuditor,
  TargetReaderPersona,
  BetaReaderSimulator,
  GenreExpectationChecker,
  type Chapter,
} from './CatharsisWishFulfillment';

describe('CatharsisPointLocator', () => {
  const e = new CatharsisPointLocator();

  it('detects tears catharsis', () => {
    const pts = e.detect('她哭了出来，泪水流下，痛哭。', 1);
    expect(pts.some((p) => p.type === 'tears')).toBe(true);
  });

  it('detects relief catharsis', () => {
    const pts = e.detect('他终于松了口气，终于解脱。', 1);
    expect(pts.some((p) => p.type === 'relief')).toBe(true);
  });

  it('findMajorCatharsis returns highest', () => {
    const chs: Chapter[] = [
      { content: '正常' },
      { content: '她哭了出来，泪水，痛哭。' },
      { content: '正常' },
    ];
    const m = e.findMajorCatharsis(chs);
    expect(m?.type).toBe('tears');
  });
});

describe('WishFulfillmentTracker', () => {
  const e = new WishFulfillmentTracker();

  it('raise creates wish', () => {
    e.raise('protagonist revenge', 1);
    expect(e.getUnfulfilled()).toHaveLength(1);
  });

  it('fulfill closes wish', () => {
    const e2 = new WishFulfillmentTracker();
    const w = e2.raise('love confession', 1);
    e2.fulfill(w.id, 10);
    expect(e2.fulfillmentRate()).toBe(1);
  });

  it('fulfillRate is 0 with no fulfillments', () => {
    const e2 = new WishFulfillmentTracker();
    expect(e2.fulfillmentRate()).toBe(0);
  });
});

describe('DropOffRiskPredictor', () => {
  const e = new DropOffRiskPredictor();

  it('first chapter too short = high risk', () => {
    const c: Chapter = { content: '短' };
    const r = e.evaluate(c, 10, 0);
    expect(r.isHigh).toBe(true);
  });

  it('normal chapter = low risk', () => {
    const c: Chapter = { content: '她走进房间，看着窗外的雨，想着即将发生的事。' + 'x'.repeat(500) };
    const r = e.evaluate(c, 10, 3);
    expect(r.riskScore).toBeLessThan(0.5);
  });

  it('long chapter no dialogue has reasons', () => {
    const c: Chapter = { content: 'x'.repeat(3000) };
    const r = e.evaluate(c, 10, 2);
    expect(r.reasons.length).toBeGreaterThan(0);
  });
});

describe('BoredomRiskDetector', () => {
  const e = new BoredomRiskDetector();

  it('counts boredom keywords', () => {
    expect(e.count('后来过了几天，日子一天天过去。')).toBeGreaterThanOrEqual(2);
  });

  it('isBoring true for keywords', () => {
    expect(e.isBoring('后来，过了一段时间。')).toBe(true);
  });

  it('isBoring false for active text', () => {
    expect(e.isBoring('突然她跳起来！')).toBe(false);
  });
});

describe('ConfusionRiskDetector', () => {
  const e = new ConfusionRiskDetector();

  it('counts confusion indicators', () => {
    expect(e.count('突然，莫名其妙，无征兆，毫无来由。')).toBeGreaterThanOrEqual(3);
  });

  it('isConfusing for high count', () => {
    expect(e.isConfusing('突然，莫名其妙，无征兆。')).toBe(true);
  });
});

describe('MemoryLoadEstimator', () => {
  const e = new MemoryLoadEstimator();

  it('add + reference works', () => {
    e.add({ type: 'character', name: 'Alice', introducedChapter: 1 });
    e.reference('Alice', 5);
    expect(e.activeCount()).toBe(1);
  });

  it('decay marks stale items', () => {
    e.add({ type: 'character', name: 'Bob', introducedChapter: 1 });
    e.decay(50, 20);
    expect(e.activeCount()).toBe(0);
  });

  it('isOverloaded for 30+', () => {
    const e2 = new MemoryLoadEstimator();
    for (let i = 0; i < 35; i++) e2.add({ type: 'character', name: `c${i}`, introducedChapter: 1 });
    expect(e2.isOverloaded(30)).toBe(true);
  });
});

describe('POVConfusionAuditor', () => {
  const e = new POVConfusionAuditor();

  it('confusing for 5+ switches in one chapter', () => {
    const r = e.audit([1, 5, 1, 1, 1]);
    expect(r.isConfusing).toBe(true);
  });

  it('not confusing for low switches', () => {
    const r = e.audit([1, 1, 1, 1, 1]);
    expect(r.isConfusing).toBe(false);
  });
});

describe('TargetReaderPersona', () => {
  const e = new TargetReaderPersona();

  it('getPersonas returns 3', () => {
    expect(e.getPersonas()).toHaveLength(3);
  });

  it('match returns highest scoring', () => {
    const p = e.match('爽点密集，扮猪吃虎，金手指');
    expect(p.name).toBe('web_novel_young_male');
  });
});

describe('BetaReaderSimulator', () => {
  const e = new BetaReaderSimulator();

  it('simulate returns 3 feedbacks', () => {
    const chs: Chapter[] = [
      { content: 'a' },
      { content: 'b' },
      { content: 'c' },
    ];
    expect(e.simulate(chs)).toHaveLength(3);
  });

  it('ratings are 1-5', () => {
    const chs: Chapter[] = Array.from({ length: 5 }, (_, i) => ({ content: 'x'.repeat(500) }));
    const fbs = e.simulate(chs);
    for (const f of fbs) {
      expect(f.rating).toBeGreaterThanOrEqual(1);
      expect(f.rating).toBeLessThanOrEqual(5);
    }
  });
});

describe('GenreExpectationChecker', () => {
  const e = new GenreExpectationChecker();

  it('mystery satisfied with clues', () => {
    expect(e.isGenreSatisfied('mystery', '线索显示嫌疑人留下证据。', 0.3)).toBe(true);
  });

  it('romance satisfied with meet-cute', () => {
    expect(e.isGenreSatisfied('romance', '他们相遇，心动了，告白了。', 0.3)).toBe(true);
  });

  it('check returns ratio', () => {
    const r = e.check('mystery', '线索证据嫌疑人。');
    expect(r.satisfied).toBeGreaterThan(0);
  });
});
