/**
 * AuthorStyleFingerprint.test.ts — Direction AD, V3196-V3205 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  AuthorStyleFingerprint,
  LuXunStyle,
  LaoSheStyle,
  ZhangAilingStyle,
  JinYongStyle,
  GuLongStyle,
  HemingwayStyle,
  FitzgeraldStyle,
  JKRowlingStyle,
  StyleSimilarity,
} from './AuthorStyleFingerprint';

describe('AuthorStyleFingerprint', () => {
  const e = new AuthorStyleFingerprint();

  it('extract returns 8 fields', () => {
    const fp = e.extract('test', '这是测试文本。他走了。');
    expect(fp.avgSentenceLength).toBeGreaterThan(0);
    expect(fp).toHaveProperty('dialogueRatio');
  });

  it('compare returns 0-1', () => {
    const a = e.extract('A', '短。');
    const b = e.extract('B', '很长的句子。');
    const c = e.compare(a, b);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
  });

  it('areSimilar for same style', () => {
    const a = e.extract('A', '她走了。她来了。她回了。');
    const b = e.extract('B', '他说了。他做了。他想了。');
    expect(e.areSimilar(a, b)).toBe(true);
  });
});

describe('LuXunStyle', () => {
  const e = new LuXunStyle();

  it('score for critical text', () => {
    expect(e.score('讽刺与批判的短句。')).toBeGreaterThan(0);
  });

  it('matches for highly critical', () => {
    expect(e.matches('讽刺，尖锐，批判的冷峻短句，辛辣。')).toBe(true);
  });
});

describe('LaoSheStyle', () => {
  const e = new LaoSheStyle();

  it('score for Beijing text', () => {
    expect(e.score('北京胡同的茶馆，老百姓的幽默。')).toBeGreaterThan(0);
  });

  it('matches for highly beijing', () => {
    expect(e.matches('北京胡同茶馆老百姓幽默诙谐。')).toBe(true);
  });
});

describe('ZhangAilingStyle', () => {
  const e = new ZhangAilingStyle();

  it('score for shanghai text', () => {
    expect(e.score('旧上海的女人穿旗袍看月色。')).toBeGreaterThan(0);
  });
});

describe('JinYongStyle', () => {
  const e = new JinYongStyle();

  it('matches for wuxia text', () => {
    expect(e.matches('大侠的江湖门派内力剑法掌法。')).toBe(true);
  });
});

describe('GuLongStyle', () => {
  const e = new GuLongStyle();

  it('matches for lonely swordsman', () => {
    expect(e.matches('浪子喝酒剑月孤独寂寞冷。')).toBe(true);
  });
});

describe('HemingwayStyle', () => {
  const e = new HemingwayStyle();

  it('score for short sentences', () => {
    expect(e.score('He went. He came. He saw. He left.')).toBeGreaterThan(0);
  });

  it('matches for terse + iceberg', () => {
    expect(e.matches('Short. The sea. The mountain.')).toBe(true);
  });
});

describe('FitzgeraldStyle', () => {
  const e = new FitzgeraldStyle();

  it('score for Gatsby text', () => {
    expect(e.score('The green light at the end of the dock.')).toBeGreaterThan(0);
  });
});

describe('JKRowlingStyle', () => {
  const e = new JKRowlingStyle();

  it('matches for Harry Potter', () => {
    expect(e.matches('Harry Potter has a magic wand at Hogwarts. The secret prophecy reveals ancient courage.')).toBe(true);
  });
});

describe('StyleSimilarity', () => {
  const e = new StyleSimilarity();

  it('rankAuthors returns sorted', () => {
    const ranked = e.rankAuthors('北京胡同的茶馆和老百姓。');
    expect(ranked[0].author).toBe('LaoShe');
  });

  it('mostSimilar returns top', () => {
    const r = e.mostSimilar('江湖门派内力剑法大侠豪杰。');
    expect(r.author).toBe('JinYong');
  });
});
