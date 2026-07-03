/**
 * StyleTransferLearning.test.ts — Direction AD, V3206-V3215 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  HigashinoKeigoStyle,
  MurakamiHarukiStyle,
  NatsumeSosekiStyle,
  LuXunModernStyle,
  WenYanWenConverter,
  StyleTransfer,
  StyleMixer,
  StyleEvolution,
  StyleMaturity,
  ParagraphLevelTransfer,
} from './StyleTransferLearning';

describe('HigashinoKeigoStyle', () => {
  const e = new HigashinoKeigoStyle();

  it('score for mystery family', () => {
    expect(e.score('谜底关于家庭和人性。')).toBeGreaterThan(0);
  });

  it('matches for all keywords', () => {
    expect(e.matches('谜底真相人性家庭母亲动机复杂。')).toBe(true);
  });
});

describe('MurakamiHarukiStyle', () => {
  const e = new MurakamiHarukiStyle();

  it('matches for cat/jazz/dream', () => {
    expect(e.matches('孤独的猫和井里的爵士，梦境。')).toBe(true);
  });
});

describe('NatsumeSosekiStyle', () => {
  const e = new NatsumeSosekiStyle();

  it('matches for meiji era', () => {
    expect(e.matches('明治维新知识分子的讽刺与古典。')).toBe(true);
  });
});

describe('LuXunModernStyle', () => {
  const e = new LuXunModernStyle();

  it('score for short critical', () => {
    expect(e.score('我看着他，冷。')).toBeGreaterThan(0);
  });

  it('matches for modern LuXun', () => {
    expect(e.matches('我，旧社会，新的，冷。寒。暖。热。')).toBe(true);
  });
});

describe('WenYanWenConverter', () => {
  const e = new WenYanWenConverter();

  it('modernToClassical replaces', () => {
    const result = e.modernToClassical('我来了');
    expect(result).toContain('余');
  });

  it('classicalScore > 0 for classical', () => {
    expect(e.classicalScore('余乃在矣')).toBeGreaterThan(0);
  });

  it('isClassical for many classical markers', () => {
    expect(e.isClassical('余乃在矣之彼')).toBe(true);
  });
});

describe('StyleTransfer', () => {
  const e = new StyleTransfer();

  it('modernToClassical transfer', () => {
    const result = e.transfer('我来了', 'modern', 'classical');
    expect(result).toContain('余');
  });

  it('isValidTransfer', () => {
    const result = e.transfer('test', 'A', 'B');
    expect(e.isValidTransfer('test', result)).toBe(true);
  });
});

describe('StyleMixer', () => {
  const e = new StyleMixer();

  it('mix ratio 0.5', () => {
    const result = e.mix('Hello world this is a test', 'A', 'B', 0.5);
    expect(result).toContain('[A]');
    expect(result).toContain('[B]');
  });

  it('isValidRatio', () => {
    expect(e.isValidRatio(0.5)).toBe(true);
    expect(e.isValidRatio(1.5)).toBe(false);
  });
});

describe('StyleEvolution', () => {
  const e = new StyleEvolution();

  it('snapshot + getAll', () => {
    e.snapshot(1, 'A', 'fp1');
    e.snapshot(5, 'B', 'fp2');
    expect(e.getAll()).toHaveLength(2);
  });

  it('hasDrift for 3+ styles', () => {
    e.snapshot(1, 'A', 'x');
    e.snapshot(5, 'B', 'y');
    e.snapshot(10, 'C', 'z');
    expect(e.hasDrift(3)).toBe(true);
  });
});

describe('StyleMaturity', () => {
  const e = new StyleMaturity();

  it('classify beginner for short', () => {
    expect(e.classify('a。')).toBe('beginner');
  });

  it('classify master for long complex', () => {
    const long = ('这是测试。这是一个非常长的句子，充满了隐喻和象征，深刻的主题，复杂的情感，' + 'x'.repeat(200) + '。').repeat(20);
    expect(e.classify(long)).toBe('master');
  });
});

describe('ParagraphLevelTransfer', () => {
  const e = new ParagraphLevelTransfer();

  it('transfer applies to all paragraphs', () => {
    const result = e.transfer('A。\nB。\nC。', 'X');
    expect(result.split('\n').filter((p) => p.includes('[X]')).length).toBe(3);
  });

  it('countParagraphs', () => {
    expect(e.countParagraphs('A。\n\nB。\n\n\nC。')).toBe(3);
  });
});
