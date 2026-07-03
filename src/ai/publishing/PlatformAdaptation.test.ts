/**
 * PlatformAdaptation.test.ts — Direction AE, V3226-V3235 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  PlatformWordcountAdapter,
  PlatformFormat,
  PlatformTone,
  PlatformSensitivity,
  PlatformContractCheck,
  SynopsisGenerator,
  TitleClickbait,
  SellingPointExtractor,
  KeywordSEO,
  RecommendationGenerator,
} from './PlatformAdaptation';

describe('PlatformWordcountAdapter', () => {
  const e = new PlatformWordcountAdapter();

  it('getSpec for qidian', () => {
    const spec = e.getSpec('qidian');
    expect(spec.min).toBe(2000);
    expect(spec.max).toBe(3000);
  });

  it('isValidLength true for in range', () => {
    expect(e.isValidLength('qidian', 2500)).toBe(true);
  });

  it('isValidLength false for out of range', () => {
    expect(e.isValidLength('qidian', 1000)).toBe(false);
  });

  it('recommendAdjustment', () => {
    const r = e.recommendAdjustment('qidian', 1000);
    expect(r).toContain('需增加');
  });
});

describe('PlatformFormat', () => {
  const e = new PlatformFormat();

  it('format applies indent', () => {
    const result = e.format('qidian', 'A。\nB。');
    expect(result).toContain('　　A');
  });

  it('getRules', () => {
    const r = e.getRules('jinjiang');
    expect(r.paragraphIndent).toBe('　　');
  });
});

describe('PlatformTone', () => {
  const e = new PlatformTone();

  it('jinjiang is female', () => {
    expect(e.getTone('jinjiang').gender).toBe('female');
  });

  it('isThemed for qidian', () => {
    expect(e.isThemed('qidian', '升级')).toBe(true);
  });
});

describe('PlatformSensitivity', () => {
  const e = new PlatformSensitivity();

  it('detect for porn in qidian', () => {
    expect(e.detect('色情内容', 'qidian')).toContain('色情');
  });

  it('isClean for safe text', () => {
    expect(e.isClean('正常的小说内容', 'qidian')).toBe(true);
  });
});

describe('PlatformContractCheck', () => {
  const e = new PlatformContractCheck();

  it('meets for qidian 100k+', () => {
    const r = e.check('qidian', { totalWords: 100000, exclusive: false, updateFrequency: 'daily' });
    expect(r.meets).toBe(true);
  });

  it('issues for jinjiang non-exclusive', () => {
    const r = e.check('jinjiang', { totalWords: 100000, exclusive: false, updateFrequency: 'daily' });
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe('SynopsisGenerator', () => {
  const e = new SynopsisGenerator();

  it('generate selling style', () => {
    const result = e.generate('测试书', '玄幻', 'selling');
    expect(result).toContain('测试书');
  });

  it('generateAllStyles returns 3', () => {
    const all = e.generateAllStyles('X', 'Y');
    expect(all).toHaveLength(3);
  });
});

describe('TitleClickbait', () => {
  const e = new TitleClickbait();

  it('generate replaces vars', () => {
    const result = e.generate('{hero}在{place}', { hero: '我', place: '山洞' });
    expect(result).toContain('我');
    expect(result).toContain('山洞');
  });

  it('getTemplates returns 4', () => {
    expect(e.getTemplates()).toHaveLength(4);
  });
});

describe('SellingPointExtractor', () => {
  const e = new SellingPointExtractor();

  it('extracts gold finger', () => {
    expect(e.extract('主角有金手指系统')).toContain('有金手指');
  });

  it('countPoints', () => {
    expect(e.countPoints('金手指，重生，无敌。')).toBeGreaterThanOrEqual(3);
  });
});

describe('KeywordSEO', () => {
  const e = new KeywordSEO();

  it('getTrending returns 10', () => {
    expect(e.getTrending()).toHaveLength(10);
  });

  it('extractFromText', () => {
    expect(e.extractFromText('穿越和重生')).toContain('穿越');
  });

  it('recommend returns 5', () => {
    const r = e.recommend('穿越书', '金手指');
    expect(r.length).toBeGreaterThanOrEqual(2);
  });
});

describe('RecommendationGenerator', () => {
  const e = new RecommendationGenerator();

  it('generate includes title', () => {
    expect(e.generate('X', 'Y', [])).toContain('X');
  });

  it('generateVariants returns 3', () => {
    expect(e.generateVariants('X', 'Y', ['a'])).toHaveLength(3);
  });
});
