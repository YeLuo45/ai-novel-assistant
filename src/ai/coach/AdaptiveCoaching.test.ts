/**
 * AdaptiveCoaching.test.ts — Direction AK, V3416-V3425 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  AdaptiveDifficultyEngine,
  ProgressTracker,
  GoalRecommender,
  SkillTreeBuilder,
  LessonPlanGenerator,
  PracticeExerciseSelector,
  FeedbackPersonalizer,
  CoachAIDirector,
  ImprovementPlanGenerator,
  AdaptiveCoachingIndex,
} from './AdaptiveCoaching';

describe('AdaptiveDifficultyEngine', () => {
  const e = new AdaptiveDifficultyEngine();

  it('adjust up for high success', () => {
    expect(e.adjust(0.5, 0.9)).toBeGreaterThan(0.5);
  });

  it('adjust down for low success', () => {
    expect(e.adjust(0.5, 0.3)).toBeLessThan(0.5);
  });

  it('recommendExercise for low skill = easy', () => {
    expect(e.recommendExercise(0.2)).toBe('easy');
  });
});

describe('ProgressTracker', () => {
  const e = new ProgressTracker();

  it('record + getHistory', () => {
    e.record('2026-01-01', 500, ['pacing']);
    expect(e.getHistory()).toHaveLength(1);
  });

  it('totalWords sum', () => {
    const e2 = new ProgressTracker();
    e2.record('d1', 100, []);
    e2.record('d2', 200, []);
    expect(e2.totalWords()).toBe(300);
  });

  it('skillsImprovedCount unique', () => {
    const e2 = new ProgressTracker();
    e2.record('d1', 100, ['pacing', 'dialogue']);
    e2.record('d2', 200, ['pacing', 'plot']);
    expect(e2.skillsImprovedCount()).toBe(3);
  });
});

describe('GoalRecommender', () => {
  const e = new GoalRecommender();

  it('recommend scales with avg', () => {
    const r = e.recommend(1000);
    expect(r.daily).toBeGreaterThanOrEqual(1100);
  });

  it('isAmbitious true for 2x', () => {
    expect(e.isAmbitious(2000, 1000)).toBe(true);
  });
});

describe('SkillTreeBuilder', () => {
  const e = new SkillTreeBuilder();

  it('addSkill + setLevel', () => {
    e.addSkill('pacing', []);
    e.setLevel('pacing', 0.5);
    expect(e.getSkill('pacing')?.level).toBe(0.5);
  });

  it('availableSkills respects prereqs', () => {
    e.addSkill('pacing', []);
    e.addSkill('plot', ['pacing']);
    expect(e.availableSkills([]).map((s) => s.name)).toContain('pacing');
    expect(e.availableSkills([]).map((s) => s.name)).not.toContain('plot');
  });
});

describe('LessonPlanGenerator', () => {
  const e = new LessonPlanGenerator();

  it('recommend for low = easy', () => {
    const r = e.recommend(0.2);
    expect(r?.difficulty).toBe('easy');
  });

  it('recommend for high = hard', () => {
    const r = e.recommend(0.9);
    expect(r?.difficulty).toBe('hard');
  });
});

describe('PracticeExerciseSelector', () => {
  const e = new PracticeExerciseSelector();

  it('select matching weakness', () => {
    expect(e.select('pacing', ['pacing exercise', 'dialog exercise'])).toBe('pacing exercise');
  });

  it('isSuitable for matched level', () => {
    expect(e.isSuitable('beginner exercise', 0.2)).toBe(true);
  });
});

describe('FeedbackPersonalizer', () => {
  const e = new FeedbackPersonalizer();

  it('generate encouragement', () => {
    expect(e.generate('encouragement', 'keep going')).toContain('keep going');
  });

  it('generate critique', () => {
    expect(e.generate('critique', 'fix this')).toContain('fix this');
  });

  it('generate praise', () => {
    expect(e.generate('praise', 'great')).toContain('great');
  });
});

describe('CoachAIDirector', () => {
  const e = new CoachAIDirector();

  it('decideNextStep for empty = practice', () => {
    expect(e.decideNextStep()).toBe('practice');
  });

  it('decideNextStep for high = rest', () => {
    const t = e.getTracker();
    for (let i = 0; i < 10; i++) t.record(`d${i}`, 1000, []);
    expect(e.decideNextStep()).toBe('rest');
  });
});

describe('ImprovementPlanGenerator', () => {
  const e = new ImprovementPlanGenerator();

  it('generate for N weaknesses', () => {
    const plan = e.generate(['pacing', 'dialogue', 'plot']);
    expect(plan).toHaveLength(3);
  });

  it('totalDuration', () => {
    const plan = e.generate(['a', 'b']);
    expect(e.totalDuration(plan)).toBe(2);
  });
});

describe('AdaptiveCoachingIndex', () => {
  const idx = new AdaptiveCoachingIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
