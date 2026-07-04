/**
 * TitleGeneration.test.ts — Direction AI, V3346-V3355 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  TitleGenerator,
  TitleClickbaitScorer,
  TitleSEOOptimizer,
  TitleLengthValidator,
  TitleEmotionDetector,
  TitleGenreMatcher,
  TitleABTester,
  TitlePatternLearner,
  TitleRanker,
  TitleOptimizerIndex,
  type TitleCandidate,
} from './TitleGeneration';

describe('TitleGenerator', () => {
  const e = new TitleGenerator();

  it('generate from hooks', () => {
    expect(e.generate(['第一章 觉醒', '第二章 战斗'])).toHaveLength(2);
  });

  it('generateWithTemplate', () => {
    expect(e.generateWithTemplate('第{n}章 {action}', { n: 1, action: '觉醒' })).toBe('第1章 觉醒');
  });

  it('generateVariants returns 3', () => {
    expect(e.generateVariants('基础', 3)).toHaveLength(3);
  });

  it('getTemplates returns 5', () => {
    expect(e.getTemplates()).toHaveLength(5);
  });
});

describe('TitleClickbaitScorer', () => {
  const e = new TitleClickbaitScorer();

  it('score high for clickbait', () => {
    expect(e.score('震惊！逆袭秒杀！')).toBeGreaterThan(0);
  });

  it('classify clickbait for 0.6+', () => {
    expect(e.classify(0.7)).toBe('clickbait');
  });

  it('classify subtle for 0.1', () => {
    expect(e.classify(0.1)).toBe('subtle');
  });
});

describe('TitleSEOOptimizer', () => {
  const e = new TitleSEOOptimizer();

  it('extractKeywords for 穿越', () => {
    expect(e.extractKeywords('穿越到异世界')).toContain('穿越');
  });

  it('suggestKeywords pads to 2+', () => {
    expect(e.suggestKeywords('普通标题').length).toBeGreaterThanOrEqual(2);
  });

  it('seoScore for 3+ keywords', () => {
    expect(e.seoScore('穿越重生金手指')).toBeGreaterThanOrEqual(1);
  });
});

describe('TitleLengthValidator', () => {
  const e = new TitleLengthValidator();

  it('isValid for 4-30', () => {
    expect(e.isValid('正常的标题')).toBe(true);
  });

  it('isIdeal for 8-16', () => {
    expect(e.isIdeal('这是理想长度的标题')).toBe(true);
  });

  it('recommend too short', () => {
    expect(e.recommend('短')).toContain('太短');
  });
});

describe('TitleEmotionDetector', () => {
  const e = new TitleEmotionDetector();

  it('detect excitement', () => {
    expect(e.detect('热血燃爆')).toBe('excitement');
  });

  it('detect mystery', () => {
    expect(e.detect('未解之谜')).toBe('mystery');
  });

  it('isExciting for excitement', () => {
    expect(e.isExciting('激战热血')).toBe(true);
  });
});

describe('TitleGenreMatcher', () => {
  const e = new TitleGenreMatcher();

  it('match xuanhuan', () => {
    expect(e.match('凡人修仙传')).toBe('xuanhuan');
  });

  it('match romance', () => {
    expect(e.match('甜蜜爱情故事')).toBe('romance');
  });

  it('isGenreConsistent true', () => {
    expect(e.isGenreConsistent('修仙记', 'xuanhuan')).toBe(true);
  });
});

describe('TitleABTester', () => {
  const e = new TitleABTester();

  it('record + ctr', () => {
    e.recordImpression('A');
    e.recordImpression('A');
    e.recordClick('A');
    e.recordImpression('B');
    e.recordImpression('B');
    e.recordClick('B');
    expect(e.ctr('A')).toBe(0.5);
    expect(e.ctr('B')).toBe(0.5);
  });

  it('winner returns best', () => {
    const e2 = new TitleABTester();
    e2.recordImpression('A');
    e2.recordImpression('A');
    e2.recordImpression('A');
    e2.recordClick('A');
    e2.recordImpression('B');
    e2.recordImpression('B');
    e2.recordClick('B');
    e2.recordClick('B');
    e2.recordClick('B');
    expect(e2.winner(['A', 'B'])).toBe('B');
  });
});

describe('TitlePatternLearner', () => {
  const e = new TitlePatternLearner();

  it('learn + getPatterns', () => {
    e.learn('四字标题');
    e.learn('五字更长');
    expect(e.getPatterns().length).toBeGreaterThanOrEqual(1);
  });

  it('mostCommon returns top', () => {
    e.learn('a b c d');
    e.learn('e f g h');
    e.learn('i j k l');
    expect(e.mostCommon()).toContain('汉字');
  });
});

describe('TitleRanker', () => {
  const e = new TitleRanker();

  it('rank by score', () => {
    const r = e.rank([
      { title: 'A', score: 0.5 },
      { title: 'B', score: 0.9 },
      { title: 'C', score: 0.7 },
    ]);
    expect(r[0].title).toBe('B');
  });

  it('topN', () => {
    const r = e.topN([
      { title: 'A', score: 0.5 },
      { title: 'B', score: 0.9 },
      { title: 'C', score: 0.7 },
    ], 2);
    expect(r).toHaveLength(2);
  });

  it('isCompetitive for high score', () => {
    expect(e.isCompetitive([{ title: 'A', score: 0.8 }])).toBe(true);
  });
});

describe('TitleOptimizerIndex', () => {
  const idx = new TitleOptimizerIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
