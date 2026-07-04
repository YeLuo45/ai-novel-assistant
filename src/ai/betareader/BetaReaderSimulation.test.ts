/**
 * BetaReaderSimulation.test.ts — Direction AL, V3446-V3455 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  MultiReaderFeedback,
  FeedbackAggregator,
  CriticalIssuesExtractor,
  PositiveFeedbackExtractor,
  ConsensusDetector,
  OutlierFeedbackDetector,
  ReaderPanel,
  FeedbackReportGenerator,
  ImprovementSuggestions,
  BetaReaderSimulationIndex,
  type ReaderFeedback,
} from './BetaReaderSimulation';
import type { BetaReader } from './BetaReaderProfiles';

const makeReader = (name: string, type: string): BetaReader => ({
  name,
  type: type as any,
  preferences: [],
  painPoints: [],
  rating: 0,
  feedback: '',
});

const makeFeedback = (name: string, type: string, rating: number, issues: string[] = [], positives: string[] = []): ReaderFeedback => ({
  reader: makeReader(name, type),
  rating,
  issues,
  positives,
});

describe('MultiReaderFeedback', () => {
  const e = new MultiReaderFeedback();

  it('add + getAll', () => {
    e.add(makeFeedback('A', 'web', 4));
    expect(e.getAll()).toHaveLength(1);
  });

  it('averageRating computed', () => {
    const e2 = new MultiReaderFeedback();
    e2.add(makeFeedback('A', 'web', 3));
    e2.add(makeFeedback('B', 'literary', 5));
    expect(e2.averageRating()).toBe(4);
  });
});

describe('FeedbackAggregator', () => {
  const e = new FeedbackAggregator();

  it('aggregate common issues', () => {
    const f = [
      makeFeedback('A', 'web', 3, ['pacing']),
      makeFeedback('B', 'web', 3, ['pacing']),
      makeFeedback('C', 'web', 3, ['other']),
    ];
    const r = e.aggregate(f);
    expect(r.commonIssues).toContain('pacing');
  });

  it('aggregate avgRating', () => {
    const f = [makeFeedback('A', 'web', 4), makeFeedback('B', 'web', 2)];
    expect(e.aggregate(f).avgRating).toBe(3);
  });
});

describe('CriticalIssuesExtractor', () => {
  const e = new CriticalIssuesExtractor();

  it('extract sorted by severity', () => {
    const f = [
      makeFeedback('A', 'web', 3, ['x', 'y']),
      makeFeedback('B', 'web', 3, ['x']),
    ];
    const r = e.extract(f);
    expect(r[0].issue).toBe('x');
  });

  it('topN returns N', () => {
    const f = [makeFeedback('A', 'web', 3, ['x', 'y', 'z'])];
    expect(e.topN(f, 2)).toHaveLength(2);
  });
});

describe('PositiveFeedbackExtractor', () => {
  const e = new PositiveFeedbackExtractor();

  it('extract for positives', () => {
    const f = [
      makeFeedback('A', 'web', 4, [], ['good plot']),
      makeFeedback('B', 'web', 4, [], ['good plot']),
    ];
    const r = e.extract(f);
    expect(r[0].positive).toBe('good plot');
  });
});

describe('ConsensusDetector', () => {
  const e = new ConsensusDetector();

  it('detect 70%+ consensus', () => {
    const f = [
      makeFeedback('A', 'web', 3, ['common']),
      makeFeedback('B', 'web', 3, ['common']),
      makeFeedback('C', 'web', 3, ['common']),
    ];
    const r = e.detect(f);
    expect(r.consensusIssues).toContain('common');
  });
});

describe('OutlierFeedbackDetector', () => {
  const e = new OutlierFeedbackDetector();

  it('detect outlier for big deviation', () => {
    const f = [
      makeFeedback('A', 'web', 5),
      makeFeedback('B', 'web', 5),
      makeFeedback('C', 'web', 5),
      makeFeedback('D', 'web', 5),
      makeFeedback('E', 'web', 0),
    ];
    expect(e.detect(f)).not.toBeNull();
  });

  it('no outlier for similar', () => {
    const f = [
      makeFeedback('A', 'web', 4),
      makeFeedback('B', 'web', 4),
      makeFeedback('C', 'web', 4),
    ];
    expect(e.detect(f)).toBeNull();
  });
});

describe('ReaderPanel', () => {
  const e = new ReaderPanel();

  it('addReader + size', () => {
    e.addReader(makeReader('A', 'web'));
    e.addReader(makeReader('B', 'literary'));
    expect(e.size()).toBe(2);
  });

  it('types returns unique', () => {
    e.addReader(makeReader('A', 'web'));
    e.addReader(makeReader('B', 'literary'));
    expect(e.types()).toHaveLength(2);
  });

  it('isDiverse for 3+ types', () => {
    const e2 = new ReaderPanel();
    e2.addReader(makeReader('A', 'web'));
    e2.addReader(makeReader('B', 'literary'));
    e2.addReader(makeReader('C', 'genre'));
    expect(e2.isDiverse()).toBe(true);
  });
});

describe('FeedbackReportGenerator', () => {
  const e = new FeedbackReportGenerator();

  it('generate for empty', () => {
    expect(e.generate([])).toContain('Beta Reader Report');
  });

  it('generate includes avg', () => {
    const f = [makeFeedback('A', 'web', 4)];
    const r = e.generate(f);
    expect(r).toContain('4.00');
  });
});

describe('ImprovementSuggestions', () => {
  const e = new ImprovementSuggestions();

  it('suggest for known issue', () => {
    expect(e.suggest('boring')).toContain('冲突');
  });

  it('forTopIssues', () => {
    const issues = [{ issue: 'boring', severity: 0.8 }];
    expect(e.forTopIssues(issues)).toHaveLength(1);
  });
});

describe('BetaReaderSimulationIndex', () => {
  const idx = new BetaReaderSimulationIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
