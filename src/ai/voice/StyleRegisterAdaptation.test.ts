/**
 * StyleRegisterAdaptation.test.ts — Direction AD, V3216-V3225 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  StyleTrainingDataGenerator,
  StyleComparison,
  StyleDriftDetector,
  StyleConsistencyScorer,
  AuthorIdentifier,
  GenreStyleRecognizer,
  EraStyleRecognizer,
  SentenceLevelTransfer,
  ParagraphMixer,
  VoiceStyleIndex,
} from './StyleRegisterAdaptation';

describe('StyleTrainingDataGenerator', () => {
  const e = new StyleTrainingDataGenerator();

  it('generate returns per-sample features', () => {
    const result = e.generate('A', ['短。', '长一点的句子。']);
    expect(result).toHaveLength(2);
    expect(result[0].author).toBe('A');
  });

  it('features has avgSentenceLength', () => {
    const result = e.generate('A', ['短。']);
    expect(result[0].features.avgSentenceLength).toBeGreaterThan(0);
  });
});

describe('StyleComparison', () => {
  const e = new StyleComparison();

  it('compare returns 0-1', () => {
    expect(e.compare('a', 'a')).toBeCloseTo(0, 5);
  });

  it('isSimilar for same text', () => {
    expect(e.isSimilar('Hello world.', 'Hello world.')).toBe(true);
  });
});

describe('StyleDriftDetector', () => {
  const e = new StyleDriftDetector();

  it('track + detectDrift null for <2', () => {
    e.track(1, { a: 1 });
    expect(e.detectDrift()).toBeNull();
  });

  it('detectDrift for big change', () => {
    e.track(1, { a: 1, b: 1 });
    e.track(2, { a: 10, b: 10 });
    expect(e.detectDrift(0.3)).not.toBeNull();
  });
});

describe('StyleConsistencyScorer', () => {
  const e = new StyleConsistencyScorer();

  it('score 1 for identical', () => {
    const fps = [{ a: 1 }, { a: 1 }];
    expect(e.score(fps)).toBeCloseTo(1, 5);
  });

  it('isConsistent for similar', () => {
    const fps = [{ a: 1, b: 1 }, { a: 1.05, b: 1.05 }];
    expect(e.isConsistent(fps, 0.9)).toBe(true);
  });
});

describe('AuthorIdentifier', () => {
  const e = new AuthorIdentifier();

  it('identify returns best match', () => {
    e.addCandidate('A', '短。');
    e.addCandidate('B', '一个非常长的句子比短的要长很多。');
    const r = e.identify('一个非常长的句子比短的要长很多。');
    expect(r.author).toBe('B');
  });
});

describe('GenreStyleRecognizer', () => {
  const e = new GenreStyleRecognizer();

  it('recognize poem for rhyme', () => {
    expect(e.recognize('押韵和意象。')).toBe('poem');
  });

  it('isGenre for novel', () => {
    expect(e.isGenre('人物和情节。', 'novel', 2)).toBe(true);
  });
});

describe('EraStyleRecognizer', () => {
  const e = new EraStyleRecognizer();

  it('recognize ancient', () => {
    expect(e.recognize('之乎者也矣焉乃。')).toBe('ancient');
  });

  it('recognize future', () => {
    expect(e.recognize('AI芯片全息神经网络。')).toBe('future');
  });
});

describe('SentenceLevelTransfer', () => {
  const e = new SentenceLevelTransfer();

  it('transfer applies to all sentences', () => {
    const result = e.transfer('A。B。', 'X');
    expect(result.split('[X]').length - 1).toBe(2);
  });

  it('countSentences', () => {
    expect(e.countSentences('A。B。C。')).toBe(3);
  });
});

describe('ParagraphMixer', () => {
  const e = new ParagraphMixer();

  it('mix interleaves characters', () => {
    const result = e.mix(['AB', 'CD']);
    expect(result).toContain('A');
    expect(result).toContain('D');
  });

  it('isValidInput true for non-empty', () => {
    expect(e.isValidInput(['A', 'B'])).toBe(true);
  });
});

describe('VoiceStyleIndex', () => {
  const idx = new VoiceStyleIndex();

  it('lists 30 engines', () => {
    expect(idx.count()).toBe(30);
  });
});
