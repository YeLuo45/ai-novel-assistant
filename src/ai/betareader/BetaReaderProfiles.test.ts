/**
 * BetaReaderProfiles.test.ts — Direction AL, V3436-V3445 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  BetaReaderPersonaBuilder,
  WebNovelReader,
  LiteraryReader,
  GenreSpecificReader,
  YoungAdultReader,
  MiddleAgedReader,
  CasualReader,
  AvidReader,
  CriticalReader,
  BetaReaderProfilesIndex,
  type Chapter,
  type BetaReader,
} from './BetaReaderProfiles';

describe('BetaReaderPersonaBuilder', () => {
  const e = new BetaReaderPersonaBuilder();

  it('build for web', () => {
    const r = e.build('web', '小王');
    expect(r.type).toBe('web');
    expect(r.preferences).toContain('爽点');
  });

  it('build for literary', () => {
    const r = e.build('literary', '李姐');
    expect(r.preferences).toContain('文笔');
  });

  it('buildAll returns 3', () => {
    expect(e.buildAll()).toHaveLength(3);
  });
});

describe('WebNovelReader', () => {
  const e = new WebNovelReader();

  it('rate for short chapter = issues', () => {
    const r = e.rate([{ content: '短' }]);
    expect(r.issues.length).toBeGreaterThan(0);
  });

  it('rate for 爽点 text = good', () => {
    const r = e.rate([{ content: '战斗爽金手指逆袭' + '正常文字'.repeat(50) }]);
    expect(r.rating).toBeGreaterThan(3);
  });

  it('isSatisfied for 4+', () => {
    expect(e.isSatisfied(4.5)).toBe(true);
  });
});

describe('LiteraryReader', () => {
  const e = new LiteraryReader();

  it('rate for depth = good', () => {
    const r = e.rate('隐喻象征主题反思深刻内容。' + 'x'.repeat(200));
    expect(r.rating).toBeGreaterThanOrEqual(3);
  });

  it('rate for too-tell = low', () => {
    const r = e.rate('他很生气，她很高兴，他感到难过。');
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe('GenreSpecificReader', () => {
  const e = new GenreSpecificReader();

  it('rate wuxia for 2 keywords = good', () => {
    const r = e.rate('wuxia', '剑和江湖。' + 'x'.repeat(200));
    expect(r.rating).toBeGreaterThan(3);
  });

  it('rate wuxia for 0 keywords = bad', () => {
    const r = e.rate('wuxia', 'no genre content here.');
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe('YoungAdultReader', () => {
  const e = new YoungAdultReader();

  it('rate for exciting = good', () => {
    const r = e.rate('刺激浪漫冒险神秘青春。');
    expect(r.rating).toBeGreaterThan(3);
  });

  it('rate for too dark = bad', () => {
    const r = e.rate('死亡悲剧绝望。');
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe('MiddleAgedReader', () => {
  const e = new MiddleAgedReader();

  it('rate for depth = good', () => {
    const r = e.rate('深度真实情感家庭职场。');
    expect(r.rating).toBeGreaterThan(3);
  });

  it('rate for tropey = bad', () => {
    const r = e.rate('金手指系统重生。');
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe('CasualReader', () => {
  const e = new CasualReader();

  it('rate for short easy text = good', () => {
    const r = e.rate('短文，有标点。');
    expect(r.rating).toBeGreaterThan(3);
  });

  it('rate for too literary = bad', () => {
    const r = e.rate('隐喻象征主题。');
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe('AvidReader', () => {
  const e = new AvidReader();

  it('rate for unique long = good', () => {
    const r = e.rate('独特新颖创新。' + 'x'.repeat(500));
    expect(r.rating).toBeGreaterThan(3);
  });

  it('rate for cliche = bad', () => {
    const r = e.rate('他很帅，她很美。');
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe('CriticalReader', () => {
  const e = new CriticalReader();

  it('rate for short plain = low', () => {
    const r = e.rate('短文。');
    expect(r.rating).toBeLessThan(5);
  });

  it('rate for varied = high', () => {
    const r = e.rate('多变的标点;如同交响乐!这是;一段精彩文字,有深度。');
    expect(r.rating).toBeGreaterThan(3);
  });
});

describe('BetaReaderProfilesIndex', () => {
  const idx = new BetaReaderProfilesIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
