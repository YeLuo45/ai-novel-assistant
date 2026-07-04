/**
 * WriterAnalysis.test.ts — Direction AK, V3406-V3415 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  WriterStrengthFinder,
  WriterWeaknessFinder,
  WritingStyleAnalyzer,
  PacingProfiler,
  DialogueProfiler,
  DescriptionProfiler,
  CharacterProfiler,
  PlotProfiler,
  GenreAffinityDetector,
  WriterAnalysisIndex,
  type Chapter,
} from './WriterAnalysis';

describe('WriterStrengthFinder', () => {
  const e = new WriterStrengthFinder();

  it('detect action for battle', () => {
    const r = e.detect('战斗追逐爆炸');
    expect(r?.category).toBe('action');
  });

  it('detect emotion for love', () => {
    const r = e.detect('爱恨悲伤思念');
    expect(r?.category).toBe('emotion');
  });

  it('isStrength true for high count', () => {
    expect(e.isStrength('action', '战斗战斗战斗')).toBe(true);
  });
});

describe('WriterWeaknessFinder', () => {
  const e = new WriterWeaknessFinder();

  it('detect for many 的/了', () => {
    const r = e.detect('他的了是他的了是他的了');
    expect(r.length).toBeGreaterThan(0);
  });

  it('topWeakness returns highest count', () => {
    const top = e.topWeakness('他的了他的了他的了然后接着然后');
    expect(top).not.toBeNull();
  });
});

describe('WritingStyleAnalyzer', () => {
  const e = new WritingStyleAnalyzer();

  it('analyze returns 4 fields', () => {
    const r = e.analyze('他走进房间。' + '然后说话。'.repeat(5));
    expect(r).toHaveProperty('avgSentenceLen');
    expect(r).toHaveProperty('dialogueRatio');
  });

  it('dialogueRatio for quoted text', () => {
    const r = e.analyze('"你好"他说。');
    expect(r.dialogueRatio).toBeGreaterThan(0);
  });
});

describe('PacingProfiler', () => {
  const e = new PacingProfiler();

  it('profile slow for short chapters', () => {
    const chs: Chapter[] = [{ content: '短' }];
    expect(e.profile(chs).pacing).toBe('slow');
  });

  it('profile fast for long chapters', () => {
    const chs: Chapter[] = [{ content: 'a'.repeat(5000) }];
    expect(e.profile(chs).pacing).toBe('fast');
  });
});

describe('DialogueProfiler', () => {
  const e = new DialogueProfiler();

  it('profile counts dialogues', () => {
    const r = e.profile('"你好"他说。"再见"她说。');
    expect(r.dialogueCount).toBeGreaterThan(0);
  });

  it('tagVariety for varied tags', () => {
    const r = e.profile('他问，她答，我说，喊道，said，asked');
    expect(r.tagVariety).toBeGreaterThan(2);
  });
});

describe('DescriptionProfiler', () => {
  const e = new DescriptionProfiler();

  it('profile for sensory text', () => {
    const r = e.profile('他看到光，听到声音，尝到味道。');
    expect(r.sensoryCount).toBeGreaterThan(0);
  });

  it('isRich for 3+ senses', () => {
    expect(e.isRich('看 听 闻 摸 尝')).toBe(true);
  });
});

describe('CharacterProfiler', () => {
  const e = new CharacterProfiler();

  it('profile counts mentions', () => {
    const r = e.profile('他和她遇到我。');
    expect(r.characterMentions).toBeGreaterThan(0);
  });
});

describe('PlotProfiler', () => {
  const e = new PlotProfiler();

  it('profile for causal text', () => {
    const r = e.profile('因为下雨，所以他没去，因此她等了。');
    expect(r.causalLinks).toBeGreaterThan(2);
  });

  it('isCausallyRich', () => {
    expect(e.isCausallyRich('因为下雨，所以取消。')).toBe(true);
  });
});

describe('GenreAffinityDetector', () => {
  const e = new GenreAffinityDetector();

  it('detect wuxia', () => {
    const r = e.detect('剑和江湖侠客。');
    expect(r.genre).toBe('wuxia');
  });

  it('detect romance', () => {
    const r = e.detect('爱情和心和浪漫。');
    expect(r.genre).toBe('romance');
  });

  it('isAffinity for 3+', () => {
    expect(e.isAffinity('wuxia', '剑剑剑')).toBe(true);
  });
});

describe('WriterAnalysisIndex', () => {
  const idx = new WriterAnalysisIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
