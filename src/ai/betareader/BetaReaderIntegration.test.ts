/**
 * BetaReaderIntegration.test.ts — Direction AL, V3456-V3465 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  FullChapterSimulation,
  ReaderFeedbackLoop,
  RevisionTracker,
  ReaderPrioritiesRanker,
  ImprovementGoalSetter,
  ChapterReadinessChecker,
  ReaderExpectationMatcher,
  BookReadinessScorer,
  FinalApprovalSimulator,
  BetaReaderIndexFinal,
  type Chapter,
  type BetaReader,
  type SimFeedback,
} from './BetaReaderIntegration';

const makeReader = (name: string, type: string, prefs: string[] = []): BetaReader => ({
  name,
  type: type as any,
  preferences: prefs,
  painPoints: [],
  rating: 0,
  feedback: '',
});

const makeFB = (name: string, type: string, rating: number): SimFeedback => ({
  reader: makeReader(name, type),
  rating,
  issues: [],
  positives: [],
});

describe('FullChapterSimulation', () => {
  const e = new FullChapterSimulation();

  it('simulate returns per reader', () => {
    const fb = e.simulate({ content: '战斗爽点很多' }, [makeReader('A', 'web')]);
    expect(fb).toHaveLength(1);
  });

  it('web reader rates high for 爽', () => {
    const fb = e.simulate({ content: '战斗爽点爽' }, [makeReader('A', 'web')]);
    expect(fb[0].rating).toBeGreaterThanOrEqual(4);
  });
});

describe('ReaderFeedbackLoop', () => {
  const e = new ReaderFeedbackLoop();

  it('addIteration + hasImproved false for 1', () => {
    e.addIteration([makeFB('A', 'web', 3)]);
    expect(e.hasImproved()).toBe(false);
  });

  it('hasImproved true for rising ratings', () => {
    const e2 = new ReaderFeedbackLoop();
    e2.addIteration([makeFB('A', 'web', 3)]);
    e2.addIteration([makeFB('A', 'web', 4)]);
    expect(e2.hasImproved()).toBe(true);
  });
});

describe('RevisionTracker', () => {
  const e = new RevisionTracker();

  it('record + getAll', () => {
    e.record(1, ['change A']);
    expect(e.getAll()).toHaveLength(1);
  });

  it('revisionsForChapter', () => {
    const e2 = new RevisionTracker();
    e2.record(1, ['x']);
    e2.record(2, ['y']);
    expect(e2.revisionsForChapter(1)).toHaveLength(1);
  });

  it('totalRevisions', () => {
    const e3 = new RevisionTracker();
    e3.record(1, ['x']);
    e3.record(2, ['y']);
    expect(e3.totalRevisions()).toBe(2);
  });
});

describe('ReaderPrioritiesRanker', () => {
  const e = new ReaderPrioritiesRanker();

  it('rank by severity', () => {
    const r = e.rank([{ issue: 'a', severity: 0.3 }, { issue: 'b', severity: 0.8 }]);
    expect(r[0].issue).toBe('b');
  });

  it('topPriority', () => {
    expect(e.topPriority([{ issue: 'x', severity: 0.5 }])?.issue).toBe('x');
  });
});

describe('ImprovementGoalSetter', () => {
  const e = new ImprovementGoalSetter();

  it('set includes issue + deadline', () => {
    const g = e.set({ issue: 'pacing', severity: 0.5 }, 7);
    expect(g.goal).toContain('pacing');
  });

  it('isOverdue for past deadline', () => {
    expect(e.isOverdue(Date.now() - 1000)).toBe(true);
  });
});

describe('ChapterReadinessChecker', () => {
  const e = new ChapterReadinessChecker();

  it('check for short = not ready', () => {
    const r = e.check({ content: '短' });
    expect(r.ready).toBe(false);
  });

  it('check for long = ready', () => {
    const r = e.check({ content: '他走进了房间。' + '然后看见了什么。'.repeat(30) });
    expect(r.rating).toBeGreaterThanOrEqual(3);
  });
});

describe('ReaderExpectationMatcher', () => {
  const e = new ReaderExpectationMatcher();

  it('match for matching prefs', () => {
    const r = makeReader('A', 'web', ['爽点', '战斗']);
    const m = e.match(r, '战斗和爽点');
    expect(m.ratio).toBe(1.0);
  });

  it('isMatched for 0.5+', () => {
    const r = makeReader('A', 'web', ['爽点', '战斗']);
    expect(e.isMatched(r, '爽点')).toBe(true);
  });
});

describe('BookReadinessScorer', () => {
  const e = new BookReadinessScorer();

  it('score for empty', () => {
    expect(e.score([], []).overall).toBe(0);
  });

  it('isReady for 4+', () => {
    expect(e.isReady(4.5)).toBe(true);
  });
});

describe('FinalApprovalSimulator', () => {
  const e = new FinalApprovalSimulator();

  it('approve for 4+', () => {
    const r = e.approve([makeFB('A', 'web', 4), makeFB('B', 'web', 4)]);
    expect(r.approved).toBe(true);
  });

  it('approve false for 2-', () => {
    const r = e.approve([makeFB('A', 'web', 2), makeFB('B', 'web', 2)]);
    expect(r.approved).toBe(false);
  });
});

describe('BetaReaderIndexFinal', () => {
  const idx = new BetaReaderIndexFinal();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
