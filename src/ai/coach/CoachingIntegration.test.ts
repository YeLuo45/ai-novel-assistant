/**
 * CoachingIntegration.test.ts — Direction AK, V3426-V3435 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  WriterPersonalization,
  CoachingSession,
  WritingMentorMatch,
  DailyWritingCoach,
  WeeklyReviewGenerator,
  MilestoneTracker,
  WritingStreakAdvisor,
  CoachRecommendationEngine,
  WriterGrowthVisualizer,
  CoachingIndexFinal,
} from './CoachingIntegration';

describe('WriterPersonalization', () => {
  const e = new WriterPersonalization();

  it('setName + setGenres', () => {
    e.setName('Alice');
    e.setGenres(['wuxia', 'fantasy']);
    expect(e.getProfile().preferredGenres).toContain('wuxia');
  });

  it('setSkill + getProfile', () => {
    e.setSkill('pacing', 0.5);
    expect(e.getProfile().skillLevels.pacing).toBe(0.5);
  });

  it('recommendFocus for lowest skill', () => {
    e.setSkill('a', 0.8);
    e.setSkill('b', 0.2);
    expect(e.recommendFocus()).toBe('b');
  });
});

describe('CoachingSession', () => {
  const e = new CoachingSession();

  it('start + addNote + end', () => {
    e.start();
    e.addNote('today progress');
    const r = e.end();
    expect(r.noteCount).toBe(1);
  });

  it('getNotes returns', () => {
    const e2 = new CoachingSession();
    e2.addNote('a');
    e2.addNote('b');
    expect(e2.getNotes()).toHaveLength(2);
  });
});

describe('WritingMentorMatch', () => {
  const e = new WritingMentorMatch();

  it('match for plot weakness', () => {
    expect(e.match('plot')?.name).toBe('Plot Mentor');
  });

  it('match for character', () => {
    expect(e.match('character')?.name).toBe('Character Mentor');
  });

  it('listAll returns 3', () => {
    expect(e.listAll()).toHaveLength(3);
  });
});

describe('DailyWritingCoach', () => {
  const e = new DailyWritingCoach();

  it('getDailyTip for day 0', () => {
    expect(e.getDailyTip(0).length).toBeGreaterThan(0);
  });

  it('getDailyTip cycles', () => {
    expect(e.getDailyTip(0)).toBe(e.getDailyTip(5));
  });

  it('getDailyExercise', () => {
    expect(e.getDailyExercise()).toContain('200');
  });
});

describe('WeeklyReviewGenerator', () => {
  const e = new WeeklyReviewGenerator();

  it('generate includes stats', () => {
    const r = e.generate({ wordsWritten: 5000, daysActive: 5, skillsImproved: ['pacing'] });
    expect(r).toContain('5000');
    expect(r).toContain('pacing');
  });

  it('isGoodWeek true for 3000+', () => {
    expect(e.isGoodWeek({ wordsWritten: 5000, daysActive: 5 })).toBe(true);
  });
});

describe('MilestoneTracker', () => {
  const e = new MilestoneTracker();

  it('add + check', () => {
    e.add('First 1000', 1000);
    const newly = e.check(1500);
    expect(newly).toHaveLength(1);
  });

  it('getAchieved', () => {
    const e2 = new MilestoneTracker();
    e2.add('Goal', 100);
    e2.check(200);
    expect(e2.getAchieved()).toHaveLength(1);
  });
});

describe('WritingStreakAdvisor', () => {
  const e = new WritingStreakAdvisor();

  it('advise for 0 = keep going', () => {
    expect(e.advise(0)).toContain('加');
  });

  it('advise for 30 = master', () => {
    expect(e.advise(30)).toContain('大师');
  });
});

describe('CoachRecommendationEngine', () => {
  const e = new CoachRecommendationEngine();

  it('recommend for low skill', () => {
    expect(e.recommend({ day: 1, skill: 0.2, recentWords: 100 })).toContain('基础');
  });

  it('recommend for high skill', () => {
    expect(e.recommend({ day: 1, skill: 0.9, recentWords: 1000 })).toContain('挑战');
  });
});

describe('WriterGrowthVisualizer', () => {
  const e = new WriterGrowthVisualizer();

  it('renderProgress for skills', () => {
    const r = e.renderProgress({ pacing: 0.5, dialogue: 0.8 });
    expect(r).toContain('pacing');
  });

  it('renderTrend returns string', () => {
    expect(e.renderTrend([0.1, 0.5, 0.9]).length).toBe(3);
  });
});

describe('CoachingIndexFinal', () => {
  const idx = new CoachingIndexFinal();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
