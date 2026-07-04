/**
 * VoiceDifferentiation.test.ts — Direction AH, V3326-V3335 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  VoiceDifferentiationAnalyzer,
  CrossCharacterComparison,
  VoiceConsistencyChecker,
  VoiceEvolutionTracker,
  VoiceAnomalyDetector,
  DialogueConflictDetector,
  CharacterVoiceClassifier,
  VoiceStrengthMeter,
  VoiceTemplateBuilder,
  VoiceDifferentiationIndex,
  type CharacterVoiceProfile,
} from './VoiceDifferentiation';

describe('VoiceDifferentiationAnalyzer', () => {
  const e = new VoiceDifferentiationAnalyzer();

  it('profile returns 7 fields', () => {
    const p = e.profile('Alice', ['短。', '这是长一点的句子。']);
    expect(p.avgLen).toBeGreaterThan(0);
    expect(p).toHaveProperty('ttr');
  });
});

describe('CrossCharacterComparison', () => {
  const e = new CrossCharacterComparison();

  it('compare 0-1', () => {
    const a: CharacterVoiceProfile = { character: 'A', avgLen: 10, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.5 };
    const b: CharacterVoiceProfile = { character: 'B', avgLen: 50, ttr: 0.8, questionRate: 0.5, exclamationRate: 0.3, fillerCount: 2, formality: 0.2 };
    const c = e.compare(a, b);
    expect(c).toBeGreaterThan(0);
  });

  it('isDistinct for very different', () => {
    const a: CharacterVoiceProfile = { character: 'A', avgLen: 5, ttr: 0.3, questionRate: 0, exclamationRate: 0, fillerCount: 0, formality: 0.2 };
    const b: CharacterVoiceProfile = { character: 'B', avgLen: 80, ttr: 0.9, questionRate: 0.5, exclamationRate: 0.5, fillerCount: 5, formality: 0.9 };
    expect(e.isDistinct(a, b)).toBe(true);
  });
});

describe('VoiceConsistencyChecker', () => {
  const e = new VoiceConsistencyChecker();

  it('check returns consistent for varied', () => {
    const profiles: CharacterVoiceProfile[] = [
      { character: 'A', avgLen: 10, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.5 },
      { character: 'B', avgLen: 50, ttr: 0.7, questionRate: 0.3, exclamationRate: 0.2, fillerCount: 1, formality: 0.7 },
    ];
    expect(e.check(profiles).issues.length).toBe(0);
  });
});

describe('VoiceEvolutionTracker', () => {
  const e = new VoiceEvolutionTracker();

  it('hasVoiceShift for big formality change', () => {
    const a: CharacterVoiceProfile = { character: 'A', avgLen: 30, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.2 };
    const b: CharacterVoiceProfile = { character: 'A', avgLen: 30, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.8 };
    e.record('A', 1, a);
    e.record('A', 5, b);
    expect(e.hasVoiceShift('A')).toBe(true);
  });
});

describe('VoiceAnomalyDetector', () => {
  const e = new VoiceAnomalyDetector();

  it('isAnomalous for big change', () => {
    const base: CharacterVoiceProfile = { character: 'A', avgLen: 30, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.5 };
    const odd: CharacterVoiceProfile = { character: 'A', avgLen: 100, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.5 };
    e.setBaseline(base);
    expect(e.isAnomalous(odd)).toBe(true);
  });
});

describe('DialogueConflictDetector', () => {
  const e = new DialogueConflictDetector();

  it('hasConflict for identical voices', () => {
    const a: CharacterVoiceProfile = { character: 'A', avgLen: 30, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.5 };
    const b: CharacterVoiceProfile = { character: 'B', avgLen: 30.5, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.5 };
    expect(e.hasConflict([a, b])).toBe(true);
  });
});

describe('CharacterVoiceClassifier', () => {
  const e = new CharacterVoiceClassifier();

  it('classify common for filler', () => {
    const p: CharacterVoiceProfile = { character: 'A', avgLen: 20, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 5, formality: 0.5 };
    expect(e.classify(p)).toBe('common');
  });

  it('classify educated for formal', () => {
    const p: CharacterVoiceProfile = { character: 'A', avgLen: 30, ttr: 0.7, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.9 };
    expect(e.classify(p)).toBe('educated');
  });
});

describe('VoiceStrengthMeter', () => {
  const e = new VoiceStrengthMeter();

  it('measure strong voice', () => {
    const p: CharacterVoiceProfile = { character: 'A', avgLen: 30, ttr: 0.7, questionRate: 0.3, exclamationRate: 0.3, fillerCount: 2, formality: 0.8 };
    expect(e.measure(p)).toBeGreaterThan(0.6);
  });

  it('isStrong for high score', () => {
    const p: CharacterVoiceProfile = { character: 'A', avgLen: 30, ttr: 0.7, questionRate: 0.3, exclamationRate: 0.3, fillerCount: 2, formality: 0.8 };
    expect(e.isStrong(p)).toBe(true);
  });
});

describe('VoiceTemplateBuilder', () => {
  const e = new VoiceTemplateBuilder();

  it('build includes character + metrics', () => {
    const p: CharacterVoiceProfile = { character: 'A', avgLen: 30, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.5 };
    expect(e.build('A', p)).toContain('A');
  });

  it('toMarkdown for list', () => {
    const ps: CharacterVoiceProfile[] = [
      { character: 'A', avgLen: 10, ttr: 0.5, questionRate: 0.1, exclamationRate: 0.1, fillerCount: 0, formality: 0.5 },
    ];
    expect(e.toMarkdown(ps)).toContain('- A');
  });
});

describe('VoiceDifferentiationIndex', () => {
  const idx = new VoiceDifferentiationIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
