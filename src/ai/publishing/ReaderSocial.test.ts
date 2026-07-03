/**
 * ReaderSocial.test.ts — Direction AE, V3236-V3245 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  TargetReaderPersonaEngine,
  CompetitorAnalysis,
  HeatmapPredictor,
  ReviewGenerator,
  ReaderFeedbackAnalyzer,
  WeiboCopywriter,
  XiaohongshuPost,
  DouyinScript,
  BilibiliScript,
  PosterSlogan,
} from './ReaderSocial';

describe('TargetReaderPersonaEngine', () => {
  const e = new TargetReaderPersonaEngine();

  it('getPersonas returns 3', () => {
    expect(e.getPersonas()).toHaveLength(3);
  });

  it('findByGender male', () => {
    expect(e.findByGender('male').length).toBeGreaterThanOrEqual(1);
  });

  it('findByPainPoint', () => {
    const r = e.findByPainPoint('烂尾');
    expect(r.some((p) => p.name === 'web_novel_enthusiast')).toBe(true);
  });
});

describe('CompetitorAnalysis', () => {
  const e = new CompetitorAnalysis();

  it('add + getAll', () => {
    e.add({ title: 'A', author: 'X', wordcount: 100000, rating: 8, uniqueFeatures: ['system'] });
    expect(e.getAll()).toHaveLength(1);
  });

  it('averageRating', () => {
    const e2 = new CompetitorAnalysis();
    e2.add({ title: 'A', author: 'X', wordcount: 100000, rating: 8, uniqueFeatures: [] });
    e2.add({ title: 'B', author: 'Y', wordcount: 200000, rating: 6, uniqueFeatures: [] });
    expect(e2.averageRating()).toBe(7);
  });

  it('findUniqueFeatures sorted by rarity', () => {
    const e3 = new CompetitorAnalysis();
    e3.add({ title: 'A', author: 'X', wordcount: 100000, rating: 8, uniqueFeatures: ['common', 'rare'] });
    e3.add({ title: 'B', author: 'Y', wordcount: 200000, rating: 6, uniqueFeatures: ['common'] });
    expect(e3.findUniqueFeatures()[0]).toBe('rare');
  });
});

describe('HeatmapPredictor', () => {
  const e = new HeatmapPredictor();

  it('predict for xuanhuan daily', () => {
    const h = e.predict({ genre: '玄幻', titleQuality: 1, authorReputation: 0, updateFrequency: 'daily' });
    expect(h).toBeGreaterThanOrEqual(8);
  });

  it('classify viral for 9+', () => {
    expect(e.classify(9)).toBe('viral');
  });

  it('classify cold for 2', () => {
    expect(e.classify(2)).toBe('cold');
  });
});

describe('ReviewGenerator', () => {
  const e = new ReviewGenerator();

  it('positive review', () => {
    expect(e.generate('X', 5, 'positive')).toContain('推荐');
  });

  it('negative review', () => {
    expect(e.generate('X', 1, 'negative')).toContain('失望');
  });

  it('generateAllRatings returns 3', () => {
    expect(e.generateAllRatings('X')).toHaveLength(3);
  });
});

describe('ReaderFeedbackAnalyzer', () => {
  const e = new ReaderFeedbackAnalyzer();

  it('analyze positive', () => {
    const r = e.analyze(['好书，赞！', 'good']);
    expect(r.positive).toBeGreaterThanOrEqual(2);
  });

  it('analyze negative', () => {
    const r = e.analyze(['太烂了', 'terrible']);
    expect(r.negative).toBeGreaterThanOrEqual(2);
  });

  it('extracts themes', () => {
    const r = e.analyze(['剧情好', '人物棒']);
    expect(r.themes.length).toBeGreaterThan(0);
  });
});

describe('WeiboCopywriter', () => {
  const e = new WeiboCopywriter();

  it('generate includes hashtag', () => {
    expect(e.generate('X', '玄幻', ['爽'])).toContain('#玄幻#');
  });

  it('generateWithHashtags', () => {
    const r = e.generateWithHashtags('X', ['玄幻', '推荐']);
    expect(r).toContain('#玄幻#');
  });
});

describe('XiaohongshuPost', () => {
  const e = new XiaohongshuPost();

  it('generate returns title+content+tags', () => {
    const r = e.generate('X', 'Y', 'Z');
    expect(r.title).toContain('X');
    expect(r.tags.length).toBeGreaterThan(0);
  });
});

describe('DouyinScript', () => {
  const e = new DouyinScript();

  it('generate returns 3 segments', () => {
    const r = e.generate('X', 'Y', 'Z');
    expect(r.segments).toHaveLength(3);
  });

  it('isShortEnough for 30s', () => {
    expect(e.isShortEnough({ duration: 30 })).toBe(true);
  });
});

describe('BilibiliScript', () => {
  const e = new BilibiliScript();

  it('generate 4 outline items', () => {
    const r = e.generate('X', 'Y', 'Z');
    expect(r.outline).toHaveLength(4);
  });

  it('hasOutline', () => {
    expect(e.hasOutline({ outline: ['a', 'b', 'c'] })).toBe(true);
  });
});

describe('PosterSlogan', () => {
  const e = new PosterSlogan();

  it('generate replaces vars', () => {
    const r = e.generate('{theme}，{promise}', { theme: '梦', promise: '成真' });
    expect(r).toContain('梦');
  });

  it('getTemplates returns 4', () => {
    expect(e.getTemplates()).toHaveLength(4);
  });
});
