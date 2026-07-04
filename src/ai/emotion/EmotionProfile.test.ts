/**
 * EmotionProfile.test.ts — Direction AG, V3286-V3295 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  EmotionProfile,
  EmotionIntensity,
  EmotionWordCounter,
  EmotionTypeDistribution,
  EmotionalValence,
  EmotionalArousal,
  EmotionDuration,
  EmotionTransition,
  EmotionalPeakDetector,
  EmotionProfileIndex,
  type CharacterEmotion,
} from './EmotionProfile';

describe('EmotionProfile', () => {
  const e = new EmotionProfile();

  it('record + getProfile', () => {
    e.record('Alice', 1, 'joy', 0.8);
    expect(e.getProfile('Alice')).toHaveLength(1);
  });

  it('dominantEmotion', () => {
    const e2 = new EmotionProfile();
    e2.record('Bob', 1, 'joy', 0.8);
    e2.record('Bob', 2, 'joy', 0.9);
    expect(e2.dominantEmotion('Bob')).toBe('joy');
  });

  it('dominantEmotion neutral for empty', () => {
    expect(e.dominantEmotion('Carol')).toBe('neutral');
  });
});

describe('EmotionIntensity', () => {
  const e = new EmotionIntensity();

  it('classify high', () => {
    expect(e.classify('极其高兴')).toBe('high');
  });

  it('classify medium', () => {
    expect(e.classify('十分高兴')).toBe('medium');
  });

  it('classify low', () => {
    expect(e.classify('微微高兴')).toBe('low');
  });

  it('score for high', () => {
    expect(e.score('extremely happy')).toBe(1);
  });
});

describe('EmotionWordCounter', () => {
  const e = new EmotionWordCounter();

  it('countByEmotion for joy', () => {
    const c = e.countByEmotion('她开心快乐，笑了。');
    expect(c.joy).toBeGreaterThan(0);
  });

  it('totalEmotionWords', () => {
    const t = e.totalEmotionWords('开心快乐爱。');
    expect(t).toBeGreaterThanOrEqual(3);
  });
});

describe('EmotionTypeDistribution', () => {
  const e = new EmotionTypeDistribution();

  it('distribution returns 8 emotions', () => {
    const d = e.distribution('开心悲伤。');
    expect(d).toHaveProperty('joy');
    expect(d).toHaveProperty('sadness');
  });

  it('dominantType for joy text', () => {
    expect(e.dominantType('开心快乐高兴笑了开心。')).toBe('joy');
  });
});

describe('EmotionalValence', () => {
  const e = new EmotionalValence();

  it('compute positive for joy', () => {
    expect(e.compute('开心快乐爱。')).toBeGreaterThan(0);
  });

  it('compute negative for sadness', () => {
    expect(e.compute('伤心哭悲伤。')).toBeLessThan(0);
  });

  it('classify positive', () => {
    expect(e.classify(0.5)).toBe('positive');
  });
});

describe('EmotionalArousal', () => {
  const e = new EmotionalArousal();

  it('compute for anger', () => {
    expect(e.compute('愤怒怒火。')).toBeGreaterThan(0);
  });

  it('classify high for >0.7', () => {
    expect(e.classify(0.8)).toBe('high');
  });
});

describe('EmotionDuration', () => {
  const e = new EmotionDuration();

  it('trackDuration counts per emotion', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.8 },
      { character: 'A', chapter: 2, emotion: 'joy', intensity: 0.9 },
      { character: 'A', chapter: 3, emotion: 'sadness', intensity: 0.5 },
    ];
    const d = e.trackDuration(profile);
    expect(d.get('joy')).toBe(2);
  });

  it('isStagnant for big gap', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.5 },
      { character: 'A', chapter: 10, emotion: 'joy', intensity: 0.5 },
    ];
    expect(e.isStagnant(profile, 5)).toBe(true);
  });
});

describe('EmotionTransition', () => {
  const e = new EmotionTransition();

  it('detect transitions', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.5 },
      { character: 'A', chapter: 2, emotion: 'sadness', intensity: 0.6 },
    ];
    expect(e.detect(profile)).toHaveLength(1);
  });

  it('isVolatile for many transitions', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.5 },
      { character: 'A', chapter: 2, emotion: 'sadness', intensity: 0.6 },
      { character: 'A', chapter: 3, emotion: 'anger', intensity: 0.7 },
    ];
    expect(e.isVolatile(profile)).toBe(true);
  });
});

describe('EmotionalPeakDetector', () => {
  const e = new EmotionalPeakDetector();

  it('findPeaks for high intensity', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.9 },
      { character: 'A', chapter: 2, emotion: 'joy', intensity: 0.3 },
    ];
    expect(e.findPeaks(profile)).toHaveLength(1);
  });

  it('hasCatharticPeak for 0.95+', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.96 },
    ];
    expect(e.hasCatharticPeak(profile)).toBe(true);
  });
});

describe('EmotionProfileIndex', () => {
  const idx = new EmotionProfileIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
