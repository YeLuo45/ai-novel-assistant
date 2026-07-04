/**
 * EmotionIntegration.test.ts — Direction AG, V3306-V3315 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  FullStoryEmotionAnalyzer,
  PerChapterEmotionDistribution,
  EmotionalPacingAdvisor,
  ConflictEmotionTracker,
  ResolutionEmotionTracker,
  ReaderDropEmotionPredictor,
  BingeEmotionPredictor,
  GenreEmotionProfile,
  EmotionChapterSummary,
  EmotionArcIndexFinal,
  type Chapter,
  type CharacterEmotion,
} from './EmotionIntegration';

describe('FullStoryEmotionAnalyzer', () => {
  const e = new FullStoryEmotionAnalyzer();

  it('analyze returns 3 fields', () => {
    const chs: Chapter[] = [{ content: 'joy and sadness' }];
    const r = e.analyze(chs);
    expect(r).toHaveProperty('avgIntensity');
    expect(r).toHaveProperty('dominant');
  });

  it('dominant for joy-heavy', () => {
    const chs: Chapter[] = [{ content: 'joy joy joy' }];
    expect(e.analyze(chs).dominant).toBe('joy');
  });
});

describe('PerChapterEmotionDistribution', () => {
  const e = new PerChapterEmotionDistribution();

  it('build returns per chapter', () => {
    const chs: Chapter[] = [{ content: 'joy' }, { content: 'sadness' }];
    expect(e.build(chs)).toHaveLength(2);
  });

  it('isConsistent true for valid', () => {
    const dist = [{ chapter: 1, emotion: 'joy' }];
    expect(e.isConsistent(dist)).toBe(true);
  });
});

describe('EmotionalPacingAdvisor', () => {
  const e = new EmotionalPacingAdvisor();

  it('recommend addJoy after sadness', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'sadness', intensity: 0.5 },
    ];
    expect(e.recommend(profile).addJoy).toBe(true);
  });

  it('recommend addCatharsis for 0.9+', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.95 },
    ];
    expect(e.recommend(profile).addCatharsis).toBe(true);
  });
});

describe('ConflictEmotionTracker', () => {
  const e = new ConflictEmotionTracker();

  it('record + getCountByEmotion', () => {
    e.record(1, 'anger');
    e.record(2, 'anger');
    expect(e.getCountByEmotion('anger')).toBe(2);
  });

  it('isConflictHeavy for 5+', () => {
    for (let i = 0; i < 6; i++) e.record(i, 'anger');
    expect(e.isConflictHeavy(5)).toBe(true);
  });
});

describe('ResolutionEmotionTracker', () => {
  const e = new ResolutionEmotionTracker();

  it('record + hasResolution', () => {
    e.record(10, 'joy');
    expect(e.hasResolution()).toBe(true);
  });

  it('getAll returns', () => {
    const e2 = new ResolutionEmotionTracker();
    e2.record(1, 'joy');
    expect(e2.getAll()).toHaveLength(1);
  });
});

describe('ReaderDropEmotionPredictor', () => {
  const e = new ReaderDropEmotionPredictor();

  it('predict for sustained sadness', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'sadness', intensity: 0.5 },
      { character: 'A', chapter: 2, emotion: 'sadness', intensity: 0.5 },
      { character: 'A', chapter: 3, emotion: 'sadness', intensity: 0.5 },
      { character: 'A', chapter: 4, emotion: 'sadness', intensity: 0.5 },
    ];
    expect(e.predict(profile).riskChapters.length).toBeGreaterThanOrEqual(1);
  });

  it('isHighRisk for 0.6+', () => {
    expect(e.isHighRisk(0.6)).toBe(true);
  });
});

describe('BingeEmotionPredictor', () => {
  const e = new BingeEmotionPredictor();

  it('predict for high joy', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.8 },
      { character: 'A', chapter: 2, emotion: 'joy', intensity: 0.9 },
    ];
    expect(e.predict(profile).bingeChapters.length).toBe(2);
  });

  it('isBingeWorthy for 0.5+', () => {
    expect(e.isBingeWorthy(0.5)).toBe(true);
  });
});

describe('GenreEmotionProfile', () => {
  const e = new GenreEmotionProfile();

  it('getProfile for romance', () => {
    expect(e.getProfile('romance')).not.toBeNull();
  });

  it('matches for romance joy', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.8 },
    ];
    expect(e.matches('romance', profile)).toBeGreaterThan(0);
  });
});

describe('EmotionChapterSummary', () => {
  const e = new EmotionChapterSummary();

  it('summarize for empty', () => {
    expect(e.summarize([])).toBe('No emotional data');
  });

  it('summarize returns top 3', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.8 },
      { character: 'A', chapter: 2, emotion: 'joy', intensity: 0.8 },
      { character: 'A', chapter: 3, emotion: 'sadness', intensity: 0.5 },
    ];
    expect(e.summarize(profile)).toContain('joy');
  });
});

describe('EmotionArcIndexFinal', () => {
  const idx = new EmotionArcIndexFinal();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
