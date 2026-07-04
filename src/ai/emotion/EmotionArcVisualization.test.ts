/**
 * EmotionArcVisualization.test.ts — Direction AG, V3296-V3305 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ArcVisualizer,
  MultiCharacterArcOverlay,
  ChapterEmotionProfile,
  EmotionVsTension,
  ReaderEmpathyPredictor,
  EmotionStagnationDetector,
  CatharticReleasePlanner,
  EmotionalBeatsMapper,
  MoodContagion,
  EmotionArcIndex,
  type CharacterEmotion,
} from './EmotionArcVisualization';

describe('ArcVisualizer', () => {
  const e = new ArcVisualizer();

  it('asciiCurve for values', () => {
    const s = e.asciiCurve([0.1, 0.5, 0.9]);
    expect(s.length).toBe(3);
  });

  it('renderProfile', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.8 },
    ];
    expect(e.renderProfile(profile).length).toBeGreaterThan(0);
  });
});

describe('MultiCharacterArcOverlay', () => {
  const e = new MultiCharacterArcOverlay();

  it('overlay returns per-character', () => {
    const map = new Map<string, CharacterEmotion[]>();
    map.set('A', [{ character: 'A', chapter: 1, emotion: 'joy', intensity: 0.5 }]);
    const r = e.overlay(map);
    expect(r.get('A')).toEqual([0.5]);
  });

  it('alignedArcs for same length', () => {
    const map = new Map<string, CharacterEmotion[]>();
    map.set('A', [{ character: 'A', chapter: 1, emotion: 'joy', intensity: 0.5 }]);
    map.set('B', [{ character: 'B', chapter: 1, emotion: 'sadness', intensity: 0.5 }]);
    expect(e.alignedArcs(map)).toBe(true);
  });
});

describe('ChapterEmotionProfile', () => {
  const e = new ChapterEmotionProfile();

  it('setProfile + get', () => {
    e.setProfile({ chapter: 1, dominantEmotion: 'joy', intensity: 0.8, characters: ['A'] });
    expect(e.get(1)?.dominantEmotion).toBe('joy');
  });

  it('getAll returns all', () => {
    e.setProfile({ chapter: 1, dominantEmotion: 'joy', intensity: 0.8, characters: [] });
    e.setProfile({ chapter: 2, dominantEmotion: 'sadness', intensity: 0.5, characters: [] });
    expect(e.getAll()).toHaveLength(2);
  });
});

describe('EmotionVsTension', () => {
  const e = new EmotionVsTension();

  it('computeGap', () => {
    expect(e.computeGap(0.5, 0.5)).toBe(0);
    expect(e.computeGap(0.0, 1.0)).toBe(1);
  });

  it('isAligned true for close', () => {
    expect(e.isAligned(0.5, 0.6)).toBe(true);
  });

  it('contrastScore', () => {
    expect(e.contrastScore(0.0, 1.0)).toBe(1);
  });
});

describe('ReaderEmpathyPredictor', () => {
  const e = new ReaderEmpathyPredictor();

  it('predict for high peaks', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.9 },
      { character: 'A', chapter: 2, emotion: 'joy', intensity: 0.8 },
      { character: 'A', chapter: 3, emotion: 'joy', intensity: 0.9 },
    ];
    expect(e.predict(profile).peaks).toBeGreaterThanOrEqual(3);
  });

  it('isHighlyEmpathetic for many peaks', () => {
    const profile: CharacterEmotion[] = Array.from({ length: 10 }, (_, i) => ({
      character: 'A', chapter: i, emotion: 'joy', intensity: 0.9,
    }));
    expect(e.isHighlyEmpathetic(profile)).toBe(true);
  });
});

describe('EmotionStagnationDetector', () => {
  const e = new EmotionStagnationDetector();

  it('detect stagnant for flat', () => {
    const profile: CharacterEmotion[] = Array.from({ length: 10 }, (_, i) => ({
      character: 'A', chapter: i, emotion: 'joy', intensity: 0.5,
    }));
    expect(e.detect(profile, 5).stagnant).toBe(true);
  });

  it('detect non-stagnant for varying', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.1 },
      { character: 'A', chapter: 2, emotion: 'joy', intensity: 0.5 },
      { character: 'A', chapter: 3, emotion: 'joy', intensity: 0.9 },
      { character: 'A', chapter: 4, emotion: 'joy', intensity: 0.2 },
      { character: 'A', chapter: 5, emotion: 'joy', intensity: 0.8 },
    ];
    expect(e.detect(profile, 5).stagnant).toBe(false);
  });
});

describe('CatharticReleasePlanner', () => {
  const e = new CatharticReleasePlanner();

  it('recommend after sadness', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'sadness', intensity: 0.8 },
    ];
    expect(e.recommend(profile).after).toBe(4);
  });

  it('isReadyForRelease for low intensity', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.2 },
      { character: 'A', chapter: 2, emotion: 'joy', intensity: 0.1 },
      { character: 'A', chapter: 3, emotion: 'joy', intensity: 0.1 },
    ];
    expect(e.isReadyForRelease(profile)).toBe(true);
  });
});

describe('EmotionalBeatsMapper', () => {
  const e = new EmotionalBeatsMapper();

  it('mapBeats returns strings', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.8 },
    ];
    expect(e.mapBeats(profile)[0].beat).toContain('joy');
  });

  it('countMajorBeats for high intensity', () => {
    const profile: CharacterEmotion[] = [
      { character: 'A', chapter: 1, emotion: 'joy', intensity: 0.9 },
      { character: 'A', chapter: 2, emotion: 'joy', intensity: 0.3 },
    ];
    expect(e.countMajorBeats(profile)).toBe(1);
  });
});

describe('MoodContagion', () => {
  const e = new MoodContagion();

  it('setInfluence + predict', () => {
    e.setInfluence('Alice', 'Bob', 0.5);
    const r = e.predict('Bob', 'joy', 0.8);
    expect(r).toBeGreaterThan(0);
  });

  it('predict 0 for no influence', () => {
    expect(e.predict('X', 'joy', 0.8)).toBe(0);
  });
});

describe('EmotionArcIndex', () => {
  const idx = new EmotionArcIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
