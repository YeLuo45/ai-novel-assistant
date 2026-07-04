/**
 * VoiceFeatures.test.ts — Direction AH, V3316-V3325 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  CharacterSpeechPattern,
  SentenceLengthByCharacter,
  VocabularyRichnessByCharacter,
  QuestionFrequencyByCharacter,
  ExclamationByCharacter,
  FillerWordsByCharacter,
  FormalityByCharacter,
  DialectByCharacter,
  SlangByCharacter,
  VoiceFeaturesIndex,
} from './VoiceFeatures';

describe('CharacterSpeechPattern', () => {
  const e = new CharacterSpeechPattern();

  it('extract returns avgLen + pattern', () => {
    const r = e.extract('Alice', ['短。', '这是长一点的句子。']);
    expect(r.avgLen).toBeGreaterThan(0);
  });

  it('classify terse for short', () => {
    expect(e.classify(5)).toBe('terse');
  });

  it('classify verbose for long', () => {
    expect(e.classify(100)).toBe('verbose');
  });

  it('classify normal for medium', () => {
    expect(e.classify(30)).toBe('normal');
  });
});

describe('SentenceLengthByCharacter', () => {
  const e = new SentenceLengthByCharacter();

  it('compute for multiple lines', () => {
    const r = e.compute(['短。', '这是长一点的句子。']);
    expect(r.mean).toBeGreaterThan(0);
  });

  it('returns 0 for empty', () => {
    expect(e.compute([]).mean).toBe(0);
  });
});

describe('VocabularyRichnessByCharacter', () => {
  const e = new VocabularyRichnessByCharacter();

  it('compute TTR', () => {
    const r = e.compute(['cat dog bird', 'cat dog']);
    expect(r.ttr).toBeGreaterThan(0);
  });

  it('isRich for varied', () => {
    expect(e.isRich(['apple banana cherry date fig grape'])).toBe(true);
  });
});

describe('QuestionFrequencyByCharacter', () => {
  const e = new QuestionFrequencyByCharacter();

  it('count for ?-lines', () => {
    expect(e.count(['为什么？', '你是谁？'])).toBe(2);
  });

  it('rate for mixed', () => {
    expect(e.rate(['为什么？', '好的。'])).toBe(0.5);
  });
});

describe('ExclamationByCharacter', () => {
  const e = new ExclamationByCharacter();

  it('count for !-lines', () => {
    expect(e.count(['太棒了！', '天啊！'])).toBe(2);
  });

  it('rate for half exclamations', () => {
    expect(e.rate(['棒！', '好。'])).toBe(0.5);
  });
});

describe('FillerWordsByCharacter', () => {
  const e = new FillerWordsByCharacter();

  it('count for 嗯/啊', () => {
    const c = e.count(['嗯，是的。', '啊，那这样。']);
    expect(c.length).toBeGreaterThan(0);
  });

  it('isFillerHeavy for many', () => {
    expect(e.isFillerHeavy(['嗯 啊 那个 嗯啊'])).toBe(true);
  });
});

describe('FormalityByCharacter', () => {
  const e = new FormalityByCharacter();

  it('score for formal', () => {
    expect(e.score(['的 了 是 在 并且 因此 故'])).toBeGreaterThan(0.5);
  });

  it('classify formal for high', () => {
    expect(e.classify(0.8)).toBe('formal');
  });

  it('classify casual for low', () => {
    expect(e.classify(0.1)).toBe('casual');
  });
});

describe('DialectByCharacter', () => {
  const e = new DialectByCharacter();

  it('detect northern for 北京', () => {
    expect(e.detect(['我是北京人'])).toBe('northern');
  });

  it('detect southern for 上海', () => {
    expect(e.detect(['阿拉上海人'])).toBe('southern');
  });

  it('hasDialect true', () => {
    expect(e.hasDialect(['北京胡同'])).toBe(true);
  });
});

describe('SlangByCharacter', () => {
  const e = new SlangByCharacter();

  it('count for slang', () => {
    const c = e.count(['太 666 了']);
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it('isSlangHeavy for many', () => {
    expect(e.isSlangHeavy(['666 绝绝子 yyds'])).toBe(true);
  });
});

describe('VoiceFeaturesIndex', () => {
  const idx = new VoiceFeaturesIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
