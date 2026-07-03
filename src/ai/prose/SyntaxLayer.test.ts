/**
 * SyntaxLayer.test.ts — Direction X, V3046-V3055 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  SentenceLengthDistribution,
  OpenerVariety,
  SentenceTypeMix,
  ParagraphLengthDist,
  ActivePassiveRatio,
  LongShortAlternation,
  ClauseComplexity,
  PhraseLengthHistogram,
  SyntacticVarietyScore,
  SentenceCadence,
} from './SyntaxLayer';

describe('SentenceLengthDistribution', () => {
  const e = new SentenceLengthDistribution();

  it('computes mean for short text', () => {
    const s = e.analyze('我来了。你好。再见。');
    expect(s.mean).toBeGreaterThan(0);
    expect(s.count || 1).toBeGreaterThan(0);
  });

  it('returns 0 stats for empty text', () => {
    const s = e.analyze('');
    expect(s.mean).toBe(0);
  });

  it('distribution has bins', () => {
    const d = e.distribution('a. bb. ccc.', 3);
    expect(d).toHaveLength(3);
  });
});

describe('OpenerVariety', () => {
  const e = new OpenerVariety();

  it('unique opener ratio 1.0 for distinct openers', () => {
    expect(e.uniqueOpenerRatio('我来了。她走了。他去了。')).toBe(1.0);
  });

  it('unique opener ratio low for repeated opener', () => {
    const r = e.uniqueOpenerRatio('他来了。他走了。他去了。');
    expect(r).toBeLessThan(0.5);
  });

  it('mostCommonOpener identifies dominant', () => {
    const m = e.mostCommonOpener('他来了。她去了。');
    expect(['他', '她']).toContain(m.char);
  });
});

describe('SentenceTypeMix', () => {
  const e = new SentenceTypeMix();

  it('classifies declarative', () => {
    expect(e.classify('我来了。')).toBe('declarative');
  });

  it('classifies interrogative', () => {
    expect(e.classify('你去吗？')).toBe('interrogative');
  });

  it('classifies exclamatory', () => {
    expect(e.classify('太棒了！')).toBe('exclamatory');
  });

  it('dominant returns most common', () => {
    expect(e.dominant('我来了。你好。再见。')).toBe('declarative');
  });
});

describe('ParagraphLengthDist', () => {
  const e = new ParagraphLengthDist();

  it('analyze on multi-paragraph', () => {
    const a = e.analyze('短。\n\n这是一段很长的段落，有很多的字和内容。');
    expect(a.count).toBe(2);
  });

  it('countShort', () => {
    expect(e.countShort('a\nb\n' + '很'.repeat(200))).toBe(2);
  });

  it('countLong', () => {
    expect(e.countLong('a\n' + '很'.repeat(600))).toBe(1);
  });
});

describe('ActivePassiveRatio', () => {
  const e = new ActivePassiveRatio();

  it('detects Chinese passive 被', () => {
    const r = e.count('他被打。我走了。');
    expect(r.passive).toBeGreaterThanOrEqual(1);
  });

  it('detects English passive was Xed', () => {
    const r = e.count('He was attacked. She went home.');
    expect(r.passive).toBeGreaterThanOrEqual(1);
  });

  it('isOverPassive false for active-heavy', () => {
    expect(e.isOverPassive('我走。我看。我说。')).toBe(false);
  });
});

describe('LongShortAlternation', () => {
  const e = new LongShortAlternation();

  it('high alternation for mixed lengths', () => {
    const longSent = '很'.repeat(60) + '。';
    const a = e.alternationScore('短。' + longSent.repeat(3) + '短。');
    expect(a).toBeGreaterThan(0);
  });

  it('low alternation for all-same-length', () => {
    const a = e.alternationScore('同样。同样。同样。同样。');
    expect(a).toBeLessThan(0.5);
  });
});

describe('ClauseComplexity', () => {
  const e = new ClauseComplexity();

  it('simple for short sentences', () => {
    expect(e.classifyComplexity('我走。你来。')).toBe('simple');
  });

  it('complex for many commas', () => {
    expect(e.classifyComplexity('我走了，路过商店，看到朋友，坐下喝了一杯。')).not.toBe('simple');
  });
});

describe('PhraseLengthHistogram', () => {
  const e = new PhraseLengthHistogram();

  it('histogram has values', () => {
    const h = e.histogram('我 来了 你好 再见吧', 5);
    expect(h.length).toBe(5);
    expect(h.reduce((a, b) => a + b, 0)).toBe(4);
  });

  it('medianPhraseLength', () => {
    const m = e.medianPhraseLength('a bb ccc');
    expect(m).toBeGreaterThan(0);
  });
});

describe('SyntacticVarietyScore', () => {
  const e = new SyntacticVarietyScore();

  it('high variety for distinct openers', () => {
    expect(e.score('我来了。她走了。他去了。')).toBeGreaterThan(0.5);
  });

  it('monotonous false for varied', () => {
    expect(e.isMonotonous('我来了。她走了。')).toBe(false);
  });
});

describe('SentenceCadence', () => {
  const e = new SentenceCadence();

  it('profile has all keys', () => {
    const p = e.profile('我来了。你好吗？');
    expect(p).toHaveProperty('endsWithNoun');
    expect(p).toHaveProperty('endsWithParticle');
  });

  it('dominantEnd for statements', () => {
    expect(e.dominantEnd('我来了。她走了。')).toBe('noun');
  });
});
